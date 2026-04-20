import { useState } from 'react';
import { useStore } from '../../state';
import { platformLabel } from '../../types';

interface Props {
  onEdit: (id: string) => void;
}

const BUSY_LABEL: Record<string, string> = {
  '1': 'Quiet',
  '2': 'Steady',
  '3': 'Busy',
  '4': 'Very busy',
  '5': 'Slammed'
};

export default function Deliveries({ onEdit }: Props) {
  const { state, removeDelivery } = useStore();
  const [fPerson, setFPerson] = useState('');
  const [fPlatform, setFPlatform] = useState('');

  let items = [...state.deliveries];
  if (fPerson) items = items.filter((d) => d.personId === fPerson);
  if (fPlatform) items = items.filter((d) => d.platformId === fPlatform);
  items.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  const all = state.deliveries;

  return (
    <>
      <h2>All Deliveries</h2>
      <div className="stat-grid">
        <div className="stat">
          <div className="num">{all.length}</div>
          <div className="lbl">Total deliveries</div>
        </div>
        <div className="stat">
          <div className="num">{new Set(all.map((d) => d.personId)).size}</div>
          <div className="lbl">Active deliverers</div>
        </div>
        <div className="stat">
          <div className="num">{new Set(all.map((d) => d.platformId)).size}</div>
          <div className="lbl">Platforms used</div>
        </div>
        <div className="stat">
          <div className="num">{items.length}</div>
          <div className="lbl">Matching filter</div>
        </div>
      </div>
      <div className="card">
        <h3>Filter</h3>
        <div className="row-flex">
          <select value={fPerson} onChange={(e) => setFPerson(e.target.value)}>
            <option value="">All people</option>
            {state.people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <select
            value={fPlatform}
            onChange={(e) => setFPlatform(e.target.value)}
          >
            <option value="">All platforms</option>
            {state.platforms.map((j) => (
              <option key={j.id} value={j.id}>
                {platformLabel(j)}
              </option>
            ))}
          </select>
          <button
            className="ghost small"
            onClick={() => {
              setFPerson('');
              setFPlatform('');
            }}
          >
            Clear
          </button>
        </div>
      </div>
      {!items.length ? (
        <div className="empty">
          {all.length
            ? 'No deliveries match the current filter.'
            : 'No deliveries logged yet. Go to Log Delivery.'}
        </div>
      ) : (
        items.map((d) => {
          const p = state.people.find((x) => x.id === d.personId);
          const j = state.platforms.find((x) => x.id === d.platformId);
          const busyLabel = BUSY_LABEL[d.busyness] || '';
          return (
            <div key={d.id} className="delivery-card">
              <div className="delivery-header">
                <strong style={{ fontSize: 14 }}>
                  {p?.name ?? '(removed)'}
                </strong>
                <span style={{ color: 'var(--muted)' }}>@</span>
                <strong>{j ? platformLabel(j) : '(removed)'}</strong>
                <span className="chip">{d.date}</span>
                {d.timePeriod && <span className="chip">{d.timePeriod}</span>}
                {busyLabel && (
                  <span className={`chip busy-${d.busyness}`}>
                    ● {busyLabel}
                  </span>
                )}
                {d.area && <span className="chip">📍 {d.area}</span>}
                <span style={{ marginLeft: 'auto' }}>
                  <button
                    className="ghost small"
                    onClick={() => onEdit(d.id)}
                  >
                    Edit
                  </button>{' '}
                  <button
                    className="danger small"
                    onClick={() => removeDelivery(d.id)}
                  >
                    ×
                  </button>
                </span>
              </div>
              {d.restaurant && (
                <div className="delivery-field">
                  <div className="lbl">Restaurant / Takeaway</div>
                  <div className="val">{d.restaurant}</div>
                </div>
              )}
              {d.collection && (
                <div className="delivery-field">
                  <div className="lbl">How it was collected</div>
                  <div className="val long">{d.collection}</div>
                </div>
              )}
              {d.notes && (
                <div className="delivery-field">
                  <div className="lbl">Key notes</div>
                  <div className="val long">{d.notes}</div>
                </div>
              )}
            </div>
          );
        })
      )}
    </>
  );
}
