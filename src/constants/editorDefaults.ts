import type {
  EditorNode,
  NodeBlueprint,
  NodesMap,
  NodeType,
  SeoMetadata,
  ThemePreset,
  ThemeVariable,
} from '../types/editor';

export const STORAGE_KEY = 'react_ui_editor_state_v2';
export const THEME_STORAGE_KEY = 'react_ui_editor_theme_v1';
export const SEO_STORAGE_KEY = 'react_ui_editor_seo_v1';
export const COMPONENT_HISTORY_STORAGE_KEY = 'react_ui_editor_comp_history_v1';
export const RECENT_SEARCHES_STORAGE_KEY = 'react_ui_editor_recent_searches_v1';

export const DEFAULT_SEO_METADATA: SeoMetadata = {
  title: '',
  description: '',
  canonicalUrl: '',
};

export const DEFAULT_THEME_VARS: ThemeVariable[] = [
  {
    id: 'theme-primary',
    name: '--color-primary',
    label: 'Primary',
    value: '#2563eb',
    category: 'color',
  },
  {
    id: 'theme-secondary',
    name: '--color-secondary',
    label: 'Secondary',
    value: '#0f172a',
    category: 'color',
  },
  {
    id: 'theme-surface',
    name: '--color-surface',
    label: 'Surface',
    value: '#f8fafc',
    category: 'color',
  },
  {
    id: 'theme-font-title',
    name: '--font-size-title',
    label: 'Title Size',
    value: '2.25rem',
    category: 'fontSize',
  },
  {
    id: 'theme-font-body',
    name: '--font-size-body',
    label: 'Body Size',
    value: '1rem',
    category: 'fontSize',
  },
];

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'studio-default',
    name: 'Studio Default',
    description: 'Klasyczny błękit i neutralna biel',
    variables: DEFAULT_THEME_VARS,
  },
  {
    id: 'material-design-3',
    name: 'Material Design 3',
    description: 'Baseline M3 Tonal Violet & Surface',
    variables: [
      {
        id: 'm3-primary',
        name: '--color-primary',
        label: 'M3 Primary',
        value: '#6750A4',
        category: 'color',
      },
      {
        id: 'm3-on-primary',
        name: '--color-on-primary',
        label: 'M3 On Primary',
        value: '#FFFFFF',
        category: 'color',
      },
      {
        id: 'm3-primary-container',
        name: '--color-primary-container',
        label: 'M3 Container',
        value: '#EADDFF',
        category: 'color',
      },
      {
        id: 'm3-secondary',
        name: '--color-secondary',
        label: 'M3 Secondary',
        value: '#625B71',
        category: 'color',
      },
      {
        id: 'm3-surface',
        name: '--color-surface',
        label: 'M3 Surface',
        value: '#FEF7FF',
        category: 'color',
      },
      {
        id: 'm3-on-surface',
        name: '--color-on-surface',
        label: 'M3 On Surface',
        value: '#1D1B20',
        category: 'color',
      },
      {
        id: 'm3-outline',
        name: '--color-outline',
        label: 'M3 Outline',
        value: '#79747E',
        category: 'color',
      },
      {
        id: 'm3-font-title',
        name: '--font-size-title',
        label: 'Headline Large',
        value: '2rem',
        category: 'fontSize',
      },
      {
        id: 'm3-font-body',
        name: '--font-size-body',
        label: 'Body Large',
        value: '1rem',
        category: 'fontSize',
      },
    ],
  },
  {
    id: 'minimal-slate',
    name: 'Minimal Slate',
    description: 'Monochromatyczny kontrast high-craft',
    variables: [
      {
        id: 'ms-primary',
        name: '--color-primary',
        label: 'Primary',
        value: '#18181b',
        category: 'color',
      },
      {
        id: 'ms-secondary',
        name: '--color-secondary',
        label: 'Secondary',
        value: '#52525b',
        category: 'color',
      },
      {
        id: 'ms-surface',
        name: '--color-surface',
        label: 'Surface',
        value: '#ffffff',
        category: 'color',
      },
      {
        id: 'ms-accent',
        name: '--color-accent',
        label: 'Muted Accent',
        value: '#f4f4f5',
        category: 'color',
      },
      {
        id: 'ms-font-title',
        name: '--font-size-title',
        label: 'Title Size',
        value: '2.25rem',
        category: 'fontSize',
      },
      {
        id: 'ms-font-body',
        name: '--font-size-body',
        label: 'Body Size',
        value: '0.95rem',
        category: 'fontSize',
      },
    ],
  },
  {
    id: 'emerald-botanical',
    name: 'Emerald SaaS',
    description: 'Świeża zieleń i głębia lasu',
    variables: [
      {
        id: 'em-primary',
        name: '--color-primary',
        label: 'Primary',
        value: '#059669',
        category: 'color',
      },
      {
        id: 'em-secondary',
        name: '--color-secondary',
        label: 'Secondary',
        value: '#064e3b',
        category: 'color',
      },
      {
        id: 'em-surface',
        name: '--color-surface',
        label: 'Surface',
        value: '#ecfdf5',
        category: 'color',
      },
      {
        id: 'em-accent',
        name: '--color-accent',
        label: 'Accent',
        value: '#10b981',
        category: 'color',
      },
      {
        id: 'em-font-title',
        name: '--font-size-title',
        label: 'Title Size',
        value: '2.5rem',
        category: 'fontSize',
      },
      {
        id: 'em-font-body',
        name: '--font-size-body',
        label: 'Body Size',
        value: '1rem',
        category: 'fontSize',
      },
    ],
  },
  {
    id: 'warm-sunset',
    name: 'Warm Sunset',
    description: 'Energetyczny koral i ciepły bursztyn',
    variables: [
      {
        id: 'ws-primary',
        name: '--color-primary',
        label: 'Primary',
        value: '#e11d48',
        category: 'color',
      },
      {
        id: 'ws-secondary',
        name: '--color-secondary',
        label: 'Secondary',
        value: '#881337',
        category: 'color',
      },
      {
        id: 'ws-surface',
        name: '--color-surface',
        label: 'Surface',
        value: '#fff1f2',
        category: 'color',
      },
      {
        id: 'ws-accent',
        name: '--color-accent',
        label: 'Accent',
        value: '#f97316',
        category: 'color',
      },
      {
        id: 'ws-font-title',
        name: '--font-size-title',
        label: 'Title Size',
        value: '2.25rem',
        category: 'fontSize',
      },
      {
        id: 'ws-font-body',
        name: '--font-size-body',
        label: 'Body Size',
        value: '1rem',
        category: 'fontSize',
      },
    ],
  },
  {
    id: 'midnight-dark',
    name: 'Midnight Neon',
    description: 'Ciemne tło i cyjanowy akcent',
    variables: [
      {
        id: 'md-primary',
        name: '--color-primary',
        label: 'Primary',
        value: '#38bdf8',
        category: 'color',
      },
      {
        id: 'md-secondary',
        name: '--color-secondary',
        label: 'Secondary',
        value: '#a855f7',
        category: 'color',
      },
      {
        id: 'md-surface',
        name: '--color-surface',
        label: 'Surface',
        value: '#0f172a',
        category: 'color',
      },
      {
        id: 'md-on-surface',
        name: '--color-on-surface',
        label: 'On Surface',
        value: '#f8fafc',
        category: 'color',
      },
      {
        id: 'md-font-title',
        name: '--font-size-title',
        label: 'Title Size',
        value: '2.5rem',
        category: 'fontSize',
      },
      {
        id: 'md-font-body',
        name: '--font-size-body',
        label: 'Body Size',
        value: '1rem',
        category: 'fontSize',
      },
    ],
  },
];

