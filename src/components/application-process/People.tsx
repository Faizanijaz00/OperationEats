import { useState } from 'react';
import { useStore } from '../../state';
import ChipSelector from '../ChipSelector';

export default function People() {
  const { state, addPerson, updatePerson, removePerson } = useStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [skills, setSkills] = useState<string[]>([]);

  function reset() {
    setEditingId(null);
    setName('');
    setSkills([]);
  }
  function startEdit(id: string) {
    const p = state.people.find((x) => x.id === id);
    if (!p) return;
    setEditingId(id);
    setName(p.name);
    setSkills([...p.skills]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function submit() {
    if (!name.trim()) {
      alert('Name required.');
      return;
    }
    if (editingId) updatePerson(editingId, name.trim(), skills);
    else addPerson(name.trim(), skills);
    reset();
  }

  return (
    <>
      <h2>People</h2>
      <div className="grid-2">
        <form
          className="card"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <h3>{editingId ? 'Edit Person' : 'Add Person'}</h3>
          <label>Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Alex Chen"
          />
          <label>Skills (tap to toggle)</label>
          <ChipSelector selected={skills} onChange={setSkills} />
          <div className="row-flex">
            <button type="submit" className="primary">
              {editingId ? 'Save Changes' : 'Add Person'}
            </button>
            {editingId && (
              <button type="button" className="ghost" onClick={reset}>
                Cancel
              </button>
            )}
          </div>
        </form>
        <div className="card">
          <h3>Roster</h3>
          {!state.people.length ? (
            <div className="empty">No people yet. Add one on the left.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Skills</th>
                  <th>Apps</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {state.people.map((p) => {
                  const count = state.apps.filter(
                    (a) => a.personId === p.id
                  ).length;
                  return (
                    <tr key={p.id}>
                      <td>
                        <strong>{p.name}</strong>
                      </td>
                      <td>
                        {p.skills.length ? (
                          p.skills.map((s) => (
                            <span key={s} className="chip skill">
                              {s}
                            </span>
                          ))
                        ) : (
                          <span style={{ color: 'var(--muted)' }}>—</span>
                        )}
                      </td>
                      <td>{count}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <button
                          className="ghost small"
                          onClick={() => startEdit(p.id)}
                        >
                          Edit
                        </button>{' '}
                        <button
                          className="danger small"
                          onClick={() => removePerson(p.id)}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
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
