import type {
  BootstrapVersion,
  EditorNode,
  LibrarySourceId,
  MaterialNodeMeta,
  NodeBlueprint,
  NodesMap,
  SeoMetadata,
  ThemeVariable,
} from '../types/editor';
import { buildThemeCssRules, isContainerNodeType } from './editorLogic';
import { buildElementCustomStyleCssRules } from './cssEditor';
import { buildScopedThemeOverrideCssRules } from './themeUsage';
import { getBootstrapAssets } from './bootstrapSupport';

export type MaterialLibrarySource = 'mui-v9' | 'md2' | 'md3';

export const MATERIAL_ENABLE_MD2_STORAGE_KEY =
  'react_ui_editor_material_enable_md2_v1';
export const MATERIAL_ENABLE_MD3_STORAGE_KEY =
  'react_ui_editor_material_enable_md3_v1';

export type MaterialStyleKind =
  | 'mui-prop'
  | 'mui-prop-value'
  | 'mui-slot'
  | 'mui-selector'
  | 'md2-class'
  | 'md2-attr'
  | 'md3-tag'
  | 'md3-attr'
  | 'md3-token';

export interface MaterialComponentExample {
  id: string;
  source: MaterialLibrarySource;
  sourceLabel: string;
  category: 'Components' | 'Inputs & Forms' | 'Navigation & Layout' | 'Feedback';
  title: string;
  description: string;
  docsUrl: string;
  componentTag: string;
  jsxSnippet?: string;
  htmlSnippet?: string;
  md3Modules?: string[];
  blueprint: NodeBlueprint;
}

export interface MaterialStyleEntry {
  id: string;
  name: string;
  source: MaterialLibrarySource;
  sourceLabel: string;
  kind: MaterialStyleKind;
  componentScope?: string;
  description: string;
  example: string;
  insertText: string;
}

export const MATERIAL_LIBRARY_ASSETS = {
  md2: {
    label: 'Material Components for the Web (MD2)',
    cssUrl:
      'https://unpkg.com/material-components-web@14.0.0/dist/material-components-web.min.css',
    iconsUrl: 'https://fonts.googleapis.com/icon?family=Material+Icons',
    jsUrl:
      'https://unpkg.com/material-components-web@14.0.0/dist/material-components-web.min.js',
  },
  md3: {
    label: 'Material Web (@material/web · MD3)',
    robotoUrl:
      'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap',
    symbolsUrl:
      'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined',
    importMapPrefix: 'https://esm.run/@material/web/',
  },
} as const;

