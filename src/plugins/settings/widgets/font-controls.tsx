import { Component, createSignal, Show, For, createEffect } from 'solid-js';
import { FontAPI } from '@core/themes/font-manager';
import type { FontSizeScale } from '@core/themes/font-manager';

interface FontControlsProps {
  settings?: {
    fontSizeScale?: FontSizeScale;
    customFontFamily?: { primary?: string; secondary?: string; monospace?: string; };
    lineHeightScale?: number;
    letterSpacingScale?: number;
    wordSpacingScale?: number;
  };
  onSettingsChange: (settings: any) => void;
}

const FontControls: Component<FontControlsProps> = (props) => {
  const [fontSizeScale, setFontSizeScale] = createSignal<FontSizeScale>('base');
  const [customFontFamily, setCustomFontFamily] = createSignal<{ primary?: string; secondary?: string; }>({});

  createEffect(() => {
    setFontSizeScale(props.settings?.fontSizeScale || 'base');
    setCustomFontFamily(props.settings?.customFontFamily || {});
  });

  const fontSizes: { value: FontSizeScale; label: string }[] = [
    { value: 'xs', label: 'XS' }, { value: 'sm', label: 'S' },
    { value: 'base', label: 'M' }, { value: 'lg', label: 'L' },
    { value: 'xl', label: 'XL' }, { value: '2xl', label: 'XXL' }
  ];

  const suggestedFonts = [
    { value: 'system-ui, sans-serif', label: 'System UI' },
    { value: 'Inter, sans-serif', label: 'Inter' },
    { value: 'Roboto, sans-serif', label: 'Roboto' },
    { value: 'Georgia, serif', label: 'Georgia' },
    { value: 'monospace', label: 'Monospace' }
  ];

  const handleFontSizeChange = (scale: FontSizeScale) => {
    setFontSizeScale(scale);
    FontAPI.setFontSizeScale(scale);
    props.onSettingsChange({ fontSizeScale: scale });
  };

  const handleFontFamilyChange = (type: 'primary' | 'secondary', value: string) => {
    const newFonts = { ...customFontFamily(), [type]: value };
    setCustomFontFamily(newFonts);
    FontAPI.setCustomFontFamilies(newFonts);
    props.onSettingsChange({ customFontFamily: newFonts });
  };

  return (
    <div class="space-y-8">
      <div>
        <h3 class="text-lg font-semibold">Font Size</h3>
        <div class="mt-2 inline-flex space-x-1 rounded-lg bg-bg-secondary p-1">
          <For each={fontSizes}>
            {(size) => (
              <button
                class={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  fontSizeScale() === size.value ? 'bg-bg-primary text-accent shadow' : 'text-text-secondary hover:bg-bg-primary/50'
                }`}
                onClick={() => handleFontSizeChange(size.value)}
              >
                {size.label}
              </button>
            )}
          </For>
        </div>
      </div>

      <div>
        <h3 class="text-lg font-semibold">Font Families</h3>
        <div class="mt-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium mb-1">Primary Font</label>
            <select
              class="w-full border-border-primary rounded-md shadow-sm bg-bg-primary"
              value={customFontFamily().primary || ''}
              onChange={(e) => handleFontFamilyChange('primary', e.target.value)}
            >
              <For each={suggestedFonts}>{(font) => <option value={font.value}>{font.label}</option>}</For>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Secondary Font</label>
            <select
              class="w-full border-border-primary rounded-md shadow-sm bg-bg-primary"
              value={customFontFamily().secondary || ''}
              onChange={(e) => handleFontFamilyChange('secondary', e.target.value)}
            >
              <For each={suggestedFonts}>{(font) => <option value={font.value}>{font.label}</option>}</For>
            </select>
          </div>
        </div>
      </div>

      <div>
        <h3 class="text-lg font-semibold">Preview</h3>
        <div class="mt-2 p-4 border border-border-secondary rounded-lg bg-bg-primary space-y-2">
          <p style={{ 'font-family': customFontFamily().primary || 'system-ui' }}>
            Primary: The quick brown fox jumps over the lazy dog.
          </p>
          <p style={{ 'font-family': customFontFamily().secondary || 'system-ui' }}>
            Secondary: Pack my box with five dozen liquor jugs.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FontControls;