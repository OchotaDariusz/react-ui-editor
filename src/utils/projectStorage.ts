import type {
  BootstrapVersion,
  NodesMap,
  SavedProjectRecord,
  SeoMetadata,
  TailwindVersion,
  ThemeMode,
  ThemeVariable,
} from '../types/editor';

export const SAVED_PROJECTS_STORAGE_KEY = 'react_ui_editor_saved_projects_v1';
export const ACTIVE_PROJECT_ID_STORAGE_KEY =
  'react_ui_editor_active_project_id_v1';
export const DARK_MODE_STORAGE_KEY = 'react_ui_editor_dark_mode_v1';

export interface ProjectCaptureInput {
  id?: string | null;
  name: string;
  description?: string;
  nodes: NodesMap;
  themeVars: ThemeVariable[];
  seoMeta: SeoMetadata;
  sharedThemeCss: string;
  tailwindVersion: TailwindVersion;
  bootstrapVersion: BootstrapVersion;
  enableMd2: boolean;
  enableMd3: boolean;
  now?: number;
}

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function loadSavedThemeMode(): ThemeMode {
  try {
    if (typeof window === 'undefined') return 'light';
    const raw = window.localStorage.getItem(DARK_MODE_STORAGE_KEY);
    if (raw === 'dark' || raw === 'light') return raw;
  } catch {
    // Ignore storage read errors
  }
  return 'light';
}

export function persistThemeMode(mode: ThemeMode): void {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(DARK_MODE_STORAGE_KEY, mode);
    }
  } catch {
    // Ignore storage write errors
  }
}

export function sanitizeProjectName(rawName: string): string {
  const trimmed = rawName.trim().replace(/\s+/g, ' ');
  return trimmed.slice(0, 80) || 'Projekt bez nazwy';
}

export function createSavedProjectRecord(
  input: ProjectCaptureInput,
  existingRecord?: SavedProjectRecord
): SavedProjectRecord {
  const timestamp = input.now ?? Date.now();
  const id =
    (input.id && input.id.trim()) ||
    existingRecord?.id ||
    `proj-${timestamp}-${Math.random().toString(36).slice(2, 7)}`;

  const clonedNodes = deepClone(input.nodes);
  const nodeCount = Object.keys(clonedNodes).length;

  return {
    id,
    name: sanitizeProjectName(input.name),
    description: input.description?.trim() || existingRecord?.description || '',
    createdAt: existingRecord?.createdAt ?? timestamp,
    updatedAt: timestamp,
    nodeCount,
    nodes: clonedNodes,
    themeVars: deepClone(input.themeVars),
    seoMeta: deepClone(input.seoMeta),
    sharedThemeCss: input.sharedThemeCss,
    tailwindVersion: input.tailwindVersion,
    bootstrapVersion: input.bootstrapVersion,
    enableMd2: input.enableMd2,
    enableMd3: input.enableMd3,
  };
}

export function upsertSavedProject(
  projects: SavedProjectRecord[],
  input: ProjectCaptureInput
): { projects: SavedProjectRecord[]; saved: SavedProjectRecord } {
  const targetId = input.id?.trim() || null;
  const existing = targetId
    ? projects.find((item) => item.id === targetId)
    : undefined;

  const saved = createSavedProjectRecord(
    { ...input, id: existing?.id ?? targetId },
    existing
  );

  const withoutExisting = projects.filter((item) => item.id !== saved.id);
  const nextProjects = [saved, ...withoutExisting].sort(
    (a, b) => b.updatedAt - a.updatedAt
  );

  return { projects: nextProjects, saved };
}

export function deleteSavedProject(
  projects: SavedProjectRecord[],
  projectId: string
): SavedProjectRecord[] {
  return projects.filter((item) => item.id !== projectId);
}

export function renameSavedProject(
  projects: SavedProjectRecord[],
  projectId: string,
  nextName: string,
  now = Date.now()
): SavedProjectRecord[] {
  const sanitized = sanitizeProjectName(nextName);
  return projects.map((item) =>
    item.id === projectId
      ? { ...item, name: sanitized, updatedAt: now }
      : item
  );
}

export function loadSavedProjectsFromStorage(): SavedProjectRecord[] {
  try {
    if (typeof window === 'undefined') return [];
    const raw = window.localStorage.getItem(SAVED_PROJECTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidSavedProjectRecord);
  } catch {
    return [];
  }
}

