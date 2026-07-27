"use client";

type SelectOption = string | { value: string; label: string };

type SelectFieldProps = {
  label: string;
  value: string;
  options: readonly SelectOption[];
  onChange: (value: string) => void;
};

function optionValue(opt: SelectOption): string {
  return typeof opt === "string" ? opt : opt.value;
}

function optionLabel(opt: SelectOption): string {
  return typeof opt === "string" ? opt : opt.label;
}

export default function SelectField({ label, value, options, onChange }: SelectFieldProps) {
  return (
    <div className="admin-field">
      <label>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((opt) => (
          <option key={optionValue(opt)} value={optionValue(opt)}>
            {optionLabel(opt)}
          </option>
        ))}
      </select>
    </div>
  );
}
