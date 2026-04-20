import { useEffect, useState } from 'react';
import { useStore } from '../../state';
import { today } from '../../utils';
import { platformLabel } from '../../types';

interface Props {
  editingId: string | null;
  onDoneEditing: () => void;
}

export default function LogDelivery({ editingId, onDoneEditing }: Props) {
  const { state, addDelivery, updateDelivery } = useStore();
  const [personId, setPersonId] = useState('');
  const [platformId, setPlatformId] = useState('');
  const [date, setDate] = useState(today());
  const [restaurant, setRestaurant] = useState('');
  const [collection, setCollection] = useState('');
  const [notes, setNotes] = useState('');
  const [timePeriod, setTimePeriod] = useState('');
  const [busyness, setBusyness] = useState('');
  const [area, setArea] = useState('');

  useEffect(() => {
    if (editingId) {
      const d = state.deliveries.find((x) => x.id === editingId);
      if (d) {
        setPersonId(d.personId);
        setPlatformId(d.platformId);
        setDate(d.date);
        setRestaurant(d.restaurant);
        setCollection(d.collection);
        setNotes(d.notes);
        setTimePeriod(d.timePeriod);
        setBusyness(d.busyness);
        setArea(d.area);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingId]);

  const acceptedPlatforms = personId
    ? state.platforms.filter((p) =>
        state.apps.some(
          (a) =>
            a.personId === personId &&
            a.platformId === p.id &&
            a.status === 'accepted'
        )
      )
    : [];

  const historical =
    editingId && platformId && !acceptedPlatforms.some((p) => p.id === platformId)
      ? state.platforms.find((p) => p.id === platformId)
      : undefined;

  const availablePlatforms = historical
    ? [...acceptedPlatforms, historical]
    : acceptedPlatforms;

  function reset() {
    setPersonId('');
    setPlatformId('');
    setDate(today());
    setRestaurant('');
    setCollection('');
    setNotes('');
    setTimePeriod('');
    setBusyness('');
    setArea('');
    if (editingId) onDoneEditing();
  }

  function submit() {
    if (!personId || !platformId) {
      alert('Pick a person and a platform');
      return;
    }
    const rec = {
      personId,
      platformId,
      date: date || today(),
      restaurant: restaurant.trim(),
      collection: collection.trim(),
      notes: notes.trim(),
      timePeriod,
      busyness,
      area: area.trim()
    };
    if (editingId) updateDelivery(editingId, rec);
    else addDelivery(rec);
    reset();
  }

  return (
    <>
      <h2>{editingId ? 'Edit Delivery' : 'Log a Delivery'}</h2>
      <form
        className="card"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <h3>Delivery Template</h3>
        <div className="grid-fields">
          <div>
            <label>Who delivered</label>
            <select
              value={personId}
              onChange={(e) => {
                setPersonId(e.target.value);
                setPlatformId('');
              }}
            >
              <option value="">Select person…</option>
              {state.people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Platform</label>
            <select
              value={platformId}
              onChange={(e) => setPlatformId(e.target.value)}
            >
              <option value="">
                {!personId
                  ? 'Select person first…'
                  : availablePlatforms.length
                    ? 'Select platform…'
                    : 'No accepted platforms for this person'}
              </option>
              {availablePlatforms.map((p) => (
                <option key={p.id} value={p.id}>
                  {platformLabel(p)}
                  {historical && p.id === historical.id ? ' (historical)' : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div>
            <label>Takeaway / Restaurant</label>
            <input
              value={restaurant}
              onChange={(e) => setRestaurant(e.target.value)}
              placeholder="e.g. Dishoom Shoreditch"
            />
          </div>
        </div>

        <label>How the item was collected</label>
        <textarea
          value={collection}
          onChange={(e) => setCollection(e.target.value)}
          placeholder="Waited at counter 5 min, handed bag by staff, sealed, no issues…"
        />

        <label>Key notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Anything worth remembering — customer behaviour, address issues, traffic, app glitches…"
        />

        <h3 style={{ marginTop: 20 }}>Optional Context</h3>
        <div className="grid-fields">
          <div>
            <label>Time period</label>
            <select
              value={timePeriod}
              onChange={(e) => setTimePeriod(e.target.value)}
            >
              <option value="">—</option>
              <option value="Breakfast">Breakfast (06–10)</option>
              <option value="Lunch">Lunch (11–14)</option>
              <option value="Afternoon">Afternoon (14–17)</option>
              <option value="Dinner">Dinner (17–21)</option>
              <option value="Late night">Late night (21–02)</option>
            </select>
          </div>
          <div>
            <label>Busyness</label>
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
