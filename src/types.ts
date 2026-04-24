export interface Person {
  id: string;
  name: string;
  skills: string[];
}

export type VehicleSource = '' | 'own' | 'company';

export const PLATFORM_VARIANTS = ['Car', 'Van', 'Motorbike', 'Cycle'] as const;

export interface ProcessStep {
  id: string;
  title: string;
  description: string;
  parentId: string | null;
  loopbackTo: string | null;
}

export interface Platform {
  id: string;
  name: string;
  variant: string;
  vehicleSource: VehicleSource;
  skills: string[];
  applicationNotes: string;
  generalNotes: string;
  processSteps: ProcessStep[];
}

export function platformLabel(p: Platform): string {
  const parts: string[] = [p.name];
  if (p.variant) parts.push(p.variant);
  return parts.join(' — ');
}

export type AppStatus =
  | 'should_apply'
  | 'applying'
  | 'applied'
  | 'background_check'
  | 'accepted'
  | 'rejected';

export const APP_STATUS_OPTIONS: { value: AppStatus; label: string }[] = [
  { value: 'should_apply', label: 'Should apply' },
  { value: 'applying', label: 'Applying' },
  { value: 'applied', label: 'Applied' },
  { value: 'background_check', label: 'Background check' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' }
];

export interface Application {
  id: string;
  personId: string;
  platformId: string;
  status: AppStatus;
  date: string;
}

export const HANDOVER_METHODS = [
  'Handed to customer',
  'Left at door',
  'Left at reception / concierge',
  'Left in mailroom',
  'Left in safe place',
  'Met outside',
  'Other'
] as const;

export const COLLECTION_METHODS = [
  'Order not verified',
  'Order verified via order number',
  'Order verified via order name',
  'Order verified via showing order on phone',
  'Driver pick-up confirmation not verified',
  'Driver pick-up confirmation verified via notification sound'
] as const;

export interface Delivery {
  id: string;
  personId: string | null;
  accountOwnerId: string | null;
  platformId: string | null;
  date: string;
  restaurant: string;
  collection: string;
  handover: string;
  notes: string;
  startTime: string;
  endTime: string;
  busyness: string;
  area: string;
}

export interface State {
  skills: string[];
  people: Person[];
  platforms: Platform[];
  apps: Application[];
  deliveries: Delivery[];
}
