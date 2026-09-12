const DEFAULT_AGENT_URL = import.meta.env.DEV ? '/agent-api' : 'http://127.0.0.1:8765';

export function getAgentBaseUrl(): string {
  const configured = import.meta.env.VITE_AGENT_URL;
  if (typeof configured === 'string' && configured.trim().length > 0) {
    return configured.replace(/\/$/, '');
  }
  return DEFAULT_AGENT_URL;
}

export function getAgentWebSocketBase(): string {
  const baseUrl = getAgentBaseUrl();
  if (baseUrl.startsWith('/')) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}${baseUrl}`;
  }
  return baseUrl.replace(/^http/, 'ws');
}

interface RequestOptions extends RequestInit {
  parseJson?: boolean;
}

export async function agentRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { parseJson = true, headers, ...rest } = options;
  const url = `${getAgentBaseUrl()}${path}`;

  try {
    const response = await fetch(url, {
      ...rest,
      headers: {
        ...(parseJson && !(rest.body instanceof FormData)
          ? { 'Content-Type': 'application/json' }
          : {}),
        ...headers,
      },
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || `Request failed (${response.status})`);
    }

    if (!parseJson || response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Unknown agent request failure');
  }
}
