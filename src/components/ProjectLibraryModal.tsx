import { useEffect, useRef, useState } from 'react';
import {
  Check,
  Clock,
  Download,
  Edit3,
  FolderOpen,
  Layers,
  Plus,
  Save,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import type { SavedProjectRecord } from '../types/editor';

interface ProjectLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: SavedProjectRecord[];
  activeProjectId: string | null;
  defaultProjectName: string;
  onSaveProject: (options: {
    name: string;
    description: string;
    asNew: boolean;
  }) => void;
  onOpenProject: (project: SavedProjectRecord) => void;
  onRenameProject: (projectId: string, nextName: string) => void;
  onDeleteProject: (projectId: string) => void;
  onDownloadProjectFile: (project: SavedProjectRecord) => void;
  onImportProjectFile: (rawJson: string) => boolean;
}

export function ProjectLibraryModal({
  isOpen,
  onClose,
  projects,
  activeProjectId,
  defaultProjectName,
  onSaveProject,
  onOpenProject,
  onRenameProject,
  onDeleteProject,
  onDownloadProjectFile,
  onImportProjectFile,
}: ProjectLibraryModalProps) {
  const activeProject =
    projects.find((item) => item.id === activeProjectId) ?? null;

  const [nameInput, setNameInput] = useState(
    activeProject?.name || defaultProjectName
  );
  const [descInput, setDescInput] = useState(activeProject?.description || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      setNameInput(activeProject?.name || defaultProjectName);
      setDescInput(activeProject?.description || '');
      setErrorMessage(null);
      setStatusMessage(null);
      setEditingId(null);
    }
    wasOpenRef.current = isOpen;
  }, [isOpen, activeProject?.name, activeProject?.description, defaultProjectName]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const trimmedQuery = searchQuery.trim().toLowerCase();
  const filteredProjects = projects.filter((proj) => {
    if (!trimmedQuery) return true;
    return (
      proj.name.toLowerCase().includes(trimmedQuery) ||
      (proj.description || '').toLowerCase().includes(trimmedQuery)
    );
  });

  const handleSaveSubmit = (asNew: boolean) => {
    const cleanName = nameInput.trim();
    if (!cleanName) {
      setErrorMessage('Podaj nazwę projektu przed zapisaniem.');
      return;
    }
    setErrorMessage(null);
    onSaveProject({
      name: cleanName,
      description: descInput.trim(),
      asNew,
    });
    setStatusMessage(
      asNew
        ? `Zapisano nowy projekt „${cleanName}”.`
        : `Zaktualizowano projekt „${cleanName}”.`
    );
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const content = await file.text();
      const ok = onImportProjectFile(content);
      if (ok) {
        setErrorMessage(null);
        setStatusMessage(`Zaimportowano i otwarto projekt z pliku „${file.name}”.`);
      } else {
        setErrorMessage('Wybrany plik nie jest prawidłowym projektem React UI Studio.');
      }
    } catch {
      setErrorMessage('Nie udało się odczytać wybranego pliku projektu.');
    }
  };

  const formatUpdatedTime = (timestamp: number) => {
    try {
      return new Date(timestamp).toLocaleString('pl-PL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Zapisz i otwórz projekty"
      data-testid="project-library-modal"
      className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-[2px] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[88vh] bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
              <FolderOpen className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-slate-900 truncate">
                Projekty — Zapisz i Otwórz
              </h2>
              <p className="text-[11px] text-slate-500 truncate">
                Zapisuj stworzone projekty w bibliotece przeglądarki lub eksportuj do pliku .json
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-label="Zamknij okno projektów"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-5">
          {/* Save Current Canvas Section */}
          <section
            aria-label="Zapisz bieżący projekt"
            className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3"
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Save className="w-3.5 h-3.5 text-blue-600" />
                Zapisz bieżący projekt
              </h3>
              {activeProject && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 truncate max-w-[240px]">
                  Aktywny: {activeProject.name}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <label className="block space-y-1">
                <span className="text-[11px] font-semibold text-slate-600">
                  Nazwa projektu
                </span>
                <input
                  type="text"
                  data-testid="project-name-input"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="np. Landing Page SaaS"
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-[11px] font-semibold text-slate-600">
                  Opis (opcjonalnie)
                </span>
                <input
                  type="text"
                  data-testid="project-desc-input"
                  value={descInput}
                  onChange={(e) => setDescInput(e.target.value)}
                  placeholder="np. Wersja ze złotym akcentem"
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex flex-wrap items-center gap-2">
                {activeProject ? (
                  <>
                    <button
                      type="button"
                      data-testid="project-save-overwrite-btn"
                      onClick={() => handleSaveSubmit(false)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Zapisz zmiany
                    </button>
                    <button
                      type="button"
                      data-testid="project-save-new-btn"
                      onClick={() => handleSaveSubmit(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Zapisz jako nowy
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    data-testid="project-save-new-btn"
                    onClick={() => handleSaveSubmit(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Zapisz projekt
                  </button>
                )}
              </div>

              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  data-testid="project-import-file-input"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  data-testid="project-import-file-btn"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Otwórz z pliku .json
                </button>
              </div>
            </div>

            {errorMessage && (
              <p
                role="alert"
                className="text-xs text-red-600 font-medium pt-0.5"
              >
                {errorMessage}
              </p>
            )}
            {statusMessage && !errorMessage && (
              <p
                role="status"
                data-testid="project-save-status"
                className="text-xs text-emerald-700 font-medium flex items-center gap-1 pt-0.5"
              >
                <Check className="w-3.5 h-3.5 shrink-0" />
                {statusMessage}
              </p>
            )}
          </section>

          {/* Saved Projects List Section */}
          <section aria-label="Zapisane projekty" className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <FolderOpen className="w-3.5 h-3.5 text-slate-500" />
                Zapisane projekty ({projects.length})
              </h3>

              <div className="relative w-full sm:w-56">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  data-testid="project-search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Szukaj zapisanego projektu..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>
            </div>

            {filteredProjects.length === 0 ? (
              <div
                data-testid="projects-empty-state"
                className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl space-y-1.5"
              >
                <FolderOpen className="w-6 h-6 text-slate-400 mx-auto" />
                <p className="text-xs font-semibold text-slate-700">
                  {projects.length === 0
                    ? 'Brak zapisanych projektów'
                    : 'Brak projektów pasujących do wyszukiwania'}
                </p>
                <p className="text-[11px] text-slate-500">
                  Wpisz nazwę powyżej i kliknij „Zapisz projekt”, aby wrócić do niego później.
                </p>
              </div>
            ) : (
              <div
                data-testid="saved-projects-list"
                className="space-y-2 max-h-72 overflow-y-auto pr-0.5"
              >
                {filteredProjects.map((project) => {
                  const isActive = project.id === activeProjectId;
                  const isEditingThis = editingId === project.id;
                  return (
                    <div
                      key={project.id}
                      data-testid={`saved-project-card-${project.id}`}
                      className={`p-3 rounded-xl border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isActive
                          ? 'bg-blue-50/60 border-blue-300'
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        {isEditingThis ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              data-testid={`project-rename-input-${project.id}`}
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && editingName.trim()) {
                                  onRenameProject(project.id, editingName);
                                  setEditingId(null);
                                } else if (e.key === 'Escape') {
                                  setEditingId(null);
                                }
                              }}
                              className="flex-1 min-w-0 px-2 py-1 bg-white border border-blue-300 rounded text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              autoFocus
                            />
                            <button
                              type="button"
                              aria-label="Zatwierdź nazwę"
                              onClick={() => {
                                if (editingName.trim()) {
                                  onRenameProject(project.id, editingName);
                                }
                                setEditingId(null);
                              }}
                              className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 truncate">
                              {project.name}
                            </span>
                            {isActive && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-600 text-white shrink-0">
                                Aktywny
                              </span>
                            )}
                          </div>
                        )}

                        {project.description && (
                          <p className="text-[11px] text-slate-500 truncate">
                            {project.description}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
                          <span className="inline-flex items-center gap-1 font-mono">
                            <Layers className="w-3 h-3" />
                            {project.nodeCount} elem.
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatUpdatedTime(project.updatedAt)}
                          </span>
                          <span className="font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            TW {project.tailwindVersion}
                          </span>
                          <span className="font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            BS {project.bootstrapVersion}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          data-testid={`project-open-btn-${project.id}`}
                          onClick={() => {
                            onOpenProject(project);
                            onClose();
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold rounded-lg transition-colors whitespace-nowrap"
                        >
                          <FolderOpen className="w-3 h-3" />
                          Otwórz
                        </button>
                        <button
                          type="button"
                          data-testid={`project-rename-btn-${project.id}`}
                          aria-label={`Zmień nazwę ${project.name}`}
                          title="Zmień nazwę projektu"
                          onClick={() => {
                            setEditingId(project.id);
                            setEditingName(project.name);
                          }}
                          className="p-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-lg transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          data-testid={`project-download-btn-${project.id}`}
                          aria-label={`Pobierz ${project.name} jako JSON`}
                          title="Pobierz plik projektu (.json)"
                          onClick={() => onDownloadProjectFile(project)}
                          className="p-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-lg transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          data-testid={`project-delete-btn-${project.id}`}
                          aria-label={`Usuń projekt ${project.name}`}
                          title="Usuń zapisany projekt"
                          onClick={() => onDeleteProject(project.id)}
                          className="p-1.5 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 text-slate-500 hover:text-red-600 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
