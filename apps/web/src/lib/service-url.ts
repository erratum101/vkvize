const DEFAULT_PORT = '4000';
const LAN_HOST_PATTERN =
  /^(10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)$/;

function extractPort(url: string, fallback: string) {
  try {
    return new URL(url).port || fallback;
  } catch {
    return fallback;
  }
}

export function resolveServiceUrl(envUrl?: string, defaultPort = DEFAULT_PORT) {
  const fallback = `http://localhost:${defaultPort}`;
  const configured = envUrl || fallback;

  if (typeof window === 'undefined') {
    return configured;
  }

  const { hostname, protocol } = window.location;
  const isLocalPage = hostname === 'localhost' || hostname === '127.0.0.1';
  const pointsToLocalService =
    configured.includes('localhost') || configured.includes('127.0.0.1');

  // Only rewrite for LAN dev (e.g. phone testing at 10.x.x.x:3000), not production hosts.
  if (!isLocalPage && LAN_HOST_PATTERN.test(hostname) && pointsToLocalService) {
    const port = extractPort(configured, defaultPort);
    return `${protocol}//${hostname}:${port}`;
  }

  return configured;
}

export function getApiUrl() {
  return resolveServiceUrl(process.env.NEXT_PUBLIC_API_URL);
}

export function getWsUrl() {
  return resolveServiceUrl(process.env.NEXT_PUBLIC_WS_URL);
}
