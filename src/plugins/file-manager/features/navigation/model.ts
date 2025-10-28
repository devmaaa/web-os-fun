import { createSignal } from 'solid-js';
import type { FileItem } from '../../entities/file';

export interface NavigationState {
  currentPath: string;
  pathHistory: string[];
  selectedItems: string[];
}

const [currentPath, setCurrentPath] = createSignal<string>('/');
const [pathHistory, setPathHistory] = createSignal<string[]>(['/']);
const [selectedItems, setSelectedItems] = createSignal<string[]>([]);

export const navigationModel = {
  currentPath,
  setCurrentPath,
  pathHistory,
  setPathHistory,
  selectedItems,
  setSelectedItems,

  navigateToPath: (path: string) => {
    const history = pathHistory();
    if (history[history.length - 1] !== path) {
      setPathHistory([...history, path]);
    }
    setCurrentPath(path);
    setSelectedItems([]);
  },

  goBack: () => {
    const history = pathHistory();
    if (history.length > 1) {
      const newHistory = history.slice(0, -1);
      setPathHistory(newHistory);
      setCurrentPath(newHistory[newHistory.length - 1]);
      setSelectedItems([]);
    }
  },

  selectItem: (path: string, multiSelect = false) => {
    if (multiSelect) {
      const selected = selectedItems();
      if (selected.includes(path)) {
        setSelectedItems(selected.filter(item => item !== path));
      } else {
        setSelectedItems([...selected, path]);
      }
    } else {
      setSelectedItems([path]);
    }
  },

  clearSelection: () => {
    setSelectedItems([]);
  }
};