export interface ComponentVariantOption {
  id: string;
  label: string;
  classes: string;
}

export const COMPONENT_VARIANTS: Partial<Record<NodeType, ComponentVariantOption[]>> = {
  Button: [
    {
      id: 'primary',
      label: 'Primary',
      classes: 'bg-blue-600 text-white hover:bg-blue-700 border border-transparent shadow-sm',
    },
    {
      id: 'secondary',
      label: 'Secondary',
      classes: 'bg-slate-100 text-slate-900 hover:bg-slate-200 border border-slate-200',
    },
    {
      id: 'outline',
      label: 'Outline',
      classes: 'bg-white text-slate-800 hover:bg-slate-50 border border-slate-300',
    },
    {
      id: 'ghost',
      label: 'Ghost',
      classes: 'bg-transparent text-slate-700 hover:bg-slate-100 border border-transparent',
    },
    {
      id: 'destructive',
      label: 'Destructive',
      classes: 'bg-red-600 text-white hover:bg-red-700 border border-transparent shadow-sm',
    },
  ],
  Badge: [
    {
      id: 'info',
      label: 'Info',
      classes: 'bg-blue-100 text-blue-700',
    },
    {
      id: 'success',
      label: 'Success',
      classes: 'bg-emerald-100 text-emerald-700',
    },
    {
      id: 'warning',
      label: 'Warning',
      classes: 'bg-amber-100 text-amber-800',
    },
    {
      id: 'neutral',
      label: 'Neutral',
      classes: 'bg-slate-100 text-slate-700',
    },
    {
      id: 'danger',
      label: 'Danger',
      classes: 'bg-red-100 text-red-700',
    },
  ],
  Container: [
    {
      id: 'default',
      label: 'Default',
      classes: 'bg-white border border-slate-200',
    },
    {
      id: 'subtle',
      label: 'Subtle',
      classes: 'bg-slate-50 border border-slate-200',
    },
    {
      id: 'card',
      label: 'Card',
      classes: 'bg-white border border-slate-200 shadow-md',
    },
    {
      id: 'dark',
      label: 'Dark',
      classes: 'bg-slate-900 text-white border border-slate-800',
    },
  ],
  Input: [
    {
      id: 'default',
      label: 'Default',
      classes: 'bg-white border border-slate-300 focus:ring-blue-500',
    },
    {
      id: 'filled',
      label: 'Filled',
      classes: 'bg-slate-100 border border-transparent focus:bg-white focus:ring-blue-500',
    },
    {
      id: 'error',
      label: 'Error',
      classes: 'bg-red-50 border border-red-400 focus:ring-red-500',
    },
  ],
};

