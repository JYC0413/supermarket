import { describe, it, expect, beforeEach } from 'vitest';
import { PatienceMeter } from '../src/logic/PatienceMeter';

describe('PatienceMeter', () => {
  let meter: PatienceMeter;

  beforeEach(() => { meter = new PatienceMeter(); });

  it('starts at 100', () => {
    expect(meter.value).toBe(100);
  });

  it('drains slowly in reading phase', () => {
    meter.setPhase('reading');
    meter.tick(4); // 4 seconds = -1%
    expect(meter.value).toBeCloseTo(99, 0);
  });

  it('drains faster in answering phase', () => {
    meter.setPhase('answering');
    meter.tick(2); // 2 seconds = -1%
    expect(meter.value).toBeCloseTo(99, 0);
  });

  it('drains fastest in overtime phase', () => {
    meter.setPhase('answering_overtime');
    meter.tick(2); // 2 seconds = -3%
    expect(meter.value).toBeCloseTo(97, 0);
  });

  it('applies progressive wrong-answer deductions', () => {
    meter.onWrongAnswer(1);
    expect(meter.value).toBeCloseTo(85, 0);
    meter.onWrongAnswer(2);
    expect(meter.value).toBeCloseTo(60, 0);
    meter.onWrongAnswer(3);
    expect(meter.value).toBeCloseTo(25, 0);
  });

  it('clamps to 0, never negative', () => {
    meter.onWrongAnswer(1);
    meter.onWrongAnswer(2);
    meter.onWrongAnswer(3);
    meter.tick(1000);
    expect(meter.value).toBe(0);
  });

  it('isDepleted when value reaches 0', () => {
    meter.onWrongAnswer(1);
    meter.onWrongAnswer(2);
    meter.onWrongAnswer(3);
    meter.tick(200);
    expect(meter.isDepleted).toBe(true);
  });

  it('reset restores to 100', () => {
    meter.onWrongAnswer(1);
    meter.reset();
    expect(meter.value).toBe(100);
    expect(meter.isDepleted).toBe(false);
  });
});