export const MATERIAL_COMPONENT_EXAMPLES: MaterialComponentExample[] = [
  // ======================== MUI v9 (Main Library) ========================
  {
    id: 'mui9-button-contained',
    source: 'mui-v9',
    sourceLabel: 'MUI v9',
    category: 'Components',
    title: 'Button (Contained / Outlined)',
    description:
      'Komponent MUI v9 Button z wariantami contained/outlined, obsługą color oraz slotProps.',
    docsUrl: 'https://mui.com/material-ui/react-button/',
    componentTag: 'Button',
    jsxSnippet: `import Button from '@mui/material/Button';\n\n<Button variant="contained" color="primary" size="medium">\n  Zapisz zmiany\n</Button>`,
    blueprint: {
      type: 'Button',
      name: 'MUI v9 Button',
      content: 'Zapisz zmiany',
      sourceLibrary: 'mui-v9',
      props: { className: '' },
      materialMeta: {
        componentTag: 'Button',
        muiProps: {
          variant: 'contained',
          color: 'primary',
          size: 'medium',
        },
      },
    },
  },
  {
    id: 'mui9-textfield-outlined',
    source: 'mui-v9',
    sourceLabel: 'MUI v9',
    category: 'Inputs & Forms',
    title: 'TextField (Outlined)',
    description:
      'Pole tekstowe MUI v9 z pływającą etykietą, wariantem outlined i slotProps.htmlInput.',
    docsUrl: 'https://mui.com/material-ui/react-text-field/',
    componentTag: 'TextField',
    jsxSnippet: `import TextField from '@mui/material/TextField';\n\n<TextField\n  label="Adres e-mail"\n  placeholder="name@company.com"\n  variant="outlined"\n  size="small"\n  fullWidth\n/>`,
    blueprint: {
      type: 'Input',
      name: 'MUI v9 TextField',
      sourceLibrary: 'mui-v9',
      props: {
        className: 'w-full',
        placeholder: 'name@company.com',
      },
      materialMeta: {
        componentTag: 'TextField',
        muiProps: {
          label: 'Adres e-mail',
          variant: 'outlined',
          size: 'small',
          fullWidth: true,
        },
      },
    },
  },
  {
    id: 'mui9-number-field',
    source: 'mui-v9',
    sourceLabel: 'MUI v9',
    category: 'Inputs & Forms',
    title: 'NumberField (Base UI · v9)',
    description:
      'Nowy komponent MUI v9 NumberField z przyciskami inkrementacji/dekrementacji i kontrolą zakresu.',
    docsUrl: 'https://mui.com/material-ui/react-number-field/',
    componentTag: 'NumberField',
    jsxSnippet: `import NumberField from '@mui/material/NumberField';\n\n<NumberField label="Ilość" defaultValue={2} min={1} max={99} />`,
    blueprint: {
      type: 'Input',
      name: 'MUI v9 NumberField',
      content: '2',
      sourceLibrary: 'mui-v9',
      props: { className: '', placeholder: '2' },
      materialMeta: {
        componentTag: 'NumberField',
        muiProps: {
          label: 'Ilość',
          min: 1,
          max: 99,
          step: 1,
          size: 'small',
        },
      },
    },
  },
  {
    id: 'mui9-menubar',
    source: 'mui-v9',
    sourceLabel: 'MUI v9',
    category: 'Navigation & Layout',
    title: 'Menubar (Base UI · v9)',
    description:
      'Nowy komponent MUI v9 Menubar z poziomą nawigacją klawiaturową i menu rozwijanym.',
    docsUrl: 'https://mui.com/material-ui/react-menubar/',
    componentTag: 'Menubar',
    jsxSnippet: `import Menubar from '@mui/material/Menubar';\n\n<Menubar items={['Plik', 'Edycja', 'Widok', 'Pomoc']} />`,
    blueprint: {
      type: 'Container',
      name: 'MUI v9 Menubar',
      content: 'Plik, Edycja, Widok, Pomoc',
      sourceLibrary: 'mui-v9',
      props: { className: 'w-full' },
      materialMeta: {
        componentTag: 'Menubar',
        muiProps: {
          variant: 'outlined',
          color: 'primary',
        },
      },
    },
  },
  {
    id: 'mui9-card',
    source: 'mui-v9',
    sourceLabel: 'MUI v9',
    category: 'Components',
    title: 'Card Surface',
    description:
      'Karta MUI v9 (Card + CardContent + Typography + Button) korzystająca z tokenów CSS motywu.',
    docsUrl: 'https://mui.com/material-ui/react-card/',
    componentTag: 'Card',
    jsxSnippet: `import Card from '@mui/material/Card';\nimport CardContent from '@mui/material/CardContent';\nimport Typography from '@mui/material/Typography';\nimport Button from '@mui/material/Button';\n\n<Card variant="outlined">\n  <CardContent>\n    <Typography variant="h6">MUI v9 Card</Typography>\n    <Typography variant="body2" color="text.secondary">\n      Karta zbudowana w oparciu o system motywów MUI v9.\n    </Typography>\n  </CardContent>\n</Card>`,
    blueprint: {
      type: 'Container',
      name: 'MUI v9 Card',
      sourceLibrary: 'mui-v9',
      props: { className: 'w-full' },
      materialMeta: {
        componentTag: 'Card',
        muiProps: {
          variant: 'elevation',
          elevation: 2,
        },
      },
      children: [
        {
          type: 'Heading',
          name: 'MUI Card Title',
          content: 'MUI v9 Card',
          sourceLibrary: 'mui-v9',
          props: { className: 'text-lg font-semibold text-slate-900' },
        },
        {
          type: 'Text',
          name: 'MUI Card Body',
          content: 'Karta oparta na tokenach Material UI v9 i stylach slotów.',
          sourceLibrary: 'mui-v9',
          props: { className: 'text-sm text-slate-600' },
        },
        {
          type: 'Button',
          name: 'MUI Card Action',
          content: 'Dowiedz się więcej',
          sourceLibrary: 'mui-v9',
          props: { className: '' },
          materialMeta: {
            componentTag: 'Button',
            muiProps: {
              variant: 'contained',
              color: 'primary',
              size: 'small',
            },
          },
        },
      ],
    },
  },
  {
    id: 'mui9-alert',
    source: 'mui-v9',
    sourceLabel: 'MUI v9',
    category: 'Feedback',
    title: 'Alert (Severity)',
    description:
      'Baner komunikatu MUI v9 Alert z wariantem standard/filled/outlined i poziomem severity.',
    docsUrl: 'https://mui.com/material-ui/react-alert/',
    componentTag: 'Alert',
    jsxSnippet: `import Alert from '@mui/material/Alert';\n\n<Alert severity="success" variant="filled">\n  Zmiany zostały zapisane pomyślnie.\n</Alert>`,
    blueprint: {
      type: 'Text',
      name: 'MUI v9 Alert',
      content: 'Zmiany zostały zapisane pomyślnie.',
      sourceLibrary: 'mui-v9',
      props: { className: 'w-full' },
      materialMeta: {
        componentTag: 'Alert',
        muiProps: {
          severity: 'success',
          variant: 'standard',
        },
      },
    },
  },
  {
    id: 'mui9-chip',
    source: 'mui-v9',
    sourceLabel: 'MUI v9',
    category: 'Components',
    title: 'Chip Tag',
    description:
      'Etykieta MUI v9 Chip z obsługą variant (filled/outlined), color i klikalności.',
    docsUrl: 'https://mui.com/material-ui/react-chip/',
    componentTag: 'Chip',
    jsxSnippet: `import Chip from '@mui/material/Chip';\n\n<Chip label="Material UI v9" color="primary" variant="filled" />`,
    blueprint: {
      type: 'Badge',
      name: 'MUI v9 Chip',
      content: 'Material UI v9',
      sourceLibrary: 'mui-v9',
      props: { className: '' },
      materialMeta: {
        componentTag: 'Chip',
        muiProps: {
          variant: 'filled',
          color: 'primary',
          size: 'medium',
        },
      },
    },
  },
  {
    id: 'mui9-switch',
    source: 'mui-v9',
    sourceLabel: 'MUI v9',
    category: 'Inputs & Forms',
    title: 'Switch Toggle',
    description:
      'Przełącznik MUI v9 Switch z obsługą color oraz kontrolowanego stanu.',
    docsUrl: 'https://mui.com/material-ui/react-switch/',
    componentTag: 'Switch',
    jsxSnippet: `import Switch from '@mui/material/Switch';\n\n<Switch defaultChecked color="primary" />`,
    blueprint: {
      type: 'Button',
      name: 'MUI v9 Switch',
      content: 'Powiadomienia',
      sourceLibrary: 'mui-v9',
      props: { className: '' },
      materialMeta: {
        componentTag: 'Switch',
        muiProps: {
          color: 'primary',
          size: 'medium',
          defaultChecked: true,
        },
      },
    },
  },

  // ======================== MD2 (MDC Web - Optional) ========================
  {
    id: 'md2-button-raised',
    source: 'md2',
    sourceLabel: 'MD2 (MDC Web)',
    category: 'Components',
    title: 'MDC Raised Button',
    description:
      'Przycisk Material Components for the Web (MD2) z efektem ripple i klasą .mdc-button--raised.',
    docsUrl:
      'https://github.com/material-components/material-components-web/tree/master/packages/mdc-button',
    componentTag: 'mdc-button',
    htmlSnippet: `<button class="mdc-button mdc-button--raised" data-mdc-auto-init="MDCRipple">\n  <span class="mdc-button__ripple"></span>\n  <span class="mdc-button__label">MD2 Button</span>\n</button>`,
    blueprint: {
      type: 'Button',
      name: 'MD2 Raised Button',
      content: 'MD2 Button',
      sourceLibrary: 'md2',
      props: { className: 'mdc-button mdc-button--raised' },
      htmlAttrs: { 'data-mdc-auto-init': 'MDCRipple' },
    },
  },
  {
    id: 'md2-text-field',
    source: 'md2',
    sourceLabel: 'MD2 (MDC Web)',
    category: 'Inputs & Forms',
    title: 'MDC Filled Text Field',
    description:
      'Pole tekstowe MD2 (.mdc-text-field--filled) inicjalizowane przez mdc.textField.MDCTextField.',
    docsUrl:
      'https://github.com/material-components/material-components-web/tree/master/packages/mdc-textfield',
    componentTag: 'mdc-text-field',
    htmlSnippet: `<label class="mdc-text-field mdc-text-field--filled" data-mdc-auto-init="MDCTextField">\n  <span class="mdc-text-field__ripple"></span>\n  <input class="mdc-text-field__input" type="text" placeholder="Wpisz tekst..." aria-label="MD2 Text Field" />\n  <span class="mdc-line-ripple"></span>\n</label>`,
    blueprint: {
      type: 'Input',
      name: 'MD2 Text Field',
      sourceLibrary: 'md2',
      props: {
        className: 'mdc-text-field mdc-text-field--filled mdc-text-field__input',
        placeholder: 'MD2 Wpisz tekst...',
      },
      htmlAttrs: { 'data-mdc-auto-init': 'MDCTextField' },
    },
  },
  {
    id: 'md2-card',
    source: 'md2',
    sourceLabel: 'MD2 (MDC Web)',
    category: 'Components',
    title: 'MDC Card Container',
    description:
      'Karta Material Design 2 oparta na .mdc-card z sekcją .mdc-card__primary-action.',
    docsUrl:
      'https://github.com/material-components/material-components-web/tree/master/packages/mdc-card',
    componentTag: 'mdc-card',
    htmlSnippet: `<div class="mdc-card p-3">\n  <h3 class="mdc-typography--headline6">MD2 Card</h3>\n  <p class="mdc-typography--body2">Karta Material Components for the Web.</p>\n</div>`,
    blueprint: {
      type: 'Container',
      name: 'MD2 Card',
      sourceLibrary: 'md2',
      props: { className: 'mdc-card p-4 gap-2' },
      children: [
        {
          type: 'Heading',
          name: 'MD2 Card Title',
          content: 'MD2 Card Title',
          sourceLibrary: 'md2',
          props: { className: 'mdc-typography--headline6 font-bold text-slate-900' },
        },
        {
          type: 'Text',
          name: 'MD2 Card Text',
          content: 'Struktura karty zgodna z Material Components for the Web (MD2).',
          sourceLibrary: 'md2',
          props: { className: 'mdc-typography--body2 text-slate-600' },
        },
        {
          type: 'Button',
          name: 'MD2 Card Action',
          content: 'Akcja MD2',
          sourceLibrary: 'md2',
          props: { className: 'mdc-button mdc-button--outlined self-start' },
          htmlAttrs: { 'data-mdc-auto-init': 'MDCRipple' },
        },
      ],
    },
  },
  {
    id: 'md2-chip',
    source: 'md2',
    sourceLabel: 'MD2 (MDC Web)',
    category: 'Components',
    title: 'MDC Chip Badge',
    description: 'Znacznik .mdc-chip z efektem fali ripple dla MD2.',
    docsUrl:
      'https://github.com/material-components/material-components-web/tree/master/packages/mdc-chips',
    componentTag: 'mdc-chip',
    htmlSnippet: `<span class="mdc-chip" role="row">\n  <span class="mdc-chip__ripple"></span>\n  <span class="mdc-chip__text">MD2 Chip</span>\n</span>`,
    blueprint: {
      type: 'Badge',
      name: 'MD2 Chip',
      content: 'MD2 Chip',
      sourceLibrary: 'md2',
      props: { className: 'mdc-chip' },
      htmlAttrs: { role: 'row' },
    },
  },

  // ======================== MD3 (@material/web - Optional) ========================
  {
    id: 'md3-filled-button',
    source: 'md3',
    sourceLabel: 'MD3 (@material/web)',
    category: 'Components',
    title: '<md-filled-button>',
    description:
      'Custom element Material Web MD3 o wysokim priorytecie wizualnym i tokenach CSS --md-filled-button-*.',
    docsUrl: 'https://material-web.dev/components/button/',
    componentTag: 'md-filled-button',
    md3Modules: ['@material/web/button/filled-button.js'],
    htmlSnippet: `<md-filled-button>MD3 Submit</md-filled-button>`,
    blueprint: {
      type: 'Button',
      name: 'MD3 Filled Button',
      content: 'MD3 Submit',
      sourceLibrary: 'md3',
      props: { className: '' },
      materialMeta: {
        mdCustomTag: 'md-filled-button',
        mdTokens: {
          '--md-filled-button-container-color': '#6750a4',
          '--md-filled-button-label-text-color': '#ffffff',
        },
      },
    },
  },
  {
    id: 'md3-outlined-text-field',
    source: 'md3',
    sourceLabel: 'MD3 (@material/web)',
    category: 'Inputs & Forms',
    title: '<md-outlined-text-field>',
    description:
      'Custom element pola tekstowego Material Web MD3 z etykietą label oraz supporting-text.',
    docsUrl: 'https://material-web.dev/components/text-field/',
    componentTag: 'md-outlined-text-field',
    md3Modules: ['@material/web/textfield/outlined-text-field.js'],
    htmlSnippet: `<md-outlined-text-field label="E-mail MD3" placeholder="hello@material.io"></md-outlined-text-field>`,
    blueprint: {
      type: 'Input',
      name: 'MD3 Outlined TextField',
      sourceLibrary: 'md3',
      props: { className: 'w-full', placeholder: 'hello@material.io' },
      htmlAttrs: { label: 'E-mail MD3' },
      materialMeta: {
        mdCustomTag: 'md-outlined-text-field',
      },
    },
  },
  {
    id: 'md3-switch',
    source: 'md3',
    sourceLabel: 'MD3 (@material/web)',
    category: 'Inputs & Forms',
    title: '<md-switch>',
    description:
      'Przełącznik Material Web MD3 z obsługą atrybutu selected i zmiennych --md-switch-*.',
    docsUrl: 'https://material-web.dev/components/switch/',
    componentTag: 'md-switch',
    md3Modules: ['@material/web/switch/switch.js'],
    htmlSnippet: `<md-switch selected aria-label="MD3 Switch"></md-switch>`,
    blueprint: {
      type: 'Button',
      name: 'MD3 Switch',
      content: 'MD3 Switch',
      sourceLibrary: 'md3',
      props: { className: '' },
      htmlAttrs: { selected: 'true', 'aria-label': 'MD3 Switch' },
      materialMeta: {
        mdCustomTag: 'md-switch',
      },
    },
  },
  {
    id: 'md3-assist-chip',
    source: 'md3',
    sourceLabel: 'MD3 (@material/web)',
    category: 'Components',
    title: '<md-assist-chip>',
    description:
      'Chip Material Web MD3 wyświetlany jako natywny element <md-assist-chip>.',
    docsUrl: 'https://material-web.dev/components/chip/',
    componentTag: 'md-assist-chip',
    md3Modules: ['@material/web/chips/assist-chip.js'],
    htmlSnippet: `<md-assist-chip label="Material 3"></md-assist-chip>`,
    blueprint: {
      type: 'Badge',
      name: 'MD3 Assist Chip',
      content: 'Material 3',
      sourceLibrary: 'md3',
      props: { className: '' },
      htmlAttrs: { label: 'Material 3' },
      materialMeta: {
        mdCustomTag: 'md-assist-chip',
      },
    },
  },
];

