/**
 * Playtest hub: every playable version of the game, one Vite build per folder on the
 * gh-pages branch (main/, pr-5/, ...), plus a generated index.html. Driven by
 * .github/workflows/playtest-hub.yml. Runs on plain Node (type stripping), no dependencies.
 *
 *   node scripts/hub/site.ts plan    -> JSON list of versions to (re)build for this event
 *   node scripts/hub/site.ts stamp   <distDir>   -> writes <distDir>/version.json from env
 *   node scripts/hub/site.ts update  <siteDir> <incomingDir> <prs.json>
 *   node scripts/hub/site.ts preview <siteDir>  -> rewrites only index.html (local testing)
 */
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

export interface MappingInfo {
  key: string;
  label: string;
  description: string;
}

export interface VersionInfo {
  slot: string;
  kind: 'main' | 'pr';
  status: 'live' | 'archived';
  pr?: number;
  /** PR title, or the commit subject for main. */
  title: string;
  url?: string;
  branch: string;
  sha: string;
  subject: string;
  builtAt: string;
  closedAt?: string;
  repo: string;
  mappings: MappingInfo[];
}

/** The subset of the GitHub pulls API the hub reads. */
export interface PullRequest {
  number: number;
  title: string;
  state: 'open' | 'closed';
  html_url: string;
  merged_at: string | null;
  closed_at: string | null;
  head: { sha: string; ref: string; repo: { full_name: string } | null };
}

export interface BuildTarget {
  slot: string;
  kind: 'main' | 'pr';
  ref: string;
  branch: string;
  title: string;
  url: string;
  pr: string;
}

export interface HubEvent {
  name: string;
  action?: string;
  sha: string;
  repo: string;
  pr?: number;
}

export const MAX_ARCHIVED = 8;

const prSlot = (n: number) => `pr-${n}`;

function prTarget(pr: PullRequest): BuildTarget {
  return {
    slot: prSlot(pr.number),
    kind: 'pr',
    ref: pr.head.sha,
    branch: pr.head.ref,
    title: pr.title,
    url: pr.html_url,
    pr: String(pr.number),
  };
}

const ownOpen = (prs: PullRequest[], repo: string) =>
  prs.filter((p) => p.state === 'open' && p.head.repo?.full_name === repo);

/**
 * Which versions to build. A push to main also rebuilds open PRs whose deployed build is
 * missing or stale, so PRs opened before the hub existed (or whose deploy failed) catch up.
 * Fork PRs are skipped: their runs get a read-only token and can't publish.
 */
export function plan(event: HubEvent, prs: PullRequest[], deployed: VersionInfo[]): BuildTarget[] {
  const main: BuildTarget = {
    slot: 'main',
    kind: 'main',
    ref: event.sha,
    branch: 'main',
    title: 'main',
    url: '',
    pr: '',
  };
  const open = ownOpen(prs, event.repo);
  const deployedSha = new Map(deployed.map((v) => [v.slot, v.sha]));
  switch (event.name) {
    case 'push':
      return [
        main,
        ...open.filter((p) => deployedSha.get(prSlot(p.number)) !== p.head.sha).map(prTarget),
      ];
    case 'pull_request': {
      if (!['opened', 'synchronize', 'reopened'].includes(event.action ?? '')) return [];
      return open.filter((p) => p.number === event.pr).map(prTarget);
    }
    default:
      return [main, ...open.map(prTarget)];
  }
}

/**
 * Applies PR state to the deployed versions: open PRs stay live (with fresh titles), merged
 * PRs move to the archive (newest MAX_ARCHIVED kept), PRs closed without merging are removed.
 */
