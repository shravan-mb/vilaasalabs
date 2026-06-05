export enum SubscriptionPlan {
  TRIAL = 'trial',
  STARTER = 'starter',
  GROWTH = 'growth',
  PRO = 'pro',
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
  [SubscriptionPlan.TRIAL]:   { maxStudents: 100,  maxTeachers: 5 },
  [SubscriptionPlan.STARTER]: { maxStudents: 300,  maxTeachers: 10 },
  [SubscriptionPlan.GROWTH]:  { maxStudents: 1000, maxTeachers: 50 },
  [SubscriptionPlan.PRO]:     { maxStudents: 9999, maxTeachers: 999 },
};

export const TRIAL_DURATION_DAYS = 7;
