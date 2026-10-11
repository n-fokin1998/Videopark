import { describe, expect, it } from 'vitest';
import { validateContent } from './validate-content';

describe('validate-content (real content)', () => {
  const findings = validateContent();

  it('finds no errors', () => {
    expect(findings.filter((f) => f.severity === 'error')).toEqual([]);
  });

  it('finds no warnings', () => {
    expect(findings.filter((f) => f.severity === 'warning')).toEqual([]);
  });
});
