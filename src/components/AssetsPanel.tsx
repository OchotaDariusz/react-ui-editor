import { useMemo, useRef, useState } from 'react';
import { useDrag } from 'react-dnd';
import {
  FileImage,
  GripVertical,
  Image as ImageIcon,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react';
import { MAX_ASSET_FILE_BYTES } from '../constants/editorDefaults';
import {
  DND_ASSET_TYPE,
  type AssetKind,
  type ImportedAsset,
} from '../types/editor';
import {
  createImportedAssetRecord,
  filterImportedAssets,
  formatBytes,
  isSupportedAssetFile,
} from '../utils/editorLogic';

interface AssetsPanelProps {
  assets: ImportedAsset[];
  storageError: string;
  canApplyToSelectedImage: boolean;
  onAddAssets: (newAssets: ImportedAsset[]) => void;
  onInsertAsset: (asset: ImportedAsset) => void;
  onApplyAssetToSelectedImage: (asset: ImportedAsset) => void;
  onRemoveAsset: (id: string) => void;
  onClearAssets: () => void;
  onDismissStorageError: () => void;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Nie udało się odczytać zawartości pliku.'));
      }
    };
    reader.onerror = () => {
      reject(new Error(`Błąd odczytu pliku ${file.name}.`));
    };
    reader.readAsDataURL(file);
  });
}

