import { useState, useRef } from "react";
import type { Aircraft, LogbookEntry, InspectionType, CertPrivilege, LimitationCode, TimeInService, TechnicianSignature, AttachedImage } from "../App";

type Props = {
  aircraft: Aircraft;
  entries: LogbookEntry[];
  onAddEntry: (entry: Omit<LogbookEntry, "id">) => void;
  onUpdateEntry: (id: string, update: Pick<LogbookEntry, "workNotes" | "images">) => void;
  onDeleteEntry: (id: string) => void;
};

const INSPECTION_LABELS: Record<InspectionType, string> = {
  annual: "Annual Inspection",
  "100_hour": "100-Hour Inspection",
  progressive: "Progressive Inspection",
  other: "Other",
};

const INSPECTION_COLORS: Record<InspectionType, { bg: string; text: string; border: string }> = {
  annual: { bg: "#1a3a5c14", text: "var(--color-primary)", border: "var(--color-primary)" },
  "100_hour": { bg: "#8b691414", text: "var(--color-status-pending)", border: "var(--color-status-pending)" },
  progressive: { bg: "#1a6b4a14", text: "var(--color-status-bulletin)", border: "var(--color-status-bulletin)" },
  other: { bg: "var(--color-secondary)", text: "var(--color-muted-foreground)", border: "var(--color-border)" },
};

const LIMITATION_LABELS: Record<LimitationCode, string> = {
  A: "A — Airplane",
  P: "P — Powered Parachute",
  GL: "GL — Glider",
};

// ─── Shared image uploader ─────────────────────────────────────────────────────
function ImageUploader({ images, onChange }: { images: AttachedImage[]; onChange: (imgs: AttachedImage[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img: AttachedImage = {
          id: `${Date.now()}-${Math.random()}`,
          name: file.name,
          dataUrl: e.target?.result as string,
          uploadedAt: new Date().toISOString().split("T")[0],
        };
        onChange([...images, img]);
      };
      reader.readAsDataURL(file);
    });
  };

  return (
    <div>
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {images.map((img) => (
            <div key={img.id} className="relative group" style={{ width: "80px", height: "80px" }}>
              <img src={img.dataUrl} alt={img.name} className="w-full h-full object-cover border cursor-pointer" style={{ borderColor: "var(--color-border)" }} onClick={() => setLightbox(img.dataUrl)} />
              <button onClick={() => onChange(images.filter((i) => i.id !== img.id))} className="absolute top-0.5 right-0.5 w-5 h-5 flex items-center justify-center text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: "var(--color-status-alert)", color: "white" }}>✕</button>
              <div className="absolute bottom-0 left-0 right-0 px-1 py-0.5 text-white truncate" style={{ backgroundColor: "rgba(0,0,0,0.55)", fontSize: "8px" }}>{img.name}</div>
            </div>
          ))}
        </div>
      )}
      <div
        className="border-2 border-dashed px-4 py-3 text-center cursor-pointer transition-colors"
        style={{ borderColor: "var(--color-border)" }}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--color-primary)")}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
      >
        <p className="text-xs" style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-mono)" }}>Click or drag images here · PNG, JPG, PDF</p>
        <input ref={inputRef} type="file" accept="image/*,.pdf" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
      </div>
      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.85)" }} onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="Preview" className="max-w-3xl max-h-screen object-contain" style={{ maxHeight: "90vh" }} />
          <button className="absolute top-4 right-6 text-white text-2xl font-bold opacity-70 hover:opacity-100" onClick={() => setLightbox(null)}>✕</button>
        </div>
      )}
    </div>
  );
}

