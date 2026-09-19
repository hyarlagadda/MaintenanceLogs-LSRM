import { useState, useRef } from "react";
import type { Aircraft, MaintenanceDoc, DocType, DocStatus, DocAppliesTo, Part, AttachedImage } from "../App";

type Props = {
  aircraft: Aircraft;
  docs: MaintenanceDoc[];
  onBack: () => void;
  onAddDoc: (doc: Omit<MaintenanceDoc, "id">) => void;
  onUpdateDoc: (docId: string, update: Pick<MaintenanceDoc, "status" | "notes" | "parts" | "workNotes" | "images" | "timeToFix">) => void;
  onDeleteDoc: (docId: string) => void;
  embedded?: boolean;
};

const DOC_TYPE_LABELS: Record<DocType, string> = {
  safety_alert: "Safety Alert",
  service_bulletin: "Service Bulletin",
  service_notification: "Service Notification",
};

const DOC_TYPE_COLORS: Record<DocType, { bg: string; text: string; border: string }> = {
  safety_alert: { bg: "#c84b1114", text: "var(--color-status-alert)", border: "var(--color-status-alert)" },
  service_bulletin: { bg: "#1a3a5c14", text: "var(--color-primary)", border: "var(--color-primary)" },
  service_notification: { bg: "#8b691414", text: "var(--color-status-pending)", border: "var(--color-status-pending)" },
};

const STATUS_LABELS: Record<DocStatus, string> = {
  complied: "Complied",
  not_complied: "Not Complied",
  not_applicable: "N/A",
};

const STATUS_COLORS: Record<DocStatus, { bg: string; text: string; border: string }> = {
  complied: { bg: "#1a6b4a14", text: "var(--color-status-bulletin)", border: "var(--color-status-bulletin)" },
  not_complied: { bg: "#c84b1114", text: "var(--color-status-alert)", border: "var(--color-status-alert)" },
  not_applicable: { bg: "var(--color-secondary)", text: "var(--color-muted-foreground)", border: "var(--color-border)" },
};

type ViewMode = "by_system" | "all";

type NewDocForm = {
  type: DocType;
  number: string;
  title: string;
  issuer: string;
  issuedDate: string;
  appliesTo: DocAppliesTo;
  status: DocStatus;
  notes: string;
  parts: Part[];
  workNotes: string;
  timeToFix: string;
};

const EMPTY_FORM: NewDocForm = {
  type: "safety_alert",
  number: "",
  title: "",
  issuer: "",
  issuedDate: "",
  appliesTo: "airframe",
  status: "not_complied",
  notes: "",
  parts: [],
  workNotes: "",
  timeToFix: "",
};

const EMPTY_PART: Part = { partNumber: "", description: "", quantity: "1" };

// ─── Image uploader shared component ─────────────────────────────────────────
function ImageUploader({
  images,
  onChange,
}: {
  images: AttachedImage[];
  onChange: (imgs: AttachedImage[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const img: AttachedImage = {
          id: `${Date.now()}-${Math.random()}`,
          name: file.name,
          dataUrl,
          uploadedAt: new Date().toISOString().split("T")[0],
        };
        onChange([...images, img]);
      };
      reader.readAsDataURL(file);
    });
  };

  const remove = (id: string) => onChange(images.filter((i) => i.id !== id));

  return (
    <div>
      {/* Thumbnails */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {images.map((img) => (
            <div key={img.id} className="relative group" style={{ width: "80px", height: "80px" }}>
              <img
                src={img.dataUrl}
                alt={img.name}
                className="w-full h-full object-cover border cursor-pointer"
                style={{ borderColor: "var(--color-border)" }}
                onClick={() => setLightbox(img.dataUrl)}
              />
              <button
                onClick={() => remove(img.id)}
                className="absolute top-0.5 right-0.5 w-5 h-5 flex items-center justify-center text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ backgroundColor: "var(--color-status-alert)", color: "white" }}
              >✕</button>
              <div className="absolute bottom-0 left-0 right-0 px-1 py-0.5 text-white truncate" style={{ backgroundColor: "rgba(0,0,0,0.55)", fontSize: "8px" }}>{img.name}</div>
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      <div
        className="border-2 border-dashed px-4 py-3 text-center cursor-pointer transition-colors"
        style={{ borderColor: "var(--color-border)" }}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--color-primary)")}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
      >
        <p className="text-xs" style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-mono)" }}>
          Click or drag images here · PNG, JPG, PDF
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,.pdf"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.85)" }}
          onClick={() => setLightbox(null)}
        >
          <img src={lightbox} alt="Preview" className="max-w-3xl max-h-screen object-contain" style={{ maxHeight: "90vh" }} />
          <button className="absolute top-4 right-6 text-white text-2xl font-bold opacity-70 hover:opacity-100" onClick={() => setLightbox(null)}>✕</button>
        </div>
      )}
    </div>
  );
}