function DraggableAssetCard({
  asset,
  canApplyToSelectedImage,
  onInsertAsset,
  onApplyAssetToSelectedImage,
  onRemoveAsset,
}: {
  asset: ImportedAsset;
  canApplyToSelectedImage: boolean;
  onInsertAsset: (asset: ImportedAsset) => void;
  onApplyAssetToSelectedImage: (asset: ImportedAsset) => void;
  onRemoveAsset: (id: string) => void;
}) {
  const [thumbFailed, setThumbFailed] = useState(false);

  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: DND_ASSET_TYPE,
      item: () => ({ asset }),
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [asset]
  );

  return (
    <div
      ref={(el) => {
        drag(el);
      }}
      data-asset-id={asset.id}
      className={`p-2.5 bg-slate-50 border border-slate-200 hover:border-blue-300 rounded-xl space-y-2 cursor-grab active:cursor-grabbing transition-all ${
        isDragging ? 'opacity-45 scale-98' : ''
      }`}
    >
      <div className="flex items-start gap-2.5">
        <div className="w-12 h-12 rounded-lg bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
          {thumbFailed ? (
            asset.kind === 'icon' ? (
              <Sparkles className="w-5 h-5 text-slate-400" />
            ) : (
              <FileImage className="w-5 h-5 text-slate-400" />
            )
          ) : (
            <img
              src={asset.dataUrl}
              alt={asset.name}
              referrerPolicy="no-referrer"
              onError={() => setThumbFailed(true)}
              className={
                asset.kind === 'icon'
                  ? 'w-7 h-7 object-contain'
                  : 'w-full h-full object-cover'
              }
            />
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="flex items-start justify-between gap-1">
            <div className="flex items-center gap-1 min-w-0">
              <GripVertical
                className="w-3.5 h-3.5 text-slate-400 shrink-0"
                aria-hidden="true"
              />
              <span
                className="text-xs font-semibold text-slate-800 truncate"
                title={asset.name}
              >
                {asset.name}
              </span>
            </div>
            <button
              type="button"
              title="Usuń zasób"
              aria-label={`Usuń zasób ${asset.name}`}
              onClick={() => onRemoveAsset(asset.id)}
              className="p-1 text-slate-400 hover:text-red-600 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono tabular-nums">
            <span>{asset.kind === 'icon' ? 'Ikona' : 'Obraz'}</span>
            <span aria-hidden="true">·</span>
            <span>{formatBytes(asset.sizeBytes)}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-1.5">
        <span className="text-[10px] text-slate-400 truncate">
          Przeciągnij na płótno
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {canApplyToSelectedImage && (
            <button
              type="button"
              title="Zastosuj jako źródło zaznaczonego obrazu"
              aria-label={`Użyj ${asset.name} w zaznaczonym obrazie`}
              onClick={() => onApplyAssetToSelectedImage(asset)}
              className="inline-flex items-center gap-1 py-1 px-2 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-lg text-[10.5px] font-semibold text-emerald-700 transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <RefreshCw className="w-3 h-3" />
              Podmień
            </button>
          )}
          <button
            type="button"
            aria-label={`Wstaw ${asset.name} na płótno`}
            onClick={() => onInsertAsset(asset)}
            className="inline-flex items-center gap-1 py-1 px-2.5 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg text-[10.5px] font-semibold text-blue-700 transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <Plus className="w-3 h-3" />
            Wstaw
          </button>
        </div>
      </div>
    </div>
  );
}

export function AssetsPanel({
  assets,
  storageError,
  canApplyToSelectedImage,
  onAddAssets,
  onInsertAsset,
  onApplyAssetToSelectedImage,
  onRemoveAsset,
  onClearAssets,
  onDismissStorageError,
}: AssetsPanelProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [kindFilter, setKindFilter] = useState<'all' | AssetKind>('all');
  const [assetQuery, setAssetQuery] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const filteredAssets = useMemo(
    () => filterImportedAssets(assets, kindFilter, assetQuery),
    [assets, kindFilter, assetQuery]
  );

  const imageCount = useMemo(
    () => assets.filter((a) => a.kind === 'image').length,
    [assets]
  );
  const iconCount = useMemo(
    () => assets.filter((a) => a.kind === 'icon').length,
    [assets]
  );

  const handleFiles = async (fileList: FileList | File[] | null) => {
    const files = fileList ? Array.from(fileList) : [];
    if (files.length === 0) return;

    setUploadError('');
    onDismissStorageError();
    setIsReading(true);

    const accepted: ImportedAsset[] = [];
    const errors: string[] = [];

    try {
      for (const file of files) {
        if (!isSupportedAssetFile(file.type, file.name)) {
          errors.push(`Nieobsługiwany format pliku: ${file.name}`);
          continue;
        }
        if (file.size > MAX_ASSET_FILE_BYTES) {
          errors.push(
            `Plik ${file.name} przekracza limit ${formatBytes(MAX_ASSET_FILE_BYTES)}.`
          );
          continue;
        }
        try {
          const dataUrl = await readFileAsDataUrl(file);
          accepted.push(
            createImportedAssetRecord({
              fileName: file.name,
              mimeType: file.type || 'image/png',
              dataUrl,
              sizeBytes: file.size,
            })
          );
        } catch (err: unknown) {
          errors.push(
            err instanceof Error
              ? err.message
              : `Nie udało się wczytać pliku ${file.name}.`
          );
        }
      }

      if (accepted.length > 0) {
        onAddAssets(accepted);
      }
      if (errors.length > 0) {
        setUploadError(errors[0]);
      }
    } finally {
      setIsReading(false);
    }
  };

  const activeError = uploadError || storageError;

  return (
    <div
      className="p-3.5 flex-1 overflow-y-auto space-y-3"
      aria-label="Assets"
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-[11px] font-bold text-slate-500 tracking-wide">
            Assets
          </h2>
          <p className="text-[11px] text-slate-400 tabular-nums">
            Zapisane w Base64 ({assets.length})
          </p>
        </div>
        {assets.length > 0 && (
          <button
            type="button"
            aria-label="Wyczyść wszystkie zasoby"
            onClick={onClearAssets}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-red-600 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded px-1.5 py-0.5"
          >
            <Trash2 className="w-3 h-3" />
            Wyczyść
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml,.svg,.png,.jpg,.jpeg,.webp,.gif"
        aria-label="Prześlij obrazy lub ikony"
        onChange={(e) => {
          void handleFiles(e.target.files);
          e.target.value = '';
        }}
        className="hidden"
      />

      <div
        data-testid="asset-upload-dropzone"
        onDragEnter={(e) => {
          if (e.dataTransfer?.types?.includes('Files')) {
            e.preventDefault();
            e.stopPropagation();
            setIsDragOver(true);
          }
        }}
        onDragOver={(e) => {
          if (e.dataTransfer?.types?.includes('Files')) {
            e.preventDefault();
            e.stopPropagation();
            e.dataTransfer.dropEffect = 'copy';
            if (!isDragOver) setIsDragOver(true);
          }
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
            setIsDragOver(false);
          }
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragOver(false);
          if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
            void handleFiles(e.dataTransfer.files);
          }
        }}
        className={`p-3.5 border-2 border-dashed rounded-xl text-center transition-colors space-y-2 ${
          isDragOver
            ? 'bg-blue-50 border-blue-500 text-blue-800'
            : 'bg-slate-50/80 border-slate-300 hover:border-blue-400 text-slate-600'
        }`}
      >
        <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center mx-auto text-blue-600">
          <UploadCloud className="w-4 h-4" />
        </div>
        <div className="space-y-0.5">
          <p className="text-xs font-semibold text-slate-800">
            {isReading
              ? 'Konwertowanie do Base64...'
              : 'Upuść obrazy lub ikony SVG'}
          </p>
          <p className="text-[10.5px] text-slate-400">
            PNG, JPG, WebP, GIF, SVG · maks. 2 MB
          </p>
        </div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <ImageIcon className="w-3.5 h-3.5" />
          Wybierz pliki
        </button>
      </div>

      {activeError && (
        <div
          role="alert"
          className="p-2.5 rounded-lg bg-red-50 border border-red-200 flex items-start justify-between gap-2 text-[11px] text-red-700"
        >
          <span className="leading-snug">{activeError}</span>
          <button
            type="button"
            aria-label="Zamknij błąd zasobu"
            onClick={() => {
              setUploadError('');
              onDismissStorageError();
            }}
            className="p-0.5 text-red-500 hover:text-red-700 rounded shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div
        role="group"
        aria-label="Filtr typu zasobów"
        className="grid grid-cols-3 p-1 bg-slate-100 rounded-lg gap-1"
      >
        <button
          type="button"
          aria-pressed={kindFilter === 'all'}
          onClick={() => setKindFilter('all')}
          className={`py-1 px-1.5 rounded-md text-[10.5px] font-semibold transition-colors whitespace-nowrap tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
            kindFilter === 'all'
              ? 'bg-white text-blue-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Wszystkie ({assets.length})
        </button>
        <button
          type="button"
          aria-pressed={kindFilter === 'image'}
          onClick={() => setKindFilter('image')}
          className={`py-1 px-1.5 rounded-md text-[10.5px] font-semibold transition-colors whitespace-nowrap tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
            kindFilter === 'image'
              ? 'bg-white text-blue-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Obrazy ({imageCount})
        </button>
        <button
          type="button"
          aria-pressed={kindFilter === 'icon'}
          onClick={() => setKindFilter('icon')}
          className={`py-1 px-1.5 rounded-md text-[10.5px] font-semibold transition-colors whitespace-nowrap tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
            kindFilter === 'icon'
              ? 'bg-white text-blue-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Ikony ({iconCount})
        </button>
      </div>

      {assets.length > 0 && (
        <div className="relative">
          <Search
            className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="text"
            aria-label="Szukaj zasobów"
            placeholder="Szukaj zasobu..."
            value={assetQuery}
            onChange={(e) => setAssetQuery(e.target.value)}
            className="w-full pl-8 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
          />
          {assetQuery && (
            <button
              type="button"
              aria-label="Wyczyść wyszukiwanie zasobów"
              onClick={() => setAssetQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-700 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {filteredAssets.length === 0 ? (
        <div className="py-7 px-3 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50 space-y-1">
          <p className="text-xs font-medium text-slate-500">
            {assets.length === 0
              ? 'Brak zaimportowanych zasobów'
              : 'Brak pasujących zasobów'}
          </p>
          <p className="text-[11px] text-slate-400">
            {assets.length === 0
              ? 'Przeciągnij pliki powyżej, aby zapisać je w localStorage jako Base64 i używać na płótnie.'
              : 'Zmień filtr kategorii lub frazę wyszukiwania.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredAssets.map((asset) => (
            <DraggableAssetCard
              key={asset.id}
              asset={asset}
              canApplyToSelectedImage={canApplyToSelectedImage}
              onInsertAsset={onInsertAsset}
              onApplyAssetToSelectedImage={onApplyAssetToSelectedImage}
              onRemoveAsset={onRemoveAsset}
            />
          ))}
        </div>
      )}
    </div>
  );
}
