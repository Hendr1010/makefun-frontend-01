// api.js — read-only access to make.fun's public API.
// Base: https://make.fun/api — public GET, CORS open, no key needed.
// Responses vary in shape, so every accessor here is defensive and the
// views use format.val() to try several field names.
//
// Performance: answers are cached in memory and revalidated with
// ETag / If-None-Match where the API sends one.

export const API_BASE = "https://make.fun/api";

// In-memory cache: url -> { etag, data, at }
const cache = new Map();

async function getJson(path) {
  const url = API_BASE + path;
  const hit = cache.get(url);
  const headers = { Accept: "application/json" };
  if (hit && hit.etag) headers["If-None-Match"] = hit.etag;

  let res;
  try {
    res = await fetch(url, { headers });
  } catch (err) {
    if (hit) return hit.data; // offline: serve the stale copy
    throw err;
  }

  if (res.status === 304 && hit) return hit.data;
  if (!res.ok) {
    if (hit) return hit.data;
    const err = new Error(`make.fun API ${res.status} for ${path}`);
    err.status = res.status;
    throw err;
  }

  const data = await res.json();
  const etag = res.headers.get("etag");
  cache.set(url, { etag, data, at: Date.now() });
  return data;
}

/** List of open bounties. Returns an array (possibly empty). */
export async function getBounties() {
  const data = await getJson("/competitions?status=open&activity=times");
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.competitions)) return data.competitions;
  return [];
}

/** One bounty by slug. Returns the bounty object. */
export async function getBounty(slug) {
  const data = await getJson(`/competitions/${encodeURIComponent(slug)}`);
  return data.competition ?? data;
}

/**
 * Leaderboard for a bounty. Returns { entries, columns, rankKey, title }.
 * Falls back to the bounty itself when the leaderboard endpoint fails.
 */
export async function getLeaderboard(slug) {
  try {
    const data = await getJson(`/competitions/${encodeURIComponent(slug)}/leaderboard`);
    const entries = data.entries ?? data.leaderboard?.entries ?? data.items ?? [];
    return {
      entries,
      columns: data.columns ?? [],
      rankKey: data.rank_key ?? data.rankKey ?? "score",
      title: data.title ?? data.competition?.title ?? "",
      competition: data.competition ?? null,
    };
  } catch (err) {
    const bounty = await getBounty(slug);
    const entries = bounty.leaderboard?.entries ?? bounty.leaderboard ?? bounty.submissions ?? [];
    return { entries, columns: [], rankKey: "score", title: bounty.title ?? "", competition: bounty };
  }
}

/**
 * Public profile for an account id / handle.
 * Tries /profiles/<handle> first (the endpoint that currently answers
 * for public handles), then /accounts/<id>, then /users/<id>.
 * Trying the working endpoint first keeps the happy path free of 404s
 * (a failed fetch still logs a console error in the browser).
 */
export async function getAccount(id) {
  const enc = encodeURIComponent(id);
  const tries = [`/profiles/${enc}`, `/accounts/${enc}`, `/users/${enc}`];
  let lastErr = null;
  for (const path of tries) {
    try {
      const data = await getJson(path);
      if (data && (data.handle || data.display_name || data.name || data.solutions || data.record)) {
        return data.profile ?? data.account ?? data.user ?? data;
      }
    } catch (err) {
      lastErr = err;
    }
  }
  const err = new Error(`Account not found: ${id}`);
  err.status = 404;
  err.cause = lastErr;
  throw err;
}
