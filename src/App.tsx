import { Component } from 'solid-js';
import OsShell from '@apps/os-shell/OsShell';
import './index.css';

/**
 * Root application component
 *
 * This is the minimal root component that renders the OS Shell.
 * According to the architecture spec, the OS Shell (apps/os-shell)
 * serves as the desktop environment and root application.
 */
const App: Component = () => {
  return <OsShell />;
};

export default App;