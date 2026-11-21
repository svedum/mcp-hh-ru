const API_BASE = "https://api.hh.ru";

export type HhQuery = Record<
  string,
  string | number | boolean | undefined | null
>;

export class HhApiError extends Error {
  readonly status: number;
  readonly body: string;

  constructor(status: number, body: string, path: string) {
    super(`hh.ru ${status} ${path}: ${body.slice(0, 500)}`);
    this.name = "HhApiError";
    this.status = status;
    this.body = body;
  }
}

/**
 * hh.ru rejects requests without a contact User-Agent.
 * Set HH_USER_AGENT as a full string, or HH_UA_EMAIL to build `mcp-hh-ru/<ver> (email)`.
 */
export function resolveUserAgent(env: NodeJS.ProcessEnv = process.env): string {
  const custom = env.HH_USER_AGENT?.trim();
  if (custom) return custom;
  const email = env.HH_UA_EMAIL?.trim();
  if (!email) {
    throw new Error(
      "Set HH_USER_AGENT (full User-Agent) or HH_UA_EMAIL (contact email for HH-User-Agent).",
    );
  }
  return `mcp-hh-ru/0.2.0 (${email})`;
}

function buildUrl(path: string, query?: HhQuery): string {
  const url = new URL(
    path.startsWith("http") ? path : `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`,
  );
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === "") continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

export async function hhFetch<T = unknown>(options: {
  path: string;
  method?: string;
  query?: HhQuery;
  body?: unknown;
  token?: string;
  env?: NodeJS.ProcessEnv;
}): Promise<T> {
  const env = options.env ?? process.env;
  const method = options.method ?? "GET";
  const headers: Record<string, string> = {
    Accept: "application/json",
    "HH-User-Agent": resolveUserAgent(env),
  };
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }
  let body: string | undefined;
  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.body);
  }
  const response = await fetch(buildUrl(options.path, options.query), {
    method,
    headers,
    body,
  });
  const text = await response.text();
  if (!response.ok) {
    throw new HhApiError(response.status, text || response.statusText, options.path);
  }
  if (!text) return undefined as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as T;
  }
}
