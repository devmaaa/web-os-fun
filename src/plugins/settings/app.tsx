import { Component, createSignal, Show } from 'solid-js';
import AppearancePage from './pages/appearance';

// Import icons using unplugin-icons (Heroicons for macOS-style)
import IconSwatch from '~icons/heroicons-outline/swatch';
import IconBuildingOffice from '~icons/heroicons-outline/building-office';
import IconCog from '~icons/heroicons-outline/cog';
import IconBars3 from '~icons/heroicons-outline/bars-3';
import IconXMark from '~icons/heroicons-outline/x-mark';

const SettingsApp: Component = () => {
  const [activeSection, setActiveSection] = createSignal<'appearance' | 'business' | 'system'>('appearance');
  const [isSidebarOpen, setIsSidebarOpen] = createSignal(false);

  const sections = [
    { id: 'appearance', label: 'Appearance', icon: IconSwatch },
    { id: 'business', label: 'Business', icon: IconBuildingOffice },
    { id: 'system', label: 'System', icon: IconCog }
  ] as const;

  const selectSection = (sectionId: 'appearance' | 'business' | 'system') => {
    setActiveSection(sectionId);
    // Close sidebar on selection in mobile view
    if (window.innerWidth < 768) { // Tailwind's 'md' breakpoint
      setIsSidebarOpen(false);
    }
  };

  return (
    <div class="h-full flex bg-background text-foreground relative overflow-hidden">
      {/* Sidebar */}
      <div
        class={`
          settings-sidebar absolute top-0 left-0 h-full z-30
          w-60 backdrop-blur-xl flex-shrink-0
          transition-transform duration-300 ease-in-out
          md:relative md:translate-x-0
          ${isSidebarOpen() ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div class="h-full flex flex-col">
            <div class="h-14 flex-shrink-0 flex items-center justify-between px-4">
              <span class="text-lg font-semibold">Settings</span>
               <button onClick={() => setIsSidebarOpen(false)} class="md:hidden text-foreground">
                 <IconXMark class="w-6 h-6" />
               </button>
            </div>
            <div class="p-2">
                <input type="text" placeholder="Search" class="settings-input w-full px-2 py-1.5 text-sm rounded-md focus:outline-none" />
            </div>
            <nav class="flex-1 px-2 py-2 space-y-1">
            {sections.map((section) => (
                <button
                class={`settings-nav-item w-full flex items-center px-3 py-2 text-left text-sm font-medium rounded-md ${
                    activeSection() === section.id ? 'active' : ''
                }`}
                onClick={() => selectSection(section.id as any)}
                >
                 <span class="mr-3 text-lg">{section.icon({ class: 'w-5 h-5' })}</span>
                <span class="flex-1">{section.label}</span>
                </button>
            ))}
            </nav>
        </div>
      </div>

      {/* Sidebar overlay for mobile */}
      <Show when={isSidebarOpen()}>
        <div class="fixed inset-0 bg-black/30 z-20 md:hidden" onClick={() => setIsSidebarOpen(false)}></div>
      </Show>

      {/* Content */}
      <div class="flex-1 flex flex-col overflow-y-auto">
        {/* Header */}
        <div class="settings-content h-14 flex-shrink-0 flex items-center px-6">
             <button class="md:hidden mr-4 text-foreground" onClick={() => setIsSidebarOpen(true)}>
               <IconBars3 class="w-6 h-6" />
             </button>
            <Show when={activeSection() === 'appearance'}>
                <div>
                    <h2 class="text-xl font-semibold">Appearance</h2>
                    <p class="text-sm text-muted-foreground">Customize the look and feel of the application.</p>
                </div>
            </Show>
            <Show when={activeSection() === 'business'}>
                <div>
                    <h2 class="text-xl font-semibold">Business</h2>
                    <p class="text-sm text-muted-foreground">Manage your restaurant's information and settings.</p>
                </div>
            </Show>
            <Show when={activeSection() === 'system'}>
                <div>
                    <h2 class="text-xl font-semibold">System</h2>
                    <p class="text-sm text-muted-foreground">Configure system-level preferences and behavior.</p>
                </div>
            </Show>
        </div>
        
        <div class="flex-1 bg-muted">
            <Show when={activeSection() === 'appearance'}>
              <AppearancePage />
            </Show>

            <Show when={activeSection() === 'business'}>
              <div class="p-4 md:p-6">
                <div class="max-w-4xl mx-auto space-y-6">
                  <div class="bg-background p-4 md:p-6 rounded-lg border border-border">
                    <h3 class="text-lg font-semibold mb-4">Restaurant Information</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label class="block text-sm font-medium mb-1">Restaurant Name</label>
                        <input type="text" value="DineApp Demo" class="w-full border rounded px-3 py-2 bg-secondary border-border" />
                      </div>
                      <div>
                        <label class="block text-sm font-medium mb-1">Phone Number</label>
                        <input type="tel" value="(555) 123-4567" class="w-full border rounded px-3 py-2 bg-secondary border-border" />
                      </div>
                      <div>
                        <label class="block text-sm font-medium mb-1">Email</label>
                        <input type="email" value="info@dineapp.com" class="w-full border rounded px-3 py-2 bg-secondary border-border" />
                      </div>
                      <div>
                        <label class="block text-sm font-medium mb-1">Address</label>
                        <input type="text" value="123 Main St, City, State" class="w-full border rounded px-3 py-2 bg-secondary border-border" />
                      </div>
                    </div>
                  </div>

                  <div class="bg-background p-4 md:p-6 rounded-lg border border-border">
                    <h3 class="text-lg font-semibold mb-4">Business Settings</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label class="block text-sm font-medium mb-1">Tax Rate (%)</label>
                        <input type="number" value="8" step="0.1" class="w-full border rounded px-3 py-2 bg-secondary border-border" />
                      </div>
                      <div>
                        <label class="block text-sm font-medium mb-1">Currency</label>
                        <select class="w-full border rounded px-3 py-2 bg-secondary border-border">
                          <option value="USD" selected>USD ($)</option>
                          <option value="EUR">EUR (€)</option>
                          <option value="GBP">GBP (£)</option>
                        </select>
                      </div>
                      <div>
                        <label class="block text-sm font-medium mb-1">Timezone</label>
                        <select class="w-full border rounded px-3 py-2 bg-secondary border-border">
                          <option value="America/New_York" selected>Eastern Time</option>
                          <option value="America/Chicago">Central Time</option>
                          <option value="America/Denver">Mountain Time</option>
                          <option value="America/Los_Angeles">Pacific Time</option>
                        </select>
                      </div>
                      <div>
                        <label class="block text-sm font-medium mb-1">Language</label>
                        <select class="w-full border rounded px-3 py-2 bg-secondary border-border">
                          <option value="en" selected>English</option>
                          <option value="es">Spanish</option>
                          <option value="fr">French</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div class="flex flex-col sm:flex-row gap-2">
                    <button class="bg-accent text-accent-foreground px-6 py-2 rounded hover:bg-accent/80 w-full sm:w-auto">
                      Save Changes
                    </button>
                    <button class="bg-secondary hover:bg-secondary/80 px-6 py-2 rounded w-full sm:w-auto">
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </Show>

            <Show when={activeSection() === 'system'}>
              <div class="p-4 md:p-6">
                <div class="max-w-4xl mx-auto space-y-6">
                  <div class="bg-bg-primary p-4 md:p-6 rounded-lg border border-border-primary">
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

                  <div class="bg-background p-4 md:p-6 rounded-lg border border-border">
                    <h3 class="text-lg font-semibold mb-4">Debug Mode</h3>
                    <label class="flex items-center">
                      <input type="checkbox" class="mr-2 form-checkbox" />
                      <span class="text-sm">Enable debug console</span>
                    </label>
                  </div>

                  <div class="flex flex-col sm:flex-row gap-2">
                    <button class="bg-accent text-accent-foreground px-6 py-2 rounded hover:bg-accent/80 w-full sm:w-auto">
                      Save Changes
                    </button>
                    <button class="bg-secondary hover:bg-secondary/80 px-6 py-2 rounded w-full sm:w-auto">
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