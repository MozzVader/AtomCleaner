import TurndownService from 'turndown';

const turndown = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
});

// ── Export to JSON (for Supabase) ───────────────────────────────────────────

export interface ExportEntryJson {
  title: string;
  slug: string;
  content: string;
  labels: string[];
  created_at: string;
  author: string | null;
  original_url: string | null;
}

export function exportToJson(
  entries: { title: string; content: string; publishedAt: string | null; author: string | null; originalUrl: string | null; labels: string }[]
): string {
  const data: ExportEntryJson[] = entries.map(e => ({
    title: e.title,
    slug: generateSlug(e.title),
    content: e.content,
    labels: JSON.parse(e.labels || '[]') as string[],
    created_at: e.publishedAt || new Date().toISOString(),
    author: e.author,
    original_url: e.originalUrl,
  }));

  return JSON.stringify(data, null, 2);
}

// ── Export to Markdown ──────────────────────────────────────────────────────

export function exportToMarkdown(
  entries: { title: string; content: string; publishedAt: string | null; author: string | null; originalUrl: string | null; labels: string }[]
): string {
  return entries
    .map(e => {
      const labels = (JSON.parse(e.labels || '[]') as string[]).join(', ');
      const meta = [
        e.publishedAt ? `**Fecha:** ${formatDate(e.publishedAt)}` : '',
        e.author ? `**Autor:** ${e.author}` : '',
        labels ? `**Etiquetas:** ${labels}` : '',
        e.originalUrl ? `**Original:** ${e.originalUrl}` : '',
      ]
        .filter(Boolean)
        .join('\n');

      const mdContent = turndown.turndown(e.content);

      return `# ${e.title}\n\n${meta ? meta + '\n\n' : ''}${mdContent}\n\n---\n`;
    })
    .join('\n');
}

// ── Export to HTML (visual review page) ─────────────────────────────────────

