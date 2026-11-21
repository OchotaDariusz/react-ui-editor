import type {
  BootstrapVersion,
  NodeBlueprint,
  NodesMap,
  SeoMetadata,
  ThemeVariable,
} from '../types/editor';
import { buildThemeCssRules, isContainerNodeType } from './editorLogic';
import { buildElementCustomStyleCssRules } from './cssEditor';
import { buildScopedThemeOverrideCssRules } from './themeUsage';

export const BOOTSTRAP_VERSION_STORAGE_KEY =
  'react_ui_editor_bootstrap_version_v1';

export type BootstrapComponentCategory = 'Components' | 'Forms' | 'Layout';
export type BootstrapClassCategory =
  | 'Components'
  | 'Layout'
  | 'Forms'
  | 'Utilities'
  | 'Helpers';

export interface BootstrapAssetBundle {
  version: BootstrapVersion;
  label: string;
  cssUrl: string;
  scriptUrls: string[];
  dependencyNote: string;
  docsBaseUrl: string;
}

export interface BootstrapComponentExample {
  id: string;
  version: BootstrapVersion;
  category: BootstrapComponentCategory;
  title: string;
  description: string;
  docsUrl: string;
  html: string;
  blueprint: NodeBlueprint;
}

export interface BootstrapClassEntry {
  className: string;
  version: BootstrapVersion;
  category: BootstrapClassCategory;
  description: string;
  exampleHtml: string;
}

export const BOOTSTRAP_ASSETS: Record<BootstrapVersion, BootstrapAssetBundle> = {
  '4.6.2': {
    version: '4.6.2',
    label: 'Bootstrap v4 (4.6.2)',
    cssUrl:
      'https://cdn.jsdelivr.net/npm/bootstrap@4.6.2/dist/css/bootstrap.min.css',
    scriptUrls: [
      'https://cdn.jsdelivr.net/npm/jquery@3.5.1/dist/jquery.slim.min.js',
      'https://cdn.jsdelivr.net/npm/bootstrap@4.6.2/dist/js/bootstrap.bundle.min.js',
    ],
    dependencyNote:
      'Ładuje Bootstrap 4.6.2 CSS + jQuery 3.5.1 slim + Bootstrap Bundle JS (Popper v1).',
    docsBaseUrl:
      'https://github.com/twbs/bootstrap/tree/v4.6.2/site/content/docs/4.6',
  },
  '5.2.3': {
    version: '5.2.3',
    label: 'Bootstrap v5 (5.2.3)',
    cssUrl:
      'https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/css/bootstrap.min.css',
    scriptUrls: [
      'https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/js/bootstrap.bundle.min.js',
    ],
    dependencyNote:
      'Ładuje Bootstrap 5.2.3 CSS + Bootstrap Bundle JS (Popper v2, bez jQuery).',
    docsBaseUrl:
      'https://github.com/twbs/bootstrap/tree/v5.2.3/site/content/docs/5.2',
  },
};

export function getBootstrapAssets(
  version: BootstrapVersion
): BootstrapAssetBundle {
  return BOOTSTRAP_ASSETS[version];
}