// ─── Parts table editor ────────────────────────────────────────────────────────
function PartsEditor({ parts, onChange }: { parts: Part[]; onChange: (p: Part[]) => void }) {
  const add = () => onChange([...parts, { ...EMPTY_PART }]);
  const remove = (i: number) => onChange(parts.filter((_, idx) => idx !== i));
  const update = (i: number, field: keyof Part, val: string) =>
    onChange(parts.map((p, idx) => (idx === i ? { ...p, [field]: val } : p)));

  return (
    <div>
      {parts.length > 0 && (
        <div className="mb-2 border" style={{ borderColor: "var(--color-border)" }}>
          {/* Header */}
          <div className="grid text-xs font-semibold tracking-widest uppercase px-3 py-1.5" style={{ gridTemplateColumns: "160px 1fr 70px 28px", gap: "8px", backgroundColor: "var(--color-secondary)", color: "var(--color-muted-foreground)", fontFamily: "var(--font-mono)", fontSize: "9px" }}>
            <span>Part Number</span><span>Description</span><span>Qty</span><span />
          </div>
          {parts.map((p, i) => (
            <div key={i} className="grid items-center px-3 py-1.5 border-t" style={{ gridTemplateColumns: "160px 1fr 70px 28px", gap: "8px", borderColor: "var(--color-border)" }}>
              <input
                value={p.partNumber}
                onChange={(e) => update(i, "partNumber", e.target.value)}
                placeholder="P/N"
                className="px-2 py-1 text-xs border outline-none w-full"
                style={{ fontFamily: "var(--font-mono)", borderColor: "var(--color-border)", backgroundColor: "var(--color-background)" }}
              />
              <input
                value={p.description}
                onChange={(e) => update(i, "description", e.target.value)}
                placeholder="Description"
                className="px-2 py-1 text-xs border outline-none w-full"
                style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-background)" }}
              />
              <input
                value={p.quantity}
                onChange={(e) => update(i, "quantity", e.target.value)}
                placeholder="1"
                className="px-2 py-1 text-xs border outline-none w-full text-center"
                style={{ fontFamily: "var(--font-mono)", borderColor: "var(--color-border)", backgroundColor: "var(--color-background)" }}
              />
              <button onClick={() => remove(i)} className="text-xs text-center transition-colors" style={{ color: "var(--color-muted-foreground)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-status-alert)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-muted-foreground)")}>✕</button>
            </div>
          ))}
        </div>
      )}
      <button
        onClick={add}
        className="flex items-center gap-1.5 text-xs px-3 py-1.5 border transition-colors"
        style={{ borderColor: "var(--color-border)", color: "var(--color-muted-foreground)", fontFamily: "var(--font-mono)" }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--color-secondary)"; e.currentTarget.style.color = "var(--color-foreground)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "var(--color-muted-foreground)"; }}
      >
        <svg width="10" height="10" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
        Add Part
      </button>
    </div>
  );
}

