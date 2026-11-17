import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  ExternalComponentStatus,
  ExternalProviderStatus,
  PlatformStatusPayload,
  ServiceHealthLevel,
} from '@/features/admin/types';
import { SUPABASE_PROJECT_NAME } from '@/lib/supabase/config';
import { FREE_TIER_LIMITS } from '@/lib/supabase/free-tier-limits';
import { getServerSupabaseConfig } from '@/lib/supabase/server-env';
import { resolveServerSession } from '@/lib/supabase/session';
import {
  checkRateLimit,
  getClientRateLimitKey,
} from '@/server/rate-limit/api-rate-limiter';

const STATUS_CACHE_TTL_MS = 60_000;

let cachedPlatformStatus: {
  expiresAt: number;
  payload: PlatformStatusPayload;
} | null = null;

interface StatuspageSummaryResponse {
  status?: {
    indicator?: string;
    description?: string;
  };
  components?: {
    name?: string;
    status?: string;
  }[];
  incidents?: {
    name?: string;
    status?: string;
  }[];
}

function mapIndicatorToLevel(
  indicator: string | undefined,
  components: ExternalComponentStatus[]
): ServiceHealthLevel {
  if (indicator === 'major' || indicator === 'critical') return 'outage';
  if (indicator === 'minor') return 'degraded';
  if (
    components.some(
      (c) =>
        c.status === 'under_maintenance' ||
        c.status === 'scheduled_maintenance'
    )
  ) {
    return 'maintenance';
  }
  if (indicator === 'none') return 'operational';
  return 'unknown';
}

function normalizeIndicator(
  raw: string | undefined
): ExternalProviderStatus['indicator'] {
  if (
    raw === 'none' ||
    raw === 'minor' ||
    raw === 'major' ||
    raw === 'critical'
  ) {
    return raw;
  }
  return 'unknown';
}

