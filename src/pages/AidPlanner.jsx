import React, { useMemo, useRef, useState } from "react";
import { ArrowLeft, CalendarDays, Download, FileUp, Plus, Printer, RefreshCcw, Trash2 } from "lucide-react";
import { createPageUrl } from "@/utils";

const MATTER_TYPES = ["Criminal", "Family", "Family Violence", "Civil", "Other"];
const COURTS = [
  "Magistrates' Court",
  "County Court",
  "Supreme Court",
  "Children's Court",
  "Family Court",
  "Federal Circuit and Family Court",
  "Other",
];
const APPEARANCE_TYPES = [
  "Mention",
  "Contest Mention",
  "Plea",
  "Sentence",
  "Bail Application",
  "Committal",
  "Appeal",
  "Trial",
  "Conference",
  "Other",
];
const GRANT_TYPES = ["No grant yet", "Initial aid", "Ongoing aid", "Extension", "Appeal funding", "Other"];
const STAGE_OPTIONS = [
  "Advice only",
  "Mention",
  "Bail",
  "Plea",
  "Sentence",
  "Committal",
  "Trial prep",
  "Trial",
  "Appeal",
  "Other",
];
const EVENT_TYPES = [
  "instructions_received",
  "aid_application_started",
  "aid_application_lodged",
  "grant_approved",
  "hearing",
  "extension_review",
  "extension_requested",
  "invoice_ready",
  "invoice_sent",
];

function createPlanner() {
  const now = new Date().toISOString();
  return {
    schemaVersion: 1,
    matterId: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    client: {
      firstName: "",
      lastName: "",
      fullName: "",
      fileNumber: "",
      dateOfBirth: "",
    },
    matter: {
      matterType: "",
      court: "",
      appearanceType: "",
      nextAppearanceDate: "",
      currentAppearanceComplete: false,
      lawyer: "",
      counsel: "",
      summary: "",
    },
    funding: {
      aidApplied: false,
      grantInPlace: false,
      grantType: "",
      vlaReference: "",
      currentStageCovered: "",
      extensionRequested: false,
      extensionDecision: "",
      missingRequirements: [],
    },
    billing: {
      lastInvoiceDate: "",
      billableItems: [],
      holdItems: [],
      extensionItems: [],
      approvalItems: [],
      billingNotes: "",
    },
    timeline: [],
    guidance: {
      status: "missing_info",
      nextAction: "Complete the matter details to assess the matter.",
      reasons: [],
      warnings: [],
    },
    notes: "",
  };
}

function stageCoversAppearance(stage, appearance) {
  const map = {
    "Advice only": [],
    Mention: ["Mention", "Contest Mention", "Conference"],
    Bail: ["Bail Application"],
    Plea: ["Plea"],
    Sentence: ["Sentence"],
    Committal: ["Committal"],
    "Trial prep": ["Conference"],
    Trial: ["Trial"],
    Appeal: ["Appeal"],
    Other: ["Other"],
  };

  return (map[stage] || []).includes(appearance);
}

function assessAidPlanner(data) {
  const reasons = [];
  const warnings = [];

  if (!data.matter.matterType || !data.matter.court || !data.matter.nextAppearanceDate) {
    return {
      status: "missing_info",
      nextAction: "Complete the missing matter details before guidance can be given.",
      reasons: ["Matter type, court, and next appearance date are required."],
      warnings: [],
    };
  }

  if (!data.funding.aidApplied && !data.funding.grantInPlace) {
    return {
      status: "apply_now",
      nextAction: "Apply for legal assistance now.",
      reasons: [
        "A future appearance is listed.",
        "No application or grant is currently recorded.",
      ],
      warnings,
    };
  }

  if (data.funding.aidApplied && !data.funding.grantInPlace) {
    return {
      status: "waiting_on_vla",
      nextAction: "Await the VLA funding decision and monitor for follow-up requests.",
      reasons: [
        "An aid application has been recorded.",
        "A grant is not yet marked as in place.",
      ],
      warnings,
    };
  }

  if (
    data.funding.grantInPlace &&
    data.matter.appearanceType &&
    data.funding.currentStageCovered &&
    !stageCoversAppearance(data.funding.currentStageCovered, data.matter.appearanceType)
  ) {
    return {
      status: "extension_review",
      nextAction: "Review and request an extension before the next appearance.",
      reasons: [
        "A grant is in place.",
        "The selected appearance does not appear to be covered by the current stage.",
      ],
      warnings,
    };
  }

  if (data.funding.extensionRequested && !data.funding.extensionDecision) {
    warnings.push("An extension has been requested but no decision is recorded yet.");
  }

  if (data.funding.grantInPlace && data.matter.currentAppearanceComplete) {
    return {
      status: "ready_to_bill",
      nextAction: "Review the covered items and prepare billing.",
      reasons: [
        "A grant is in place.",
        "The current appearance is marked complete.",
      ],
      warnings,
    };
  }

  return {
    status: "covered",
    nextAction: "Matter appears covered at the current stage.",
    reasons: [
      "A grant is in place.",
      "The selected appearance appears consistent with the covered stage.",
    ],
    warnings,
  };
}

