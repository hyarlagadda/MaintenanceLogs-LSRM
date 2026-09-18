import { useState } from "react"
import FleetList from "./components/FleetList"
import AddPlaneForm from "./components/AddPlaneForm"
import AircraftDetail from "./components/AircraftDetail"

export type Aircraft = {
  id: string
  nNumber: string
  serialNumber: string
  planeType: string
  ownerName: string
  engineNumber: string
  engineModel: string
  year: string
  addedDate: string
}

export type DocType = "safety_alert" | "service_bulletin" | "service_notification"
export type DocStatus = "complied" | "not_complied" | "not_applicable"
export type DocAppliesTo = "airframe" | "engine" | "both"

export type Part = {
  partNumber: string
  description: string
  quantity: string
}

export type AttachedImage = {
  id: string
  name: string
  dataUrl: string
  uploadedAt: string
}

export type MaintenanceDoc = {
  id: string
  aircraftId: string
  type: DocType
  number: string
  title: string
  issuer: string
  issuedDate: string
  appliesTo: DocAppliesTo
  status: DocStatus
  notes: string
  parts: Part[]
  workNotes: string
  images: AttachedImage[]
}

export type InspectionType = "annual" | "100_hour" | "progressive" | "other"
export type CertPrivilege = "A&P" | "LSRM"
export type LimitationCode = "A" | "P" | "GL"

export type TechnicianSignature = {
  name: string
  licenseNumber: string
  certPrivilege: CertPrivilege
  rating: string
  limitation: LimitationCode[]
}

export type TimeInService = {
  aircraft: string
  engine: string
  propeller: string
  rotor: string
}

export type LogbookEntry = {
  id: string
  aircraftId: string
  inspectionType: InspectionType
  description: string
  completionDate: string
  timeInService: TimeInService
  signature: TechnicianSignature
  workNotes: string
  images: AttachedImage[]
}

type Page = "fleet" | "add_plane" | "edit_plane" | "aircraft_detail"

const INITIAL_AIRCRAFT: Aircraft[] = [
  {
    id: "1",
    nNumber: "N4872K",
    serialNumber: "17275872",
    planeType: "Alpha Trainer", //"Cessna 172S"
    ownerName: "Ridgeline Aviation LLC",
    engineNumber: "636145-A",
    engineModel: "Rotax 912 ULS", //"Lycoming IO-360-L2A",
    year: "2024",
    addedDate: "2026-01-15",
  },
  {
    id: "2",
    nNumber: "N8803P",
    serialNumber: "28-7990214",
    planeType: "Technam", //"Piper PA-28-181"
    ownerName: "Harold J. Tanner",
    engineNumber: "L-23891-51E",
    engineModel: "Rotax 912 IS", //"Lycoming O-360-A4M",
    year: "2023",
    addedDate: "2026-03-02",
  },
]

