import { Component, For, Show } from 'solid-js';

interface SidebarItem {
  name: string;
  icon: string;
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
        { name: 'Recents', icon: '⏱️', path: '/recents', active: true },
        { name: 'Applications', icon: '🚀', path: '/applications' },
        { name: 'Desktop', icon: '🖥️', path: '/desktop' },
        { name: 'Documents', icon: '📄', path: '/documents' },
        { name: 'Downloads', icon: '📥', path: '/downloads' },
      ],
    },
    {
      title: 'iCloud',
      items: [
        { name: 'iCloud Drive', icon: '☁️', path: '/icloud-drive' },
      ],
    },
    {
      title: 'Locations',
      items: [
        { name: 'Macintosh HD', icon: '💾', path: '/' },
        { name: 'Network', icon: '🌐', path: '/network' },
      ],
    },
    {
      title: 'Tags',
      items: [
        { name: 'Red', icon: '🔴', path: '/tags/red' },
        { name: 'Orange', icon: '🟠', path: '/tags/orange' },
        { name: 'Yellow', icon: '🟡', path: '/tags/yellow' },
        { name: 'Green', icon: '🟢', path: '/tags/green' },
        { name: 'Blue', icon: '🔵', path: '/tags/blue' },
        { name: 'Purple', icon: '🟣', path: '/tags/purple' },
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
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
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
                      <span class="text-base">{item.icon}</span>
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