async function fetchStatuspageSummary(
  provider: 'vercel' | 'supabase',
  baseUrl: string,
  priorityNames: string[]
): Promise<ExternalProviderStatus> {
  const fetchedAt = new Date().toISOString();
  try {
    const res = await fetch(`${baseUrl}/api/v2/summary.json`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(4000),
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const json = (await res.json()) as StatuspageSummaryResponse;
    const allComponents = Array.isArray(json.components)
      ? json.components
          .filter((c): c is { name: string; status: string } =>
            Boolean(c?.name && c?.status)
          )
          .map((c) => ({ name: c.name, status: c.status }))
      : [];

    const matchedComponents = priorityNames
      .map((target) =>
        allComponents.find((c) =>
          c.name.toLowerCase().includes(target.toLowerCase())
        )
      )
      .filter((c): c is ExternalComponentStatus => Boolean(c));

    const components =
      matchedComponents.length > 0
        ? matchedComponents.slice(0, 4)
        : allComponents.slice(0, 4);

    const activeIncident = Array.isArray(json.incidents)
      ? json.incidents.find(
          (i) => i?.name && i.status !== 'resolved' && i.status !== 'postmortem'
        )
      : undefined;

    const indicator = normalizeIndicator(json.status?.indicator);
    return {
      provider,
      statusPageUrl: baseUrl,
      indicator,
      description: json.status?.description || 'Status feed operational',
      level: mapIndicatorToLevel(json.status?.indicator, components),
      activeIncidentTitle: activeIncident?.name || null,
      components,
      fetchedAt,
      reachable: true,
    };
  } catch {
    return {
      provider,
      statusPageUrl: baseUrl,
      indicator: 'unknown',
      description: 'Status feed unreachable (offline or timeout)',
      level: 'unknown',
      activeIncidentTitle: null,
      components: [],
      fetchedAt,
      reachable: false,
    };
  }
}

async function probeSupabaseServices() {
  const cfg = getServerSupabaseConfig();
  if (!cfg.isConfigured) {
    return {
      projectName: SUPABASE_PROJECT_NAME,
      projectRef: cfg.projectRef,
      url: cfg.url,
      authProbe: {
        ok: false,
        latencyMs: 0,
        providers: [] as string[],
        detail: 'Supabase anon key missing',
      },
      dbProbe: {
        ok: false,
        schemaReady: false,
        latencyMs: 0,
        detail: 'Supabase keys missing',
      },
      storageProbe: {
        ok: false,
        bucketReady: false,
        latencyMs: 0,
        detail: 'Supabase keys missing',
      },
      hasServiceRole: cfg.hasServiceRole,
    };
  }

  const key = cfg.serviceRoleKey || cfg.anonKey;
  const client = createClient(cfg.url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const authProbePromise = (async () => {
    const start = Date.now();
    try {
      const res = await fetch(`${cfg.url}/auth/v1/settings`, {
        headers: { apikey: cfg.anonKey },
        cache: 'no-store',
        signal: AbortSignal.timeout(4000),
      });
      const latencyMs = Date.now() - start;
      if (!res.ok) {
        return {
          ok: false,
          latencyMs,
          providers: [] as string[],
          detail: `Auth HTTP ${res.status}`,
        };
      }
      const settings = (await res.json().catch(() => ({}))) as {
        external?: Record<string, boolean>;
      };
      const providers = Object.entries(settings.external || {})
        .filter(([, enabled]) => Boolean(enabled))
        .map(([provider]) => provider);

      return {
        ok: true,
        latencyMs,
        providers,
        detail: `GoTrue live (${latencyMs}ms)`,
      };
    } catch {
      return {
        ok: false,
        latencyMs: Date.now() - start,
        providers: [] as string[],
        detail: 'Auth endpoint unreachable',
      };
    }
  })();

  const dbProbePromise = (async () => {
    const start = Date.now();
    try {
      const { error } = await client
        .from('user_profiles')
        .select('id', { count: 'exact', head: true })
        .limit(1);
      const latencyMs = Date.now() - start;

      if (!error) {
        return {
          ok: true,
          schemaReady: true,
          latencyMs,
          detail: `Postgres & RLS live (${latencyMs}ms)`,
        };
      }
      if (
        error.code === 'PGRST116' ||
        error.code === 'PGRST205' ||
        error.code === '42P01'
      ) {
        return {
          ok: true,
          schemaReady: false,
          latencyMs,
          detail: `Postgres awake (${latencyMs}ms); schema.sql pending`,
        };
      }
      return {
        ok: false,
        schemaReady: false,
        latencyMs,
        detail: error.message || 'Postgres query failed',
      };
    } catch {
      return {
        ok: false,
        schemaReady: false,
        latencyMs: Date.now() - start,
        detail: 'Postgres probe failed',
      };
    }
  })();

  const storageProbePromise = (async () => {
    const start = Date.now();
    try {
      if (cfg.serviceRoleKey) {
        const { data: buckets, error } = await client.storage.listBuckets();
        const latencyMs = Date.now() - start;
        if (error) {
          return {
            ok: false,
            bucketReady: false,
            latencyMs,
            detail: error.message || 'Storage error',
          };
        }
        const hasResumes = (buckets || []).some((b) => b.name === 'resumes');
        return {
          ok: true,
          bucketReady: hasResumes,
          latencyMs,
          detail: hasResumes
            ? `resumes bucket ready (${latencyMs}ms)`
            : `Storage live (${latencyMs}ms); resumes bucket missing`,
        };
      }

      const res = await fetch(`${cfg.url}/storage/v1/bucket`, {
        headers: { apikey: cfg.anonKey },
        cache: 'no-store',
        signal: AbortSignal.timeout(4000),
      });
      const latencyMs = Date.now() - start;
      const reachable = res.status < 500;
      return {
        ok: reachable,
        bucketReady: false,
        latencyMs,
        detail: reachable
          ? `Storage reachable (${latencyMs}ms); add service role for bucket audit`
          : `Storage HTTP ${res.status}`,
      };
    } catch {
      return {
        ok: false,
        bucketReady: false,
        latencyMs: Date.now() - start,
        detail: 'Storage endpoint unreachable',
      };
    }
  })();

  const [authProbe, dbProbe, storageProbe] = await Promise.all([
    authProbePromise,
    dbProbePromise,
    storageProbePromise,
  ]);

  return {
    projectName: SUPABASE_PROJECT_NAME,
    projectRef: cfg.projectRef,
    url: cfg.url,
    authProbe,
    dbProbe,
    storageProbe,
    hasServiceRole: cfg.hasServiceRole,
  };
}

async function fetchOptionalVercelDeployment() {
  const token = process.env.VERCEL_TOKEN?.trim();
  if (!token) {
    return {
      tokenConfigured: false,
      latestDeploymentState: null as string | null,
      latestDeploymentCreatedAt: null as string | null,
    };
  }

  try {
    const projectId = process.env.VERCEL_PROJECT_ID?.trim();
    const qs = new URLSearchParams({ limit: '1' });
    if (projectId) qs.set('projectId', projectId);

    const res = await fetch(
      `https://api.vercel.com/v6/deployments?${qs.toString()}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
        signal: AbortSignal.timeout(4000),
      }
    );
    if (!res.ok) {
      return {
        tokenConfigured: true,
        latestDeploymentState: `HTTP ${res.status}`,
        latestDeploymentCreatedAt: null,
      };
    }
    const json = (await res.json()) as {
      deployments?: { state?: string; readyState?: string; created?: number }[];
    };
    const latest = json.deployments?.[0];
    return {
      tokenConfigured: true,
      latestDeploymentState:
        latest?.readyState || latest?.state || 'UNKNOWN',
      latestDeploymentCreatedAt: latest?.created
        ? new Date(latest.created).toISOString()
        : null,
    };
  } catch {
    return {
      tokenConfigured: true,
      latestDeploymentState: 'UNREACHABLE',
      latestDeploymentCreatedAt: null,
    };
  }
}

export async function GET(request: NextRequest) {
  const rateKey = getClientRateLimitKey(request, 'admin-platform-status');
  const decision = checkRateLimit(rateKey, 30, 60_000);
  if (!decision.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait before refreshing status.' },
      {
        status: 429,
        headers: { 'Retry-After': String(decision.retryAfterSeconds) },
      }
    );
  }

  const session = await resolveServerSession();
  if (!session.authenticated || !session.authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!session.authUser.isAdmin) {
    return NextResponse.json(
      { error: 'Forbidden: Admin role required.' },
      { status: 403 }
    );
  }

  const force = request.nextUrl.searchParams.get('force') === '1';
  const now = Date.now();
  if (!force && cachedPlatformStatus && cachedPlatformStatus.expiresAt > now) {
    return NextResponse.json({
      ...cachedPlatformStatus.payload,
      cached: true,
    });
  }

  const [vercelGlobal, supabaseGlobal, supabaseProbes, vercelDeploy] =
    await Promise.all([
      fetchStatuspageSummary('vercel', 'https://www.vercel-status.com', [
        'Edge Network',
        'Serverless Functions',
        'Builds',
        'Cron Jobs',
      ]),
      fetchStatuspageSummary('supabase', 'https://status.supabase.com', [
        'Auth',
        'Database',
        'Storage',
        'REST',
      ]),
      probeSupabaseServices(),
      fetchOptionalVercelDeployment(),
    ]);

  const isVercelHosted = process.env.VERCEL === '1';
  const runtimeEnv =
    process.env.VERCEL_ENV || (isVercelHosted ? 'production' : 'local');
  const productionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : null;
  const deploymentUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : null;

  const oauthProviders = supabaseProbes.authProbe.providers.filter(
    (p) => p !== 'email' && p !== 'phone'
  );
  const customDomainConfigured = Boolean(
    productionUrl && !productionUrl.endsWith('.vercel.app')
  );

  const payload: PlatformStatusPayload = {
    checkedAt: new Date().toISOString(),
    cached: false,
    vercel: {
      runtimeEnv,
      isVercelHosted,
      region: process.env.VERCEL_REGION || null,
      deploymentUrl,
      productionUrl,
      gitBranch: process.env.VERCEL_GIT_COMMIT_REF || null,
      gitCommitSha: process.env.VERCEL_GIT_COMMIT_SHA
        ? process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7)
        : null,
      gitCommitMessage: process.env.VERCEL_GIT_COMMIT_MESSAGE || null,
      keepAliveCron: FREE_TIER_LIMITS.keepAliveCron,
      tokenConfigured: vercelDeploy.tokenConfigured,
      latestDeploymentState: vercelDeploy.latestDeploymentState,
      latestDeploymentCreatedAt: vercelDeploy.latestDeploymentCreatedAt,
      globalStatus: vercelGlobal,
    },
    supabase: {
      ...supabaseProbes,
      globalStatus: supabaseGlobal,
    },
    readiness: {
      customDomainConfigured,
      oauthConfigured: oauthProviders.length > 0,
      geminiServerConfigured: Boolean(process.env.GEMINI_API_KEY?.trim()),
      keepAliveConfigured: Boolean(FREE_TIER_LIMITS.keepAliveCron),
    },
  };

  cachedPlatformStatus = {
    expiresAt: now + STATUS_CACHE_TTL_MS,
    payload,
  };

  return NextResponse.json(payload);
}