export const BOOTSTRAP_COMPONENT_EXAMPLES: BootstrapComponentExample[] = [
  // ======================== Bootstrap 4.6.2 ========================
  {
    id: 'bs4-alert-dismissible',
    version: '4.6.2',
    category: 'Components',
    title: 'Dismissible Alert (4.6)',
    description:
      'Komunikat alert-warning z przyciskiem zamykania (.close i data-dismiss="alert").',
    docsUrl:
      'https://github.com/twbs/bootstrap/tree/v4.6.2/site/content/docs/4.6/components/alerts.md',
    html: `<div class="alert alert-warning alert-dismissible fade show" role="alert">\n  <strong>Holy guacamole!</strong> Sprawdź pola formularza poniżej.\n  <button type="button" class="close" data-dismiss="alert" aria-label="Close">\n    <span aria-hidden="true">&times;</span>\n  </button>\n</div>`,
    blueprint: {
      type: 'Container',
      name: 'BS4 Alert',
      props: {
        className: 'alert alert-warning alert-dismissible fade show',
      },
      htmlAttrs: { role: 'alert' },
      children: [
        {
          type: 'Text',
          name: 'Alert Text',
          content: 'Holy guacamole! Sprawdź pola formularza poniżej.',
          props: { className: 'mb-0 pr-4' },
        },
        {
          type: 'Button',
          name: 'Close Alert Button',
          content: '×',
          props: { className: 'close' },
          htmlAttrs: { 'data-dismiss': 'alert', 'aria-label': 'Close' },
        },
      ],
    },
  },
  {
    id: 'bs4-card',
    version: '4.6.2',
    category: 'Components',
    title: 'Card Component (4.6)',
    description:
      'Karta Bootstrap 4 (.card, .card-body, .card-title, .card-text) z przyciskiem .btn-primary.',
    docsUrl:
      'https://github.com/twbs/bootstrap/tree/v4.6.2/site/content/docs/4.6/components/card.md',
    html: `<div class="card shadow-sm">\n  <div class="card-body">\n    <span class="badge badge-pill badge-primary mb-2">Nowość 4.6</span>\n    <h5 class="card-title">Card title</h5>\n    <p class="card-text">Some quick example text to build on the card title and make up the bulk of the card's content.</p>\n    <button type="button" class="btn btn-primary">Go somewhere</button>\n  </div>\n</div>`,
    blueprint: {
      type: 'Container',
      name: 'BS4 Card',
      props: { className: 'card shadow-sm' },
      children: [
        {
          type: 'Container',
          name: 'Card Body',
          props: { className: 'card-body' },
          children: [
            {
              type: 'Badge',
              name: 'Card Badge',
              content: 'Nowość 4.6',
              props: { className: 'badge badge-pill badge-primary mb-2' },
            },
            {
              type: 'Heading',
              name: 'Card Title',
              content: 'Card title',
              props: { className: 'card-title h5' },
            },
            {
              type: 'Text',
              name: 'Card Text',
              content:
                "Some quick example text to build on the card title and make up the bulk of the card's content.",
              props: { className: 'card-text' },
            },
            {
              type: 'Button',
              name: 'Card CTA',
              content: 'Go somewhere',
              props: { className: 'btn btn-primary' },
            },
          ],
        },
      ],
    },
  },
  {
    id: 'bs4-jumbotron',
    version: '4.6.2',
    category: 'Components',
    title: 'Jumbotron Banner (4.6)',
    description:
      'Sekcja powitalna .jumbotron z klasami typograficznymi .display-4 i .lead.',
    docsUrl:
      'https://github.com/twbs/bootstrap/tree/v4.6.2/site/content/docs/4.6/components/jumbotron.md',
    html: `<div class="jumbotron">\n  <h1 class="display-4">Hello, world!</h1>\n  <p class="lead">To jest prosty komponent hero w stylu Bootstrap 4 Jumbotron.</p>\n  <button type="button" class="btn btn-primary btn-lg">Learn more</button>\n</div>`,
    blueprint: {
      type: 'Container',
      name: 'BS4 Jumbotron',
      props: { className: 'jumbotron' },
      children: [
        {
          type: 'Heading',
          name: 'Jumbotron Title',
          content: 'Hello, world!',
          props: { className: 'display-4' },
        },
        {
          type: 'Text',
          name: 'Jumbotron Lead',
          content: 'To jest prosty komponent hero w stylu Bootstrap 4 Jumbotron.',
          props: { className: 'lead' },
        },
        {
          type: 'Button',
          name: 'Learn More CTA',
          content: 'Learn more',
          props: { className: 'btn btn-primary btn-lg' },
        },
      ],
    },
  },
  {
    id: 'bs4-form-group',
    version: '4.6.2',
    category: 'Forms',
    title: 'Form Group & Switch (4.6)',
    description:
      'Formularz Bootstrap 4 z .form-group, .form-control oraz .btn-success.',
    docsUrl:
      'https://github.com/twbs/bootstrap/tree/v4.6.2/site/content/docs/4.6/components/forms.md',
    html: `<div class="card p-4">\n  <div class="form-group">\n    <label>Adres e-mail</label>\n    <input type="email" class="form-control" placeholder="name@example.com" />\n  </div>\n  <div class="form-group">\n    <label>Hasło</label>\n    <input type="password" class="form-control" placeholder="Minimum 8 znaków" />\n  </div>\n  <button type="button" class="btn btn-primary">Zaloguj się</button>\n</div>`,
    blueprint: {
      type: 'Container',
      name: 'BS4 Form Card',
      props: { className: 'card p-4' },
      children: [
        {
          type: 'Container',
          name: 'Email Form Group',
          props: { className: 'form-group' },
          children: [
            {
              type: 'Text',
              name: 'Email Label',
              content: 'Adres e-mail',
              props: { className: 'font-weight-bold mb-1' },
            },
            {
              type: 'Input',
              name: 'Email Input',
              props: {
                className: 'form-control',
                placeholder: 'name@example.com',
              },
            },
          ],
        },
        {
          type: 'Container',
          name: 'Password Form Group',
          props: { className: 'form-group' },
          children: [
            {
              type: 'Text',
              name: 'Password Label',
              content: 'Hasło',
              props: { className: 'font-weight-bold mb-1' },
            },
            {
              type: 'Input',
              name: 'Password Input',
              props: {
                className: 'form-control',
                placeholder: 'Minimum 8 znaków',
              },
            },
          ],
        },
        {
          type: 'Button',
          name: 'Submit Button',
          content: 'Zaloguj się',
          props: { className: 'btn btn-primary' },
        },
      ],
    },
  },
  {
    id: 'bs4-grid-layout',
    version: '4.6.2',
    category: 'Layout',
    title: 'Two-Column Grid Row (4.6)',
    description:
      'Siatka Bootstrap 4 (.container, .row, .col-md-6) z utility spacing .mb-3 i .ml-auto.',
    docsUrl:
      'https://github.com/twbs/bootstrap/tree/v4.6.2/site/content/docs/4.6/layout/grid.md',
    html: `<div class="container py-3">\n  <div class="row">\n    <div class="col-md-6 mb-3">\n      <div class="p-3 border bg-light rounded">Kolumna 1 (.col-md-6)</div>\n    </div>\n    <div class="col-md-6 mb-3">\n      <div class="p-3 border bg-light rounded">Kolumna 2 (.col-md-6)</div>\n    </div>\n  </div>\n</div>`,
    blueprint: {
      type: 'Container',
      name: 'BS4 Grid Container',
      props: { className: 'container py-3' },
      children: [
        {
          type: 'Container',
          name: 'Grid Row',
          props: { className: 'row' },
          children: [
            {
              type: 'Container',
              name: 'Col Left',
              props: { className: 'col-md-6 mb-3' },
              children: [
                {
                  type: 'Text',
                  name: 'Col 1 Box',
                  content: 'Kolumna 1 (.col-md-6)',
                  props: { className: 'p-3 border bg-light rounded mb-0' },
                },
              ],
            },
            {
              type: 'Container',
              name: 'Col Right',
              props: { className: 'col-md-6 mb-3' },
              children: [
                {
                  type: 'Text',
                  name: 'Col 2 Box',
                  content: 'Kolumna 2 (.col-md-6)',
                  props: { className: 'p-3 border bg-light rounded mb-0' },
                },
              ],
            },
          ],
        },
      ],
    },
  },

  // ======================== Bootstrap 5.2.3 ========================
  {
    id: 'bs5-alert-dismissible',
    version: '5.2.3',
    category: 'Components',
    title: 'Dismissible Alert (5.2)',
    description:
      'Alert Bootstrap 5.2 z przyciskiem .btn-close i atrybutem data-bs-dismiss="alert".',
    docsUrl:
      'https://github.com/twbs/bootstrap/tree/v5.2.3/site/content/docs/5.2/components/alerts.md',
    html: `<div class="alert alert-primary alert-dismissible fade show" role="alert">\n  Powiadomienie Bootstrap 5.2.3 — kliknij przycisk, aby zamknąć.\n  <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>\n</div>`,
    blueprint: {
      type: 'Container',
      name: 'BS5 Alert',
      props: {
        className: 'alert alert-primary alert-dismissible fade show',
      },
      htmlAttrs: { role: 'alert' },
      children: [
        {
          type: 'Text',
          name: 'Alert Message',
          content: 'Powiadomienie Bootstrap 5.2.3 — kliknij przycisk, aby zamknąć.',
          props: { className: 'mb-0 pe-4' },
        },
        {
          type: 'Button',
          name: 'Close Button',
          content: '',
          props: { className: 'btn-close' },
          htmlAttrs: { 'data-bs-dismiss': 'alert', 'aria-label': 'Close' },
        },
      ],
    },
  },
  {
    id: 'bs5-card',
    version: '5.2.3',
    category: 'Components',
    title: 'Card & Text-Bg Badge (5.2)',
    description:
      'Karta Bootstrap 5.2 (.card) ze zunifikowaną plakietką .text-bg-primary i .rounded-pill.',
    docsUrl:
      'https://github.com/twbs/bootstrap/tree/v5.2.3/site/content/docs/5.2/components/card.md',
    html: `<div class="card shadow-sm">\n  <div class="card-body">\n    <span class="badge rounded-pill text-bg-primary mb-2">Bootstrap 5.2</span>\n    <h5 class="card-title fw-semibold">Card title</h5>\n    <p class="card-text text-secondary">Przykładowa karta komponentu oparta na oficjalnej dokumentacji Bootstrap 5.2.3.</p>\n    <button type="button" class="btn btn-primary">Akcja główna</button>\n  </div>\n</div>`,
    blueprint: {
      type: 'Container',
      name: 'BS5 Card',
      props: { className: 'card shadow-sm' },
      children: [
        {
          type: 'Container',
          name: 'Card Body',
          props: { className: 'card-body' },
          children: [
            {
              type: 'Badge',
              name: 'Text-Bg Badge',
              content: 'Bootstrap 5.2',
              props: { className: 'badge rounded-pill text-bg-primary mb-2' },
            },
            {
              type: 'Heading',
              name: 'Card Title',
              content: 'Card title',
              props: { className: 'card-title h5 fw-semibold' },
            },
            {
              type: 'Text',
              name: 'Card Description',
              content:
                'Przykładowa karta komponentu oparta na oficjalnej dokumentacji Bootstrap 5.2.3.',
              props: { className: 'card-text text-secondary' },
            },
            {
              type: 'Button',
              name: 'Card CTA',
              content: 'Akcja główna',
              props: { className: 'btn btn-primary' },
            },
          ],
        },
      ],
    },
  },
  {
    id: 'bs5-accordion',
    version: '5.2.3',
    category: 'Components',
    title: 'Interactive Accordion (5.2)',
    description:
      'Interaktywny Accordion Bootstrap 5 z atrybutami data-bs-toggle="collapse" i data-bs-target.',
    docsUrl:
      'https://github.com/twbs/bootstrap/tree/v5.2.3/site/content/docs/5.2/components/accordion.md',
    html: `<div class="accordion" id="accordionExample">\n  <div class="accordion-item">\n    <h2 class="accordion-header" id="headingOne">\n      <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapseOne" aria-expanded="true" aria-controls="collapseOne">\n        Accordion Item #1\n      </button>\n    </h2>\n    <div id="collapseOne" class="accordion-collapse collapse show" aria-labelledby="headingOne" data-bs-parent="#accordionExample">\n      <div class="accordion-body">Treść panelu Accordion w Bootstrap 5.2.3.</div>\n    </div>\n  </div>\n</div>`,
    blueprint: {
      type: 'Container',
      name: 'BS5 Accordion',
      props: { className: 'accordion' },
      htmlAttrs: { id: 'accordionExample' },
      children: [
        {
          type: 'Container',
          name: 'Accordion Item #1',
          props: { className: 'accordion-item' },
          children: [
            {
              type: 'Button',
              name: 'Accordion Trigger',
              content: 'Accordion Item #1',
              props: { className: 'accordion-button' },
              htmlAttrs: {
                'data-bs-toggle': 'collapse',
                'data-bs-target': '#collapseOne',
                'aria-expanded': 'true',
                'aria-controls': 'collapseOne',
              },
            },
            {
              type: 'Container',
              name: 'Accordion Collapse',
              props: { className: 'accordion-collapse collapse show' },
              htmlAttrs: {
                id: 'collapseOne',
                'data-bs-parent': '#accordionExample',
              },
              children: [
                {
                  type: 'Text',
                  name: 'Accordion Body',
                  content: 'Treść panelu Accordion w Bootstrap 5.2.3.',
                  props: { className: 'accordion-body mb-0' },
                },
              ],
            },
          ],
        },
      ],
    },
  },
  {
    id: 'bs5-floating-form',
    version: '5.2.3',
    category: 'Forms',
    title: 'Floating Label & Input Group (5.2)',
    description:
      'Formularz Bootstrap 5.2 z .form-floating, .form-control oraz przyciskiem .btn-primary.',
    docsUrl:
      'https://github.com/twbs/bootstrap/tree/v5.2.3/site/content/docs/5.2/forms/floating-labels.md',
    html: `<div class="card p-4 vstack gap-3">\n  <div class="form-floating">\n    <input type="email" class="form-control" id="floatingInput" placeholder="name@example.com" />\n    <label for="floatingInput">Email address</label>\n  </div>\n  <div class="input-group">\n    <span class="input-group-text">@</span>\n    <input type="text" class="form-control" placeholder="Username" />\n  </div>\n  <button type="button" class="btn btn-primary">Wyślij formularz</button>\n</div>`,
    blueprint: {
      type: 'Container',
      name: 'BS5 Form Stack',
      props: { className: 'card p-4 vstack gap-3' },
      children: [
        {
          type: 'Text',
          name: 'Form Heading',
          content: 'Formularz kontaktowy',
          props: { className: 'form-label fw-semibold mb-0' },
        },
        {
          type: 'Input',
          name: 'Email Field',
          props: {
            className: 'form-control',
            placeholder: 'name@example.com',
          },
        },
        {
          type: 'Container',
          name: 'Username Input Group',
          props: { className: 'input-group' },
          children: [
            {
              type: 'Badge',
              name: 'Prefix At',
              content: '@',
              props: { className: 'input-group-text' },
            },
            {
              type: 'Input',
              name: 'Username Input',
              props: {
                className: 'form-control',
                placeholder: 'Username',
              },
            },
          ],
        },
        {
          type: 'Button',
          name: 'Form Submit CTA',
          content: 'Wyślij formularz',
          props: { className: 'btn btn-primary' },
        },
      ],
    },
  },
  {
    id: 'bs5-gutter-grid',
    version: '5.2.3',
    category: 'Layout',
    title: 'Grid Row with Gutters g-3 & Stack (5.2)',
    description:
      'Siatka Bootstrap 5.2 (.container, .row.g-3, .col-md-6) z odstępami g-3 i wyrównaniem ms-auto.',
    docsUrl:
      'https://github.com/twbs/bootstrap/tree/v5.2.3/site/content/docs/5.2/layout/grid.md',
    html: `<div class="container py-3">\n  <div class="row g-3">\n    <div class="col-md-6">\n      <div class="p-3 border bg-light rounded-3">Kolumna 1 (.col-md-6 · g-3)</div>\n    </div>\n    <div class="col-md-6">\n      <div class="p-3 border bg-light rounded-3">Kolumna 2 (.col-md-6 · g-3)</div>\n    </div>\n  </div>\n</div>`,
    blueprint: {
      type: 'Container',
      name: 'BS5 Grid Container',
      props: { className: 'container py-3' },
      children: [
        {
          type: 'Container',
          name: 'Grid Row Gutters',
          props: { className: 'row g-3' },
          children: [
            {
              type: 'Container',
              name: 'Grid Col 1',
              props: { className: 'col-md-6' },
              children: [
                {
                  type: 'Text',
                  name: 'Box 1',
                  content: 'Kolumna 1 (.col-md-6 · g-3)',
                  props: { className: 'p-3 border bg-light rounded-3 mb-0' },
                },
              ],
            },
            {
              type: 'Container',
              name: 'Grid Col 2',
              props: { className: 'col-md-6' },
              children: [
                {
                  type: 'Text',
                  name: 'Box 2',
                  content: 'Kolumna 2 (.col-md-6 · g-3)',
                  props: { className: 'p-3 border bg-light rounded-3 mb-0' },
                },
              ],
            },
          ],
        },
      ],
    },
  },
];

