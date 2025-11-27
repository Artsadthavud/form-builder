import { getByPath, replaceTemplateAsync } from './template';

// Lightweight resolver that uses element.tokenSources to resolve tokens.
// It expects tokenSources: Array<{ token, source: { type, url?, value?, mock?, dataPath?, valueField? } }>

type TokenSource = {
  token: string;
  source: {
    type: 'static' | 'api';
    url?: string;
    value?: string;
    mock?: boolean;
    dataPath?: string;
    valueField?: string;
  };
};

// `fetcher` should be a function(url, opts) returning parsed JSON for api sources.
export async function resolveTemplateWithSources(
  template: string,
  tokenSources: TokenSource[] | undefined,
  fetcher: (url: string, opts?: any) => Promise<any>
) {
  if (!tokenSources || tokenSources.length === 0) return template;

  const cache: Record<string, any> = {};

  const resolver = async (token: string) => {
    // find mapping (exact match)
    const mapping = tokenSources!.find(t => normalizeToken(t.token) === normalizeToken(token));
    if (!mapping) return '';
    const src = mapping.source;
    const cacheKey = (src.url || '') + '|' + (src.value || '') + '|' + (src.mock ? 'm' : '');
    if (cacheKey && cache[cacheKey] !== undefined) return cache[cacheKey];

    try {
      if (src.type === 'static') {
        const val = src.value ?? '';
        cache[cacheKey] = val;
        return val;
      }

      // api
      const url = src.url || '';
      const data = await fetcher(url);
      let extracted = data;
      if (src.dataPath) {
        extracted = getByPath(data, src.dataPath) ?? extracted;
      }
      if (src.valueField && Array.isArray(extracted)) {
        const mapped = extracted.map((it: any) => it[src.valueField]);
        cache[cacheKey] = mapped;
        return mapped;
      }
      if (src.valueField && typeof extracted === 'object' && extracted !== null) {
        cache[cacheKey] = extracted[src.valueField];
        return extracted[src.valueField];
      }
      cache[cacheKey] = extracted;
      return extracted;
    } catch (e) {
      console.error('template resolver fetch error', e);
      return '';
    }
  };

  const result = await replaceTemplateAsync(template, {}, resolver);
  return result;
}

function normalizeToken(s: string) {
  return s.trim().replace(/^[\{\[]+|[\}\]]+$/g, '');
}
