import { useState, useRef } from "react";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Printer, RotateCcw, Plus, X, Paperclip, Send, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const KM_RATE = 0.92;
const KM_VLA_RATE = 0.82;

const EMPTY_KM_ROW = { date: "", from: "", to: "", vla_ref: "", kilometers: "", vla_kilometers: "", client_name: "" };
const EMPTY_EXPENSE_ROW = { date: "", from: "", to: "", vla_ref: "", type: "", amount: "", reimbursement: "Y" };

const EMPTY_FORM = {
  employee_name: "",
  travel_type: "",
  client_names: "",
  lacw_file_numbers: "",
  vla_ref_numbers: "",
  reason_for_travel: "",
  date_of_request: "",
  km_rows: [{ ...EMPTY_KM_ROW }],
  expense_rows: [{ ...EMPTY_EXPENSE_ROW }],
  cost_recovery: "",
  notes: "",
};

export default function TravelClaims() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [receipts, setReceipts] = useState([]); // [{ name, url }]
  const [uploading, setUploading] = useState(false);
  const [sendTo, setSendTo] = useState("ejackson@completelawsupport.com");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const fileInputRef = useRef();

  const handleReceiptUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    const results = await Promise.all(files.map(file => base44.integrations.Core.UploadFile({ file })));
    const newFiles = results.map((r, i) => ({ name: files[i].name, url: r.file_url }));
    setReceipts(prev => [...prev, ...newFiles]);
    setUploading(false);
    e.target.value = "";
  };

  const removeReceipt = (i) => setReceipts(prev => prev.filter((_, idx) => idx !== i));

  const handleSendEmail = async () => {
    setSending(true);
    const kmLines = form.km_rows
      .filter(r => r.date || r.from || r.to)
      .map(r => `  ${r.date} | ${r.from} → ${r.to} | KMs: ${r.kilometers || 0} ($${((parseFloat(r.kilometers)||0)*KM_RATE).toFixed(2)}) | VLA KMs: ${r.vla_kilometers || 0} ($${((parseFloat(r.vla_kilometers)||0)*KM_VLA_RATE).toFixed(2)}) | Client: ${r.client_name}`)
      .join("\n");
    const expLines = form.expense_rows
      .filter(r => r.date || r.type || r.amount)
      .map(r => `  ${r.date} | ${r.from} → ${r.to} | ${r.type} | $${r.amount} | Reimbursement: ${r.reimbursement}`)
      .join("\n");
    const receiptLinks = receipts.map(r => `  ${r.name}: ${r.url}`).join("\n");

    const body = `LACW TRAVEL ALLOWANCE CLAIM

Employee: ${form.employee_name}
Date of Request: ${form.date_of_request}
Travel Type: ${form.travel_type}
Client/s: ${form.client_names}
LACW File/s: ${form.lacw_file_numbers}
VLA Ref/s: ${form.vla_ref_numbers}
Reason: ${form.reason_for_travel}
Cost Recovery: ${form.cost_recovery}

--- KM TRAVEL ---
${kmLines || "None"}

Total (standard $0.92/km): $${totalKmAmount.toFixed(2)}
Total (VLA $0.82/km): $${totalVlaKmAmount.toFixed(2)}

--- OTHER EXPENSES ---
${expLines || "None"}

Total Other Expenses: $${totalExpenses.toFixed(2)}

GRAND TOTAL: $${grandTotal.toFixed(2)}

--- NOTES ---
${form.notes || "None"}

--- RECEIPTS ---
${receiptLinks || "No receipts attached"}`;

    await base44.integrations.Core.SendEmail({
      to: sendTo,
      subject: `Travel Claim — ${form.employee_name || "Staff"} (${form.date_of_request || new Date().toLocaleDateString("en-AU")})`,
      body,
    });
    setSending(false);
    setSent(true);
    setTimeout(() => setSent(false), 3000);
  };

  const update = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const updateKmRow = (i, field, value) => {
    const rows = form.km_rows.map((r, idx) => idx === i ? { ...r, [field]: value } : r);
    setForm(f => ({ ...f, km_rows: rows }));
  };

  const addKmRow = () => setForm(f => ({ ...f, km_rows: [...f.km_rows, { ...EMPTY_KM_ROW }] }));
  const removeKmRow = (i) => setForm(f => ({ ...f, km_rows: f.km_rows.filter((_, idx) => idx !== i) }));

  const updateExpenseRow = (i, field, value) => {
    const rows = form.expense_rows.map((r, idx) => idx === i ? { ...r, [field]: value } : r);
    setForm(f => ({ ...f, expense_rows: rows }));
  };

  const addExpenseRow = () => setForm(f => ({ ...f, expense_rows: [...f.expense_rows, { ...EMPTY_EXPENSE_ROW }] }));
  const removeExpenseRow = (i) => setForm(f => ({ ...f, expense_rows: f.expense_rows.filter((_, idx) => idx !== i) }));

  const totalKm = form.km_rows.reduce((sum, r) => sum + (parseFloat(r.kilometers) || 0), 0);
  const totalKmAmount = totalKm * KM_RATE;
  const totalVlaKm = form.km_rows.reduce((sum, r) => sum + (parseFloat(r.vla_kilometers) || 0), 0);
  const totalVlaKmAmount = totalVlaKm * KM_VLA_RATE;
  const totalExpenses = form.expense_rows.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
  const grandTotal = totalKmAmount + totalVlaKmAmount + totalExpenses;

  const fmt = (n) => `$${n.toFixed(2)}`;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between print:hidden">
        <a href={createPageUrl("Home")} className="flex items-center gap-2 text-slate-600 hover:text-purple-600 transition-colors text-sm font-medium">
          <ArrowLeft className="w-4 h-4" />
          Back to Portal
        </a>
        <div className="text-center">
          <p className="font-semibold text-slate-800 text-sm">Staff Travel Claims</p>
          <p className="text-xs text-slate-400">Law and Advocacy Centre for Women</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setForm(EMPTY_FORM)} className="gap-1.5">
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </Button>
          <Button size="sm" onClick={() => window.print()} className="gap-1.5 bg-purple-600 hover:bg-purple-700">
            <Printer className="w-3.5 h-3.5" /> Print / Save PDF
          </Button>
        </div>
      </div>

      {/* Print header */}
      <div className="hidden print:block max-w-5xl mx-auto px-4 pt-6 pb-2">
        <div className="flex items-center justify-between border-b border-slate-300 pb-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">LACW Travel Allowance Summary</h1>
            <p className="text-sm text-slate-500">Law and Advocacy Centre for Women</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Summary Info */}
        <Card className="border-slate-200">
          <CardHeader><CardTitle className="text-lg">Travel Summary</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Employee Name</Label>
                <Input value={form.employee_name} onChange={e => update("employee_name", e.target.value)} placeholder="Full name" />
              </div>
              <div className="space-y-2">
                <Label>Date of Request</Label>
                <Input type="date" value={form.date_of_request} onChange={e => update("date_of_request", e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Travel Type</Label>
              <Select value={form.travel_type} onValueChange={v => update("travel_type", v)}>
                <SelectTrigger><SelectValue placeholder="Select travel type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Metro & regional travel & parking">Metro &amp; regional travel &amp; parking</SelectItem>
                  <SelectItem value="Regional travel only">Regional travel only</SelectItem>
                  <SelectItem value="Metro travel only">Metro travel only</SelectItem>
                  <SelectItem value="Parking only">Parking only</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Client Name/s</Label>
              <Input value={form.client_names} onChange={e => update("client_names", e.target.value)} placeholder="e.g. Jane Smith, John Doe" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>LACW File Number/s</Label>
                <Input value={form.lacw_file_numbers} onChange={e => update("lacw_file_numbers", e.target.value)} placeholder="e.g. 123456" />
              </div>
              <div className="space-y-2">
                <Label>VLA Reference Number/s</Label>
                <Input value={form.vla_ref_numbers} onChange={e => update("vla_ref_numbers", e.target.value)} placeholder="e.g. 25A826489" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Reason for Travel</Label>
              <Input value={form.reason_for_travel} onChange={e => update("reason_for_travel", e.target.value)} placeholder="e.g. Attend court for appearances" />
            </div>
          </CardContent>
        </Card>

        {/* Own Car Use */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg">Own Car Use — Kilometres Travelled</CardTitle>
            <p className="text-xs text-slate-500 mt-1">Rate: $0.92 per kilometre</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Table header */}
            <div className="hidden md:grid grid-cols-[110px_1fr_1fr_1fr_80px_100px_80px_100px_1fr_36px] gap-2 px-2">
              {["Date", "From", "To", "VLA Ref (Regional)", "KMs", "Amount ($0.92)", "KMs VLA", "Amount ($0.82)", "Client Name", ""].map((h, i) => (
                <span key={i} className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</span>
              ))}
            </div>

            {form.km_rows.map((row, i) => (
              <div key={i} className="grid grid-cols-1 md:grid-cols-[110px_1fr_1fr_1fr_80px_100px_80px_100px_1fr_36px] gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
                <Input type="date" value={row.date} onChange={e => updateKmRow(i, "date", e.target.value)} className="text-sm" />
                <Input value={row.from} onChange={e => updateKmRow(i, "from", e.target.value)} placeholder="From" className="text-sm" />
                <Input value={row.to} onChange={e => updateKmRow(i, "to", e.target.value)} placeholder="To" className="text-sm" />
                <Input value={row.vla_ref} onChange={e => updateKmRow(i, "vla_ref", e.target.value)} placeholder="VLA Ref" className="text-sm" />
                <Input
                  type="number"
                  min="0"
                  value={row.kilometers}
                  onChange={e => updateKmRow(i, "kilometers", e.target.value)}
                  placeholder="0"
                  className="text-sm"
                />
                <div className="flex items-center px-3 bg-white border border-slate-200 rounded-md text-sm text-slate-700 font-medium">
                  {row.kilometers ? fmt((parseFloat(row.kilometers) || 0) * KM_RATE) : "—"}
                </div>
                <Input
                  type="number"
                  min="0"
                  value={row.vla_kilometers}
                  onChange={e => updateKmRow(i, "vla_kilometers", e.target.value)}
                  placeholder="0"
                  className="text-sm"
                />
                <div className="flex items-center px-3 bg-white border border-slate-200 rounded-md text-sm text-slate-700 font-medium">
                  {row.vla_kilometers ? fmt((parseFloat(row.vla_kilometers) || 0) * KM_VLA_RATE) : "—"}
                </div>
                <Input value={row.client_name} onChange={e => updateKmRow(i, "client_name", e.target.value)} placeholder="Client name" className="text-sm" />
                <Button
                  variant="ghost" size="icon"
                  className="h-9 w-9 text-slate-400 hover:text-red-500"
                  onClick={() => removeKmRow(i)}
                  disabled={form.km_rows.length === 1}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}

            <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={addKmRow}>
              <Plus className="w-3.5 h-3.5" /> Add row
            </Button>

            <div className="flex flex-wrap justify-end gap-6 bg-purple-50 border border-purple-200 rounded-lg px-4 py-3 mt-2">
              <div className="text-sm text-slate-600">Total KMs (standard): <span className="font-bold text-slate-900">{totalKm.toFixed(0)} km = {fmt(totalKmAmount)}</span></div>
              <div className="text-sm text-slate-600">Total KMs VLA rate: <span className="font-bold text-slate-900">{totalVlaKm.toFixed(0)} km = {fmt(totalVlaKmAmount)}</span></div>
            </div>
          </CardContent>
        </Card>

        {/* Other Expenses */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg">Other Expenses for Regional Travel</CardTitle>
            <p className="text-xs text-slate-500 mt-1">Accommodation, taxis, reasonable meals — receipts required</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="hidden md:grid grid-cols-[110px_1fr_1fr_1fr_1fr_100px_120px_36px] gap-2 px-2">
              {["Date", "From", "To", "VLA Ref (Regional)", "Type", "Amount", "Reimbursement?", ""].map((h, i) => (
                <span key={i} className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</span>
              ))}
            </div>

            {form.expense_rows.map((row, i) => (
              <div key={i} className="grid grid-cols-1 md:grid-cols-[110px_1fr_1fr_1fr_1fr_100px_120px_36px] gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
                <Input type="date" value={row.date} onChange={e => updateExpenseRow(i, "date", e.target.value)} className="text-sm" />
                <Input value={row.from} onChange={e => updateExpenseRow(i, "from", e.target.value)} placeholder="From" className="text-sm" />
                <Input value={row.to} onChange={e => updateExpenseRow(i, "to", e.target.value)} placeholder="To" className="text-sm" />
                <Input value={row.vla_ref} onChange={e => updateExpenseRow(i, "vla_ref", e.target.value)} placeholder="VLA Ref" className="text-sm" />
                <Select value={row.type} onValueChange={v => updateExpenseRow(i, "type", v)}>
                  <SelectTrigger className="text-sm h-9"><SelectValue placeholder="Type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Accommodation">Accommodation</SelectItem>
                    <SelectItem value="Taxi / Uber">Taxi / Uber</SelectItem>
                    <SelectItem value="Breakfast">Breakfast</SelectItem>
                    <SelectItem value="Lunch">Lunch</SelectItem>
                    <SelectItem value="Dinner">Dinner</SelectItem>
                    <SelectItem value="Parking">Parking</SelectItem>
                    <SelectItem value="Toll">Toll</SelectItem>
                    <SelectItem value="Public transport">Public transport</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <Input type="number" min="0" step="0.01" value={row.amount} onChange={e => updateExpenseRow(i, "amount", e.target.value)} placeholder="0.00" className="text-sm" />
                <Select value={row.reimbursement} onValueChange={v => updateExpenseRow(i, "reimbursement", v)}>
                  <SelectTrigger className="text-sm h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Y">Yes</SelectItem>
                    <SelectItem value="N">No</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-red-500" onClick={() => removeExpenseRow(i)} disabled={form.expense_rows.length === 1}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}

            <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={addExpenseRow}>
              <Plus className="w-3.5 h-3.5" /> Add row
            </Button>

            <div className="flex justify-end bg-purple-50 border border-purple-200 rounded-lg px-4 py-3 mt-2">
              <div className="text-sm text-slate-600">Total Other Expenses: <span className="font-bold text-slate-900">{fmt(totalExpenses)}</span></div>
            </div>
          </CardContent>
        </Card>

        {/* Totals & Cost Recovery */}
        <Card className="border-slate-200">
          <CardHeader><CardTitle className="text-lg">Summary &amp; Cost Recovery</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-slate-100 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-slate-600">Own car use — standard rate ($0.92/km)</span><span className="font-semibold">{fmt(totalKmAmount)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-600">Own car use — VLA rate ($0.82/km)</span><span className="font-semibold">{fmt(totalVlaKmAmount)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-600">Other expenses</span><span className="font-semibold">{fmt(totalExpenses)}</span></div>
              <div className="flex justify-between text-base font-bold border-t border-slate-300 pt-2 mt-2"><span>Grand Total</span><span className="text-purple-700">{fmt(grandTotal)}</span></div>
            </div>

            <div className="space-y-2">
              <Label>Cost Recovery</Label>
              <Select value={form.cost_recovery} onValueChange={v => update("cost_recovery", v)}>
                <SelectTrigger><SelectValue placeholder="Select cost recovery method" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="VLA">VLA</SelectItem>
                  <SelectItem value="N/A">N/A</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={e => update("notes", e.target.value)} placeholder="Any additional notes..." rows={3} />
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-xs text-amber-800 space-y-1">
              <p className="font-bold">Meals policy reminders:</p>
              <p>• Meals claimable only for overnight stays: Breakfast (depart before 7am, max $20), Lunch (depart before 12pm, max $20), Dinner (return after 7pm, max $40)</p>
              <p>• Maximum VLA recovery per overnight stay: $170 (accommodation, meals and incidentals combined)</p>
              <p>• Receipts required for all expenses</p>
              <p>• Accommodation may be booked by employee (reimbursement) or through CEO using LACW Credit Card</p>
            </div>
          </CardContent>
        </Card>

        {/* Receipts & Email */}
        <Card className="border-slate-200 print:hidden">
          <CardHeader><CardTitle className="text-lg">Receipts &amp; Submit</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Upload Receipts</Label>
              <div className="flex items-center gap-2">
                <input ref={fileInputRef} type="file" multiple accept="image/*,application/pdf" className="hidden" onChange={handleReceiptUpload} />
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                  {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Paperclip className="w-3.5 h-3.5" />}
                  {uploading ? "Uploading…" : "Attach receipts"}
                </Button>
              </div>
              {receipts.length > 0 && (
                <div className="space-y-2 mt-2">
                  {receipts.map((file, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="flex items-center gap-2">
                        <Paperclip className="w-4 h-4 text-slate-400" />
                        <a href={file.url} target="_blank" rel="noreferrer" className="text-sm text-purple-600 hover:underline truncate max-w-xs">{file.name}</a>
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6 p-0 text-slate-400 hover:text-red-500" onClick={() => removeReceipt(i)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Send To</Label>
              <input
                type="email"
                value={sendTo}
                onChange={e => setSendTo(e.target.value)}
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                placeholder="recipient@example.com"
              />
            </div>

            <Button
              onClick={handleSendEmail}
              disabled={sending || sent || !sendTo || !form.employee_name}
              className="gap-2 bg-purple-600 hover:bg-purple-700"
            >
              {sent ? "✓ Sent!" : sending ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</> : <><Send className="w-4 h-4" /> Email claim &amp; receipts</>}
            </Button>
            {!form.employee_name && <p className="text-xs text-slate-400">Enter employee name above before sending.</p>}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3 pb-8 print:hidden">
          <Button variant="outline" onClick={() => setForm(EMPTY_FORM)} className="gap-2">
            <RotateCcw className="w-4 h-4" /> Reset
          </Button>
          <Button onClick={() => window.print()} className="gap-2 bg-purple-600 hover:bg-purple-700">
            <Printer className="w-4 h-4" /> Print / Save PDF
          </Button>
        </div>
      </div>
    </div>
  );
}