import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard } from 'lucide-react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { CanvasBreadcrumb } from './components/CanvasBreadcrumb';
import { CanvasNode } from './components/CanvasNode';
import { CanvasRulers } from './components/CanvasRulers';
import { CodeExportView } from './components/CodeExportView';
import { EditorToolbar } from './components/EditorToolbar';
import { InspectorPanel } from './components/InspectorPanel';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { LeftSidebar } from './components/LeftSidebar';
import { ResponsivePreview } from './components/ResponsivePreview';
import {
  ASSETS_STORAGE_KEY,
  COMPONENT_HISTORY_STORAGE_KEY,
  DEFAULT_SEO_METADATA,
  DEFAULT_THEME_VARS,
  INITIAL_NODES,
  LEFT_SIDEBAR_COLLAPSED_STORAGE_KEY,
  RECENT_SEARCHES_STORAGE_KEY,
  RIGHT_SIDEBAR_COLLAPSED_STORAGE_KEY,
  RULERS_VISIBLE_STORAGE_KEY,
  SAVED_COMPONENTS_STORAGE_KEY,
  SEO_STORAGE_KEY,
  SHORTCUTS_MODAL_STORAGE_KEY,
  STORAGE_KEY,
  THEME_STORAGE_KEY,
  type TemplateBlueprintNode,
} from './constants/editorDefaults';
import type {
  ComponentHistoryEntry,
  ComponentHistoryEventType,
  EditorNode,
  ExportFormat,
  HistoryState,
  ImportedAsset,
  LeftTab,
  NodeBlueprint,
  NodesMap,
  NodeType,
  RecentComponentSearch,
  SavedComponentEntry,
  SeoMetadata,
  ThemeVarCategory,
  ThemeVariable,
  ViewportMode,
} from './types/editor';
import {
  DEFAULT_ZOOM,
  addCardPresetToTree,
  addIconNodeToTree,
  addNodeToTree,
  appendBulkCustomClassesToNodes,
  applyBulkClassUpdaterToNodes,
  applyNodeVariantInTree,
  buildThemeCssRules,
  createComponentHistoryEntry,
  createSavedComponentEntry,
  deleteNodeFromTree,
  deleteNodesFromTree,
  duplicateNodeInTree,
  generateId,
  generateReactJSX,
  getParentNodeId,
  getZoomScaleClass,
  insertAssetAtTarget,
  insertAssetIntoTree,
  insertBlueprintAtTarget,
  insertCardPresetAtTarget,
  insertIconNodeAtTarget,
  insertNewNodeAtTarget,
  insertPageTemplateIntoTree,
  insertSavedComponentIntoTree,
  moveNodeRelativeToTarget,
  normalizeRecentSearchesStorage,
  prependComponentHistory,
  recordRecentComponentSearch,
  refreshAddedComponentHistoryEntry,
  reinsertComponentFromHistory,
  removeRecentComponentSearch,
  serializeNodesToJson,
  stepZoom,
  toggleMultiSelection,
  toggleNodeVisibilityInTree,
  updateNodeInTree,
  type DropPosition,
} from './utils/editorLogic';
import {
  AUTO_SAVE_INTERVAL_MS,
  createAutoSaveController,
} from './utils/autoSave';
import {
  applyDesignLintFix,
  fixAllDesignLintIssues,
  type DesignLintIssue,
} from './utils/designLint';
import {
  buildExportFileName,
  downloadTextFile,
  exportCanvasElementAsSvg,
  generateHtmlExport,
  generateStaticSvgExport,
  type CodePreviewFormat,
} from './utils/exportFormats';
import { buildArbitraryGridCssRules } from './utils/gridLayout';
import { exportCanvasElementAsPdf } from './utils/pdfExport';
import {
  clearAllNodeThemeOverridesInTree,
  setNodeThemeOverrideInTree,
} from './utils/themeUsage';

function loadInitialHistory(): HistoryState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as NodesMap;
      if (parsed && parsed.root) {
        return { past: [], present: parsed, future: [] };
      }
    }
  } catch {
    // Ignore localStorage parse/access errors
  }
  return { past: [], present: INITIAL_NODES, future: [] };
}

function loadInitialThemeVars(): ThemeVariable[] {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as ThemeVariable[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // Ignore localStorage parse/access errors
  }
  return DEFAULT_THEME_VARS;
}

function loadInitialSeoMetadata(): SeoMetadata {
  try {
    const saved = localStorage.getItem(SEO_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as Partial<SeoMetadata>;
      if (parsed && typeof parsed === 'object') {
        return {
          title: typeof parsed.title === 'string' ? parsed.title : '',
          description:
            typeof parsed.description === 'string' ? parsed.description : '',
          canonicalUrl:
            typeof parsed.canonicalUrl === 'string' ? parsed.canonicalUrl : '',
        };
      }
    }
  } catch {
    // Ignore localStorage parse/access errors
  }
  return DEFAULT_SEO_METADATA;
}

function loadInitialComponentHistory(): ComponentHistoryEntry[] {
  try {
    const saved = localStorage.getItem(COMPONENT_HISTORY_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as ComponentHistoryEntry[];
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (item) =>
            item &&
            typeof item.historyId === 'string' &&
            item.snapshot &&
            typeof item.snapshot === 'object'
        );
      }
    }
  } catch {
    // Ignore localStorage parse/access errors
  }
  return [];
}

function loadInitialRecentSearches(): RecentComponentSearch[] {
  try {
    const saved = localStorage.getItem(RECENT_SEARCHES_STORAGE_KEY);
    if (saved) {
      return normalizeRecentSearchesStorage(JSON.parse(saved), 5);
    }
  } catch {
    // Ignore localStorage parse/access errors
  }
  return [];
}