export function exportToHtml(
  entries: { title: string; content: string; publishedAt: string | null; author: string | null; originalUrl: string | null; labels: string; status: string }[]
): string {
  const entriesHtml = entries
    .map((e, i) => {
      const labels = (JSON.parse(e.labels || '[]') as string[])
        .map(l => `<span style="background:#f0f0f0;padding:2px 8px;border-radius:4px;font-size:12px;color:#555">${l}</span>`)
        .join(' ');

      const statusColors: Record<string, string> = {
        approved: '#16a34a',
        pending: '#d97706',
        discarded: '#dc2626',
        needs_editing: '#2563eb',
      };
      const statusColor = statusColors[e.status] || '#888';

      return `
        <article id="post-${i}" style="border:1px solid #e5e5e5;border-radius:8px;padding:24px;margin-bottom:20px;background:#fff">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;flex-wrap:wrap">
            <span style="color:${statusColor};font-weight:600;font-size:13px;text-transform:uppercase;letter-spacing:0.5px">${e.status}</span>
            ${labels ? `<div style="display:flex;gap:6px;flex-wrap:wrap">${labels}</div>` : ''}
          </div>
          <h2 style="font-size:1.4rem;font-weight:700;margin-bottom:8px;color:#111">${e.title}</h2>
          <div style="color:#666;font-size:13px;margin-bottom:16px">
            ${e.publishedAt ? formatDate(e.publishedAt) : 'Sin fecha'}
            ${e.author ? ` · ${e.author}` : ''}
          </div>
          <div style="line-height:1.7;color:#333">${e.content}</div>
          ${e.originalUrl ? `<div style="margin-top:12px;font-size:12px"><a href="${e.originalUrl}" style="color:#888">Ver original en Blogger</a></div>` : ''}
        </article>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Curador — Exportación de Posts</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 780px; margin: 0 auto; padding: 40px 20px; background: #fafafa; color: #111; }
    h1 { font-size: 2rem; margin-bottom: 4px; }
    .subtitle { color: #666; margin-bottom: 32px; }
    .summary { background: #fff; border: 1px solid #e5e5e5; border-radius: 8px; padding: 16px 20px; margin-bottom: 32px; display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 12px; }
    .summary-item { text-align: center; }
    .summary-item .num { font-size: 1.8rem; font-weight: 700; color: #333; }
    .summary-item .label { font-size: 0.8rem; color: #888; margin-top: 2px; }
    img { max-width: 100%; height: auto; }
    a { color: inherit; }
  </style>
</head>
<body>
  <h1>Curador — Posts Exportados</h1>
  <p class="subtitle">Generado el ${new Date().toLocaleDateString('es-AR')} — ${entries.length} entradas</p>
  <div class="summary">
    <div class="summary-item"><div class="num">${entries.length}</div><div class="label">Total</div></div>
    <div class="summary-item"><div class="num">${entries.filter(e => e.status === 'approved').length}</div><div class="label">Aprobados</div></div>
    <div class="summary-item"><div class="num">${entries.filter(e => e.status === 'pending').length}</div><div class="label">Pendientes</div></div>
    <div class="summary-item"><div class="num">${entries.filter(e => e.status === 'discarded').length}</div><div class="label">Descartados</div></div>
  </div>
  ${entriesHtml}
</body>
</html>`;
}

// ── Export to Museum HTML (with plaques) ───────────────────────────────────

export interface MuseumEntry {
  title: string;
  content: string;
  publishedAt: string | null;
  author: string | null;
  originalUrl: string | null;
  labels: string;
  status: string;
  platforms: string;
  nostalgiaScore: number;
  smokeIndex: number;
  issues: string;
  wordCount: number;
}

function getSmokeLevel(index: number): string {
  if (index <= 20) return 'Leve';
  if (index <= 40) return 'Moderado';
  if (index <= 60) return 'Moderado-Alto';
  if (index <= 80) return 'Alto';
  return 'Humo Total';
}

function buildChangelog(issues: string): string {
  try {
    const parsed = JSON.parse(issues) as { type: string; message: string; count?: number }[];
    if (!parsed.length) return '';
    const lines: string[] = [];
    for (const issue of parsed) {
      const count = issue.count && issue.count > 1 ? ` (${issue.count})` : '';
      switch (issue.type) {
        case 'dead_image_host':
          lines.push(`<div style="color:#ef4444">[FIX] ${issue.count || 1} imagen${(issue.count || 1) > 1 ? 's' : ''} de servidor obsoleto${count}</div>`);
          break;
        case 'flash_embed':
          lines.push(`<div style="color:#f59e0b">[CONVERT] ${issue.count || 1} contenido Flash/SWF obsoleto${count}</div>`);
          break;
        case 'empty_content':
          lines.push(`<div style="color:#6b7280">[REVIEW] Contenido vacio o minimo</div>`);
          break;
        case 'short_content':
          lines.push(`<div style="color:#6b7280">[REVIEW] Contenido muy corto</div>`);
          break;
        case 'no_title':
          lines.push(`<div style="color:#6b7280">[FIX] Sin titulo original</div>`);
          break;
      }
    }
    return lines.join('');
  } catch {
    return '';
  }
}

/**
 * Generates a standalone museum card plaque for a single entry.
 * All styles are inline — ready to paste into any blog.
 */
export function generateMuseumCardHtml(entry: MuseumEntry): string {
  const platforms: string[] = JSON.parse(entry.platforms || '[]');
  const nostalgia = entry.nostalgiaScore || 0;
  const smoke = entry.smokeIndex || 0;
  const smokeLevel = getSmokeLevel(smoke);
  const changelog = buildChangelog(entry.issues);
  const labels: string[] = JSON.parse(entry.labels || '[]');
  const formattedDate = entry.publishedAt
    ? new Date(entry.publishedAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'Fecha desconocida';

  const platformTags = platforms.length > 0
    ? platforms.map(p => `<span style="display:inline-block;padding:3px 10px;border-radius:4px;background:rgba(139,92,246,0.1);color:#7c3aed;font-size:11px;font-weight:500;border:1px solid rgba(139,92,246,0.2)">${p}</span>`).join(' ')
    : '<span style="color:#9ca3af;font-size:12px;font-style:italic">Sin plataformas detectadas</span>';

  return `<!-- Museo Card: ${entry.title} -->
<div style="border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;margin-bottom:24px;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,0.06)">
  <!-- Header -->
  <div style="padding:14px 18px;background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
    <div style="display:flex;align-items:center;gap:8px">
      <span style="background:rgba(245,158,11,0.15);color:#f59e0b;padding:3px 10px;border-radius:4px;font-size:11px;font-weight:600;letter-spacing:0.5px;text-transform:uppercase">&#128218; Post Rescatado</span>
      ${labels.length > 0 ? labels.map(l => `<span style="background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.7);padding:3px 8px;border-radius:4px;font-size:10px">${l}</span>`).join(' ') : ''}
    </div>
    <div style="color:rgba(255,255,255,0.6);font-size:11px">Publicado originalmente: <strong style="color:rgba(255,255,255,0.9)">${formattedDate}</strong></div>
  </div>

  <!-- Metrics Row -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:0;border-bottom:1px solid #e5e7eb">
    <!-- Nostalgia -->
    <div style="padding:16px 18px;border-right:1px solid #e5e7eb">
      <div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#6b7280;font-weight:600;margin-bottom:10px">Nivel de Nostalgia</div>
      <div style="display:flex;align-items:center;gap:14px">
        <div style="width:56px;height:56px;border-radius:50%;background:conic-gradient(#f59e0b 0% ${nostalgia}%,#f3f4f6 ${nostalgia}% 100%);display:flex;align-items:center;justify-content:center;flex-shrink:0">
          <div style="width:42px;height:42px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:#f59e0b">${nostalgia}%</div>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:4px;flex:1;min-width:0">${platformTags}</div>
      </div>
    </div>

    <!-- Smoke Index -->
    <div style="padding:16px 18px">
      <div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#6b7280;font-weight:600;margin-bottom:10px">Indice Humico</div>
      <div style="display:flex;align-items:center;gap:10px">
        <span style="font-size:24px;flex-shrink:0">${smoke >= 80 ? '&#128293;' : smoke >= 40 ? '&#128292;' : '&#128292;'}</span>
        <div style="flex:1;min-width:0">
          <div style="height:8px;background:#f3f4f6;border-radius:4px;overflow:hidden">
            <div style="height:100%;width:${smoke}%;border-radius:4px;background:${smoke >= 80 ? '#ef4444' : smoke >= 60 ? '#f97316' : smoke >= 40 ? '#f59e0b' : '#22c55e'};transition:width 0.3s"></div>
          </div>
          <div style="margin-top:4px;font-size:11px;color:#6b7280">Nivel: <strong style="color:#374151">${smokeLevel}</strong></div>
        </div>
      </div>
    </div>
  </div>

  <!-- Curation Changelog -->
  ${changelog ? `
  <div style="padding:12px 18px;background:#f9fafb;border-bottom:1px solid #e5e7eb">
    <div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#6b7280;font-weight:600;margin-bottom:8px;display:flex;align-items:center;gap:6px">&#128187; ARCHIVE_RESTORATION_LOG</div>
    <div style="font-size:12px;font-family:monospace;line-height:1.8">${changelog}</div>
  </div>` : ''}

  <!-- Post Content -->
  <div style="padding:20px 18px;line-height:1.7;color:#333;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
    <h2 style="font-size:1.3rem;font-weight:700;margin:0 0 12px 0;color:#111">${entry.title}</h2>
    ${entry.content}
  </div>

  <!-- Footer -->
  <div style="padding:10px 18px;background:#f9fafb;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af;display:flex;justify-content:space-between;flex-wrap:wrap;gap:4px">
    <span>${entry.wordCount.toLocaleString('es-AR')} palabras${entry.author ? ` · ${entry.author}` : ''}</span>
    ${entry.originalUrl ? `<a href="${entry.originalUrl}" style="color:#f59e0b;text-decoration:none" target="_blank" rel="noopener noreferrer">Ver original &#8599;</a>` : ''}
  </div>
</div>`;
}

/**
 * Export all entries as a standalone HTML file with museum plaques.
 */
export function exportToMuseumHtml(entries: MuseumEntry[]): string {
  const entriesHtml = entries.map(e => generateMuseumCardHtml(e)).join('\n');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Curador — Museo de Posts Rescatados</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 780px; margin: 0 auto; padding: 40px 20px; background: #fafafa; color: #111; }
    h1 { font-size: 2rem; margin-bottom: 4px; }
    .subtitle { color: #666; margin-bottom: 32px; }
    .summary { background: #fff; border: 1px solid #e5e5e5; border-radius: 8px; padding: 16px 20px; margin-bottom: 32px; display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 12px; }
    .summary-item { text-align: center; }
    .summary-item .num { font-size: 1.8rem; font-weight: 700; color: #333; }
    .summary-item .label { font-size: 0.8rem; color: #888; margin-top: 2px; }
    img { max-width: 100%; height: auto; }
    a { color: inherit; }
  </style>
</head>
<body>
  <h1>&#127963; Museo de Posts Rescatados</h1>
  <p class="subtitle">Generado el ${new Date().toLocaleDateString('es-AR')} — ${entries.length} entradas</p>
  <div class="summary">
    <div class="summary-item"><div class="num">${entries.length}</div><div class="label">Total</div></div>
    <div class="summary-item"><div class="num">${entries.filter(e => e.nostalgiaScore >= 50).length}</div><div class="label">Alta nostalgia</div></div>
    <div class="summary-item"><div class="num">${entries.filter(e => e.smokeIndex >= 40).length}</div><div class="label">Con humo</div></div>
    <div class="summary-item"><div class="num">${entries.filter(e => JSON.parse(e.platforms || '[]').length > 0).length}</div><div class="label">Con plataformas</div></div>
  </div>
  ${entriesHtml}
</body>
</html>`;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 120);
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}