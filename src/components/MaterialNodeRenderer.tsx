import React, { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControlLabel,
  IconButton,
  Menu,
  MenuItem,
  Switch,
  TextField,
  ThemeProvider,
  createTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import type { EditorNode, NodesMap, ThemeVariable } from '../types/editor';

interface MaterialMuiNodeViewProps {
  node: EditorNode;
  themeVars?: ThemeVariable[];
  children?: React.ReactNode;
}

export function buildMuiThemeFromEditorVars(themeVars: ThemeVariable[] = []) {
  const primary =
    themeVars.find((v) => v.name === '--color-primary')?.value || '#1976d2';
  const secondary =
    themeVars.find((v) => v.name === '--color-secondary')?.value || '#9c27b0';
  const isHex = (val: string) => /^#[0-9a-fA-F]{6}$/.test(val.trim());

  return createTheme({
    palette: {
      primary: { main: isHex(primary) ? primary : '#1976d2' },
      secondary: { main: isHex(secondary) ? secondary : '#9c27b0' },
    },
  });
}

function buildSxFromSlotOverrides(
  slotOverrides?: Record<string, string>
): Record<string, Record<string, string>> | undefined {
  if (!slotOverrides || Object.keys(slotOverrides).length === 0) {
    return undefined;
  }
  const sx: Record<string, Record<string, string>> = {};
  for (const [selector, ruleValue] of Object.entries(slotOverrides)) {
    const cleanSel = selector.startsWith('&') ? selector : `& ${selector}`;
    const decls: Record<string, string> = {};
    for (const part of ruleValue.split(';')) {
      const idx = part.indexOf(':');
      if (idx > 0) {
        const prop = part
          .slice(0, idx)
          .trim()
          .replace(/-([a-z])/g, (_, ch: string) => ch.toUpperCase());
        const val = part.slice(idx + 1).trim();
        if (prop && val) decls[prop] = val;
      }
    }
    if (Object.keys(decls).length > 0) {
      sx[cleanSel] = decls;
    }
  }
  return Object.keys(sx).length > 0 ? sx : undefined;
}

export function MaterialMuiNodeView({
  node,
  themeVars = [],
  children,
}: MaterialMuiNodeViewProps) {
  const [numericVal, setNumericVal] = useState<number>(() => {
    const parsed = Number(node.content);
    return Number.isFinite(parsed) ? parsed : 2;
  });
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [activeMenuLabel, setActiveMenuLabel] = useState<string>('');

  const muiTheme = useMemo(
    () => buildMuiThemeFromEditorVars(themeVars),
    [themeVars]
  );
  const meta = node.materialMeta || {};
  const tag = meta.componentTag || 'Button';
  const muiProps = meta.muiProps || {};
  const sxOverrides = useMemo(
    () => buildSxFromSlotOverrides(meta.slotOverrides),
    [meta.slotOverrides]
  );

  const renderInner = () => {
    if (tag === 'Button') {
      const variant = (muiProps.variant as 'contained' | 'outlined' | 'text') || 'contained';
      const color =
        (muiProps.color as 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning') ||
        'primary';
      const size = (muiProps.size as 'small' | 'medium' | 'large') || 'medium';
      return (
        <Button
          variant={variant}
          color={color}
          size={size}
          disabled={Boolean(muiProps.disabled)}
          sx={sxOverrides}
        >
          {node.content || 'MUI Button'}
        </Button>
      );
    }

    if (tag === 'TextField') {
      const variant =
        (muiProps.variant as 'outlined' | 'filled' | 'standard') || 'outlined';
      const size = (muiProps.size as 'small' | 'medium') || 'small';
      return (
        <TextField
          label={String(muiProps.label || node.name || 'MUI TextField')}
          placeholder={node.props?.placeholder || ''}
          variant={variant}
          size={size}
          fullWidth={muiProps.fullWidth !== false}
          disabled={Boolean(muiProps.disabled)}
          sx={sxOverrides}
        />
      );
    }

    if (tag === 'NumberField') {
      const min = typeof muiProps.min === 'number' ? muiProps.min : 0;
      const max = typeof muiProps.max === 'number' ? muiProps.max : 99;
      const step = typeof muiProps.step === 'number' ? muiProps.step : 1;
      return (
        <Box
          data-mui-component="NumberField"
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.75,
            p: 0.5,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            ...sxOverrides,
          }}
        >
          <IconButton
            size="small"
            aria-label="Zmniejsz wartość"
            onClick={(e) => {
              e.stopPropagation();
              setNumericVal((v) => Math.max(min, v - step));
            }}
          >
            <RemoveIcon fontSize="small" />
          </IconButton>
          <TextField
            size="small"
            label={String(muiProps.label || 'Ilość')}
            value={numericVal}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => {
              const next = Number(e.target.value);
              if (Number.isFinite(next)) {
                setNumericVal(Math.min(max, Math.max(min, next)));
              }
            }}
            sx={{ width: 92 }}
          />
          <IconButton
            size="small"
            aria-label="Zwiększ wartość"
            onClick={(e) => {
              e.stopPropagation();
              setNumericVal((v) => Math.min(max, v + step));
            }}
          >
            <AddIcon fontSize="small" />
          </IconButton>
        </Box>
      );
    }

    if (tag === 'Menubar') {
      const items = (node.content || 'Plik, Edycja, Widok, Pomoc')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      return (
        <Box
          data-mui-component="Menubar"
          role="menubar"
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 0.5,
            p: 0.75,
            borderRadius: 1.5,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            ...sxOverrides,
          }}
        >
          {items.map((label) => (
            <Button
              key={label}
              size="small"
              color={
                (muiProps.color as 'primary' | 'secondary') || 'primary'
              }
              endIcon={<KeyboardArrowDownIcon fontSize="small" />}
              onClick={(e) => {
                e.stopPropagation();
                setActiveMenuLabel(label);
                setMenuAnchor(e.currentTarget);
              }}
            >
              {label}
            </Button>
          ))}
          <Menu
            open={Boolean(menuAnchor)}
            anchorEl={menuAnchor}
            onClose={() => setMenuAnchor(null)}
          >
            <MenuItem onClick={() => setMenuAnchor(null)}>
              {activeMenuLabel}: Nowy
            </MenuItem>
            <MenuItem onClick={() => setMenuAnchor(null)}>
              {activeMenuLabel}: Otwórz
            </MenuItem>
            <MenuItem onClick={() => setMenuAnchor(null)}>
              {activeMenuLabel}: Ustawienia
            </MenuItem>
          </Menu>
        </Box>
      );
    }

    if (tag === 'Alert') {
      const severity =
        (muiProps.severity as 'success' | 'info' | 'warning' | 'error') ||
        'info';
      const variant =
        (muiProps.variant as 'standard' | 'filled' | 'outlined') || 'standard';
      return (
        <Alert severity={severity} variant={variant} sx={sxOverrides}>
          {node.content || 'MUI v9 Alert'}
        </Alert>
      );
    }

    if (tag === 'Chip') {
      const variant = (muiProps.variant as 'filled' | 'outlined') || 'filled';
      const color =
        (muiProps.color as 'primary' | 'secondary' | 'success' | 'error' | 'default') ||
        'primary';
      const size = (muiProps.size as 'small' | 'medium') || 'medium';
      return (
        <Chip
          label={node.content || 'MUI Chip'}
          variant={variant}
          color={color}
          size={size}
          sx={sxOverrides}
        />
      );
    }

    if (tag === 'Switch') {
      const color =
        (muiProps.color as 'primary' | 'secondary' | 'success' | 'error') ||
        'primary';
      const size = (muiProps.size as 'small' | 'medium') || 'medium';
      return (
        <FormControlLabel
          control={
            <Switch
              defaultChecked={muiProps.defaultChecked !== false}
              color={color}
              size={size}
              onClick={(e) => e.stopPropagation()}
            />
          }
          label={node.content || 'Switch'}
          sx={sxOverrides}
        />
      );
    }

    if (tag === 'Card') {
      const variant = (muiProps.variant as 'elevation' | 'outlined') || 'elevation';
      const elevation =
        typeof muiProps.elevation === 'number' ? muiProps.elevation : 2;
      return (
        <Card variant={variant} elevation={variant === 'elevation' ? elevation : 0} sx={sxOverrides}>
          <CardContent className="flex flex-col gap-3">{children}</CardContent>
        </Card>
      );
    }

    return <Box sx={sxOverrides}>{children || node.content}</Box>;
  };

  return <ThemeProvider theme={muiTheme}>{renderInner()}</ThemeProvider>;
}

