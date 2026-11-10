export type EntityStatus = 'draft' | 'active' | 'paused' | 'archived';

export type EffectiveState = 'draft' | 'scheduled' | 'active' | 'expired' | 'paused' | 'archived';

export const ENTITY_STATUSES: readonly EntityStatus[] = ['draft', 'active', 'paused', 'archived'];

export const EFFECTIVE_STATES: readonly EffectiveState[] = [
  'draft',
  'scheduled',
  'active',
  'expired',
  'paused',
  'archived',
];

export const TRANSITIONS: Readonly<Record<EntityStatus, readonly EntityStatus[]>> = {
  draft: ['active', 'archived'],
  active: ['paused', 'archived'],
  paused: ['active', 'draft', 'archived'],
  archived: ['draft'],
};

export class InvalidTransitionError extends Error {
  readonly from: EntityStatus;
  readonly to: EntityStatus;
  readonly allowed: readonly EntityStatus[];

  constructor(from: EntityStatus, to: EntityStatus) {
    super(`Cannot transition from '${from}' to '${to}'`);
    this.name = 'InvalidTransitionError';
    this.from = from;
    this.to = to;
    this.allowed = TRANSITIONS[from];
  }
}

export function canTransition(from: EntityStatus, to: EntityStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export function assertTransition(from: EntityStatus, to: EntityStatus): void {
  if (!canTransition(from, to)) {
    throw new InvalidTransitionError(from, to);
  }
}

export function effectiveState(
  status: EntityStatus,
  startDate: Date | null,
  endDate: Date | null,
  now: Date,
): EffectiveState {
  if (status !== 'active') {
    return status;
  }
  if (startDate && now < startDate) {
    return 'scheduled';
  }
  if (endDate && now > endDate) {
    return 'expired';
  }
  return 'active';
}

export function isActiveNow(status: EntityStatus, startDate: Date | null, endDate: Date | null, now: Date): boolean {
  return effectiveState(status, startDate, endDate, now) === 'active';
}

export function entityStateMachineDefinition() {
  return {
    statuses: ENTITY_STATUSES,
    effectiveStates: EFFECTIVE_STATES,
    transitions: TRANSITIONS,
    notes: {
      scheduled: "status 'active' but startDate is in the future",
      expired: "status 'active' but endDate is in the past",
      active: "status 'active' and within the date window — eligible for delivery",
    },
  };
}
