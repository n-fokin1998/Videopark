import { describe, expect, it } from 'vitest';
import { currentDeviceHints, isLowEndDevice, prefersReducedMotion } from './motion';

describe('isLowEndDevice', () => {
  it('flags small memory, few cores and data saving', () => {
    expect(isLowEndDevice({ deviceMemory: 2 })).toBe(true);
    expect(isLowEndDevice({ hardwareConcurrency: 2 })).toBe(true);
    expect(isLowEndDevice({ saveData: true })).toBe(true);
    expect(isLowEndDevice({ reducedData: true })).toBe(true);
    expect(isLowEndDevice({ deviceMemory: 8, hardwareConcurrency: 8 })).toBe(false);
    expect(isLowEndDevice({})).toBe(false);
  });
});

describe('SSR safety', () => {
  it('does not touch browser APIs outside the browser', () => {
    expect(prefersReducedMotion()).toBe(false);
    expect(currentDeviceHints()).toMatchObject({});
  });
});
