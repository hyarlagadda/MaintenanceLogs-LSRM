import { useState } from "react";
import type { Aircraft, MaintenanceDoc, DocStatus, LogbookEntry, Part, AttachedImage } from "../App";
import MaintenanceDocs from "./MaintenanceDocs";
import LogbookView from "./LogbookView";

type Tab = "maintenance" | "logbook";

type Props = {
  aircraft: Aircraft;
  docs: MaintenanceDoc[];
  logbook: LogbookEntry[];
  onBack: () => void;
  onAddDoc: (doc: Omit<MaintenanceDoc, "id">) => void;
  onUpdateDoc: (docId: string, update: Pick<MaintenanceDoc, "status" | "notes" | "parts" | "workNotes" | "images" | "timeToFix">) => void;
  onDeleteDoc: (docId: string) => void;
  onAddLogbookEntry: (entry: Omit<LogbookEntry, "id">) => void;
  onUpdateLogbookEntry: (id: string, update: Pick<LogbookEntry, "workNotes" | "images">) => void;
  onDeleteLogbookEntry: (id: string) => void;
};

export default function AircraftDetail({
  aircraft, docs, logbook, onBack,
  onAddDoc, onUpdateDoc, onDeleteDoc,
  onAddLogbookEntry, onUpdateLogbookEntry, onDeleteLogbookEntry,
}: Props) {
  const [tab, setTab] = useState<Tab>("maintenance");

  const annualCount = logbook.filter((l) => l.inspectionType === "annual").length;
  const hourCount = logbook.filter((l) => l.inspectionType === "100_hour").length;
  const pendingDocs = docs.filter((d) => d.status === "not_complied").length;

  return (
    <div className="min-h-full">
      {/* Shared header */}
      <header style={{ backgroundColor: "var(--color-primary)", borderBottom: "3px solid var(--color-accent)" }}>
        <div className="max-w-6xl mx-auto px-6 pt-5 pb-0">
          <div className="flex items-start justify-between mb-3">
            <div>
              <button
                onClick={onBack}
                className="text-xs tracking-wide transition-opacity opacity-60 hover:opacity-100 mb-2 block"
                style={{ color: "var(--color-primary-foreground)", fontFamily: "var(--font-mono)" }}
              >
                ← Fleet
              </button>
              <div style={{ fontFamily: "var(--font-serif)", color: "var(--color-primary-foreground)" }}>
                <h1 className="text-2xl font-bold leading-none">{aircraft.nNumber}</h1>
                <p className="text-sm mt-1 opacity-80">{aircraft.planeType} · {aircraft.year} · {aircraft.ownerName}</p>
              </div>
            </div>
            {/* Quick stats */}
            <div className="flex gap-3 mt-1">
              {[
                { label: "Pending Docs", value: pendingDocs, warn: pendingDocs > 0 },
                { label: "Annual Insp.", value: annualCount },
                { label: "100-hr Insp.", value: hourCount },
              ].map((s) => (
                <div key={s.label} className="text-center px-4 py-2" style={{ backgroundColor: "rgba(255,255,255,0.08)", minWidth: "80px" }}>
                  <div className="text-lg font-bold" style={{ fontFamily: "var(--font-mono)", color: s.warn ? "#f87171" : "white" }}>{s.value}</div>
                  <div className="text-xs opacity-55 mt-0.5" style={{ fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "0.05em" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Aircraft meta strip */}
          <div className="flex items-center gap-5 mb-3" style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>
            <span>S/N {aircraft.serialNumber}</span>
            <span>Engine: {aircraft.engineModel}</span>
            <span>Eng S/N: {aircraft.engineNumber}</span>
          </div>

          {/* Tab nav */}
          <div className="flex items-end gap-0 -mb-px">
            {([
              ["maintenance", "Maintenance Documents", pendingDocs],
              ["logbook", "Inspection Logbook", annualCount + hourCount],
            ] as [Tab, string, number][]).map(([val, label, count]) => {
              const active = tab === val;
              return (
                <button
                  key={val}
                  onClick={() => setTab(val)}
                  className="px-5 py-3 text-xs font-semibold tracking-wide border-b-2 transition-all flex items-center gap-2"
                  style={{
                    fontFamily: "var(--font-mono)",
                    borderColor: active ? "var(--color-accent)" : "transparent",
                    color: active ? "white" : "rgba(255,255,255,0.45)",
                    backgroundColor: active ? "rgba(255,255,255,0.07)" : "transparent",
                  }}
                >
                  {label}
                  <span
                    className="px-1.5 py-0.5"
                    style={{
                      backgroundColor: active ? "var(--color-accent)" : "rgba(255,255,255,0.15)",
                      color: active ? "white" : "rgba(255,255,255,0.6)",
                      fontSize: "10px",
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {tab === "maintenance" && (
        <MaintenanceDocs
          aircraft={aircraft}
          docs={docs}
          onBack={onBack}
          onAddDoc={onAddDoc}
          onUpdateDoc={onUpdateDoc}
          onDeleteDoc={onDeleteDoc}
          embedded
        />
      )}
      {tab === "logbook" && (
        <LogbookView
          aircraft={aircraft}
          entries={logbook}
          onAddEntry={onAddLogbookEntry}
          onUpdateEntry={onUpdateLogbookEntry}
          onDeleteEntry={onDeleteLogbookEntry}
        />
      )}
    </div>
  );
}
