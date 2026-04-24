import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../../state';
import { platformLabel, type ProcessStep } from '../../types';
import { uid } from '../../utils';

type Toast = { type: 'success' | 'error'; message: string } | null;

function childrenOf(
  parentId: string | null,
  steps: ProcessStep[]
): ProcessStep[] {
  return steps.filter((s) => (s.parentId ?? null) === parentId);
}

function collectDescendants(
  id: string,
  steps: ProcessStep[],
  out: Set<string> = new Set()
): Set<string> {
  out.add(id);
  for (const s of steps) {
    if (s.parentId === id && !out.has(s.id)) {
      collectDescendants(s.id, steps, out);
    }
  }
  return out;
}

function stepLabel(depth: number, siblingIndex: number, total: number): string {
  if (total <= 1) return `Step ${depth}`;
  const letter = String.fromCharCode(65 + siblingIndex);
  return `Step ${depth} · ${letter}`;
}

/** Compute the same `Step N · X` label for an arbitrary step id. */
function labelForId(id: string, steps: ProcessStep[]): string {
  const step = steps.find((s) => s.id === id);
  if (!step) return '(removed)';
  let depth = 1;
  let cursor: string | null = step.parentId;
  while (cursor !== null) {
    const parent = steps.find((s) => s.id === cursor);
    if (!parent) break;
    depth += 1;
    cursor = parent.parentId;
  }
  const siblings = steps.filter(
    (s) => (s.parentId ?? null) === (step.parentId ?? null)
  );
  const siblingIndex = siblings.findIndex((s) => s.id === id);
  return stepLabel(depth, siblingIndex, siblings.length);
}

