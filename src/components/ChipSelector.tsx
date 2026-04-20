import { useStore } from '../state';

interface Props {
  selected: string[];
  onChange: (selected: string[]) => void;
  emptyMessage?: string;
}

export default function ChipSelector({ selected, onChange, emptyMessage }: Props) {
  const { state } = useStore();

  if (!state.skills.length) {
    return (
      <div className="chip-box">
        <div className="chip-box-empty">
          {emptyMessage ||
            'No skills in the master list yet. Add some in the Skills tab first.'}
        </div>
      </div>
    );
  }

  function toggle(skill: string) {
    if (selected.includes(skill)) onChange(selected.filter((s) => s !== skill));
    else onChange([...selected, skill]);
  }

  return (
    <div className="chip-box">
      {state.skills.map((s) => (
        <span
          key={s}
          className={`skill-pick ${selected.includes(s) ? 'picked' : ''}`}
          onClick={() => toggle(s)}
        >
          {s}
        </span>
      ))}
    </div>
  );
}
