import React, { useState, useCallback, useEffect, useMemo, memo } from 'react';
import {
  Layout,
  Type,
  Square,
  Image as ImageIcon,
  TextCursorInput,
  Trash2,
  Code,
  MousePointer2,
  Copy,
  Check,
  Undo2,
  Redo2,
  Layers,
  Plus,
  Monitor,
  Tablet,
  Smartphone,
  ArrowUp,
  ArrowDown,
  Files,
  RotateCcw,
  Heading,
  Tag,
  CreditCard,
  ChevronRight,
  ChevronDown,
  Eye,
  Edit3
} from 'lucide-react';

// --- Stałe konfiguracyjne ---
const STORAGE_KEY = 'react_ui_editor_state_v2';

const INITIAL_NODES = {
  root: {
    id: 'root',
    type: 'Container',
    name: 'Root Canvas',
    parentId: null,
    props: {
      className: 'p-8 bg-white min-h-full w-full flex flex-col gap-6'
    },
    children: ['hero-1']
  },
  'hero-1': {
    id: 'hero-1',
    type: 'Container',
    name: 'Hero Section',
    parentId: 'root',
    props: {
      className: 'p-8 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-start gap-4'
    },
    children: ['badge-1', 'heading-1', 'text-1', 'btn-1']
  },
  'badge-1': {
    id: 'badge-1',
    type: 'Badge',
    name: 'Badge',
    content: 'Nowa Wersja 2.0',
    parentId: 'hero-1',
    props: {
      className: 'px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full'
    },
    children: []
  },
  'heading-1': {
    id: 'heading-1',
    type: 'Heading',
    name: 'Nagłówek główny',
    content: 'Zbuduj interfejs React wizualnie',
    parentId: 'hero-1',
    props: {
      className: 'text-3xl font-bold text-slate-900 tracking-tight'
    },
    children: []
  },
  'text-1': {
    id: 'text-1',
    type: 'Text',
    name: 'Opis',
    content: 'Kliknij dowolny element, aby edytować jego klasy Tailwind CSS, duplikować lub zmieniać kolejność w drzewie warstw.',
    parentId: 'hero-1',
    props: {
      className: 'text-base text-slate-600 max-w-xl leading-relaxed'
    },
    children: []
  },
  'btn-1': {
    id: 'btn-1',
    type: 'Button',
    name: 'Przycisk CTA',
    content: 'Rozpocznij projekt',
    parentId: 'hero-1',
    props: {
      className: 'px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm shadow-sm'
    },
    children: []
  }
};

// --- Szablony nowych komponentów ---
const ELEMENT_TEMPLATES = {
  Container: {
    type: 'Container',
    name: 'Kontener',
    props: {
      className: 'p-4 bg-white border border-dashed border-slate-300 min-h-[80px] flex flex-col gap-3 rounded-lg'
    },
    children: []
  },
  Heading: {
    type: 'Heading',
    name: 'Nagłówek',
    content: 'Nowy nagłówek',
    props: { className: 'text-2xl font-bold text-slate-900' },
    children: []
  },
  Text: {
    type: 'Text',
    name: 'Tekst',
    content: 'Edytuj treść tego akapitu w panelu właściwości.',
    props: { className: 'text-sm text-slate-600 leading-relaxed' },
    children: []
  },
  Button: {
    type: 'Button',
    name: 'Przycisk',
    content: 'Kliknij mnie',
    props: {
      className: 'px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-fit font-medium text-sm'
    },
    children: []
  },
  Badge: {
    type: 'Badge',
    name: 'Odznaka',
    content: 'Status',
    props: {
      className: 'px-2.5 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full w-fit'
    },
    children: []
  },
  Input: {
    type: 'Input',
    name: 'Pole tekstowe',
    props: {
      className: 'border border-slate-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full text-sm',
      placeholder: 'Wpisz wartość...'
    },
    children: []
  },
  Image: {
    type: 'Image',
    name: 'Obraz',
    props: {
      className: 'w-full max-w-md h-48 rounded-xl object-cover',
      src: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop'
    },
    children: []
  }
};

