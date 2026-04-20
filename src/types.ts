export interface Person {
  id: string;
  name: string;
  skills: string[];
}

export interface Platform {
  id: string;
  name: string;
  role: string;
  variant: string;
  skills: string[];
  applicationNotes: string;
  generalNotes: string;
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

export interface Delivery {
  id: string;
  personId: string;
  platformId: string;
  date: string;
  restaurant: string;
  collection: string;
  notes: string;
  timePeriod: string;
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
