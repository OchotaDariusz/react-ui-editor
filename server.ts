import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

interface ChildSummaryInput {
  type?: string;
  name?: string;
  content?: string;
}

interface SmartLayoutRequestBody {
  node?: {
    id?: string;
    type?: string;
    name?: string;
    className?: string;
    childrenSummary?: ChildSummaryInput[];
  };
  goal?: string;
}

interface SmartLayoutSuggestion {
  name: string;
  description: string;
  classes: string;
  patternType: string;
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '512kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.post('/api/ai/smart-layout', async (req, res) => {
    const body = (req.body || {}) as SmartLayoutRequestBody;
    const node = body.node;

    if (!node || typeof node !== 'object' || typeof node.type !== 'string') {
      res.status(400).json({
        error: 'Nieprawidłowe dane kontenera wejściowego.',
      });
      return;
    }

    if (node.type !== 'Container' && node.type !== 'Grid') {
      res.status(400).json({
        error: 'Smart Layout obsługuje kontenery typu Container lub Grid.',
      });
      return;
    }

    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({
        error:
          'Brak klucza GEMINI_API_KEY po stronie serwera. Skonfiguruj go w panelu Settings > Secrets.',
      });
      return;
    }

    const childrenList = Array.isArray(node.childrenSummary)
      ? node.childrenSummary
          .slice(0, 12)
          .map(
            (child, idx) =>
              `${idx + 1}. type=${child.type || 'Element'}, name="${child.name || ''}", content="${(child.content || '').slice(0, 60)}"`
          )
          .join('\n')
      : 'Brak dzieci (pusty kontener)';

    const goalLine =
      typeof body.goal === 'string' && body.goal.trim()
        ? `User layout goal/pattern hint: "${body.goal.trim()}"`
        : 'Suggest versatile responsive Tailwind CSS layout patterns suited to these child elements.';

    const promptText = [
      `Selected node: id="${node.id || 'container'}", type=${node.type}, name="${node.name || 'Kontener'}"`,
      `Current classes: "${node.className || ''}"`,
      `Direct children:\n${childrenList}`,
      goalLine,
    ].join('\n\n');

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: promptText,
        config: {
          systemInstruction:
            'You are a senior Tailwind CSS layout architect inside a visual React UI editor. Given a selected container node and its direct children, propose 3 to 4 practical Tailwind CSS v4 layout class combinations for patterns such as "Centered card", "Sidebar-content layout", "Responsive feature grid", "Toolbar / header row", or "Hero stack". Keep every `classes` string strictly valid single-line Tailwind CSS utility classes (flex/grid, gap, items, justify, padding, max-w, rounded, border, shadow where helpful). Write concise, clear pattern names and helpful Polish or clear UI descriptions.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: {
                  type: Type.STRING,
                  description:
                    'Short pattern name, e.g. "Centered card" or "Sidebar-content layout".',
                },
                description: {
                  type: Type.STRING,
                  description:
                    'Concise 1-sentence explanation of how this layout arranges children.',
                },
                classes: {
                  type: Type.STRING,
                  description:
                    'Space-separated Tailwind CSS classes ready to apply to the container.',
                },
                patternType: {
                  type: Type.STRING,
                  description:
                    'Short layout tag such as Flex Row, Flex Col, Grid, or Centered.',
                },
              },
              required: ['name', 'description', 'classes', 'patternType'],
            },
          },
        },
      });

      const rawJson = (response.text ?? '[]').trim();
      const parsed = JSON.parse(rawJson) as SmartLayoutSuggestion[];
      const suggestions = Array.isArray(parsed)
        ? parsed
            .filter(
              (item) =>
                item &&
                typeof item.name === 'string' &&
                typeof item.classes === 'string' &&
                item.classes.trim().length > 0
            )
            .slice(0, 4)
            .map((item) => ({
              name: item.name.trim(),
              description: (item.description || '').trim(),
              classes: item.classes.replace(/\s+/g, ' ').trim(),
              patternType: (item.patternType || 'Layout').trim(),
            }))
        : [];

      if (suggestions.length === 0) {
        res.status(502).json({
          error: 'Model nie zwrócił poprawnych propozycji układu.',
        });
        return;
      }

      res.json({ suggestions });
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Nieznany błąd wywołania Gemini API.';
      const status =
        typeof (err as { status?: unknown })?.status === 'number'
          ? (err as { status: number }).status
          : 500;
      res.status(status >= 400 && status < 600 ? status : 500).json({
        error: `Nie udało się wygenerować sugestii Smart Layout: ${message}`,
      });
    }
  });

  if (!IS_PRODUCTION) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build output not found. Run npm run build.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