// Explicit public MUI v9 props, prop values, slot names, and public CSS selectors (no generated hashes).
export const MATERIAL_STYLE_ENTRIES: MaterialStyleEntry[] = [
  // MUI v9 Public Selectors & Slot Styling API
  {
    id: 'mui-sel-btn-root',
    name: '.MuiButton-root',
    source: 'mui-v9',
    sourceLabel: 'MUI v9',
    kind: 'mui-selector',
    componentScope: 'Button',
    description: 'Publiczny selektor CSS głównego korzenia komponentu MUI Button.',
    example: `sx={{ '& .MuiButton-root': { textTransform: 'none', borderRadius: 3 } }}`,
    insertText: '.MuiButton-root',
  },
  {
    id: 'mui-sel-btn-contained',
    name: '.MuiButton-contained',
    source: 'mui-v9',
    sourceLabel: 'MUI v9',
    kind: 'mui-selector',
    componentScope: 'Button',
    description: 'Selektor CSS stanu variant="contained" przycisku MUI v9.',
    example: `sx={{ '&.MuiButton-contained': { boxShadow: 'none' } }}`,
    insertText: '.MuiButton-contained',
  },
  {
    id: 'mui-sel-btn-starticon',
    name: '.MuiButton-startIcon',
    source: 'mui-v9',
    sourceLabel: 'MUI v9',
    kind: 'mui-selector',
    componentScope: 'Button',
    description: 'Publiczny selektor CSS slotu startIcon w MUI Button.',
    example: `sx={{ '& .MuiButton-startIcon': { mr: 1.5 } }}`,
    insertText: '.MuiButton-startIcon',
  },
  {
    id: 'mui-sel-textfield-outlined',
    name: '.MuiOutlinedInput-root',
    source: 'mui-v9',
    sourceLabel: 'MUI v9',
    kind: 'mui-selector',
    componentScope: 'TextField',
    description: 'Selektor kontenera ramki OutlinedInput wewnątrz MUI TextField.',
    example: `sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}`,
    insertText: '.MuiOutlinedInput-root',
  },
  {
    id: 'mui-sel-input-label',
    name: '.MuiInputLabel-root',
    source: 'mui-v9',
    sourceLabel: 'MUI v9',
    kind: 'mui-selector',
    componentScope: 'TextField',
    description: 'Publiczny selektor CSS pływającej etykiety InputLabel.',
    example: `sx={{ '& .MuiInputLabel-root': { fontWeight: 600 } }}`,
    insertText: '.MuiInputLabel-root',
  },
  {
    id: 'mui-sel-card-content',
    name: '.MuiCardContent-root',
    source: 'mui-v9',
    sourceLabel: 'MUI v9',
    kind: 'mui-selector',
    componentScope: 'Card',
    description: 'Publiczny selektor CSS obszaru treści w MUI Card.',
    example: `sx={{ '& .MuiCardContent-root': { p: 3 } }}`,
    insertText: '.MuiCardContent-root',
  },
  {
    id: 'mui-sel-alert-root',
    name: '.MuiAlert-root',
    source: 'mui-v9',
    sourceLabel: 'MUI v9',
    kind: 'mui-selector',
    componentScope: 'Alert',
    description: 'Publiczny selektor CSS głównego elementu MUI Alert.',
    example: `sx={{ '&.MuiAlert-root': { alignItems: 'center' } }}`,
    insertText: '.MuiAlert-root',
  },
  {
    id: 'mui-sel-chip-root',
    name: '.MuiChip-root',
    source: 'mui-v9',
    sourceLabel: 'MUI v9',
    kind: 'mui-selector',
    componentScope: 'Chip',
    description: 'Publiczny selektor CSS dla komponentu MUI Chip.',
    example: `sx={{ '&.MuiChip-root': { fontWeight: 600 } }}`,
    insertText: '.MuiChip-root',
  },
  {
    id: 'mui-sel-focused',
    name: '.Mui-focused',
    source: 'mui-v9',
    sourceLabel: 'MUI v9',
    kind: 'mui-selector',
    description: 'Globalny publiczny selektor stanu skupienia (.Mui-focused) w MUI v9.',
    example: `sx={{ '& .Mui-focused': { outlineOffset: 2 } }}`,
    insertText: '.Mui-focused',
  },
  // MUI v9 Slot names
  {
    id: 'mui-slot-starticon',
    name: 'slot: startIcon',
    source: 'mui-v9',
    sourceLabel: 'MUI v9',
    kind: 'mui-slot',
    componentScope: 'Button',
    description: 'Nazwa slotu MUI v9 dla ikony otwierającej w Button (`slots.startIcon`).',
    example: `<Button slotProps={{ startIcon: { className: 'mr-1' } }}>Akcja</Button>`,
    insertText: 'startIcon',
  },
  {
    id: 'mui-slot-htmlinput',
    name: 'slot: htmlInput',
    source: 'mui-v9',
    sourceLabel: 'MUI v9',
    kind: 'mui-slot',
    componentScope: 'TextField',
    description: 'Nazwa slotu MUI v9 wskazująca natywny element <input> (`slotProps.htmlInput`).',
    example: `<TextField slotProps={{ htmlInput: { maxLength: 64 } }} />`,
    insertText: 'htmlInput',
  },
  {
    id: 'mui-slot-inputlabel',
    name: 'slot: inputLabel',
    source: 'mui-v9',
    sourceLabel: 'MUI v9',
    kind: 'mui-slot',
    componentScope: 'TextField',
    description: 'Slot etykiety MUI v9 TextField (`slotProps.inputLabel`).',
    example: `<TextField slotProps={{ inputLabel: { shrink: true } }} />`,
    insertText: 'inputLabel',
  },
  {
    id: 'mui-slot-action',
    name: 'slot: action',
    source: 'mui-v9',
    sourceLabel: 'MUI v9',
    kind: 'mui-slot',
    componentScope: 'Alert',
    description: 'Slot przycisku akcji w komponencie MUI v9 Alert (`slotProps.action`).',
    example: `<Alert slotProps={{ action: { className: 'ml-auto' } }}>Info</Alert>`,
    insertText: 'action',
  },
  // MUI v9 Props & Values
  {
    id: 'mui-prop-variant-contained',
    name: 'variant="contained"',
    source: 'mui-v9',
    sourceLabel: 'MUI v9',
    kind: 'mui-prop-value',
    componentScope: 'Button',
    description: 'Wartość propu `variant` dla wypełnionego przycisku MUI v9.',
    example: `<Button variant="contained">Wyślij</Button>`,
    insertText: 'variant=contained',
  },
  {
    id: 'mui-prop-variant-outlined',
    name: 'variant="outlined"',
    source: 'mui-v9',
    sourceLabel: 'MUI v9',
    kind: 'mui-prop-value',
    componentScope: 'Button',
    description: 'Wartość propu `variant` z obramowaniem dla Button / TextField / Card / Chip.',
    example: `<Button variant="outlined">Anuluj</Button>`,
    insertText: 'variant=outlined',
  },
  {
    id: 'mui-prop-color-secondary',
    name: 'color="secondary"',
    source: 'mui-v9',
    sourceLabel: 'MUI v9',
    kind: 'mui-prop-value',
    description: 'Wartość propu `color` mapowana na secondary w palecie motywu MUI v9.',
    example: `<Chip color="secondary" label="Pro" />`,
    insertText: 'color=secondary',
  },
  {
    id: 'mui-prop-severity-warning',
    name: 'severity="warning"',
    source: 'mui-v9',
    sourceLabel: 'MUI v9',
    kind: 'mui-prop-value',
    componentScope: 'Alert',
    description: 'Poziom ostrzeżenia propu `severity` dla MUI v9 Alert.',
    example: `<Alert severity="warning">Sprawdź dane formularza.</Alert>`,
    insertText: 'severity=warning',
  },

  // MD2 (MDC Web) Classes & HTML Attributes
  {
    id: 'md2-cls-button',
    name: 'mdc-button',
    source: 'md2',
    sourceLabel: 'MD2',
    kind: 'md2-class',
    description: 'Bazowa klasa przycisku Material Components for the Web (MD2).',
    example: `<button class="mdc-button"><span class="mdc-button__label">OK</span></button>`,
    insertText: 'mdc-button',
  },
  {
    id: 'md2-cls-button-raised',
    name: 'mdc-button--raised',
    source: 'md2',
    sourceLabel: 'MD2',
    kind: 'md2-class',
    description: 'Modyfikator podniesionego przycisku MD2 z cieniem i wypełnieniem.',
    example: `<button class="mdc-button mdc-button--raised">...</button>`,
    insertText: 'mdc-button--raised',
  },
  {
    id: 'md2-cls-button-outlined',
    name: 'mdc-button--outlined',
    source: 'md2',
    sourceLabel: 'MD2',
    kind: 'md2-class',
    description: 'Modyfikator przycisku MD2 z cienkim obramowaniem.',
    example: `<button class="mdc-button mdc-button--outlined">...</button>`,
    insertText: 'mdc-button--outlined',
  },
  {
    id: 'md2-cls-card',
    name: 'mdc-card',
    source: 'md2',
    sourceLabel: 'MD2',
    kind: 'md2-class',
    description: 'Główny kontener karty w Material Components for the Web (MD2).',
    example: `<div class="mdc-card">...</div>`,
    insertText: 'mdc-card',
  },
  {
    id: 'md2-cls-textfield',
    name: 'mdc-text-field--filled',
    source: 'md2',
    sourceLabel: 'MD2',
    kind: 'md2-class',
    description: 'Wariant wypełnionego pola tekstowego MD2.',
    example: `<label class="mdc-text-field mdc-text-field--filled">...</label>`,
    insertText: 'mdc-text-field--filled',
  },
  {
    id: 'md2-attr-auto-init',
    name: 'data-mdc-auto-init="MDCRipple"',
    source: 'md2',
    sourceLabel: 'MD2',
    kind: 'md2-attr',
    description: 'Atrybut HTML automatycznej inicjalizacji skryptu MDC Web Ripple.',
    example: `<button class="mdc-button" data-mdc-auto-init="MDCRipple">...</button>`,
    insertText: 'data-mdc-auto-init="MDCRipple"',
  },

  // MD3 (@material/web) Tags, Attributes & CSS Custom Properties
  {
    id: 'md3-tag-filled-btn',
    name: '<md-filled-button>',
    source: 'md3',
    sourceLabel: 'MD3',
    kind: 'md3-tag',
    description: 'Natywny Custom Element przycisku MD3 z @material/web/button/filled-button.js.',
    example: `<md-filled-button>Wyślij</md-filled-button>`,
    insertText: 'md-filled-button',
  },
  {
    id: 'md3-tag-outlined-tf',
    name: '<md-outlined-text-field>',
    source: 'md3',
    sourceLabel: 'MD3',
    kind: 'md3-tag',
    description: 'Natywny Custom Element pola tekstowego MD3 z obramowaniem.',
    example: `<md-outlined-text-field label="Email"></md-outlined-text-field>`,
    insertText: 'md-outlined-text-field',
  },
  {
    id: 'md3-tag-switch',
    name: '<md-switch>',
    source: 'md3',
    sourceLabel: 'MD3',
    kind: 'md3-tag',
    description: 'Natywny Custom Element przełącznika MD3 (@material/web/switch/switch.js).',
    example: `<md-switch selected></md-switch>`,
    insertText: 'md-switch',
  },
  {
    id: 'md3-attr-supporting-text',
    name: 'supporting-text',
    source: 'md3',
    sourceLabel: 'MD3',
    kind: 'md3-attr',
    description: 'Atrybut HTML pomocniczego opisu pod elementami MD3 TextField.',
    example: `<md-outlined-text-field label="Hasło" supporting-text="Min. 8 znaków"></md-outlined-text-field>`,
    insertText: 'supporting-text',
  },
  {
    id: 'md3-token-sys-primary',
    name: '--md-sys-color-primary',
    source: 'md3',
    sourceLabel: 'MD3',
    kind: 'md3-token',
    description: 'Globalny token koloru głównego systemu Material Design 3.',
    example: `:root { --md-sys-color-primary: #6750a4; }`,
    insertText: '--md-sys-color-primary: #6750a4;',
  },
  {
    id: 'md3-token-btn-color',
    name: '--md-filled-button-container-color',
    source: 'md3',
    sourceLabel: 'MD3',
    kind: 'md3-token',
    description: 'Zmienna CSS koloru tła dla <md-filled-button>.',
    example: `md-filled-button { --md-filled-button-container-color: #2563eb; }`,
    insertText: '--md-filled-button-container-color: #2563eb;',
  },
  {
    id: 'md3-token-btn-shape',
    name: '--md-filled-button-container-shape',
    source: 'md3',
    sourceLabel: 'MD3',
    kind: 'md3-token',
    description: 'Zmienna CSS zaokrąglenia rogów dla <md-filled-button>.',
    example: `md-filled-button { --md-filled-button-container-shape: 12px; }`,
    insertText: '--md-filled-button-container-shape: 12px;',
  },
  {
    id: 'md3-token-tf-focus',
    name: '--md-outlined-text-field-focus-outline-color',
    source: 'md3',
    sourceLabel: 'MD3',
    kind: 'md3-token',
    description: 'Zmienna CSS koloru obramowania w stanie focus pola MD3.',
    example: `md-outlined-text-field { --md-outlined-text-field-focus-outline-color: #6750a4; }`,
    insertText: '--md-outlined-text-field-focus-outline-color: #6750a4;',
  },
  {
    id: 'md3-token-switch-track',
    name: '--md-switch-selected-track-color',
    source: 'md3',
    sourceLabel: 'MD3',
    kind: 'md3-token',
    description: 'Zmienna CSS koloru aktywnej ścieżki przełącznika <md-switch>.',
    example: `md-switch { --md-switch-selected-track-color: #16a34a; }`,
    insertText: '--md-switch-selected-track-color: #16a34a;',
  },
];

