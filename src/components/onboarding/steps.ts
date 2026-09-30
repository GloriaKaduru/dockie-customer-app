// Onboarding step order (PRD §10). Kept outside the client component so server pages can read it.
export const STEPS = ["signup", "verify-email", "verify-phone", "account-type", "business", "team", "walkthrough"] as const;
export type Step = (typeof STEPS)[number];
