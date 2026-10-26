import { mkdtempSync, mkdirSync, readFileSync, existsSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  plan,
  reconcile,
  renderIndex,
  update,
  type HubEvent,
  type PullRequest,
  type VersionInfo,
} from '../scripts/hub/site';

const REPO = 'salnad/voxel-rhythm-game';

function pr(n: number, over: Partial<PullRequest> = {}): PullRequest {
  return {
    number: n,
    title: `PR ${n}`,
    state: 'open',
    html_url: `https://github.com/${REPO}/pull/${n}`,
    merged_at: null,
    closed_at: null,
    head: { sha: `sha${n}`, ref: `branch-${n}`, repo: { full_name: REPO } },
    ...over,
  };
}

function version(slot: string, over: Partial<VersionInfo> = {}): VersionInfo {
  const n = slot.startsWith('pr-') ? Number(slot.slice(3)) : undefined;
  return {
    slot,
    kind: n === undefined ? 'main' : 'pr',
    status: 'live',
    ...(n === undefined ? {} : { pr: n }),
    title: slot,
    branch: slot,
    sha: n === undefined ? 'mainsha' : `sha${n}`,
    subject: '',
    builtAt: '2026-10-26T21:00:00.000Z',
    repo: REPO,
    mappings: [{ key: 'sword', label: 'SWORD SFX', description: 'Sword <sounds>' }],
    ...over,
  };
}

const ev = (over: Partial<HubEvent>): HubEvent => ({
  name: 'push',
  sha: 'new',
  repo: REPO,
  ...over,
});

describe('plan', () => {
  it('builds main on push, plus open PRs that are missing or stale', () => {
    const prs = [pr(3), pr(4), pr(5, { state: 'closed' })];
    const deployed = [version('pr-3'), version('pr-4', { sha: 'old' })];
    expect(plan(ev({}), prs, deployed).map((t) => t.slot)).toEqual(['main', 'pr-4']);
  });

  it('builds only the PR that changed', () => {
    const prs = [pr(3), pr(4)];
    const t = plan(ev({ name: 'pull_request', action: 'synchronize', pr: 4 }), prs, []);
    expect(t).toEqual([
      {
        slot: 'pr-4',
        kind: 'pr',
        ref: 'sha4',
        branch: 'branch-4',
        title: 'PR 4',
        url: `https://github.com/${REPO}/pull/4`,
        pr: '4',
      },
    ]);
  });

  it('builds nothing on close or title edits (deploy still reconciles)', () => {
    expect(plan(ev({ name: 'pull_request', action: 'closed', pr: 3 }), [pr(3)], [])).toEqual([]);
    expect(plan(ev({ name: 'pull_request', action: 'edited', pr: 3 }), [pr(3)], [])).toEqual([]);
  });

  it('skips fork PRs', () => {
    const fork = pr(6, { head: { sha: 's', ref: 'x', repo: { full_name: 'someone/fork' } } });
    expect(plan(ev({ name: 'workflow_dispatch' }), [fork, pr(7)], []).map((t) => t.slot)).toEqual([
      'main',
      'pr-7',
    ]);
  });
});

describe('reconcile', () => {
  it('keeps open PRs, archives merged ones, removes unmerged closed ones', () => {
    const prs = [
      pr(3, { title: 'renamed' }),
      pr(4, { state: 'closed', merged_at: '2026-10-26T22:00:00Z' }),
      pr(5, { state: 'closed' }),
    ];
    const res = reconcile(
      [version('main'), version('pr-3'), version('pr-4'), version('pr-5')],
      prs,
    );
    expect(res.remove).toEqual(['pr-5']);
    expect(res.keep.map((v) => [v.slot, v.status, v.title])).toEqual([
      ['main', 'live', 'main'],
      ['pr-3', 'live', 'renamed'],
      ['pr-4', 'archived', 'PR 4'],
    ]);
    expect(res.keep[2]!.closedAt).toBe('2026-10-26T22:00:00Z');
  });

  it('keeps only the newest archived builds', () => {
    const versions = [1, 2, 3].map((n) => version(`pr-${n}`));
    const prs = [1, 2, 3].map((n) =>
      pr(n, { state: 'closed', merged_at: `2026-10-2${n}T00:00:00Z` }),
    );
    const res = reconcile(versions, prs, 2);
    expect(res.keep.map((v) => v.slot)).toEqual(['pr-2', 'pr-3']);
    expect(res.remove).toEqual(['pr-1']);
  });
});

describe('renderIndex', () => {
  it('lists each section, links mappings, and escapes text', () => {
    const html = renderIndex(
      [
        version('main', { subject: 'Merge #2: <b> Co-authored-by: Someone <a@b.c>' }),
        version('pr-3', { title: 'Effects & "hybrid"', url: 'https://x/pull/3' }),
        version('pr-1', { status: 'archived', closedAt: '2026-10-26T00:00:00Z' }),
      ],
      REPO,
      '2026-10-26T21:30:00Z',
    );
    expect(html).toContain('href="pr-3/?mapping=sword"');
    expect(html).toContain('Effects &#38; &#34;hybrid&#34;');
    expect(html).toContain('Merge #2: &#60;b&#62;</span>');
    expect(html).toContain('title="Sword &#60;sounds&#62;"');
    expect(html.indexOf('pr-3/')).toBeLessThan(html.indexOf('RECENTLY MERGED'));
    expect(html.indexOf('href="pr-1/"')).toBeGreaterThan(html.indexOf('RECENTLY MERGED'));
  });
});

describe('update', () => {
  it('copies new builds in, drops closed PRs, and writes the index', () => {
    const root = mkdtempSync(join(tmpdir(), 'hub-'));
    const site = join(root, 'site');
    const incoming = join(root, 'incoming');
    const put = (dir: string, v: VersionInfo, file = 'index.html') => {
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, 'version.json'), JSON.stringify(v));
      writeFileSync(join(dir, file), v.sha);
    };
    put(join(site, 'main'), version('main', { sha: 'old' }), 'stale.js');
    put(join(site, 'pr-5'), version('pr-5'));
    put(join(incoming, 'hub-main'), version('main', { sha: 'fresh' }));

    const res = update(site, incoming, [pr(5, { state: 'closed' })], REPO);

    expect(res.remove).toEqual(['pr-5']);
    expect(existsSync(join(site, 'pr-5'))).toBe(false);
    expect(existsSync(join(site, 'main', 'stale.js'))).toBe(false);
    expect(readFileSync(join(site, 'main', 'index.html'), 'utf8')).toBe('fresh');
    expect(readFileSync(join(site, 'index.html'), 'utf8')).toContain('href="main/"');
    expect(existsSync(join(site, '.nojekyll'))).toBe(true);
    const listed = JSON.parse(readFileSync(join(site, 'versions.json'), 'utf8')) as VersionInfo[];
    expect(listed.map((v) => v.slot)).toEqual(['main']);
  });
});