export function filterMaterialComponents(options: {
  sourceFilter: 'all' | MaterialLibrarySource;
  enableMd2: boolean;
  enableMd3: boolean;
  searchQuery?: string;
}): MaterialComponentExample[] {
  const q = (options.searchQuery || '').trim().toLowerCase();
  return MATERIAL_COMPONENT_EXAMPLES.filter((item) => {
    if (item.source === 'md2' && !options.enableMd2) return false;
    if (item.source === 'md3' && !options.enableMd3) return false;
    if (options.sourceFilter !== 'all' && item.source !== options.sourceFilter) {
      return false;
    }
    if (!q) return true;
    return (
      item.title.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.componentTag.toLowerCase().includes(q) ||
      item.sourceLabel.toLowerCase().includes(q)
    );
  });
}

export function filterMaterialStyleEntries(options: {
  enableMd2: boolean;
  enableMd3: boolean;
  sourceFilter?: 'all' | MaterialLibrarySource;
  searchQuery?: string;
  selectedComponentTag?: string;
}): MaterialStyleEntry[] {
  const q = (options.searchQuery || '').trim().toLowerCase();
  return MATERIAL_STYLE_ENTRIES.filter((entry) => {
    // Strictly never expose emotion generated class hashes
    if (/\.css-[a-z0-9]+/i.test(entry.name)) return false;
    if (entry.source === 'md2' && !options.enableMd2) return false;
    if (entry.source === 'md3' && !options.enableMd3) return false;
    if (
      options.sourceFilter &&
      options.sourceFilter !== 'all' &&
      entry.source !== options.sourceFilter
    ) {
      return false;
    }
    if (q) {
      return (
        entry.name.toLowerCase().includes(q) ||
        entry.description.toLowerCase().includes(q) ||
        entry.kind.toLowerCase().includes(q) ||
        (entry.componentScope || '').toLowerCase().includes(q)
      );
    }
    if (options.selectedComponentTag && entry.componentScope) {
      return (
        entry.componentScope.toLowerCase() ===
        options.selectedComponentTag.toLowerCase()
      );
    }
    return true;
  });
}