function titleForId(id: string, steps: ProcessStep[]): string {
  const s = steps.find((x) => x.id === id);
  return s?.title?.trim() || '';
}

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
  function addStep(parentId: string | null) {
    setDraft((prev) => [
      ...prev,
      {
        id: uid(),
        title: '',
        description: '',
        parentId,
        loopbackTo: null
      }
    ]);
  }
  function addLoopback(parentId: string | null) {
    setDraft((prev) => [
      ...prev,
      {
        id: uid(),
        title: '',
        description: '',
        parentId,
        loopbackTo: ''
      }
    ]);
  }
  function updateStep(id: string, patch: Partial<ProcessStep>) {
    setDraft((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }
  function removeStep(id: string) {
    const toRemove = collectDescendants(id, draft);
    const descendantCount = toRemove.size - 1;
    if (descendantCount > 0) {
      const ok = confirm(
        `This step has ${descendantCount} step${descendantCount === 1 ? '' : 's'} downstream. Remove them all?`
      );
      if (!ok) return;
    }
    setDraft((prev) => prev.filter((s) => !toRemove.has(s.id)));
  }
  async function save() {
    if (!platform) return;
    const cleaned: ProcessStep[] = draft.map((s) => ({
      id: s.id,
      title: s.title.trim(),
      description: s.description.trim(),
      parentId: s.parentId,
      loopbackTo: s.loopbackTo ? s.loopbackTo : null
    }));
    await updatePlatformProcess(platform.id, cleaned);
    setEditing(false);
    setDraft([]);
    setToast({ type: 'success', message: 'Process saved ✓' });
  }

  const source = editing ? draft : steps;
  const roots = childrenOf(null, source);

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
      ) : (
        <>
          <div className="flow-chart-scroll">
            {!roots.length ? (
              <div className="empty">
                {editing
                  ? 'No steps yet. Click “+ Add root step” below to start.'
                  : `No process built yet for ${platformLabel(platform)}. Click “Build process” above to add steps.`}
              </div>
            ) : (
              <div className="flow-chart">
                {roots.length > 1 && (
                  <div className="flow-branch-label">
                    start — one of {roots.length} paths
                  </div>
                )}
                <div
                  className={`flow-children${
                    roots.length > 1 ? ' flow-children-multi' : ''
                  }`}
                >
                  {roots.map((r, i) => (
                    <div
                      key={r.id}
                      className="flow-child flow-child-root"
                    >
                      {editing ? (
                        <EditTreeNode
                          step={r}
                          depth={1}
                          siblingIndex={i}
                          totalSiblings={roots.length}
                          steps={draft}
                          onAddChild={addStep}
                          onAddLoopback={addLoopback}
                          onChange={updateStep}
                          onRemove={removeStep}
                        />
                      ) : (
                        <TreeNode
                          step={r}
                          depth={1}
                          siblingIndex={i}
                          totalSiblings={roots.length}
                          steps={steps}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {editing && (
            <div className="row-flex" style={{ marginTop: 14 }}>
              <button
                type="button"
                className="ghost"
                onClick={() => addStep(null)}
              >
                + Add root step
              </button>
              <button
                type="button"
                className="primary"
                style={{ marginLeft: 'auto' }}
                onClick={save}
              >
                Save process
              </button>
              <button
                type="button"
                className="ghost"
                onClick={cancelEdit}
              >
                Cancel
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}

// ============================================================
// Display node (recursive)
// ============================================================
function TreeNode({
  step,
  depth,
  siblingIndex,
  totalSiblings,
  steps
}: {
  step: ProcessStep;
  depth: number;
  siblingIndex: number;
  totalSiblings: number;
  steps: ProcessStep[];
}) {
  const kids = childrenOf(step.id, steps);
  const multi = kids.length > 1;
  const isLoopback = step.loopbackTo !== null;
  const label = isLoopback
    ? totalSiblings > 1
      ? `Option ${String.fromCharCode(65 + siblingIndex)}`
      : 'Loop back'
    : stepLabel(depth, siblingIndex, totalSiblings);

  if (isLoopback) {
    const targetId = step.loopbackTo!;
    const targetLabel = targetId ? labelForId(targetId, steps) : '(not set)';
    const targetTitle = targetId ? titleForId(targetId, steps) : '';
    return (
      <div className="flow-node">
        <div className="flow-card flow-card-loopback">
          <div className="flow-card-index">↺ {label}</div>
          <div className="flow-card-title">
            Back to {targetLabel}
            {targetTitle && (
              <span className="flow-loopback-target-title">
                {' — '}
                {targetTitle}
              </span>
            )}
          </div>
          {step.title && (
            <div className="flow-card-desc">when: {step.title}</div>
          )}
          {step.description && (
            <div className="flow-card-desc">{step.description}</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flow-node">
      <div className="flow-card">
        <div className="flow-card-index">{label}</div>
        <div className="flow-card-title">
          {step.title || <em style={{ opacity: 0.6 }}>Untitled step</em>}
        </div>
        {step.description && (
          <div className="flow-card-desc">{step.description}</div>
        )}
      </div>
      {kids.length > 0 && (
        <>
          <div className="flow-connector-stub" />
          {multi && (
            <div className="flow-branch-label">
              one of {kids.length} options
            </div>
          )}
          <div
            className={`flow-children${multi ? ' flow-children-multi' : ''}`}
          >
            {kids.map((k, i) => (
              <div key={k.id} className="flow-child">
                <TreeNode
                  step={k}
                  depth={depth + 1}
                  siblingIndex={i}
                  totalSiblings={kids.length}
                  steps={steps}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================
// Edit node (recursive)
// ============================================================
function EditTreeNode({
  step,
  depth,
  siblingIndex,
  totalSiblings,
  steps,
  onAddChild,
  onAddLoopback,
  onChange,
  onRemove
}: {
  step: ProcessStep;
  depth: number;
  siblingIndex: number;
  totalSiblings: number;
  steps: ProcessStep[];
  onAddChild: (parentId: string | null) => void;
  onAddLoopback: (parentId: string | null) => void;
  onChange: (id: string, patch: Partial<ProcessStep>) => void;
  onRemove: (id: string) => void;
}) {
  const kids = childrenOf(step.id, steps);
  const multi = kids.length > 1;
  const isLoopback = step.loopbackTo !== null;
  const label = isLoopback
    ? totalSiblings > 1
      ? `Option ${String.fromCharCode(65 + siblingIndex)}`
      : 'Loop back'
    : stepLabel(depth, siblingIndex, totalSiblings);

  if (isLoopback) {
    // Loop-back cards can't have children; show target selector + optional condition/notes.
    const selfDescendants = collectDescendants(step.id, steps);
    const targetOptions = steps.filter(
      (s) =>
        s.id !== step.id &&
        s.loopbackTo === null &&
        !selfDescendants.has(s.id)
    );
    return (
      <div className="flow-node">
        <div className="flow-card flow-card-edit flow-card-loopback">
          <div className="flow-card-index">↺ {label}</div>
          <label className="flow-inline-label">Loop back to</label>
          <select
            value={step.loopbackTo ?? ''}
            onChange={(e) =>
              onChange(step.id, { loopbackTo: e.target.value || '' })
            }
          >
            <option value="">Pick a target step…</option>
            {targetOptions.map((s) => {
              const sLabel = labelForId(s.id, steps);
              return (
                <option key={s.id} value={s.id}>
                  {sLabel}
                  {s.title ? ` — ${s.title}` : ''}
                </option>
              );
            })}
          </select>
          <input
            value={step.title}
            placeholder="Condition (optional) — e.g. order cancelled"
            onChange={(e) => onChange(step.id, { title: e.target.value })}
          />
          <textarea
            value={step.description}
            placeholder="Extra notes (optional)"
            onChange={(e) =>
              onChange(step.id, { description: e.target.value })
            }
          />
          <div className="row-flex">
            <button
              type="button"
              className="danger small"
              style={{ marginLeft: 'auto' }}
              onClick={() => onRemove(step.id)}
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    );
  }

  const nextBtn =
    kids.length === 0
      ? '+ Next step'
      : kids.length === 1
        ? '+ Split into options'
        : '+ Another option';

  return (
    <div className="flow-node">
      <div className="flow-card flow-card-edit">
        <div className="flow-card-index">{label}</div>
        <input
          value={step.title}
          placeholder={`${label} — e.g. Open the app`}
          onChange={(e) => onChange(step.id, { title: e.target.value })}
        />
        <textarea
          value={step.description}
          placeholder="What you do here. Tips, gotchas…"
          onChange={(e) =>
            onChange(step.id, { description: e.target.value })
          }
        />
        <div className="row-flex flow-card-btn-row">
          <button
            type="button"
            className="ghost small"
            onClick={() => onAddChild(step.id)}
          >
            {nextBtn}
          </button>
          <button
            type="button"
            className="ghost small"
            onClick={() => onAddLoopback(step.id)}
            title="Add an option that loops back to a previous step"
          >
            + ↺ Loop back
          </button>
          <button
            type="button"
            className="danger small"
            style={{ marginLeft: 'auto' }}
            onClick={() => onRemove(step.id)}
            title="Remove this step and anything downstream"
          >
            Remove
          </button>
        </div>
      </div>
      {kids.length > 0 && (
        <>
          <div className="flow-connector-stub" />
          {multi && (
            <div className="flow-branch-label">
              one of {kids.length} options
            </div>
          )}
          <div
            className={`flow-children${multi ? ' flow-children-multi' : ''}`}
          >
            {kids.map((k, i) => (
              <div key={k.id} className="flow-child">
                <EditTreeNode
                  step={k}
                  depth={depth + 1}
                  siblingIndex={i}
                  totalSiblings={kids.length}
                  steps={steps}
                  onAddChild={onAddChild}
                  onAddLoopback={onAddLoopback}
                  onChange={onChange}
                  onRemove={onRemove}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