// ─── Entry card ────────────────────────────────────────────────────────────────
function EntryCard({
  entry,
  onUpdateEntry,
  onDelete,
}: {
  entry: LogbookEntry;
  onUpdateEntry: (id: string, update: Pick<LogbookEntry, "workNotes" | "images">) => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [draftNotes, setDraftNotes] = useState(entry.workNotes);
  const [draftImages, setDraftImages] = useState<AttachedImage[]>(entry.images);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const ic = INSPECTION_COLORS[entry.inspectionType];

  const saveNotes = () => {
    onUpdateEntry(entry.id, { workNotes: draftNotes, images: draftImages });
    setEditingNotes(false);
  };

  const cancelNotes = () => {
    setDraftNotes(entry.workNotes);
    setDraftImages(entry.images);
    setEditingNotes(false);
  };

  const SL = ({ children }: { children: React.ReactNode }) => (
    <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ fontFamily: "var(--font-mono)", color: "var(--color-muted-foreground)", fontSize: "9px" }}>{children}</p>
  );

  return (
    <div className="border transition-all" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
      {/* Collapsed header */}
      <div className="px-5 py-4 cursor-pointer select-none" onClick={() => !editingNotes && setExpanded(!expanded)}>
        <div className="flex items-start gap-4">
          <div className="w-1 self-stretch shrink-0" style={{ backgroundColor: ic.border }} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-xs px-2 py-0.5 font-semibold border shrink-0" style={{ fontFamily: "var(--font-mono)", backgroundColor: ic.bg, color: ic.text, borderColor: ic.border, fontSize: "10px" }}>{INSPECTION_LABELS[entry.inspectionType]}</span>
              <span className="font-semibold" style={{ fontFamily: "var(--font-mono)", color: "var(--color-primary)" }}>{entry.completionDate}</span>
              {entry.images.length > 0 && (
                <span className="text-xs px-1.5 py-0.5 border" style={{ fontFamily: "var(--font-mono)", borderColor: "var(--color-border)", color: "var(--color-muted-foreground)", fontSize: "10px" }}>📎 {entry.images.length}</span>
              )}
            </div>
            <div className="flex items-center gap-5 mb-2 flex-wrap">
              {[
                { label: "A/C TT", value: entry.timeInService.aircraft },
                { label: "Eng TT", value: entry.timeInService.engine },
                { label: "Prop TT", value: entry.timeInService.propeller },
                ...(entry.timeInService.rotor ? [{ label: "Rotor TT", value: entry.timeInService.rotor }] : []),
              ].filter((f) => f.value).map((f) => (
                <div key={f.label} className="flex items-baseline gap-1.5">
                  <span className="text-xs" style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-mono)", fontSize: "10px" }}>{f.label}</span>
                  <span className="text-sm font-bold" style={{ fontFamily: "var(--font-mono)" }}>{f.value} <span className="font-normal text-xs" style={{ color: "var(--color-muted-foreground)" }}>hrs</span></span>
                </div>
              ))}
            </div>
            <p className="text-sm leading-relaxed" style={{ display: expanded ? "none" : "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" } as React.CSSProperties}>
              {entry.description}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <div className="text-right">
              <p className="text-sm font-semibold">{entry.signature.name}</p>
              <p className="text-xs" style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-mono)", fontSize: "10px" }}>{entry.signature.certPrivilege} · #{entry.signature.licenseNumber}</p>
            </div>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transform: expanded ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s", color: "var(--color-muted-foreground)" }}>
              <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>

      {/* Expanded */}
      {expanded && (
        <div className="border-t" style={{ borderColor: "var(--color-border)" }}>
          {/* Description */}
          <div className="px-5 py-4 border-b" style={{ borderColor: "var(--color-border)" }}>
            <SL>Description of Work Performed</SL>
            <p className="text-sm leading-relaxed">{entry.description}</p>
          </div>

          {/* Time in service + Signature */}
          <div className="grid grid-cols-2 border-b" style={{ borderColor: "var(--color-border)" }}>
            <div className="px-5 py-4">
              <SL>Time in Service</SL>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                {[
                  { label: "Aircraft Total Time", value: entry.timeInService.aircraft },
                  { label: "Engine Total Time", value: entry.timeInService.engine },
                  { label: "Propeller Total Time", value: entry.timeInService.propeller },
                  ...(entry.timeInService.rotor ? [{ label: "Rotor Total Time", value: entry.timeInService.rotor }] : []),
                ].filter((f) => f.value).map((f) => (
                  <div key={f.label}>
                    <p className="text-xs mb-0.5" style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-mono)", fontSize: "10px" }}>{f.label}</p>
                    <p className="text-base font-bold" style={{ fontFamily: "var(--font-mono)", color: "var(--color-primary)" }}>{f.value} <span className="text-xs font-normal" style={{ color: "var(--color-muted-foreground)" }}>hrs</span></p>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-5 py-4 border-l" style={{ borderColor: "var(--color-border)" }}>
              <SL>Technician Signature</SL>
              <div className="space-y-2">
                {[
                  { label: "Name", value: entry.signature.name },
                  { label: "License No.", value: entry.signature.licenseNumber, mono: true },
                  { label: "Certification", value: entry.signature.certPrivilege, mono: true },
                  { label: "Rating", value: entry.signature.rating },
                  { label: "Limitation", value: entry.signature.limitation.map((l) => LIMITATION_LABELS[l]).join(" · "), mono: true },
                ].map((f) => (
                  <div key={f.label} className="flex items-baseline gap-2">
                    <span className="text-xs shrink-0 w-24" style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-mono)", fontSize: "10px" }}>{f.label}</span>
                    <span className="text-sm font-medium" style={{ fontFamily: f.mono ? "var(--font-mono)" : "inherit" }}>{f.value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t" style={{ borderColor: "var(--color-border)" }}>
                <div className="h-8 border-b" style={{ borderColor: "var(--color-muted)" }} />
                <p className="text-xs mt-1" style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-mono)", fontSize: "9px" }}>SIGNATURE / DATE</p>
              </div>
            </div>
          </div>

          {/* Work notes + images — editable */}
          <div className="px-5 py-4 border-b" style={{ borderColor: "var(--color-border)" }}>
            <div className="flex items-center justify-between mb-3">
              <SL>Work Notes &amp; Photos</SL>
              {!editingNotes && (
                <button
                  onClick={() => { setDraftNotes(entry.workNotes); setDraftImages([...entry.images]); setEditingNotes(true); }}
                  className="text-xs px-3 py-1 border transition-all"
                  style={{ fontFamily: "var(--font-mono)", borderColor: "var(--color-border)", color: "var(--color-muted-foreground)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-secondary)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  Edit
                </button>
              )}
            </div>

            {editingNotes ? (
              <div className="space-y-4">
                <textarea
                  value={draftNotes}
                  onChange={(e) => setDraftNotes(e.target.value)}
                  placeholder="Additional notes about work performed, discrepancies, findings…"
                  rows={4}
                  className="w-full px-3 py-2 text-sm border outline-none resize-y"
                  style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-background)", color: "var(--color-foreground)" }}
                />
                <ImageUploader images={draftImages} onChange={setDraftImages} />
                <div className="flex gap-3">
                  <button onClick={saveNotes} className="px-4 py-2 text-xs font-semibold" style={{ backgroundColor: "var(--color-primary)", color: "white", fontFamily: "var(--font-mono)" }}>Save</button>
                  <button onClick={cancelNotes} className="px-3 py-2 text-xs border" style={{ borderColor: "var(--color-border)", fontFamily: "var(--font-mono)" }}>Cancel</button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {entry.workNotes ? (
                  <p className="text-sm leading-relaxed">{entry.workNotes}</p>
                ) : (
                  <p className="text-xs italic" style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-mono)" }}>No work notes recorded. Click Edit to add notes or photos.</p>
                )}
                {entry.images.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {entry.images.map((img) => (
                      <img key={img.id} src={img.dataUrl} alt={img.name} className="border object-cover cursor-pointer" style={{ width: "80px", height: "80px", borderColor: "var(--color-border)" }}
                        onClick={() => { setDraftNotes(entry.workNotes); setDraftImages([...entry.images]); setEditingNotes(true); }} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Delete */}
          <div className="px-5 py-3 flex justify-end gap-2" style={{ backgroundColor: "var(--color-secondary)" }}>
            {confirmDelete ? (
              <>
                <span className="text-xs self-center mr-2" style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-mono)" }}>Delete this entry?</span>
                <button onClick={onDelete} className="px-4 py-1.5 text-xs font-semibold" style={{ backgroundColor: "var(--color-status-alert)", color: "white", fontFamily: "var(--font-mono)" }}>Confirm Delete</button>
                <button onClick={() => setConfirmDelete(false)} className="px-3 py-1.5 text-xs border" style={{ borderColor: "var(--color-border)", fontFamily: "var(--font-mono)" }}>Cancel</button>
              </>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="px-4 py-1.5 text-xs border transition-all"
                style={{ borderColor: "var(--color-border)", color: "var(--color-muted-foreground)", fontFamily: "var(--font-mono)" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--color-status-alert)"; e.currentTarget.style.color = "var(--color-status-alert)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.color = "var(--color-muted-foreground)"; }}
              >Delete Entry</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Add entry form data ───────────────────────────────────────────────────────
type EntryFormData = {
  inspectionType: InspectionType;
  description: string;
  completionDate: string;
  timeInService: TimeInService;
  signature: TechnicianSignature;
  workNotes: string;
};

const EMPTY_FORM: EntryFormData = {
  inspectionType: "annual",
  description: "",
  completionDate: "",
  timeInService: { aircraft: "", engine: "", propeller: "", rotor: "" },
  signature: { name: "", licenseNumber: "", certPrivilege: "A&P", rating: "", limitation: ["A"] },
  workNotes: "",
};

type FormErrors = Partial<Record<string, string>>;

// ─── Main view ─────────────────────────────────────────────────────────────────
export default function LogbookView({ aircraft, entries, onAddEntry, onUpdateEntry, onDeleteEntry }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<EntryFormData>(EMPTY_FORM);
  const [formImages, setFormImages] = useState<AttachedImage[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [sectionFilter, setSectionFilter] = useState<InspectionType | "all">("all");

  const setField = (path: string, value: string) => {
    setForm((prev) => {
      const parts = path.split(".");
      if (parts.length === 1) return { ...prev, [path]: value };
      if (parts[0] === "timeInService") return { ...prev, timeInService: { ...prev.timeInService, [parts[1]]: value } };
      if (parts[0] === "signature") return { ...prev, signature: { ...prev.signature, [parts[1]]: value } };
      return prev;
    });
    setErrors((prev) => ({ ...prev, [path]: undefined }));
  };

  const toggleLimitation = (code: LimitationCode) => {
    setForm((prev) => {
      const current = prev.signature.limitation;
      const next = current.includes(code) ? current.filter((l) => l !== code) : [...current, code];
      return { ...prev, signature: { ...prev.signature, limitation: next } };
    });
  };

  const validate = (): boolean => {
    const errs: FormErrors = {};
    if (!form.description.trim()) errs.description = "Required";
    if (!form.completionDate) errs.completionDate = "Required";
    if (!form.timeInService.aircraft) errs["timeInService.aircraft"] = "Required";
    if (!form.timeInService.engine) errs["timeInService.engine"] = "Required";
    if (!form.signature.name.trim()) errs["signature.name"] = "Required";
    if (!form.signature.licenseNumber.trim()) errs["signature.licenseNumber"] = "Required";
    if (!form.signature.rating.trim()) errs["signature.rating"] = "Required";
    if (form.signature.limitation.length === 0) errs["signature.limitation"] = "Select at least one";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onAddEntry({ ...form, aircraftId: aircraft.id, images: formImages });
    setForm(EMPTY_FORM);
    setFormImages([]);
    setShowForm(false);
  };

  const annuals = entries.filter((e) => e.inspectionType === "annual");
  const hundreds = entries.filter((e) => e.inspectionType === "100_hour");
  const others = entries.filter((e) => e.inspectionType !== "annual" && e.inspectionType !== "100_hour");

  const filtered = sectionFilter === "all" ? entries : entries.filter((e) => e.inspectionType === sectionFilter);
  const sorted = [...filtered].sort((a, b) => b.completionDate.localeCompare(a.completionDate));

  const InputCls = "w-full px-3 py-2 text-sm border outline-none transition-all";
  const iStyle = (key: string) => ({
    backgroundColor: "var(--color-background)",
    borderColor: errors[key] ? "var(--color-status-alert)" : "var(--color-border)",
    color: "var(--color-foreground)",
  });
  const Label = ({ children }: { children: React.ReactNode }) => (
    <label className="block text-xs font-semibold tracking-widest uppercase mb-1.5" style={{ fontFamily: "var(--font-mono)", color: "var(--color-muted-foreground)", fontSize: "10px" }}>{children}</label>
  );
  const Err = ({ k }: { k: string }) => errors[k] ? <p className="mt-1 text-xs" style={{ color: "var(--color-status-alert)", fontFamily: "var(--font-mono)" }}>{errors[k]}</p> : null;

  const SectionDivider = ({ label }: { label: string }) => (
    <div className="flex items-center gap-3 mb-3">
      <h4 className="text-xs font-bold tracking-widest uppercase" style={{ fontFamily: "var(--font-mono)", color: "var(--color-muted-foreground)", fontSize: "9px" }}>{label}</h4>
      <div className="flex-1 h-px" style={{ backgroundColor: "var(--color-border)" }} />
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-6 py-6">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Annual Inspections", count: annuals.length, last: annuals.sort((a, b) => b.completionDate.localeCompare(a.completionDate))[0]?.completionDate, color: "var(--color-primary)" },
          { label: "100-Hour Inspections", count: hundreds.length, last: hundreds.sort((a, b) => b.completionDate.localeCompare(a.completionDate))[0]?.completionDate, color: "var(--color-status-pending)" },
          { label: "Other Entries", count: others.length, last: others.sort((a, b) => b.completionDate.localeCompare(a.completionDate))[0]?.completionDate, color: "var(--color-muted-foreground)" },
        ].map((s) => (
          <div key={s.label} className="px-5 py-4 border" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
            <div className="text-2xl font-bold mb-1" style={{ fontFamily: "var(--font-mono)", color: s.color }}>{s.count}</div>
            <div className="text-xs tracking-wider uppercase mb-1" style={{ fontFamily: "var(--font-mono)", color: "var(--color-muted-foreground)", fontSize: "10px" }}>{s.label}</div>
            {s.last && <div className="text-xs" style={{ fontFamily: "var(--font-mono)", color: "var(--color-muted-foreground)", fontSize: "10px" }}>Last: {s.last}</div>}
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-0 border-b" style={{ borderColor: "var(--color-border)" }}>
          {([["all", "All", entries.length], ["annual", "Annual", annuals.length], ["100_hour", "100-Hour", hundreds.length], ["other", "Other", others.length]] as [InspectionType | "all", string, number][]).map(([val, label, count]) => {
            const active = sectionFilter === val;
            return (
              <button
                key={val}
                onClick={() => setSectionFilter(val)}
                className="px-4 py-2 text-xs font-semibold tracking-wide border-b-2 -mb-px transition-all flex items-center gap-1.5"
                style={{ fontFamily: "var(--font-mono)", borderColor: active ? "var(--color-accent)" : "transparent", color: active ? "var(--color-foreground)" : "var(--color-muted-foreground)" }}
              >
                {label}
                <span style={{ backgroundColor: active ? "var(--color-accent)" : "var(--color-secondary)", color: active ? "white" : "var(--color-muted-foreground)", fontSize: "10px", padding: "0 5px" }}>{count}</span>
              </button>
            );
          })}
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setForm(EMPTY_FORM); setFormImages([]); setErrors({}); }}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold tracking-wide transition-all"
          style={{ backgroundColor: "var(--color-accent)", color: "white" }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          <svg width="11" height="11" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" /></svg>
          Add Entry
        </button>
      </div>

      {/* Add Entry form */}
      {showForm && (
        <div className="mb-5 border p-6" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-ring)", borderWidth: "2px" }}>
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-xs font-bold tracking-widest uppercase" style={{ fontFamily: "var(--font-mono)", color: "var(--color-muted-foreground)" }}>New Logbook Entry</h3>
            <button onClick={() => setShowForm(false)} style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-mono)", fontSize: "12px" }}>✕ Cancel</button>
          </div>

          {/* Section 1: Inspection details */}
          <div className="mb-5">
            <SectionDivider label="Inspection Details" />
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Type of Inspection</Label>
                <select value={form.inspectionType} onChange={(e) => setField("inspectionType", e.target.value)} className={InputCls} style={iStyle("inspectionType")}>
                  <option value="annual">Annual Inspection</option>
                  <option value="100_hour">100-Hour Inspection</option>
                  <option value="progressive">Progressive Inspection</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <Label>Date of Completion</Label>
                <input type="date" value={form.completionDate} onChange={(e) => setField("completionDate", e.target.value)} className={InputCls} style={iStyle("completionDate")} />
                <Err k="completionDate" />
              </div>
              <div />
              <div className="col-span-3">
                <Label>Description of Work Performed</Label>
                <textarea value={form.description} onChange={(e) => setField("description", e.target.value)} placeholder="Describe all work performed, parts replaced, systems inspected, ADs complied with, and findings…" rows={5} className={`${InputCls} resize-y`} style={iStyle("description")} />
                <Err k="description" />
              </div>
            </div>
          </div>

          {/* Section 2: Time in service */}
          <div className="mb-5">
            <SectionDivider label="Time in Service" />
            <div className="grid grid-cols-4 gap-4">
              {[
                { key: "timeInService.aircraft", label: "Aircraft Total Time *", val: form.timeInService.aircraft },
                { key: "timeInService.engine", label: "Engine Total Time *", val: form.timeInService.engine },
                { key: "timeInService.propeller", label: "Propeller Total Time", val: form.timeInService.propeller },
                { key: "timeInService.rotor", label: "Rotor Total Time", val: form.timeInService.rotor },
              ].map((f) => (
                <div key={f.key}>
                  <Label>{f.label}</Label>
                  <div className="relative">
                    <input type="text" value={f.val} onChange={(e) => setField(f.key, e.target.value)} placeholder="0.0" className={`${InputCls} pr-10`} style={{ ...iStyle(f.key), fontFamily: "var(--font-mono)" }} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-mono)" }}>hrs</span>
                  </div>
                  <Err k={f.key} />
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Signature */}
          <div className="mb-5">
            <SectionDivider label="Technician Signature" />
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Name *</Label>
                <input type="text" value={form.signature.name} onChange={(e) => setField("signature.name", e.target.value)} placeholder="Full name" className={InputCls} style={iStyle("signature.name")} />
                <Err k="signature.name" />
              </div>
              <div>
                <Label>License Number *</Label>
                <input type="text" value={form.signature.licenseNumber} onChange={(e) => setField("signature.licenseNumber", e.target.value)} placeholder="FAA certificate #" className={InputCls} style={{ ...iStyle("signature.licenseNumber"), fontFamily: "var(--font-mono)" }} />
                <Err k="signature.licenseNumber" />
              </div>
              <div>
                <Label>Certification Privilege</Label>
                <div className="flex gap-2">
                  {(["A&P", "LSRM"] as CertPrivilege[]).map((c) => (
                    <button key={c} type="button" onClick={() => setField("signature.certPrivilege", c)} className="flex-1 py-2 text-xs font-bold border transition-all" style={{ fontFamily: "var(--font-mono)", backgroundColor: form.signature.certPrivilege === c ? "var(--color-primary)" : "transparent", color: form.signature.certPrivilege === c ? "white" : "var(--color-foreground)", borderColor: form.signature.certPrivilege === c ? "var(--color-primary)" : "var(--color-border)" }}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div className="col-span-2">
                <Label>Rating *</Label>
                <input type="text" value={form.signature.rating} onChange={(e) => setField("signature.rating", e.target.value)} placeholder="e.g. Airframe & Powerplant" className={InputCls} style={iStyle("signature.rating")} />
                <Err k="signature.rating" />
              </div>
              <div>
                <Label>Limitation *</Label>
                <div className="flex gap-2">
                  {(["A", "P", "GL"] as LimitationCode[]).map((code) => (
                    <button key={code} type="button" onClick={() => toggleLimitation(code)} className="flex-1 py-2 text-xs font-bold border transition-all" style={{ fontFamily: "var(--font-mono)", backgroundColor: form.signature.limitation.includes(code) ? "var(--color-primary)" : "transparent", color: form.signature.limitation.includes(code) ? "white" : "var(--color-foreground)", borderColor: form.signature.limitation.includes(code) ? "var(--color-primary)" : "var(--color-border)" }}>
                      {code}
                    </button>
                  ))}
                </div>
                <Err k="signature.limitation" />
                <p className="mt-1 text-xs" style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-mono)", fontSize: "9px" }}>A=Airplane · P=Powered Parachute · GL=Glider</p>
              </div>
              <div className="col-span-3">
                <div className="p-4 border" style={{ backgroundColor: "var(--color-background)", borderColor: "var(--color-border)" }}>
                  <div className="h-8 border-b mb-1" style={{ borderColor: "var(--color-muted)" }} />
                  <div className="flex items-center justify-between text-xs" style={{ fontFamily: "var(--font-mono)", color: "var(--color-muted-foreground)", fontSize: "9px" }}>
                    <span>SIGNATURE</span>
                    <span>{form.signature.name || "NAME"} · {form.signature.certPrivilege} #{form.signature.licenseNumber || "LICENSE"} · {form.signature.limitation.join("/") || "LIMITATION"}</span>
                    <span>DATE: {form.completionDate || "—"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Work notes */}
          <div className="mb-5">
            <SectionDivider label="Work Notes" />
            <textarea value={form.workNotes} onChange={(e) => setField("workNotes", e.target.value)} placeholder="Additional notes: findings, measurements, deferred items, follow-up required…" rows={3} className={`${InputCls} resize-y`} style={iStyle("workNotes")} />
          </div>

          {/* Section 5: Images */}
          <div className="mb-5">
            <SectionDivider label="Photos &amp; Attachments" />
            <ImageUploader images={formImages} onChange={setFormImages} />
          </div>

          <div className="flex gap-3">
            <button onClick={handleSubmit} className="px-6 py-2.5 text-sm font-semibold tracking-wide" style={{ backgroundColor: "var(--color-primary)", color: "white", fontFamily: "var(--font-mono)" }}>Save Logbook Entry</button>
            <button onClick={() => setShowForm(false)} className="px-5 py-2.5 text-sm border" style={{ borderColor: "var(--color-border)", fontFamily: "var(--font-mono)" }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Entries list */}
      {sorted.length === 0 ? (
        <div className="py-20 text-center border" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
          <p className="text-sm mb-1" style={{ color: "var(--color-muted-foreground)" }}>No logbook entries yet.</p>
          <p className="text-xs" style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-mono)" }}>Add the first entry using the button above.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((entry) => (
            <EntryCard key={entry.id} entry={entry} onUpdateEntry={onUpdateEntry} onDelete={() => onDeleteEntry(entry.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