export function reconcile(
  versions: VersionInfo[],
  prs: PullRequest[],
  maxArchived = MAX_ARCHIVED,
): { keep: VersionInfo[]; remove: string[] } {
  const byNumber = new Map(prs.map((p) => [p.number, p]));
  const keep: VersionInfo[] = [];
  const remove: string[] = [];
  for (const v of versions) {
    const pr = v.pr === undefined ? undefined : byNumber.get(v.pr);
    if (v.kind !== 'pr' || !pr) keep.push(v);
    else if (pr.state === 'open') keep.push({ ...v, status: 'live', title: pr.title });
    else if (pr.merged_at)
      keep.push({ ...v, status: 'archived', title: pr.title, closedAt: pr.merged_at });
    else remove.push(v.slot);
  }
  const archived = keep
    .filter((v) => v.status === 'archived')
    .sort((a, b) => (b.closedAt ?? '').localeCompare(a.closedAt ?? ''));
  const pruned = new Set(archived.slice(maxArchived).map((v) => v.slot));
  return {
    keep: keep.filter((v) => !pruned.has(v.slot)),
    remove: [...remove, ...pruned],
  };
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/** Merge commits here carry a Co-authored-by trailer on the subject line itself. */
const headline = (subject: string) => subject.replace(/\s*Co-authored-by:.*$/is, '');

function card(v: VersionInfo): string {
  const commit = `https://github.com/${v.repo}/commit/${v.sha}`;
  const heading =
    v.kind === 'main'
      ? `<span class="tag">MAIN</span> latest`
      : `<a class="tag" href="${esc(v.url ?? '')}" target="_blank" rel="noopener">#${v.pr}</a> ${esc(v.title)}`;
  const play = `${v.slot}/`;
  const mappings = v.mappings.length
    ? `<div class="mappings"><span class="label">music mapping</span>${v.mappings
        .map(
          (m) =>
            `<a class="chip" href="${play}?mapping=${encodeURIComponent(m.key)}" target="_blank" title="${esc(m.description)}">${esc(m.label)}</a>`,
        )
        .join('')}</div>`
    : '';
  const closed = v.closedAt
    ? ` · merged <time data-t="${esc(v.closedAt)}">${esc(v.closedAt)}</time>`
    : '';
  return `<article class="card ${v.status}">
  <div class="head"><h3>${heading}</h3><a class="play" href="${play}" target="_blank">▶ PLAY</a></div>
  <div class="meta">
    <span class="branch">${esc(v.branch)}</span> ·
    <a href="${commit}" target="_blank" rel="noopener"><code>${esc(v.sha.slice(0, 7))}</code></a>
    ${v.kind === 'main' ? `<span class="subject">${esc(headline(v.subject))}</span>` : ''}
  </div>
  <div class="meta">built <time data-t="${esc(v.builtAt)}">${esc(v.builtAt)}</time>${closed} · <a href="${play}editor.html" target="_blank">map editor</a> · <code class="path">/${esc(v.slot)}/</code></div>
  ${mappings}
</article>`;
}

function section(title: string, note: string, versions: VersionInfo[], empty: string): string {
  return `<section><h2>${title}</h2>${note ? `<p class="note">${note}</p>` : ''}
${versions.length ? versions.map(card).join('\n') : `<p class="empty">${empty}</p>`}
</section>`;
}

export function renderIndex(versions: VersionInfo[], repo: string, generatedAt: string): string {
  const main = versions.filter((v) => v.kind === 'main');
  const open = versions
    .filter((v) => v.kind === 'pr' && v.status === 'live')
    .sort((a, b) => (b.pr ?? 0) - (a.pr ?? 0));
  const archived = versions
    .filter((v) => v.status === 'archived')
    .sort((a, b) => (b.closedAt ?? '').localeCompare(a.closedAt ?? ''));
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>VOXEL//RHYTHM playtest hub</title>
<style>
:root { --g:#39ff6a; --g-dim:#0b3d18; --g-mid:#1a8f3c; --w:#e6ffe9; --red:#ff3b5c; --cyan:#7dfcff; --gold:#ffd23b; }
* { box-sizing: border-box; }
body { margin:0; background:#000 radial-gradient(ellipse at top, #04210d 0%, #000 70%) fixed; color:var(--g);
  font:14px/1.5 ui-monospace, 'JetBrains Mono', Menlo, Consolas, monospace; }
main { max-width: 980px; margin: 0 auto; padding: 32px 20px 64px; }
h1 { margin:0; font-size:40px; letter-spacing:6px; color:var(--w); text-shadow:2px 0 var(--red), -2px 0 var(--cyan), 0 0 18px var(--g); }
.lead { color:var(--g-mid); margin:4px 0 24px; }
h2 { color:var(--w); letter-spacing:3px; font-size:16px; border-bottom:1px solid var(--g-dim); padding-bottom:6px; margin:28px 0 12px; }
.note, .empty { color:var(--g-mid); margin:0 0 12px; }
a { color:var(--cyan); }
.card { border:1px solid var(--g-mid); background:rgba(0,12,4,.85); padding:12px 16px; margin-bottom:10px;
  box-shadow: inset 0 0 24px rgba(57,255,106,.06); }
.card.archived { border-color:var(--g-dim); opacity:.85; }
.head { display:flex; justify-content:space-between; align-items:center; gap:12px; }
h3 { margin:0; font-size:15px; color:var(--w); font-weight:600; }
.tag { display:inline-block; border:1px solid var(--g); color:var(--g); padding:0 6px; margin-right:6px; text-decoration:none; font-size:12px; }
.archived .tag { border-color:var(--g-mid); color:var(--g-mid); }
.play { border:1px solid var(--g); color:var(--g); padding:6px 14px; text-decoration:none; letter-spacing:2px; white-space:nowrap; }
.play:hover, .play:focus-visible { background:var(--g); color:#000; outline:none; }
.meta { color:var(--g-mid); font-size:12px; margin-top:4px; }
.meta code { color:var(--g); }
.branch { color:var(--g); }
.subject { color:var(--w); margin-left:6px; }
.mappings { margin-top:8px; display:flex; flex-wrap:wrap; gap:6px; align-items:center; }
.mappings .label { color:var(--g-mid); font-size:12px; margin-right:4px; }
.chip { border:1px solid var(--g-mid); color:var(--g); padding:2px 8px; text-decoration:none; font-size:12px; }
.chip:hover { border-color:var(--g); color:var(--w); background:var(--g-dim); }
.tips { border:1px dashed var(--g-dim); padding:10px 14px; color:var(--g-mid); font-size:12px; margin-top:32px; }
.tips b { color:var(--w); font-weight:600; }
footer { color:var(--g-dim); font-size:12px; margin-top:24px; }
</style>
</head>
<body>
<main>
<h1>VOXEL//RHYTHM</h1>
<p class="lead">playtest hub · every version of the game, each a full build under its own path. Links open in a new tab so you can compare side by side.</p>
${section('LATEST', '', main, 'main has not been built yet.')}
${section('OPEN PULL REQUESTS', 'Rebuilt on every push to the PR branch. A PR leaves this list when it closes.', open, 'No open pull requests.')}
${section('RECENTLY MERGED', `Milestones kept as they were when their PR merged (newest ${MAX_ARCHIVED}).`, archived, 'Nothing merged since the hub started.')}
<div class="tips">
<b>Comparing music mappings:</b> each chip opens that version with <code>?mapping=&lt;key&gt;</code>; the main menu also has an ACTIONS → MUSIC selector.
A <code>?mapping=</code> link doesn't change your saved choice.<br>
<b>Audio:</b> every tab plays its own sound, so pause one version (Esc) before starting another.<br>
<b>Shared settings:</b> keys, offsets and volumes live in this site's localStorage, so all versions share them.
</div>
<footer>generated <time data-t="${esc(generatedAt)}">${esc(generatedAt)}</time> from <a href="https://github.com/${esc(repo)}">${esc(repo)}</a></footer>
</main>
<script>
const fmt = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });
const rel = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
function ago(d) {
  const s = (d.getTime() - Date.now()) / 1000;
  for (const [u, n] of [['day', 86400], ['hour', 3600], ['minute', 60]])
    if (Math.abs(s) >= n) return rel.format(Math.round(s / n), u);
  return 'just now';
}
for (const t of document.querySelectorAll('time[data-t]')) {
  const d = new Date(t.dataset.t);
  if (isNaN(d)) continue;
  t.textContent = ago(d);
  t.title = fmt.format(d);
}
</script>
</body>
</html>
`;
}

function readVersions(siteDir: string): VersionInfo[] {
  if (!existsSync(siteDir)) return [];
  return readdirSync(siteDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(join(siteDir, d.name, 'version.json')))
    .map(
      (d) => JSON.parse(readFileSync(join(siteDir, d.name, 'version.json'), 'utf8')) as VersionInfo,
    );
}

function writeSiteFiles(siteDir: string, versions: VersionInfo[], repo: string) {
  const now = new Date().toISOString();
  writeFileSync(join(siteDir, 'index.html'), renderIndex(versions, repo, now));
  writeFileSync(join(siteDir, 'versions.json'), JSON.stringify(versions, null, 2) + '\n');
  writeFileSync(join(siteDir, '.nojekyll'), '');
  writeFileSync(join(siteDir, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
}

/** Copies freshly built versions into the site, reconciles PR state, regenerates the index. */
export function update(siteDir: string, incomingDir: string, prs: PullRequest[], repo: string) {
  mkdirSync(siteDir, { recursive: true });
  if (existsSync(incomingDir)) {
    for (const d of readdirSync(incomingDir, { withFileTypes: true })) {
      if (!d.isDirectory() || !existsSync(join(incomingDir, d.name, 'version.json'))) continue;
      const v = JSON.parse(
        readFileSync(join(incomingDir, d.name, 'version.json'), 'utf8'),
      ) as VersionInfo;
      if (!/^(main|pr-\d+)$/.test(v.slot)) throw new Error(`bad slot "${v.slot}"`);
      rmSync(join(siteDir, v.slot), { recursive: true, force: true });
      cpSync(join(incomingDir, d.name), join(siteDir, v.slot), { recursive: true });
    }
  }
  const { keep, remove } = reconcile(readVersions(siteDir), prs);
  for (const slot of remove) rmSync(join(siteDir, slot), { recursive: true, force: true });
  for (const v of keep)
    writeFileSync(join(siteDir, v.slot, 'version.json'), JSON.stringify(v, null, 2) + '\n');
  writeSiteFiles(siteDir, keep, repo);
  return { keep: keep.map((v) => v.slot), remove };
}

function env(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (v === undefined) throw new Error(`missing env ${name}`);
  return v;
}

function readJson<T>(path: string | undefined, fallback: T): T {
  return path && existsSync(path) ? (JSON.parse(readFileSync(path, 'utf8')) as T) : fallback;
}

function main(argv: string[]) {
  const [cmd, ...args] = argv;
  if (cmd === 'plan') {
    const payload = readJson<{ action?: string; pull_request?: { number: number } }>(
      process.env.GITHUB_EVENT_PATH,
      {},
    );
    const event: HubEvent = {
      name: env('GITHUB_EVENT_NAME'),
      sha: env('GITHUB_SHA'),
      repo: env('GITHUB_REPOSITORY'),
      ...(payload.action ? { action: payload.action } : {}),
      ...(payload.pull_request ? { pr: payload.pull_request.number } : {}),
    };
    const targets = plan(
      event,
      readJson<PullRequest[]>(env('PRS_JSON'), []),
      readJson<VersionInfo[]>(env('DEPLOYED_JSON'), []),
    );
    process.stdout.write(JSON.stringify(targets));
  } else if (cmd === 'stamp') {
    const dir = args[0]!;
    const pr = env('HUB_PR', '');
    const v: VersionInfo = {
      slot: env('HUB_SLOT'),
      kind: env('HUB_KIND') === 'pr' ? 'pr' : 'main',
      status: 'live',
      ...(pr ? { pr: Number(pr) } : {}),
      title: env('HUB_TITLE'),
      ...(env('HUB_URL', '') ? { url: env('HUB_URL') } : {}),
      branch: env('HUB_BRANCH'),
      sha: env('HUB_SHA'),
      subject: env('HUB_SUBJECT', ''),
      builtAt: new Date().toISOString(),
      repo: env('GITHUB_REPOSITORY'),
      mappings: readJson<MappingInfo[]>(process.env.HUB_MAPPINGS_JSON, []),
    };
    writeFileSync(join(dir, 'version.json'), JSON.stringify(v, null, 2) + '\n');
  } else if (cmd === 'update') {
    const [siteDir, incomingDir, prsFile] = args;
    const res = update(
      siteDir!,
      incomingDir!,
      readJson<PullRequest[]>(prsFile, []),
      env('GITHUB_REPOSITORY'),
    );
    process.stdout.write(
      `kept ${res.keep.join(', ') || '-'}; removed ${res.remove.join(', ') || '-'}\n`,
    );
  } else if (cmd === 'preview') {
    const siteDir = args[0]!;
    writeFileSync(
      join(siteDir, 'index.html'),
      renderIndex(
        readVersions(siteDir),
        env('GITHUB_REPOSITORY', 'salnad/voxel-rhythm-game'),
        new Date().toISOString(),
      ),
    );
  } else {
    throw new Error(
      `usage: site.ts plan | stamp <dir> | update <site> <incoming> <prs.json> | preview <site>`,
    );
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  main(process.argv.slice(2));