export const INITIAL_NODES: NodesMap = {
  root: {
    id: 'root',
    type: 'Container',
    name: 'Root Canvas',
    parentId: null,
    props: {
      className: 'p-8 bg-white min-h-full w-full flex flex-col gap-6',
    },
    children: ['hero-1'],
  },
  'hero-1': {
    id: 'hero-1',
    type: 'Container',
    name: 'Hero Section',
    variant: 'subtle',
    parentId: 'root',
    props: {
      className:
        'p-8 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-start gap-4',
    },
    children: ['badge-1', 'heading-1', 'text-1', 'btn-1'],
  },
  'badge-1': {
    id: 'badge-1',
    type: 'Badge',
    name: 'Badge',
    variant: 'info',
    content: 'Nowa Wersja 2.0',
    parentId: 'hero-1',
    props: {
      className:
        'px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full',
    },
    children: [],
  },
  'heading-1': {
    id: 'heading-1',
    type: 'Heading',
    name: 'Nagłówek główny',
    content: 'Zbuduj interfejs React wizualnie',
    parentId: 'hero-1',
    props: {
      className: 'text-3xl font-bold text-slate-900 tracking-tight',
    },
    children: [],
  },
  'text-1': {
    id: 'text-1',
    type: 'Text',
    name: 'Opis',
    content:
      'Kliknij dowolny element, aby edytować jego klasy Tailwind CSS, duplikować lub zmieniać kolejność w drzewie warstw.',
    parentId: 'hero-1',
    props: {
      className: 'text-base text-slate-600 max-w-xl leading-relaxed',
    },
    children: [],
  },
  'btn-1': {
    id: 'btn-1',
    type: 'Button',
    name: 'Przycisk CTA',
    variant: 'primary',
    content: 'Rozpocznij projekt',
    parentId: 'hero-1',
    props: {
      className:
        'px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm shadow-sm',
    },
    children: [],
  },
};

export const ELEMENT_TEMPLATES: Record<
  NodeType,
  Omit<EditorNode, 'id' | 'parentId'>
