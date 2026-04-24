import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type {
  State,
  AppStatus,
  Delivery,
  Person,
  Platform,
  ProcessStep,
  Application,
  VehicleSource
} from './types';
import { supabase } from './supabase';
import { uid } from './utils';

// ============================================================
// Row mappers — DB snake_case <-> app camelCase
// ============================================================

interface PersonRow { id: string; name: string; skills: string[] | null; }
interface PlatformRow {
  id: string;
  name: string;
  variant: string | null;
  vehicle_source: string | null;
  skills: string[] | null;
  application_notes: string | null;
  general_notes: string | null;
  process_steps: ProcessStep[] | null;
}
interface ApplicationRow {
  id: string; person_id: string; platform_id: string; status: string; date: string;
}
interface DeliveryRow {
  id: string;
  person_id: string | null;
  account_owner_id: string | null;
  platform_id: string | null;
  date: string;
  restaurant: string;
  collection: string;
  handover: string | null;
  notes: string;
  start_time: string | null;
  end_time: string | null;
  busyness: string;
  area: string;
}
interface SkillRow { name: string; }

function mapPerson(r: PersonRow): Person {
  return { id: r.id, name: r.name, skills: r.skills ?? [] };
}
function mapPlatform(r: PlatformRow): Platform {
  const vs = (r.vehicle_source ?? '') as VehicleSource;
  const rawSteps = Array.isArray(r.process_steps) ? r.process_steps : [];
  const valid = rawSteps.filter(
    (s): s is ProcessStep =>
      !!s && typeof s === 'object' && typeof (s as ProcessStep).id === 'string'
  );
  // Legacy format had no parentId — interpret old data as a linear chain.
  const hasAnyParent = valid.some((s) => 'parentId' in s);
  const processSteps: ProcessStep[] = valid.map((s, i) => {
    const rawParent = (s as { parentId?: unknown }).parentId;
    const parentId = hasAnyParent
      ? typeof rawParent === 'string'
        ? rawParent
        : null
      : i === 0
        ? null
        : valid[i - 1].id;
    return {
      id: s.id,
      title: typeof s.title === 'string' ? s.title : '',
      description: typeof s.description === 'string' ? s.description : '',
      parentId
    };
  });
  return {
    id: r.id,
    name: r.name,
    variant: r.variant ?? '',
    vehicleSource: vs === 'own' || vs === 'company' ? vs : '',
    skills: r.skills ?? [],
    applicationNotes: r.application_notes ?? '',
    generalNotes: r.general_notes ?? '',
    processSteps
  };
}
function mapApplication(r: ApplicationRow): Application {
  return {
    id: r.id,
    personId: r.person_id,
    platformId: r.platform_id,
    status: (r.status as AppStatus) || 'applied',
    date: r.date || ''
  };
}
function mapDelivery(r: DeliveryRow): Delivery {
  return {
    id: r.id,
    personId: r.person_id ?? null,
    accountOwnerId: r.account_owner_id ?? null,
    platformId: r.platform_id ?? null,
    date: r.date || '',
    restaurant: r.restaurant || '',
    collection: r.collection || '',
    handover: r.handover || '',
    notes: r.notes || '',
    startTime: r.start_time || '',
    endTime: r.end_time || '',
    busyness: r.busyness || '',
    area: r.area || ''
  };
}

function logErr(where: string, error: unknown) {
  // eslint-disable-next-line no-console
  console.error(`[supabase:${where}]`, error);
}

// ============================================================
// Store
// ============================================================

interface StoreAPI {
  state: State;
  loading: boolean;
  error: string | null;
  addSkill: (name: string) => Promise<string | null>;
  removeSkill: (name: string) => Promise<void>;
  addPerson: (name: string, skills: string[]) => Promise<void>;
  updatePerson: (id: string, name: string, skills: string[]) => Promise<void>;
  removePerson: (id: string) => Promise<void>;
  addPlatform: (p: Omit<Platform, 'id'>) => Promise<void>;
  updatePlatform: (id: string, p: Omit<Platform, 'id'>) => Promise<void>;
  updatePlatformProcess: (id: string, steps: ProcessStep[]) => Promise<void>;
  removePlatform: (id: string) => Promise<void>;
  upsertApplication: (
    personId: string,
    platformId: string,
    status: AppStatus,
    date: string
  ) => Promise<void>;
  updateAppStatus: (id: string, status: AppStatus) => Promise<void>;
  removeApp: (id: string) => Promise<void>;
  addDelivery: (d: Omit<Delivery, 'id'>) => Promise<string | null>;
  updateDelivery: (id: string, d: Omit<Delivery, 'id'>) => Promise<string | null>;
  removeDelivery: (id: string) => Promise<void>;
}

