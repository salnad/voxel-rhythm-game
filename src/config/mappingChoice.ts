/**
 * Which action → music mapping is active. `?mapping=<key>` overrides the saved choice for
 * this page load (the playtest hub links each mapping this way) without touching the saved
 * setting, because every hub version shares one origin and so one localStorage.
 */

export interface MappingChoice {
  key: string;
  /** The requested key when it isn't in the registry (this version doesn't have it). */
  unknown: string | null;
}

export function chooseMapping(
  requested: string | null,
  saved: string,
  registry: Readonly<Record<string, unknown>>,
  fallback: string,
): MappingChoice {
  const known = (k: string) => Object.hasOwn(registry, k);
  if (requested && known(requested)) return { key: requested, unknown: null };
  const base = known(saved) ? saved : fallback;
  return { key: base, unknown: requested || null };
}

/** The current URL with `?mapping=` set, keeping every other param. */
export function urlWithMapping(href: string, key: string): string {
  const url = new URL(href);
  url.searchParams.set('mapping', key);
  return url.toString();
}
