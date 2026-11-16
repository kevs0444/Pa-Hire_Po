import { NextRequest, NextResponse } from 'next/server';
import type { RoleLibraryEntry } from '@/types/profile';
import { TtlCache } from '@/server/cache/ttl-cache';
import { searchLocalRoleCatalog } from '@/features/roles/lib/role-library';

const roleSearchCache = new TtlCache<RoleLibraryEntry[]>(250);
const escoSkillCache = new TtlCache<string[]>(250);

interface EscoSearchResponse {
  _embedded?: {
    results?: Array<{
      title?: string;
      uri?: string;
      className?: string;
    }>;
  };
}

interface EscoOccupationDetailResponse {
  title?: string;
  _links?: {
    hasEssentialSkill?: Array<{ title?: string }>;
    hasOptionalSkill?: Array<{ title?: string }>;
  };
}

async function fetchEscoRoles(query: string): Promise<RoleLibraryEntry[]> {
  const clean = query.trim();
  if (clean.length < 2) return [];

  const { value } = await roleSearchCache.getOrFetch(
    `esco:q:${clean.toLowerCase()}`,
    1000 * 60 * 30,
    async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3500);
      try {
        const url = new URL('https://ec.europa.eu/esco/api/search');
        url.searchParams.set('text', clean);
        url.searchParams.set('type', 'occupation');
        url.searchParams.set('language', 'en');
        url.searchParams.set('limit', '12');

        const res = await fetch(url.toString(), {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        });
        if (!res.ok) return [];
        const data = (await res.json()) as EscoSearchResponse;
        const results = data?._embedded?.results || [];
        return results
          .filter((r) => Boolean(r.title?.trim()))
          .map((r) => ({
            title: String(r.title).trim(),
            source: 'esco' as const,
            escoUri: r.uri,
            category: 'ESCO Occupation Library',
            skills: [],
          }));
      } catch {
        return [];
      } finally {
        clearTimeout(timer);
      }
    }
  );

  return value;
}

async function fetchEscoOccupationSkills(uri: string): Promise<string[]> {
  const cleanUri = uri.trim();
  if (!cleanUri) return [];

  const { value } = await escoSkillCache.getOrFetch(
    `esco:uri:${cleanUri}`,
    1000 * 60 * 60,
    async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3500);
      try {
        const url = new URL(
          'https://ec.europa.eu/esco/api/resource/occupation'
        );
        url.searchParams.set('uri', cleanUri);
        url.searchParams.set('language', 'en');

        const res = await fetch(url.toString(), {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        });
        if (!res.ok) return [];
        const data = (await res.json()) as EscoOccupationDetailResponse;
        const essential = (data._links?.hasEssentialSkill || [])
          .map((s) => s.title?.trim())
          .filter((s): s is string => Boolean(s));
        const optional = (data._links?.hasOptionalSkill || [])
          .map((s) => s.title?.trim())
          .filter((s): s is string => Boolean(s));

        return Array.from(new Set([...essential.slice(0, 8), ...optional.slice(0, 4)])).slice(
          0,
          10
        );
      } catch {
        return [];
      } finally {
        clearTimeout(timer);
      }
    }
  );

  return value;
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') || '';
  const uri = request.nextUrl.searchParams.get('uri') || '';

  if (uri) {
    const skills = await fetchEscoOccupationSkills(uri);
    return NextResponse.json({ uri, skills });
  }

  const localMatches = searchLocalRoleCatalog(q, 10);
  const escoMatches = q.trim().length >= 2 ? await fetchEscoRoles(q) : [];

  // Deduplicate by lowercase role title, keeping catalog entries (which carry instant skills) first
  const mergedMap = new Map<string, RoleLibraryEntry>();
  for (const entry of [...localMatches, ...escoMatches]) {
    const key = entry.title.trim().toLowerCase();
    if (!key) continue;
    if (!mergedMap.has(key)) {
      mergedMap.set(key, entry);
    }
  }

  return NextResponse.json({
    query: q,
    escoUsed: escoMatches.length > 0,
    results: Array.from(mergedMap.values()).slice(0, 16),
  });
}