export const BOOTSTRAP_CLASSES_BY_VERSION: BootstrapClassEntry[] = [
  // ======================== Bootstrap 4.6.2 Classes ========================
  {
    className: 'btn btn-primary',
    version: '4.6.2',
    category: 'Components',
    description: 'Podstawowy przycisk akcji Bootstrap 4.6',
    exampleHtml: '<button type="button" class="btn btn-primary">Primary</button>',
  },
  {
    className: 'alert alert-warning alert-dismissible fade show',
    version: '4.6.2',
    category: 'Components',
    description: 'Zamykany alert v4.6 (używa .close i data-dismiss="alert")',
    exampleHtml:
      '<div class="alert alert-warning alert-dismissible fade show" role="alert">Uwaga!<button type="button" class="close" data-dismiss="alert">&times;</button></div>',
  },
  {
    className: 'badge badge-pill badge-primary',
    version: '4.6.2',
    category: 'Components',
    description: 'Zaokrąglona plakietka Bootstrap 4 (w v5 zastąpiona przez text-bg-*)',
    exampleHtml: '<span class="badge badge-pill badge-primary">New</span>',
  },
  {
    className: 'jumbotron',
    version: '4.6.2',
    category: 'Components',
    description: 'Duża sekcja hero z Bootstrap 4 (usunięta w v5 na rzecz utilities)',
    exampleHtml: '<div class="jumbotron"><h1 class="display-4">Hero</h1></div>',
  },
  {
    className: 'card',
    version: '4.6.2',
    category: 'Components',
    description: 'Elastyczny kontener treści z nagłówkiem i stopką',
    exampleHtml: '<div class="card"><div class="card-body">Treść karty</div></div>',
  },
  {
    className: 'media',
    version: '4.6.2',
    category: 'Components',
    description: 'Komponent obiektu medialnego (w v5 zastąpiony przez utilities flex)',
    exampleHtml: '<div class="media"><div class="media-body">Treść</div></div>',
  },
  {
    className: 'container',
    version: '4.6.2',
    category: 'Layout',
    description: 'Responsywny kontener wyśrodkowany o stałych progach max-width',
    exampleHtml: '<div class="container">Treść</div>',
  },
  {
    className: 'row',
    version: '4.6.2',
    category: 'Layout',
    description: 'Wiersz siatki grid grupujący kolumny (.col-*)',
    exampleHtml: '<div class="row"><div class="col-md-6">Col</div></div>',
  },
  {
    className: 'col-md-6',
    version: '4.6.2',
    category: 'Layout',
    description: 'Kolumna zajmująca połowę wiersza (6/12) od breakpointu md',
    exampleHtml: '<div class="col-md-6">Połowa szerokości</div>',
  },
  {
    className: 'form-group',
    version: '4.6.2',
    category: 'Forms',
    description: 'Kontener grupy pola formularza w v4 (w v5 używaj mb-3)',
    exampleHtml:
      '<div class="form-group"><label>Email</label><input class="form-control" /></div>',
  },
  {
    className: 'custom-control custom-switch',
    version: '4.6.2',
    category: 'Forms',
    description: 'Stylizowany przełącznik toggle w Bootstrap 4.6',
    exampleHtml:
      '<div class="custom-control custom-switch"><input type="checkbox" class="custom-control-input" id="sw1"><label class="custom-control-label" for="sw1">Switch</label></div>',
  },
  {
    className: 'ml-auto',
    version: '4.6.2',
    category: 'Utilities',
    description: 'Margin-left auto w v4 (w v5 zastąpione przez ms-auto)',
    exampleHtml: '<div class="ml-auto">Przesunięte w prawo</div>',
  },
  {
    className: 'mr-3',
    version: '4.6.2',
    category: 'Utilities',
    description: 'Margin-right 1rem w v4 (w v5 zastąpione przez me-3)',
    exampleHtml: '<span class="mr-3">Odstęp prawy</span>',
  },
  {
    className: 'font-weight-bold',
    version: '4.6.2',
    category: 'Utilities',
    description: 'Pogrubienie tekstu font-weight: 700 (w v5: fw-bold)',
    exampleHtml: '<p class="font-weight-bold">Pogrubiony tekst</p>',
  },
  {
    className: 'sr-only',
    version: '4.6.2',
    category: 'Utilities',
    description: 'Ukrywa wizualnie zachowując dostępność czytników (w v5: visually-hidden)',
    exampleHtml: '<span class="sr-only">Tylko dla czytników ekranu</span>',
  },

  // ======================== Bootstrap 5.2.3 Classes ========================
  {
    className: 'btn btn-primary',
    version: '5.2.3',
    category: 'Components',
    description: 'Podstawowy przycisk akcji Bootstrap 5.2',
    exampleHtml: '<button type="button" class="btn btn-primary">Primary</button>',
  },
  {
    className: 'btn-close',
    version: '5.2.3',
    category: 'Components',
    description: 'Przycisk zamknięcia alertów, modali i offcanvas w v5 (zastępuje .close)',
    exampleHtml:
      '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>',
  },
  {
    className: 'badge rounded-pill text-bg-primary',
    version: '5.2.3',
    category: 'Components',
    description: 'Plakietka pigułkowa v5.2 z kontrastowym helperem text-bg-primary',
    exampleHtml: '<span class="badge rounded-pill text-bg-primary">New</span>',
  },
  {
    className: 'accordion',
    version: '5.2.3',
    category: 'Components',
    description: 'Komponent zwijanych sekcji Accordion w Bootstrap 5',
    exampleHtml:
      '<div class="accordion"><div class="accordion-item"><button class="accordion-button" data-bs-toggle="collapse">Item</button></div></div>',
  },
  {
    className: 'card',
    version: '5.2.3',
    category: 'Components',
    description: 'Kontener karty treści Bootstrap 5.2',
    exampleHtml: '<div class="card"><div class="card-body">Treść karty</div></div>',
  },
  {
    className: 'container',
    version: '5.2.3',
    category: 'Layout',
    description: 'Responsywny kontener układu grid Bootstrap 5',
    exampleHtml: '<div class="container">Treść</div>',
  },
  {
    className: 'row g-3',
    version: '5.2.3',
    category: 'Layout',
    description: 'Wiersz grid ze wspólnym odstępem (gutter) poziomu 3',
    exampleHtml: '<div class="row g-3"><div class="col-md-6">Box</div></div>',
  },
  {
    className: 'col-md-6',
    version: '5.2.3',
    category: 'Layout',
    description: 'Kolumna zajmująca 6/12 wiersza od breakpointu md',
    exampleHtml: '<div class="col-md-6">Kolumna 50%</div>',
  },
  {
    className: 'form-floating',
    version: '5.2.3',
    category: 'Forms',
    description: 'Pływająca etykieta nad polem tekstowym Bootstrap 5',
    exampleHtml:
      '<div class="form-floating"><input type="email" class="form-control" id="fEmail" placeholder="a@b.pl" /><label for="fEmail">Email</label></div>',
  },
  {
    className: 'form-select',
    version: '5.2.3',
    category: 'Forms',
    description: 'Stylizowane pole wyboru <select> w Bootstrap 5 (zastępuje .custom-select)',
    exampleHtml:
      '<select class="form-select"><option selected>Wybierz...</option></select>',
  },
  {
    className: 'form-check form-switch',
    version: '5.2.3',
    category: 'Forms',
    description: 'Przełącznik switch w Bootstrap 5.2 Forms',
    exampleHtml:
      '<div class="form-check form-switch"><input class="form-check-input" type="checkbox" role="switch" id="flexSwitch" /><label class="form-check-label" for="flexSwitch">Aktywuj</label></div>',
  },
  {
    className: 'ms-auto',
    version: '5.2.3',
    category: 'Utilities',
    description: 'Logiczny margin-inline-start: auto w RTL/LTR (zastępuje ml-auto)',
    exampleHtml: '<div class="ms-auto">Przesunięte do końca linii</div>',
  },
  {
    className: 'fw-semibold',
    version: '5.2.3',
    category: 'Utilities',
    description: 'Półgruby font (600) dodany w Bootstrap 5.2 Utilities',
    exampleHtml: '<p class="fw-semibold">Nagłówek lub etykieta</p>',
  },
  {
    className: 'vstack gap-3',
    version: '5.2.3',
    category: 'Helpers',
    description: 'Helper pionowego stosu flexbox z odstępem gap-3',
    exampleHtml: '<div class="vstack gap-3"><div>1</div><div>2</div></div>',
  },
  {
    className: 'hstack gap-2',
    version: '5.2.3',
    category: 'Helpers',
    description: 'Helper poziomego rzędu flexbox z odstępem gap-2',
    exampleHtml: '<div class="hstack gap-2"><div>A</div><div>B</div></div>',
  },
  {
    className: 'visually-hidden',
    version: '5.2.3',
    category: 'Helpers',
    description: 'Ukrywa wizualnie zachowując dostępność czytników (zastępuje sr-only)',
    exampleHtml: '<span class="visually-hidden">Ukryty opis</span>',
  },
  {
    className: 'ratio ratio-16x9',
    version: '5.2.3',
    category: 'Helpers',
    description: 'Helper proporcji 16:9 w Bootstrap 5 (zastępuje embed-responsive)',
    exampleHtml: '<div class="ratio ratio-16x9"><div>Treść 16:9</div></div>',
  },
];