const Ctx = createContext<StoreAPI | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>({
    skills: [],
    people: [],
    platforms: [],
    apps: [],
    deliveries: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ---------- Initial fetch ----------
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [skillsRes, peopleRes, platformsRes, appsRes, deliveriesRes] =
          await Promise.all([
            supabase.from('skills').select('*').order('name'),
            supabase.from('people').select('*').order('name'),
            supabase.from('platforms').select('*').order('name'),
            supabase.from('applications').select('*'),
            supabase.from('deliveries').select('*')
          ]);
        if (cancelled) return;

        const firstErr =
          skillsRes.error ||
          peopleRes.error ||
          platformsRes.error ||
          appsRes.error ||
          deliveriesRes.error;
        if (firstErr) {
          setError(firstErr.message);
          setLoading(false);
          return;
        }

        setState({
          skills: (skillsRes.data as SkillRow[] | null)?.map((r) => r.name) ?? [],
          people: (peopleRes.data as PersonRow[] | null)?.map(mapPerson) ?? [],
          platforms:
            (platformsRes.data as PlatformRow[] | null)?.map(mapPlatform) ?? [],
          apps:
            (appsRes.data as ApplicationRow[] | null)?.map(mapApplication) ?? [],
          deliveries:
            (deliveriesRes.data as DeliveryRow[] | null)?.map(mapDelivery) ?? []
        });
        setLoading(false);
      } catch (e) {
        if (!cancelled) {
          setError(String(e));
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ---------- Mutators (optimistic update, fire DB write) ----------

  const api: StoreAPI = {
    state,
    loading,
    error,

    async addSkill(name) {
      const s = name.trim().toLowerCase();
      if (!s) return 'Skill name required';
      if (state.skills.includes(s)) return 'Skill already exists';
      setState((prev) =>
        prev.skills.includes(s)
          ? prev
          : { ...prev, skills: [...prev.skills, s].sort() }
      );
      const { error } = await supabase.from('skills').insert({ name: s });
      if (error) {
        logErr('addSkill', error);
        setState((prev) => ({
          ...prev,
          skills: prev.skills.filter((x) => x !== s)
        }));
        return error.message;
      }
      return null;
    },

    async removeSkill(name) {
      const affectedPeople = state.people.filter((p) =>
        p.skills.includes(name)
      );
      const affectedPlatforms = state.platforms.filter((j) =>
        j.skills.includes(name)
      );
      setState((prev) => ({
        ...prev,
        skills: prev.skills.filter((s) => s !== name),
        people: prev.people.map((p) => ({
          ...p,
          skills: p.skills.filter((s) => s !== name)
        })),
        platforms: prev.platforms.map((j) => ({
          ...j,
          skills: j.skills.filter((s) => s !== name)
        }))
      }));
      const [skillErr, ...rest] = await Promise.all([
        supabase.from('skills').delete().eq('name', name),
        ...affectedPeople.map((p) =>
          supabase
            .from('people')
            .update({ skills: p.skills.filter((s) => s !== name) })
            .eq('id', p.id)
        ),
        ...affectedPlatforms.map((j) =>
          supabase
            .from('platforms')
            .update({ skills: j.skills.filter((s) => s !== name) })
            .eq('id', j.id)
        )
      ]);
      if (skillErr.error) logErr('removeSkill', skillErr.error);
      rest.forEach((r) => r.error && logErr('removeSkill:cascade', r.error));
    },

    async addPerson(name, skills) {
      const id = uid();
      setState((prev) => ({
        ...prev,
        people: [...prev.people, { id, name, skills }]
      }));
      const { error } = await supabase
        .from('people')
        .insert({ id, name, skills });
      if (error) logErr('addPerson', error);
    },

    async updatePerson(id, name, skills) {
      setState((prev) => ({
        ...prev,
        people: prev.people.map((p) => (p.id === id ? { ...p, name, skills } : p))
      }));
      const { error } = await supabase
        .from('people')
        .update({ name, skills })
        .eq('id', id);
      if (error) logErr('updatePerson', error);
    },

    async removePerson(id) {
      setState((prev) => ({
        ...prev,
        people: prev.people.filter((p) => p.id !== id),
        apps: prev.apps.filter((a) => a.personId !== id),
        deliveries: prev.deliveries.filter((w) => w.personId !== id)
      }));
      // Cascading FKs in the DB will drop dependent rows automatically
      const { error } = await supabase.from('people').delete().eq('id', id);
      if (error) logErr('removePerson', error);
    },

    async addPlatform(p) {
      const id = uid();
      setState((prev) => ({
        ...prev,
        platforms: [...prev.platforms, { id, ...p }]
      }));
      const { error } = await supabase.from('platforms').insert({
        id,
        name: p.name,
        variant: p.variant,
        vehicle_source: p.vehicleSource,
        skills: p.skills,
        application_notes: p.applicationNotes,
        general_notes: p.generalNotes,
        process_steps: p.processSteps
      });
      if (error) logErr('addPlatform', error);
    },

    async updatePlatform(id, p) {
      setState((prev) => ({
        ...prev,
        platforms: prev.platforms.map((j) => (j.id === id ? { id, ...p } : j))
      }));
      const { error } = await supabase
        .from('platforms')
        .update({
          name: p.name,
          variant: p.variant,
          vehicle_source: p.vehicleSource,
          skills: p.skills,
          application_notes: p.applicationNotes,
          general_notes: p.generalNotes,
          process_steps: p.processSteps
        })
        .eq('id', id);
      if (error) logErr('updatePlatform', error);
    },

    async updatePlatformProcess(id, steps) {
      setState((prev) => ({
        ...prev,
        platforms: prev.platforms.map((j) =>
          j.id === id ? { ...j, processSteps: steps } : j
        )
      }));
      const { error } = await supabase
        .from('platforms')
        .update({ process_steps: steps })
        .eq('id', id);
      if (error) logErr('updatePlatformProcess', error);
    },

    async removePlatform(id) {
      setState((prev) => ({
        ...prev,
        platforms: prev.platforms.filter((j) => j.id !== id),
        apps: prev.apps.filter((a) => a.platformId !== id),
        deliveries: prev.deliveries.filter((w) => w.platformId !== id)
      }));
      const { error } = await supabase.from('platforms').delete().eq('id', id);
      if (error) logErr('removePlatform', error);
    },

    async upsertApplication(personId, platformId, status, date) {
      const existing = state.apps.find(
        (a) => a.personId === personId && a.platformId === platformId
      );
      if (existing) {
        setState((prev) => ({
          ...prev,
          apps: prev.apps.map((a) =>
            a.id === existing.id ? { ...a, status, date } : a
          )
        }));
        const { error } = await supabase
          .from('applications')
          .update({ status, date })
          .eq('id', existing.id);
        if (error) logErr('upsertApplication:update', error);
      } else {
        const id = uid();
        setState((prev) => ({
          ...prev,
          apps: [...prev.apps, { id, personId, platformId, status, date }]
        }));
        const { error } = await supabase.from('applications').insert({
          id,
          person_id: personId,
          platform_id: platformId,
          status,
          date
        });
        if (error) logErr('upsertApplication:insert', error);
      }
    },

    async updateAppStatus(id, status) {
      setState((prev) => ({
        ...prev,
        apps: prev.apps.map((a) => (a.id === id ? { ...a, status } : a))
      }));
      const { error } = await supabase
        .from('applications')
        .update({ status })
        .eq('id', id);
      if (error) logErr('updateAppStatus', error);
    },

    async removeApp(id) {
      setState((prev) => ({
        ...prev,
        apps: prev.apps.filter((a) => a.id !== id)
      }));
      const { error } = await supabase
        .from('applications')
        .delete()
        .eq('id', id);
      if (error) logErr('removeApp', error);
    },

    async addDelivery(d) {
      const id = uid();
      setState((prev) => ({
        ...prev,
        deliveries: [...prev.deliveries, { id, ...d }]
      }));
      const { error } = await supabase.from('deliveries').insert({
        id,
        person_id: d.personId,
        account_owner_id: d.accountOwnerId,
        platform_id: d.platformId,
        date: d.date,
        restaurant: d.restaurant,
        collection: d.collection,
        handover: d.handover,
        notes: d.notes,
        start_time: d.startTime,
        end_time: d.endTime,
        busyness: d.busyness,
        area: d.area
      });
      if (error) {
        logErr('addDelivery', error);
        setState((prev) => ({
          ...prev,
          deliveries: prev.deliveries.filter((w) => w.id !== id)
        }));
        return error.message;
      }
      return null;
    },

    async updateDelivery(id, d) {
      setState((prev) => ({
        ...prev,
        deliveries: prev.deliveries.map((w) => (w.id === id ? { id, ...d } : w))
      }));
      const { error } = await supabase
        .from('deliveries')
        .update({
          person_id: d.personId,
          account_owner_id: d.accountOwnerId,
          platform_id: d.platformId,
          date: d.date,
          restaurant: d.restaurant,
          collection: d.collection,
          handover: d.handover,
          notes: d.notes,
          start_time: d.startTime,
          end_time: d.endTime,
          busyness: d.busyness,
          area: d.area
        })
        .eq('id', id);
      if (error) {
        logErr('updateDelivery', error);
        return error.message;
      }
      return null;
    },

    async removeDelivery(id) {
      setState((prev) => ({
        ...prev,
        deliveries: prev.deliveries.filter((w) => w.id !== id)
      }));
      const { error } = await supabase.from('deliveries').delete().eq('id', id);
      if (error) logErr('removeDelivery', error);
    }
  };

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useStore(): StoreAPI {
  const c = useContext(Ctx);
  if (!c) throw new Error('useStore must be used within StoreProvider');
  return c;
}
