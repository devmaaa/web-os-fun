import { Component } from 'solid-js';

const AnalyticsUI: Component = () => {

  return (
    <div>
      <h2>Analytics Dashboard</h2>
      <p>Sales reports and metrics</p>
      <p style={{ 'font-size': '12px', color: '#666' }}>
        Collecting analytics from domain events across the system.
      </p>
    </div>
  );
};

// This file is not used - plugins are loaded from loadPlugins in index.ts