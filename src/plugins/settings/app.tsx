import { Component, createSignal, Show } from 'solid-js';
import AppearancePage from './pages/appearance';

const SettingsApp: Component = () => {
  const [activeSection, setActiveSection] = createSignal<'appearance' | 'business' | 'system'>('appearance');

  const sections = [
    { id: 'appearance', label: 'Appearance', icon: '🎨' },
    { id: 'business', label: 'Business', icon: '🏢' },
    { id: 'system', label: 'System', icon: '⚙️' }
  ];

  return (
    <div class="h-full flex bg-bg-primary text-text-primary">
      {/* Sidebar */}
      <div class="w-60 bg-bg-secondary/80 backdrop-blur-xl border-r border-border-primary flex-shrink-0">
        <div class="h-full flex flex-col">
            <div class="h-14 flex-shrink-0"></div> {/* Spacer for window controls */}
            <div class="p-2">
                <input type="text" placeholder="Search" class="w-full px-2 py-1.5 text-sm rounded-md border border-border-secondary bg-bg-tertiary focus:outline-none focus:ring-1 focus:ring-accent" />
            </div>
            <nav class="flex-1 px-2 py-2 space-y-1">
            {sections.map((section) => (
                <button
                class={`w-full flex items-center px-3 py-2 text-left text-sm font-medium rounded-md transition-colors ${
                    activeSection() === section.id
                    ? 'bg-accent text-text-inverse shadow'
                    : 'hover:bg-bg-tertiary'
                }`}
                onClick={() => setActiveSection(section.id as any)}
                >
                <span class="mr-3 text-lg">{section.icon}</span>
                <span class="flex-1">{section.label}</span>
                </button>
            ))}
            </nav>
        </div>
      </div>

      {/* Content */}
      <div class="flex-1 flex flex-col overflow-y-auto">
        {/* Header */}
        <div class="h-14 flex-shrink-0 border-b border-border-primary flex items-center px-6">
            <Show when={activeSection() === 'appearance'}>
                <div>
                    <h2 class="text-xl font-semibold">Appearance</h2>
                    <p class="text-sm text-text-secondary">Customize the look and feel of the application.</p>
                </div>
            </Show>
            <Show when={activeSection() === 'business'}>
                <div>
                    <h2 class="text-xl font-semibold">Business</h2>
                    <p class="text-sm text-text-secondary">Manage your restaurant's information and settings.</p>
                </div>
            </Show>
            <Show when={activeSection() === 'system'}>
                <div>
                    <h2 class="text-xl font-semibold">System</h2>
                    <p class="text-sm text-text-secondary">Configure system-level preferences and behavior.</p>
                </div>
            </Show>
        </div>
        
        <div class="flex-1 bg-bg-tertiary">
            <Show when={activeSection() === 'appearance'}>
              <AppearancePage />
            </Show>

            <Show when={activeSection() === 'business'}>
              <div class="p-6">
                <div class="max-w-4xl mx-auto space-y-6">
                  <div class="bg-bg-primary p-6 rounded-lg border border-border-primary">
                    <h3 class="text-lg font-semibold mb-4">Restaurant Information</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label class="block text-sm font-medium mb-1">Restaurant Name</label>
                        <input type="text" value="DineApp Demo" class="w-full border rounded px-3 py-2 bg-bg-secondary border-border-secondary" />
                      </div>
                      <div>
                        <label class="block text-sm font-medium mb-1">Phone Number</label>
                        <input type="tel" value="(555) 123-4567" class="w-full border rounded px-3 py-2 bg-bg-secondary border-border-secondary" />
                      </div>
                      <div>
                        <label class="block text-sm font-medium mb-1">Email</label>
                        <input type="email" value="info@dineapp.com" class="w-full border rounded px-3 py-2 bg-bg-secondary border-border-secondary" />
                      </div>
                      <div>
                        <label class="block text-sm font-medium mb-1">Address</label>
                        <input type="text" value="123 Main St, City, State" class="w-full border rounded px-3 py-2 bg-bg-secondary border-border-secondary" />
                      </div>
                    </div>
                  </div>

                  <div class="bg-bg-primary p-6 rounded-lg border border-border-primary">
                    <h3 class="text-lg font-semibold mb-4">Business Settings</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label class="block text-sm font-medium mb-1">Tax Rate (%)</label>
                        <input type="number" value="8" step="0.1" class="w-full border rounded px-3 py-2 bg-bg-secondary border-border-secondary" />
                      </div>
                      <div>
                        <label class="block text-sm font-medium mb-1">Currency</label>
                        <select class="w-full border rounded px-3 py-2 bg-bg-secondary border-border-secondary">
                          <option value="USD" selected>USD ($)</option>
                          <option value="EUR">EUR (€)</option>
                          <option value="GBP">GBP (£)</option>
                        </select>
                      </div>
                      <div>
                        <label class="block text-sm font-medium mb-1">Timezone</label>
                        <select class="w-full border rounded px-3 py-2 bg-bg-secondary border-border-secondary">
                          <option value="America/New_York" selected>Eastern Time</option>
                          <option value="America/Chicago">Central Time</option>
                          <option value="America/Denver">Mountain Time</option>
                          <option value="America/Los_Angeles">Pacific Time</option>
                        </select>
                      </div>
                      <div>
                        <label class="block text-sm font-medium mb-1">Language</label>
                        <select class="w-full border rounded px-3 py-2 bg-bg-secondary border-border-secondary">
                          <option value="en" selected>English</option>
                          <option value="es">Spanish</option>
                          <option value="fr">French</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div class="flex gap-2">
                    <button class="bg-accent text-text-inverse px-6 py-2 rounded hover:bg-accent-hover">
                      Save Changes
                    </button>
                    <button class="bg-bg-secondary hover:bg-bg-tertiary px-6 py-2 rounded">
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </Show>

            <Show when={activeSection() === 'system'}>
              <div class="p-6">
                <div class="max-w-4xl mx-auto space-y-6">
                  <div class="bg-bg-primary p-6 rounded-lg border border-border-primary">
                    <h3 class="text-lg font-semibold mb-4">System Preferences</h3>
                    <div class="space-y-3">
                      <label class="flex items-center">
                        <input type="checkbox" checked class="mr-2 form-checkbox" />
                        <span class="text-sm">Auto-print orders to kitchen</span>
                      </label>
                      <label class="flex items-center">
                        <input type="checkbox" checked class="mr-2 form-checkbox" />
                        <span class="text-sm">Enable email notifications</span>
                      </label>
                      <label class="flex items-center">
                        <input type="checkbox" class="mr-2 form-checkbox" />
                        <span class="text-sm">Enable SMS notifications</span>
                      </label>
                      <label class="flex items-center">
                        <input type="checkbox" checked class="mr-2 form-checkbox" />
                        <span class="text-sm">Allow online ordering</span>
                      </label>
                    </div>
                  </div>

                  <div class="bg-bg-primary p-6 rounded-lg border border-border-primary">
                    <h3 class="text-lg font-semibold mb-4">Debug Mode</h3>
                    <label class="flex items-center">
                      <input type="checkbox" class="mr-2 form-checkbox" />
                      <span class="text-sm">Enable debug console</span>
                    </label>
                  </div>

                  <div class="flex gap-2">
                    <button class="bg-accent text-text-inverse px-6 py-2 rounded hover:bg-accent-hover">
                      Save Changes
                    </button>
                    <button class="bg-bg-secondary hover:bg-bg-tertiary px-6 py-2 rounded">
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </Show>
        </div>
      </div>
    </div>
  );
};

export default SettingsApp;