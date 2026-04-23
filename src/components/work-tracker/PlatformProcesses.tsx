import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../../state';
import { platformLabel, type ProcessStep } from '../../types';
import { uid } from '../../utils';

type Toast = { type: 'success' | 'error'; message: string } | null;

export default function PlatformProcesses() {
  const { state, updatePlatformProcess } = useStore();
  const [platformId, setPlatformId] = useState('');
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<ProcessStep[]>([]);
  const [toast, setToast] = useState<Toast>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const sortedPlatforms = useMemo(
    () =>
      [...state.platforms].sort((a, b) =>
        a.name === b.name
          ? a.variant.localeCompare(b.variant)
          : a.name.localeCompare(b.name)
      ),
    [state.platforms]
  );

  const platform = state.platforms.find((p) => p.id === platformId) ?? null;
  const steps = platform?.processSteps ?? [];

  function startEdit() {
    if (!platform) return;
    setDraft(platform.processSteps.map((s) => ({ ...s })));
    setEditing(true);
  }
  function cancelEdit() {
    setEditing(false);
    setDraft([]);
  }
  function addStep() {
    setDraft((prev) => [...prev, { id: uid(), title: '', description: '' }]);
  }
  function updateStep(id: string, patch: Partial<ProcessStep>) {
    setDraft((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }
  function removeStep(id: string) {
    setDraft((prev) => prev.filter((s) => s.id !== id));
  }
  function moveStep(id: string, dir: -1 | 1) {
    setDraft((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      const target = idx + dir;
      if (idx < 0 || target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  }
  async function save() {
    if (!platform) return;
    const cleaned = draft
      .map((s) => ({
        id: s.id,
        title: s.title.trim(),
        description: s.description.trim()
      }))
      .filter((s) => s.title || s.description);
    await updatePlatformProcess(platform.id, cleaned);
    setEditing(false);
    setDraft([]);
    setToast({ type: 'success', message: 'Process saved ✓' });
  }

  return (
    <>
      {toast && (
        <div
          className={`toast toast-${toast.type}`}
          role="status"
          onClick={() => setToast(null)}
        >
          {toast.message}
        </div>
      )}
      <h2>Platform Processes</h2>
      <div className="card">
        <h3>Platform</h3>
        <div className="row-flex">
          <select
            value={platformId}
            onChange={(e) => {
              setPlatformId(e.target.value);
              setEditing(false);
              setDraft([]);
            }}
          >
            <option value="">
              {sortedPlatforms.length
                ? 'Select a platform…'
                : 'No platforms yet — add one in the Application Process tab'}
            </option>
            {sortedPlatforms.map((p) => (
              <option key={p.id} value={p.id}>
                {platformLabel(p)}
              </option>
            ))}
          </select>
          {platform && !editing && (
            <button className="primary small" onClick={startEdit}>
              {steps.length ? 'Edit process' : 'Build process'}
            </button>
          )}
        </div>
      </div>

      {!platform ? (
        <div className="empty">
          Pick a platform to view or edit its delivery process.
        </div>
      ) : editing ? (
        <div className="card">
          <h3>Editing — {platformLabel(platform)}</h3>
          {!draft.length && (
            <div
              className="empty"
              style={{ padding: '20px 12px', fontStyle: 'normal' }}
            >
              No steps yet. Add the first step below.
            </div>
          )}
          <div className="process-editor">
            {draft.map((s, i) => (
              <div key={s.id} className="process-edit-row">
                <div className="process-edit-index">{i + 1}</div>
                <div className="process-edit-body">
                  <input
                    value={s.title}
                    placeholder={`Step ${i + 1} title — e.g. Open the app`}
                    onChange={(e) =>
                      updateStep(s.id, { title: e.target.value })
                    }
                  />
                  <textarea
                    value={s.description}
                    placeholder="What you do at this step. Tap info, tips, gotchas…"
                    onChange={(e) =>
                      updateStep(s.id, { description: e.target.value })
                    }
                  />
                </div>
                <div className="process-edit-actions">
                  <button
                    type="button"
                    className="ghost small"
                    disabled={i === 0}
                    onClick={() => moveStep(s.id, -1)}
                    title="Move up"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="ghost small"
                    disabled={i === draft.length - 1}
                    onClick={() => moveStep(s.id, 1)}
                    title="Move down"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="danger small"
                    onClick={() => removeStep(s.id)}
                    title="Remove step"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="row-flex" style={{ marginTop: 12 }}>
            <button type="button" className="ghost" onClick={addStep}>
              + Add step
            </button>
            <button
              type="button"
              className="primary"
              style={{ marginLeft: 'auto' }}
              onClick={save}
            >
              Save process
            </button>
            <button type="button" className="ghost" onClick={cancelEdit}>
              Cancel
            </button>
          </div>
        </div>
      ) : !steps.length ? (
        <div className="empty">
          No process built yet for {platformLabel(platform)}. Click “Build
          process” above to add steps.
        </div>
      ) : (
        <div className="flow-chart">
          {steps.map((s, i) => (
            <div key={s.id} className="flow-step-wrap">
              <div className="flow-step">
                <div className="flow-step-index">{i + 1}</div>
                <div className="flow-step-body">
                  <div className="flow-step-title">
                    {s.title || <em style={{ opacity: 0.6 }}>Untitled step</em>}
                  </div>
                  {s.description && (
                    <div className="flow-step-desc">{s.description}</div>
                  )}
                </div>
              </div>
              {i < steps.length - 1 && <div className="flow-arrow">▼</div>}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
