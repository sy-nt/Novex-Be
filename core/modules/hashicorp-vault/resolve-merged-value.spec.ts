import { resolveMergedValue } from './resolve-merged-value';

describe('resolveMergedValue', () => {
  const merged = {
    database: { username: 'db-user', password: null },
    api: { token: 'abc' },
  };

  it('returns a namespaced secret object by key', () => {
    expect(resolveMergedValue('database', merged)).toEqual({
      username: 'db-user',
      password: null,
    });
  });

  it('returns nested fields via dot notation', () => {
    expect(resolveMergedValue('database.username', merged)).toBe('db-user');
  });

  it('preserves explicit null values', () => {
    expect(resolveMergedValue('database.password', merged)).toBeNull();
  });

  it('returns fallback when key is missing', () => {
    expect(resolveMergedValue('missing', merged, 'default')).toBe('default');
  });
});
