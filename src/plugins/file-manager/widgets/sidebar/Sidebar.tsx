import { Component, For, Show } from 'solid-js';

// Import icons using unplugin-icons (Heroicons for macOS-style)
import IconXMark from '~icons/heroicons-outline/x-mark';
import IconClock from '~icons/heroicons-outline/clock';
import IconSquares2X2 from '~icons/heroicons-outline/squares-2x2';
import IconComputerDesktop from '~icons/heroicons-outline/computer-desktop';
import IconDocumentText from '~icons/heroicons-outline/document-text';
import IconArrowDownTray from '~icons/heroicons-outline/arrow-down-tray';
import IconCloud from '~icons/heroicons-outline/cloud';
import IconServer from '~icons/heroicons-outline/server';
import IconGlobeAlt from '~icons/heroicons-outline/globe-alt';

interface SidebarItem {
  name: string;
  icon: any; // JSX element or string
  path: string;
  active?: boolean;
}

interface SidebarSection {
  title: string;
  items: SidebarItem[];
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: Component<SidebarProps> = (props) => {
  const sections: SidebarSection[] = [
    {
      title: 'Favorites',
      items: [
        { name: 'Recents', icon: <IconClock class="w-4 h-4" />, path: '/recents', active: true },
        { name: 'Applications', icon: <IconSquares2X2 class="w-4 h-4" />, path: '/applications' },
        { name: 'Desktop', icon: <IconComputerDesktop class="w-4 h-4" />, path: '/desktop' },
        { name: 'Documents', icon: <IconDocumentText class="w-4 h-4" />, path: '/documents' },
        { name: 'Downloads', icon: <IconArrowDownTray class="w-4 h-4" />, path: '/downloads' },
      ],
    },
    {
      title: 'iCloud',
      items: [
        { name: 'iCloud Drive', icon: <IconCloud class="w-4 h-4" />, path: '/icloud-drive' },
      ],
    },
    {
      title: 'Locations',
      items: [
        { name: 'Macintosh HD', icon: <IconServer class="w-4 h-4" />, path: '/' },
        { name: 'Network', icon: <IconGlobeAlt class="w-4 h-4" />, path: '/network' },
      ],
    },
    {
      title: 'Tags',
      items: [
        { name: 'Red', icon: <div class="w-4 h-4 rounded-full bg-red-500"></div>, path: '/tags/red' },
        { name: 'Orange', icon: <div class="w-4 h-4 rounded-full bg-orange-500"></div>, path: '/tags/orange' },
        { name: 'Yellow', icon: <div class="w-4 h-4 rounded-full bg-yellow-500"></div>, path: '/tags/yellow' },
        { name: 'Green', icon: <div class="w-4 h-4 rounded-full bg-green-500"></div>, path: '/tags/green' },
        { name: 'Blue', icon: <div class="w-4 h-4 rounded-full bg-blue-500"></div>, path: '/tags/blue' },
        { name: 'Purple', icon: <div class="w-4 h-4 rounded-full bg-purple-500"></div>, path: '/tags/purple' },
      ],
    },
  ];

  return (
    <div class={`
      absolute top-0 left-0 h-full z-30
      w-56 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700/60
      p-3 flex flex-col gap-4 overflow-y-auto 
      transition-transform duration-300 ease-in-out
      md:relative md:translate-x-0
      ${props.isOpen ? 'translate-x-0' : '-translate-x-full'}
    `}>
      <div class="flex justify-between items-center md:hidden">
        <h2 class="text-lg font-semibold">File Manager</h2>
        <button onClick={props.onClose} class="p-1.5 rounded-md hover:bg-gray-200/70 dark:hover:bg-gray-700/70">
          <IconXMark class="w-5 h-5" />
        </button>
      </div>
      <For each={sections}>{(section) => (
          <div>
            <h3 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase px-2 mb-1">
              {section.title}
            </h3>
            <ul class="flex flex-col gap-0.5">
              <For each={section.items}>{(item) => (
                  <li>
                    <a
                      href="#"
                      class={`flex items-center gap-2.5 px-2 py-1.5 text-sm font-medium rounded-md transition-colors ${
                        item.active
                          ? 'bg-blue-500 text-white'
                          : 'text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                      onClick={() => {
                        console.log(`Navigate to ${item.path}`);
                        props.onClose(); // Close sidebar on navigation
                      }}
                    >
                      <span class="text-base flex items-center justify-center">{item.icon}</span>
                      <span>{item.name}</span>
                    </a>
                  </li>
                )}
              </For>
            </ul>
          </div>
        )}
      </For>
    </div>
  );
};

export default Sidebar;
