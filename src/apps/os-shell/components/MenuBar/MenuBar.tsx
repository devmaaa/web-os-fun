console.log('[MenuBar] Module loaded at ' + new Date().toLocaleTimeString());
import { Component, createSignal, For, Show, onMount } from 'solid-js';
import { ThemeAPI } from '@core/themes/theme-engine';
import { useSystemData } from '@composables/useSystemData';

// Import icons using unplugin-icons (Heroicons for macOS-style)
import IconWifi from '~icons/heroicons-outline/wifi';

// The keyframes for dropdownFadeIn should be added to tailwind.config.js
// keyframes: {
//   dropdownFadeIn: {
//     '0%': { opacity: '0', transform: 'translateY(-4px)' },
//     '100%': { opacity: '1', transform: 'translateY(0)' },
//   }
// },
// animation: {
//   dropdownFadeIn: 'dropdownFadeIn 0.1s ease-out',
// }

interface MenuItem {
  label?: string;
  action?: () => void;
  submenu?: MenuItem[];
  separator?: boolean;
}

interface MenuSection {
  label: string;
  items: MenuItem[];
}

const MenuBar: Component = () => {
  const [currentTime, setCurrentTime] = createSignal(new Date());
  const [activeMenu, setActiveMenu] = createSignal<string | null>(null);
  const { battery, batteryPercentage, isWifiLikely } = useSystemData();

  const toggleTheme = () => {
    const currentTheme = ThemeAPI.getCurrentTheme();
    const newThemeId = currentTheme?.isDark ? 'light' : 'dark';
    ThemeAPI.loadTheme(newThemeId);
  };

  onMount(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  });

  const menuSections: MenuSection[] = [
    {
      label: 'WebOS',
      items: [
        { label: 'About This WebOS', action: () => console.log('About') },
        { separator: true },
        { label: 'System Preferences...', action: () => console.log('Preferences') },
        { separator: true },
        { label: 'Sleep', action: () => console.log('Sleep') },
        { label: 'Restart...', action: () => console.log('Restart') },
        { label: 'Shut Down...', action: () => console.log('Shut Down') }
      ]
    },
    {
      label: 'File',
      items: [
        { label: 'New Window', action: () => console.log('New Window') },
        { label: 'New Folder', action: () => console.log('New Folder') },
        { separator: true },
        { label: 'Open', action: () => console.log('Open') },
        { label: 'Close', action: () => console.log('Close') }
      ]
    },
    {
      label: 'Edit',
      items: [
        { label: 'Undo', action: () => console.log('Undo') },
        { label: 'Redo', action: () => console.log('Redo') },
        { separator: true },
        { label: 'Cut', action: () => console.log('Cut') },
        { label: 'Copy', action: () => console.log('Copy') },
        { label: 'Paste', action: () => console.log('Paste') }
      ]
    },
    {
      label: 'View',
      items: [
        { label: 'Toggle Theme', action: () => toggleTheme() }
      ]
    },
  ];

  const formatTime = (date: Date) => date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: false });
  const formatDate = (date: Date) => date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });

  const handleMenuEnter = (sectionLabel: string) => {
    if (activeMenu() !== null) {
      setActiveMenu(sectionLabel);
    }
  };

  const handleMenuClick = (sectionLabel: string) => {
    setActiveMenu(activeMenu() === sectionLabel ? null : sectionLabel);
  };

  const handleMenuItemClick = (item: MenuItem) => {
    if (item.action) item.action();
    setActiveMenu(null);
  };

  return (
    <div
      class="fixed top-0 left-0 right-0 h-[26px] bg-bg-primary/70 backdrop-blur-xl flex items-center justify-between px-3 z-[1001] border-b border-black/10 dark:border-white/10 text-sm text-text-primary select-none"
      onMouseLeave={() => setActiveMenu(null)}
    >
      {/* Left side menus */}
      <div class="flex items-center h-full">
        <For each={menuSections}>
          {(section) => (
            <div class="relative h-full flex items-center">
              <button
                class={`px-2.5 h-full text-xs rounded-sm transition-colors duration-150 ${
                  activeMenu() === section.label ? 'bg-accent/80 text-text-inverse' : 'bg-transparent'
                }`}
                onMouseEnter={() => handleMenuEnter(section.label)}
                onClick={() => handleMenuClick(section.label)}
              >
                <span class={section.label === 'WebOS' ? 'font-semibold' : 'font-medium'}>
                  {section.label}
                </span>
              </button>
              <Show when={activeMenu() === section.label}>
                <div class="absolute top-full left-0 min-w-[220px] bg-bg-secondary/80 backdrop-blur-xl rounded-md shadow-2xl border border-black/10 dark:border-white/10 p-1 mt-1 animate-dropdownFadeIn">
                  <For each={section.items}>
                    {(item) => (
                      <div>
                        <Show when={item.separator}>
                          <div class="h-px bg-black/10 dark:bg-white/10 my-1"></div>
                        </Show>
                        <Show when={!item.separator}>
                          <div
                            class="flex items-center justify-between px-2 py-0.5 text-xs rounded-sm cursor-default hover:bg-accent hover:text-text-inverse"
                            onClick={() => handleMenuItemClick(item)}
                          >
                            <span>{item.label}</span>
                            <Show when={item.submenu}>
                              <span class="text-xs ml-4">›</span>
                            </Show>
                          </div>
                        </Show>
                      </div>
                    )}
                  </For>
                </div>
              </Show>
            </div>
          )}
        </For>
      </div>

      {/* Right side system controls */}
      <div class="flex items-center gap-3 h-full">
        {/* Battery */}
        <div class="flex items-center gap-1.5 px-2 h-full rounded-sm hover:bg-black/10 dark:hover:bg-white/10" title={`Battery: ${batteryPercentage()}% ${battery().charging ? '(Charging)' : ''}`}>
          <span class="text-xs font-medium">{batteryPercentage()}%</span>
          <div class="relative w-5 h-[10px] border border-text-primary/80 rounded-[2px] after:content-[''] after:absolute after:right-[-2px] after:top-[2px] after:w-0.5 after:h-[4px] after:bg-text-primary/80 after:rounded-r-sm">
            <div 
              class="absolute left-px top-px h-[6px] bg-text-primary/80 rounded-sm transition-width duration-300 ease-in-out" 
              style={{ width: `${(batteryPercentage() / 100) * 18}px` }}
            ></div>
          </div>
        </div>

        {/* WiFi */}
        <div class="px-2 h-full flex items-center rounded-sm hover:bg-black/10 dark:hover:bg-white/10" title="WiFi">
          <IconWifi class={`w-4 h-4 ${isWifiLikely() ? 'text-text-primary' : 'text-text-secondary'}`} />
        </div>

        {/* Date and Time */}
        <div class="flex items-center gap-1 px-2 h-full rounded-sm hover:bg-black/10 dark:hover:bg-white/10">
          <span class="text-xs font-medium">{formatDate(currentTime())}</span>
          <span class="text-xs font-medium">{formatTime(currentTime())}</span>
        </div>
      </div>
    </div>
  );
};

export default MenuBar;