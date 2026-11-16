import { readFile } from "node:fs/promises";

/**
 * Optional JSON credentials from a host that completed OAuth for this MCP
 * (`access_token`, optional `expiry_date`). When unset, callers use HH_TOKEN.
 */
export const PLUGIN_OAUTH_CREDENTIALS_ENV = "PLUGIN_OAUTH_CREDENTIALS_PATH";

interface CredentialsFile {
  access_token?: unknown;
  expiry_date?: unknown;
}

export class NotSignedInError extends Error {
  constructor(message = "hh.ru is not signed in") {
    super(message);
    this.name = "NotSignedInError";
  }
}

/**
 * Access token for api.hh.ru: credentials file from PLUGIN_OAUTH_CREDENTIALS_PATH
 * first, then `HH_TOKEN` / `HH_ACCESS_TOKEN` / `HEADHUNTER_TOKEN`.
 */
export async function resolveAccessToken(
  env: NodeJS.ProcessEnv = process.env,
  now = Date.now(),
): Promise<string | undefined> {
  const path = env[PLUGIN_OAUTH_CREDENTIALS_ENV]?.trim();
  if (path) {
    let raw: string;
    try {
      raw = await readFile(path, "utf8");
    } catch {
      throw new NotSignedInError(
        "hh.ru is not signed in (credentials file missing). Set HH_TOKEN or reconnect OAuth.",
      );
    }
    let credentials: CredentialsFile;
    try {
      credentials = JSON.parse(raw) as CredentialsFile;
    } catch {
      throw new NotSignedInError(
        "hh.ru credentials file is damaged. Set HH_TOKEN or reconnect OAuth.",
      );
    }
    const token =
      typeof credentials.access_token === "string"
        ? credentials.access_token.trim()
        : "";
    if (!token) {
      throw new NotSignedInError(
        "hh.ru is not signed in (empty access_token). Set HH_TOKEN or reconnect OAuth.",
      );
    }
    const expiry = credentials.expiry_date;
    if (typeof expiry === "number" && expiry <= now) {
      throw new NotSignedInError(
        "hh.ru sign-in expired. Set HH_TOKEN or reconnect OAuth.",
      );
    }
    return token;
  }

  const fromEnv =
    env.HH_TOKEN?.trim() ||
    env.HH_ACCESS_TOKEN?.trim() ||
    env.HEADHUNTER_TOKEN?.trim();
  return fromEnv || undefined;
}

export async function requireAccessToken(
  env: NodeJS.ProcessEnv = process.env,
): Promise<string> {
  const token = await resolveAccessToken(env);
  if (!token) {
    throw new NotSignedInError(
      "Set HH_TOKEN (OAuth access token from https://dev.hh.ru/admin).",
    );
  }
  return token;
}
