import { useState } from "react";
import type { Aircraft, MaintenanceDoc, LogbookEntry } from "../App";

type Props = {
  aircraft: Aircraft[];
  docs: MaintenanceDoc[];
  logbook: LogbookEntry[];
  onAddPlane: () => void;
  onSelectAircraft: (ac: Aircraft) => void;
  onEditAircraft: (ac: Aircraft) => void;
  onDeleteAircraft: (id: string) => void;
};

export default function FleetList({ aircraft, docs, logbook, onAddPlane, onSelectAircraft, onEditAircraft, onDeleteAircraft }: Props) {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const getDocCounts = (id: string) => {
    const acDocs = docs.filter((d) => d.aircraftId === id);
    const alerts = acDocs.filter((d) => d.type === "safety_alert");
    const bulletins = acDocs.filter((d) => d.type === "service_bulletin");
    const notifications = acDocs.filter((d) => d.type === "service_notification");
    const openAlerts = alerts.filter((d) => d.status === "not_complied").length;
    const openBulletins = bulletins.filter((d) => d.status === "not_complied").length;
    const openNotifications = notifications.filter((d) => d.status === "not_complied").length;
    return { total: acDocs.length, alerts: alerts.length, bulletins: bulletins.length, notifications: notifications.length, openAlerts, openBulletins, openNotifications };
  };

  return (
    <div className="min-h-full">
      {/* Header */}
      <header style={{ backgroundColor: "var(--color-primary)", borderBottom: "3px solid var(--color-accent)" }}>
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div style={{ fontFamily: "var(--font-serif)", color: "var(--color-primary-foreground)" }}>
              <div className="text-xs tracking-widest uppercase opacity-60 mb-0.5" style={{ fontFamily: "var(--font-mono)" }}>Aircraft Maintenance</div>
              <h1 className="text-2xl font-bold leading-none">FlightLog</h1>
            </div>
          </div>
          <button
            onClick={onAddPlane}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold tracking-wide transition-all"
            style={{ backgroundColor: "var(--color-accent)", color: "var(--color-accent-foreground)" }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            Add Aircraft
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats bar */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Aircraft", value: aircraft.length },
            { label: "Open Safety Alerts", value: docs.filter((d) => d.type === "safety_alert" && d.status === "not_complied").length, accent: true },
            { label: "Open Service Bulletins", value: docs.filter((d) => d.type === "service_bulletin" && d.status === "not_complied").length, warn: true },
            { label: "Open Notifications", value: docs.filter((d) => d.type === "service_notification" && d.status === "not_complied").length, notify: true },
          ].map((stat) => (
            <div key={stat.label} className="px-5 py-4 border" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
              <div className="text-2xl font-bold mb-1" style={{ fontFamily: "var(--font-mono)", color: stat.accent ? "var(--color-status-alert)" : stat.warn ? "var(--color-primary)" : (stat as any).notify ? "var(--color-status-pending)" : "var(--color-primary)" }}>{stat.value}</div>
              <div className="text-xs tracking-wider uppercase" style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-mono)" }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Section heading */}
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-xs font-semibold tracking-widest uppercase" style={{ fontFamily: "var(--font-mono)", color: "var(--color-muted-foreground)" }}>Registered Fleet</h2>
          <div className="flex-1 h-px" style={{ backgroundColor: "var(--color-border)" }} />
        </div>

        {aircraft.length === 0 ? (
          <div className="py-20 text-center border" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
            <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>No aircraft registered. Add your first aircraft to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {aircraft.map((ac) => {
              const counts = getDocCounts(ac.id);
              const acLogbook = logbook.filter((l) => l.aircraftId === ac.id);
              const lastAnnual = acLogbook.filter((l) => l.inspectionType === "annual").sort((a, b) => b.completionDate.localeCompare(a.completionDate))[0];
              const last100hr = acLogbook.filter((l) => l.inspectionType === "100_hour").sort((a, b) => b.completionDate.localeCompare(a.completionDate))[0];
              return (
                <div
                  key={ac.id}
                  className="border transition-all"
                  style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
                >
                  <div className="p-5 grid gap-4" style={{ gridTemplateColumns: "1fr auto" }}>
                    {/* Left: Aircraft info */}
                    <div>
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-xl font-bold tracking-tight" style={{ fontFamily: "var(--font-mono)", color: "var(--color-primary)" }}>{ac.nNumber}</span>
                        <span className="text-xs px-2 py-0.5 border" style={{ color: "var(--color-muted-foreground)", borderColor: "var(--color-border)", fontFamily: "var(--font-mono)" }}>{ac.planeType}</span>
                        <span className="text-xs" style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-mono)" }}>{ac.year}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 mb-4" style={{ maxWidth: "500px" }}>
                        {[
                          { label: "Owner", value: ac.ownerName },
                          { label: "Serial No.", value: ac.serialNumber },
                          { label: "Engine Model", value: ac.engineModel },
                          { label: "Engine No.", value: ac.engineNumber },
                        ].map((f) => (
                          <div key={f.label} className="flex items-baseline gap-2">
                            <span className="text-xs shrink-0" style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-mono)" }}>{f.label}</span>
                            <span className="text-sm font-medium truncate">{f.value}</span>
                          </div>
                        ))}
                      </div>

                      {/* Doc badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs px-2.5 py-1 font-medium" style={{ fontFamily: "var(--font-mono)", backgroundColor: counts.openAlerts > 0 ? "var(--color-status-alert)" : "var(--color-secondary)", color: counts.openAlerts > 0 ? "white" : "var(--color-secondary-foreground)" }}>
                          {counts.alerts} Alert{counts.alerts !== 1 ? "s" : ""}
                          {counts.openAlerts > 0 && ` · ${counts.openAlerts} open`}
                        </span>
                        <span className="text-xs px-2.5 py-1 font-medium" style={{ fontFamily: "var(--font-mono)", backgroundColor: counts.openBulletins > 0 ? "#1a3a5c18" : "var(--color-secondary)", color: counts.openBulletins > 0 ? "var(--color-primary)" : "var(--color-secondary-foreground)", border: counts.openBulletins > 0 ? "1px solid var(--color-primary)" : "none" }}>
                          {counts.bulletins} Bulletin{counts.bulletins !== 1 ? "s" : ""}
                          {counts.openBulletins > 0 && ` · ${counts.openBulletins} open`}
                        </span>
                        <span className="text-xs px-2.5 py-1 font-medium" style={{ fontFamily: "var(--font-mono)", backgroundColor: counts.openNotifications > 0 ? "#8b691422" : "var(--color-secondary)", color: counts.openNotifications > 0 ? "var(--color-status-pending)" : "var(--color-secondary-foreground)", border: counts.openNotifications > 0 ? "1px solid var(--color-status-pending)" : "none" }}>
                          {counts.notifications} Notification{counts.notifications !== 1 ? "s" : ""}
                          {counts.openNotifications > 0 && ` · ${counts.openNotifications} open`}
                        </span>
                      </div>

                      {/* Logbook summary */}
                      <div className="flex items-center gap-4 mt-2 pt-3 border-t" style={{ borderColor: "var(--color-border)" }}>
                        <span className="text-xs" style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-mono)", fontSize: "10px" }}>LOGBOOK</span>
                        <span className="text-xs" style={{ fontFamily: "var(--font-mono)", color: lastAnnual ? "var(--color-foreground)" : "var(--color-muted-foreground)", fontSize: "11px" }}>
                          Annual: <strong>{lastAnnual ? lastAnnual.completionDate : "—"}</strong>
                        </span>
                        <span className="text-xs" style={{ fontFamily: "var(--font-mono)", color: last100hr ? "var(--color-foreground)" : "var(--color-muted-foreground)", fontSize: "11px" }}>
                          100-hr: <strong>{last100hr ? last100hr.completionDate : "—"}</strong>
                        </span>
                        {lastAnnual && (
                          <span className="text-xs" style={{ fontFamily: "var(--font-mono)", color: "var(--color-muted-foreground)", fontSize: "11px" }}>
                            A/C TT: <strong>{lastAnnual.timeInService.aircraft} hrs</strong>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex flex-col items-end gap-2">
                      <button
                        onClick={() => onSelectAircraft(ac)}
                        className="px-4 py-2 text-xs font-semibold tracking-wide transition-all"
                        style={{ backgroundColor: "var(--color-primary)", color: "var(--color-primary-foreground)" }}
                        onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
                        onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                      >
                        Open Aircraft →
                      </button>
                      <button
                        onClick={() => onEditAircraft(ac)}
                        className="px-4 py-2 text-xs font-medium tracking-wide border transition-all"
                        style={{ borderColor: "var(--color-border)", color: "var(--color-foreground)", fontFamily: "var(--font-mono)" }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-secondary)")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                      >
                        Edit
                      </button>
                      {deleteConfirm === ac.id ? (
                        <div className="flex gap-1">
                          <button
                            onClick={() => { onDeleteAircraft(ac.id); setDeleteConfirm(null); }}
                            className="px-3 py-1.5 text-xs font-semibold"
                            style={{ backgroundColor: "var(--color-status-alert)", color: "white" }}
                          >Confirm</button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="px-3 py-1.5 text-xs border"
                            style={{ borderColor: "var(--color-border)" }}
                          >Cancel</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(ac.id)}
                          className="px-4 py-1.5 text-xs border transition-all"
                          style={{ borderColor: "var(--color-border)", color: "var(--color-muted-foreground)", fontFamily: "var(--font-mono)" }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--color-status-alert)"; e.currentTarget.style.color = "var(--color-status-alert)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.color = "var(--color-muted-foreground)"; }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
