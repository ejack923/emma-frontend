import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Printer } from "lucide-react";
import { addToBundle } from "@/components/BundleBar";
import FileCounter from "@/components/prep/FileCounter";
import PageCalculator from "@/components/prep/PageCalculator";

const CHARGE_TYPES = [
  "Affray", "Armed robbery", "Cause serious injury", "Drug cultivation",
  "Drug importation", "Drug trafficking", "Fraud", "Homicide", "Kidnapping",
  "Sexual offences", "Taxation offences", "Theft/burglary", "Other (give details)"
];
const CASE_TYPES = ["State law", "Commonwealth law"];
const STAGES = ["Committal", "Plea", "Trial"];
const SC_HOURLY_RATE = 436;
const PERUSAL_RATE = 90;
const SCAN_RATE = 180;

const SectionHeading = ({ children }) => (
  <h2 className="text-base font-bold text-blue-800 mt-8 mb-3 border-b border-blue-100 pb-1">{children}</h2>
);
const FieldLabel = ({ children }) => (
  <label className="block text-sm text-slate-700 mb-1">{children}</label>
);
const TextInput = ({ value, onChange, placeholder = "", className = "", type = "text" }) => (
  <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
    className={`w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 ${className}`} />
);
const NumInput = ({ value, onChange, className = "" }) => (
  <input type="number" min="0" value={value} onChange={e => onChange(parseFloat(e.target.value) || 0)}
    className={`border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 w-24 ${className}`} />
);
const TextArea = ({ value, onChange, rows = 3, placeholder = "" }) => (
  <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows} placeholder={placeholder}
    className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-y" />
);
const Row = ({ label, children }) => (
  <div className="flex items-center gap-4 mb-2">
    <span className="text-sm text-slate-700 w-52 flex-shrink-0">{label}</span>
    {children}
  </div>
);

