import { useEffect, useState } from 'react';
import { useStore } from '../../state';
import {
  COLLECTION_METHODS,
  HANDOVER_METHODS,
  platformLabel
} from '../../types';

interface Props {
  editingId: string | null;
  onDoneEditing: () => void;
}

type Toast = { type: 'success' | 'error'; message: string } | null;

export default function LogDelivery({ editingId, onDoneEditing }: Props) {
  const { state, addDelivery, updateDelivery } = useStore();
  const [platformId, setPlatformId] = useState('');
  const [accountOwnerId, setAccountOwnerId] = useState<string | null>(null);
  const [personId, setPersonId] = useState('');
  const [restaurant, setRestaurant] = useState('');
  const [collection, setCollection] = useState('');
  const [handover, setHandover] = useState('');
  const [notes, setNotes] = useState('');
  const [twoOrders, setTwoOrders] = useState(false);
  const [handover2, setHandover2] = useState('');
  const [notes2, setNotes2] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [busyness, setBusyness] = useState('');
  const [area, setArea] = useState('');
  const [toast, setToast] = useState<Toast>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (editingId) {
      const d = state.deliveries.find((x) => x.id === editingId);
      if (d) {
        setPlatformId(d.platformId ?? '');
        setAccountOwnerId(d.accountOwnerId);
        setPersonId(d.personId ?? '');
        setRestaurant(d.restaurant);
        setCollection(d.collection);
        setHandover(d.handover);
        setNotes(d.notes);
        setTwoOrders(!!(d.handover2 || d.notes2));
        setHandover2(d.handover2);
        setNotes2(d.notes2);
        setStartTime(d.startTime);
        setEndTime(d.endTime);
        setBusyness(d.busyness);
        setArea(d.area);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingId]);

  // Platforms with at least one accepted applicant
  const platformsWithAccepted = state.platforms.filter((p) =>
    state.apps.some((a) => a.platformId === p.id && a.status === 'accepted')
  );
  // If editing and the saved platform is no longer in that list, include it as historical
  const historicalPlatform =
    editingId &&
    platformId &&
    !platformsWithAccepted.some((p) => p.id === platformId)
      ? state.platforms.find((p) => p.id === platformId)
      : undefined;
  const availablePlatforms = historicalPlatform
    ? [...platformsWithAccepted, historicalPlatform]
    : platformsWithAccepted;

  // People who have an accepted application on the selected platform
  const possibleOwners = platformId
    ? state.people.filter((p) =>
        state.apps.some(
          (a) =>
            a.platformId === platformId &&
            a.personId === p.id &&
            a.status === 'accepted'
        )
      )
    : [];
  const historicalOwner =
    editingId &&
    accountOwnerId &&
    !possibleOwners.some((p) => p.id === accountOwnerId)
      ? state.people.find((p) => p.id === accountOwnerId)
      : undefined;
  const availableOwners = historicalOwner
    ? [...possibleOwners, historicalOwner]
    : possibleOwners;

  function reset() {
    setPlatformId('');
    setAccountOwnerId(null);
    setPersonId('');
    setRestaurant('');
    setCollection('');
    setHandover('');
    setNotes('');
    setTwoOrders(false);
    setHandover2('');
    setNotes2('');
    setStartTime('');
    setEndTime('');
    setBusyness('');
    setArea('');
    if (editingId) onDoneEditing();
  }

  async function submit() {
    // When creating new, stamp the current timestamp.
    // When editing, keep the original timestamp.
    const existing = editingId
      ? state.deliveries.find((x) => x.id === editingId)
      : undefined;
    const date = existing?.date || new Date().toISOString();
    const rec = {
      personId: personId || null,
      accountOwnerId,
      platformId: platformId || null,
      date,
      restaurant: restaurant.trim(),
      collection: collection.trim(),
      handover,
      notes: notes.trim(),
      handover2: twoOrders ? handover2 : '',
      notes2: twoOrders ? notes2.trim() : '',
      startTime,
      endTime,
      busyness,
      area: area.trim()
    };
    const isEdit = !!editingId;
    const err = isEdit
      ? await updateDelivery(editingId!, rec)
      : await addDelivery(rec);
    if (err) {
      setToast({
        type: 'error',
        message: `Failed to ${isEdit ? 'update' : 'log'} delivery: ${err}`
      });
      return;
    }
    setToast({
      type: 'success',
      message: isEdit ? 'Delivery updated ✓' : 'Delivery logged ✓'
    });
    reset();
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
      <h2>{editingId ? 'Edit Delivery' : 'Log a Delivery'}</h2>
      <form
        className="card"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 12,
            flexWrap: 'wrap'
          }}
        >
          <h3 style={{ margin: 0 }}>Delivery Template</h3>
          <button
            type="button"
            className="ghost small"
            style={{ marginLeft: 'auto' }}
            onClick={() => {
              if (twoOrders) {
                // turning off — discard the second order's fields
                setHandover2('');
                setNotes2('');
              }
              setTwoOrders((v) => !v);
            }}
          >
            {twoOrders
              ? '× Back to single order'
              : '+ Two orders from this pickup'}
          </button>
        </div>
        <div className="grid-fields">
          <div>
            <label>Platform</label>
            <select
              value={platformId}
              onChange={(e) => {
                setPlatformId(e.target.value);
                setAccountOwnerId(null);
              }}
            >
              <option value="">
                {availablePlatforms.length
                  ? 'Select platform…'
                  : 'No platforms with accepted applicants yet'}
              </option>
              {availablePlatforms.map((p) => (
                <option key={p.id} value={p.id}>
                  {platformLabel(p)}
                  {historicalPlatform && p.id === historicalPlatform.id
                    ? ' (historical)'
                    : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Whose account</label>
            <select
              value={accountOwnerId ?? ''}
              onChange={(e) => setAccountOwnerId(e.target.value || null)}
              disabled={!platformId}
            >
              <option value="">
                {!platformId
                  ? 'Select platform first…'
                  : availableOwners.length
                    ? 'Select account owner…'
                    : 'Nobody accepted on this platform'}
              </option>
              {availableOwners.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {historicalOwner && p.id === historicalOwner.id
                    ? ' (historical)'
                    : ''}
                </option>
              ))}
            </select>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label>Who delivered</label>
            <select
              value={personId}
              onChange={(e) => setPersonId(e.target.value)}
            >
              <option value="">Select deliverer…</option>
              {state.people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {p.id === accountOwnerId ? ' (same as account owner)' : ''}
                </option>
              ))}
            </select>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label>Takeaway / Restaurant</label>
            <input
              value={restaurant}
              onChange={(e) => setRestaurant(e.target.value)}
              placeholder="e.g. Dishoom Shoreditch"
            />
          </div>
        </div>

        <label>How the item was collected</label>
        <select
          value={collection}
          onChange={(e) => setCollection(e.target.value)}
        >
          <option value="">—</option>
          {COLLECTION_METHODS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
          {collection &&
            !(COLLECTION_METHODS as readonly string[]).includes(collection) && (
              <option value={collection}>{collection} (historical)</option>
            )}
        </select>

        {twoOrders && <div className="order-divider">Order 1</div>}

        <label>How the item was delivered{twoOrders ? ' (order 1)' : ''}</label>
        <select value={handover} onChange={(e) => setHandover(e.target.value)}>
          <option value="">—</option>
          {HANDOVER_METHODS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>

        <label>Key notes{twoOrders ? ' (order 1)' : ''}</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Anything worth remembering — customer behaviour, address issues, traffic, app glitches…"
        />

        {twoOrders && (
          <>
            <div className="order-divider">Order 2</div>
            <label>How the item was delivered (order 2)</label>
            <select
              value={handover2}
              onChange={(e) => setHandover2(e.target.value)}
            >
              <option value="">—</option>
              {HANDOVER_METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>

            <label>Key notes (order 2)</label>
            <textarea
              value={notes2}
              onChange={(e) => setNotes2(e.target.value)}
              placeholder="Anything worth remembering for the second order…"
            />
          </>
        )}

        <h3 style={{ marginTop: 20 }}>Optional Context</h3>
        <div className="grid-fields">
          <div>
            <label>Start time</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>
          <div>
            <label>End time</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label>Busyness of the shop</label>
            <select
              value={busyness}
              onChange={(e) => setBusyness(e.target.value)}
            >
              <option value="">—</option>
              <option value="1">1 — Quiet</option>
              <option value="2">2 — Steady</option>
              <option value="3">3 — Busy</option>
              <option value="4">4 — Very busy</option>
              <option value="5">5 — Slammed</option>
            </select>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label>Area</label>
            <input
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="e.g. Shoreditch, E1"
            />
          </div>
        </div>

        {!editingId && (
          <p
            style={{
              fontSize: 11,
              color: 'var(--muted)',
              margin: '8px 0 0 0'
            }}
          >
            Every field is optional. Log date is recorded automatically when you
            submit.
          </p>
        )}

        <div className="row-flex" style={{ marginTop: 10 }}>
          <button type="submit" className="primary">
            {editingId ? 'Save Changes' : 'Log Delivery'}
          </button>
          {editingId && (
            <button type="button" className="ghost" onClick={reset}>
              Cancel
            </button>
          )}
        </div>
      </form>
    </>
  );
}
