import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { CanvasBreadcrumb } from './components/CanvasBreadcrumb';
import { CanvasNode } from './components/CanvasNode';
import { CodeExportView } from './components/CodeExportView';
import { EditorToolbar } from './components/EditorToolbar';
import { InspectorPanel } from './components/InspectorPanel';
import { LeftSidebar } from './components/LeftSidebar';
import {
  COMPONENT_HISTORY_STORAGE_KEY,
  DEFAULT_SEO_METADATA,
  DEFAULT_THEME_VARS,
  INITIAL_NODES,
  SEO_STORAGE_KEY,
  STORAGE_KEY,
  THEME_STORAGE_KEY,
  type TemplateBlueprintNode,
} from './constants/editorDefaults';
import type {
  ComponentHistoryEntry,
  ComponentHistoryEventType,
  HistoryState,
  LeftTab,
  NodesMap,
  NodeType,
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
  applyNodeVariantInTree,
  buildThemeCssRules,
  createComponentHistoryEntry,
  deleteNodeFromTree,
  duplicateNodeInTree,
  generateId,
  generateReactJSX,
  getParentNodeId,
  getZoomScaleClass,
  insertIconNodeAtTarget,
  insertPageTemplateIntoTree,
  moveNodeRelativeToTarget,
  prependComponentHistory,
  refreshAddedComponentHistoryEntry,
  reinsertComponentFromHistory,
  serializeNodesToJson,
  stepZoom,
  updateNodeInTree,
  type DropPosition,
} from './utils/editorLogic';
import { exportCanvasElementAsPdf } from './utils/pdfExport';

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