> = {
  Container: {
    type: 'Container',
    name: 'Kontener',
    variant: 'default',
    props: {
      className:
        'p-4 bg-white border border-dashed border-slate-300 min-h-[80px] flex flex-col gap-3 rounded-lg',
    },
    children: [],
  },
  Grid: {
    type: 'Grid',
    name: 'Grid',
    props: {
      className:
        'grid grid-cols-2 gap-4 items-start p-4 bg-white border border-dashed border-slate-300 min-h-[80px] rounded-lg',
    },
    children: [],
  },
  Heading: {
    type: 'Heading',
    name: 'Nagłówek',
    content: 'Nowy nagłówek',
    props: { className: 'text-2xl font-bold text-slate-900' },
    children: [],
  },
  Text: {
    type: 'Text',
    name: 'Tekst',
    content: 'Edytuj treść tego akapitu w panelu właściwości.',
    props: { className: 'text-sm text-slate-600 leading-relaxed' },
    children: [],
  },
  Button: {
    type: 'Button',
    name: 'Przycisk',
    variant: 'primary',
    content: 'Kliknij mnie',
    props: {
      className:
        'px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-fit font-medium text-sm',
    },
    children: [],
  },
  Badge: {
    type: 'Badge',
    name: 'Odznaka',
    variant: 'success',
    content: 'Status',
    props: {
      className:
        'px-2.5 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full w-fit',
    },
    children: [],
  },
  Input: {
    type: 'Input',
    name: 'Pole tekstowe',
    variant: 'default',
    props: {
      className:
        'border border-slate-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full text-sm',
      placeholder: 'Wpisz wartość...',
    },
    children: [],
  },
  Image: {
    type: 'Image',
    name: 'Obraz',
    props: {
      className: 'w-full max-w-md h-48 rounded-xl object-cover',
      src: '/assets/preview-abstract.svg',
    },
    children: [],
  },
  Icon: {
    type: 'Icon',
    name: 'Ikona',
    props: {
      className: 'w-6 h-6 text-slate-700',
      iconName: 'Star',
    },
    children: [],
  },
};

export type TemplateBlueprintNode = NodeBlueprint;

export interface PageTemplateDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  root: TemplateBlueprintNode;
}