export function persistSavedProjectsToStorage(
  projects: SavedProjectRecord[]
): boolean {
  try {
    if (typeof window === 'undefined') return false;
    window.localStorage.setItem(
      SAVED_PROJECTS_STORAGE_KEY,
      JSON.stringify(projects)
    );
    return true;
  } catch {
    return false;
  }
}

export function loadActiveProjectId(): string | null {
  try {
    if (typeof window === 'undefined') return null;
    const raw = window.localStorage.getItem(ACTIVE_PROJECT_ID_STORAGE_KEY);
    return raw && raw.trim() ? raw.trim() : null;
  } catch {
    return null;
  }
}

export function persistActiveProjectId(projectId: string | null): void {
  try {
    if (typeof window === 'undefined') return;
    if (projectId) {
      window.localStorage.setItem(ACTIVE_PROJECT_ID_STORAGE_KEY, projectId);
    } else {
      window.localStorage.removeItem(ACTIVE_PROJECT_ID_STORAGE_KEY);
    }
  } catch {
    // Ignore storage write errors
  }
}

export function isValidSavedProjectRecord(
  value: unknown
): value is SavedProjectRecord {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<SavedProjectRecord>;
  return Boolean(
    typeof candidate.id === 'string' &&
      typeof candidate.name === 'string' &&
      candidate.nodes &&
      typeof candidate.nodes === 'object' &&
      'root' in candidate.nodes &&
      Array.isArray(candidate.themeVars)
  );
}

export function serializeProjectToFileContent(
  record: SavedProjectRecord
): string {
  return JSON.stringify(
    {
      format: 'react-ui-studio-project',
      version: 1,
      project: record,
    },
    null,
    2
  );
}

export function parseImportedProjectJson(
  rawJson: string
): SavedProjectRecord | null {
  try {
    const parsed: unknown = JSON.parse(rawJson);
    if (!parsed || typeof parsed !== 'object') return null;

    const envelope = parsed as {
      format?: string;
      project?: unknown;
    } & Partial<SavedProjectRecord>;

    const candidate =
      envelope.project && typeof envelope.project === 'object'
        ? (envelope.project as Partial<SavedProjectRecord>)
        : envelope;

    if (
      !candidate.nodes ||
      typeof candidate.nodes !== 'object' ||
      !('root' in candidate.nodes)
    ) {
      return null;
    }

    const now = Date.now();
    return {
      id:
        typeof candidate.id === 'string' && candidate.id.trim()
          ? candidate.id.trim()
          : `proj-${now}-${Math.random().toString(36).slice(2, 6)}`,
      name: sanitizeProjectName(
        typeof candidate.name === 'string' ? candidate.name : 'Zaimportowany projekt'
      ),
      description:
        typeof candidate.description === 'string' ? candidate.description : '',
      createdAt:
        typeof candidate.createdAt === 'number' ? candidate.createdAt : now,
      updatedAt: now,
      nodeCount: Object.keys(candidate.nodes).length,
      nodes: deepClone(candidate.nodes as NodesMap),
      themeVars: Array.isArray(candidate.themeVars)
        ? deepClone(candidate.themeVars)
        : [],
      seoMeta:
        candidate.seoMeta && typeof candidate.seoMeta === 'object'
          ? {
              title: String(candidate.seoMeta.title ?? ''),
              description: String(candidate.seoMeta.description ?? ''),
              canonicalUrl: String(candidate.seoMeta.canonicalUrl ?? ''),
            }
          : { title: '', description: '', canonicalUrl: '' },
      sharedThemeCss:
        typeof candidate.sharedThemeCss === 'string'
          ? candidate.sharedThemeCss
          : '',
      tailwindVersion: candidate.tailwindVersion === 'v3' ? 'v3' : 'v4',
      bootstrapVersion:
        candidate.bootstrapVersion === '4.6.2' ? '4.6.2' : '5.2.3',
      enableMd2: Boolean(candidate.enableMd2),
      enableMd3: Boolean(candidate.enableMd3),
    };
  } catch {
    return null;
  }
}

export function buildProjectFileName(projectName: string): string {
  const slug = projectName
    .toLowerCase()
    .replace(/ł/g, 'l')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return `${slug || 'ui-project'}.ui-project.json`;
}
