import { Component, For } from 'solid-js';

interface BreadcrumbProps {
  path: string;
  onPathChange: (path: string) => void;
}

const Breadcrumb: Component<BreadcrumbProps> = (props) => {
  const pathSegments = () => {
    const parts = props.path.split('/').filter(Boolean);
    const segments = parts.map((part, index) => {
      return {
        name: part,
        path: '/' + parts.slice(0, index + 1).join('/'),
      };
    });
    return [{ name: 'Macintosh HD', path: '/' }, ...segments];
  };

  return (
    <nav class="flex items-center text-sm font-medium text-gray-600 dark:text-gray-300">
      <For each={pathSegments()}>
        {(segment, index) => (
          <div class="flex items-center">
            <a
              href="#"
              onClick={() => props.onPathChange(segment.path)}
              class="px-2 py-1 rounded-md hover:bg-gray-200/70 dark:hover:bg-gray-700/70"
            >
              {segment.name}
            </a>
            <Show when={index() < pathSegments().length - 1}>
              <span class="text-gray-400 dark:text-gray-500">/</span>
            </Show>
          </div>
        )}
      </For>
    </nav>
  );
};

export default Breadcrumb;