export function getBootstrapComponentsForVersion(
  version: BootstrapVersion,
  category: BootstrapComponentCategory | 'All' = 'All'
): BootstrapComponentExample[] {
  return BOOTSTRAP_COMPONENT_EXAMPLES.filter(
    (item) =>
      item.version === version &&
      (category === 'All' || item.category === category)
  );
}

export function getBootstrapClassesForVersion(
  version: BootstrapVersion,
  searchQuery = '',
  category: BootstrapClassCategory | 'All' = 'All'
): BootstrapClassEntry[] {
  const q = searchQuery.trim().toLowerCase();
  return BOOTSTRAP_CLASSES_BY_VERSION.filter((entry) => {
    if (entry.version !== version) return false;
    if (category !== 'All' && entry.category !== category) return false;
    if (!q) return true;
    return (
      entry.className.toLowerCase().includes(q) ||
      entry.description.toLowerCase().includes(q) ||
      entry.category.toLowerCase().includes(q)
    );
  });
}

const escapeHtmlAttr = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const escapeHtmlText = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function renderPreviewNodeHtml(nodes: NodesMap, id: string, indent = '    '): string {
  const node = nodes[id];
  if (!node || (id !== 'root' && node.hidden)) return '';
  const props = node.props || {};
  const cleanClass = (props.className || '').replace(/\s+/g, ' ').trim();
  let attrStr = ` data-node-id="${escapeHtmlAttr(id)}"`;
  if (cleanClass) {
    attrStr += ` class="${escapeHtmlAttr(cleanClass)}"`;
  }
  if (node.themeOverrides && Object.keys(node.themeOverrides).length > 0) {
    attrStr += ` data-theme-scope="${escapeHtmlAttr(id)}"`;
  }
  if (node.htmlAttrs) {
    for (const [k, v] of Object.entries(node.htmlAttrs)) {
      if (/^[a-zA-Z_:][a-zA-Z0-9_.:-]*$/.test(k) && typeof v === 'string') {
        attrStr += ` ${k}="${escapeHtmlAttr(v)}"`;
      }
    }
  }
  if (node.type === 'Input' && props.placeholder) {
    attrStr += ` placeholder="${escapeHtmlAttr(props.placeholder)}"`;
  }
  if (node.type === 'Image' && props.src) {
    attrStr += ` src="${escapeHtmlAttr(props.src)}" alt="${escapeHtmlAttr(
      node.name || 'image'
    )}"`;
  }

  if (isContainerNodeType(node.type)) {
    const inner = node.children
      .map((childId) => renderPreviewNodeHtml(nodes, childId, indent + '  '))
      .join('');
    return `${indent}<div${attrStr}>\n${inner}${indent}</div>\n`;
  }
  if (node.type === 'Heading') {
    return `${indent}<h2${attrStr}>${escapeHtmlText(node.content || '')}</h2>\n`;
  }
  if (node.type === 'Text') {
    return `${indent}<p${attrStr}>${escapeHtmlText(node.content || '')}</p>\n`;
  }
  if (node.type === 'Badge') {
    return `${indent}<span${attrStr}>${escapeHtmlText(node.content || '')}</span>\n`;
  }
  if (node.type === 'Button') {
    return `${indent}<button type="button"${attrStr}>${escapeHtmlText(
      node.content || ''
    )}</button>\n`;
  }
  if (node.type === 'Input') {
    return `${indent}<input type="text"${attrStr} />\n`;
  }
  if (node.type === 'Image') {
    return `${indent}<img${attrStr} />\n`;
  }
  return '';
}

