import { useStore } from '../../state';
import type { AppStatus } from '../../types';

const SYMBOL: Record<AppStatus, string> = {
  should_apply: '○',
  applying: '◐',
  applied: '●',
  background_check: '◉',
  accepted: '✓',
  rejected: '✕'
};

export default function Overview() {
  const { state } = useStore();
  const totalApps = state.apps.length;
  const shouldApply = state.apps.filter((a) => a.status === 'should_apply').length;
  const applying = state.apps.filter((a) => a.status === 'applying').length;
  const applied = state.apps.filter((a) => a.status === 'applied').length;
  const backgroundCheck = state.apps.filter((a) => a.status === 'background_check').length;
  const accepted = state.apps.filter((a) => a.status === 'accepted').length;
  const rejected = state.apps.filter((a) => a.status === 'rejected').length;
  const uncovered = state.platforms.filter(
    (j) => !state.apps.some((a) => a.platformId === j.id)
  );
  const nameOf = (id: string) =>
    state.people.find((p) => p.id === id)?.name ?? '(removed)';

  return (
    <>
      <h2>Overview</h2>

      <div className="stat-grid">
        <div className="stat">
          <div className="num">{state.people.length}</div>
          <div className="lbl">People</div>
        </div>
        <div className="stat">
          <div className="num">{state.platforms.length}</div>
          <div className="lbl">Platforms</div>
        </div>
      </div>
      <div className="stat-grid">
        <div className="stat">
          <div className="num">{totalApps}</div>
          <div className="lbl">Applications</div>
        </div>
        <div className="stat">
          <div className="num" style={{ color: 'var(--muted)' }}>
            {shouldApply}
          </div>
          <div className="lbl">Should apply</div>
        </div>
        <div className="stat">
          <div className="num" style={{ color: 'var(--accent-2)' }}>
            {applying}
          </div>
          <div className="lbl">Applying</div>
        </div>
        <div className="stat">
          <div className="num" style={{ color: 'var(--warn)' }}>
            {applied}
          </div>
          <div className="lbl">Awaiting reply</div>
        </div>
        <div className="stat">
          <div className="num" style={{ color: 'var(--violet)' }}>
            {backgroundCheck}
          </div>
          <div className="lbl">Background check</div>
        </div>
        <div className="stat">
          <div className="num" style={{ color: 'var(--good)' }}>
            {accepted}
          </div>
          <div className="lbl">Accepted</div>
        </div>
        <div className="stat">
          <div className="num" style={{ color: 'var(--bad)' }}>
            {rejected}
          </div>
          <div className="lbl">Rejected</div>
        </div>
      </div>

      <div className="card">
        <h3>Application Matrix — Who applied, who got accepted</h3>
        <div className="matrix">
          {!state.people.length || !state.platforms.length ? (
            <div className="empty">
              Add at least one person and one platform to see the matrix.
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Person</th>
                  {state.platforms.map((j) => (
                    <th key={j.id} style={{ textAlign: 'center' }}>
                      {j.name}
                      {j.variant && (
                        <div
                          style={{
                            fontSize: 10,
                            fontWeight: 400,
                            color: 'var(--muted)',
                            textTransform: 'none',
                            letterSpacing: 0
                          }}
                        >
                          {j.variant}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {state.people.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <strong>{p.name}</strong>
                    </td>
                    {state.platforms.map((j) => {
                      const a = state.apps.find(
                        (x) => x.personId === p.id && x.platformId === j.id
                      );
                      const missing = j.skills.filter(
                        (s) => !p.skills.includes(s)
                      );
                      const eligible = missing.length === 0;
                      const skillWarning = a && !eligible;
                      const title = !eligible
                        ? `Missing: ${missing.join(', ')}`
                        : a?.status;
                      return (
                        <td
                          key={j.id}
                          className={`cell ${skillWarning ? 'cell-missing-skills' : ''}`}
                          title={title}
                        >
                          {a ? (
                            <span className={`cell ${a.status}`}>
                              {SYMBOL[a.status]}
                            </span>
                          ) : eligible ? (
                            <span className="cell empty">—</span>
                          ) : (
                            <span className="cell blocked">⊘</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div style={{ marginTop: 12, fontSize: 11, color: 'var(--muted)' }}>
          <span className="cell should_apply">○</span> Should apply &nbsp;
          <span className="cell applying">◐</span> Applying &nbsp;
          <span className="cell applied">●</span> Applied &nbsp;
          <span className="cell background_check">◉</span> Background check &nbsp;
          <span className="cell accepted">✓</span> Accepted &nbsp;
          <span className="cell rejected">✕</span> Rejected &nbsp;
          <span className="cell empty">—</span> Eligible, not logged &nbsp;
          <span className="cell blocked">⊘</span> Missing skills
        </div>
      </div>

      <div className="card">
        <h3>By Platform — Applications &amp; outcomes</h3>
        {!state.platforms.length ? (
          <div className="empty">Add some platforms first.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="by-platform-table">
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Platform</th>
                  <th className="col-should_apply">Should apply</th>
                  <th className="col-applying">Applying</th>
                  <th className="col-applied">Awaiting</th>
                  <th className="col-background_check">Bg check</th>
                  <th className="col-accepted">Accepted</th>
                  <th className="col-rejected">Rejected</th>
                </tr>
              </thead>
              <tbody>
                {state.platforms.map((j) => {
                  const apps = state.apps.filter((a) => a.platformId === j.id);
                  const cell = (s: AppStatus) => {
                    const rows = apps.filter((a) => a.status === s);
                    return rows.length ? (
                      <td>
                        {rows.map((a) => (
                          <span key={a.id} className="chip">
                            {nameOf(a.personId)}
                          </span>
                        ))}
                      </td>
                    ) : (
                      <td style={{ color: '#3a4050', textAlign: 'center' }}>
                        —
                      </td>
                    );
                  };
                  return (
                    <tr key={j.id}>
                      <td>
                        <strong>{j.name}</strong>
                        {j.variant && (
                          <div
                            style={{ fontSize: 11, color: 'var(--muted)' }}
                          >
                            {j.variant}
                          </div>
                        )}
                      </td>
                      {cell('should_apply')}
                      {cell('applying')}
                      {cell('applied')}
                      {cell('background_check')}
                      {cell('accepted')}
                      {cell('rejected')}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <h3>Coverage — Platforms still needing an applicant</h3>
        {!state.people.length || !state.platforms.length ? (
          <div className="empty">Add people and platforms first.</div>
        ) : !uncovered.length ? (
          <div className="empty">
            Every platform has at least one applicant. 🎯
          </div>
        ) : (
          <>
            <p
              style={{
                color: 'var(--muted)',
                fontSize: 12,
                margin: '0 0 8px 0'
              }}
            >
              {uncovered.length} platform
              {uncovered.length === 1 ? '' : 's'} with no applicants.
            </p>
            {uncovered.map((j) => {
              const eligible = state.people.filter((p) =>
                j.skills.every((s) => p.skills.includes(s))
              );
              const blockedCount =
                state.people.length - eligible.length;
              return (
                <div key={j.id} className="coverage-row">
                  <div className="coverage-head">
                    <strong>{j.name}</strong>
                    {j.variant && (
                      <span className="chip">{j.variant}</span>
                    )}
                  </div>
                  {eligible.length ? (
                    <div className="coverage-body">
                      {eligible.map((p) => (
                        <span key={p.id} className="chip coverage-eligible">
                          {p.name}
                        </span>
                      ))}
                      {blockedCount > 0 && (
                        <span className="coverage-blocked-count">
                          +{blockedCount} missing skills
                        </span>
                      )}
                    </div>
                  ) : (
                    <div
                      style={{ color: 'var(--bad)', fontSize: 12 }}
                    >
                      Nobody qualifies —
                      {j.skills.length > 0 &&
                        ` needs ${j.skills.join(', ')}`}
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>
    </>
  );
}
