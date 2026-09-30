// Built once at build time → /data/cells.json.
// One HGSC section: each cell's UMAP and tissue coordinates, scaled to 0–9999
// within each layout (y points up, as in the source plots), plus its class.
import fs from 'node:fs';
import path from 'node:path';
import type { APIRoute } from 'astro';

// 0 SecA, 1 SecB, 2 ciliated, 3 other cells
const CLASS: Record<string, number> = { Epi_SecA: 0, Epi_SecB: 1, Epi_Cil: 2 };

export const GET: APIRoute = () => {
  const text = fs.readFileSync(path.join(process.cwd(), 'src/data/embeddings.csv'), 'utf8');
  const rows = text.trim().split('\n').slice(1).map((line) => line.split(','));

  const cls = rows.map((r) => CLASS[r[5].replace(/"/g, '')] ?? 3);
  const cols = [1, 2, 3, 4].map((c) => rows.map((r) => parseFloat(r[c])));
  const range = cols.map((v) => [Math.min(...v), Math.max(...v)]);
  const q = (v: number, [lo, hi]: number[], flip = false) => {
    const f = (v - lo) / (hi - lo);
    return Math.round((flip ? 1 - f : f) * 9999);
  };

  const p: number[] = [];
  for (let i = 0; i < rows.length; i++) {
    p.push(
      cls[i],
      q(cols[0][i], range[0]),
      q(cols[1][i], range[1], true),
      q(cols[2][i], range[2]),
      q(cols[3][i], range[3], true),
    );
  }

  const span = (k: number) => range[k][1] - range[k][0];
  const body = {
    n: rows.length,
    // width / height of each layout, for aspect-preserving fits
    umapAspect: +(span(0) / span(1)).toFixed(4),
    tissueAspect: +(span(2) / span(3)).toFixed(4),
    tissueWidthUm: Math.round(span(2)),
    p,
  };
  return new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } });
};
