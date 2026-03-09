import { describe, expect, it } from 'vitest';

import { App } from './app';

describe('App', () => {
  it('should create a React element', () => {
    expect(App()).toBeTruthy();
  });
});