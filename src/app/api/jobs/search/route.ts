import { NextRequest, NextResponse } from 'next/server';
import {
  checkRateLimit,
  getClientRateLimitKey,
} from '@/server/rate-limit/api-rate-limiter';
import {
  executeJobSearch,
  JobSearchRequestBody,
} from '@/server/services/job-search-service';

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  const rate = checkRateLimit(
    getClientRateLimitKey(request, 'jobs-search'),
    30,
    60_000
  );
  if (!rate.allowed) {
    return NextResponse.json(
      {
        error: 'Search rate limit reached. Please wait a few seconds before scanning again.',
      },
      {
        status: 429,
        headers: { 'Retry-After': String(rate.retryAfterSeconds) },
      }
    );
  }

  try {
    const body = (await request.json().catch(() => ({}))) as JobSearchRequestBody;
    const result = await executeJobSearch(body);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : 'Failed to execute job search pipeline',
      },
      { status: 500 }
    );
  }
}
