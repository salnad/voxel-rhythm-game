import { describe, expect, it } from 'vitest';
import { chooseMapping, urlWithMapping } from '../src/config/mappingChoice';
import { DEFAULT_MUSIC_MAPPING, MUSIC_MAPPINGS } from '../src/config/musicMapping';

const registry = { sword: 1, fx: 2 };

describe('chooseMapping', () => {
  it('uses a known ?mapping= over the saved choice', () => {
    expect(chooseMapping('fx', 'sword', registry, 'sword')).toEqual({ key: 'fx', unknown: null });
  });

  it('keeps the saved choice without a param', () => {
    expect(chooseMapping(null, 'fx', registry, 'sword')).toEqual({ key: 'fx', unknown: null });
    expect(chooseMapping('', 'fx', registry, 'sword')).toEqual({ key: 'fx', unknown: null });
  });

  it('reports an unknown param and falls back to the saved choice', () => {
    expect(chooseMapping('hybrid', 'fx', registry, 'sword')).toEqual({
      key: 'fx',
      unknown: 'hybrid',
    });
  });

  it('falls back to the default when the saved choice is from another version', () => {
    expect(chooseMapping(null, 'hybrid', registry, 'sword')).toEqual({
      key: 'sword',
      unknown: null,
    });
  });

  it('ignores inherited object keys', () => {
    expect(chooseMapping('toString', 'sword', registry, 'sword').key).toBe('sword');
  });

  it('accepts every registered mapping, and the default is registered', () => {
    expect(Object.hasOwn(MUSIC_MAPPINGS, DEFAULT_MUSIC_MAPPING)).toBe(true);
    for (const key of Object.keys(MUSIC_MAPPINGS))
      expect(
        chooseMapping(key, DEFAULT_MUSIC_MAPPING, MUSIC_MAPPINGS, DEFAULT_MUSIC_MAPPING).key,
      ).toBe(key);
  });
});

describe('urlWithMapping', () => {
  it('sets the param and keeps the others', () => {
    expect(urlWithMapping('https://x.test/pr-5/?autoplay=1', 'fx')).toBe(
      'https://x.test/pr-5/?autoplay=1&mapping=fx',
    );
    expect(urlWithMapping('https://x.test/main/?mapping=sword', 'fx')).toBe(
      'https://x.test/main/?mapping=fx',
    );
  });
});