export interface DetectedUsedLibraries {
  usesMuiV9: boolean;
  usesMd2: boolean;
  usesMd3: boolean;
  usesBootstrapV4: boolean;
  usesBootstrapV5: boolean;
  md3Modules: string[];
}

export function detectUsedLibrariesInTree(nodes: NodesMap): DetectedUsedLibraries {
  let usesMuiV9 = false;
  let usesMd2 = false;
  let usesMd3 = false;
  let usesBootstrapV4 = false;
  let usesBootstrapV5 = false;
  const md3ModuleSet = new Set<string>();

  for (const node of Object.values(nodes)) {
    const cls = node.props?.className || '';
    if (node.sourceLibrary === 'mui-v9' || node.materialMeta?.componentTag) {
      usesMuiV9 = true;
    }
    if (node.sourceLibrary === 'md2' || /\bmdc-[a-z0-9_-]+/.test(cls)) {
      usesMd2 = true;
    }
    if (node.sourceLibrary === 'md3' || node.materialMeta?.mdCustomTag) {
      usesMd3 = true;
      const tag = node.materialMeta?.mdCustomTag;
      if (tag === 'md-filled-button') {
        md3ModuleSet.add('@material/web/button/filled-button.js');
      } else if (tag === 'md-outlined-button') {
        md3ModuleSet.add('@material/web/button/outlined-button.js');
      } else if (tag === 'md-outlined-text-field') {
        md3ModuleSet.add('@material/web/textfield/outlined-text-field.js');
      } else if (tag === 'md-switch') {
        md3ModuleSet.add('@material/web/switch/switch.js');
      } else if (tag === 'md-assist-chip') {
        md3ModuleSet.add('@material/web/chips/assist-chip.js');
      } else {
        md3ModuleSet.add('@material/web/all.js');
      }
    }
    if (node.sourceLibrary === 'bootstrap-4.6.2') {
      usesBootstrapV4 = true;
    }
    if (node.sourceLibrary === 'bootstrap-5.2.3') {
      usesBootstrapV5 = true;
    }
  }

  return {
    usesMuiV9,
    usesMd2,
    usesMd3,
    usesBootstrapV4,
    usesBootstrapV5,
    md3Modules: Array.from(md3ModuleSet),
  };
}

