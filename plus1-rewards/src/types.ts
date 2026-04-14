export type FamilyOption = 'Single' | 'Couple' | 'Family';

export interface PlanFeature {
  label: string;
  value: string;
  isIncluded: boolean;
  isBetter?: boolean;
}

export interface Plan {
  id: string;
  name: string;
  tagline: string;
  prices: Record<FamilyOption, number>;
  features: Record<string, PlanFeature>;
}

export interface PlanCategory {
  id: string;
  label: string;
  plans: Plan[];
}
