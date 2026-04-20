import { Fragment, useState } from 'react';
import { useStore } from '../../state';
import ChipSelector from '../ChipSelector';
import { PLATFORM_VARIANTS, type VehicleSource } from '../../types';

export default function Platforms() {
  const { state, addPlatform, updatePlatform, removePlatform } = useStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [variant, setVariant] = useState('');
  const [vehicleSource, setVehicleSource] = useState<VehicleSource>('');
  const [skills, setSkills] = useState<string[]>([]);
  const [applicationNotes, setApplicationNotes] = useState('');
  const [generalNotes, setGeneralNotes] = useState('');

  function reset() {
    setEditingId(null);
    setName('');
    setVariant('');
    setVehicleSource('');
    setSkills([]);
    setApplicationNotes('');
    setGeneralNotes('');
  }
  function startEdit(id: string) {
    const j = state.platforms.find((x) => x.id === id);
    if (!j) return;
    setEditingId(id);
    setName(j.name);
    setVariant(j.variant);
    setVehicleSource(j.vehicleSource);
    setSkills([...j.skills]);
    setApplicationNotes(j.applicationNotes);
    setGeneralNotes(j.generalNotes);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function submit() {
    if (!name.trim()) {
      alert('Platform name required.');
      return;
    }
    const payload = {
      name: name.trim(),
      variant: variant.trim(),
      vehicleSource,
      skills,
      applicationNotes: applicationNotes.trim(),
      generalNotes: generalNotes.trim()
    };
    if (editingId) updatePlatform(editingId, payload);
    else addPlatform(payload);
    reset();
  }

  return (
    <>
      <h2>Platforms</h2>
      <div className="grid-2">
        <form
          className="card"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <h3>{editingId ? 'Edit Platform' : 'Add Platform'}</h3>
          <label>Platform name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Uber Eats"
          />
          <label>Variant</label>
          <select value={variant} onChange={(e) => setVariant(e.target.value)}>
            <option value="">—</option>
            {PLATFORM_VARIANTS.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
          <label>Vehicle</label>
          <div className="toggle-group">
            <button
              type="button"
              className={vehicleSource === 'own' ? 'active' : ''}
              onClick={() =>
                setVehicleSource(vehicleSource === 'own' ? '' : 'own')
              }
            >
              Use own vehicle
            </button>
            <button
              type="button"
              className={vehicleSource === 'company' ? 'active' : ''}
              onClick={() =>
                setVehicleSource(vehicleSource === 'company' ? '' : 'company')
              }
            >
              Use company vehicle
            </button>
          </div>
          <label>Required skills (tap to toggle)</label>
          <ChipSelector selected={skills} onChange={setSkills} />
          <label>Application process notes</label>
          <textarea
            value={applicationNotes}
            onChange={(e) => setApplicationNotes(e.target.value)}
            placeholder="How the application works — forms, interviews, waiting times, gotchas…"
          />
          <label>General notes</label>
          <textarea
            value={generalNotes}
            onChange={(e) => setGeneralNotes(e.target.value)}
            placeholder="Anything else worth knowing about this platform — pay, shifts, support, reputation…"
          />
          <div className="row-flex">
            <button type="submit" className="primary">
              {editingId ? 'Save Changes' : 'Add Platform'}
            </button>
            {editingId && (
              <button type="button" className="ghost" onClick={reset}>
                Cancel
              </button>
            )}
          </div>
        </form>
        <div className="card">
          <h3>Platforms</h3>
          {!state.platforms.length ? (
            <div className="empty">No platforms yet. Add one on the left.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Platform</th>
                  <th>Variant</th>
                  <th>Vehicle</th>
                  <th>Required skills</th>
                  <th>Apps</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {[...state.platforms]
                  .sort((a, b) =>
                    a.name === b.name
                      ? a.variant.localeCompare(b.variant)
                      : a.name.localeCompare(b.name)
                  )
                  .map((j) => {
                  const count = state.apps.filter(
                    (a) => a.platformId === j.id
                  ).length;
                  const hasNotes = j.applicationNotes || j.generalNotes;
                  return (
                    <Fragment key={j.id}>
                      <tr>
                        <td>
                          <strong>{j.name}</strong>
                        </td>
                        <td>
                          {j.variant ? (
                            <span className="chip">{j.variant}</span>
                          ) : (
                            <span style={{ color: 'var(--muted)' }}>—</span>
                          )}
                        </td>
                        <td>
                          {j.vehicleSource === 'own' ? (
                            <span className="chip">Own</span>
                          ) : j.vehicleSource === 'company' ? (
                            <span className="chip">Company</span>
                          ) : (
                            <span style={{ color: 'var(--muted)' }}>—</span>
                          )}
                        </td>
                        <td>
                          {j.skills.length ? (
                            j.skills.map((s) => (
                              <span key={s} className="chip skill">
                                {s}
                              </span>
                            ))
                          ) : (
                            <span style={{ color: 'var(--muted)' }}>none</span>
                          )}
                        </td>
                        <td>{count}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <button
                            className="ghost small"
                            onClick={() => startEdit(j.id)}
                          >
                            Edit
                          </button>{' '}
                          <button
                            className="danger small"
                            onClick={() => removePlatform(j.id)}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                      {hasNotes && (
                        <tr>
                          <td
                            colSpan={6}
                            style={{
                              background: 'var(--panel-2)',
                              paddingTop: 10,
                              paddingBottom: 14,
                              borderBottom: '1px solid var(--border)'
                            }}
                          >
                            {j.applicationNotes && (
                              <div style={{ marginBottom: 8 }}>
                                <div
                                  style={{
                                    fontSize: 10,
                                    color: 'var(--muted)',
                                    textTransform: 'uppercase',
                                    letterSpacing: 0.5,
                                    marginBottom: 2
                                  }}
                                >
                                  Application process
                                </div>
                                <div
                                  style={{
                                    fontSize: 13,
                                    whiteSpace: 'pre-wrap'
                                  }}
                                >
                                  {j.applicationNotes}
                                </div>
                              </div>
                            )}
                            {j.generalNotes && (
                              <div>
                                <div
                                  style={{
                                    fontSize: 10,
                                    color: 'var(--muted)',
                                    textTransform: 'uppercase',
                                    letterSpacing: 0.5,
                                    marginBottom: 2
                                  }}
                                >
                                  General notes
                                </div>
                                <div
                                  style={{
                                    fontSize: 13,
                                    whiteSpace: 'pre-wrap'
                                  }}
                                >
                                  {j.generalNotes}
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