export function updateNodeMaterialMetaInTree(
  nodes: NodesMap,
  nodeId: string,
  updater: (curr: MaterialNodeMeta) => MaterialNodeMeta
): NodesMap {
  const target = nodes[nodeId];
  if (!target) return nodes;
  const nextMeta = updater(target.materialMeta || {});
  return {
    ...nodes,
    [nodeId]: {
      ...target,
      materialMeta: nextMeta,
    },
  };
}

const escapeAttr = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const escapeText = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function renderMaterialOrPlainNodeHtml(
  nodes: NodesMap,
  id: string,
  indent = '  '
): string {
  const node = nodes[id];
  if (!node || (id !== 'root' && node.hidden)) return '';
  const props = node.props || {};
  const cls = (props.className || '').replace(/\s+/g, ' ').trim();

  // MD3 Custom element rendering
  const mdTag = node.materialMeta?.mdCustomTag;
  if (node.sourceLibrary === 'md3' && mdTag) {
    let attrs = ` data-node-id="${escapeAttr(id)}"`;
    if (cls) attrs += ` class="${escapeAttr(cls)}"`;
    if (props.placeholder && mdTag.includes('text-field')) {
      attrs += ` placeholder="${escapeAttr(props.placeholder)}"`;
    }
    if (node.htmlAttrs) {
      for (const [k, v] of Object.entries(node.htmlAttrs)) {
        if (/^[a-zA-Z_:][a-zA-Z0-9_.:-]*$/.test(k)) {
          attrs += ` ${k}="${escapeAttr(v)}"`;
        }
      }
    }
    const text =
      mdTag === 'md-filled-button' || mdTag === 'md-outlined-button'
        ? escapeText(node.content || 'Button')
        : '';
    return `${indent}<${mdTag}${attrs}>${text}</${mdTag}>\n`;
  }

  let attrStr = ` data-node-id="${escapeAttr(id)}"`;
  if (cls) attrStr += ` class="${escapeAttr(cls)}"`;
  if (node.themeOverrides && Object.keys(node.themeOverrides).length > 0) {
    attrStr += ` data-theme-scope="${escapeAttr(id)}"`;
  }
  if (node.htmlAttrs) {
    for (const [k, v] of Object.entries(node.htmlAttrs)) {
      if (/^[a-zA-Z_:][a-zA-Z0-9_.:-]*$/.test(k)) {
        attrStr += ` ${k}="${escapeAttr(v)}"`;
      }
    }
  }
  if (node.type === 'Input' && props.placeholder) {
    attrStr += ` placeholder="${escapeAttr(props.placeholder)}"`;
  }
  if (node.type === 'Image' && props.src) {
    attrStr += ` src="${escapeAttr(props.src)}" alt="${escapeAttr(
      node.name || 'image'
    )}"`;
  }

  if (isContainerNodeType(node.type)) {
    const inner = node.children
      .map((childId) => renderMaterialOrPlainNodeHtml(nodes, childId, indent + '  '))
      .join('');
    return `${indent}<div${attrStr}>\n${inner}${indent}</div>\n`;
  }
  if (node.type === 'Heading') {
    return `${indent}<h2${attrStr}>${escapeText(node.content || '')}</h2>\n`;
  }
  if (node.type === 'Text') {
    return `${indent}<p${attrStr}>${escapeText(node.content || '')}</p>\n`;
  }
  if (node.type === 'Badge') {
    return `${indent}<span${attrStr}>${escapeText(node.content || '')}</span>\n`;
  }
  if (node.type === 'Button') {
    const label =
      node.sourceLibrary === 'md2'
        ? `<span class="mdc-button__ripple"></span><span class="mdc-button__label">${escapeText(
            node.content || ''
          )}</span>`
        : escapeText(node.content || '');
    return `${indent}<button type="button"${attrStr}>${label}</button>\n`;
  }
  if (node.type === 'Input') {
    if (node.sourceLibrary === 'md2') {
      return `${indent}<label class="mdc-text-field mdc-text-field--filled" data-mdc-auto-init="MDCTextField" data-node-id="${escapeAttr(id)}"><span class="mdc-text-field__ripple"></span><input class="mdc-text-field__input" type="text" placeholder="${escapeAttr(
        props.placeholder || ''
      )}" /><span class="mdc-line-ripple"></span></label>\n`;
    }
    return `${indent}<input type="text"${attrStr} />\n`;
  }
  if (node.type === 'Image') {
    return `${indent}<img${attrStr} />\n`;
  }
  return '';
}

