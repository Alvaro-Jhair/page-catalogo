"use client";

type TextFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

export default function TextField({ label, value, onChange }: TextFieldProps) {
  return (
    <div className="admin-field">
      <label>{label}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