export function buildBootstrapPlainHtmlDocument(params: {
  nodes: NodesMap;
  themeVars: ThemeVariable[];
  sharedThemeCss: string;
  bootstrapVersion: BootstrapVersion;
  seo?: SeoMetadata;
  snippetHtmlOverride?: string;
}): string {
  const {
    nodes,
    themeVars,
    sharedThemeCss,
    bootstrapVersion,
    seo,
    snippetHtmlOverride,
  } = params;
  const assets = getBootstrapAssets(bootstrapVersion);
  const title = seo?.title?.trim() || `Bootstrap ${bootstrapVersion} Preview`;

  const combinedCss = [
    buildThemeCssRules(themeVars),
    buildScopedThemeOverrideCssRules(nodes, 'data-theme-scope'),
    sharedThemeCss.trim(),
    buildElementCustomStyleCssRules(nodes),
  ]
    .filter(Boolean)
    .join('\n');

  const scriptTags = assets.scriptUrls
    .map(
      (url) =>
        `  <script src="${escapeHtmlAttr(url)}" data-bootstrap-version="${bootstrapVersion}"></script>`
    )
    .join('\n');

  const bodyContent = snippetHtmlOverride
    ? `  <div class="p-3">\n${snippetHtmlOverride}\n  </div>\n`
    : renderPreviewNodeHtml(nodes, 'root', '  ');

  return `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtmlText(title)}</title>
  <link rel="stylesheet" href="${escapeHtmlAttr(assets.cssUrl)}" data-bootstrap-version="${bootstrapVersion}" />
${combinedCss ? `  <style>\n${combinedCss}\n  </style>\n` : ''}</head>
<body class="bg-light antialiased">
${bodyContent}${scriptTags}
</body>
</html>`;
}
