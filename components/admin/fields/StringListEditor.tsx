"use client";

type StringListEditorProps = {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
};

export default function StringListEditor({ label, items, onChange, placeholder }: StringListEditorProps) {
  const update = (i: number, value: string) => {
    onChange(items.map((item, idx) => (idx === i ? value : item)));
  };
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const add = () => onChange([...items, ""]);

  return (
    <div className="admin-field">
      <label>{label}</label>
      <div className="admin-list-editor">
        {items.map((item, i) => (
          <div className="admin-list-row" key={i}>
            <input
              type="text"
              placeholder={placeholder}
              value={item}
              onChange={(e) => update(i, e.target.value)}
            />
            <button
              type="button"
              className="admin-btn admin-btn-icon admin-btn-danger"
              onClick={() => remove(i)}
              aria-label="Quitar línea"
            >
              ✕
            </button>
          </div>
        ))}
        <button type="button" className="admin-btn" onClick={add}>
          + Agregar línea
        </button>
      </div>
    </div>
  );
}
