export enum SubscriptionPlan {
  TRIAL = 'trial',
  STARTER = 'starter',
  GROWTH = 'growth',
  PRO = 'pro',
  PRO_MAX = 'pro_max',
}

export enum SubscriptionStatus {
  TRIAL = 'trial',
  ACTIVE = 'active',
  GRACE_PERIOD = 'grace_period',
  EXPIRED = 'expired',
  SUSPENDED = 'suspended',
  CANCELLED = 'cancelled',
}

export enum BillingCycle {
  MONTHLY = 'monthly',
  ANNUAL = 'annual',
}

export const PLAN_LIMITS: Record<SubscriptionPlan, { maxStudents: number; maxTeachers: number }> = {
  [SubscriptionPlan.TRIAL]:   { maxStudents: 40,     maxTeachers: 3 },
  [SubscriptionPlan.STARTER]: { maxStudents: 50,     maxTeachers: 3 },
  [SubscriptionPlan.GROWTH]:  { maxStudents: 200,    maxTeachers: 10 },
  [SubscriptionPlan.PRO]:     { maxStudents: 9999,   maxTeachers: 999 },
  [SubscriptionPlan.PRO_MAX]: { maxStudents: 999999, maxTeachers: 999999 },
};

export const TRIAL_DURATION_DAYS = 7;