export default function AdditionalPrepWorksheet() {
  const [form, setForm] = useState({
    clientName: "", vlaRefNo: "", charges: "", chargeType: "", chargeDetails: "",
    caseType: "", stage: "",
    statements: 0, committaltranscript: 0, previousTrialTranscript: 0, recordOfInterview: 0,
    photographs: 0, financialDocuments: 0, transcriptsLDTI: 0, surveillanceLogs: 0,
    otherExhibits: 0, otherExhibitsDetails: "", otherDocuments: 0, otherDocumentsDetails: "",
    excessScanningHours: 0,
    videoAudioHours: 0, videoAudioDetails: "",
    satisfiedPrep: "", satisfiedGrant: "",
    previousGrantMade: "", previousGrantDetails: "",
    nonsittingDays: 0,
    meansConfirm: false, practitionerConfirm: false,
    practitionerName: "", signature: "", signatureDate: "", firmNameAddress: "", reference: "",
  });

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const totalPerusals = form.statements + form.committaltranscript + form.previousTrialTranscript + form.recordOfInterview;
  const perusalsHours = totalPerusals / PERUSAL_RATE;
  const totalScanning = form.photographs + form.financialDocuments + form.transcriptsLDTI + form.surveillanceLogs + form.otherExhibits + form.otherDocuments;
  const scanningHoursBase = totalScanning / SCAN_RATE;
  const scanningHours = scanningHoursBase > 10 ? parseFloat(form.excessScanningHours) || 0 : scanningHoursBase;
  const videoHours = parseFloat(form.videoAudioHours) || 0;
  const subtotal = perusalsHours + scanningHours + videoHours;
  const billableHours = Math.max(0, subtotal - 8);
  const preparationAmount = billableHours * SC_HOURLY_RATE;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    await base44.integrations.Core.SendEmail({
      to: "ejackson@completelawsupport.com",
      subject: `Additional Prep Worksheet – ${form.clientName || "Unknown Client"} (${form.vlaRefNo || "No Ref"})`,
      body: `
PREPARATION FEES WORKSHEET/CHECKLIST - SENIOR COUNSEL - 2026 FEES
Application for Extension of Legal Assistance

CLIENT NAME: ${form.clientName}
VLA REF NO: ${form.vlaRefNo}

PART A: BACKGROUND
Charges: ${form.chargeType}${form.chargeDetails ? ` — ${form.chargeDetails}` : ""}
Additional charge detail: ${form.charges}
Type of case: ${form.caseType}
Stage of matter: ${form.stage}

PART B: INFORMATION
Material to peruse:
  Statements: ${form.statements} pages
  Committal transcript: ${form.committaltranscript} pages
  Previous trial transcript: ${form.previousTrialTranscript} pages
  Record of interview: ${form.recordOfInterview} pages
  TOTAL perusals: ${totalPerusals} pages = ${perusalsHours.toFixed(2)} hours at ${PERUSAL_RATE} pages/hr

Material to scan:
  Photographs: ${form.photographs} pages
  Financial documents: ${form.financialDocuments} pages
  Transcripts of LD/TI: ${form.transcriptsLDTI} pages
  Surveillance logs: ${form.surveillanceLogs} pages
  Other exhibits: ${form.otherExhibits} pages (${form.otherExhibitsDetails})
  Other documents: ${form.otherDocuments} pages (${form.otherDocumentsDetails})
  TOTAL scanning: ${totalScanning} pages = ${scanningHoursBase.toFixed(2)} hrs base${scanningHoursBase > 10 ? ` | Allowed hours (excess): ${form.excessScanningHours}` : ""}

Video/Audio Tapes/CDs: ${form.videoAudioHours} hours
  Details: ${form.videoAudioDetails}

PART C: RELEVANT GUIDELINE
Satisfied preparation is necessary: ${form.satisfiedPrep}

PART D: DECISION
Grant of assistance warranted: ${form.satisfiedGrant}
  Perusals: ${perusalsHours.toFixed(2)} hours
  Scanning: ${scanningHours.toFixed(2)} hours
  Video/Audio Tape: ${videoHours.toFixed(2)} hours
  Subtotal: ${subtotal.toFixed(2)} hours
  Less 8 hours: ${billableHours.toFixed(2)} hours at $${SC_HOURLY_RATE}/hr
  PREPARATION AMOUNT: $${preparationAmount.toFixed(2)}

Previous grant of aid made for preparation: ${form.previousGrantMade}
Previous grant details: ${form.previousGrantDetails}
Non-sitting days covered by ACF/VLA: ${form.nonsittingDays} days

PART E: MEANS
Client financial details unchanged since original application: ${form.meansConfirm ? "Confirmed" : "Not confirmed"}

PART F: PRACTITIONER RECOMMENDATION
Practitioner recommends assistance: ${form.practitionerConfirm ? "Confirmed" : "Not confirmed"}
Practitioner Name: ${form.practitionerName}
Date: ${form.signatureDate}
Firm Name/Address: ${form.firmNameAddress}
Reference: ${form.reference}
      `.trim()
    });
    setSubmitting(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow p-10 max-w-md w-full text-center">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Worksheet Submitted</h2>
          <p className="text-slate-500 text-sm mb-6">The worksheet has been sent to ejackson@completelawsupport.com</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => setSubmitted(false)} className="bg-blue-700 text-white px-6 py-2 rounded-lg text-sm hover:bg-blue-800 transition-colors">Submit Another</button>
            <a href={createPageUrl("Home")} className="bg-slate-100 text-slate-700 px-6 py-2 rounded-lg text-sm hover:bg-slate-200 transition-colors">Back to Portal</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <style>{`@media print { .no-print { display: none !important; } body { background: white !important; } }`}</style>

      {/* Back nav */}
      <div className="no-print bg-white border-b border-slate-200 px-6 py-3 flex items-center gap-4">
        <a href={createPageUrl("Home")}
          className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors text-sm font-medium">
          <ArrowLeft className="w-4 h-4" />
          Back to Portal
        </a>
      </div>

      <div className="py-10 px-4">
        <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-blue-700 to-blue-800 px-8 py-6 flex items-start justify-between">
            <div>
              <p className="text-blue-200 text-xs mb-1">Victoria Legal Aid — Application for Extension of Legal Assistance</p>
              <h1 className="text-white text-xl font-bold">Preparation Fees Worksheet/Checklist</h1>
              <h1 className="text-white text-xl font-bold">Senior Counsel — 2026 Fees</h1>
              <p className="text-blue-200 text-xs mt-2">For use by Section 29A Panel Practitioners (Simplified Grants Process)</p>
            </div>
            <div className="bg-white rounded-lg px-4 py-2 text-right flex-shrink-0">
              <p className="text-blue-700 font-bold text-sm leading-tight">Victoria</p>
              <p className="text-blue-700 font-bold text-sm leading-tight">Legal Aid</p>
              <p className="text-slate-500 text-xs">Lawyers And Legal Services</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="px-8 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div><FieldLabel>Client Name</FieldLabel><TextInput value={form.clientName} onChange={v => set("clientName", v)} /></div>
              <div><FieldLabel>VLA Ref No</FieldLabel><TextInput value={form.vlaRefNo} onChange={v => set("vlaRefNo", v)} /></div>
            </div>

            <SectionHeading>Part A: Background</SectionHeading>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <FieldLabel>Charges</FieldLabel>
                <select value={form.chargeType} onChange={e => set("chargeType", e.target.value)}
                  className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300">
                  <option value="">Select charge type...</option>
                  {CHARGE_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <FieldLabel>Details (provide further details re: charges if required)</FieldLabel>
                <TextInput value={form.chargeDetails} onChange={v => set("chargeDetails", v)} placeholder="Additional charge details..." />
              </div>
              <div>
                <FieldLabel>Type of case</FieldLabel>
                <select value={form.caseType} onChange={e => set("caseType", e.target.value)}
                  className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300">
                  <option value="">Select...</option>
                  {CASE_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <FieldLabel>Stage of matter</FieldLabel>
                <select value={form.stage} onChange={e => set("stage", e.target.value)}
                  className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300">
                  <option value="">Select...</option>
                  {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <SectionHeading>Part B: Information</SectionHeading>
            <p className="text-sm font-semibold text-slate-700 mb-3">Material to peruse</p>
            <div className="bg-slate-50 rounded-lg p-4 mb-4 space-y-2">
              <Row label="Statements"><NumInput value={form.statements} onChange={v => set("statements", v)} /><span className="text-sm text-slate-500">pages</span><FileCounter type="pdf" currentValue={form.statements} onCount={v => set("statements", v)} /><PageCalculator onResult={v => set("statements", v)} /></Row>
              <Row label="Committal transcript"><NumInput value={form.committaltranscript} onChange={v => set("committaltranscript", v)} /><span className="text-sm text-slate-500">pages</span><FileCounter type="pdf" currentValue={form.committaltranscript} onCount={v => set("committaltranscript", v)} /><PageCalculator onResult={v => set("committaltranscript", v)} /></Row>
              <Row label="Previous trial transcript"><NumInput value={form.previousTrialTranscript} onChange={v => set("previousTrialTranscript", v)} /><span className="text-sm text-slate-500">pages</span><FileCounter type="pdf" currentValue={form.previousTrialTranscript} onCount={v => set("previousTrialTranscript", v)} /><PageCalculator onResult={v => set("previousTrialTranscript", v)} /></Row>
              <Row label="Record of interview"><NumInput value={form.recordOfInterview} onChange={v => set("recordOfInterview", v)} /><span className="text-sm text-slate-500">pages</span><FileCounter type="pdf" currentValue={form.recordOfInterview} onCount={v => set("recordOfInterview", v)} /><PageCalculator onResult={v => set("recordOfInterview", v)} /></Row>
              <div className="border-t border-slate-200 pt-2 mt-2 flex items-center gap-4 text-sm font-semibold text-slate-700">
                <span className="w-52 flex-shrink-0">TOTAL perusals:</span>
                <span>{totalPerusals} pages</span>
                <span className="text-slate-500">= {perusalsHours.toFixed(2)} hours at {PERUSAL_RATE} pages/hr</span>
              </div>
            </div>

            <p className="text-sm font-semibold text-slate-700 mb-3">Material to scan</p>
            <div className="bg-slate-50 rounded-lg p-4 mb-4 space-y-2">
              <Row label="Photographs"><NumInput value={form.photographs} onChange={v => set("photographs", v)} /><span className="text-sm text-slate-500">pages</span><FileCounter type="pdf" currentValue={form.photographs} onCount={v => set("photographs", v)} /><PageCalculator onResult={v => set("photographs", v)} /></Row>
              <Row label="Financial documents"><NumInput value={form.financialDocuments} onChange={v => set("financialDocuments", v)} /><span className="text-sm text-slate-500">pages</span><FileCounter type="pdf" currentValue={form.financialDocuments} onCount={v => set("financialDocuments", v)} /><PageCalculator onResult={v => set("financialDocuments", v)} /></Row>
              <Row label="Transcripts of LD/TI"><NumInput value={form.transcriptsLDTI} onChange={v => set("transcriptsLDTI", v)} /><span className="text-sm text-slate-500">pages</span><FileCounter type="pdf" currentValue={form.transcriptsLDTI} onCount={v => set("transcriptsLDTI", v)} /><PageCalculator onResult={v => set("transcriptsLDTI", v)} /></Row>
              <Row label="Surveillance logs"><NumInput value={form.surveillanceLogs} onChange={v => set("surveillanceLogs", v)} /><span className="text-sm text-slate-500">pages</span><FileCounter type="pdf" currentValue={form.surveillanceLogs} onCount={v => set("surveillanceLogs", v)} /><PageCalculator onResult={v => set("surveillanceLogs", v)} /></Row>
              <div className="flex items-start gap-4 mb-2">
                <span className="text-sm text-slate-700 w-52 flex-shrink-0 pt-2">Other exhibits</span>
                <div className="flex items-center gap-2"><NumInput value={form.otherExhibits} onChange={v => set("otherExhibits", v)} /><span className="text-sm text-slate-500">pages</span><FileCounter type="pdf" currentValue={form.otherExhibits} onCount={v => set("otherExhibits", v)} /><PageCalculator onResult={v => set("otherExhibits", v)} /></div>
                <div className="flex-1"><TextInput value={form.otherExhibitsDetails} onChange={v => set("otherExhibitsDetails", v)} placeholder="Details..." /></div>
              </div>
              <div className="flex items-start gap-4 mb-2">
                <span className="text-sm text-slate-700 w-52 flex-shrink-0 pt-2">Other documents</span>
                <div className="flex items-center gap-2"><NumInput value={form.otherDocuments} onChange={v => set("otherDocuments", v)} /><span className="text-sm text-slate-500">pages</span><FileCounter type="pdf" currentValue={form.otherDocuments} onCount={v => set("otherDocuments", v)} /><PageCalculator onResult={v => set("otherDocuments", v)} /></div>
                <div className="flex-1"><TextInput value={form.otherDocumentsDetails} onChange={v => set("otherDocumentsDetails", v)} placeholder="Details..." /></div>
              </div>
              <div className="border-t border-slate-200 pt-2 mt-2 flex items-center gap-4 text-sm font-semibold text-slate-700">
                <span className="w-52 flex-shrink-0">TOTAL scanning:</span>
                <span>{totalScanning} pages</span>
                <span className="text-slate-500">= {scanningHoursBase.toFixed(2)} hours at {SCAN_RATE} pages/hr</span>
              </div>
              {scanningHoursBase > 10 && (
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-sm text-slate-700 w-52 flex-shrink-0">If in excess of 10 hours, allow:</span>
                  <NumInput value={form.excessScanningHours} onChange={v => set("excessScanningHours", v)} />
                  <span className="text-sm text-slate-500">hours</span>
                </div>
              )}
            </div>

            <p className="text-sm font-semibold text-slate-700 mb-2">Video/Audio Tapes/CDs</p>
            <p className="text-xs text-slate-500 mb-3">VLA will only allow the viewing or listening of the pertinent hours of tapes and not the whole of the recorded material. Please allow only a proportion of the relevant time dealing with the disputed or material issues and not the viewing of the tapes in their entirety. Do not include material that is duplicated in transcripts.</p>
            <div className="bg-slate-50 rounded-lg p-4 mb-4">
              <Row label="Video/Audio tapes/CDs"><NumInput value={form.videoAudioHours} onChange={v => set("videoAudioHours", v)} /><span className="text-sm text-slate-500">hours</span><FileCounter type="video" currentValue={form.videoAudioHours} onCount={v => set("videoAudioHours", parseFloat(v.toFixed(3)))} /><PageCalculator onResult={v => set("videoAudioHours", v)} unit="hours" /></Row>
              <div className="mt-2">
                <FieldLabel>Details (set out disputed/material issues, location and duration):</FieldLabel>
                <TextArea value={form.videoAudioDetails} onChange={v => set("videoAudioDetails", v)} rows={3} placeholder="e.g. Identification of accused in affray outside venue estimated 15 minutes, tape 4" />
              </div>
            </div>

            <SectionHeading>Part C: Relevant Guideline</SectionHeading>
            <p className="text-sm text-slate-600 mb-3">The relevant guideline is contained in fee schedule 4 of the Legal Aid Handbook (Part 23).</p>
            <div className="mb-4">
              <FieldLabel>I am satisfied / not satisfied that the preparation sought is necessary:</FieldLabel>
              <div className="flex gap-6 mt-2">
                {["satisfied", "not satisfied"].map(v => (
                  <label key={v} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="satisfiedPrep" value={v} checked={form.satisfiedPrep === v} onChange={() => set("satisfiedPrep", v)} className="w-4 h-4 accent-blue-700" />
                    <span className="text-sm font-semibold capitalize">{v}</span>
                  </label>
                ))}
              </div>
            </div>

            <SectionHeading>Part D: Decision</SectionHeading>
            <div className="mb-4">
              <FieldLabel>I am satisfied / not satisfied that a grant of assistance for additional preparation is warranted:</FieldLabel>
              <div className="flex gap-6 mt-2">
                {["satisfied", "not satisfied"].map(v => (
                  <label key={v} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="satisfiedGrant" value={v} checked={form.satisfiedGrant === v} onChange={() => set("satisfiedGrant", v)} className="w-4 h-4 accent-blue-700" />
                    <span className="text-sm font-semibold capitalize">{v}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm font-bold text-blue-800 mb-3">Calculation Summary</p>
              <div className="space-y-1 text-sm text-slate-700">
                <div className="flex justify-between"><span>Perusals:</span><span>{perusalsHours.toFixed(2)} hours</span></div>
                <div className="flex justify-between"><span>Scanning:</span><span>{scanningHours.toFixed(2)} hours</span></div>
                <div className="flex justify-between"><span>Video/Audio Tape:</span><span>{videoHours.toFixed(2)} hours</span></div>
                <div className="flex justify-between font-semibold border-t border-blue-200 pt-1 mt-1"><span>Subtotal:</span><span>{subtotal.toFixed(2)} hours</span></div>
                <div className="flex justify-between text-slate-500"><span>Less 8 hours at ${SC_HOURLY_RATE}/hr:</span><span>{billableHours.toFixed(2)} hrs</span></div>
                <div className="flex justify-between font-bold text-blue-800 border-t border-blue-300 pt-1 mt-1 text-base"><span>Preparation Amount:</span><span>${preparationAmount.toFixed(2)}</span></div>
              </div>
            </div>

            <div className="mb-4">
              <FieldLabel>Has a previous grant of aid been made for preparation in this matter?</FieldLabel>
              <div className="flex gap-6 mt-2 mb-2">
                {["Yes", "No"].map(v => (
                  <label key={v} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="previousGrantMade" value={v} checked={form.previousGrantMade === v} onChange={() => set("previousGrantMade", v)} className="w-4 h-4 accent-blue-700" />
                    <span className="text-sm font-semibold">{v}</span>
                  </label>
                ))}
              </div>
              {form.previousGrantMade === "Yes" && (
                <div className="mt-2">
                  <FieldLabel>Details of previous grants for preparation:</FieldLabel>
                  <TextArea value={form.previousGrantDetails} onChange={v => set("previousGrantDetails", v)} rows={3} />
                </div>
              )}
            </div>

            <div className="mb-4 flex items-center gap-4">
              <FieldLabel>Non-sitting days covered by ACF / payable by VLA:</FieldLabel>
              <NumInput value={form.nonsittingDays} onChange={v => set("nonsittingDays", v)} />
              <span className="text-sm text-slate-500">days</span>
            </div>

            <SectionHeading>Part E: Means</SectionHeading>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={form.meansConfirm} onChange={e => set("meansConfirm", e.target.checked)} className="w-4 h-4 mt-0.5 accent-blue-700" />
              <span className="text-sm text-slate-700">The client's financial details have not changed since originally applying for aid, and all documentary proof of means are retained on file.</span>
            </label>

            <SectionHeading>Part F: Practitioner Recommendation</SectionHeading>
            <label className="flex items-start gap-3 cursor-pointer mb-4">
              <input type="checkbox" checked={form.practitionerConfirm} onChange={e => set("practitionerConfirm", e.target.checked)} className="w-4 h-4 mt-0.5 accent-blue-700" />
              <span className="text-sm text-slate-700">In my opinion the application meets the requirements of the relevant guideline and I recommend that assistance be granted. All required substantiating documentation and information is on file. I have informed my client of this recommendation.</span>
            </label>
            <p className="text-xs text-slate-500 mb-4 bg-amber-50 border border-amber-200 rounded p-3">I acknowledge that under section 44(1) of the Legal Aid Act the provision of a false statement or a failure to disclose relevant information renders me liable to the penalties therein contained, and to action by VLA to remove me and my firm from the Simplified Grants Process and/or the referral panel maintained under section 30 of the Legal Aid Act.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div><FieldLabel>Print Practitioner's Name</FieldLabel><TextInput value={form.practitionerName} onChange={v => set("practitionerName", v)} /></div>
              <div><FieldLabel>Date</FieldLabel><TextInput type="date" value={form.signatureDate} onChange={v => set("signatureDate", v)} /></div>
              <div><FieldLabel>Name & Address of Firm</FieldLabel><TextArea value={form.firmNameAddress} onChange={v => set("firmNameAddress", v)} rows={2} /></div>
              <div><FieldLabel>Reference</FieldLabel><TextInput value={form.reference} onChange={v => set("reference", v)} /></div>
            </div>

            <div className="mt-8 flex justify-between items-center gap-3 no-print">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-2 border border-slate-300 text-slate-600 hover:bg-slate-50 font-medium px-6 py-3 rounded-lg transition-colors text-sm"
              >
                <Printer className="w-4 h-4" />
                Save / Print to PDF
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const content = `SENIOR COUNSEL PREPARATION FEES\n\nClient: ${form.clientName}\nVLA Ref: ${form.vlaRefNo}\nCharges: ${form.chargeType}\n\nAmount: $${preparationAmount.toFixed(2)}`;
                    addToBundle("Additional Prep (Senior Counsel)", content);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-3 rounded-lg transition-colors text-sm"
                >
                  Add to Bundle
                </button>
                <button type="submit" disabled={submitting}
                  className="bg-blue-700 hover:bg-blue-800 text-white font-semibold px-8 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  {submitting ? "Submitting..." : "Submit Worksheet"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}