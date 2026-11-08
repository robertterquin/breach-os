type FileTabsProps = {
  names: string[];
  selected: string;
  onSelect: (name: string) => void;
  label: string;
};

/** A row of pressed/unpressed buttons for picking a file (or a challenge). */
export function FileTabs({ names, selected, onSelect, label }: FileTabsProps) {
  return (
    <div className="file-tabs" role="group" aria-label={label}>
      {names.map((name) => (
        <button
          key={name}
          type="button"
          className="btn"
          aria-pressed={name === selected}
          onClick={() => onSelect(name)}
        >
          {name}
        </button>
      ))}
    </div>
  );
}
