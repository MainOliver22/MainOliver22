import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000/api';

function buildBackendUrl(endpoint: string | null): string | null {
  if (!endpoint) return null;
  // Prevent path traversal: only allow alphanumeric, slashes, hyphens, underscores, and query strings
  if (!/^[\w\-/]+$/.test(endpoint)) return null;
  return `${BACKEND_URL.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint');

  const backendUrl = buildBackendUrl(endpoint);
  if (!backendUrl) {
    return NextResponse.json({ error: 'Missing or invalid endpoint' }, { status: 400 });
  }

  // Forward query params (excluding 'endpoint' itself)
  const forwardParams = new URLSearchParams(searchParams);
  forwardParams.delete('endpoint');
  const queryString = forwardParams.toString();
  const targetUrl = queryString ? `${backendUrl}?${queryString}` : backendUrl;

  const response = await fetch(targetUrl, {
    headers: {
      Authorization: request.headers.get('authorization') ?? '',
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint');

  const backendUrl = buildBackendUrl(endpoint);
  if (!backendUrl) {
    return NextResponse.json({ error: 'Missing or invalid endpoint' }, { status: 400 });
  }

  const body = await request.text();

  const response = await fetch(backendUrl, {
    method: 'POST',
    headers: {
      Authorization: request.headers.get('authorization') ?? '',
      'Content-Type': 'application/json',
    },
    body,
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
