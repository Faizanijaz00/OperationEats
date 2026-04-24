import { useEffect, useState } from 'react';
import Overview from './components/application-process/Overview';
import People from './components/application-process/People';
import Platforms from './components/application-process/Platforms';
import Applications from './components/application-process/Applications';
import LogDelivery from './components/work-tracker/LogDelivery';
import Deliveries from './components/work-tracker/Deliveries';
import PlatformProcesses from './components/work-tracker/PlatformProcesses';
import { useStore } from './state';

type Mode = 'app' | 'work';
type AppTab = 'overview' | 'people' | 'platforms' | 'applications';
type WorkTab = 'log' | 'list' | 'processes';

const MODE_KEY = 'opeats.mode';
const APP_TAB_KEY = 'opeats.appTab';
const WORK_TAB_KEY = 'opeats.workTab';

function loadPersisted<T extends string>(
  key: string,
  valid: readonly T[],
  fallback: T
): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw && (valid as readonly string[]).includes(raw)) return raw as T;
  } catch {
    // localStorage unavailable
  }
  return fallback;
}

function usePersistedState<T extends string>(
  key: string,
  valid: readonly T[],
  fallback: T
): [T, (v: T) => void] {
  const [val, setVal] = useState<T>(() => loadPersisted(key, valid, fallback));
  useEffect(() => {
    try {
      localStorage.setItem(key, val);
    } catch {
      // ignore write failures (private mode, quota, etc.)
    }
  }, [key, val]);
  return [val, setVal];
}

const MODES: readonly Mode[] = ['app', 'work'];
const APP_TABS: readonly AppTab[] = [
  'overview',
  'people',
  'platforms',
  'applications'
];
const WORK_TABS: readonly WorkTab[] = ['log', 'list', 'processes'];

export default function App() {
  const { loading, error } = useStore();
  const [mode, setMode] = usePersistedState<Mode>(MODE_KEY, MODES, 'app');
  const [appTab, setAppTab] = usePersistedState<AppTab>(
    APP_TAB_KEY,
    APP_TABS,
    'overview'
  );
  const [workTab, setWorkTab] = usePersistedState<WorkTab>(
    WORK_TAB_KEY,
    WORK_TABS,
    'log'
  );
  const [editingDeliveryId, setEditingDeliveryId] = useState<string | null>(null);

  function goEditDelivery(id: string) {
    setEditingDeliveryId(id);
    setMode('work');
    setWorkTab('log');
  }

  return (
    <>
      <header>
        <h1>
          Operation <span>Eats</span>
        </h1>
        <span className="tag">Job Tracker</span>
        <div className="mode-toggle">
          <button
            className={mode === 'app' ? 'active' : ''}
            onClick={() => setMode('app')}
          >
            Application Process
          </button>
          <button
            className={mode === 'work' ? 'active' : ''}
            onClick={() => setMode('work')}
          >
            Work Tracker
          </button>
        </div>
      </header>

      {loading && (
        <div
          style={{
            padding: '8px 28px',
            color: 'var(--muted)',
            fontSize: 12,
            borderBottom: '1px solid var(--border)'
          }}
        >
          Loading from Supabase…
        </div>
      )}
      {error && (
        <div
          style={{
            padding: '10px 28px',
            background: 'rgba(248,113,113,0.1)',
            color: 'var(--bad)',
            fontSize: 13,
            borderBottom: '1px solid var(--border)'
          }}
        >
          Supabase error: {error}. Check .env.local and that the SQL schema has
          been run.
        </div>
      )}

      {mode === 'app' && (
        <div className="mode-view">
          <nav>
            <button
              className={appTab === 'overview' ? 'active' : ''}
              onClick={() => setAppTab('overview')}
            >
              Overview
            </button>
            <button
              className={appTab === 'people' ? 'active' : ''}
              onClick={() => setAppTab('people')}
            >
              People
            </button>
            <button
              className={appTab === 'platforms' ? 'active' : ''}
              onClick={() => setAppTab('platforms')}
            >
              Platforms
            </button>
            <button
              className={appTab === 'applications' ? 'active' : ''}
              onClick={() => setAppTab('applications')}
            >
              Applications
            </button>
          </nav>
          <main>
            {appTab === 'overview' && <Overview />}
            {appTab === 'people' && <People />}
            {appTab === 'platforms' && <Platforms />}
            {appTab === 'applications' && <Applications />}
          </main>
        </div>
      )}

      {mode === 'work' && (
        <div className="mode-view">
          <nav>
            <button
              className={workTab === 'log' ? 'active' : ''}
              onClick={() => setWorkTab('log')}
            >
              Log Delivery
            </button>
            <button
              className={workTab === 'list' ? 'active' : ''}
              onClick={() => setWorkTab('list')}
            >
              All Deliveries
            </button>
            <button
              className={workTab === 'processes' ? 'active' : ''}
              onClick={() => setWorkTab('processes')}
            >
              Platform Processes
            </button>
          </nav>
          <main>
            {workTab === 'log' && (
              <LogDelivery
                editingId={editingDeliveryId}
                onDoneEditing={() => setEditingDeliveryId(null)}
              />
            )}
            {workTab === 'list' && <Deliveries onEdit={goEditDelivery} />}
            {workTab === 'processes' && <PlatformProcesses />}
          </main>
        </div>
      )}
    </>
  );
}
