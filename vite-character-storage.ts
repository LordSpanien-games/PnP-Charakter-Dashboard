import fs from 'fs';
import path from 'path';
import type { Plugin, ViteDevServer } from 'vite';

export function characterStoragePlugin(): Plugin {
  const baseDir = path.resolve(process.cwd(), 'characters');

  // Ensure base directory and subdirectories exist
  const systemFolders = ['pathfinder', 'coc_7e', 'coc_1920', 'shadowrun', 'traveller', 'custom'];
  try {
    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir, { recursive: true });
    }
    systemFolders.forEach((sub) => {
      const subPath = path.join(baseDir, sub);
      if (!fs.existsSync(subPath)) {
        fs.mkdirSync(subPath, { recursive: true });
      }
    });
  } catch (err) {
    console.warn('[characterStoragePlugin] Could not initialize character folders:', err);
  }

  const sanitizeFilename = (name: string): string => {
    return (
      name
        .trim()
        .replace(/[/\\?%*:|"<>]/g, '') // remove illegal chars
        .replace(/\s+/g, '_') || 'Unbenannter_Charakter'
    );
  };

  const isPathSafe = (targetPath: string): boolean => {
    const resolved = path.resolve(baseDir, targetPath);
    return resolved.startsWith(baseDir);
  };

  return {
    name: 'vite-plugin-character-storage',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
        const pathname = url.pathname;

        if (!pathname.startsWith('/api/characters')) {
          return next();
        }

        res.setHeader('Content-Type', 'application/json; charset=utf-8');

        // Helper to parse JSON body
        const readBody = (): Promise<any> => {
          return new Promise((resolve, reject) => {
            let body = '';
            req.on('data', (chunk) => {
              body += chunk;
            });
            req.on('end', () => {
              if (!body) return resolve({});
              try {
                resolve(JSON.parse(body));
              } catch (e) {
                reject(e);
              }
            });
            req.on('error', reject);
          });
        };

        try {
          // 1. GET /api/characters -> List all characters in characters/
          if (pathname === '/api/characters' || pathname === '/api/characters/list') {
            if (req.method !== 'GET') {
              res.statusCode = 405;
              return res.end(JSON.stringify({ error: 'Method not allowed' }));
            }

            const characterList: any[] = [];

            const scanDir = (currentDir: string, relativePrefix: string = '') => {
              if (!fs.existsSync(currentDir)) return;
              const entries = fs.readdirSync(currentDir, { withFileTypes: true });

              for (const entry of entries) {
                const fullEntryPath = path.join(currentDir, entry.name);
                const relEntryPath = path.join(relativePrefix, entry.name).replace(/\\/g, '/');

                if (entry.isDirectory()) {
                  if (entry.name.startsWith('.')) continue; // Skip hidden folders like .history
                  scanDir(fullEntryPath, relEntryPath);
                } else if (entry.isFile() && entry.name.endsWith('.json')) {
                  try {
                    const stats = fs.statSync(fullEntryPath);
                    const raw = fs.readFileSync(fullEntryPath, 'utf8');
                    const parsed = JSON.parse(raw);

                    if (parsed && typeof parsed === 'object') {
                      const system = parsed.system || relativePrefix || 'custom';
                      const previewStats = Array.isArray(parsed.stats)
                        ? parsed.stats.slice(0, 3).map((s: any) => `${s.label}: ${s.value}`)
                        : [];

                      characterList.push({
                        id: relEntryPath,
                        name: parsed.name || entry.name.replace('.json', ''),
                        subTitle: parsed.subTitle || '',
                        system,
                        filename: entry.name,
                        relativePath: relEntryPath,
                        lastModified: stats.mtimeMs,
                        size: stats.size,
                        previewStats,
                      });
                    }
                  } catch (parseErr) {
                    console.warn(`[characterStoragePlugin] Skipping malformed file: ${fullEntryPath}`);
                  }
                }
              }
            };

            scanDir(baseDir);

            // Sort by most recently modified
            characterList.sort((a, b) => b.lastModified - a.lastModified);

            res.statusCode = 200;
            return res.end(
              JSON.stringify({
                success: true,
                baseDir: 'characters',
                characters: characterList,
              })
            );
          }

          // 2. GET /api/characters/load?path=... -> Load single character
          if (pathname === '/api/characters/load') {
            if (req.method !== 'GET') {
              res.statusCode = 405;
              return res.end(JSON.stringify({ error: 'Method not allowed' }));
            }

            const reqPath = url.searchParams.get('path');
            if (!reqPath || !isPathSafe(reqPath)) {
              res.statusCode = 400;
              return res.end(JSON.stringify({ error: 'Ungültiger Pfad' }));
            }

            const targetFile = path.resolve(baseDir, reqPath);
            if (!fs.existsSync(targetFile)) {
              res.statusCode = 404;
              return res.end(JSON.stringify({ error: 'Charakterdatei nicht gefunden' }));
            }

            const content = fs.readFileSync(targetFile, 'utf8');
            const character = JSON.parse(content);

            res.statusCode = 200;
            return res.end(JSON.stringify({ success: true, character, relativePath: reqPath }));
          }

          // 3. POST /api/characters/save -> Save character directly to characters/<system>/<name>.json
          if (pathname === '/api/characters/save') {
            if (req.method !== 'POST') {
              res.statusCode = 405;
              return res.end(JSON.stringify({ error: 'Method not allowed' }));
            }

            const body = await readBody();
            const { character, filename, subfolder } = body;

            if (!character || !character.name) {
              res.statusCode = 400;
              return res.end(JSON.stringify({ error: 'Fehlende Charakterdaten oder Name' }));
            }

            const targetSub = (subfolder || character.system || 'custom')
              .replace(/[/\\?%*:|"<>]/g, '')
              .toLowerCase();
            const safeName = sanitizeFilename(filename || character.name);
            const finalFilename = safeName.endsWith('.json') ? safeName : `${safeName}.json`;

            const targetDir = path.join(baseDir, targetSub);
            if (!fs.existsSync(targetDir)) {
              fs.mkdirSync(targetDir, { recursive: true });
            }

            const targetFilePath = path.join(targetDir, finalFilename);
            if (!isPathSafe(path.relative(baseDir, targetFilePath))) {
              res.statusCode = 400;
              return res.end(JSON.stringify({ error: 'Sicherheitsfehler: Ungültiger Pfad' }));
            }

            // --- Version History: Automatically archive previous version (up to 10 versions) ---
            const historyBaseName = safeName.replace(/\.json$/, '');
            const historyDir = path.join(baseDir, '.history', targetSub, historyBaseName);

            if (fs.existsSync(targetFilePath)) {
              try {
                if (!fs.existsSync(historyDir)) {
                  fs.mkdirSync(historyDir, { recursive: true });
                }
                const prevContent = fs.readFileSync(targetFilePath, 'utf8');
                const timestamp = Date.now();
                const versionFilename = `v_${timestamp}.json`;
                fs.writeFileSync(path.join(historyDir, versionFilename), prevContent, 'utf8');

                // Prune history to keep strictly the last 10 versions
                const historyFiles = fs.readdirSync(historyDir)
                  .filter((f) => f.startsWith('v_') && f.endsWith('.json'))
                  .sort((a, b) => b.localeCompare(a)); // newest first

                if (historyFiles.length > 10) {
                  const toDelete = historyFiles.slice(10);
                  for (const oldFile of toDelete) {
                    try {
                      fs.unlinkSync(path.join(historyDir, oldFile));
                    } catch (e) {}
                  }
                }
              } catch (histErr) {
                console.warn('[characterStoragePlugin] Failed to create history snapshot:', histErr);
              }
            }

            fs.writeFileSync(targetFilePath, JSON.stringify(character, null, 2), 'utf8');

            const relativePath = path.join(targetSub, finalFilename).replace(/\\/g, '/');
            console.log(`[characterStoragePlugin] Saved character to: characters/${relativePath}`);

            res.statusCode = 200;
            return res.end(
              JSON.stringify({
                success: true,
                relativePath,
                filename: finalFilename,
                fullLocalPath: `characters/${relativePath}`,
                message: `Charakter '${character.name}' erfolgreich gespeichert in characters/${relativePath}`,
              })
            );
          }

          // 4. GET /api/characters/history?path=... -> List up to 10 historical versions
          if (pathname === '/api/characters/history') {
            if (req.method !== 'GET') {
              res.statusCode = 405;
              return res.end(JSON.stringify({ error: 'Method not allowed' }));
            }

            const reqPath = url.searchParams.get('path');
            if (!reqPath || !isPathSafe(reqPath)) {
              res.statusCode = 400;
              return res.end(JSON.stringify({ error: 'Ungültiger Pfad' }));
            }

            const cleanPath = reqPath.replace(/\\/g, '/');
            const pathParts = cleanPath.split('/');
            const subfolder = pathParts.length > 1 ? pathParts[0] : 'custom';
            const filename = pathParts[pathParts.length - 1];
            const historyBaseName = filename.replace(/\.json$/, '');

            const historyDir = path.join(baseDir, '.history', subfolder, historyBaseName);
            const versions: any[] = [];

            if (fs.existsSync(historyDir)) {
              const files = fs
                .readdirSync(historyDir)
                .filter((f) => f.startsWith('v_') && f.endsWith('.json'))
                .sort((a, b) => b.localeCompare(a)) // newest first
                .slice(0, 10);

              for (const f of files) {
                try {
                  const filePath = path.join(historyDir, f);
                  const stat = fs.statSync(filePath);
                  const raw = fs.readFileSync(filePath, 'utf8');
                  const parsed = JSON.parse(raw);
                  const tsStr = f.replace(/^v_/, '').replace(/\.json$/, '');
                  const timestamp = parseInt(tsStr, 10) || stat.mtimeMs;

                  versions.push({
                    id: f,
                    filename: f,
                    versionPath: path.relative(baseDir, filePath).replace(/\\/g, '/'),
                    timestamp,
                    size: stat.size,
                    subTitle: parsed.subTitle || '',
                    characterName: parsed.name || historyBaseName,
                    statsPreview: Array.isArray(parsed.stats)
                      ? parsed.stats.slice(0, 3).map((s: any) => `${s.label}: ${s.value}`)
                      : [],
                    xp: parsed.experience?.current,
                    system: parsed.system || subfolder
                  });
                } catch (e) {
                  console.warn(`[characterStoragePlugin] Skipping corrupted history file: ${f}`);
                }
              }
            }

            res.statusCode = 200;
            return res.end(
              JSON.stringify({
                success: true,
                relativePath: reqPath,
                count: versions.length,
                maxVersions: 10,
                versions,
              })
            );
          }

          // 5. POST /api/characters/restore -> Restore a historical version to active character file
          if (pathname === '/api/characters/restore') {
            if (req.method !== 'POST') {
              res.statusCode = 405;
              return res.end(JSON.stringify({ error: 'Method not allowed' }));
            }

            const body = await readBody();
            const { relativePath, versionPath } = body;

            if (!relativePath || !versionPath || !isPathSafe(relativePath) || !isPathSafe(versionPath)) {
              res.statusCode = 400;
              return res.end(JSON.stringify({ error: 'Ungültige Pfade' }));
            }

            const versionFile = path.resolve(baseDir, versionPath);
            const targetFile = path.resolve(baseDir, relativePath);

            if (!fs.existsSync(versionFile)) {
              res.statusCode = 404;
              return res.end(JSON.stringify({ error: 'Historienversion nicht gefunden' }));
            }

            // Save current version to history before replacing
            if (fs.existsSync(targetFile)) {
              try {
                const currentContent = fs.readFileSync(targetFile, 'utf8');
                const historyDir = path.dirname(versionFile);
                const backupVersion = path.join(historyDir, `v_${Date.now()}.json`);
                fs.writeFileSync(backupVersion, currentContent, 'utf8');
              } catch (e) {}
            }

            const restoredContent = fs.readFileSync(versionFile, 'utf8');
            fs.writeFileSync(targetFile, restoredContent, 'utf8');
            const restoredCharacter = JSON.parse(restoredContent);

            console.log(`[characterStoragePlugin] Restored characters/${relativePath} from version ${versionPath}`);

            res.statusCode = 200;
            return res.end(
              JSON.stringify({
                success: true,
                message: `Version erfolgreich wiederhergestellt!`,
                character: restoredCharacter,
                relativePath,
              })
            );
          }

          // 6. DELETE /api/characters/delete -> Delete character file
          if (pathname === '/api/characters/delete') {
            if (req.method !== 'POST' && req.method !== 'DELETE') {
              res.statusCode = 405;
              return res.end(JSON.stringify({ error: 'Method not allowed' }));
            }

            const body = await readBody();
            const reqPath = body.path;

            if (!reqPath || !isPathSafe(reqPath)) {
              res.statusCode = 400;
              return res.end(JSON.stringify({ error: 'Ungültiger Pfad' }));
            }

            const targetFile = path.resolve(baseDir, reqPath);
            if (fs.existsSync(targetFile)) {
              fs.unlinkSync(targetFile);
              console.log(`[characterStoragePlugin] Deleted character file: characters/${reqPath}`);
            }

            res.statusCode = 200;
            return res.end(JSON.stringify({ success: true, message: 'Datei gelöscht' }));
          }

          res.statusCode = 404;
          return res.end(JSON.stringify({ error: 'Unbekannter API-Endpunkt' }));
        } catch (err: any) {
          console.error('[characterStoragePlugin] Error handling request:', err);
          res.statusCode = 500;
          return res.end(JSON.stringify({ error: err.message || 'Serverfehler beim Zugriff auf Charaktere' }));
        }
      });
    },
  };
}