const INITIAL_DOCS: MaintenanceDoc[] = [
  // N4872K — Airframe
  {
    id: "d1",
    aircraftId: "1",
    type: "safety_alert",
    number: "SAIB CE-23-14",
    title: "Alpha trainer Elevator Control Rod End Inspection",
    issuer: "FAA",
    issuedDate: "2023-08-10",
    appliesTo: "airframe",
    status: "complied",
    notes: "Complied 2024-02-18. No discrepancy found.",
    parts: [],
    workNotes: "Elevator control rod end inspected per SAIB. No cracks or wear detected. Torque checked and within limits.",
    images: [],
  },
  {
    id: "d3",
    aircraftId: "1",
    type: "service_bulletin",
    number: "SB-00-36",
    title: "Alpha Trainer Single Engine Fuel System Inspection",
    issuer: "Textron Aviation",
    issuedDate: "2020-11-15",
    appliesTo: "airframe",
    status: "not_applicable",
    notes: "Aircraft modified per STC SA01822AT.",
    parts: [],
    workNotes: "Not applicable — aircraft equipped with alternate fuel system per STC SA01822AT.",
    images: [],
  },
  {
    id: "d6",
    aircraftId: "1",
    type: "safety_alert",
    number: "SAIB CE-24-02",
    title: "Alpha Trainer Nose Gear Steering Collar Inspection",
    issuer: "FAA",
    issuedDate: "2024-01-22",
    appliesTo: "airframe",
    status: "not_complied",
    notes: "",
    parts: [
      { partNumber: "0541141-3", description: "Nose Gear Steering Collar", quantity: "1" },
      { partNumber: "AN960-10L", description: "Flat Washer (if replacement required)", quantity: "2" },
    ],
    workNotes: "",
    images: [],
  },
  {
    id: "d7",
    aircraftId: "1",
    type: "service_notification",
    number: "SN-172-2023-04",
    title: "Updated Alternator Belt Inspection Interval",
    issuer: "Textron Aviation",
    issuedDate: "2023-06-01",
    appliesTo: "airframe",
    status: "complied",
    notes: "Interval updated to 500hr. Last inspected 2025-11-10 at 2,847 TT.",
    parts: [
      { partNumber: "CM10-78N", description: "Alternator Drive Belt (if replacement needed)", quantity: "1" },
    ],
    workNotes: "Belt inspected at annual — tension and condition satisfactory. No replacement required at this time.",
    images: [],
  },
  {
    id: "d8",
    aircraftId: "1",
    type: "service_notification",
    number: "SN-172-2024-11",
    title: "Pitot-Static System Hose Replacement Recommendation",
    issuer: "Textron Aviation",
    issuedDate: "2024-09-15",
    appliesTo: "airframe",
    status: "not_complied",
    notes: "",
    parts: [
      { partNumber: "S1347-3", description: "Pitot-Static Hose Assembly, 3/16 in.", quantity: "2" },
      { partNumber: "AN924-3D", description: "Coupling Nut", quantity: "4" },
    ],
    workNotes: "",
    images: [],
  },
  // N4872K — Engine
  {
    id: "d2",
    aircraftId: "1",
    type: "service_bulletin",
    number: "SEB97-3 R3",
    title: "Rotax 912 Camshaft and Lifter Inspection",
    issuer: "Rotax",
    issuedDate: "2022-05-01",
    appliesTo: "engine",
    status: "not_complied",
    notes: "",
    parts: [
      { partNumber: "LW-15539", description: "Camshaft Assembly (if worn beyond limits)", quantity: "1" },
      { partNumber: "LW-15533", description: "Hydraulic Lifter (set of 8, if replacement required)", quantity: "1" },
      { partNumber: "LW-12267", description: "Gasket Set, Top Overhaul", quantity: "1" },
    ],
    workNotes: "",
    images: [],
  },
  {
    id: "d9",
    aircraftId: "1",
    type: "service_bulletin",
    number: "SB-480E",
    title: "Rotax 912 Oil Suction Screen Inspection",
    issuer: "Rotax",
    issuedDate: "2019-03-14",
    appliesTo: "engine",
    status: "complied",
    notes: "Complied at 100hr inspection 2025-08-03. Screen clean.",
    parts: [
      { partNumber: "LW-14080", description: "Oil Suction Screen", quantity: "1" },
      { partNumber: "LW-11529", description: "Crush Washer, Oil Screen Plug", quantity: "1" },
    ],
    workNotes: "Screen removed, cleaned, and inspected under 10x magnification. No ferrous debris. Screen reinstalled with new crush washer.",
    images: [],
  },
  {
    id: "d10",
    aircraftId: "1",
    type: "service_notification",
    number: "LYC-SN-2023-07",
    title: "Rotax 912 Spark Plug Lead Inspection Interval",
    issuer: "Rotax",
    issuedDate: "2023-11-01",
    appliesTo: "engine",
    status: "not_complied",
    notes: "",
    parts: [
      { partNumber: "LW-14227", description: "Ignition Lead Set (if replacement required)", quantity: "1" },
    ],
    workNotes: "",
    images: [],
  },
  // N8803P — Airframe
  {
    id: "d4",
    aircraftId: "2",
    type: "safety_alert",
    number: "SAIB GA-22-07",
    title: "Technam Horizontal Stabilizer Attach Fitting",
    issuer: "FAA",
    issuedDate: "2022-04-04",
    appliesTo: "airframe",
    status: "complied",
    notes: "Inspected 2023-09-12. Torque verified.",
    parts: [],
    workNotes: "Stabilizer attach fittings inspected per SAIB procedure. All hardware torqued to spec. No cracks found.",
    images: [],
  },
  {
    id: "d11",
    aircraftId: "2",
    type: "service_notification",
    number: "PA-28-SN-12",
    title: "Technam Flap Actuator Lubrication",
    issuer: "Piper Aircraft",
    issuedDate: "2021-07-19",
    appliesTo: "airframe",
    status: "not_complied",
    notes: "",
    parts: [
      { partNumber: "LPS-02316", description: "Aeroshell 22 Grease, 14oz cartridge", quantity: "1" },
    ],
    workNotes: "",
    images: [],
  },
  // N8803P — Engine
  {
    id: "d5",
    aircraftId: "2",
    type: "service_bulletin",
    number: "SB-388C",
    title: "Rotax 912 IS Connecting Rod Bolt Replacement",
    issuer: "Rotax",
    issuedDate: "2021-03-20",
    appliesTo: "engine",
    status: "not_complied",
    notes: "",
    parts: [
      { partNumber: "LW-15445", description: "Connecting Rod Bolt (set of 8)", quantity: "1" },
      { partNumber: "LW-15446", description: "Connecting Rod Nut (set of 8)", quantity: "1" },
      { partNumber: "LW-12267", description: "Gasket Set, Lower", quantity: "1" },
    ],
    workNotes: "",
    images: [],
  },
  {
    id: "d12",
    aircraftId: "2",
    type: "service_notification",
    number: "LYC-SN-2022-03",
    title: "Rotax 912 IS Oil Change Interval Clarification — 50hr or Annual",
    issuer: "Rotax",
    issuedDate: "2022-09-08",
    appliesTo: "engine",
    status: "complied",
    notes: "Oil and filter changed 2026-04-14 at 3,102 TT.",
    parts: [
      { partNumber: "AeroShell-W100", description: "AeroShell W100 Plus Engine Oil, 1 qt", quantity: "8" },
      { partNumber: "LW-12222", description: "Oil Filter, Rotax 912", quantity: "1" },
      { partNumber: "LW-11529", description: "Crush Washer, Drain Plug", quantity: "1" },
    ],
    workNotes: "Oil drained warm. Filter cut open — no metal. 8 qt Aeroshell W100 Plus added. New crush washer installed on drain plug.",
    images: [],
  },
]