export default function App() {
  const [history, setHistory] = useState<HistoryState>(loadInitialHistory);
  const nodes = history.present;
  const [themeVars, setThemeVars] = useState<ThemeVariable[]>(loadInitialThemeVars);
  const [seoMetadata, setSeoMetadata] = useState<SeoMetadata>(
    loadInitialSeoMetadata
  );
  const [componentHistory, setComponentHistory] = useState<
    ComponentHistoryEntry[]
  >(loadInitialComponentHistory);

  const [selectedId, setSelectedId] = useState<string>('root');
  const [leftTab, setLeftTab] = useState<LeftTab>('components');
  const [viewport, setViewport] = useState<ViewportMode>('desktop');
  const [zoom, setZoom] = useState<number>(DEFAULT_ZOOM);
  const [showGuides, setShowGuides] = useState<boolean>(false);
  const [previewMode, setPreviewMode] = useState<boolean>(false);
  const [showCode, setShowCode] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedJson, setCopiedJson] = useState<boolean>(false);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [confirmReset, setConfirmReset] = useState<boolean>(false);
  const canvasViewportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nodes));
    } catch {
      // Ignore storage quota errors
    }
  }, [nodes]);

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

  const handleAddNode = useCallback(
    (type: NodeType) => {
      const result = addNodeToTree(nodes, selectedId, type);
      if (!result.createdId) return;
      commitNodes(result.nodes);
      setSelectedId(result.createdId);
      recordComponentHistory(result.nodes, result.createdId, 'added');
    },
    [nodes, selectedId, commitNodes, recordComponentHistory]
  );

  const handleAddIconNode = useCallback(
    (iconName: string) => {
      const result = addIconNodeToTree(nodes, selectedId, iconName);
      if (!result.createdId) return;
      commitNodes(result.nodes);
      setSelectedId(result.createdId);
      recordComponentHistory(result.nodes, result.createdId, 'added');
    },
    [nodes, selectedId, commitNodes, recordComponentHistory]
  );

  const handleAddCardPreset = useCallback(() => {
    const result = addCardPresetToTree(nodes, selectedId);
    if (!result.createdId) return;
    commitNodes(result.nodes);
    setSelectedId(result.createdId);
    recordComponentHistory(result.nodes, result.createdId, 'added');
  }, [nodes, selectedId, commitNodes, recordComponentHistory]);

  const handleInsertPageTemplate = useCallback(
    (blueprint: TemplateBlueprintNode) => {
      const result = insertPageTemplateIntoTree(nodes, selectedId, blueprint);
      if (!result.createdId) return;
      commitNodes(result.nodes);
      setSelectedId(result.createdId);
      recordComponentHistory(result.nodes, result.createdId, 'added');
    },
    [nodes, selectedId, commitNodes, recordComponentHistory]
  );

  const handleReinsertFromHistory = useCallback(
    (entry: ComponentHistoryEntry) => {
      const result = reinsertComponentFromHistory(nodes, selectedId, entry);
      if (!result.createdId) return;
      commitNodes(result.nodes);
      setSelectedId(result.createdId);
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
    setSelectedId(result.createdId);
    recordComponentHistory(result.nodes, result.createdId, 'added');
  }, [nodes, selectedId, commitNodes, recordComponentHistory]);

  const handleMoveNode = useCallback(
    (dragId: string, targetId: string, position: DropPosition) => {
      commitNodes((prev) =>
        moveNodeRelativeToTarget(prev, dragId, targetId, position)
      );
      setSelectedId(dragId);
    },
    [commitNodes]
  );

  const handleDropNewIcon = useCallback(
    (iconName: string, targetId: string, position: DropPosition) => {
      const result = insertIconNodeAtTarget(nodes, iconName, targetId, position);
      if (!result.createdId) return;
      commitNodes(result.nodes);
      setSelectedId(result.createdId);
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
    setSelectedId(result.nextSelectedId);
  }, [nodes, selectedId, commitNodes, recordComponentHistory]);

  const handleReplaceNodes = useCallback(
    (nextNodes: NodesMap) => {
      commitNodes(nextNodes);
      if (!nextNodes[selectedId]) {
        setSelectedId('root');
      }
    },
    [commitNodes, selectedId]
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
        if (selectedId !== 'root') {
          e.preventDefault();
          handleDeleteSelectedNode();
        }
        return;
      }

      if (e.key === 'Escape') {
        const parentId = getParentNodeId(nodes, selectedId);
        if (parentId) {
          e.preventDefault();
          setSelectedId(parentId);
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
    nodes,
    selectedId,
    previewMode,
    showCode,
  ]);

  const handleResetCanvas = useCallback(() => {
    if (!confirmReset) {
      setConfirmReset(true);
      window.setTimeout(() => setConfirmReset(false), 3000);
      return;
    }
    commitNodes(INITIAL_NODES);
    setSelectedId('root');
    setConfirmReset(false);
  }, [confirmReset, commitNodes]);

  const generatedCode = useMemo(
    () => generateReactJSX(nodes, seoMetadata),
    [nodes, seoMetadata]
  );
  const themeCssRules = useMemo(() => buildThemeCssRules(themeVars), [themeVars]);

  const handleCopyCode = useCallback(() => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(generatedCode).catch(() => {});
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }, [generatedCode]);

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
      <div className="flex h-screen w-full bg-slate-100 font-sans text-slate-900 overflow-hidden">
        <LeftSidebar
          leftTab={leftTab}
          onChangeTab={setLeftTab}
          onAddNode={handleAddNode}
          onAddIconNode={handleAddIconNode}
          onAddCardPreset={handleAddCardPreset}
          onInsertPageTemplate={handleInsertPageTemplate}
          componentHistory={componentHistory}
          onReinsertFromHistory={handleReinsertFromHistory}
          onRemoveHistoryEntry={handleRemoveHistoryEntry}
          onClearComponentHistory={handleClearComponentHistory}
          nodes={nodes}
          selectedId={selectedId}
          onSelectNode={setSelectedId}
        />

        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <EditorToolbar
            canUndo={history.past.length > 0}
            canRedo={history.future.length > 0}
            onUndo={handleUndo}
            onRedo={handleRedo}
            confirmReset={confirmReset}
            onReset={handleResetCanvas}
            viewport={viewport}
            onChangeViewport={setViewport}
            zoom={zoom}
            onZoomIn={() => setZoom((z) => stepZoom(z, 'in'))}
            onZoomOut={() => setZoom((z) => stepZoom(z, 'out'))}
            onResetZoom={() => setZoom(DEFAULT_ZOOM)}
            showGuides={showGuides}
            onToggleGuides={() => setShowGuides((g) => !g)}
            copiedJson={copiedJson}
            onCopyTreeJson={handleCopyTreeJson}
            isExportingPdf={isExportingPdf}
            onExportPdf={handleExportPdf}
            previewMode={previewMode}
            onTogglePreview={() => {
              setPreviewMode((p) => !p);
              setShowCode(false);
            }}
            showCode={showCode}
            onToggleShowCode={() => setShowCode((s) => !s)}
          />

          {!previewMode && !showCode && (
            <CanvasBreadcrumb
              nodes={nodes}
              selectedId={selectedId}
              onSelectNode={setSelectedId}
            />
          )}

          <div
            className="flex-1 overflow-auto p-6 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:18px_18px]"
            onClick={() => {
              if (!previewMode && !showCode) {
                setSelectedId('root');
              }
            }}
          >
            {showCode ? (
              <CodeExportView
                generatedCode={generatedCode}
                copied={copied}
                onCopy={handleCopyCode}
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
                  previewMode={previewMode}
                  showGuides={showGuides}
                  onSelect={setSelectedId}
                  onMoveNode={handleMoveNode}
                  onDropNewIcon={handleDropNewIcon}
                />
              </div>
            )}
          </div>
        </main>

        <InspectorPanel
          selectedId={selectedId}
          selectedNode={selectedNode}
          nodes={nodes}
          onUpdateNode={handleUpdateSelectedNode}
          onChangeVariant={handleChangeSelectedVariant}
          onReplaceNodes={handleReplaceNodes}
          onDuplicateNode={handleDuplicateSelectedNode}
          onDeleteNode={handleDeleteSelectedNode}
          themeVars={themeVars}
          onAddThemeVar={handleAddThemeVar}
          onUpdateThemeVar={handleUpdateThemeVar}
          onDeleteThemeVar={handleDeleteThemeVar}
          seoMetadata={seoMetadata}
          onChangeSeo={handleChangeSeo}
        />
      </div>
    </DndProvider>
  );
}
