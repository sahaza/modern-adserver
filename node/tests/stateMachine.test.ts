import { describe, expect, it } from 'vitest';
import {
  InvalidTransitionError,
  TRANSITIONS,
  assertTransition,
  canTransition,
  effectiveState,
  entityStateMachineDefinition,
  isActiveNow,
} from '../src/domain/stateMachine.js';

const now = new Date('2026-01-15T12:00:00Z');

describe('entity state machine', () => {
  it('allows only declared transitions', () => {
    expect(canTransition('draft', 'active')).toBe(true);
    expect(canTransition('active', 'paused')).toBe(true);
    expect(canTransition('paused', 'active')).toBe(true);
    expect(canTransition('archived', 'draft')).toBe(true);
    expect(canTransition('draft', 'paused')).toBe(false);
    expect(canTransition('active', 'draft')).toBe(false);
    expect(canTransition('archived', 'active')).toBe(false);
    expect(canTransition('active', 'active')).toBe(false);
  });

  it('assertTransition throws InvalidTransitionError with allowed targets', () => {
    assertTransition('active', 'paused');
    try {
      assertTransition('archived', 'active');
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidTransitionError);
      expect((error as InvalidTransitionError).allowed).toEqual(['draft']);
    }
  });

  it('computes effective state from status + date window', () => {
    expect(effectiveState('draft', null, null, now)).toBe('draft');
    expect(effectiveState('paused', null, null, now)).toBe('paused');
    expect(effectiveState('archived', null, null, now)).toBe('archived');
    expect(effectiveState('active', null, null, now)).toBe('active');
    expect(effectiveState('active', new Date('2026-02-01T00:00:00Z'), null, now)).toBe('scheduled');
    expect(effectiveState('active', null, new Date('2026-01-10T00:00:00Z'), now)).toBe('expired');
    expect(effectiveState('active', new Date('2026-01-01T00:00:00Z'), new Date('2026-02-01T00:00:00Z'), now)).toBe('active');
  });

  it('isActiveNow mirrors eligibility semantics', () => {
    expect(isActiveNow('active', null, null, now)).toBe(true);
    expect(isActiveNow('active', new Date('2026-02-01T00:00:00Z'), null, now)).toBe(false);
    expect(isActiveNow('paused', null, null, now)).toBe(false);
  });

  it('exposes a machine-readable definition', () => {
    const def = entityStateMachineDefinition();
    expect(def.statuses).toEqual(['draft', 'active', 'paused', 'archived']);
    expect(def.transitions).toEqual(TRANSITIONS);
    expect(def.effectiveStates).toContain('scheduled');
    expect(def.effectiveStates).toContain('expired');
  });
});