const INITIAL_LOGBOOK: LogbookEntry[] = [
  // N4872K Annual 2025
  {
    id: "l1",
    aircraftId: "1",
    inspectionType: "annual",
    description:
      "Annual inspection performed in accordance with 14 CFR Part 43 Appendix D. Aircraft found airworthy. Replaced left main gear tire (P/N 026-630-01), serviced nose strut to 45 PSI. ELT battery replaced (exp. 2028-03). All ADs reviewed and noted complied. Pitot-static system functional check passed. Compass swing performed, deviations within limits. Return to service authorized.",
    completionDate: "2025-11-10",
    timeInService: {
      aircraft: "2847.3",
      engine: "1204.6",
      propeller: "1204.6",
      rotor: "",
    },
    signature: {
      name: "James R. Whitfield",
      licenseNumber: "2874651",
      certPrivilege: "A&P",
      rating: "Airframe & Powerplant",
      limitation: ["A"],
    },
    workNotes: "All items per annual checklist completed. Aircraft returned to service.",
    images: [],
  },
  // N4872K 100-hour Aug 2025
  {
    id: "l2",
    aircraftId: "1",
    inspectionType: "100_hour",
    description:
      "100-hour inspection per 14 CFR Part 43 Appendix D. Oil and filter changed (Aeroshell 100W, 8 qt). Oil screen inspected — no metal. Spark plugs removed, cleaned, gapped, and reinstalled (Champion REM37BY). Compression check: #1 74/80, #2 76/80, #3 72/80, #4 75/80. All within limits. Carburetor heat and alternate air checked satisfactory. Lycoming SB-480E complied — oil suction screen clean.",
    completionDate: "2025-08-03",
    timeInService: {
      aircraft: "2803.1",
      engine: "1160.4",
      propeller: "1160.4",
      rotor: "",
    },
    signature: {
      name: "James R. Whitfield",
      licenseNumber: "2874651",
      certPrivilege: "A&P",
      rating: "Airframe & Powerplant",
      limitation: ["A"],
    },
    workNotes: "Oil and filter changed. Spark plugs gapped and re-installed. Compression satisfactory. SB-480E complied.",
    images: [],
  },
  // N4872K 100-hour Apr 2025
  {
    id: "l3",
    aircraftId: "1",
    inspectionType: "100_hour",
    description:
      "100-hour inspection per 14 CFR Part 43 Appendix D. Oil and filter changed (Aeroshell 100W, 8 qt). All control surfaces inspected for wear and play — within limits. Brake system inspected; right main brake pad at minimum — pads replaced (P/N 199-29). Stall warning vane cleaned and function-checked. ELT operability confirmed. Alternator belt tension checked and adjusted.",
    completionDate: "2025-04-12",
    timeInService: {
      aircraft: "2702.8",
      engine: "1060.1",
      propeller: "1060.1",
      rotor: "",
    },
    signature: {
      name: "Maria C. Delgado",
      licenseNumber: "3991204",
      certPrivilege: "A&P",
      rating: "Airframe & Powerplant",
      limitation: ["A"],
    },
    workNotes: "Right brake pads replaced P/N 199-29. Stall horn cleaned. Belt tension adjusted.",
    images: [],
  },
  // N8803P Annual 2026
  {
    id: "l4",
    aircraftId: "2",
    inspectionType: "annual",
    description:
      "Annual inspection per 14 CFR Part 43 Appendix D. Aircraft found airworthy with discrepancies noted and corrected: replaced left aileron hinge bolt (P/N AN4-13A), re-secured loose baggage door latch. Engine baffling inspected — replaced deteriorated right-side baffle seal. All avionics operationally checked. Transponder test current (Cert exp. 2027-02-28). All applicable ADs reviewed. VOR check current. Return to service authorized.",
    completionDate: "2026-02-28",
    timeInService: {
      aircraft: "5102.4",
      engine: "3102.2",
      propeller: "3102.2",
      rotor: "",
    },
    signature: {
      name: "Thomas J. Okafor",
      licenseNumber: "4418833",
      certPrivilege: "A&P",
      rating: "Airframe & Powerplant",
      limitation: ["A"],
    },
    workNotes: "Aileron hinge bolt AN4-13A replaced. Baggage door latch re-secured. Right baffle seal replaced. All ADs current.",
    images: [],
  },
  // N8803P 100-hour Dec 2025
  {
    id: "l5",
    aircraftId: "2",
    inspectionType: "100_hour",
    description:
      "100-hour inspection per 14 CFR Part 43 Appendix D. Oil and filter changed (Aeroshell W100 Plus, 8 qt). Compression check: #1 71/80, #2 73/80, #3 70/80, #4 74/80. Borescope of #3 cylinder — acceptable. Spark plugs cleaned and re-gapped. Fuel strainer drained and bowl cleaned. LYC-SN-2022-03 complied — oil change documented.",
    completionDate: "2025-12-04",
    timeInService: {
      aircraft: "5004.1",
      engine: "3004.0",
      propeller: "3004.0",
      rotor: "",
    },
    signature: {
      name: "Thomas J. Okafor",
      licenseNumber: "4418833",
      certPrivilege: "A&P",
      rating: "Airframe & Powerplant",
      limitation: ["A"],
    },
    workNotes: "Compression low on #3 — borescope shows acceptable ring wear. Monitor at next inspection. SN-2022-03 complied.",
    images: [],
  },
  // N8803P 100-hour Aug 2025
  {
    id: "l6",
    aircraftId: "2",
    inspectionType: "100_hour",
    description:
      "100-hour inspection per 14 CFR Part 43 Appendix D. Oil and filter changed. Brake fluid topped off — no leaks. Left fuel tank sump drain valve replaced (O-ring extruded). Flight control rigging checked — within limits. Stall horn tested — operational. Annual pitot tube cover found installed; removed and logged discrepancy — owner notified.",
    completionDate: "2025-08-19",
    timeInService: {
      aircraft: "4904.7",
      engine: "2904.6",
      propeller: "2904.6",
      rotor: "",
    },
    signature: {
      name: "Sandra L. Pruitt",
      licenseNumber: "1190477",
      certPrivilege: "A&P",
      rating: "Airframe & Powerplant",
      limitation: ["A"],
    },
    workNotes: "Sump drain valve O-ring replaced. Pitot cover discrepancy noted and owner notified. All other items within limits.",
    images: [],
  },
]

