import { useState, useRef } from "react";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Upload, FileText, Loader2, CheckCircle2, AlertCircle, RotateCcw, Copy, ChevronDown, ChevronUp, Send, X, Paperclip } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { parseLacwDiaryFileStandalone } from "@/lib/standaloneServices";
import BillingSummary from "@/components/billing/BillingSummary";

const BILLING_PARSER_VERSION = "20260424ai";

const EXTRACT_SCHEMA = {
  type: "object",
  properties: {
    entries: {
      type: "array",
      items: {
        type: "object",
        properties: {
          date: { type: "string", description: "Date of the appearance (DD/MM/YYYY format)" },
          client_name: { type: "string", description: "Client full name as written in the diary (e.g. WONGRAM, Nicole)" },
          grant_type: { type: "string", description: "Grant/funding type from brackets after client name: VC = VLA client, L = Legal Aid, V = victim-funded, VLA = VLA, pending = pending. Leave blank if not shown." },
          court: { type: "string", description: "Full court or tribunal name (e.g. Melbourne Magistrates' Court, Mildura County Court, Supreme Court)" },
          appearance_type: { type: "string", description: "Type of appearance â€” use the exact term from the diary: Mention, Further Mention, Contest, Plea, Sentence, Sentencing, Bail, Committal Mention, ARC Review, Filing Hearing, Case Assessment Hearing, Sentence Indication, Return for Sentence, ICML, CME, FVIO, etc." },
          lawyer_initials: { type: "string", description: "Initials of the LACW lawyer who appeared (e.g. CC, BJ, JW, BU, MZ, CB, EC, EM, AM, MP, RC)" },
          counsel_briefed: { type: "string", description: "Name of any external counsel briefed, if mentioned" },
          outcome: { type: "string", description: "Outcome or result of the appearance as noted in the diary" },
          next_date: { type: "string", description: "Next court date mentioned in the outcome, if any" },
          claimable: { type: "boolean", description: "True if this entry is a claimable VLA appearance (VC, L or VLA grant type, or clearly a legal aid matter). False for admin notes, public holidays, non-sitting days, remand calendars, or matters with no appearance." },
          atlas_claim_type: { type: "string", description: "Suggested ATLAS claim type. IMPORTANT: If the outcome notes an adjournment to a specific future date for a specific appearance type (e.g. 'adj to 15/4 for contest', 'adjourned to 3 June for plea'), set this to 'Confirm adj type' â€” the next appearance type is not yet billed. Otherwise use: 'Daily appearance fee' for mentions/adjournments; 'Contest hearing appearance' for contests; 'Appearance on sentence or adjournment' for sentence/return for sentence; 'Bail appearance fee' for bail applications; 'Committal mention / case conference appearance' for committal mentions; 'ARC â€“ Review Hearing' for ARC reviews; 'ARC â€“ Eligibility hearing' for ARC eligibility/finalisation; 'Active Case Management â€“ case assessment hearing' for case assessment hearings; 'Sentence indication' for sentence indications; 'Plea â€“ appearance fee (first day)' for pleas; 'Trial â€“ appearance fee (first day)' for trial day 1; 'Directions hearing / mention / callover' for callover/directions. Leave blank if not claimable." },
          notes: { type: "string", description: "Any other relevant notes, flags or observations from the diary entry" },
        }
      }
    },
    summary: { type: "string", description: "Brief summary: diary period covered, total entries found, total claimable entries" }
  }
};

const APPEARANCE_COLOR = {
  contest: "bg-red-50 border-red-200 text-red-700",
  plea: "bg-purple-50 border-purple-200 text-purple-700",
  bail: "bg-sky-50 border-sky-200 text-sky-700",
  mention: "bg-slate-50 border-slate-200 text-slate-700",
  conference: "bg-amber-50 border-amber-200 text-amber-700",
  sentence: "bg-orange-50 border-orange-200 text-orange-700",
  default: "bg-green-50 border-green-200 text-green-700",
};

