"use client";

type TextAreaFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

export default function TextAreaField({ label, value, onChange }: TextAreaFieldProps) {
  return (
    <div className="admin-field">
      <label>{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