// Generator krótkich, unikalnych identyfikatorów
const generateId = () => `node_${Math.random().toString(36).slice(2, 9)}`;

// Pomocnicza funkcja podmieniająca klasy z danej grupy Tailwind (np. flex-row vs flex-col)
const toggleTailwindGroup = (currentClass = '', groupClasses = [], nextClass = '') => {
  const tokens = currentClass.split(/\s+/).filter(Boolean);
  const filtered = tokens.filter((t) => !groupClasses.includes(t));
  if (nextClass) {
    filtered.push(nextClass);
  }
  return filtered.join(' ');
};

// --- Zoptymalizowany węzeł płótna (React.memo) ---
const CanvasNode = memo(function CanvasNode({
  id,
  nodes,
  selectedId,
  previewMode,
  onSelect
}) {
  const node = nodes[id];
  if (!node) return null;

  const isSelected = !previewMode && selectedId === id;

  const handleClick = (e) => {
    if (previewMode) return;
    e.stopPropagation();
    onSelect(id);
  };

  const editorOutlineClass = previewMode
    ? ''
    : isSelected
      ? 'ring-2 ring-blue-500 ring-offset-1 relative z-10'
      : 'hover:ring-1 hover:ring-blue-300 relative transition-shadow duration-150 cursor-pointer';

  const mergedProps = {
    ...node.props,
    className: `${node.props.className || ''} ${editorOutlineClass}`.trim(),
    onClick: handleClick
  };

  switch (node.type) {
    case 'Container':
      return (
        <div {...mergedProps}>
          {node.children.length === 0 && !previewMode && (
            <span className="text-xs text-slate-400 pointer-events-none select-none italic">
              Pusty kontener ({node.name || node.id})
            </span>
          )}
          {node.children.map((childId) => (
            <CanvasNode
              key={childId}
              id={childId}
              nodes={nodes}
              selectedId={selectedId}
              previewMode={previewMode}
              onSelect={onSelect}
            />
          ))}
        </div>
      );
    case 'Heading':
      return <h2 {...mergedProps}>{node.content}</h2>;
    case 'Text':
      return <p {...mergedProps}>{node.content}</p>;
    case 'Badge':
      return <span {...mergedProps}>{node.content}</span>;
    case 'Button':
      return (
        <button type="button" {...mergedProps}>
          {node.content}
        </button>
      );
    case 'Input':
      return (
        <input
          {...mergedProps}
          placeholder={node.props.placeholder}
          readOnly={!previewMode}
        />
      );
    case 'Image':
      return (
        <img
          {...mergedProps}
          src={node.props.src}
          alt={node.name || 'Element graficzny'}
        />
      );
    default:
      return null;
  }
});

