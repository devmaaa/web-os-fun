import { Component } from 'solid-js';

export type WindowState = 'normal' | 'maximized' | 'minimized' | 'minimizing' | 'maximizing' | 'opening' | 'closing' | 'restoring';
export type SnapEdge = 'left' | 'right' | 'top' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export interface Window {
  id: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  state: WindowState;
  focused: boolean;
  pluginId: string;
  zIndex: number;
  selected: boolean;
  alwaysOnTop: boolean;
  opacity: number;
  isDragging: boolean;
  isResizing: boolean;
  isPreview: boolean;
  snapEdge?: SnapEdge;
  component?: Component; // Solid component reference
  props?: Record<string, any>; // Initial props
  createdAt: Date; // Timestamp
  previousState?: {
    x: number;
    y: number;
    width: number;
    height: number;
    state: WindowState;
  };
}

export interface WindowOptions {
  component?: Component;
  props?: Record<string, any>;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  alwaysOnTop?: boolean;
}

export interface WindowStore {
  state: Window;
  set: (updates: Partial<Window>) => void;
  update: (key: keyof Window, value: any) => void;
}

export interface WindowManager {
  get windows(): Window[];
  openWindow: (pluginId: string, title: string, options?: WindowOptions) => Window;
  closeWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  maximizeWindow: (id: string) => void;
  toggleMaximizeWindow: (id: string) => void;
  restoreWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  blurWindow: (id: string) => void;
  updateWindowPosition: (id: string, x: number, y: number) => void;
  updateWindowSize: (id: string, width: number, height: number) => void;
  snapWindow: (id: string, edge: SnapEdge) => void;
  selectWindow: (id: string, multi?: boolean) => void;
  deselectWindow: (id: string) => void;
  clearSelection: () => void;
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
  setAlwaysOnTop: (id: string, alwaysOnTop: boolean) => void;
  setWindowOpacity: (id: string, opacity: number) => void;
  startDrag: (id: string) => void;
  endDrag: (id: string) => void;
  startResize: (id: string) => void;
  endResize: (id: string) => void;
  setPreviewState: (id: string) => void;
  clearPreviewState: (id: string) => void;
  getSelectedWindows: () => Window[];
  getHighestZIndex: () => number;
  constrainToScreen: (id: string) => void;
  getMinimizedWindows: () => Window[];
  inspect: () => any;

  // FSM-specific methods
  getFSMState?: (id: string) => string | undefined;
  canExecuteOperation?: (id: string, operation: 'close' | 'minimize' | 'maximize' | 'restore' | 'focus') => boolean;
  getFSMStats?: () => any;
}