export function buildConditionalPlainHtmlDocument(params: {
  nodes: NodesMap;
  themeVars: ThemeVariable[];
  sharedThemeCss: string;
  seo?: SeoMetadata;
  bootstrapVersion?: BootstrapVersion | null;
  forceMd2Assets?: boolean;
  forceMd3Modules?: string[];
  snippetHtmlOverride?: string;
}): string {
  const {
    nodes,
    themeVars,
    sharedThemeCss,
    seo,
    bootstrapVersion,
    forceMd2Assets = false,
    forceMd3Modules = [],
    snippetHtmlOverride,
  } = params;

  const detected = detectUsedLibrariesInTree(nodes);
  const includeMd2 = forceMd2Assets || detected.usesMd2;
  const md3Modules = Array.from(
    new Set([...detected.md3Modules, ...forceMd3Modules])
  );
  const includeMd3 = md3Modules.length > 0 || detected.usesMd3;

  const mdTokenRules: string[] = [];
  for (const node of Object.values(nodes)) {
    const tokens = node.materialMeta?.mdTokens;
    if (tokens && Object.keys(tokens).length > 0) {
      const entries = Object.entries(tokens)
        .map(([k, v]) => `  ${k}: ${v};`)
        .join('\n');
      mdTokenRules.push(`[data-node-id="${node.id}"] {\n${entries}\n}`);
    }
  }

  const combinedCss = [
    buildThemeCssRules(themeVars),
    buildScopedThemeOverrideCssRules(nodes, 'data-theme-scope'),
    sharedThemeCss.trim(),
    buildElementCustomStyleCssRules(nodes),
    ...mdTokenRules,
  ]
    .filter(Boolean)
    .join('\n');

  const headAssets: string[] = [];
  if (bootstrapVersion) {
    const bs = getBootstrapAssets(bootstrapVersion);
    headAssets.push(
      `  <link rel="stylesheet" href="${escapeAttr(bs.cssUrl)}" data-bootstrap-version="${bootstrapVersion}" />`
    );
  }
  if (includeMd2) {
    headAssets.push(
      `  <link rel="stylesheet" href="${escapeAttr(MATERIAL_LIBRARY_ASSETS.md2.cssUrl)}" data-material-library="md2" />`,
      `  <link rel="stylesheet" href="${escapeAttr(MATERIAL_LIBRARY_ASSETS.md2.iconsUrl)}" data-material-library="md2" />`
    );
  }
  if (includeMd3) {
    const imports =
      md3Modules.length > 0 ? md3Modules : ['@material/web/all.js'];
    headAssets.push(
      `  <link rel="stylesheet" href="${escapeAttr(MATERIAL_LIBRARY_ASSETS.md3.robotoUrl)}" data-material-library="md3" />`,
      `  <link rel="stylesheet" href="${escapeAttr(MATERIAL_LIBRARY_ASSETS.md3.symbolsUrl)}" data-material-library="md3" />`,
      `  <script type="importmap" data-material-library="md3">\n    {\n      "imports": {\n        "@material/web/": "${MATERIAL_LIBRARY_ASSETS.md3.importMapPrefix}"\n      }\n    }\n  </script>`,
      `  <script type="module" data-material-library="md3">\n${imports
        .map((m) => `    import '${m}';`)
        .join('\n')}\n  </script>`
    );
  }

  const bodyScripts: string[] = [];
  if (bootstrapVersion) {
    const bs = getBootstrapAssets(bootstrapVersion);
    for (const url of bs.scriptUrls) {
      bodyScripts.push(
        `  <script src="${escapeAttr(url)}" data-bootstrap-version="${bootstrapVersion}"></script>`
      );
    }
  }
  if (includeMd2) {
    bodyScripts.push(
      `  <script src="${escapeAttr(MATERIAL_LIBRARY_ASSETS.md2.jsUrl)}" data-material-library="md2"></script>`,
      `  <script data-material-library="md2-init">\n    document.querySelectorAll('.mdc-button').forEach(function(el) { if (window.mdc && mdc.ripple) new mdc.ripple.MDCRipple(el); });\n    document.querySelectorAll('.mdc-text-field').forEach(function(el) { if (window.mdc && mdc.textField) new mdc.textField.MDCTextField(el); });\n  </script>`
    );
  }

  const bodyHtml = snippetHtmlOverride
    ? `  <div class="p-3">\n${snippetHtmlOverride}\n  </div>\n`
    : renderMaterialOrPlainNodeHtml(nodes, 'root', '  ');

  const title = seo?.title?.trim() || 'Plain HTML Preview';
  return `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeText(title)}</title>
${headAssets.join('\n')}
${combinedCss ? `  <style>\n${combinedCss}\n  </style>` : ''}
</head>
<body style="margin:0;padding:16px;font-family:Roboto,system-ui,sans-serif;background:#f8fafc;">
${bodyHtml}${bodyScripts.join('\n')}
</body>
</html>`;
}

