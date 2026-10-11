import { CharacterData } from "../../types";

export interface SheetProps {
  data: CharacterData;
  onUpdateData: (updates: Partial<CharacterData>) => void;
  isEditable: boolean;
  paperStyle: 'parchment' | 'clean';
  activePage: 'all' | 'page1' | 'page2';
}
