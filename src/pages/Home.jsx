import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { createPageUrl } from "@/utils";
import {
  FileText, Clipboard, ClipboardList, BookOpen,
  Briefcase, Scale, FileCheck, FilePen, ChevronRight, Package, Car, Receipt, CalendarDays
} from "lucide-react";
import { addToBundle } from "@/components/BundleBar";
import { Calendar } from "@/components/ui/calendar";
import { listGoogleCalendars, requestGoogleCalendarAccessToken } from "@/lib/googleCalendarClient";
import { listOutlookCalendars, requestMicrosoftCalendarAccessToken } from "@/lib/microsoftCalendarClient";

const tools = [
  { title: "Legal Aid Form Portal", description: "Victoria Legal Aid application form", icon: FileText, page: "LegalAidForm" },
  { title: "LACW Intake Form", description: "Client intake form dedicated portal", icon: Clipboard, page: "IntakeForm" },
  { title: "LACW Guidelines", description: "VLA guideline certification portal", icon: BookOpen, page: "Guidelines" },
  { title: "VLA Report Worksheet", description: "Medical/Psychologist/Psychiatrist report worksheet", icon: ClipboardList, page: "VLAReportWorksheet" },
  { title: "Additional Prep Worksheet", description: "Preparation fees worksheet — Senior Counsel, Senior Junior Counsel, Junior Counsel, or Solicitor", icon: Briefcase, page: "AdditionalPrepWorksheet" },
  { title: "Memo Precedent", description: "Create a funding request memo", icon: FilePen, page: "MemoPrecedent" },
  { title: "Means Calculator", description: "VLA means test quick calculator", icon: Scale, page: "MeansCalculator" },
  { title: "VLA Criminal Law Tools", description: "Grant finder & fees payable — all in one", icon: Scale, page: "VLATools" },
  { title: "LACW Billing", description: "Upload a diary PDF to process ATLAS claims", icon: FileText, page: "LACWBilling" },
  { title: "Staff Training Guide", description: "How to use all tools in the portal", icon: BookOpen, page: "TrainingGuide" },
  { title: "Backsheet to Counsel", description: "Prepare and print instructions for counsel", icon: FilePen, page: "BacksheetToCounsel" },
  { title: "Staff Travel Claims", description: "LACW travel allowance and expense claim form", icon: Car, page: "TravelClaims" },
  { title: "Claim costs", description: "Open the claim costs workspace", icon: Receipt, page: "ClaimCosts" },
  { title: "Aid Planner", description: "Portable aid, extension, and billing guidance planner", icon: CalendarDays, page: "AidPlanner" },
  { title: "Aid Request", description: "Submit an application for legal aid assistance", icon: FileCheck, page: "ApplyForAid" },
];

