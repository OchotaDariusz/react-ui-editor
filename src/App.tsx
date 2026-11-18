import { useCallback, useEffect, useMemo, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { CanvasNode } from './components/CanvasNode';
import { CodeExportView } from './components/CodeExportView';
import { EditorToolbar } from './components/EditorToolbar';
import { InspectorPanel } from './components/InspectorPanel';
import { LeftSidebar } from './components/LeftSidebar';
import {
  DEFAULT_THEME_VARS,
  INITIAL_NODES,
  STORAGE_KEY,
  THEME_STORAGE_KEY,
  type TemplateBlueprintNode,
} from './constants/editorDefaults';
import type {
  HistoryState,
  LeftTab,
  NodesMap,
  NodeType,
  ThemeVarCategory,
  ThemeVariable,
  ViewportMode,
} from './types/editor';
import {
  addCardPresetToTree,
  addNodeToTree,
  buildThemeCssRules,
  deleteNodeFromTree,
  duplicateNodeInTree,
  generateId,
  generateReactJSX,
  getParentNodeId,
  insertPageTemplateIntoTree,
  moveNodeRelativeToTarget,
  updateNodeInTree,
  type DropPosition,
} from './utils/editorLogic';

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

export default function App() {
  const [history, setHistory] = useState<HistoryState>(loadInitialHistory);
  const nodes = history.present;
  const [themeVars, setThemeVars] = useState<ThemeVariable[]>(loadInitialThemeVars);

  const [selectedId, setSelectedId] = useState<string>('root');
  const [leftTab, setLeftTab] = useState<LeftTab>('components');
  const [viewport, setViewport] = useState<ViewportMode>('desktop');
  const [previewMode, setPreviewMode] = useState<boolean>(false);
  const [showCode, setShowCode] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [confirmReset, setConfirmReset] = useState<boolean>(false);

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

  const handleAddNode = useCallback(
    (type: NodeType) => {
      let created: string | null = null;
      commitNodes((prev) => {
        const result = addNodeToTree(prev, selectedId, type);
        created = result.createdId;
        return result.nodes;
      });
      if (created) setSelectedId(created);
    },
    [selectedId, commitNodes]
  );

  const handleAddCardPreset = useCallback(() => {
    let created: string | null = null;
    commitNodes((prev) => {
      const result = addCardPresetToTree(prev, selectedId);
      created = result.createdId;
      return result.nodes;
    });
    if (created) setSelectedId(created);
  }, [selectedId, commitNodes]);

  const handleInsertPageTemplate = useCallback(
    (blueprint: TemplateBlueprintNode) => {
      let created: string | null = null;
      commitNodes((prev) => {
        const result = insertPageTemplateIntoTree(prev, selectedId, blueprint);
        created = result.createdId;
        return result.nodes;
      });
      if (created) setSelectedId(created);
    },
    [selectedId, commitNodes]
  );

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

  const handleUpdateSelectedNode = useCallback(
    (key: string, value: string, isProp = false) => {
      commitNodes((prev) =>
        updateNodeInTree(prev, selectedId, key, value, isProp)
      );
    },
    [selectedId, commitNodes]
  );

  const handleDuplicateSelectedNode = useCallback(() => {
    let created: string | null = null;
    commitNodes((prev) => {
      const result = duplicateNodeInTree(prev, selectedId);
      created = result.createdId;
      return result.nodes;
    });
    if (created) setSelectedId(created);
  }, [selectedId, commitNodes]);

  const handleMoveNode = useCallback(
    (dragId: string, targetId: string, position: DropPosition) => {
      commitNodes((prev) =>
        moveNodeRelativeToTarget(prev, dragId, targetId, position)
      );
      setSelectedId(dragId);
    },
    [commitNodes]
  );

  const handleDeleteSelectedNode = useCallback(() => {
    let nextId = selectedId;
    commitNodes((prev) => {
      const result = deleteNodeFromTree(prev, selectedId);
      nextId = result.nextSelectedId;
      return result.nodes;
    });
    setSelectedId(nextId);
  }, [selectedId, commitNodes]);

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

  const generatedCode = useMemo(() => generateReactJSX(nodes), [nodes]);
  const themeCssRules = useMemo(() => buildThemeCssRules(themeVars), [themeVars]);

  const handleCopyCode = useCallback(() => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(generatedCode).catch(() => {});
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }, [generatedCode]);

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
          onAddCardPreset={handleAddCardPreset}
          onInsertPageTemplate={handleInsertPageTemplate}
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
            previewMode={previewMode}
            onTogglePreview={() => {
              setPreviewMode((p) => !p);
              setShowCode(false);
            }}
            showCode={showCode}
            onToggleShowCode={() => setShowCode((s) => !s)}
          />

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
                data-testid="canvas-viewport"
                data-viewport={viewport}
                className={`${viewportWidthClass} mx-auto min-h-full flex flex-col bg-white shadow-lg rounded-2xl border border-slate-200 overflow-hidden transition-all duration-300`}
              >
                <CanvasNode
                  id="root"
                  nodes={nodes}
                  selectedId={selectedId}
                  previewMode={previewMode}
                  onSelect={setSelectedId}
                  onMoveNode={handleMoveNode}
                />
              </div>
            )}
          </div>
        </main>

        <InspectorPanel
          selectedId={selectedId}
          selectedNode={selectedNode}
          onUpdateNode={handleUpdateSelectedNode}
          onDuplicateNode={handleDuplicateSelectedNode}
          onDeleteNode={handleDeleteSelectedNode}
          themeVars={themeVars}
          onAddThemeVar={handleAddThemeVar}
          onUpdateThemeVar={handleUpdateThemeVar}
          onDeleteThemeVar={handleDeleteThemeVar}
        />
      </div>
    </DndProvider>
  );
}