function getAppearanceColor(type) {
  if (!type) return APPEARANCE_COLOR.default;
  const t = type.toLowerCase();
  for (const key of Object.keys(APPEARANCE_COLOR)) {
    if (t.includes(key)) return APPEARANCE_COLOR[key];
  }
  return APPEARANCE_COLOR.default;
}

const GRANT_BADGE = {
  VC: "bg-purple-100 text-purple-700 border-purple-200",
  L: "bg-blue-100 text-blue-700 border-blue-200",
  V: "bg-pink-100 text-pink-700 border-pink-200",
  VLA: "bg-green-100 text-green-700 border-green-200",
  pending: "bg-amber-100 text-amber-700 border-amber-200",
};

const ACTION_OPTIONS = [
  { value: "", label: "Set actionâ€¦" },
  { value: "Claimed", label: "Claimed" },
  { value: "Not claimed", label: "Not claimed" },
  { value: "Aid required", label: "Aid required" },
  { value: "Extension required", label: "Extension required" },
  { value: "Aid pending", label: "Aid pending" },
  { value: "ACF lodged", label: "ACF lodged" },
  { value: "Query", label: "Query" },
];

const ACTION_STYLE = {
  "Claimed": "bg-emerald-100 text-emerald-700 border-emerald-300",
  "Not claimed": "bg-slate-100 text-slate-500 border-slate-200",
  "Aid required": "bg-red-100 text-red-700 border-red-300",
  "Extension required": "bg-orange-100 text-orange-700 border-orange-300",
  "Aid pending": "bg-amber-100 text-amber-700 border-amber-300",
  "ACF lodged": "bg-teal-100 text-teal-700 border-teal-300",
  "Query": "bg-blue-100 text-blue-700 border-blue-300",
};

const STAFF = [
  { name: "Ashleigh McPhail", email: "amcphail@lacw.org.au" },
  { name: "Laura Heffes", email: "lheffes@lacw.org.au" },
  { name: "Ellen Murphy", email: "emurphy@lacw.org.au" },
  { name: "Ellie Pappas", email: "epappas@lacw.org.au" },
];

