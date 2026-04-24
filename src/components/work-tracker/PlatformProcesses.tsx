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
      { id: uid(), title: '', description: '', parentId }
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
        `This step has ${descendantCount} sub-step${descendantCount === 1 ? '' : 's'} below it. Remove all of them?`
      );
      if (!ok) return;
    }
    setDraft((prev) => prev.filter((s) => !toRemove.has(s.id)));
  }
  async function save() {
    if (!platform) return;
    const cleaned = draft.map((s) => ({
      id: s.id,
      title: s.title.trim(),
      description: s.description.trim(),
      parentId: s.parentId
    }));
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
          <EditTree
            parentId={null}
            depth={1}
            steps={draft}
            onAddChild={addStep}
            onChange={updateStep}
            onRemove={removeStep}
          />
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
        <div className="flow-tree">
          <ViewTree parentId={null} depth={1} steps={steps} />
        </div>
      )}
    </>
  );
}

function stepLabel(depth: number, siblingIndex: number, total: number): string {
  if (total <= 1) return `Step ${depth}`;
  const letter = String.fromCharCode(65 + siblingIndex);
  return `Step ${depth} · ${letter}`;
}

// ============================================================
// Display tree
// ============================================================
function ViewTree({
  parentId,
  depth,
  steps
}: {
  parentId: string | null;
  depth: number;
  steps: ProcessStep[];
}) {
  const kids = childrenOf(parentId, steps);
  if (!kids.length) return null;
  const branching = kids.length > 1;
  return (
    <div
      className={`flow-branch-list${branching ? ' flow-branch-list-split' : ''}`}
    >
      {branching && (
        <div className="flow-branch-label">
          one of {kids.length} options
        </div>
      )}
      {kids.map((k, i) => (
        <div key={k.id} className="flow-branch">
          <div className="flow-card">
            <div className="flow-card-index">
              {stepLabel(depth, i, kids.length)}
            </div>
            <div className="flow-card-body">
              <div className="flow-card-title">
                {k.title || <em style={{ opacity: 0.6 }}>Untitled step</em>}
              </div>
              {k.description && (
                <div className="flow-card-desc">{k.description}</div>
              )}
            </div>
          </div>
          <ViewTree parentId={k.id} depth={depth + 1} steps={steps} />
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Edit tree
// ============================================================
function EditTree({
  parentId,
  depth,
  steps,
  onAddChild,
  onChange,
  onRemove
}: {
  parentId: string | null;
  depth: number;
  steps: ProcessStep[];
  onAddChild: (parentId: string | null) => void;
  onChange: (id: string, patch: Partial<ProcessStep>) => void;
  onRemove: (id: string) => void;
}) {
  const kids = childrenOf(parentId, steps);
  if (!kids.length) return null;
  const branching = kids.length > 1;
  return (
    <div
      className={`flow-branch-list${branching ? ' flow-branch-list-split' : ''}`}
    >
      {branching && (
        <div className="flow-branch-label">
          one of {kids.length} options
        </div>
      )}
      {kids.map((k, i) => {
        const label = stepLabel(depth, i, kids.length);
        const childKids = childrenOf(k.id, steps);
        const nextBtn =
          childKids.length === 0
            ? '+ Next step'
            : childKids.length === 1
              ? '+ Turn next step into options'
              : '+ Another option';
        return (
          <div key={k.id} className="flow-branch flow-branch-edit">
            <div className="flow-card flow-card-edit">
              <div className="flow-card-index">{label}</div>
              <div className="flow-card-body">
                <input
                  value={k.title}
                  placeholder={`${label} — e.g. Open the app`}
                  onChange={(e) => onChange(k.id, { title: e.target.value })}
                />
                <textarea
                  value={k.description}
                  placeholder="What you do here. Tips, gotchas…"
                  onChange={(e) =>
                    onChange(k.id, { description: e.target.value })
                  }
                />
                <div className="row-flex">
                  <button
                    type="button"
                    className="ghost small"
                    onClick={() => onAddChild(k.id)}
                  >
                    {nextBtn}
                  </button>
                  <button
                    type="button"
                    className="danger small"
                    style={{ marginLeft: 'auto' }}
                    onClick={() => onRemove(k.id)}
                    title="Remove this step and anything below it"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
            <EditTree
              parentId={k.id}
              depth={depth + 1}
              steps={steps}
              onAddChild={onAddChild}
              onChange={onChange}
              onRemove={onRemove}
            />
          </div>
        );
      })}
    </div>
  );
}