function updateTimestamp(data) {
  return { ...data, updatedAt: new Date().toISOString() };
}

function downloadFile(name, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

function statusClasses(status) {
  const map = {
    missing_info: "bg-slate-100 text-slate-700",
    apply_now: "bg-amber-100 text-amber-800",
    waiting_on_vla: "bg-blue-100 text-blue-800",
    extension_review: "bg-rose-100 text-rose-800",
    covered: "bg-emerald-100 text-emerald-800",
    ready_to_bill: "bg-purple-100 text-purple-800",
  };
  return map[status] || "bg-slate-100 text-slate-700";
}

function Chip({ children }) {
  return <span className="inline-flex px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">{children}</span>;
}

export default function AidPlanner() {
  const [planner, setPlanner] = useState(() => createPlanner());
  const [showAdvanced, setShowAdvanced] = useState(false);
  const fileInputRef = useRef(null);

  const guidance = useMemo(() => assessAidPlanner(planner), [planner]);
  const missingCoreFields = useMemo(() => {
    const missing = [];
    if (!planner.matter.matterType) missing.push("Matter type");
    if (!planner.matter.court) missing.push("Court");
    if (!planner.matter.appearanceType) missing.push("Appearance type");
    if (!planner.matter.nextAppearanceDate) missing.push("Next appearance date");
    if (!planner.funding.aidApplied && !planner.funding.grantInPlace) missing.push("Funding position");
    if (planner.funding.grantInPlace && !planner.funding.currentStageCovered) missing.push("Current stage covered");
    return missing;
  }, [planner]);

  const setClientField = (field, value) => {
    setPlanner((prev) => {
      const client = { ...prev.client, [field]: value };
      client.fullName = [client.firstName, client.lastName].filter(Boolean).join(" ");
      return updateTimestamp({ ...prev, client });
    });
  };

  const setMatterField = (field, value) => {
    setPlanner((prev) => updateTimestamp({ ...prev, matter: { ...prev.matter, [field]: value } }));
  };

  const setFundingField = (field, value) => {
    setPlanner((prev) => updateTimestamp({ ...prev, funding: { ...prev.funding, [field]: value } }));
  };

  const setBillingField = (field, value) => {
    setPlanner((prev) => updateTimestamp({ ...prev, billing: { ...prev.billing, [field]: value } }));
  };

  const setNotes = (value) => {
    setPlanner((prev) => updateTimestamp({ ...prev, notes: value }));
  };

  const addTimelineEvent = () => {
    setPlanner((prev) =>
      updateTimestamp({
        ...prev,
        timeline: [
          ...prev.timeline,
          { id: crypto.randomUUID(), date: "", type: "hearing", title: "", source: "manual", note: "" },
        ],
      })
    );
  };

  const updateTimelineEvent = (id, field, value) => {
    setPlanner((prev) =>
      updateTimestamp({
        ...prev,
        timeline: prev.timeline.map((event) => (event.id === id ? { ...event, [field]: value } : event)),
      })
    );
  };

  const removeTimelineEvent = (id) => {
    setPlanner((prev) => updateTimestamp({ ...prev, timeline: prev.timeline.filter((event) => event.id !== id) }));
  };

  const handleDownloadPlanner = () => {
    const payload = {
      ...planner,
      guidance,
      updatedAt: new Date().toISOString(),
    };
    const safeName = [planner.client.lastName || "matter", planner.client.firstName || "planner"].join("-").toLowerCase();
    downloadFile(`aid-planner-${safeName}.json`, JSON.stringify(payload, null, 2), "application/json");
  };

  const handleUploadPlanner = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const parsed = JSON.parse(text);
    setPlanner({
      ...createPlanner(),
      ...parsed,
      client: { ...createPlanner().client, ...(parsed.client || {}) },
      matter: { ...createPlanner().matter, ...(parsed.matter || {}) },
      funding: { ...createPlanner().funding, ...(parsed.funding || {}) },
      billing: { ...createPlanner().billing, ...(parsed.billing || {}) },
      timeline: Array.isArray(parsed.timeline) ? parsed.timeline : [],
      updatedAt: new Date().toISOString(),
    });
    event.target.value = "";
  };

  const handleExportCalendar = () => {
    if (!planner.matter.nextAppearanceDate) return;
    const dt = planner.matter.nextAppearanceDate.replaceAll("-", "");
    const title = planner.matter.appearanceType || "Court event";
    const summary = `${planner.client.fullName || "Matter"} - ${title}`;
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//LACW//Aid Planner//EN",
      "BEGIN:VEVENT",
      `UID:${planner.matterId}`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z`,
      `DTSTART;VALUE=DATE:${dt}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${guidance.nextAction}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    downloadFile("aid-planner-event.ics", ics, "text/calendar");
  };

  const handlePrintSummary = () => {
    window.print();
  };

  const resetPlanner = () => {
    setPlanner(createPlanner());
  };

  return (
    <div className="min-h-screen bg-slate-50" id="aid-planner-print">
      <style>{`
        @media print {
          body { background: white !important; }
          .aid-planner-no-print { display: none !important; }
          .aid-planner-print-card { box-shadow: none !important; border: 1px solid #d1d5db !important; }
          .aid-planner-print-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div className="aid-planner-no-print bg-white border-b border-slate-200 px-6 py-3 flex items-center gap-4">
        <a
          href={createPageUrl("Home")}
          className="flex items-center gap-2 text-slate-600 hover:text-purple-600 transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Portal
        </a>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="aid-planner-print-card bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold uppercase tracking-wide">
                <CalendarDays className="w-3.5 h-3.5" />
                Portable matter planner
              </div>
              <h1 className="text-3xl font-bold text-slate-900 mt-3">Aid Planner</h1>
              <p className="text-slate-500 mt-2 max-w-2xl">
                Assess whether aid should be applied for, whether an extension is likely needed, and what appears billable now. Nothing is stored in the app long-term.
              </p>
            </div>

            <div className="aid-planner-no-print flex flex-wrap gap-2">
              <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:border-purple-300 hover:text-purple-700">
                <FileUp className="w-4 h-4 inline mr-2" />
                Upload planner
              </button>
              <button onClick={handleDownloadPlanner} className="px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700">
                <Download className="w-4 h-4 inline mr-2" />
                Download planner
              </button>
              <button onClick={handleExportCalendar} className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:border-purple-300 hover:text-purple-700">
                <CalendarDays className="w-4 h-4 inline mr-2" />
                Export ICS
              </button>
              <button onClick={handlePrintSummary} className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:border-purple-300 hover:text-purple-700">
                <Printer className="w-4 h-4 inline mr-2" />
                Download PDF summary
              </button>
              <button onClick={resetPlanner} className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:border-rose-300 hover:text-rose-700">
                <RefreshCcw className="w-4 h-4 inline mr-2" />
                Reset
              </button>
              <input ref={fileInputRef} type="file" accept=".json,application/json" onChange={handleUploadPlanner} className="hidden" />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <span className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${statusClasses(guidance.status)}`}>
              {guidance.status.replaceAll("_", " ")}
            </span>
            {planner.matter.nextAppearanceDate && <Chip>Next appearance: {planner.matter.nextAppearanceDate}</Chip>}
            {planner.funding.vlaReference && <Chip>VLA ref: {planner.funding.vlaReference}</Chip>}
            {planner.client.fullName && <Chip>{planner.client.fullName}</Chip>}
          </div>

          <div className="aid-planner-print-grid grid grid-cols-1 xl:grid-cols-3 gap-6 mt-8">
            <div className="xl:col-span-2 space-y-6">
              <section className="rounded-xl border border-slate-200 p-5">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Minimum info needed</h2>
                    <p className="text-sm text-slate-500 mt-1">Enter the required fields first. The planner can give useful guidance from this core information alone.</p>
                  </div>
                  <div className="aid-planner-no-print text-right">
                    <button
                      onClick={() => setShowAdvanced((value) => !value)}
                      className="px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:border-purple-300 hover:text-purple-700"
                    >
                      {showAdvanced ? "Hide optional details" : "Show optional details"}
                    </button>
                  </div>
                </div>

                {missingCoreFields.length > 0 && (
                  <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    <span className="font-medium">Still needed:</span> {missingCoreFields.join(", ")}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SelectField required label="Matter type" value={planner.matter.matterType} onChange={(value) => setMatterField("matterType", value)} options={MATTER_TYPES} />
                  <SelectField required label="Court" value={planner.matter.court} onChange={(value) => setMatterField("court", value)} options={COURTS} />
                  <SelectField required label="Appearance type" value={planner.matter.appearanceType} onChange={(value) => setMatterField("appearanceType", value)} options={APPEARANCE_TYPES} />
                  <label className="space-y-1 text-sm">
                    <span className="font-medium text-slate-700">Next appearance date <span className="text-rose-600">*</span></span>
                    <input type="date" value={planner.matter.nextAppearanceDate} onChange={(e) => setMatterField("nextAppearanceDate", e.target.value)} className="w-full h-10 border border-slate-200 rounded-lg px-3" />
                  </label>
                  <BooleanField label="Aid already applied?" value={planner.funding.aidApplied} onChange={(value) => setFundingField("aidApplied", value)} />
                  <BooleanField label="Grant already in place?" value={planner.funding.grantInPlace} onChange={(value) => setFundingField("grantInPlace", value)} />
                  {planner.funding.grantInPlace && (
                    <SelectField required label="Current stage covered" value={planner.funding.currentStageCovered} onChange={(value) => setFundingField("currentStageCovered", value)} options={STAGE_OPTIONS} />
                  )}
                </div>
              </section>

              {showAdvanced && (
                <>
                  <section className="rounded-xl border border-slate-200 p-5">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">Optional matter details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className="space-y-1 text-sm">
                        <span className="font-medium text-slate-700">Client first name</span>
                        <input value={planner.client.firstName} onChange={(e) => setClientField("firstName", e.target.value)} className="w-full h-10 border border-slate-200 rounded-lg px-3" />
                      </label>
                      <label className="space-y-1 text-sm">
                        <span className="font-medium text-slate-700">Client last name</span>
                        <input value={planner.client.lastName} onChange={(e) => setClientField("lastName", e.target.value)} className="w-full h-10 border border-slate-200 rounded-lg px-3" />
                      </label>
                      <label className="space-y-1 text-sm">
                        <span className="font-medium text-slate-700">File number</span>
                        <input value={planner.client.fileNumber} onChange={(e) => setClientField("fileNumber", e.target.value)} className="w-full h-10 border border-slate-200 rounded-lg px-3" />
                      </label>
                      <label className="space-y-1 text-sm">
                        <span className="font-medium text-slate-700">Date of birth</span>
                        <input type="date" value={planner.client.dateOfBirth} onChange={(e) => setClientField("dateOfBirth", e.target.value)} className="w-full h-10 border border-slate-200 rounded-lg px-3" />
                      </label>
                      <label className="space-y-1 text-sm">
                        <span className="font-medium text-slate-700">Lawyer</span>
                        <input value={planner.matter.lawyer} onChange={(e) => setMatterField("lawyer", e.target.value)} className="w-full h-10 border border-slate-200 rounded-lg px-3" />
                      </label>
                      <label className="space-y-1 text-sm">
                        <span className="font-medium text-slate-700">Counsel</span>
                        <input value={planner.matter.counsel} onChange={(e) => setMatterField("counsel", e.target.value)} className="w-full h-10 border border-slate-200 rounded-lg px-3" />
                      </label>
                      <SelectField label="Grant type" value={planner.funding.grantType} onChange={(value) => setFundingField("grantType", value)} options={GRANT_TYPES} />
                      <label className="space-y-1 text-sm">
                        <span className="font-medium text-slate-700">VLA reference</span>
                        <input value={planner.funding.vlaReference} onChange={(e) => setFundingField("vlaReference", e.target.value)} className="w-full h-10 border border-slate-200 rounded-lg px-3" />
                      </label>
                      <BooleanField label="Extension requested?" value={planner.funding.extensionRequested} onChange={(value) => setFundingField("extensionRequested", value)} />
                      <label className="space-y-1 text-sm">
                        <span className="font-medium text-slate-700">Extension decision</span>
                        <input value={planner.funding.extensionDecision} onChange={(e) => setFundingField("extensionDecision", e.target.value)} className="w-full h-10 border border-slate-200 rounded-lg px-3" />
                      </label>
                      <label className="space-y-1 text-sm md:col-span-2">
                        <span className="font-medium text-slate-700">Matter summary</span>
                        <textarea value={planner.matter.summary} onChange={(e) => setMatterField("summary", e.target.value)} rows={4} className="w-full border border-slate-200 rounded-lg px-3 py-2" />
                      </label>
                      <label className="space-y-1 text-sm md:col-span-2">
                        <span className="font-medium text-slate-700">Missing requirements</span>
                        <textarea
                          value={planner.funding.missingRequirements.join("\n")}
                          onChange={(e) => setFundingField("missingRequirements", e.target.value.split("\n").map((item) => item.trim()).filter(Boolean))}
                          rows={4}
                          placeholder="One item per line"
                          className="w-full border border-slate-200 rounded-lg px-3 py-2"
                        />
                      </label>
                    </div>
                  </section>

                  <section className="rounded-xl border border-slate-200 p-5">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">Optional billing details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className="space-y-1 text-sm">
                        <span className="font-medium text-slate-700">Last invoice date</span>
                        <input type="date" value={planner.billing.lastInvoiceDate} onChange={(e) => setBillingField("lastInvoiceDate", e.target.value)} className="w-full h-10 border border-slate-200 rounded-lg px-3" />
                      </label>
                      <label className="flex items-center gap-2 text-sm text-slate-700 md:col-span-1 mt-6">
                        <input type="checkbox" checked={planner.matter.currentAppearanceComplete} onChange={(e) => setMatterField("currentAppearanceComplete", e.target.checked)} />
                        Current appearance complete
                      </label>
                      <TextListField label="Billable now" values={planner.billing.billableItems} onChange={(values) => setBillingField("billableItems", values)} />
                      <TextListField label="Hold" values={planner.billing.holdItems} onChange={(values) => setBillingField("holdItems", values)} />
                      <TextListField label="Needs extension first" values={planner.billing.extensionItems} onChange={(values) => setBillingField("extensionItems", values)} />
                      <TextListField label="Needs approval" values={planner.billing.approvalItems} onChange={(values) => setBillingField("approvalItems", values)} />
                      <label className="space-y-1 text-sm md:col-span-2">
                        <span className="font-medium text-slate-700">Billing notes</span>
                        <textarea value={planner.billing.billingNotes} onChange={(e) => setBillingField("billingNotes", e.target.value)} rows={4} className="w-full border border-slate-200 rounded-lg px-3 py-2" />
                      </label>
                    </div>
                  </section>

                  <section className="rounded-xl border border-slate-200 p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-slate-900">Timeline</h2>
                      <button onClick={addTimelineEvent} className="aid-planner-no-print px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:border-purple-300 hover:text-purple-700">
                        <Plus className="w-4 h-4 inline mr-2" />
                        Add timeline event
                      </button>
                    </div>

                    {planner.timeline.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                        No timeline events yet.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {planner.timeline.map((event, index) => (
                          <div key={event.id} className="rounded-lg border border-slate-200 p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="font-medium text-slate-800">Event {index + 1}</div>
                              <button onClick={() => removeTimelineEvent(event.id)} className="aid-planner-no-print text-slate-400 hover:text-rose-600">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                              <label className="space-y-1 text-sm">
                                <span className="font-medium text-slate-700">Date</span>
                                <input type="date" value={event.date} onChange={(e) => updateTimelineEvent(event.id, "date", e.target.value)} className="w-full h-10 border border-slate-200 rounded-lg px-3" />
                              </label>
                              <SelectField compact label="Event type" value={event.type} onChange={(value) => updateTimelineEvent(event.id, "type", value)} options={EVENT_TYPES} />
                              <label className="space-y-1 text-sm">
                                <span className="font-medium text-slate-700">Title</span>
                                <input value={event.title} onChange={(e) => updateTimelineEvent(event.id, "title", e.target.value)} className="w-full h-10 border border-slate-200 rounded-lg px-3" />
                              </label>
                              <SelectField compact label="Source" value={event.source} onChange={(value) => updateTimelineEvent(event.id, "source", value)} options={["manual", "email", "calendar"]} />
                              <label className="space-y-1 text-sm md:col-span-2">
                                <span className="font-medium text-slate-700">Note</span>
                                <textarea value={event.note} onChange={(e) => updateTimelineEvent(event.id, "note", e.target.value)} rows={3} className="w-full border border-slate-200 rounded-lg px-3 py-2" />
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                </>
              )}
            </div>

            <div className="space-y-6">
              <section className="rounded-xl border border-slate-200 p-5 bg-slate-50">
                <h2 className="text-lg font-semibold text-slate-900 mb-3">Guidance</h2>
                <div className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${statusClasses(guidance.status)}`}>
                  {guidance.status.replaceAll("_", " ")}
                </div>
                <p className="text-slate-800 font-medium mt-4">{guidance.nextAction}</p>

                {guidance.reasons.length > 0 && (
                  <div className="mt-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Reasons</div>
                    <ul className="space-y-2 text-sm text-slate-700 list-disc pl-5">
                      {guidance.reasons.map((reason) => <li key={reason}>{reason}</li>)}
                    </ul>
                  </div>
                )}

                {guidance.warnings.length > 0 && (
                  <div className="mt-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Warnings</div>
                    <ul className="space-y-2 text-sm text-rose-700 list-disc pl-5">
                      {guidance.warnings.map((warning) => <li key={warning}>{warning}</li>)}
                    </ul>
                  </div>
                )}
              </section>

              <section className="rounded-xl border border-slate-200 p-5">
                <h2 className="text-lg font-semibold text-slate-900 mb-3">Portable workflow</h2>
                <ul className="space-y-3 text-sm text-slate-600">
                  <li>1. Complete or upload a planner file.</li>
                  <li>2. Review the aid, extension, and billing guidance.</li>
                  <li>3. Download the planner file and store it on your own device.</li>
                  <li>4. Re-upload later to continue the matter.</li>
                </ul>
              </section>

              <section className="rounded-xl border border-slate-200 p-5">
                <h2 className="text-lg font-semibold text-slate-900 mb-3">What you need first</h2>
                <ul className="space-y-2 text-sm text-slate-600 list-disc pl-5">
                  <li>Matter type</li>
                  <li>Court</li>
                  <li>Appearance type</li>
                  <li>Next appearance date</li>
                  <li>Whether aid has already been applied for</li>
                  <li>Whether a grant is already in place</li>
                  <li>Current stage covered, if a grant exists</li>
                </ul>
                {showAdvanced && (
                  <>
                    <div className="border-t border-slate-200 my-4" />
                    <h3 className="text-sm font-semibold text-slate-900 mb-3">Notes</h3>
                    <textarea
                      value={planner.notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={8}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                      placeholder="Freeform notes for the downloaded planner file..."
                    />
                  </>
                )}
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SelectField({ label, value, onChange, options, compact = false, required = false }) {
  return (
    <label className="space-y-1 text-sm">
      <span className="font-medium text-slate-700">{label}{required && <span className="text-rose-600"> *</span>}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={`w-full border border-slate-200 rounded-lg px-3 ${compact ? "h-10" : "h-10"}`}>
        <option value="">Select...</option>
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function BooleanField({ label, value, onChange }) {
  return (
    <label className="space-y-1 text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <select value={value ? "yes" : "no"} onChange={(e) => onChange(e.target.value === "yes")} className="w-full h-10 border border-slate-200 rounded-lg px-3">
        <option value="no">No</option>
        <option value="yes">Yes</option>
      </select>
    </label>
  );
}

function TextListField({ label, values, onChange }) {
  return (
    <label className="space-y-1 text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <textarea
        value={values.join("\n")}
        onChange={(e) => onChange(e.target.value.split("\n").map((item) => item.trim()).filter(Boolean))}
        rows={4}
        placeholder="One item per line"
        className="w-full border border-slate-200 rounded-lg px-3 py-2"
      />
    </label>
  );
}
