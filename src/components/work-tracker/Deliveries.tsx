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
  items.sort((a, b) => {
    const ta = new Date(a.date).getTime() || 0;
    const tb = new Date(b.date).getTime() || 0;
    return tb - ta;
  });

  function formatDate(s: string): string {
    if (!s) return '';
    const d = new Date(s);
    if (isNaN(d.getTime())) return s;
    // If it's just a YYYY-MM-DD string, show just the date (no fake midnight time)
    const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(s);
    return dateOnly
      ? d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
      : d.toLocaleString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
  }

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
          const deliverer = state.people.find((x) => x.id === d.personId);
          const owner = d.accountOwnerId
            ? state.people.find((x) => x.id === d.accountOwnerId)
            : null;
          const j = state.platforms.find((x) => x.id === d.platformId);
          const busyLabel = BUSY_LABEL[d.busyness] || '';
          const sameOwner =
            owner && deliverer && owner.id === deliverer.id;
          return (
            <div key={d.id} className="delivery-card">
              <div className="delivery-header">
                <strong style={{ fontSize: 14 }}>
                  {deliverer?.name ?? '(removed)'}
                </strong>
                {owner && !sameOwner && (
                  <span style={{ color: 'var(--muted)', fontSize: 12 }}>
                    on {owner.name}'s account
                  </span>
                )}
                <span style={{ color: 'var(--muted)' }}>@</span>
                <strong>{j ? platformLabel(j) : '(removed)'}</strong>
                <span className="chip">{formatDate(d.date)}</span>
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
              {d.handover && (
                <div className="delivery-field">
                  <div className="lbl">How it was delivered</div>
                  <div className="val">{d.handover}</div>
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
