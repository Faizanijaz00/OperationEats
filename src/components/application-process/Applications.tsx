import { useState } from 'react';
import { useStore } from '../../state';
import { today } from '../../utils';
import { APP_STATUS_OPTIONS, platformLabel, type AppStatus } from '../../types';

export default function Applications() {
  const { state, upsertApplication, updateAppStatus, removeApp } = useStore();
  const [personId, setPersonId] = useState('');
  const [platformId, setPlatformId] = useState('');
  const [status, setStatus] = useState<AppStatus>('should_apply');
  const [date, setDate] = useState(today());

  function submit() {
    if (!personId || !platformId) {
      alert('Pick a person and a platform');
      return;
    }
    upsertApplication(personId, platformId, status, date || today());
  }

  const sorted = [...state.apps].sort((a, b) =>
    (b.date || '').localeCompare(a.date || '')
  );

  return (
    <>
      <h2>Applications</h2>
      <form
        className="card"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <h3>Log an Application</h3>
        <div className="row-flex">
          <select
            value={personId}
            onChange={(e) => setPersonId(e.target.value)}
          >
            <option value="">Select person…</option>
            {state.people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <select
            value={platformId}
            onChange={(e) => setPlatformId(e.target.value)}
          >
            <option value="">Select platform…</option>
            {state.platforms.map((j) => (
              <option key={j.id} value={j.id}>
                {platformLabel(j)}
                {j.role ? ` (${j.role})` : ''}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as AppStatus)}
          >
            {APP_STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{ maxWidth: 170 }}
          />
          <button type="submit" className="primary">
            Log
          </button>
        </div>
      </form>
      <div className="card">
        <h3>All Applications</h3>
        {!state.apps.length ? (
          <div className="empty">No applications logged yet.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Person</th>
                <th>Platform</th>
                <th>Skills check</th>
                <th>Date</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((a) => {
                const p = state.people.find((x) => x.id === a.personId);
                const j = state.platforms.find((x) => x.id === a.platformId);
                if (!p || !j) return null;
                const missing = j.skills.filter(
                  (s) => !p.skills.includes(s)
                );
                return (
                  <tr key={a.id}>
                    <td>
                      <strong>{p.name}</strong>
                    </td>
                    <td>
                      {platformLabel(j)}
                      {j.role && (
                        <span style={{ color: 'var(--muted)' }}>
                          {' '}
                          ({j.role})
                        </span>
                      )}
                    </td>
                    <td>
                      {missing.length ? (
                        <span style={{ color: 'var(--warn)' }}>
                          Missing: {missing.join(', ')}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--good)' }}>All met</span>
                      )}
                    </td>
                    <td>{a.date}</td>
                    <td>
                      <select
                        value={a.status}
                        onChange={(e) =>
                          updateAppStatus(a.id, e.target.value as AppStatus)
                        }
                        style={{
                          margin: 0,
                          padding: '4px 8px',
                          fontSize: 12,
                          maxWidth: 150
                        }}
                      >
                        {APP_STATUS_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <button
                        className="danger small"
                        onClick={() => removeApp(a.id)}
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
