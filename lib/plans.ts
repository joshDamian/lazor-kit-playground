export type Plan = {
  id: string;
  label: string;
  price: number;
  intervalDays: number;
};

export const PLANS: Plan[] = [
  { id: "basic", label: "Basic", price: 0.05, intervalDays: 30 },
  { id: "pro", label: "Pro", price: 10, intervalDays: 30 },
  { id: "annual", label: "Annual", price: 100, intervalDays: 365 },
];