interface MuiReactPagePreviewProps {
  nodes: NodesMap;
  themeVars: ThemeVariable[];
}

export function MuiReactPagePreview({ nodes, themeVars }: MuiReactPagePreviewProps) {
  const muiTheme = useMemo(
    () => buildMuiThemeFromEditorVars(themeVars),
    [themeVars]
  );

  const renderTree = (id: string): React.ReactNode => {
    const node = nodes[id];
    if (!node || (id !== 'root' && node.hidden)) return null;

    const childElements = (node.children || []).map((cid) => renderTree(cid));

    if (node.sourceLibrary === 'mui-v9' && node.materialMeta?.componentTag) {
      return (
        <div key={id} data-node-id={id}>
          <MaterialMuiNodeView node={node} themeVars={themeVars}>
            {childElements}
          </MaterialMuiNodeView>
        </div>
      );
    }

    if (node.children && node.children.length > 0) {
      return (
        <div key={id} data-node-id={id} className={node.props?.className || ''}>
          {childElements}
        </div>
      );
    }

    if (node.type === 'Heading') {
      return (
        <h2 key={id} data-node-id={id} className={node.props?.className || ''}>
          {node.content}
        </h2>
      );
    }
    if (node.type === 'Button') {
      return (
        <button
          key={id}
          type="button"
          data-node-id={id}
          className={node.props?.className || ''}
        >
          {node.content}
        </button>
      );
    }
    if (node.type === 'Badge') {
      return (
        <span key={id} data-node-id={id} className={node.props?.className || ''}>
          {node.content}
        </span>
      );
    }
    if (node.type === 'Input') {
      return (
        <input
          key={id}
          type="text"
          data-node-id={id}
          placeholder={node.props?.placeholder || ''}
          className={node.props?.className || ''}
        />
      );
    }
    if (node.type === 'Image' && node.props?.src) {
      return (
        <img
          key={id}
          data-node-id={id}
          src={node.props.src}
          alt={node.name || 'image'}
          className={node.props?.className || ''}
        />
      );
    }
    return (
      <p key={id} data-node-id={id} className={node.props?.className || ''}>
        {node.content}
      </p>
    );
  };

  return (
    <ThemeProvider theme={muiTheme}>
      <div
        data-testid="mui-react-preview-container"
        className="w-full p-4 bg-white rounded-xl border border-slate-200"
      >
        {renderTree('root')}
      </div>
    </ThemeProvider>
  );
}