// --- Element drzewa warstw (Navigator) ---
const LayerTreeItem = memo(function LayerTreeItem({
  id,
  nodes,
  selectedId,
  depth = 0,
  onSelect
}) {
  const [expanded, setExpanded] = useState(true);
  const node = nodes[id];
  if (!node) return null;

  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedId === id;

  return (
    <div>
      <div
        onClick={() => onSelect(id)}
        style={{ paddingLeft: `${depth * 14 + 8}px` }}
        className={`flex items-center gap-1.5 py-1.5 pr-2 rounded-md text-xs cursor-pointer transition-colors ${
          isSelected
            ? 'bg-blue-50 text-blue-700 font-semibold'
            : 'text-slate-700 hover:bg-slate-100'
        }`}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded((prev) => !prev);
            }}
            className="p-0.5 hover:bg-slate-200 rounded"
          >
            {expanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            )}
          </button>
        ) : (
          <span className="w-4 inline-block" />
        )}

        <span className="truncate flex-1">{node.name || node.type}</span>
        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-mono">
          {node.type.slice(0, 4)}
        </span>
      </div>

      {hasChildren && expanded && (
        <div>
          {node.children.map((childId) => (
            <LayerTreeItem
              key={childId}
              id={childId}
              nodes={nodes}
              selectedId={selectedId}
              depth={depth + 1}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
});

export default function App() {
  // --- Stan z historią Undo/Redo i inicjalizacją z localStorage ---
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.root) {
          return { past: [], present: parsed, future: [] };
        }
      }
    } catch {
      // Ignoruj błędy odczytu localStorage
    }
    return { past: [], present: INITIAL_NODES, future: [] };
  });

  const nodes = history.present;
  const [selectedId, setSelectedId] = useState('root');
  const [leftTab, setLeftTab] = useState('components'); // 'components' | 'layers'
  const [viewport, setViewport] = useState('desktop'); // 'desktop' | 'tablet' | 'mobile'
  const [previewMode, setPreviewMode] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  // Automatyczny zapis do localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nodes));
    } catch {
      // Ignoruj limity pamięci
    }
  }, [nodes]);

  // Bezpieczna aktualizacja stanu z rejestracją w historii Undo/Redo
  const commitNodes = useCallback((updater) => {
    setHistory((curr) => {
      const nextPresent =
        typeof updater === 'function' ? updater(curr.present) : updater;
      if (nextPresent === curr.present) return curr;
      const nextPast = [...curr.past, curr.present].slice(-40);
      return {
        past: nextPast,
        present: nextPresent,
        future: []
      };
    });
  }, []);

  const handleUndo = useCallback(() => {
    setHistory((curr) => {
      if (curr.past.length === 0) return curr;
      const previous = curr.past[curr.past.length - 1];
      return {
        past: curr.past.slice(0, -1),
        present: previous,
        future: [curr.present, ...curr.future]
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
        future: curr.future.slice(1)
      };
    });
  }, []);

  // Skróty klawiszowe (Ctrl+Z, Ctrl+Y)
  useEffect(() => {
    const onKeyDown = (e) => {
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleUndo, handleRedo]);

  // --- Operacje na węzłach ---
  const addNode = useCallback(
    (type) => {
      const newId = generateId();
      const template = ELEMENT_TEMPLATES[type];
      if (!template) return;

      const newNode = JSON.parse(JSON.stringify(template));
      newNode.id = newId;

      commitNodes((prev) => {
        const next = { ...prev };
        let targetParentId = selectedId;
        if (!next[targetParentId] || next[targetParentId].type !== 'Container') {
          targetParentId = next[targetParentId]?.parentId || 'root';
        }

        newNode.parentId = targetParentId;
        next[newId] = newNode;
        next[targetParentId] = {
          ...next[targetParentId],
          children: [...next[targetParentId].children, newId]
        };
        return next;
      });

      setSelectedId(newId);
    },
    [selectedId, commitNodes]
  );

  // Dodanie złożonego presetu (Karta z obrazkiem, tytułem i przyciskiem)
  const addCardPreset = useCallback(() => {
    const cardId = generateId();
    const imgId = generateId();
    const titleId = generateId();
    const descId = generateId();
    const btnId = generateId();

    commitNodes((prev) => {
      const next = { ...prev };
      let targetParentId = selectedId;
      if (!next[targetParentId] || next[targetParentId].type !== 'Container') {
        targetParentId = next[targetParentId]?.parentId || 'root';
      }

      next[cardId] = {
        id: cardId,
        type: 'Container',
        name: 'Karta Produktu',
        parentId: targetParentId,
        props: {
          className:
            'p-5 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col gap-3 max-w-sm'
        },
        children: [imgId, titleId, descId, btnId]
      };
      next[imgId] = {
        id: imgId,
        type: 'Image',
        name: 'Miniatura',
        parentId: cardId,
        props: {
          className: 'w-full h-40 rounded-xl object-cover',
          src: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1000&auto=format&fit=crop'
        },
        children: []
      };
      next[titleId] = {
        id: titleId,
        type: 'Heading',
        name: 'Tytuł karty',
        content: 'Komponent Karty',
        parentId: cardId,
        props: { className: 'text-lg font-bold text-slate-900' },
        children: []
      };
      next[descId] = {
        id: descId,
        type: 'Text',
        name: 'Opis karty',
        content: 'Gotowy układ wieloelementowy, który możesz dowolnie rozbudowywać.',
        parentId: cardId,
        props: { className: 'text-sm text-slate-600' },
        children: []
      };
      next[btnId] = {
        id: btnId,
        type: 'Button',
        name: 'Akcja',
        content: 'Zobacz szczegóły',
        parentId: cardId,
        props: {
          className:
            'mt-1 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-sm font-medium w-full'
        },
        children: []
      };

      next[targetParentId] = {
        ...next[targetParentId],
        children: [...next[targetParentId].children, cardId]
      };
      return next;
    });

    setSelectedId(cardId);
  }, [selectedId, commitNodes]);

  const updateSelectedNode = useCallback(
    (key, value, isProp = false) => {
      commitNodes((prev) => {
        if (!prev[selectedId]) return prev;
        const next = { ...prev };
        const node = { ...next[selectedId] };
        if (isProp) {
          node.props = { ...node.props, [key]: value };
        } else {
          node[key] = value;
        }
        next[selectedId] = node;
        return next;
      });
    },
    [selectedId, commitNodes]
  );

  // Głębokie duplikowanie wybranego węzła (wraz z dziećmi)
  const duplicateSelectedNode = useCallback(() => {
    if (selectedId === 'root' || !nodes[selectedId]) return;
    let rootCloneId = null;

    commitNodes((prev) => {
      const next = { ...prev };
      const target = next[selectedId];
      if (!target || !target.parentId) return prev;

      const cloneSubtree = (oldId, newParentId) => {
        const original = next[oldId];
        const newId = generateId();
        const clonedChildren = (original.children || []).map((cId) =>
          cloneSubtree(cId, newId)
        );
        next[newId] = {
          ...JSON.parse(JSON.stringify(original)),
          id: newId,
          name: `${original.name || original.type} (kopia)`,
          parentId: newParentId,
          children: clonedChildren
        };
        return newId;
      };

      rootCloneId = cloneSubtree(selectedId, target.parentId);
      const parent = next[target.parentId];
      const idx = parent.children.indexOf(selectedId);
      const updatedChildren = [...parent.children];
      updatedChildren.splice(idx + 1, 0, rootCloneId);

      next[target.parentId] = { ...parent, children: updatedChildren };
      return next;
    });

    if (rootCloneId) setSelectedId(rootCloneId);
  }, [selectedId, nodes, commitNodes]);

  // Przesuwanie elementu w górę lub w dół w obrębie rodzica
  const moveSelectedNode = useCallback(
    (direction) => {
      if (selectedId === 'root') return;
      commitNodes((prev) => {
        const node = prev[selectedId];
        if (!node || !node.parentId) return prev;
        const parent = prev[node.parentId];
        const idx = parent.children.indexOf(selectedId);
        const swapIdx = idx + direction;
        if (swapIdx < 0 || swapIdx >= parent.children.length) return prev;

        const newChildren = [...parent.children];
        [newChildren[idx], newChildren[swapIdx]] = [
          newChildren[swapIdx],
          newChildren[idx]
        ];

        return {
          ...prev,
          [parent.id]: { ...parent, children: newChildren }
        };
      });
    },
    [selectedId, commitNodes]
  );

  const deleteSelectedNode = useCallback(() => {
    if (selectedId === 'root') return;

    commitNodes((prev) => {
      const next = { ...prev };
      const nodeToDelete = next[selectedId];
      if (!nodeToDelete) return prev;
      const parentId = nodeToDelete.parentId;

      const deleteRecursively = (id) => {
        const n = next[id];
        if (n?.children) n.children.forEach(deleteRecursively);
        delete next[id];
      };

      if (next[parentId]) {
        next[parentId] = {
          ...next[parentId],
          children: next[parentId].children.filter((id) => id !== selectedId)
        };
      }

      deleteRecursively(selectedId);
      return next;
    });

    setSelectedId('root');
  }, [selectedId, commitNodes]);

  const handleResetCanvas = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      setTimeout(() => setConfirmReset(false), 3000);
      return;
    }
    commitNodes(INITIAL_NODES);
    setSelectedId('root');
    setConfirmReset(false);
  };

  // --- Generator kompletnego kodu komponentu React ---
  const generatedCode = useMemo(() => {
    const buildNodeJSX = (id, indent = '    ') => {
      const node = nodes[id];
      if (!node) return '';
      const props = node.props || {};
      const cleanClass = (props.className || '').replace(/\s+/g, ' ').trim();
      let propsStr = cleanClass ? ` className="${cleanClass}"` : '';

      if (node.type === 'Input' && props.placeholder) {
        propsStr += ` placeholder="${props.placeholder}"`;
      }
      if (node.type === 'Image' && props.src) {
        propsStr += ` src="${props.src}" alt="${node.name || 'image'}"`;
      }

      if (node.type === 'Container') {
        if (node.children.length === 0) return `${indent}<div${propsStr} />\n`;
        const inner = node.children
          .map((cId) => buildNodeJSX(cId, indent + '  '))
          .join('');
        return `${indent}<div${propsStr}>\n${inner}${indent}</div>\n`;
      }
      if (node.type === 'Heading') return `${indent}<h2${propsStr}>${node.content}</h2>\n`;
      if (node.type === 'Text') return `${indent}<p${propsStr}>${node.content}</p>\n`;
      if (node.type === 'Badge') return `${indent}<span${propsStr}>${node.content}</span>\n`;
      if (node.type === 'Button') return `${indent}<button type="button"${propsStr}>${node.content}</button>\n`;
      if (node.type === 'Input') return `${indent}<input${propsStr} />\n`;
      if (node.type === 'Image') return `${indent}<img${propsStr} />\n`;
      return '';
    };

    return `import React from 'react';\n\nexport default function GeneratedUI() {\n  return (\n${buildNodeJSX('root')}  );\n}\n`;
  }, [nodes]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const selectedNode = nodes[selectedId];

  const viewportWidthClass =
    viewport === 'mobile'
      ? 'max-w-[375px]'
      : viewport === 'tablet'
        ? 'max-w-[768px]'
        : 'max-w-5xl';

  return (
    <div className="flex h-screen w-full bg-slate-100 font-sans text-slate-900 overflow-hidden">
      {/* LEWY PANEL: Komponenty / Drzewo Warstw */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 z-20">
        <div className="h-14 px-4 border-b border-slate-200 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
            <MousePointer2 className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm tracking-tight">React UI Studio</span>
        </div>

        {/* Zakładki lewego panelu */}
        <div className="grid grid-cols-2 p-2 gap-1 border-b border-slate-100 bg-slate-50/70">
          <button
            type="button"
            onClick={() => setLeftTab('components')}
            className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              leftTab === 'components'
                ? 'bg-white text-blue-600 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            Elementy
          </button>
          <button
            type="button"
            onClick={() => setLeftTab('layers')}
            className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              leftTab === 'layers'
                ? 'bg-white text-blue-600 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Warstwy
          </button>
        </div>

        {leftTab === 'components' ? (
          <div className="p-3.5 flex-1 overflow-y-auto space-y-5">
            <div>
              <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                Podstawowe
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { type: 'Container', label: 'Kontener', icon: Layout },
                  { type: 'Heading', label: 'Nagłówek', icon: Heading },
                  { type: 'Text', label: 'Tekst', icon: Type },
                  { type: 'Button', label: 'Przycisk', icon: Square },
                  { type: 'Badge', label: 'Odznaka', icon: Tag },
                  { type: 'Input', label: 'Input', icon: TextCursorInput },
                  { type: 'Image', label: 'Obraz', icon: ImageIcon }
                ].map(({ type, label, icon: Icon }) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => addNode(type)}
                    className="flex flex-col items-center justify-center p-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl transition-all group"
                  >
                    <Icon className="w-5 h-5 mb-1.5 text-slate-600 group-hover:text-blue-600" />
                    <span className="text-xs font-medium text-slate-700">
                      {label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                Gotowe Sekcje
              </h2>
              <button
                type="button"
                onClick={addCardPreset}
                className="w-full flex items-center gap-3 p-3 bg-gradient-to-r from-slate-50 to-blue-50/40 hover:from-blue-50 hover:to-blue-100/60 border border-slate-200 hover:border-blue-300 rounded-xl transition-all text-left"
              >
                <CreditCard className="w-5 h-5 text-blue-600 shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-slate-800">
                    Karta Produktu
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Obraz + Tytuł + Opis + CTA
                  </div>
                </div>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-2 flex-1 overflow-y-auto">
            <LayerTreeItem
              id="root"
              nodes={nodes}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          </div>
        )}
      </aside>

      {/* ŚRODKOWY OBSZAR: Pasek narzędzi + Płótno */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Górny pasek narzędzi */}
        <header className="h-14 bg-white border-b border-slate-200 px-4 flex items-center justify-between gap-2 shrink-0 z-10">
          {/* Historia Undo/Redo */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleUndo}
              disabled={history.past.length === 0}
              title="Cofnij (Ctrl+Z)"
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-35 disabled:hover:bg-transparent transition-colors"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleRedo}
              disabled={history.future.length === 0}
              title="Ponów (Ctrl+Y)"
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-35 disabled:hover:bg-transparent transition-colors"
            >
              <Redo2 className="w-4 h-4" />
            </button>
            <div className="h-5 w-px bg-slate-200 mx-1.5" />
            <button
              type="button"
              onClick={handleResetCanvas}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                confirmReset
                  ? 'bg-red-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {confirmReset ? 'Kliknij ponownie' : 'Reset'}
            </button>
          </div>

          {/* Przełącznik Viewportu */}
          <div className="hidden sm:flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
            {[
              { id: 'desktop', icon: Monitor, title: 'Desktop' },
              { id: 'tablet', icon: Tablet, title: 'Tablet (768px)' },
              { id: 'mobile', icon: Smartphone, title: 'Mobile (375px)' }
            ].map(({ id, icon: Icon, title }) => (
              <button
                key={id}
                type="button"
                title={title}
                onClick={() => setViewport(id)}
                className={`p-1.5 rounded-md transition-all ${
                  viewport === id
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>

          {/* Tryb Podglądu i Eksport Kodu */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setPreviewMode((p) => !p);
                setShowCode(false);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                previewMode
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {previewMode ? (
                <>
                  <Edit3 className="w-3.5 h-3.5" /> Edycja
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" /> Podgląd
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setShowCode((s) => !s)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              <Code className="w-3.5 h-3.5" />
              {showCode ? 'Płótno' : 'Eksport JSX'}
            </button>
          </div>
        </header>

        {/* Obszar roboczy (Canvas lub Kod) */}
        <div
          className="flex-1 overflow-auto p-6 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:18px_18px]"
          onClick={() => !previewMode && setSelectedId('root')}
        >
          {showCode ? (
            <div className="max-w-4xl mx-auto bg-slate-950 rounded-2xl p-6 shadow-xl border border-slate-800 flex flex-col h-full">
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2 text-slate-100 text-sm font-semibold">
                  <Code className="w-4 h-4 text-blue-400" />
                  GeneratedUI.jsx
                </div>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  {copied ? 'Skopiowano!' : 'Kopiuj komponent'}
                </button>
              </div>
              <pre className="text-slate-300 font-mono text-xs leading-relaxed overflow-auto flex-1">
                <code>{generatedCode}</code>
              </pre>
            </div>
          ) : (
            <div
              className={`${viewportWidthClass} mx-auto min-h-full bg-white shadow-lg rounded-2xl border border-slate-200 overflow-hidden transition-all duration-300`}
            >
              <CanvasNode
                id="root"
                nodes={nodes}
                selectedId={selectedId}
                previewMode={previewMode}
                onSelect={setSelectedId}
              />
            </div>
          )}
        </div>
      </main>

      {/* PRAWY PANEL: Inspektor Właściwości */}
      <aside className="w-80 bg-white border-l border-slate-200 flex flex-col shrink-0 z-20">
        <div className="h-14 px-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-bold text-sm">Inspektor</h2>
          {selectedNode && (
            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[11px] font-mono">
              {selectedNode.type}
            </span>
          )}
        </div>

        {selectedNode ? (
          <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-5">
            {/* Nazwa warstwy */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Nazwa warstwy
              </label>
              <input
                type="text"
                value={selectedNode.name || ''}
                onChange={(e) => updateSelectedNode('name', e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            {/* Szybkie akcje na elemencie (Kolejność, Duplikuj) */}
            {selectedId !== 'root' && (
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => moveSelectedNode(-1)}
                  className="flex items-center justify-center gap-1 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
                >
                  <ArrowUp className="w-3.5 h-3.5" /> Góra
                </button>
                <button
                  type="button"
                  onClick={() => moveSelectedNode(1)}
                  className="flex items-center justify-center gap-1 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
                >
                  <ArrowDown className="w-3.5 h-3.5" /> Dół
                </button>
                <button
                  type="button"
                  onClick={duplicateSelectedNode}
                  className="flex items-center justify-center gap-1 py-1.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg text-xs font-medium text-slate-700 hover:text-blue-700"
                >
                  <Files className="w-3.5 h-3.5" /> Kopiuj
                </button>
              </div>
            )}

            {/* Szybkie kontrolki układu dla Kontenera */}
            {selectedNode.type === 'Container' && (
              <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Układ (Flex / Grid)
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { label: 'Kolumna', cls: 'flex-col' },
                    { label: 'Wiersz', cls: 'flex-row' },
                    { label: 'Grid 2x', cls: 'grid-cols-2' }
                  ].map((opt) => {
                    const isGrid = opt.cls.startsWith('grid');
                    return (
                      <button
                        key={opt.cls}
                        type="button"
                        onClick={() => {
                          let updated = toggleTailwindGroup(
                            selectedNode.props.className,
                            ['flex', 'grid', 'flex-col', 'flex-row', 'grid-cols-2'],
                            isGrid ? `grid ${opt.cls}` : `flex ${opt.cls}`
                          );
                          updateSelectedNode('className', updated, true);
                        }}
                        className="py-1.5 px-2 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-md text-[11px] font-medium text-slate-700 transition-colors"
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Treść tekstowa */}
            {['Heading', 'Text', 'Button', 'Badge'].includes(selectedNode.type) && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Treść
                </label>
                <textarea
                  rows={2}
                  value={selectedNode.content || ''}
                  onChange={(e) => updateSelectedNode('content', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none"
                />
              </div>
            )}

            {/* Placeholder dla Input */}
            {selectedNode.type === 'Input' && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Placeholder
                </label>
                <input
                  type="text"
                  value={selectedNode.props.placeholder || ''}
                  onChange={(e) =>
                    updateSelectedNode('placeholder', e.target.value, true)
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>
            )}

            {/* URL Obrazu */}
            {selectedNode.type === 'Image' && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Adres URL obrazu
                </label>
                <input
                  type="text"
                  value={selectedNode.props.src || ''}
                  onChange={(e) => updateSelectedNode('src', e.target.value, true)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>
            )}

            {/* Klasy Tailwind CSS */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Klasy Tailwind CSS
              </label>
              <textarea
                value={selectedNode.props.className || ''}
                onChange={(e) =>
                  updateSelectedNode('className', e.target.value, true)
                }
                className="w-full h-28 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none"
                placeholder="np. p-4 bg-white rounded-xl shadow-sm..."
              />
            </div>

            {/* Usuwanie elementu */}
            {selectedId !== 'root' && (
              <div className="pt-4 border-t border-slate-100 mt-auto">
                <button
                  type="button"
                  onClick={deleteSelectedNode}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-semibold transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Usuń element
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 text-center text-slate-400 text-xs mt-10">
            Zaznacz element na płótnie lub w drzewie warstw.
          </div>
        )}
      </aside>
    </div>
  );
}