export default function App() {
  const [page, setPage] = useState<Page>("fleet")
  const [aircraft, setAircraft] = useState<Aircraft[]>(INITIAL_AIRCRAFT)
  const [docs, setDocs] = useState<MaintenanceDoc[]>(INITIAL_DOCS)
  const [logbook, setLogbook] = useState<LogbookEntry[]>(INITIAL_LOGBOOK)
  const [selectedAircraft, setSelectedAircraft] = useState<Aircraft | null>(
    null,
  )
  const [editingAircraft, setEditingAircraft] = useState<Aircraft | null>(null)

  const handleAddPlane = (plane: Omit<Aircraft, "id" | "addedDate">) => {
    const newPlane: Aircraft = {
      ...plane,
      id: Date.now().toString(),
      addedDate: new Date().toISOString().split("T")[0],
    }
    setAircraft((prev) => [...prev, newPlane])
    setPage("fleet")
  }

  const handleEditPlane = (plane: Omit<Aircraft, "id" | "addedDate">) => {
    if (!editingAircraft) return
    setAircraft((prev) =>
      prev.map((a) => (a.id === editingAircraft.id ? { ...a, ...plane } : a)),
    )
    if (selectedAircraft?.id === editingAircraft.id) {
      setSelectedAircraft({ ...editingAircraft, ...plane })
    }
    setEditingAircraft(null)
    setPage("fleet")
  }

  const handleDeletePlane = (id: string) => {
    setAircraft((prev) => prev.filter((a) => a.id !== id))
    setDocs((prev) => prev.filter((d) => d.aircraftId !== id))
    setLogbook((prev) => prev.filter((l) => l.aircraftId !== id))
  }

  const handleAddDoc = (doc: Omit<MaintenanceDoc, "id">) => {
    const newDoc: MaintenanceDoc = { ...doc, id: Date.now().toString() }
    setDocs((prev) => [...prev, newDoc])
  }

  const handleUpdateDoc = (
    docId: string,
    update: Pick<MaintenanceDoc, "status" | "notes" | "parts" | "workNotes" | "images">,
  ) => {
    setDocs((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, ...update } : d)),
    )
  }

  const handleUpdateLogbookEntry = (
    entryId: string,
    update: Pick<LogbookEntry, "workNotes" | "images">,
  ) => {
    setLogbook((prev) =>
      prev.map((l) => (l.id === entryId ? { ...l, ...update } : l)),
    )
  }

  const handleDeleteDoc = (docId: string) => {
    setDocs((prev) => prev.filter((d) => d.id !== docId))
  }

  const handleAddLogbookEntry = (entry: Omit<LogbookEntry, "id">) => {
    setLogbook((prev) => [{ ...entry, id: Date.now().toString() }, ...prev])
  }

  const handleDeleteLogbookEntry = (id: string) => {
    setLogbook((prev) => prev.filter((l) => l.id !== id))
  }

  const openDetail = (ac: Aircraft) => {
    setSelectedAircraft(ac)
    setPage("aircraft_detail")
  }

  const openEditPlane = (ac: Aircraft) => {
    setEditingAircraft(ac)
    setPage("edit_plane")
  }

  return (
    <div
      className="min-h-full"
      style={{
        backgroundColor: "var(--color-background)",
        fontFamily: "var(--font-sans)",
        color: "var(--color-foreground)",
      }}
    >
      {page === "fleet" && (
        <FleetList
          aircraft={aircraft}
          docs={docs}
          logbook={logbook}
          onAddPlane={() => setPage("add_plane")}
          onSelectAircraft={openDetail}
          onEditAircraft={openEditPlane}
          onDeleteAircraft={handleDeletePlane}
        />
      )}
      {page === "add_plane" && (
        <AddPlaneForm
          mode="add"
          onSubmit={handleAddPlane}
          onCancel={() => setPage("fleet")}
        />
      )}
      {page === "edit_plane" && editingAircraft && (
        <AddPlaneForm
          mode="edit"
          initialData={editingAircraft}
          onSubmit={handleEditPlane}
          onCancel={() => {
            setEditingAircraft(null)
            setPage("fleet")
          }}
        />
      )}
      {page === "aircraft_detail" && selectedAircraft && (
        <AircraftDetail
          aircraft={selectedAircraft}
          docs={docs.filter((d) => d.aircraftId === selectedAircraft.id)}
          logbook={logbook.filter((l) => l.aircraftId === selectedAircraft.id)}
          onBack={() => setPage("fleet")}
          onAddDoc={handleAddDoc}
          onUpdateDoc={handleUpdateDoc}
          onDeleteDoc={handleDeleteDoc}
          onAddLogbookEntry={handleAddLogbookEntry}
          onUpdateLogbookEntry={handleUpdateLogbookEntry}
          onDeleteLogbookEntry={handleDeleteLogbookEntry}
        />
      )}
    </div>
  )
}