export function generateMuiReactJsxExport(
  nodes: NodesMap,
  themeVars: ThemeVariable[],
  pretty = true
): string {
  const usedMuiImports = new Set<string>(['Box', 'ThemeProvider', 'createTheme']);
  for (const node of Object.values(nodes)) {
    const tag = node.materialMeta?.componentTag;
    if (!tag) continue;
    if (tag === 'Card') {
      usedMuiImports.add('Card');
      usedMuiImports.add('CardContent');
      usedMuiImports.add('Typography');
    } else if (tag === 'NumberField' || tag === 'Menubar') {
      usedMuiImports.add('TextField');
      usedMuiImports.add('Button');
    } else {
      usedMuiImports.add(tag);
    }
  }

  const primaryColor =
    themeVars.find((v) => v.name === '--color-primary')?.value || '#2563eb';
  const secondaryColor =
    themeVars.find((v) => v.name === '--color-secondary')?.value || '#64748b';

  const renderJsxNode = (id: string, depth: number): string => {
    const node = nodes[id];
    if (!node || (id !== 'root' && node.hidden)) return '';
    const indent = '  '.repeat(depth);
    const meta = node.materialMeta;
    const tag = meta?.componentTag;

    const sxParts: string[] = [];
    if (meta?.slotOverrides) {
      for (const [selector, rule] of Object.entries(meta.slotOverrides)) {
        sxParts.push(`'& ${selector}': ${rule}`);
      }
    }
    const sxAttr = sxParts.length > 0 ? ` sx={{ ${sxParts.join(', ')} }}` : '';

    if (tag === 'Button') {
      const variant = meta?.muiProps?.variant || 'contained';
      const color = meta?.muiProps?.color || 'primary';
      const size = meta?.muiProps?.size || 'medium';
      return `${indent}<Button variant="${variant}" color="${color}" size="${size}"${sxAttr}>${escapeText(
        node.content || 'Button'
      )}</Button>`;
    }
    if (tag === 'TextField') {
      const label = meta?.muiProps?.label || node.name || 'Pole';
      const variant = meta?.muiProps?.variant || 'outlined';
      return `${indent}<TextField label="${escapeAttr(
        String(label)
      )}" placeholder="${escapeAttr(
        node.props?.placeholder || ''
      )}" variant="${variant}" size="${meta?.muiProps?.size || 'small'}"${sxAttr} />`;
    }
    if (tag === 'Alert') {
      const severity = meta?.muiProps?.severity || 'info';
      const variant = meta?.muiProps?.variant || 'standard';
      return `${indent}<Alert severity="${severity}" variant="${variant}"${sxAttr}>${escapeText(
        node.content || ''
      )}</Alert>`;
    }
    if (tag === 'Chip') {
      const variant = meta?.muiProps?.variant || 'filled';
      const color = meta?.muiProps?.color || 'primary';
      return `${indent}<Chip label="${escapeAttr(
        node.content || 'Chip'
      )}" variant="${variant}" color="${color}"${sxAttr} />`;
    }
    if (tag === 'Switch') {
      const color = meta?.muiProps?.color || 'primary';
      return `${indent}<Switch defaultChecked color="${color}"${sxAttr} />`;
    }

    const childrenCode = node.children
      .map((cid) => renderJsxNode(cid, depth + 1))
      .filter(Boolean)
      .join(pretty ? '\n' : '');

    if (tag === 'Card') {
      return `${indent}<Card variant="${meta?.muiProps?.variant || 'elevation'}"${sxAttr}>\n${indent}  <CardContent>\n${childrenCode}\n${indent}  </CardContent>\n${indent}</Card>`;
    }

    if (isContainerNodeType(node.type)) {
      const clsAttr = node.props?.className
        ? ` className="${node.props.className}"`
        : '';
      return childrenCode
        ? `${indent}<Box${clsAttr}>\n${childrenCode}\n${indent}</Box>`
        : `${indent}<Box${clsAttr} />`;
    }

    const clsAttr = node.props?.className
      ? ` className="${node.props.className}"`
      : '';
    return `${indent}<Box${clsAttr}>${escapeText(node.content || '')}</Box>`;
  };

  const importList = Array.from(usedMuiImports).sort().join(', ');
  const treeCode = renderJsxNode('root', 3);

  const code = `import React from 'react';
import { ${importList} } from '@mui/material';

const muiTheme = createTheme({
  palette: {
    primary: { main: '${primaryColor}' },
    secondary: { main: '${secondaryColor}' },
  },
});

export function GeneratedMuiPage() {
  return (
    <ThemeProvider theme={muiTheme}>
${treeCode}
    </ThemeProvider>
  );
}
`;

  if (!pretty) {
    return code.replace(/\n\s*/g, ' ').replace(/\s{2,}/g, ' ').trim();
  }
  return code;
}
