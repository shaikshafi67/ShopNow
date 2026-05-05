import { describe, it, expect, beforeEach } from 'vitest';
import { read, write, remove, uid } from './storage';

// jsdom provides localStorage — reset between tests
beforeEach(() => {
  localStorage.clear();
});

describe('write() and read()', () => {
  it('round-trips a string value', () => {
    write('name', 'Alice');
    expect(read('name')).toBe('Alice');
  });

  it('round-trips an object', () => {
    write('user', { id: 1, role: 'admin' });
    expect(read('user')).toEqual({ id: 1, role: 'admin' });
  });

  it('round-trips an array', () => {
    write('cart', [1, 2, 3]);
    expect(read('cart')).toEqual([1, 2, 3]);
  });

  it('uses the shopnow: prefix so keys are namespaced', () => {
    write('x', 42);
    // The raw localStorage key must include the prefix
    expect(localStorage.getItem('shopnow:x')).toBe('42');
  });
});

describe('read()', () => {
  it('returns the fallback when the key does not exist', () => {
    expect(read('missing')).toBeNull();
    expect(read('missing', [])).toEqual([]);
  });

  it('returns the fallback when stored JSON is corrupt', () => {
    localStorage.setItem('shopnow:bad', '{not valid json');
    expect(read('bad', 'default')).toBe('default');
  });
});

describe('remove()', () => {
  it('deletes a stored key', () => {
    write('temp', 'value');
    remove('temp');
    expect(read('temp')).toBeNull();
  });

  it('does not throw when the key does not exist', () => {
    expect(() => remove('nonexistent')).not.toThrow();
  });
});

describe('uid()', () => {
  it('starts with the given prefix', () => {
    expect(uid('user')).toMatch(/^user_/);
  });

  it('uses "id" as the default prefix', () => {
    expect(uid()).toMatch(/^id_/);
  });

  it('generates unique values across 100 calls', () => {
    const ids = new Set(Array.from({ length: 100 }, () => uid('t')));
    expect(ids.size).toBe(100);
  });
});
