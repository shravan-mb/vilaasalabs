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
  [SubscriptionPlan.TRIAL]:   { maxStudents: 50,     maxTeachers: 3      },
  [SubscriptionPlan.STARTER]: { maxStudents: 150,    maxTeachers: 5      },
  [SubscriptionPlan.GROWTH]:  { maxStudents: 500,    maxTeachers: 15     },
  [SubscriptionPlan.PRO]:     { maxStudents: 1500,   maxTeachers: 50     },
  [SubscriptionPlan.PRO_MAX]: { maxStudents: 5000,   maxTeachers: 200    },
};

export const TRIAL_DURATION_DAYS = 30;