// ─── Single doc row ────────────────────────────────────────────────────────────
function DocRow({
  doc,
  onUpdateDoc,
  onDeleteDoc,
}: {
  doc: MaintenanceDoc;
  onUpdateDoc: (id: string, update: Pick<MaintenanceDoc, "status" | "notes" | "parts" | "workNotes" | "images" | "timeToFix">) => void;
  onDeleteDoc: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editStatus, setEditStatus] = useState<DocStatus>(doc.status);
  const [editNotes, setEditNotes] = useState(doc.notes);
  const [editParts, setEditParts] = useState<Part[]>(doc.parts);
  const [editWorkNotes, setEditWorkNotes] = useState(doc.workNotes);
  const [editImages, setEditImages] = useState<AttachedImage[]>(doc.images);
  const [editTimeToFix, setEditTimeToFix] = useState(doc.timeToFix);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const tc = DOC_TYPE_COLORS[doc.type];
  const sc = STATUS_COLORS[doc.status];

  const startEdit = () => {
    setEditStatus(doc.status);
    setEditNotes(doc.notes);
    setEditParts([...doc.parts]);
    setEditWorkNotes(doc.workNotes);
    setEditImages([...doc.images]);
    setEditTimeToFix(doc.timeToFix);
    setEditing(true);
    setExpanded(true);
  };

  const save = () => {
    onUpdateDoc(doc.id, {
      status: editStatus,
      notes: editNotes,
      parts: editParts,
      workNotes: editWorkNotes,
      images: editImages,
      timeToFix: editTimeToFix,
    });
    setEditing(false);
  };

  const cancel = () => {
    setEditStatus(doc.status);
    setEditNotes(doc.notes);
    setEditParts([...doc.parts]);
    setEditWorkNotes(doc.workNotes);
    setEditImages([...doc.images]);
    setEditTimeToFix(doc.timeToFix);
    setEditing(false);
  };

  const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ fontFamily: "var(--font-mono)", color: "var(--color-muted-foreground)", fontSize: "9px" }}>{children}</p>
  );

  return (
    <div className="border-b last:border-b-0 transition-colors" style={{ borderColor: "var(--color-border)" }}>
      {/* Collapsed header */}
      <div className="px-4 py-3 cursor-pointer select-none" onClick={() => !editing && setExpanded(!expanded)}>
        <div className="flex items-start gap-3">
          <div className="w-0.5 self-stretch shrink-0 mt-0.5 rounded" style={{ backgroundColor: tc.border, opacity: 0.6 }} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-xs px-1.5 py-0.5 font-medium shrink-0 border" style={{ fontFamily: "var(--font-mono)", backgroundColor: tc.bg, color: tc.text, borderColor: tc.border, fontSize: "10px" }}>
                {DOC_TYPE_LABELS[doc.type]}
              </span>
              <span className="text-sm font-bold tracking-tight" style={{ fontFamily: "var(--font-mono)", color: "var(--color-primary)" }}>{doc.number}</span>
              {doc.parts.length > 0 && (
                <span className="text-xs px-1.5 py-0.5 border" style={{ fontFamily: "var(--font-mono)", borderColor: "var(--color-border)", color: "var(--color-muted-foreground)", fontSize: "10px" }}>
                  {doc.parts.length} part{doc.parts.length !== 1 ? "s" : ""}
                </span>
              )}
              {doc.images.length > 0 && (
                <span className="text-xs px-1.5 py-0.5 border" style={{ fontFamily: "var(--font-mono)", borderColor: "var(--color-border)", color: "var(--color-muted-foreground)", fontSize: "10px" }}>
                  📎 {doc.images.length}
                </span>
              )}
              {doc.timeToFix && (
                <span className="text-xs px-1.5 py-0.5 border flex items-center gap-1" style={{ fontFamily: "var(--font-mono)", borderColor: "var(--color-border)", color: "var(--color-muted-foreground)", fontSize: "10px" }}>
                  ⏱ {doc.timeToFix} hrs
                </span>
              )}
            </div>
            <p className="text-sm font-medium leading-snug mb-1">{doc.title}</p>
            <div className="flex items-center gap-3 text-xs" style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-mono)" }}>
              <span>{doc.issuer}</span>
              <span style={{ color: "var(--color-border)" }}>·</span>
              <span>{doc.issuedDate}</span>
            </div>
            {!expanded && doc.notes && (
              <p className="mt-1.5 text-xs italic" style={{ color: "var(--color-muted-foreground)" }}>{doc.notes}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <span className="text-xs px-2 py-0.5 font-medium border" style={{ fontFamily: "var(--font-mono)", backgroundColor: sc.bg, color: sc.text, borderColor: sc.border, fontSize: "10px" }}>
              {STATUS_LABELS[doc.status]}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => { e.stopPropagation(); startEdit(); }}
                className="px-2.5 py-1 text-xs border transition-all"
                style={{ borderColor: "var(--color-border)", color: "var(--color-muted-foreground)", fontFamily: "var(--font-mono)", fontSize: "10px" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-secondary)")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                Update
              </button>
              {confirmDelete ? (
                <>
                  <button onClick={(e) => { e.stopPropagation(); onDeleteDoc(doc.id); }} className="px-2 py-1 text-xs font-semibold" style={{ backgroundColor: "var(--color-status-alert)", color: "white", fontFamily: "var(--font-mono)", fontSize: "10px" }}>Del</button>
                  <button onClick={(e) => { e.stopPropagation(); setConfirmDelete(false); }} className="px-2 py-1 text-xs border" style={{ borderColor: "var(--color-border)", fontFamily: "var(--font-mono)", fontSize: "10px" }}>✕</button>
                </>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }}
                  className="px-2 py-1 text-xs border transition-all"
                  style={{ borderColor: "var(--color-border)", color: "var(--color-muted-foreground)", fontFamily: "var(--font-mono)", fontSize: "10px" }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--color-status-alert)"; e.currentTarget.style.color = "var(--color-status-alert)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.color = "var(--color-muted-foreground)"; }}
                >✕</button>
              )}
            </div>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ transform: expanded ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s", color: "var(--color-muted-foreground)" }}>
              <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>

      {/* Expanded detail / edit panel */}
      {expanded && (
        <div className="border-t" style={{ borderColor: "var(--color-border)" }}>
          {editing ? (
            /* ─── EDIT MODE ─── */
            <div className="px-5 py-4 space-y-5" style={{ backgroundColor: "rgba(26,58,92,0.03)" }}>

              {/* Status + compliance notes */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <SectionLabel>Compliance Status</SectionLabel>
                  <div className="flex flex-col gap-1.5">
                    {(["not_complied", "complied", "not_applicable"] as DocStatus[]).map((s) => (
                      <button
                        key={s}
                        onClick={() => setEditStatus(s)}
                        className="px-3 py-2 text-xs font-medium text-left border transition-all"
                        style={{
                          fontFamily: "var(--font-mono)",
                          backgroundColor: editStatus === s ? STATUS_COLORS[s].bg : "var(--color-card)",
                          borderColor: editStatus === s ? STATUS_COLORS[s].border : "var(--color-border)",
                          color: editStatus === s ? STATUS_COLORS[s].text : "var(--color-foreground)",
                        }}
                      >
                        {STATUS_LABELS[s]}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="col-span-2">
                  <SectionLabel>Compliance Notes</SectionLabel>
                  <textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Date complied, reference, technician…"
                    rows={4}
                    className="w-full px-3 py-2 text-sm border outline-none resize-none"
                    style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)", color: "var(--color-foreground)" }}
                  />
                </div>
              </div>

              {/* Time to fix */}
              <div>
                <SectionLabel>Time to Fix (hours)</SectionLabel>
                <div className="flex items-center gap-2" style={{ maxWidth: "200px" }}>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={editTimeToFix}
                    onChange={(e) => setEditTimeToFix(e.target.value)}
                    placeholder="e.g. 2.5"
                    className="w-full px-3 py-2 text-sm border outline-none"
                    style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)", color: "var(--color-foreground)", fontFamily: "var(--font-mono)" }}
                  />
                  <span className="text-xs shrink-0" style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-mono)" }}>hrs</span>
                </div>
              </div>

              {/* Parts required */}
              <div>
                <SectionLabel>Parts Required for Remediation</SectionLabel>
                <PartsEditor parts={editParts} onChange={setEditParts} />
              </div>

              {/* Work notes */}
              <div>
                <SectionLabel>Work Notes</SectionLabel>
                <textarea
                  value={editWorkNotes}
                  onChange={(e) => setEditWorkNotes(e.target.value)}
                  placeholder="Describe work performed, findings, techniques used, measurements taken…"
                  rows={4}
                  className="w-full px-3 py-2 text-sm border outline-none resize-y"
                  style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)", color: "var(--color-foreground)" }}
                />
              </div>

              {/* Images */}
              <div>
                <SectionLabel>Photos &amp; Attachments</SectionLabel>
                <ImageUploader images={editImages} onChange={setEditImages} />
              </div>

              {/* Save / cancel */}
              <div className="flex gap-3 pt-1">
                <button onClick={save} className="px-5 py-2.5 text-xs font-semibold tracking-wide" style={{ backgroundColor: "var(--color-primary)", color: "white", fontFamily: "var(--font-mono)" }}>
                  Save Changes
                </button>
                <button onClick={cancel} className="px-4 py-2.5 text-xs border" style={{ borderColor: "var(--color-border)", fontFamily: "var(--font-mono)" }}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            /* ─── READ MODE ─── */
            <div className="px-5 py-4 space-y-4">
              {/* Time to fix + compliance notes row */}
              <div className="flex items-start gap-6 flex-wrap">
                {doc.timeToFix && (
                  <div>
                    <p className="text-xs font-semibold tracking-widest uppercase mb-1.5" style={{ fontFamily: "var(--font-mono)", color: "var(--color-muted-foreground)", fontSize: "9px" }}>Time to Fix</p>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-bold" style={{ fontFamily: "var(--font-mono)", color: "var(--color-primary)" }}>{doc.timeToFix}</span>
                      <span className="text-xs" style={{ fontFamily: "var(--font-mono)", color: "var(--color-muted-foreground)" }}>hrs</span>
                    </div>
                  </div>
                )}
                {doc.notes && (
                  <div className="flex-1" style={{ minWidth: "200px" }}>
                    <p className="text-xs font-semibold tracking-widest uppercase mb-1.5" style={{ fontFamily: "var(--font-mono)", color: "var(--color-muted-foreground)", fontSize: "9px" }}>Compliance Notes</p>
                    <p className="text-sm px-3 py-2 border-l-2 italic" style={{ borderColor: "var(--color-primary)", backgroundColor: "var(--color-secondary)", color: "var(--color-muted-foreground)" }}>{doc.notes}</p>
                  </div>
                )}
              </div>

              {/* Parts */}
              {doc.parts.length > 0 && (
                <div>
                  <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ fontFamily: "var(--font-mono)", color: "var(--color-muted-foreground)", fontSize: "9px" }}>Parts Required</p>
                  <div className="border" style={{ borderColor: "var(--color-border)" }}>
                    <div className="grid text-xs font-semibold tracking-widest uppercase px-3 py-1.5" style={{ gridTemplateColumns: "180px 1fr 60px", gap: "8px", backgroundColor: "var(--color-secondary)", color: "var(--color-muted-foreground)", fontFamily: "var(--font-mono)", fontSize: "9px" }}>
                      <span>Part Number</span><span>Description</span><span>Qty</span>
                    </div>
                    {doc.parts.map((p, i) => (
                      <div key={i} className="grid px-3 py-2 border-t items-center" style={{ gridTemplateColumns: "180px 1fr 60px", gap: "8px", borderColor: "var(--color-border)" }}>
                        <span className="text-sm font-medium" style={{ fontFamily: "var(--font-mono)" }}>{p.partNumber || "—"}</span>
                        <span className="text-sm">{p.description}</span>
                        <span className="text-sm text-center" style={{ fontFamily: "var(--font-mono)" }}>{p.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Work notes */}
              {doc.workNotes && (
                <div>
                  <p className="text-xs font-semibold tracking-widest uppercase mb-1.5" style={{ fontFamily: "var(--font-mono)", color: "var(--color-muted-foreground)", fontSize: "9px" }}>Work Notes</p>
                  <p className="text-sm leading-relaxed">{doc.workNotes}</p>
                </div>
              )}

              {/* Images */}
              {doc.images.length > 0 && (
                <div>
                  <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ fontFamily: "var(--font-mono)", color: "var(--color-muted-foreground)", fontSize: "9px" }}>Photos &amp; Attachments ({doc.images.length})</p>
                  <ImageUploader images={doc.images} onChange={(imgs) => onUpdateDoc(doc.id, { status: doc.status, notes: doc.notes, parts: doc.parts, workNotes: doc.workNotes, images: imgs, timeToFix: doc.timeToFix })} />
                </div>
              )}

              {(doc.parts.length === 0 && !doc.notes && !doc.workNotes && doc.images.length === 0) && (
                <p className="text-xs italic" style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-mono)" }}>No details recorded. Click Update to add work notes, parts, and photos.</p>
              )}

              <button
                onClick={startEdit}
                className="text-xs px-4 py-1.5 border transition-all"
                style={{ borderColor: "var(--color-border)", fontFamily: "var(--font-mono)", color: "var(--color-muted-foreground)" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-secondary)")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                Edit details
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── System section (airframe / engine) ───────────────────────────────────────
function SystemSection({
  title,
  system,
  docs,
  onUpdateDoc,
  onDeleteDoc,
}: {
  title: string;
  system: "airframe" | "engine";
  docs: MaintenanceDoc[];
  onUpdateDoc: (id: string, update: Pick<MaintenanceDoc, "status" | "notes" | "parts" | "workNotes" | "images" | "timeToFix">) => void;
  onDeleteDoc: (id: string) => void;
}) {
  const systemDocs = docs.filter((d) => d.appliesTo === system || d.appliesTo === "both");
  const pending = systemDocs.filter((d) => d.status === "not_complied");
  const completed = systemDocs.filter((d) => d.status !== "not_complied");
  const [showCompleted, setShowCompleted] = useState(true);

  return (
    <div className="border" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
      {/* System header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-secondary)" }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--color-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          {system === "airframe" ? (
            <><path d="M8 2L14 8H10V14H6V8H2L8 2Z" /><path d="M5 11H11" /></>
          ) : (
            <><ellipse cx="8" cy="8" rx="5" ry="3" /><path d="M3 8C3 10.8 13 10.8 13 8" /><path d="M3 8C3 5.2 13 5.2 13 8" /></>
          )}
        </svg>
        <h3 className="text-xs font-bold tracking-widest uppercase" style={{ fontFamily: "var(--font-mono)", color: "var(--color-primary)" }}>{title}</h3>
        <div className="flex items-center gap-2 ml-auto">
          {pending.length > 0 && (
            <span className="text-xs px-2 py-0.5 font-semibold" style={{ fontFamily: "var(--font-mono)", backgroundColor: "var(--color-status-alert)", color: "white", fontSize: "10px" }}>
              {pending.length} Pending
            </span>
          )}
          <span className="text-xs" style={{ fontFamily: "var(--font-mono)", color: "var(--color-muted-foreground)", fontSize: "10px" }}>{systemDocs.length} total</span>
        </div>
      </div>

      {systemDocs.length === 0 ? (
        <div className="px-4 py-8 text-center"><p className="text-xs" style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-mono)" }}>No documents for this system.</p></div>
      ) : (
        <>
          {pending.length > 0 && (
            <div>
              <div className="flex items-center gap-2 px-4 py-2 border-b" style={{ borderColor: "var(--color-border)", backgroundColor: "#c84b110a" }}>
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "var(--color-status-alert)" }} />
                <span className="text-xs font-semibold tracking-widest uppercase" style={{ fontFamily: "var(--font-mono)", color: "var(--color-status-alert)", fontSize: "10px" }}>
                  Pending — {pending.length} item{pending.length !== 1 ? "s" : ""}
                </span>
              </div>
              {pending.map((doc) => (
                <DocRow key={doc.id} doc={doc} onUpdateDoc={onUpdateDoc} onDeleteDoc={onDeleteDoc} />
              ))}
            </div>
          )}
          {completed.length > 0 && (
            <div>
              <button
                onClick={() => setShowCompleted(!showCompleted)}
                className="w-full flex items-center gap-2 px-4 py-2 border-b text-left transition-colors"
                style={{ borderColor: "var(--color-border)", backgroundColor: "#1a6b4a08" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1a6b4a12")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#1a6b4a08")}
              >
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "var(--color-status-bulletin)" }} />
                <span className="text-xs font-semibold tracking-widest uppercase" style={{ fontFamily: "var(--font-mono)", color: "var(--color-status-bulletin)", fontSize: "10px" }}>
                  Completed / N/A — {completed.length} item{completed.length !== 1 ? "s" : ""}
                </span>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="ml-auto" style={{ transform: showCompleted ? "rotate(0deg)" : "rotate(-90deg)", color: "var(--color-muted-foreground)" }}>
                  <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {showCompleted && completed.map((doc) => (
                <DocRow key={doc.id} doc={doc} onUpdateDoc={onUpdateDoc} onDeleteDoc={onDeleteDoc} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function MaintenanceDocs({ aircraft, docs, onBack, onAddDoc, onUpdateDoc, onDeleteDoc, embedded = false }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>("by_system");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDoc, setNewDoc] = useState<NewDocForm>(EMPTY_FORM);
  const [newDocImages, setNewDocImages] = useState<AttachedImage[]>([]);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof NewDocForm, string>>>({});
  const [allTypeFilter, setAllTypeFilter] = useState<DocType | "all">("all");
  const [showAllCompleted, setShowAllCompleted] = useState(true);

  const setField = (key: keyof NewDocForm, value: string) => {
    setNewDoc((prev) => ({ ...prev, [key]: value }));
    if (formErrors[key]) setFormErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validateDoc = (): boolean => {
    const errs: Partial<Record<keyof NewDocForm, string>> = {};
    if (!newDoc.number.trim()) errs.number = "Required";
    if (!newDoc.title.trim()) errs.title = "Required";
    if (!newDoc.issuer.trim()) errs.issuer = "Required";
    if (!newDoc.issuedDate) errs.issuedDate = "Required";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleAddDoc = () => {
    if (!validateDoc()) return;
    onAddDoc({ ...newDoc, aircraftId: aircraft.id, images: newDocImages });
    setNewDoc(EMPTY_FORM);
    setNewDocImages([]);
    setShowAddForm(false);
  };

  const pending = docs.filter((d) => d.status === "not_complied");
  const byType = (t: DocType) => docs.filter((d) => d.type === t);
  const pendingByType = (t: DocType) => docs.filter((d) => d.type === t && d.status === "not_complied");

  const InputCls = "w-full px-3 py-2 text-sm border outline-none transition-all";
  const inputStyle = (err?: string) => ({
    backgroundColor: "var(--color-background)",
    borderColor: err ? "var(--color-status-alert)" : "var(--color-border)",
    color: "var(--color-foreground)",
  });

  const filteredAll = allTypeFilter === "all" ? docs : docs.filter((d) => d.type === allTypeFilter);
  const allPending = filteredAll.filter((d) => d.status === "not_complied");
  const allCompleted = filteredAll.filter((d) => d.status !== "not_complied");

  const SL = ({ children }: { children: React.ReactNode }) => (
    <label className="block text-xs font-semibold tracking-widest uppercase mb-1.5" style={{ fontFamily: "var(--font-mono)", color: "var(--color-muted-foreground)", fontSize: "10px" }}>{children}</label>
  );

  return (
    <div className="min-h-full">
      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Stats row */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {([
            { label: "Safety Alerts", type: "safety_alert" as DocType, color: "var(--color-status-alert)" },
            { label: "Service Bulletins", type: "service_bulletin" as DocType, color: "var(--color-primary)" },
            { label: "Service Notifications", type: "service_notification" as DocType, color: "var(--color-status-pending)" },
          ] as { label: string; type: DocType; color: string }[]).map((s) => {
            const total = byType(s.type).length;
            const open = pendingByType(s.type).length;
            return (
              <div key={s.type} className="px-4 py-3 border" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
                <div className="flex items-baseline gap-1.5 mb-0.5">
                  <span className="text-xl font-bold" style={{ fontFamily: "var(--font-mono)", color: open > 0 ? s.color : "var(--color-foreground)" }}>{open}</span>
                  <span className="text-sm" style={{ fontFamily: "var(--font-mono)", color: "var(--color-muted-foreground)" }}>/ {total}</span>
                </div>
                <div className="text-xs tracking-wider" style={{ fontFamily: "var(--font-mono)", color: "var(--color-muted-foreground)", fontSize: "10px" }}>{s.label}</div>
                <div className="text-xs" style={{ fontFamily: "var(--font-mono)", color: "var(--color-muted-foreground)", fontSize: "10px" }}>pending / total</div>
              </div>
            );
          })}
          <div className="px-4 py-3 border flex flex-col justify-center" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
            <div className="text-xl font-bold mb-0.5" style={{ fontFamily: "var(--font-mono)", color: pending.length > 0 ? "var(--color-status-alert)" : "var(--color-status-bulletin)" }}>{pending.length}</div>
            <div className="text-xs" style={{ fontFamily: "var(--font-mono)", color: "var(--color-muted-foreground)", fontSize: "10px" }}>Total Pending</div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-0 border" style={{ borderColor: "var(--color-border)" }}>
            {([["by_system", "By System"], ["all", "All Documents"]] as [ViewMode, string][]).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setViewMode(val)}
                className="px-4 py-2 text-xs font-semibold tracking-wide transition-all"
                style={{
                  fontFamily: "var(--font-mono)",
                  backgroundColor: viewMode === val ? "var(--color-primary)" : "var(--color-card)",
                  color: viewMode === val ? "white" : "var(--color-muted-foreground)",
                  borderRight: val === "by_system" ? `1px solid var(--color-border)` : "none",
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            onClick={() => { setShowAddForm(!showAddForm); setNewDoc(EMPTY_FORM); setNewDocImages([]); }}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold tracking-wide transition-all"
            style={{ backgroundColor: "var(--color-accent)", color: "white" }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            <svg width="11" height="11" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" /></svg>
            Add Document
          </button>
        </div>

        {/* Add doc form */}
        {showAddForm && (
          <div className="mb-5 border p-5" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-ring)", borderWidth: "2px" }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xs font-bold tracking-widest uppercase" style={{ fontFamily: "var(--font-mono)", color: "var(--color-muted-foreground)" }}>New Maintenance Document</h3>
              <button onClick={() => setShowAddForm(false)} style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-mono)", fontSize: "12px" }}>✕ Cancel</button>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <SL>Document Type</SL>
                <select value={newDoc.type} onChange={(e) => setField("type", e.target.value as DocType)} className={InputCls} style={inputStyle()}>
                  <option value="safety_alert">Safety Alert</option>
                  <option value="service_bulletin">Service Bulletin</option>
                  <option value="service_notification">Service Notification</option>
                </select>
              </div>
              <div>
                <SL>Document Number</SL>
                <input type="text" value={newDoc.number} onChange={(e) => setField("number", e.target.value)} placeholder="e.g. SAIB CE-23-14" className={InputCls} style={{ ...inputStyle(formErrors.number), fontFamily: "var(--font-mono)" }} />
                {formErrors.number && <p className="mt-1 text-xs" style={{ color: "var(--color-status-alert)", fontFamily: "var(--font-mono)" }}>{formErrors.number}</p>}
              </div>
              <div>
                <SL>Issuer</SL>
                <input type="text" value={newDoc.issuer} onChange={(e) => setField("issuer", e.target.value)} placeholder="FAA, Rotax, Textron…" className={InputCls} style={inputStyle(formErrors.issuer)} />
                {formErrors.issuer && <p className="mt-1 text-xs" style={{ color: "var(--color-status-alert)", fontFamily: "var(--font-mono)" }}>{formErrors.issuer}</p>}
              </div>
              <div className="col-span-2">
                <SL>Title / Description</SL>
                <input type="text" value={newDoc.title} onChange={(e) => setField("title", e.target.value)} placeholder="Brief description" className={InputCls} style={inputStyle(formErrors.title)} />
                {formErrors.title && <p className="mt-1 text-xs" style={{ color: "var(--color-status-alert)", fontFamily: "var(--font-mono)" }}>{formErrors.title}</p>}
              </div>
              <div>
                <SL>Issue Date</SL>
                <input type="date" value={newDoc.issuedDate} onChange={(e) => setField("issuedDate", e.target.value)} className={InputCls} style={inputStyle(formErrors.issuedDate)} />
                {formErrors.issuedDate && <p className="mt-1 text-xs" style={{ color: "var(--color-status-alert)", fontFamily: "var(--font-mono)" }}>{formErrors.issuedDate}</p>}
              </div>
              <div>
                <SL>Applies To</SL>
                <select value={newDoc.appliesTo} onChange={(e) => setField("appliesTo", e.target.value as DocAppliesTo)} className={InputCls} style={inputStyle()}>
                  <option value="airframe">Airframe</option>
                  <option value="engine">Engine</option>
                  <option value="both">Airframe + Engine</option>
                </select>
              </div>
              <div>
                <SL>Initial Status</SL>
                <select value={newDoc.status} onChange={(e) => setField("status", e.target.value as DocStatus)} className={InputCls} style={inputStyle()}>
                  <option value="not_complied">Not Complied</option>
                  <option value="complied">Complied</option>
                  <option value="not_applicable">Not Applicable</option>
                </select>
              </div>
              <div className="col-span-3">
                <SL>Compliance Notes</SL>
                <textarea value={newDoc.notes} onChange={(e) => setField("notes", e.target.value)} placeholder="Date complied, reference, technician…" rows={2} className={`${InputCls} resize-none`} style={inputStyle()} />
              </div>
            </div>

            {/* Parts in add form */}
            <div className="mb-4">
              <SL>Parts Required for Remediation</SL>
              <PartsEditor parts={newDoc.parts} onChange={(p) => setNewDoc((prev) => ({ ...prev, parts: p }))} />
            </div>

            {/* Time to fix in add form */}
            <div className="mb-4">
              <SL>Time to Fix (hours)</SL>
              <div className="flex items-center gap-2" style={{ maxWidth: "200px" }}>
                <input type="number" min="0" step="0.5" value={newDoc.timeToFix} onChange={(e) => setField("timeToFix", e.target.value)} placeholder="e.g. 2.5" className={InputCls} style={{ ...inputStyle(), fontFamily: "var(--font-mono)" }} />
                <span className="text-xs shrink-0" style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-mono)" }}>hrs</span>
              </div>
            </div>

            {/* Work notes in add form */}
            <div className="mb-4">
              <SL>Work Notes</SL>
              <textarea value={newDoc.workNotes} onChange={(e) => setField("workNotes", e.target.value)} placeholder="Describe work performed, findings…" rows={3} className={`${InputCls} resize-y`} style={inputStyle()} />
            </div>

            {/* Images in add form */}
            <div className="mb-4">
              <SL>Photos &amp; Attachments</SL>
              <ImageUploader images={newDocImages} onChange={setNewDocImages} />
            </div>

            <div className="flex gap-3">
              <button onClick={handleAddDoc} className="px-5 py-2.5 text-xs font-semibold tracking-wide" style={{ backgroundColor: "var(--color-primary)", color: "white", fontFamily: "var(--font-mono)" }}>
                Add Document
              </button>
              <button onClick={() => setShowAddForm(false)} className="px-4 py-2.5 text-xs border" style={{ borderColor: "var(--color-border)", fontFamily: "var(--font-mono)" }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* BY SYSTEM VIEW */}
        {viewMode === "by_system" && (
          <div className="space-y-4">
            <SystemSection title="Airframe" system="airframe" docs={docs} onUpdateDoc={onUpdateDoc} onDeleteDoc={onDeleteDoc} />
            <SystemSection title="Engine" system="engine" docs={docs} onUpdateDoc={onUpdateDoc} onDeleteDoc={onDeleteDoc} />
          </div>
        )}

        {/* ALL DOCUMENTS VIEW */}
        {viewMode === "all" && (
          <div>
            <div className="flex items-center gap-0 mb-4 border-b" style={{ borderColor: "var(--color-border)" }}>
              {([
                ["all", "All"],
                ["safety_alert", "Safety Alerts"],
                ["service_bulletin", "Service Bulletins"],
                ["service_notification", "Service Notifications"],
              ] as [DocType | "all", string][]).map(([val, label]) => {
                const count = val === "all" ? docs.length : docs.filter((d) => d.type === val).length;
                const active = allTypeFilter === val;
                return (
                  <button
                    key={val}
                    onClick={() => setAllTypeFilter(val)}
                    className="px-4 py-2 text-xs font-semibold tracking-wide border-b-2 -mb-px transition-all flex items-center gap-1.5"
                    style={{ fontFamily: "var(--font-mono)", borderColor: active ? "var(--color-accent)" : "transparent", color: active ? "var(--color-foreground)" : "var(--color-muted-foreground)" }}
                  >
                    {label}
                    <span style={{ backgroundColor: active ? "var(--color-accent)" : "var(--color-secondary)", color: active ? "white" : "var(--color-muted-foreground)", fontSize: "10px", padding: "0 5px" }}>{count}</span>
                  </button>
                );
              })}
            </div>
            <div className="border" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
              {allPending.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 px-4 py-2 border-b" style={{ borderColor: "var(--color-border)", backgroundColor: "#c84b110a" }}>
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "var(--color-status-alert)" }} />
                    <span className="text-xs font-semibold tracking-widest uppercase" style={{ fontFamily: "var(--font-mono)", color: "var(--color-status-alert)", fontSize: "10px" }}>
                      Pending — {allPending.length} item{allPending.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  {allPending.map((doc) => <DocRow key={doc.id} doc={doc} onUpdateDoc={onUpdateDoc} onDeleteDoc={onDeleteDoc} />)}
                </div>
              )}
              {allCompleted.length > 0 && (
                <div>
                  <button
                    onClick={() => setShowAllCompleted(!showAllCompleted)}
                    className="w-full flex items-center gap-2 px-4 py-2 border-b text-left transition-colors"
                    style={{ borderColor: "var(--color-border)", backgroundColor: "#1a6b4a08" }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1a6b4a12")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#1a6b4a08")}
                  >
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "var(--color-status-bulletin)" }} />
                    <span className="text-xs font-semibold tracking-widest uppercase" style={{ fontFamily: "var(--font-mono)", color: "var(--color-status-bulletin)", fontSize: "10px" }}>
                      Completed / N/A — {allCompleted.length} item{allCompleted.length !== 1 ? "s" : ""}
                    </span>
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="ml-auto" style={{ transform: showAllCompleted ? "rotate(0deg)" : "rotate(-90deg)", color: "var(--color-muted-foreground)" }}>
                      <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  {showAllCompleted && allCompleted.map((doc) => <DocRow key={doc.id} doc={doc} onUpdateDoc={onUpdateDoc} onDeleteDoc={onDeleteDoc} />)}
                </div>
              )}
              {filteredAll.length === 0 && (
                <div className="py-12 text-center"><p className="text-xs" style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-mono)" }}>No documents in this category.</p></div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