export default function Home() {
  const [bundled, setBundled] = useState({});
  const [selectedPortalDate, setSelectedPortalDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState("monthly");
  const [googleClientId, setGoogleClientId] = useState(() => window.localStorage.getItem("aidPlannerGoogleClientId") || "");
  const [googleAccessToken, setGoogleAccessToken] = useState(() => window.sessionStorage.getItem("aidPlannerGoogleCalendarAccessToken") || "");
  const [googleCalendars, setGoogleCalendars] = useState(() => {
    try {
      return JSON.parse(window.sessionStorage.getItem("aidPlannerGoogleCalendars") || "[]");
    } catch {
      return [];
    }
  });
  const [selectedGoogleCalendarId, setSelectedGoogleCalendarId] = useState(
    () => window.sessionStorage.getItem("aidPlannerGoogleSelectedCalendarId") || ""
  );
  const [outlookClientId, setOutlookClientId] = useState(() => window.localStorage.getItem("aidPlannerOutlookClientId") || "");
  const [outlookAccessToken, setOutlookAccessToken] = useState(() => window.sessionStorage.getItem("aidPlannerOutlookCalendarAccessToken") || "");
  const [outlookCalendars, setOutlookCalendars] = useState(() => {
    try {
      return JSON.parse(window.sessionStorage.getItem("aidPlannerOutlookCalendars") || "[]");
    } catch {
      return [];
    }
  });
  const [selectedOutlookCalendarId, setSelectedOutlookCalendarId] = useState(
    () => window.sessionStorage.getItem("aidPlannerOutlookSelectedCalendarId") || ""
  );
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);
  const [isConnectingOutlook, setIsConnectingOutlook] = useState(false);
  const [connectorError, setConnectorError] = useState("");
  const [connectorStatus, setConnectorStatus] = useState("");

  const selectedDateLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("en-AU", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(selectedPortalDate),
    [selectedPortalDate]
  );

  const selectedDayLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("en-AU", {
        weekday: "long",
      }).format(selectedPortalDate),
    [selectedPortalDate]
  );

  const selectedShortDateLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("en-AU", {
        day: "numeric",
        month: "short",
      }).format(selectedPortalDate),
    [selectedPortalDate]
  );

  const weekDates = useMemo(() => {
    const base = new Date(selectedPortalDate);
    const day = base.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    base.setDate(base.getDate() + mondayOffset);
    return Array.from({ length: 7 }, (_, index) => {
      const next = new Date(base);
      next.setDate(base.getDate() + index);
      return next;
    });
  }, [selectedPortalDate]);

  const isSameDay = (left, right) =>
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate();

  const persistGoogleConnection = (accessToken, calendars, selectedId) => {
    window.sessionStorage.setItem("aidPlannerGoogleCalendarAccessToken", accessToken);
    window.sessionStorage.setItem("aidPlannerGoogleCalendars", JSON.stringify(calendars));
    window.sessionStorage.setItem("aidPlannerGoogleSelectedCalendarId", selectedId || "");
  };

  const persistOutlookConnection = (accessToken, calendars, selectedId) => {
    window.sessionStorage.setItem("aidPlannerOutlookCalendarAccessToken", accessToken);
    window.sessionStorage.setItem("aidPlannerOutlookCalendars", JSON.stringify(calendars));
    window.sessionStorage.setItem("aidPlannerOutlookSelectedCalendarId", selectedId || "");
  };

  const handleBundle = (e, tool) => {
    e.preventDefault();
    e.stopPropagation();
    addToBundle(tool.title, `${tool.title} — ${tool.description}`);
    setBundled(b => ({ ...b, [tool.page]: true }));
    setTimeout(() => setBundled(b => ({ ...b, [tool.page]: false })), 1500);
  };

  const handleGoogleConnect = async () => {
    setIsConnectingGoogle(true);
    setConnectorError("");
    setConnectorStatus("");
    try {
      const accessToken = await requestGoogleCalendarAccessToken(googleClientId);
      const calendars = await listGoogleCalendars(accessToken);
      const selectedId = selectedGoogleCalendarId || calendars.find((item) => item.primary)?.id || calendars[0]?.id || "";
      setGoogleAccessToken(accessToken);
      setGoogleCalendars(calendars);
      setSelectedGoogleCalendarId(selectedId);
      window.localStorage.setItem("aidPlannerGoogleClientId", googleClientId);
      persistGoogleConnection(accessToken, calendars, selectedId);
      setConnectorStatus(`Google Calendar connected. ${calendars.length} calendar${calendars.length === 1 ? "" : "s"} ready for Aid Planner.`);
    } catch (error) {
      setConnectorError(error instanceof Error ? error.message : "Could not connect Google Calendar.");
    } finally {
      setIsConnectingGoogle(false);
    }
  };

  const handleOutlookConnect = async () => {
    setIsConnectingOutlook(true);
    setConnectorError("");
    setConnectorStatus("");
    try {
      const accessToken = await requestMicrosoftCalendarAccessToken(outlookClientId);
      const calendars = await listOutlookCalendars(accessToken);
      const selectedId = selectedOutlookCalendarId || calendars.find((item) => item.primary)?.id || calendars[0]?.id || "";
      setOutlookAccessToken(accessToken);
      setOutlookCalendars(calendars);
      setSelectedOutlookCalendarId(selectedId);
      window.localStorage.setItem("aidPlannerOutlookClientId", outlookClientId);
      persistOutlookConnection(accessToken, calendars, selectedId);
      setConnectorStatus(`Outlook Calendar connected. ${calendars.length} calendar${calendars.length === 1 ? "" : "s"} ready for Aid Planner.`);
    } catch (error) {
      setConnectorError(error instanceof Error ? error.message : "Could not connect Outlook Calendar.");
    } finally {
      setIsConnectingOutlook(false);
    }
  };

  const handleGoogleCalendarSelection = (value) => {
    setSelectedGoogleCalendarId(value);
    persistGoogleConnection(googleAccessToken, googleCalendars, value);
  };

  const handleOutlookCalendarSelection = (value) => {
    setSelectedOutlookCalendarId(value);
    persistOutlookConnection(outlookAccessToken, outlookCalendars, value);
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Top header */}
        <div className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between sticky top-0 z-[5]">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Law and Advocacy Centre for Women</h1>
            <p className="text-slate-500 text-sm mt-0.5">Staff Portal — select a tool to get started</p>
          </div>
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6994d499f463deaf526b6d79/69214a516_lacw-logo-purple-150_logolacw.png"
            alt="LACW Logo"
            className="h-12 object-contain"
          />
        </div>

        {/* Tool grid */}
        <div className="flex-1 px-8 py-8">
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.6fr)_380px]">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {tools.map((tool, i) => (
                <motion.a
                  key={tool.page}
                  href={createPageUrl(tool.page)}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 hover:shadow-md hover:border-purple-300 hover:scale-[1.01] transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[110px] group"
                >
                  <div>
                    <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center mb-2 group-hover:bg-purple-200 transition-colors">
                      <tool.icon className="w-4 h-4 text-purple-700" />
                    </div>
                    <p className="font-semibold text-slate-800 text-sm leading-snug">{tool.title}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{tool.description}</p>
                  </div>
                  <div className="flex justify-between items-center mt-4">
                    <button
                      onClick={(e) => handleBundle(e, tool)}
                      className="flex items-center gap-1 text-slate-400 hover:text-purple-600 text-xs transition-colors"
                      title="Add to bundle"
                    >
                      <Package className="w-3.5 h-3.5" />
                      {bundled[tool.page] ? "Added!" : "Bundle"}
                    </button>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-purple-500 transition-colors" />
                  </div>
                </motion.a>
              ))}
            </div>

            <motion.section
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              className="bg-white rounded-xl border border-slate-200 shadow-sm h-fit xl:sticky xl:top-28"
            >
              <div className="p-4">
                <div className="rounded-xl border border-slate-200 bg-[linear-gradient(135deg,#faf5ff_0%,#ffffff_55%,#f8fafc_100%)] px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center mb-2">
                        <CalendarDays className="w-4 h-4 text-purple-700" />
                      </div>
                      <p className="font-semibold text-slate-800 text-sm leading-snug">Portal calendar</p>
                      <p className="text-slate-500 text-xs mt-0.5">
                        Switch between weekly and monthly view, then open the related workflow.
                      </p>
                    </div>
                    <div className="rounded-xl border border-purple-200 bg-white px-3 py-2 text-right shadow-sm">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-purple-600">
                        {selectedDayLabel}
                      </p>
                      <p className="mt-1 text-lg font-bold text-slate-900">{selectedShortDateLabel}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCalendarView("weekly")}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                        calendarView === "weekly"
                          ? "bg-purple-600 text-white"
                          : "border border-slate-200 bg-white text-slate-600 hover:border-purple-300 hover:text-purple-700"
                      }`}
                    >
                      Weekly
                    </button>
                    <button
                      type="button"
                      onClick={() => setCalendarView("monthly")}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                        calendarView === "monthly"
                          ? "bg-purple-600 text-white"
                          : "border border-slate-200 bg-white text-slate-600 hover:border-purple-300 hover:text-purple-700"
                      }`}
                    >
                      Monthly
                    </button>
                  </div>
                </div>

                <div className="mt-4">
                  {calendarView === "monthly" ? (
                    <div className="rounded-xl border border-slate-200 bg-slate-50">
                      <Calendar
                        mode="single"
                        selected={selectedPortalDate}
                        onSelect={(date) => date && setSelectedPortalDate(date)}
                        className="w-full"
                      />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-2">
                      {weekDates.map((date) => {
                        const selected = isSameDay(date, selectedPortalDate);
                        return (
                          <button
                            key={date.toISOString()}
                            type="button"
                            onClick={() => setSelectedPortalDate(date)}
                            className={`rounded-xl border px-3 py-3 text-left transition-colors ${
                              selected
                                ? "border-purple-300 bg-purple-50 text-purple-900"
                                : "border-slate-200 bg-white text-slate-700 hover:border-purple-300 hover:bg-slate-50"
                            }`}
                          >
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em]">
                              {new Intl.DateTimeFormat("en-AU", { weekday: "short" }).format(date)}
                            </p>
                            <p className="mt-1 text-base font-bold">
                              {new Intl.DateTimeFormat("en-AU", { day: "numeric" }).format(date)}
                            </p>
                            <p className="text-xs text-slate-500">
                              {new Intl.DateTimeFormat("en-AU", { month: "short" }).format(date)}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Selected date</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{selectedDateLabel}</p>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Calendar connectors</p>
                  <p className="mt-1 text-sm text-slate-600">
                    Connect Google or Outlook here. Aid Planner will use the connected calendars instead of asking again on the appearances page.
                  </p>

                  <div className="mt-4 grid gap-4">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                      <p className="text-sm font-semibold text-slate-900">Google Calendar</p>
                      <div className="mt-3 grid gap-3">
                        <input
                          value={googleClientId}
                          onChange={(e) => setGoogleClientId(e.target.value)}
                          className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
                          placeholder="Google OAuth client ID"
                        />
                        {googleCalendars.length > 0 && (
                          <select
                            value={selectedGoogleCalendarId}
                            onChange={(e) => handleGoogleCalendarSelection(e.target.value)}
                            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
                          >
                            {googleCalendars.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.summary}
                              </option>
                            ))}
                          </select>
                        )}
                        <button
                          type="button"
                          onClick={handleGoogleConnect}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-purple-300 hover:text-purple-700"
                        >
                          {isConnectingGoogle ? "Connecting Google..." : googleAccessToken ? "Reconnect Google Calendar" : "Connect Google Calendar"}
                        </button>
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                      <p className="text-sm font-semibold text-slate-900">Outlook Calendar</p>
                      <div className="mt-3 grid gap-3">
                        <input
                          value={outlookClientId}
                          onChange={(e) => setOutlookClientId(e.target.value)}
                          className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
                          placeholder="Microsoft OAuth client ID"
                        />
                        {outlookCalendars.length > 0 && (
                          <select
                            value={selectedOutlookCalendarId}
                            onChange={(e) => handleOutlookCalendarSelection(e.target.value)}
                            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
                          >
                            {outlookCalendars.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.summary}
                              </option>
                            ))}
                          </select>
                        )}
                        <button
                          type="button"
                          onClick={handleOutlookConnect}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-purple-300 hover:text-purple-700"
                        >
                          {isConnectingOutlook ? "Connecting Outlook..." : outlookAccessToken ? "Reconnect Outlook Calendar" : "Connect Outlook Calendar"}
                        </button>
                      </div>
                    </div>
                  </div>

                  {connectorStatus && (
                    <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                      {connectorStatus}
                    </div>
                  )}

                  {connectorError && (
                    <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
                      {connectorError}
                    </div>
                  )}
                </div>

                <div className="mt-4 grid gap-3">
                  <a
                    href={createPageUrl("AidPlanner")}
                    className="flex items-center justify-between rounded-xl border border-purple-200 bg-purple-50 px-4 py-3 text-sm text-purple-900 hover:border-purple-300 hover:bg-purple-100 transition-colors"
                  >
                    <div>
                      <p className="font-semibold">Open Aid Planner</p>
                      <p className="text-xs text-purple-700/80">Create or send the next listing into a calendar.</p>
                    </div>
                    <ChevronRight className="h-4 w-4" />
                  </a>

                  <a
                    href={createPageUrl("LACWBilling")}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 hover:border-purple-300 hover:bg-slate-50 transition-colors"
                  >
                    <div>
                      <p className="font-semibold">Open LACW Billing</p>
                      <p className="text-xs text-slate-500">Process diary entries and track claimable appearances.</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </a>
                </div>
              </div>
            </motion.section>
          </div>

          {/* Footer */}
          <div className="mt-12 text-center text-slate-400 text-xs space-y-1 pb-8">
            <p>RMIT Building 152, Level 1 · 147-155 Pelham Street, Carlton, Vic 3053</p>
            <p>Tel 03 9448 8930 · 0415 330 198 · Fax 03 9923 6669</p>
            <a href="https://www.lacw.org.au" target="_blank" rel="noreferrer" className="text-purple-400 hover:text-purple-600 transition-colors">www.lacw.org.au</a>
          </div>
        </div>
      </div>
    </div>
  );
}
