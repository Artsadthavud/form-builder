export function getByPath(obj: any, path?: string) {
  if (!path) return obj;
  const parts = path.split('.').filter(Boolean);
  let cur = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    // support array indexes like items[0]
    const match = p.match(/(\w+)\[(\d+)\]$/);
    if (match) {
      const key = match[1];
      const idx = parseInt(match[2], 10);
      cur = cur[key];
      if (!Array.isArray(cur)) return undefined;
      cur = cur[idx];
    } else {
      cur = cur[p];
    }
  }
  return cur;
}

function normalizeToken(raw: string) {
  return raw.trim().replace(/^[\{\[]+|[\}\]]+$/g, '');
}

// Async template replacer. Finds tokens in formats like {token} or [Token]
export async function replaceTemplateAsync(template: string, _context: any, resolver: (token: string) => Promise<any>) {
  if (!template) return template;
  // find tokens: {token} or [token]
  const tokenRegex = /\{([^}]+)\}|\[([^\]]+)\]/g;
  const tokens: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = tokenRegex.exec(template)) !== null) {
    const t = m[1] || m[2];
    if (t) tokens.push(t);
  }

  const unique = Array.from(new Set(tokens));
  const values: Record<string, any> = {};
  await Promise.all(unique.map(async (tok) => {
    try {
      const val = await resolver(normalizeToken(tok));
      values[tok] = val;
    } catch (e) {
      values[tok] = '';
    }
  }));

  const replaced = template.replace(tokenRegex, (match, g1, g2) => {
    const key = g1 || g2;
    const v = values[key];
    if (v === undefined || v === null) return '';
    if (Array.isArray(v)) return v.join(', ');
    return String(v);
  });
  return replaced;
}

// Minimal sync replacer (best-effort) used if no async resolver
export function replaceTemplateSync(template: string, ctx: Record<string, any>) {
  if (!template) return template;
  return template.replace(/\{([^}]+)\}|\[([^\]]+)\]/g, (_m, g1, g2) => {
    const key = (g1 || g2 || '').trim();
    const v = ctx[key];
    if (v === undefined || v === null) return '';
    if (Array.isArray(v)) return v.join(', ');
    return String(v);
  });
}

export default {};