function loadInitialBooleanFlag(key: string, fallback = false): boolean {
  try {
    const raw = localStorage.getItem(key);
    if (raw === 'true') return true;
    if (raw === 'false') return false;
  } catch {
    // Ignore localStorage access errors
  }
  return fallback;
}

function loadInitialSavedComponents(): SavedComponentEntry[] {
  try {
    const saved = localStorage.getItem(SAVED_COMPONENTS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as SavedComponentEntry[];
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (item) =>
            item &&
            typeof item.id === 'string' &&
            typeof item.name === 'string' &&
            item.snapshot &&
            typeof item.snapshot === 'object'
        );
      }
    }
  } catch {
    // Ignore localStorage parse/access errors
  }
  return [];
}

function loadInitialAssets(): ImportedAsset[] {
  try {
    const saved = localStorage.getItem(ASSETS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as ImportedAsset[];
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (item) =>
            item &&
            typeof item.id === 'string' &&
            typeof item.name === 'string' &&
            typeof item.dataUrl === 'string'
        );
      }
    }
  } catch {
    // Ignore localStorage parse/access errors
  }
  return [];
}

function loadInitialShortcutsModal(): boolean {
  try {
    return localStorage.getItem(SHORTCUTS_MODAL_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export default function App() {
  const [history, setHistory] = useState<HistoryState>(loadInitialHistory);
  const nodes = history.present;
  const [themeVars, setThemeVars] = useState<ThemeVariable[]>(loadInitialThemeVars);
  const [seoMetadata, setSeoMetadata] = useState<SeoMetadata>(
    loadInitialSeoMetadata
  );
  const [savedComponents, setSavedComponents] = useState<SavedComponentEntry[]>(
    loadInitialSavedComponents
  );
  const [assets, setAssets] = useState<ImportedAsset[]>(loadInitialAssets);
  const [assetStorageError, setAssetStorageError] = useState<string>('');
  const [componentHistory, setComponentHistory] = useState<
    ComponentHistoryEntry[]
  >(loadInitialComponentHistory);
  const [recentSearches, setRecentSearches] = useState<RecentComponentSearch[]>(
    loadInitialRecentSearches
  );

  const [selectedIds, setSelectedIds] = useState<string[]>(['root']);
  const [multiSelectMode, setMultiSelectMode] = useState<boolean>(false);
  const selectedId = selectedIds[selectedIds.length - 1] || 'root';

  const [leftTab, setLeftTab] = useState<LeftTab>('components');
  const [viewport, setViewport] = useState<ViewportMode>('desktop');
  const [zoom, setZoom] = useState<number>(DEFAULT_ZOOM);
  const [showGuides, setShowGuides] = useState<boolean>(false);
  const [showRulers, setShowRulers] = useState<boolean>(() =>
    loadInitialBooleanFlag(RULERS_VISIBLE_STORAGE_KEY, false)
  );
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState<boolean>(() =>
    loadInitialBooleanFlag(LEFT_SIDEBAR_COLLAPSED_STORAGE_KEY, false)
  );
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState<boolean>(() =>
    loadInitialBooleanFlag(RIGHT_SIDEBAR_COLLAPSED_STORAGE_KEY, false)
  );
  const [previewMode, setPreviewMode] = useState<boolean>(false);
  const [responsivePreview, setResponsivePreview] = useState<boolean>(false);
  const [showCode, setShowCode] = useState<boolean>(false);
  const [codeExportFormat, setCodeExportFormat] =
    useState<CodePreviewFormat>('react');
  const [isJsxPrettier, setIsJsxPrettier] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedJson, setCopiedJson] = useState<boolean>(false);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [confirmReset, setConfirmReset] = useState<boolean>(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState<boolean>(
    loadInitialShortcutsModal
  );
  const canvasScrollRef = useRef<HTMLDivElement | null>(null);
  const canvasViewportRef = useRef<HTMLDivElement | null>(null);
  const nodesRef = useRef<NodesMap>(nodes);
  nodesRef.current = nodes;

  useEffect(() => {
    const controller = createAutoSaveController({
      getNodes: () => nodesRef.current,
      storage: typeof window !== 'undefined' ? window.localStorage : null,
      storageKey: STORAGE_KEY,
      intervalMs: AUTO_SAVE_INTERVAL_MS,
    });
    controller.start();

    const handleBeforeUnload = () => {
      controller.flush();
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        controller.flush();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      controller.flush();
      controller.stop();
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(themeVars));
    } catch {
      // Ignore storage quota errors
    }
  }, [themeVars]);

  useEffect(() => {
    try {
      localStorage.setItem(SEO_STORAGE_KEY, JSON.stringify(seoMetadata));
    } catch {
      // Ignore storage quota errors
    }
  }, [seoMetadata]);

  useEffect(() => {
    try {
      localStorage.setItem(
        COMPONENT_HISTORY_STORAGE_KEY,
        JSON.stringify(componentHistory)
      );
    } catch {
      // Ignore storage quota errors
    }
  }, [componentHistory]);

  useEffect(() => {
    try {
      localStorage.setItem(
        RECENT_SEARCHES_STORAGE_KEY,
        JSON.stringify(recentSearches)
      );
    } catch {
      // Ignore storage quota errors
    }
  }, [recentSearches]);

  useEffect(() => {
    try {
      localStorage.setItem(
        SAVED_COMPONENTS_STORAGE_KEY,
        JSON.stringify(savedComponents)
      );
    } catch {
      // Ignore storage quota errors
    }
  }, [savedComponents]);

  useEffect(() => {
    try {
      localStorage.setItem(ASSETS_STORAGE_KEY, JSON.stringify(assets));
    } catch {
      setAssetStorageError(
        'Przekroczono limit pamięci localStorage. Usuń starsze zasoby przed dodaniem kolejnych.'
      );
    }
  }, [assets]);

  useEffect(() => {
    try {
      localStorage.setItem(
        SHORTCUTS_MODAL_STORAGE_KEY,
        String(showShortcutsModal)
      );
    } catch {
      // Ignore storage quota errors
    }
  }, [showShortcutsModal]);

  useEffect(() => {
    try {
      localStorage.setItem(
        LEFT_SIDEBAR_COLLAPSED_STORAGE_KEY,
        String(leftSidebarCollapsed)
      );
    } catch {
      // Ignore storage quota errors
    }
  }, [leftSidebarCollapsed]);

  useEffect(() => {
    try {
      localStorage.setItem(
        RIGHT_SIDEBAR_COLLAPSED_STORAGE_KEY,
        String(rightSidebarCollapsed)
      );
    } catch {
      // Ignore storage quota errors
    }
  }, [rightSidebarCollapsed]);

  useEffect(() => {
    try {
      localStorage.setItem(RULERS_VISIBLE_STORAGE_KEY, String(showRulers));
    } catch {
      // Ignore storage quota errors
    }
  }, [showRulers]);

  const commitNodes = useCallback(
    (updater: NodesMap | ((curr: NodesMap) => NodesMap)) => {
      setHistory((curr) => {
        const nextPresent =
          typeof updater === 'function' ? updater(curr.present) : updater;
        if (nextPresent === curr.present) return curr;
        const nextPast = [...curr.past, curr.present].slice(-40);
        return {
          past: nextPast,
          present: nextPresent,
          future: [],
        };
      });
    },
    []
  );

  const handleUndo = useCallback(() => {
    setHistory((curr) => {
      if (curr.past.length === 0) return curr;
      const previous = curr.past[curr.past.length - 1];
      return {
        past: curr.past.slice(0, -1),
        present: previous,
        future: [curr.present, ...curr.future],
      };
    });
  }, []);

  const handleRedo = useCallback(() => {
    setHistory((curr) => {
      if (curr.future.length === 0) return curr;
      const next = curr.future[0];
      return {
        past: [...curr.past, curr.present],
        present: next,
        future: curr.future.slice(1),
      };
    });
  }, []);

  const recordComponentHistory = useCallback(
    (
      sourceNodes: NodesMap,
      nodeId: string,
      eventType: ComponentHistoryEventType
    ) => {
      const entry = createComponentHistoryEntry(sourceNodes, nodeId, eventType);
      if (entry) {
        setComponentHistory((curr) => prependComponentHistory(curr, entry));
      }
    },
    []
  );

  const handleSelectNode = useCallback(
    (id: string, additive = false) => {
      setSelectedIds((prev) =>
        toggleMultiSelection(prev, id, additive || multiSelectMode, nodes)
      );
    },
    [multiSelectMode, nodes]
  );

  const handleToggleNodeVisibility = useCallback(
    (id: string) => {
      commitNodes((prev) => toggleNodeVisibilityInTree(prev, id));
    },
    [commitNodes]
  );

  const handleToggleMultiSelect = useCallback(() => {
    setMultiSelectMode((prev) => {
      const next = !prev;
      if (!next) {
        setSelectedIds((curr) =>
          curr.length > 1 ? [curr[curr.length - 1] || 'root'] : curr
        );
      }
      return next;
    });
  }, []);

  const handleClearMultiSelect = useCallback(() => {
    setMultiSelectMode(false);
    setSelectedIds((curr) =>
      curr.length > 0 ? [curr[curr.length - 1] || 'root'] : ['root']
    );
  }, []);

  const handleRecordRecentSearch = useCallback(
    (entry: Omit<RecentComponentSearch, 'timestamp'>) => {
      setRecentSearches((prev) => {
        const next = recordRecentComponentSearch(prev, entry);
        try {
          localStorage.setItem(RECENT_SEARCHES_STORAGE_KEY, JSON.stringify(next));
        } catch {
          // Ignore storage quota errors
        }
        return next;
      });
    },
    []
  );

  const handleRemoveRecentSearch = useCallback(
    (type: RecentComponentSearch['type'], query: string) => {
      setRecentSearches((prev) => {
        const next = removeRecentComponentSearch(prev, type, query);
        try {
          localStorage.setItem(RECENT_SEARCHES_STORAGE_KEY, JSON.stringify(next));
        } catch {
          // Ignore storage quota errors
        }
        return next;
      });
    },
    []
  );

  const handleClearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    try {
      localStorage.setItem(RECENT_SEARCHES_STORAGE_KEY, '[]');
    } catch {
      // Ignore storage quota errors
    }
  }, []);

  const handleAddNode = useCallback(
    (type: NodeType) => {
      const result = addNodeToTree(nodes, selectedId, type);
      if (!result.createdId) return;
      commitNodes(result.nodes);
      setSelectedIds([result.createdId]);
      recordComponentHistory(result.nodes, result.createdId, 'added');
    },
    [nodes, selectedId, commitNodes, recordComponentHistory]
  );

  const handleAddIconNode = useCallback(
    (iconName: string) => {
      const result = addIconNodeToTree(nodes, selectedId, iconName);
      if (!result.createdId) return;
      commitNodes(result.nodes);
      setSelectedIds([result.createdId]);
      recordComponentHistory(result.nodes, result.createdId, 'added');
    },
    [nodes, selectedId, commitNodes, recordComponentHistory]
  );

  const handleAddCardPreset = useCallback(() => {
    const result = addCardPresetToTree(nodes, selectedId);
    if (!result.createdId) return;
    commitNodes(result.nodes);
    setSelectedIds([result.createdId]);
    recordComponentHistory(result.nodes, result.createdId, 'added');
  }, [nodes, selectedId, commitNodes, recordComponentHistory]);

  const handleInsertPageTemplate = useCallback(
    (blueprint: TemplateBlueprintNode) => {
      const result = insertPageTemplateIntoTree(nodes, selectedId, blueprint);
      if (!result.createdId) return;
      commitNodes(result.nodes);
      setSelectedIds([result.createdId]);
      recordComponentHistory(result.nodes, result.createdId, 'added');
    },
    [nodes, selectedId, commitNodes, recordComponentHistory]
  );

  const handleReinsertFromHistory = useCallback(
    (entry: ComponentHistoryEntry) => {
      const result = reinsertComponentFromHistory(nodes, selectedId, entry);
      if (!result.createdId) return;
      commitNodes(result.nodes);
      setSelectedIds([result.createdId]);
      recordComponentHistory(result.nodes, result.createdId, 'added');
    },
    [nodes, selectedId, commitNodes, recordComponentHistory]
  );

  const handleRemoveHistoryEntry = useCallback((historyId: string) => {
    setComponentHistory((curr) =>
      curr.filter((item) => item.historyId !== historyId)
    );
  }, []);

  const handleClearComponentHistory = useCallback(() => {
    setComponentHistory([]);
  }, []);

  const handleSaveSelectedComponent = useCallback(
    (customName?: string) => {
      const entry = createSavedComponentEntry(nodes, selectedId, customName);
      if (!entry) return;
      setSavedComponents((prev) => [entry, ...prev].slice(0, 40));
    },
    [nodes, selectedId]
  );

  const handleInsertSavedComponent = useCallback(
    (entry: SavedComponentEntry) => {
      const result = insertSavedComponentIntoTree(nodes, selectedId, entry);
      if (!result.createdId) return;
      commitNodes(result.nodes);
      setSelectedIds([result.createdId]);
      recordComponentHistory(result.nodes, result.createdId, 'added');
    },
    [nodes, selectedId, commitNodes, recordComponentHistory]
  );

  const handleDropSavedComponent = useCallback(
    (blueprint: NodeBlueprint, targetId: string, position: DropPosition) => {
      const result = insertBlueprintAtTarget(
        nodes,
        blueprint,
        targetId,
        position
      );
      if (!result.createdId) return;
      commitNodes(result.nodes);
      setSelectedIds([result.createdId]);
      recordComponentHistory(result.nodes, result.createdId, 'added');
    },
    [nodes, commitNodes, recordComponentHistory]
  );

  const handleRemoveSavedComponent = useCallback((id: string) => {
    setSavedComponents((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const handleClearSavedComponents = useCallback(() => {
    setSavedComponents([]);
  }, []);

  const handleAddAssets = useCallback((newAssets: ImportedAsset[]) => {
    if (newAssets.length === 0) return;
    setAssets((prev) => [...newAssets, ...prev]);
  }, []);

  const handleInsertAsset = useCallback(
    (asset: ImportedAsset) => {
      const result = insertAssetIntoTree(nodes, selectedId, asset);
      if (!result.createdId) return;
      commitNodes(result.nodes);
      setSelectedIds([result.createdId]);
      recordComponentHistory(result.nodes, result.createdId, 'added');
    },
    [nodes, selectedId, commitNodes, recordComponentHistory]
  );

  const handleDropAsset = useCallback(
    (asset: ImportedAsset, targetId: string, position: DropPosition) => {
      const result = insertAssetAtTarget(nodes, asset, targetId, position);
      if (!result.createdId) return;
      commitNodes(result.nodes);
      setSelectedIds([result.createdId]);
      recordComponentHistory(result.nodes, result.createdId, 'added');
    },
    [nodes, commitNodes, recordComponentHistory]
  );

  const handleApplyAssetToSelectedImage = useCallback(
    (asset: ImportedAsset) => {
      const target = nodes[selectedId];
      if (!target || target.type !== 'Image') return;
      const nextNodes = updateNodeInTree(
        nodes,
        selectedId,
        'src',
        asset.dataUrl,
        true
      );
      commitNodes(nextNodes);
      setComponentHistory((curr) =>
        refreshAddedComponentHistoryEntry(curr, nextNodes, selectedId)
      );
    },
    [nodes, selectedId, commitNodes]
  );

  const handleRemoveAsset = useCallback((id: string) => {
    setAssets((prev) => prev.filter((item) => item.id !== id));
    setAssetStorageError('');
  }, []);

  const handleClearAssets = useCallback(() => {
    setAssets([]);
    setAssetStorageError('');
  }, []);

  const handleAddThemeVar = useCallback(
    (name: string, value: string, category: ThemeVarCategory) => {
      setThemeVars((prev) => {
        const existingIndex = prev.findIndex((item) => item.name === name);
        if (existingIndex !== -1) {
          return prev.map((item, idx) =>
            idx === existingIndex ? { ...item, value, category } : item
          );
        }
        return [
          ...prev,
          {
            id: generateId(),
            name,
            label: name.replace(/^--/, ''),
            value,
            category,
          },
        ];
      });
    },
    []
  );

  const handleUpdateThemeVar = useCallback((id: string, value: string) => {
    setThemeVars((prev) =>
      prev.map((item) => (item.id === id ? { ...item, value } : item))
    );
  }, []);

  const handleDeleteThemeVar = useCallback((id: string) => {
    setThemeVars((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const handleReplaceThemeVars = useCallback((nextVars: ThemeVariable[]) => {
    setThemeVars(nextVars);
  }, []);

  const handleChangeSeo = useCallback(
    (field: keyof SeoMetadata, value: string) => {
      setSeoMetadata((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleUpdateSelectedNode = useCallback(
    (key: string, value: string, isProp = false) => {
      const nextNodes = updateNodeInTree(nodes, selectedId, key, value, isProp);
      commitNodes(nextNodes);
      setComponentHistory((curr) =>
        refreshAddedComponentHistoryEntry(curr, nextNodes, selectedId)
      );
    },
    [nodes, selectedId, commitNodes]
  );

  const handleUpdateNodeClassById = useCallback(
    (nodeId: string, nextClassName: string) => {
      const nextNodes = updateNodeInTree(
        nodes,
        nodeId,
        'className',
        nextClassName,
        true
      );
      commitNodes(nextNodes);
      setComponentHistory((curr) =>
        refreshAddedComponentHistoryEntry(curr, nextNodes, nodeId)
      );
    },
    [nodes, commitNodes]
  );

  const handleSetNodeThemeOverride = useCallback(
    (varName: string, overrideValue: string | null) => {
      const nextNodes = setNodeThemeOverrideInTree(
        nodes,
        selectedId,
        varName,
        overrideValue
      );
      if (nextNodes === nodes) return;
      commitNodes(nextNodes);
      setComponentHistory((curr) =>
        refreshAddedComponentHistoryEntry(curr, nextNodes, selectedId)
      );
    },
    [nodes, selectedId, commitNodes]
  );

  const handleClearNodeThemeOverrides = useCallback(() => {
    const nextNodes = clearAllNodeThemeOverridesInTree(nodes, selectedId);
    if (nextNodes === nodes) return;
    commitNodes(nextNodes);
    setComponentHistory((curr) =>
      refreshAddedComponentHistoryEntry(curr, nextNodes, selectedId)
    );
  }, [nodes, selectedId, commitNodes]);

  const handleFixDesignLintIssue = useCallback(
    (issue: DesignLintIssue) => {
      const nextNodes = applyDesignLintFix(nodes, issue);
      if (nextNodes === nodes) return;
      commitNodes(nextNodes);
      setComponentHistory((curr) =>
        refreshAddedComponentHistoryEntry(curr, nextNodes, issue.nodeId)
      );
    },
    [nodes, commitNodes]
  );

  const handleFixAllDesignLint = useCallback(() => {
    const { nodes: nextNodes, fixedCount } = fixAllDesignLintIssues(
      nodes,
      selectedId,
      themeVars
    );
    if (fixedCount === 0 || nextNodes === nodes) return 0;
    commitNodes(nextNodes);
    setComponentHistory((curr) => {
      let updatedHistory = curr;
      for (const nodeId of Object.keys(nextNodes)) {
        if (nextNodes[nodeId] !== nodes[nodeId]) {
          updatedHistory = refreshAddedComponentHistoryEntry(
            updatedHistory,
            nextNodes,
            nodeId
          );
        }
      }
      return updatedHistory;
    });
    return fixedCount;
  }, [nodes, selectedId, themeVars, commitNodes]);

  const handleBulkUpdateClassName = useCallback(
    (updater: (currClass: string, node: EditorNode) => string) => {
      const nextNodes = applyBulkClassUpdaterToNodes(nodes, selectedIds, updater);
      if (nextNodes === nodes) return;
      commitNodes(nextNodes);
      setComponentHistory((curr) => {
        let updatedHistory = curr;
        for (const id of selectedIds) {
          updatedHistory = refreshAddedComponentHistoryEntry(
            updatedHistory,
            nextNodes,
            id
          );
        }
        return updatedHistory;
      });
    },
    [nodes, selectedIds, commitNodes]
  );

  const handleAppendBulkClasses = useCallback(
    (extraClasses: string) => {
      const nextNodes = appendBulkCustomClassesToNodes(
        nodes,
        selectedIds,
        extraClasses
      );
      if (nextNodes === nodes) return;
      commitNodes(nextNodes);
      setComponentHistory((curr) => {
        let updatedHistory = curr;
        for (const id of selectedIds) {
          updatedHistory = refreshAddedComponentHistoryEntry(
            updatedHistory,
            nextNodes,
            id
          );
        }
        return updatedHistory;
      });
    },
    [nodes, selectedIds, commitNodes]
  );

  const handleChangeSelectedVariant = useCallback(
    (variantId: string) => {
      const nextNodes = applyNodeVariantInTree(nodes, selectedId, variantId);
      commitNodes(nextNodes);
      setComponentHistory((curr) =>
        refreshAddedComponentHistoryEntry(curr, nextNodes, selectedId)
      );
    },
    [nodes, selectedId, commitNodes]
  );

  const handleDuplicateSelectedNode = useCallback(() => {
    const result = duplicateNodeInTree(nodes, selectedId);
    if (!result.createdId) return;
    commitNodes(result.nodes);
    setSelectedIds([result.createdId]);
    recordComponentHistory(result.nodes, result.createdId, 'added');
  }, [nodes, selectedId, commitNodes, recordComponentHistory]);

  const handleMoveNode = useCallback(
    (dragId: string, targetId: string, position: DropPosition) => {
      commitNodes((prev) =>
        moveNodeRelativeToTarget(prev, dragId, targetId, position)
      );
      setSelectedIds([dragId]);
    },
    [commitNodes]
  );

  const handleDropNewIcon = useCallback(
    (iconName: string, targetId: string, position: DropPosition) => {
      const result = insertIconNodeAtTarget(nodes, iconName, targetId, position);
      if (!result.createdId) return;
      commitNodes(result.nodes);
      setSelectedIds([result.createdId]);
      recordComponentHistory(result.nodes, result.createdId, 'added');
    },
    [nodes, commitNodes, recordComponentHistory]
  );

  const handleDropNewComponent = useCallback(
    (nodeType: NodeType, targetId: string, position: DropPosition) => {
      const result = insertNewNodeAtTarget(nodes, nodeType, targetId, position);
      if (!result.createdId) return;
      commitNodes(result.nodes);
      setSelectedIds([result.createdId]);
      recordComponentHistory(result.nodes, result.createdId, 'added');
    },
    [nodes, commitNodes, recordComponentHistory]
  );

  const handleDropCardPreset = useCallback(
    (targetId: string, position: DropPosition) => {
      const result = insertCardPresetAtTarget(nodes, targetId, position);
      if (!result.createdId) return;
      commitNodes(result.nodes);
      setSelectedIds([result.createdId]);
      recordComponentHistory(result.nodes, result.createdId, 'added');
    },
    [nodes, commitNodes, recordComponentHistory]
  );

  const handleDeleteSelectedNode = useCallback(() => {
    if (selectedId !== 'root' && nodes[selectedId]) {
      recordComponentHistory(nodes, selectedId, 'deleted');
    }
    const result = deleteNodeFromTree(nodes, selectedId);
    commitNodes(result.nodes);
    setSelectedIds([result.nextSelectedId]);
  }, [nodes, selectedId, commitNodes, recordComponentHistory]);

  const handleBulkDeleteNodes = useCallback(() => {
    const deletableIds = selectedIds.filter(
      (id) => id !== 'root' && Boolean(nodes[id])
    );
    if (deletableIds.length === 0) return;

    const deletedEntries = deletableIds
      .map((id) => createComponentHistoryEntry(nodes, id, 'deleted'))
      .filter((entry): entry is ComponentHistoryEntry => Boolean(entry));

    if (deletedEntries.length > 0) {
      setComponentHistory((curr) => {
        let next = curr;
        for (const entry of deletedEntries) {
          next = prependComponentHistory(next, entry);
        }
        return next;
      });
    }

    const result = deleteNodesFromTree(nodes, deletableIds);
    commitNodes(result.nodes);
    setSelectedIds([result.nextSelectedId]);
    setMultiSelectMode(false);
  }, [nodes, selectedIds, commitNodes]);

  const handleReplaceNodes = useCallback(
    (nextNodes: NodesMap) => {
      commitNodes(nextNodes);
      setSelectedIds((prev) => {
        const remaining = prev.filter((id) => Boolean(nextNodes[id]));
        return remaining.length > 0 ? remaining : ['root'];
      });
    },
    [commitNodes]
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      const isEditableInput =
        (tag === 'INPUT' && !(target as HTMLInputElement).readOnly) ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT';

      if (isEditableInput) return;

      if (!e.ctrlKey && !e.metaKey && !e.altKey && e.key === '?') {
        e.preventDefault();
        setShowShortcutsModal((prev) => !prev);
        return;
      }

      if (e.key === 'Escape' && showShortcutsModal) {
        e.preventDefault();
        setShowShortcutsModal(false);
        return;
      }

      if ((e.ctrlKey || e.metaKey) && !e.altKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && !e.altKey && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
        return;
      }

      if (previewMode || showCode) return;

      if ((e.ctrlKey || e.metaKey) && e.altKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        handleDuplicateSelectedNode();
        return;
      }

      if (e.key === 'Delete') {
        if (selectedIds.length > 1) {
          e.preventDefault();
          handleBulkDeleteNodes();
          return;
        }
        if (selectedId !== 'root') {
          e.preventDefault();
          handleDeleteSelectedNode();
        }
        return;
      }

      if (e.key === 'Escape') {
        if (selectedIds.length > 1) {
          e.preventDefault();
          handleClearMultiSelect();
          return;
        }
        const parentId = getParentNodeId(nodes, selectedId);
        if (parentId) {
          e.preventDefault();
          setSelectedIds([parentId]);
          if (
            document.activeElement instanceof HTMLElement &&
            document.activeElement.dataset.nodeId
          ) {
            document.activeElement.blur();
          }
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    handleUndo,
    handleRedo,
    handleDuplicateSelectedNode,
    handleDeleteSelectedNode,
    handleBulkDeleteNodes,
    handleClearMultiSelect,
    nodes,
    selectedId,
    selectedIds,
    previewMode,
    showCode,
    showShortcutsModal,
  ]);

  const handleResetCanvas = useCallback(() => {
    if (!confirmReset) {
      setConfirmReset(true);
      window.setTimeout(() => setConfirmReset(false), 3000);
      return;
    }
    commitNodes(INITIAL_NODES);
    setSelectedIds(['root']);
    setMultiSelectMode(false);
    setConfirmReset(false);
  }, [confirmReset, commitNodes]);

  const generatedCode = useMemo(
    () =>
      generateReactJSX(
        nodes,
        seoMetadata,
        isJsxPrettier ? 'pretty' : 'minified'
      ),
    [nodes, seoMetadata, isJsxPrettier]
  );
  const generatedHtml = useMemo(
    () => generateHtmlExport(nodes, themeVars, seoMetadata),
    [nodes, themeVars, seoMetadata]
  );
  const generatedSvg = useMemo(
    () => generateStaticSvgExport(nodes, themeVars, seoMetadata),
    [nodes, themeVars, seoMetadata]
  );
  const themeCssRules = useMemo(
    () => buildThemeCssRules(themeVars, nodes),
    [themeVars, nodes]
  );
  const arbitraryGridCssRules = useMemo(
    () => buildArbitraryGridCssRules(nodes),
    [nodes]
  );

  const handleCopyCode = useCallback(
    (content?: string) => {
      const payload = typeof content === 'string' ? content : generatedCode;
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(payload).catch(() => {});
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    },
    [generatedCode]
  );

  const handleCopyTreeJson = useCallback(() => {
    const jsonPayload = serializeNodesToJson(nodes);
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(jsonPayload).catch(() => {});
    }
    setCopiedJson(true);
    window.setTimeout(() => setCopiedJson(false), 2000);
  }, [nodes]);

  const handleExportPdf = useCallback(async () => {
    const element = canvasViewportRef.current;
    if (!element || isExportingPdf) return;
    setIsExportingPdf(true);
    try {
      await exportCanvasElementAsPdf(element, seoMetadata.title);
    } finally {
      setIsExportingPdf(false);
    }
  }, [isExportingPdf, seoMetadata.title]);

  const handleExportFormat = useCallback(
    (format: ExportFormat) => {
      if (format === 'html') {
        downloadTextFile(
          generatedHtml,
          buildExportFileName(seoMetadata.title, 'html'),
          'text/html;charset=utf-8'
        );
        return;
      }
      if (format === 'react') {
        downloadTextFile(
          generatedCode,
          buildExportFileName(seoMetadata.title, 'jsx'),
          'text/javascript;charset=utf-8'
        );
        return;
      }
      if (format === 'svg') {
        exportCanvasElementAsSvg(
          canvasViewportRef.current,
          nodes,
          themeVars,
          seoMetadata
        );
        return;
      }
      if (format === 'pdf') {
        void handleExportPdf();
      }
    },
    [generatedHtml, generatedCode, seoMetadata, nodes, themeVars, handleExportPdf]
  );

  const selectedNode = nodes[selectedId];

  const viewportWidthClass =
    viewport === 'mobile'
      ? 'max-w-[375px]'
      : viewport === 'tablet'
        ? 'max-w-[768px]'
        : 'max-w-5xl';

  return (
    <DndProvider backend={HTML5Backend}>
      {themeCssRules && <style id="editor-theme-vars">{themeCssRules}</style>}
      {arbitraryGridCssRules && (
        <style id="editor-arbitrary-grid-vars">{arbitraryGridCssRules}</style>
      )}
      <div className="flex h-screen w-full bg-slate-100 font-sans text-slate-900 overflow-hidden">
        {!leftSidebarCollapsed && (
          <LeftSidebar
            leftTab={leftTab}
            onChangeTab={setLeftTab}
            onAddNode={handleAddNode}
            onAddIconNode={handleAddIconNode}
            onAddCardPreset={handleAddCardPreset}
            onInsertPageTemplate={handleInsertPageTemplate}
            savedComponents={savedComponents}
            onSaveSelectedComponent={handleSaveSelectedComponent}
            onInsertSavedComponent={handleInsertSavedComponent}
            onRemoveSavedComponent={handleRemoveSavedComponent}
            onClearSavedComponents={handleClearSavedComponents}
            assets={assets}
            assetStorageError={assetStorageError}
            onAddAssets={handleAddAssets}
            onInsertAsset={handleInsertAsset}
            onApplyAssetToSelectedImage={handleApplyAssetToSelectedImage}
            onRemoveAsset={handleRemoveAsset}
            onClearAssets={handleClearAssets}
            onDismissAssetStorageError={() => setAssetStorageError('')}
            componentHistory={componentHistory}
            onReinsertFromHistory={handleReinsertFromHistory}
            onRemoveHistoryEntry={handleRemoveHistoryEntry}
            onClearComponentHistory={handleClearComponentHistory}
            recentSearches={recentSearches}
            onRecordRecentSearch={handleRecordRecentSearch}
            onRemoveRecentSearch={handleRemoveRecentSearch}
            onClearRecentSearches={handleClearRecentSearches}
            onCollapse={() => setLeftSidebarCollapsed(true)}
            nodes={nodes}
            selectedId={selectedId}
            selectedIds={selectedIds}
            onSelectNode={handleSelectNode}
            onToggleNodeVisibility={handleToggleNodeVisibility}
          />
        )}

        <main className="relative flex-1 flex flex-col min-w-0 overflow-hidden">
          <EditorToolbar
            canUndo={history.past.length > 0}
            canRedo={history.future.length > 0}
            onUndo={handleUndo}
            onRedo={handleRedo}
            confirmReset={confirmReset}
            onReset={handleResetCanvas}
            viewport={viewport}
            onChangeViewport={(mode) => {
              setViewport(mode);
              setResponsivePreview(false);
              setShowCode(false);
            }}
            zoom={zoom}
            onZoomIn={() => setZoom((z) => stepZoom(z, 'in'))}
            onZoomOut={() => setZoom((z) => stepZoom(z, 'out'))}
            onResetZoom={() => setZoom(DEFAULT_ZOOM)}
            showGuides={showGuides}
            onToggleGuides={() => setShowGuides((g) => !g)}
            showRulers={showRulers}
            onToggleRulers={() => setShowRulers((r) => !r)}
            leftSidebarCollapsed={leftSidebarCollapsed}
            onToggleLeftSidebar={() => setLeftSidebarCollapsed((c) => !c)}
            rightSidebarCollapsed={rightSidebarCollapsed}
            onToggleRightSidebar={() => setRightSidebarCollapsed((c) => !c)}
            multiSelectMode={multiSelectMode}
            multiSelectCount={selectedIds.length}
            onToggleMultiSelect={handleToggleMultiSelect}
            copiedJson={copiedJson}
            onCopyTreeJson={handleCopyTreeJson}
            isExportingPdf={isExportingPdf}
            onExportPdf={handleExportPdf}
            onExportFormat={handleExportFormat}
            previewMode={previewMode}
            onTogglePreview={() => {
              setPreviewMode((p) => !p);
              setResponsivePreview(false);
              setShowCode(false);
            }}
            responsivePreview={responsivePreview}
            onToggleResponsivePreview={() => {
              setResponsivePreview((r) => !r);
              setShowCode(false);
            }}
            showCode={showCode}
            onToggleShowCode={() => setShowCode((s) => !s)}
          />

          {!previewMode && !showCode && !responsivePreview && (
            <CanvasBreadcrumb
              nodes={nodes}
              selectedId={selectedId}
              onSelectNode={(id) => handleSelectNode(id, false)}
            />
          )}

          <div className="relative flex-1 flex flex-col min-h-0 overflow-hidden">
            {showRulers && !showCode && !responsivePreview && (
              <CanvasRulers
                scrollContainerRef={canvasScrollRef}
                canvasViewportRef={canvasViewportRef}
                selectedId={selectedId}
                nodes={nodes}
                viewport={viewport}
                zoom={zoom}
              />
            )}

            <div
              ref={canvasScrollRef}
              className={`flex-1 overflow-auto bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:18px_18px] ${
                showRulers && !showCode && !responsivePreview
                  ? 'pt-10 pl-10 pr-6 pb-6'
                  : 'p-6'
              }`}
              onClick={() => {
                if (!previewMode && !showCode && !responsivePreview) {
                  setSelectedIds(['root']);
                }
              }}
            >
              {showCode ? (
                <CodeExportView
                  reactCode={generatedCode}
                  htmlCode={generatedHtml}
                  svgCode={generatedSvg}
                  activeFormat={codeExportFormat}
                  onChangeFormat={setCodeExportFormat}
                  isPrettier={isJsxPrettier}
                  onTogglePrettier={() => setIsJsxPrettier((p) => !p)}
                  copied={copied}
                  onCopy={handleCopyCode}
                  onDownloadFormat={handleExportFormat}
                  isExportingPdf={isExportingPdf}
                />
              ) : responsivePreview ? (
                <ResponsivePreview
                  nodes={nodes}
                  selectedId={selectedId}
                  selectedIds={selectedIds}
                  onSelectViewportForEditing={(nextViewport) => {
                    setViewport(nextViewport);
                    setResponsivePreview(false);
                    setPreviewMode(false);
                  }}
                  onExitResponsivePreview={() => setResponsivePreview(false)}
                  onSelectNode={handleSelectNode}
                  onMoveNode={handleMoveNode}
                  onDropNewComponent={handleDropNewComponent}
                  onDropCardPreset={handleDropCardPreset}
                  onDropNewIcon={handleDropNewIcon}
                  onDropSavedComponent={handleDropSavedComponent}
                  onDropAsset={handleDropAsset}
                />
              ) : (
                <div
                  ref={canvasViewportRef}
                  data-testid="canvas-viewport"
                  data-viewport={viewport}
                  data-zoom={Math.round(zoom * 100)}
                  className={`${viewportWidthClass} ${getZoomScaleClass(
                    zoom
                  )} ${
                    zoom > 1 ? 'origin-top-left' : 'origin-top'
                  } mx-auto min-h-full flex flex-col bg-white shadow-lg rounded-2xl border border-slate-200 overflow-hidden transition-all duration-200`}
                >
                  <CanvasNode
                    id="root"
                    nodes={nodes}
                    selectedId={selectedId}
                    selectedIds={selectedIds}
                    previewMode={previewMode}
                    showGuides={showGuides}
                    onSelect={handleSelectNode}
                    onMoveNode={handleMoveNode}
                    onDropNewComponent={handleDropNewComponent}
                    onDropCardPreset={handleDropCardPreset}
                    onDropNewIcon={handleDropNewIcon}
                    onDropSavedComponent={handleDropSavedComponent}
                    onDropAsset={handleDropAsset}
                  />
                </div>
              )}
            </div>
          </div>

          {!showShortcutsModal && (
            <button
              type="button"
              aria-label="Keyboard Shortcuts"
              title="Keyboard Shortcuts (?)"
              onClick={(e) => {
                e.stopPropagation();
                setShowShortcutsModal(true);
              }}
              className="absolute bottom-3 right-4 z-20 inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white/95 hover:bg-white border border-slate-200 hover:border-blue-300 rounded-xl shadow-md text-xs font-semibold text-slate-700 hover:text-blue-700 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <Keyboard className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="font-mono">?</span>
            </button>
          )}

          <KeyboardShortcutsModal
            open={showShortcutsModal}
            onClose={() => setShowShortcutsModal(false)}
          />
        </main>

        {!rightSidebarCollapsed && (
          <InspectorPanel
            selectedId={selectedId}
            selectedIds={selectedIds}
            selectedNode={selectedNode}
            nodes={nodes}
            onUpdateNode={handleUpdateSelectedNode}
            onBulkUpdateClassName={handleBulkUpdateClassName}
            onAppendBulkClasses={handleAppendBulkClasses}
            onClearMultiSelect={handleClearMultiSelect}
            onBulkDeleteNodes={handleBulkDeleteNodes}
            onChangeVariant={handleChangeSelectedVariant}
            onReplaceNodes={handleReplaceNodes}
            onUpdateNodeClassById={handleUpdateNodeClassById}
            onSelectNode={(id) => handleSelectNode(id, false)}
            onAddGridNode={() => handleAddNode('Grid')}
            onDuplicateNode={handleDuplicateSelectedNode}
            onDeleteNode={handleDeleteSelectedNode}
            onSaveAsComponent={() => handleSaveSelectedComponent()}
            showShortcutsModal={showShortcutsModal}
            onToggleShortcutsModal={() =>
              setShowShortcutsModal((prev) => !prev)
            }
            themeVars={themeVars}
            onAddThemeVar={handleAddThemeVar}
            onUpdateThemeVar={handleUpdateThemeVar}
            onDeleteThemeVar={handleDeleteThemeVar}
            onReplaceThemeVars={handleReplaceThemeVars}
            onSetNodeThemeOverride={handleSetNodeThemeOverride}
            onClearNodeThemeOverrides={handleClearNodeThemeOverrides}
            onFixDesignLintIssue={handleFixDesignLintIssue}
            onFixAllDesignLint={handleFixAllDesignLint}
            onCollapse={() => setRightSidebarCollapsed(true)}
            seoMetadata={seoMetadata}
            onChangeSeo={handleChangeSeo}
          />
        )}
      </div>
    </DndProvider>
  );
}
