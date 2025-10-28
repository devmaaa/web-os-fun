import { Component, For } from 'solid-js';

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

const Sidebar: Component = () => {
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
    <div class="w-56 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700/60 p-3 flex flex-col gap-4 overflow-y-auto">
      <For each={sections}>
        {(section) => (
          <div>
            <h3 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase px-2 mb-1">
              {section.title}
            </h3>
            <ul class="flex flex-col gap-0.5">
              <For each={section.items}>
                {(item) => (
                  <li>
                    <a
                      href="#"
                      class={`flex items-center gap-2.5 px-2 py-1.5 text-sm font-medium rounded-md transition-colors ${
                        item.active
                          ? 'bg-blue-500 text-white'
                          : 'text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                      onClick={() => console.log(`Navigate to ${item.path}`)}
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