function EmailModal({ entry, actionType, onClose }) {
  const [selectedStaff, setSelectedStaff] = useState([]);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const toggleStaff = (email) => {
    setSelectedStaff(prev =>
      prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]
    );
  };

  const handleSend = async () => {
    if (!selectedStaff.length) return;
    setSending(true);
    const subject = `LACW â€“ ${actionType}: ${entry.client_name || "Client"} (${entry.date || ""})`;
    const body = `Hi,\n\nThis is a notification regarding the following matter:\n\nClient: ${entry.client_name || "â€”"}\nDate: ${entry.date || "â€”"}\nCourt: ${entry.court || "â€”"}\nAppearance Type: ${entry.appearance_type || "â€”"}\nGrant Type: ${entry.grant_type || "â€”"}\nATLAS Claim: ${entry.atlas_claim_type || "â€”"}\nOutcome: ${entry.outcome || "â€”"}\n\nAction Required: ${actionType}\n\n${message ? `Message:\n${message}\n\n` : ""}Please refer to the LACW Certification Tool for the relevant documentation.\n\nThis email was sent from the LACW Billing Portal.`;

    for (const email of selectedStaff) {
      await base44.integrations.Core.SendEmail({ to: email, subject, body });
    }
    setSending(false);
    setSent(true);
    setTimeout(() => { onClose(); }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <p className="font-semibold text-slate-800 text-sm">{actionType}</p>
            <p className="text-xs text-slate-400">{entry.client_name} Â· {entry.date}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Notify staff</p>
            <div className="space-y-2">
              {STAFF.map(s => (
                <label key={s.email} className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-slate-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedStaff.includes(s.email)}
                    onChange={() => toggleStaff(s.email)}
                    className="w-4 h-4 accent-purple-600"
                  />
                  <div>
                    <p className="text-sm font-medium text-slate-800">{s.name}</p>
                    <p className="text-xs text-slate-400">{s.email}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Message (optional)</p>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={3}
              placeholder="Add any additional context or notesâ€¦"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none"
            />
          </div>
          <p className="text-xs text-slate-400">The certification tool link and matter details will be included automatically.</p>
        </div>
        <div className="px-5 py-4 border-t border-slate-100 flex justify-end gap-3">
          <button onClick={onClose} className="text-sm text-slate-500 hover:text-slate-700 px-4 py-2 rounded-lg border border-slate-200 transition-colors">Cancel</button>
          <button
            onClick={handleSend}
            disabled={!selectedStaff.length || sending || sent}
            className="flex items-center gap-2 text-sm font-semibold bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {sent ? "âœ“ Sent!" : sending ? <><Loader2 className="w-4 h-4 animate-spin" /> Sendingâ€¦</> : <><Send className="w-4 h-4" /> Send</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function AppearanceRow({ entry, index, action, onActionChange }) {
  const [expanded, setExpanded] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [acfFile, setAcfFile] = useState(null); // { name, url }
  const [acfUploading, setAcfUploading] = useState(false);
  const acfInputRef = useRef();
  const colorClass = getAppearanceColor(entry.appearance_type);
  const isNotClaimable = entry.claimable === false;

  const handleActionSelect = (value) => {
    if (value === "Aid required" || value === "Extension required") {
      setPendingAction(value);
      setShowEmailModal(true);
    }
    if (value === "ACF lodged") {
      setExpanded(true);
    }
    onActionChange(index, value);
  };

  const handleEmailClose = () => {
    setShowEmailModal(false);
    setPendingAction(null);
  };

  const handleAcfUpload = async (file) => {
    if (!file) return;
    setAcfUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setAcfFile({ name: file.name, url: file_url });
    setAcfUploading(false);
    if (acfInputRef.current) acfInputRef.current.value = "";
  };

  return (
    <>
      {showEmailModal && (
        <EmailModal
          entry={entry}
          actionType={pendingAction}
          onClose={handleEmailClose}
        />
      )}
      <div className={`rounded-lg border overflow-hidden ${isNotClaimable ? "border-slate-100 opacity-60 bg-slate-50" : "border-slate-200 bg-white"}`}>
        <button
          onClick={() => setExpanded(e => !e)}
          className="w-full text-left px-3 py-2.5 flex items-start gap-3 hover:bg-slate-50 transition-colors"
        >
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-sm font-bold text-slate-900">{entry.date || "â€”"}</span>
              {entry.client_name && <span className="text-sm font-semibold text-slate-700">{entry.client_name}</span>}
              {entry.grant_type && (
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded border ${GRANT_BADGE[entry.grant_type] || "bg-slate-100 text-slate-600 border-slate-200"}`}>{entry.grant_type}</span>
              )}
              {entry.appearance_type && (
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${colorClass}`}>{entry.appearance_type}</span>
              )}
              {entry.lawyer_initials && (
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{entry.lawyer_initials}</span>
              )}
              {entry.court && <span className="text-xs text-slate-500">{entry.court}</span>}
            </div>
            {entry.atlas_claim_type && !isNotClaimable && (
              <div className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 border ${entry.atlas_claim_type === "Confirm adj type" ? "bg-amber-50 border-amber-300" : "bg-purple-50 border-purple-200"}`}>
                <span className={`text-xs font-medium ${entry.atlas_claim_type === "Confirm adj type" ? "text-amber-600" : "text-purple-500"}`}>ATLAS:</span>
                <span className={`text-xs font-semibold ${entry.atlas_claim_type === "Confirm adj type" ? "text-amber-800" : "text-purple-800"}`}>{entry.atlas_claim_type}</span>
              </div>
            )}
            {isNotClaimable && <span className="text-xs text-slate-400 italic">Not claimable</span>}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
            <select
              value={action || ""}
              onChange={e => handleActionSelect(e.target.value)}
              className={`text-xs font-semibold px-2 py-1 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-purple-300 cursor-pointer ${
                action ? ACTION_STYLE[action] : "bg-slate-50 text-slate-400 border-slate-200"
              }`}
            >
              {ACTION_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </div>
        </button>
        {expanded && (
          <div className="px-3 pb-3 pt-2 border-t border-slate-100 space-y-2 bg-slate-50">
            {entry.outcome && <div><p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-0.5">Outcome</p><p className="text-sm text-slate-700">{entry.outcome}</p></div>}
            {entry.next_date && <div><p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-0.5">Next Date</p><p className="text-sm text-slate-700">{entry.next_date}</p></div>}
            {entry.counsel_briefed && <div><p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-0.5">Counsel</p><p className="text-sm text-slate-700">{entry.counsel_briefed}</p></div>}
            {entry.notes && <div><p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-0.5">Notes</p><p className="text-sm text-slate-700">{entry.notes}</p></div>}
            {action === "ACF lodged" && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">ACF Document</p>
                <input ref={acfInputRef} type="file" accept="application/pdf,image/*,.doc,.docx" className="hidden" onChange={e => handleAcfUpload(e.target.files[0])} />
                {acfFile ? (
                  <div className="flex items-center gap-2 bg-teal-50 border border-teal-200 rounded-lg px-3 py-2">
                    <Paperclip className="w-3.5 h-3.5 text-teal-500 flex-shrink-0" />
                    <a href={acfFile.url} target="_blank" rel="noreferrer" className="text-xs text-teal-700 font-medium hover:underline truncate flex-1">{acfFile.name}</a>
                    <button onClick={() => setAcfFile(null)} className="text-slate-300 hover:text-red-400 transition-colors flex-shrink-0"><X className="w-3.5 h-3.5" /></button>
                  </div>
                ) : (
                  <button
                    onClick={() => acfInputRef.current?.click()}
                    disabled={acfUploading}
                    className="flex items-center gap-1.5 text-xs font-semibold text-teal-600 hover:text-teal-800 border border-teal-200 bg-teal-50 hover:bg-teal-100 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
                  >
                    {acfUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Paperclip className="w-3.5 h-3.5" />}
                    {acfUploading ? "Uploadingâ€¦" : "ACF lodgment confirmation"}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

function ClientGroup({ clientName, entries, grantType, actions, onActionChange }) {
  const [collapsed, setCollapsed] = useState(false);
  const grantBadge = GRANT_BADGE[grantType] || "bg-slate-100 text-slate-600 border-slate-200";
  const claimableCount = entries.filter(e => e.claimable !== false).length;
  const claimedCount = entries.filter(e => actions[e._idx] === "Claimed").length;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <button
        onClick={() => setCollapsed(c => !c)}
        className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors border-b border-slate-100"
      >
        <div className="flex-1 min-w-0 flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold text-slate-900">{clientName}</span>
          {grantType && <span className={`text-xs font-bold px-1.5 py-0.5 rounded border ${grantBadge}`}>{grantType}</span>}
          <span className="text-xs text-slate-400">{entries.length} appearance{entries.length !== 1 ? "s" : ""}{claimableCount < entries.length ? ` Â· ${claimableCount} claimable` : ""}</span>
          {claimedCount > 0 && <span className="text-xs font-semibold text-emerald-600">Â· {claimedCount} claimed</span>}
        </div>
        {collapsed ? <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" /> : <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" />}
      </button>
      {!collapsed && (
        <div className="p-3 space-y-2">
          {entries.map(entry => (
            <AppearanceRow
              key={entry._idx}
              entry={entry}
              index={entry._idx}
              action={actions[entry._idx]}
              onActionChange={onActionChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function LACWBilling() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [actions, setActions] = useState({});
  const fileRef = useRef();

  const handleActionChange = (index, value) => {
    setActions(prev => ({ ...prev, [index]: value }));
  };

  const handleFile = (f) => {
    if (!f || f.type !== "application/pdf") {
      setError("Please upload a PDF file.");
      return;
    }
    setFile(f);
    setResult(null);
    setError(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files[0]);
  };

  const handleProcess = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const extracted = await parseLacwDiaryFileStandalone(file);

      if (!extracted?.entries?.length) {
        const debugText = extracted?.debug
          ? ` [debug source=${extracted.debug.selectedSource}, pdfJs=${extracted.debug.pdfJsTextLength}, stream=${extracted.debug.streamTextLength}, ocr=${extracted.debug.ocrTextLength}, normalized=${extracted.debug.normalizedLength}, context=${extracted.debug.contextEntriesCount}, merged=${extracted.debug.mergedLineCount}, fallback=${extracted.debug.fallbackEntriesCount}]`
          : "";
        setError(`No entries extracted. The PDF may be a scanned image or unreadable. Try a different file.${debugText}`);
        setLoading(false);
        return;
      }

      setResult(extracted);
      setLoading(false);
    } catch (err) {
      setError("Error processing diary: " + (err?.message || "Unknown error"));
      setLoading(false);
    }
  };

  const handleCopyAll = () => {
    if (!result?.entries?.length) return;
    const text = result.entries.map((e, i) =>
      `#${i + 1} | ${e.date || ""} | ${e.client_name || ""} | ${e.court || ""} | ${e.appearance_type || ""} | ATLAS: ${e.atlas_claim_type || ""} | Outcome: ${e.outcome || ""}`
    ).join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    setError(null);
    setLoading(false);
    setActions({});
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between gap-4">
        <a href={createPageUrl("Home")} className="flex items-center gap-2 text-slate-600 hover:text-purple-600 transition-colors text-sm font-medium">
          <ArrowLeft className="w-4 h-4" />
          Back to Portal
        </a>
        <div className="text-center">
          <p className="font-semibold text-slate-800 text-sm">LACW Billing</p>
          <p className="text-xs text-slate-400">Diary to ATLAS claim processor</p>
          <div className="mt-1 inline-flex items-center rounded-full border border-purple-200 bg-purple-50 px-2 py-0.5 text-[11px] font-semibold text-purple-700">
            Parser {BILLING_PARSER_VERSION}
          </div>
        </div>
        {result ? (
          <button onClick={reset} className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm font-medium transition-colors">
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
        ) : <div className="w-20" />}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-8 pb-24">
        <div className="max-w-2xl mx-auto space-y-6">

          {/* Upload area */}
          {!result && (
            <div
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-10 text-center hover:border-purple-400 transition-colors cursor-pointer"
              onClick={() => fileRef.current?.click()}
            >
              <input ref={fileRef} type="file" accept="application/pdf" className="hidden" onChange={e => handleFile(e.target.files[0])} />
              {file ? (
                <div className="flex flex-col items-center gap-3">
                  <FileText className="w-10 h-10 text-purple-500" />
                  <p className="font-semibold text-slate-800">{file.name}</p>
                  <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB Â· Click to change</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <Upload className="w-10 h-10 text-slate-300" />
                  <p className="font-semibold text-slate-700">Drop your diary PDF here</p>
                  <p className="text-xs text-slate-400">or click to browse Â· PDF files only</p>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {file && !result && !loading && (
            <button
              onClick={handleProcess}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm transition-all shadow-md"
            >
              <FileText className="w-4 h-4" />
              Process diary &amp; extract claims
            </button>
          )}

          {loading && (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 flex flex-col items-center gap-4">
              <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
              <p className="font-semibold text-slate-700">Reading your diary PDFâ€¦</p>
              <p className="text-xs text-slate-400">This uses AI to extract and classify each entry. May take 15â€“30 seconds.</p>
            </div>
          )}

          {/* Results */}
          {result && (
            <>
              {(() => {
                const claimable = result.entries?.filter(e => e.claimable !== false) || [];
                const all = result.entries || [];
                const displayed = showAll ? all : claimable;
                return (
                  <>
                    <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-purple-900">
                          {claimable.length} claimable entries Â· {all.length} total extracted
                        </p>
                          {result.summary && (
                            <p className="text-xs text-purple-700 mt-0.5">
                              {result.summary}
                              {result.debug?.parserMode ? ` Parser source=${result.debug.parserMode}.` : ""}
                              {result.debug
                                ? ` Debug: source=${result.debug.selectedSource}, pdfJs=${result.debug.pdfJsTextLength}, legacy=${result.debug.legacyTextLength}, stream=${result.debug.streamTextLength}, ocr=${result.debug.ocrTextLength}, normalized=${result.debug.normalizedLength}, context=${result.debug.contextEntriesCount}, merged=${result.debug.mergedLineCount}, fallback=${result.debug.fallbackEntriesCount}`
                                : ""}
                            </p>
                          )}
                        </div>
                      <button onClick={handleCopyAll} className="flex items-center gap-1.5 text-xs font-semibold text-purple-600 hover:text-purple-800 border border-purple-300 rounded-lg px-3 py-1.5 transition-colors flex-shrink-0">
                        <Copy className="w-3.5 h-3.5" />
                        {copied ? "Copied!" : "Copy all"}
                      </button>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-2">
                        {[["contest", "Contest"], ["plea", "Plea"], ["bail", "Bail"], ["mention", "Mention"], ["conference", "Conference"], ["sentence", "Sentence"]].map(([key, label]) => (
                          <span key={key} className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${APPEARANCE_COLOR[key]}`}>{label}</span>
                        ))}
                      </div>
                      <button onClick={() => setShowAll(v => !v)} className="text-xs font-semibold text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg px-3 py-1.5 transition-colors flex-shrink-0 ml-2">
                        {showAll ? "Claimable only" : "Show all"}
                      </button>
                    </div>

                    {/* Entries grouped by client */}
                    <div className="space-y-3">
                      {(() => {
                        const tagged = displayed.map(entry => ({ ...entry, _idx: all.findIndex(e => e === entry) }));
                        const groups = [];
                        const seen = new Map();
                        tagged.forEach(entry => {
                          const key = (entry.client_name || "Unknown").trim().toUpperCase();
                          if (!seen.has(key)) {
                            seen.set(key, groups.length);
                            groups.push({ clientName: entry.client_name || "Unknown", grantType: entry.grant_type, entries: [] });
                          }
                          groups[seen.get(key)].entries.push(entry);
                        });
                        return groups.map((group, gi) => (
                          group.entries.length === 1
                            ? <AppearanceRow key={gi} entry={group.entries[0]} index={group.entries[0]._idx} action={actions[group.entries[0]._idx]} onActionChange={handleActionChange} />
                            : <ClientGroup key={gi} clientName={group.clientName} grantType={group.grantType} entries={group.entries} actions={actions} onActionChange={handleActionChange} />
                        ));
                      })()}
                    </div>
                  </>
                );
              })()}

              {!result.entries?.length && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-sm text-amber-800">No diary entries could be extracted from this PDF. Check that the file is a text-based PDF (not a scanned image) and try again.</p>
                </div>
              )}

              <p className="text-xs text-slate-400 text-center">AI extraction may not be 100% accurate. Always verify each entry against the original diary before submitting claims in ATLAS.</p>

              {/* Summary â€” show once every displayed entry has an action */}
              {(() => {
                const claimable = result.entries?.filter(e => e.claimable !== false) || [];
                const all = result.entries || [];
                const displayed = showAll ? all : claimable;
                const taggedAll = displayed.map(entry => ({ ...entry, _idx: all.findIndex(e => e === entry) }));
                const allActioned = taggedAll.length > 0 && taggedAll.every(e => !!actions[e._idx]);
                if (!allActioned) return null;
                return <BillingSummary entries={taggedAll} actions={actions} />;
              })()}
            </>
          )}
        </div>
      </div>
    </div>
  );
}