export const PAGE_TEMPLATES: PageTemplateDefinition[] = [
  {
    id: 'hero-section',
    name: 'Hero Section',
    description: 'Nagłówek + opis + podwójne CTA',
    category: 'Marketing',
    root: {
      type: 'Container',
      name: 'Hero Section',
      props: {
        className:
          'p-10 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-start gap-4',
      },
      children: [
        {
          type: 'Badge',
          name: 'Hero Badge',
          content: 'Nowość · Wersja 2.0',
          props: {
            className:
              'px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full',
          },
        },
        {
          type: 'Heading',
          name: 'Hero Title',
          content: 'Twórz nowoczesne interfejsy szybciej',
          props: {
            className: 'text-3xl font-bold text-slate-900 tracking-tight max-w-xl',
          },
        },
        {
          type: 'Text',
          name: 'Hero Subtitle',
          content:
            'Gotowa sekcja startowa z elastycznym układem Flexbox i klasami Tailwind CSS gotowymi do eksportu.',
          props: {
            className: 'text-base text-slate-600 max-w-xl leading-relaxed',
          },
        },
        {
          type: 'Container',
          name: 'Hero Actions',
          props: {
            className: 'flex flex-row items-center gap-3 pt-2',
          },
          children: [
            {
              type: 'Button',
              name: 'Primary CTA',
              content: 'Rozpocznij za darmo',
              props: {
                className:
                  'px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm shadow-sm',
              },
            },
            {
              type: 'Button',
              name: 'Secondary CTA',
              content: 'Zobacz demo',
              props: {
                className:
                  'px-5 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors font-medium text-sm',
              },
            },
          ],
        },
      ],
    },
  },
  {
    id: 'pricing-table',
    name: 'Pricing Table',
    description: '3-kolumnowe karty planów cenowych',
    category: 'Konwersja',
    root: {
      type: 'Container',
      name: 'Pricing Section',
      props: {
        className:
          'p-8 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col gap-6',
      },
      children: [
        {
          type: 'Container',
          name: 'Pricing Header',
          props: {
            className: 'flex flex-col items-center text-center gap-2',
          },
          children: [
            {
              type: 'Badge',
              name: 'Pricing Badge',
              content: 'Cennik',
              props: {
                className:
                  'px-2.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full',
              },
            },
            {
              type: 'Heading',
              name: 'Pricing Title',
              content: 'Proste i przejrzyste plany',
              props: {
                className: 'text-2xl font-bold text-slate-900',
              },
            },
            {
              type: 'Text',
              name: 'Pricing Subtitle',
              content: 'Wybierz pakiet dopasowany do skali Twojego projektu.',
              props: {
                className: 'text-sm text-slate-600',
              },
            },
          ],
        },
        {
          type: 'Grid',
          name: 'Pricing Grid',
          props: {
            className: 'grid grid-cols-3 gap-4 items-stretch',
          },
          children: [
            {
              type: 'Container',
              name: 'Plan Starter',
              props: {
                className:
                  'p-5 bg-white border border-slate-200 rounded-xl flex flex-col gap-3',
              },
              children: [
                {
                  type: 'Text',
                  name: 'Plan Name',
                  content: 'Starter',
                  props: { className: 'text-sm font-semibold text-slate-600' },
                },
                {
                  type: 'Heading',
                  name: 'Plan Price',
                  content: '0 zł / mies.',
                  props: { className: 'text-2xl font-bold text-slate-900' },
                },
                {
                  type: 'Text',
                  name: 'Plan Desc',
                  content: 'Podstawowe komponenty i eksport JSX do małych projektów.',
                  props: { className: 'text-xs text-slate-500 leading-relaxed' },
                },
                {
                  type: 'Button',
                  name: 'Starter CTA',
                  content: 'Wybierz Starter',
                  props: {
                    className:
                      'mt-auto px-4 py-2 bg-slate-100 text-slate-800 rounded-lg hover:bg-slate-200 transition-colors font-medium text-xs text-center',
                  },
                },
              ],
            },
            {
              type: 'Container',
              name: 'Plan Pro',
              props: {
                className:
                  'p-5 bg-white border-2 border-blue-500 rounded-xl shadow-md flex flex-col gap-3',
              },
              children: [
                {
                  type: 'Badge',
                  name: 'Popular Badge',
                  content: 'Najpopularniejszy',
                  props: {
                    className:
                      'px-2.5 py-0.5 bg-blue-100 text-blue-700 text-[11px] font-semibold rounded-full w-fit',
                  },
                },
                {
                  type: 'Heading',
                  name: 'Plan Price',
                  content: '99 zł / mies.',
                  props: { className: 'text-2xl font-bold text-slate-900' },
                },
                {
                  type: 'Text',
                  name: 'Plan Desc',
                  content: 'Pełna biblioteka szablonów, siatki Grid i zmienne motywu.',
                  props: { className: 'text-xs text-slate-600 leading-relaxed' },
                },
                {
                  type: 'Button',
                  name: 'Pro CTA',
                  content: 'Wybierz Pro',
                  props: {
                    className:
                      'mt-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-xs text-center',
                  },
                },
              ],
            },
            {
              type: 'Container',
              name: 'Plan Team',
              props: {
                className:
                  'p-5 bg-white border border-slate-200 rounded-xl flex flex-col gap-3',
              },
              children: [
                {
                  type: 'Text',
                  name: 'Plan Name',
                  content: 'Enterprise',
                  props: { className: 'text-sm font-semibold text-slate-600' },
                },
                {
                  type: 'Heading',
                  name: 'Plan Price',
                  content: '249 zł / mies.',
                  props: { className: 'text-2xl font-bold text-slate-900' },
                },
                {
                  type: 'Text',
                  name: 'Plan Desc',
                  content: 'Wsparcie zespołowe i dedykowany design system dla firm.',
                  props: { className: 'text-xs text-slate-500 leading-relaxed' },
                },
                {
                  type: 'Button',
                  name: 'Team CTA',
                  content: 'Skontaktuj się',
                  props: {
                    className:
                      'mt-auto px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium text-xs text-center',
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  },
  {
    id: 'features-grid',
    name: 'Features Grid',
    description: 'Siatka 3 funkcji z opisami',
    category: 'Produkt',
    root: {
      type: 'Container',
      name: 'Features Section',
      props: {
        className:
          'p-8 bg-white border border-slate-200 rounded-2xl flex flex-col gap-6',
      },
      children: [
        {
          type: 'Container',
          name: 'Features Header',
          props: {
            className: 'flex flex-col items-start gap-2',
          },
          children: [
            {
              type: 'Badge',
              name: 'Features Badge',
              content: 'Możliwości',
              props: {
                className:
                  'px-2.5 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full',
              },
            },
            {
              type: 'Heading',
              name: 'Features Title',
              content: 'Wszystko, czego potrzebujesz do startu',
              props: {
                className: 'text-2xl font-bold text-slate-900',
              },
            },
          ],
        },
        {
          type: 'Grid',
          name: 'Features Grid',
          props: {
            className: 'grid grid-cols-3 gap-4 items-start',
          },
          children: [
            {
              type: 'Container',
              name: 'Feature 1',
              props: {
                className:
                  'p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-2',
              },
              children: [
                {
                  type: 'Heading',
                  name: 'Feature 1 Title',
                  content: 'Wizualna edycja',
                  props: { className: 'text-base font-bold text-slate-900' },
                },
                {
                  type: 'Text',
                  name: 'Feature 1 Text',
                  content: 'Zmieniaj układ, odstępy i typografię w czasie rzeczywistym.',
                  props: { className: 'text-xs text-slate-600 leading-relaxed' },
                },
              ],
            },
            {
              type: 'Container',
              name: 'Feature 2',
              props: {
                className:
                  'p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-2',
              },
              children: [
                {
                  type: 'Heading',
                  name: 'Feature 2 Title',
                  content: 'Klasy Tailwind',
                  props: { className: 'text-base font-bold text-slate-900' },
                },
                {
                  type: 'Text',
                  name: 'Feature 2 Text',
                  content: 'Pełna kontrola nad klasami utility i własnymi zmiennymi CSS.',
                  props: { className: 'text-xs text-slate-600 leading-relaxed' },
                },
              ],
            },
            {
              type: 'Container',
              name: 'Feature 3',
              props: {
                className:
                  'p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-2',
              },
              children: [
                {
                  type: 'Heading',
                  name: 'Feature 3 Title',
                  content: 'Czysty kod JSX',
                  props: { className: 'text-base font-bold text-slate-900' },
                },
                {
                  type: 'Text',
                  name: 'Feature 3 Text',
                  content: 'Eksportuj gotową hierarchię komponentów jednym kliknięciem.',
                  props: { className: 'text-xs text-slate-600 leading-relaxed' },
                },
              ],
            },
          ],
        },
      ],
    },
  },
  {
    id: 'cta-banner',
    name: 'CTA Banner',
    description: 'Ciemny baner wezwania do działania',
    category: 'Konwersja',
    root: {
      type: 'Container',
      name: 'CTA Banner',
      props: {
        className:
          'p-8 bg-slate-900 rounded-2xl flex flex-row items-center justify-between gap-6',
      },
      children: [
        {
          type: 'Container',
          name: 'CTA Text Group',
          props: {
            className: 'flex flex-col gap-1.5',
          },
          children: [
            {
              type: 'Heading',
              name: 'CTA Title',
              content: 'Gotowy na zbudowanie kolejnego projektu?',
              props: { className: 'text-xl font-bold text-white' },
            },
            {
              type: 'Text',
              name: 'CTA Description',
              content: 'Zacznij od gotowego układu i wyeksportuj czysty kod React.',
              props: { className: 'text-sm text-slate-300' },
            },
          ],
        },
        {
          type: 'Button',
          name: 'CTA Action',
          content: 'Uruchom teraz',
          props: {
            className:
              'px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm shrink-0',
          },
        },
      ],
    },
  },
];

