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

  const all = state.deliveries;
  let items = [...state.deliveries];
  if (fPerson) items = items.filter((d) => d.personId === fPerson);
  if (fPlatform) items = items.filter((d) => d.platformId === fPlatform);
  items.sort((a, b) => {
    const ta = new Date(a.date).getTime() || 0;
    const tb = new Date(b.date).getTime() || 0;
    return tb - ta;
  });
  const activeDelivererCount = new Set(
    all.filter((d) => d.personId).map((d) => d.personId)
  ).size;
  const platformsUsedCount = new Set(
    all.filter((d) => d.platformId).map((d) => d.platformId)
  ).size;

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

  return (
    <>
      <h2>All Deliveries</h2>
      <div className="stat-grid">
        <div className="stat">
          <div className="num">{all.length}</div>
          <div className="lbl">Total deliveries</div>
        </div>
        <div className="stat">
          <div className="num">{activeDelivererCount}</div>
          <div className="lbl">Active deliverers</div>
        </div>
        <div className="stat">
          <div className="num">{platformsUsedCount}</div>
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
          const deliverer = d.personId
            ? state.people.find((x) => x.id === d.personId)
            : null;
          const owner = d.accountOwnerId
            ? state.people.find((x) => x.id === d.accountOwnerId)
            : null;
          const j = d.platformId
            ? state.platforms.find((x) => x.id === d.platformId)
            : null;
          const busyLabel = BUSY_LABEL[d.busyness] || '';
          const sameOwner =
            owner && deliverer && owner.id === deliverer.id;
          const delivererLabel = !d.personId
            ? '—'
            : (deliverer?.name ?? '(removed)');
          const platformLabelText = !d.platformId
            ? '—'
            : (j ? platformLabel(j) : '(removed)');
          const timeChip =
            d.startTime && d.endTime
              ? `${d.startTime} → ${d.endTime}`
              : d.startTime
                ? `from ${d.startTime}`
                : d.endTime
                  ? `until ${d.endTime}`
                  : '';
          return (
            <div key={d.id} className="delivery-card">
              <div className="delivery-header">
                <strong style={{ fontSize: 14 }}>{delivererLabel}</strong>
                {owner && !sameOwner && (
                  <span style={{ color: 'var(--muted)', fontSize: 12 }}>
                    on {owner.name}'s account
                  </span>
                )}
                <span style={{ color: 'var(--muted)' }}>@</span>
                <strong>{platformLabelText}</strong>
                <span className="chip">{formatDate(d.date)}</span>
                {timeChip && <span className="chip">🕒 {timeChip}</span>}
                {d.extraOrders.length > 0 && (
                  <span className="chip chip-two-orders">
                    × {d.extraOrders.length + 1} orders
                  </span>
                )}
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
              {(() => {
                const allOrders = [
                  { handover: d.handover, notes: d.notes },
                  ...d.extraOrders
                ];
                const multi = d.extraOrders.length > 0;
                const prefix = (n: number) => (multi ? `Order ${n} — ` : '');
                return allOrders.map((o, idx) =>
                  o.handover || o.notes ? (
                    <div key={idx}>
                      {o.handover && (
                        <div className="delivery-field">
                          <div className="lbl">
                            {prefix(idx + 1)}How it was delivered
                          </div>
                          <div className="val">{o.handover}</div>
                        </div>
                      )}
                      {o.notes && (
                        <div className="delivery-field">
                          <div className="lbl">{prefix(idx + 1)}Key notes</div>
                          <div className="val long">{o.notes}</div>
                        </div>
                      )}
                    </div>
                  ) : null
                );
              })()}
            </div>
          );
        })
      )}
    </>
  );
}
