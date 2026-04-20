import { useState } from 'react';
import { useStore } from '../../state';

export default function Skills() {
  const { state, addSkill, removeSkill } = useStore();
  const [name, setName] = useState('');

  async function submit() {
    const err = await addSkill(name);
    if (err) alert(err);
    else setName('');
  }

  return (
    <>
      <h2>Skills</h2>
      <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 0 }}>
        The master list of skills. Platforms pick required skills from this
        list, and people pick skills they have from this list.
      </p>
      <div className="grid-2">
        <form
          className="card"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <h3>Add Skill</h3>
          <label>Skill name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. bike, right-to-work, english"
          />
          <button type="submit" className="primary">
            Add Skill
          </button>
        </form>
        <div className="card">
          <h3>Master Skills List</h3>
          {!state.skills.length ? (
            <div className="empty">No skills yet. Add some on the left.</div>
          ) : (
            state.skills.map((s) => {
              const pCount = state.people.filter((p) =>
                p.skills.includes(s)
              ).length;
              const jCount = state.platforms.filter((j) =>
                j.skills.includes(s)
              ).length;
              return (
                <div
                  key={s}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '10px 0',
                    borderBottom: '1px solid var(--border)'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <span className="chip skill">{s}</span>
                    <span
                      style={{
                        color: 'var(--muted)',
                        fontSize: 12,
                        marginLeft: 8
                      }}
                    >
                      {pCount} {pCount === 1 ? 'person' : 'people'} · {jCount}{' '}
                      platform{jCount === 1 ? '' : 's'}
                    </span>
                  </div>
                  <button
                    className="danger small"
                    onClick={() => removeSkill(s)}
                  >
                    Remove
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
