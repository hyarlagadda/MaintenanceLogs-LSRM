import { useState } from "react";
import type { Aircraft } from "../App";

type FormData = Omit<Aircraft, "id" | "addedDate">;

type Props = {
  mode: "add" | "edit";
  initialData?: Aircraft;
  onSubmit: (data: FormData) => void;
  onCancel: () => void;
};

const PLANE_TYPES = [
  "Cessna 172S",
  "Cessna 172R",
  "Cessna 182T",
  "Cessna 206H",
  "Piper PA-28-181 Archer III",
  "Piper PA-28-161 Warrior III",
  "Piper PA-32-300 Cherokee Six",
  "Beechcraft G36 Bonanza",
  "Beechcraft A36 Bonanza",
  "Cirrus SR20",
  "Cirrus SR22",
  "Mooney M20J",
  "Grumman AA-5B Tiger",
  "Diamond DA40",
  "Other",
];

const EMPTY: FormData = {
  nNumber: "",
  serialNumber: "",
  planeType: "",
  ownerName: "",
  engineNumber: "",
  engineModel: "",
  year: "",
};

type FieldError = Partial<Record<keyof FormData, string>>;

export default function AddPlaneForm({ mode, initialData, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<FormData>(initialData ? {
    nNumber: initialData.nNumber,
    serialNumber: initialData.serialNumber,
    planeType: initialData.planeType,
    ownerName: initialData.ownerName,
    engineNumber: initialData.engineNumber,
    engineModel: initialData.engineModel,
    year: initialData.year,
  } : EMPTY);
  const [errors, setErrors] = useState<FieldError>({});

  const set = (key: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = (): boolean => {
    const errs: FieldError = {};
    if (!form.nNumber.trim()) errs.nNumber = "Required";
    else if (!/^N[0-9]{1,5}[A-Z]{0,2}$/i.test(form.nNumber.trim())) errs.nNumber = "Must be a valid N-number (e.g. N4872K)";
    if (!form.serialNumber.trim()) errs.serialNumber = "Required";
    if (!form.planeType.trim()) errs.planeType = "Required";
    if (!form.ownerName.trim()) errs.ownerName = "Required";
    if (!form.engineNumber.trim()) errs.engineNumber = "Required";
    if (!form.engineModel.trim()) errs.engineModel = "Required";
    if (!form.year.trim()) errs.year = "Required";
    else if (!/^\d{4}$/.test(form.year) || +form.year < 1940 || +form.year > new Date().getFullYear()) errs.year = "Enter a valid year";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({ ...form, nNumber: form.nNumber.toUpperCase().trim() });
    }
  };

  const Field = ({
    label, name, placeholder, hint, type = "text", children
  }: {
    label: string; name: keyof FormData; placeholder?: string; hint?: string; type?: string; children?: React.ReactNode;
  }) => (
    <div>
      <label className="block text-xs font-semibold tracking-widest uppercase mb-1.5" style={{ fontFamily: "var(--font-mono)", color: "var(--color-muted-foreground)" }}>
        {label}
      </label>
      {children ?? (
        <input
          type={type}
          value={form[name]}
          onChange={(e) => set(name, e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2.5 text-sm border outline-none transition-all"
          style={{
            backgroundColor: "var(--color-card)",
            borderColor: errors[name] ? "var(--color-status-alert)" : "var(--color-border)",
            color: "var(--color-foreground)",
            fontFamily: name === "nNumber" || name === "serialNumber" || name === "engineNumber" ? "var(--font-mono)" : "inherit",
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = errors[name] ? "var(--color-status-alert)" : "var(--color-ring)"; e.currentTarget.style.boxShadow = "0 0 0 2px rgba(26,58,92,0.12)"; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = errors[name] ? "var(--color-status-alert)" : "var(--color-border)"; e.currentTarget.style.boxShadow = "none"; }}
        />
      )}
      {errors[name] && <p className="mt-1 text-xs" style={{ color: "var(--color-status-alert)", fontFamily: "var(--font-mono)" }}>{errors[name]}</p>}
      {hint && !errors[name] && <p className="mt-1 text-xs" style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-mono)" }}>{hint}</p>}
    </div>
  );

  return (
    <div className="min-h-full">
      {/* Header */}
      <header style={{ backgroundColor: "var(--color-primary)", borderBottom: "3px solid var(--color-accent)" }}>
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center gap-4">
          <button
            onClick={onCancel}
            className="text-xs tracking-wide transition-opacity opacity-70 hover:opacity-100"
            style={{ color: "var(--color-primary-foreground)", fontFamily: "var(--font-mono)" }}
          >
            ← Back
          </button>
          <div style={{ fontFamily: "var(--font-serif)", color: "var(--color-primary-foreground)" }}>
            <div className="text-xs tracking-widest uppercase opacity-60" style={{ fontFamily: "var(--font-mono)" }}>Aircraft Maintenance</div>
            <h1 className="text-xl font-bold">{mode === "add" ? "Register New Aircraft" : "Edit Aircraft Record"}</h1>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} noValidate>
          {/* Section: Aircraft Identity */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-5">
              <h2 className="text-xs font-semibold tracking-widest uppercase" style={{ fontFamily: "var(--font-mono)", color: "var(--color-muted-foreground)" }}>Aircraft Identity</h2>
              <div className="flex-1 h-px" style={{ backgroundColor: "var(--color-border)" }} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="N-Number" name="nNumber" placeholder="N4872K" hint="FAA registration number">
                <input
                  type="text"
                  value={form.nNumber}
                  onChange={(e) => set("nNumber", e.target.value.toUpperCase())}
                  placeholder="N4872K"
                  className="w-full px-3 py-2.5 text-sm border outline-none transition-all uppercase"
                  style={{
                    backgroundColor: "var(--color-card)",
                    borderColor: errors.nNumber ? "var(--color-status-alert)" : "var(--color-border)",
                    color: "var(--color-foreground)",
                    fontFamily: "var(--font-mono)",
                    letterSpacing: "0.1em",
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = errors.nNumber ? "var(--color-status-alert)" : "var(--color-ring)"; e.currentTarget.style.boxShadow = "0 0 0 2px rgba(26,58,92,0.12)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = errors.nNumber ? "var(--color-status-alert)" : "var(--color-border)"; e.currentTarget.style.boxShadow = "none"; }}
                />
                {errors.nNumber && <p className="mt-1 text-xs" style={{ color: "var(--color-status-alert)", fontFamily: "var(--font-mono)" }}>{errors.nNumber}</p>}
                {!errors.nNumber && <p className="mt-1 text-xs" style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-mono)" }}>FAA registration number</p>}
              </Field>
              <Field label="Aircraft Serial Number" name="serialNumber" placeholder="17275872" />
            </div>
          </div>

          {/* Section: Aircraft Type & Owner */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-5">
              <h2 className="text-xs font-semibold tracking-widest uppercase" style={{ fontFamily: "var(--font-mono)", color: "var(--color-muted-foreground)" }}>Type & Ownership</h2>
              <div className="flex-1 h-px" style={{ backgroundColor: "var(--color-border)" }} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold tracking-widest uppercase mb-1.5" style={{ fontFamily: "var(--font-mono)", color: "var(--color-muted-foreground)" }}>Aircraft Type</label>
                <select
                  value={form.planeType}
                  onChange={(e) => set("planeType", e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border outline-none transition-all appearance-none"
                  style={{
                    backgroundColor: "var(--color-card)",
                    borderColor: errors.planeType ? "var(--color-status-alert)" : "var(--color-border)",
                    color: form.planeType ? "var(--color-foreground)" : "var(--color-muted-foreground)",
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%236b6b60' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 12px center",
                    paddingRight: "36px",
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = errors.planeType ? "var(--color-status-alert)" : "var(--color-ring)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = errors.planeType ? "var(--color-status-alert)" : "var(--color-border)"; }}
                >
                  <option value="">Select aircraft type…</option>
                  {PLANE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                {errors.planeType && <p className="mt-1 text-xs" style={{ color: "var(--color-status-alert)", fontFamily: "var(--font-mono)" }}>{errors.planeType}</p>}
              </div>
              <Field label="Year" name="year" placeholder="2004" type="text" hint="Manufacturing year" />
              <div className="col-span-2">
                <Field label="Owner Name" name="ownerName" placeholder="Ridgeline Aviation LLC" hint="Individual or organization name" />
              </div>
            </div>
          </div>

          {/* Section: Engine */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-5">
              <h2 className="text-xs font-semibold tracking-widest uppercase" style={{ fontFamily: "var(--font-mono)", color: "var(--color-muted-foreground)" }}>Engine Information</h2>
              <div className="flex-1 h-px" style={{ backgroundColor: "var(--color-border)" }} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Engine Model" name="engineModel" placeholder="Lycoming IO-360-L2A" hint="Make and model designation" />
              <Field label="Engine Serial Number" name="engineNumber" placeholder="636145-A" />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              className="px-8 py-3 text-sm font-semibold tracking-wide transition-all"
              style={{ backgroundColor: "var(--color-primary)", color: "var(--color-primary-foreground)" }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              {mode === "add" ? "Register Aircraft" : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 text-sm border transition-all"
              style={{ borderColor: "var(--color-border)", color: "var(--color-foreground)" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-secondary)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
