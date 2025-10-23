/**
 * DineApp OS - Finite State Machine (FSM) Core Module
 *
 * Provides deterministic state coordination for all subsystems.
 * Integrates with EventBus for observability and debugging.
 */

// Core FSM implementation
export { FSM, createFSM, isValidState, isValidEvent } from './fsm';

// FSM registry for managing multiple FSM instances
export { fsmRegistry, registerFSM, unregisterFSM, getFSM } from './registry';

// Window Lifecycle FSM
export {
  createWindowFSM,
  WindowFSMManager,
  windowFSMManager,
  createWindow,
  getWindow,
  destroyWindow
} from './window-fsm';

// Plugin Lifecycle FSM
export {
  createPluginFSM,
  PluginFSMManager,
  pluginFSMManager,
  createPlugin,
  getPlugin,
  destroyPlugin
} from './plugin-fsm';

// SolidJS composables for reactive FSM integration
export {
  useFSMState,
  createFSMSignal,
  createFSMMetricsSignal,
  useFSM,
  useWindowFSM,
  usePluginFSM,
  useFSMRegistry,
  useFSMInspector
} from './composables';

// Developer tools and diagnostics
export {
  FSMInspector,
  FSMProfiler,
  FSMDevUtils,
  fsmInspector,
  fsmProfiler
} from './devtools';

// Types and interfaces
export type {
  // Core types
  FSMState,
  FSMEvent,
  FSMTransition,
  FSMConfig,
  FSMTransitionEvent,
  FSMErrorEvent,
  FSMCreatedEvent,
  FSMResetEvent,
  FSMInspection,
  FSMRegistry,

  // Predefined state types
  WindowLifecycleStates,
  WindowLifecycleEvents,
  PluginLifecycleStates,
  PluginLifecycleEvents,
  NetworkStates,
  NetworkEvents,
  StorageStates,
  StorageEvents,
  AuthStates,
  AuthEvents,
  UsageStates,
  UsageEvents,
  AnimationStates,
  AnimationEvents,

  // Diagnostics types
  FSMPerformanceMetrics,
  FSMDiagnostics,

  // Manager types
  WindowContext,
  PluginContext
} from './types';

// Re-export for backward compatibility
export type { FSM as default } from './fsm';