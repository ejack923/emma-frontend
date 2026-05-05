import React, { useRef, useState } from "react";
import { APPEARANCE_TYPES, POST_APPEARANCE_ACTIONS } from "@/lib/aidPlannerSchema";
import {
  findClaimAvailabilityRow,
  formatClaimAvailabilityLabel,
  formatClaimedToDateLabel,
  formatClaimFeeLabel,
  getClaimAvailabilityTable,
  getClaimedToDateAmount,
  getClaimRowWarning,
  getPlannerAppearanceOptions,
  getClaimTrackerPreviewRows,
} from "@/lib/aidPlannerCriminalFees";
import {
  mapGoogleCalendarEventsToAppearanceClaims,
  parseAppearanceCalendarFile,
  parseAppearanceEvidenceFile,
} from "@/lib/aidPlannerAppearanceImport";
import {
  createGoogleCalendarEvent,
  listGoogleCalendarEvents,
} from "@/lib/googleCalendarClient";
import {
  createOutlookCalendarEvent,
} from "@/lib/microsoftCalendarClient";
import { BooleanField, SelectField } from "./PlannerFields";

export default function AidLifecycleSection({
  planner,
  setFinalisationField,
  addAppearanceClaim,
  updateAppearanceClaim,
  removeAppearanceClaim,
  importAppearanceClaims,
}) {
  const claims = planner.appearanceClaims || [];
  const calendarInputRef = useRef(null);
  const evidenceInputRef = useRef(null);
  const [importError, setImportError] = useState("");
  const [isImportingCalendar, setIsImportingCalendar] = useState(false);
  const [isImportingEvidence, setIsImportingEvidence] = useState(false);
  const [googleAccessToken] = useState(() => window.sessionStorage.getItem("aidPlannerGoogleCalendarAccessToken") || "");
  const [googleCalendars] = useState(() => {
    try {
      return JSON.parse(window.sessionStorage.getItem("aidPlannerGoogleCalendars") || "[]");
    } catch {
      return [];
    }
  });
  const [selectedGoogleCalendarId] = useState(() => window.sessionStorage.getItem("aidPlannerGoogleSelectedCalendarId") || "");
  const [googleDateFrom, setGoogleDateFrom] = useState(() => new Date().toISOString().slice(0, 10));
  const [googleDateTo, setGoogleDateTo] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() + 3);
    return date.toISOString().slice(0, 10);
  });
  const [isImportingGoogle, setIsImportingGoogle] = useState(false);
  const [isCreatingGoogleEvent, setIsCreatingGoogleEvent] = useState(false);
  const [outlookAccessToken] = useState(() => window.sessionStorage.getItem("aidPlannerOutlookCalendarAccessToken") || "");
  const [outlookCalendars] = useState(() => {
    try {
      return JSON.parse(window.sessionStorage.getItem("aidPlannerOutlookCalendars") || "[]");
    } catch {
      return [];
    }
  });
  const [selectedOutlookCalendarId] = useState(() => window.sessionStorage.getItem("aidPlannerOutlookSelectedCalendarId") || "");
  const [isCreatingOutlookEvent, setIsCreatingOutlookEvent] = useState(false);
  const [calendarStatus, setCalendarStatus] = useState("");
  const isAidApproved =
    planner.aid?.applicationStatus === "Aid granted" ||
    planner.application?.decisionResult === "Granted" ||
    planner.funding?.grantInPlace;
  const appearanceOptions =
    planner.matter.matterType === "Criminal"
      ? [...new Set([...getPlannerAppearanceOptions(planner.matter.court, planner.aid?.aidTypeList || []), "Other"])]
      : APPEARANCE_TYPES;
  const claimAvailabilityRows = getClaimAvailabilityTable(planner);
  const previewClaimRows = getClaimTrackerPreviewRows(planner);
  const visibleClaimRows = claimAvailabilityRows.length > 0 ? claimAvailabilityRows : previewClaimRows;
  const grantTypeLabel = Array.isArray(planner.aid?.aidTypeList) && planner.aid.aidTypeList.length > 0
    ? planner.aid.aidTypeList.join("; ")
    : planner.aid?.aidType || "";
  const claimedToDateTotal = visibleClaimRows.reduce((sum, row) => sum + getClaimedToDateAmount(row), 0);
  const claimedToDateTotalLabel = new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(claimedToDateTotal);

  const buildPlannerCalendarDraft = () => {
    const listingDate = planner.matter?.nextAppearanceDate;
    if (!listingDate) {
      throw new Error("Add the next listing date before sending the matter to a calendar.");
    }

    const clientName =
      planner.client?.fullName ||
      [planner.client?.firstName, planner.client?.lastName].filter(Boolean).join(" ") ||
      "Matter";
    const listingType = planner.matter?.appearanceType || "Court listing";
    const locationParts = [planner.matter?.court, planner.matter?.location].filter(Boolean);
    const descriptionLines = [
      `Client: ${clientName}`,
      listingType ? `Next listing type: ${listingType}` : "",
      planner.aid?.aidNumber ? `Aid number: ${planner.aid.aidNumber}` : "",
      planner.aid?.aidTypeList?.length ? `Aid type: ${planner.aid.aidTypeList.join("; ")}` : "",
      locationParts.length ? `Court: ${locationParts.join(" - ")}` : "",
      planner.guidance?.nextAction ? `Planner note: ${planner.guidance.nextAction}` : "",
    ].filter(Boolean);

    const startDate = new Date(`${listingDate}T00:00:00`);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);
    const toIsoLocal = (value) => `${value.toISOString().slice(0, 10)}T00:00:00`;

    return {
      summary: `${clientName} - ${listingType}`,
      description: descriptionLines.join("\n"),
      location: planner.matter?.location || planner.matter?.court || "",
      listingDate,
      googleEvent: {
        summary: `${clientName} - ${listingType}`,
        description: descriptionLines.join("\n"),
        location: planner.matter?.location || planner.matter?.court || "",
        start: { date: listingDate },
        end: { date: endDate.toISOString().slice(0, 10) },
      },
      outlookEvent: {
        subject: `${clientName} - ${listingType}`,
        body: {
          contentType: "text",
          content: descriptionLines.join("\n"),
        },
        location: {
          displayName: planner.matter?.location || planner.matter?.court || "",
        },
        isAllDay: true,
        start: {
          dateTime: toIsoLocal(startDate),
          timeZone: "UTC",
        },
        end: {
          dateTime: toIsoLocal(endDate),
          timeZone: "UTC",
        },
      },
    };
  };

  const getEffectiveDateWarning = (claim) => {
    if (!planner.aid?.effectiveDate || !claim?.date) return "";
    if (claim.date >= planner.aid.effectiveDate) return "";
    return "The aid effective date is after your appearance. You cannot claim this appearance with your current grant. You may need to apply for a retropective grant to cover this claim.";
  };

  const handleCalendarImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsImportingCalendar(true);
    setImportError("");
    setCalendarStatus("");
    try {
      const items = await parseAppearanceCalendarFile(file, planner);
      importAppearanceClaims(items);
      setCalendarStatus(
        items.length > 0
          ? `Imported ${items.length} calendar event${items.length === 1 ? "" : "s"} relevant to this matter.`
          : "No calendar events matched this matter's client and aid details."
      );
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "Could not import the calendar file.");
    } finally {
      setIsImportingCalendar(false);
      event.target.value = "";
    }
  };

  const handleEvidenceImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsImportingEvidence(true);
    setImportError("");
    setCalendarStatus("");
    try {
      const items = await parseAppearanceEvidenceFile(file);
      importAppearanceClaims(items);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "Could not parse the uploaded file note, order, or memo.");
    } finally {
      setIsImportingEvidence(false);
      event.target.value = "";
    }
  };

  const handleGoogleImport = async () => {
    setIsImportingGoogle(true);
    setImportError("");
    setCalendarStatus("");
    try {
      const events = await listGoogleCalendarEvents(
        googleAccessToken,
        selectedGoogleCalendarId,
        googleDateFrom,
        googleDateTo
      );
      const calendarLabel =
        googleCalendars.find((item) => item.id === selectedGoogleCalendarId)?.summary || "Google";
      const mapped = mapGoogleCalendarEventsToAppearanceClaims(events, calendarLabel, planner);
      importAppearanceClaims(mapped);
      setCalendarStatus(
        mapped.length > 0
          ? `Imported ${mapped.length} Google event${mapped.length === 1 ? "" : "s"} from ${calendarLabel} that match this matter.`
          : `No Google events in ${calendarLabel} matched this matter's client and aid details.`
      );
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "Could not import Google Calendar events.");
    } finally {
      setIsImportingGoogle(false);
    }
  };

  const handleGoogleCreateEvent = async () => {
    setIsCreatingGoogleEvent(true);
    setImportError("");
    setCalendarStatus("");
    try {
      const draft = buildPlannerCalendarDraft();
      const response = await createGoogleCalendarEvent(googleAccessToken, selectedGoogleCalendarId, draft.googleEvent);
      const calendarLabel =
        googleCalendars.find((item) => item.id === selectedGoogleCalendarId)?.summary || "Google Calendar";
      setCalendarStatus(`Created Google calendar event in ${calendarLabel}: ${response.summary || draft.summary}.`);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "Could not create the Google Calendar event.");
    } finally {
      setIsCreatingGoogleEvent(false);
    }
  };

  const handleOutlookCreateEvent = async () => {
    setIsCreatingOutlookEvent(true);
    setImportError("");
    setCalendarStatus("");
    try {
      const draft = buildPlannerCalendarDraft();
      const response = await createOutlookCalendarEvent(
        outlookAccessToken,
        selectedOutlookCalendarId,
        draft.outlookEvent
      );
      const calendarLabel =
        outlookCalendars.find((item) => item.id === selectedOutlookCalendarId)?.summary || "Outlook Calendar";
      setCalendarStatus(`Created Outlook calendar event in ${calendarLabel}: ${response.subject || draft.summary}.`);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "Could not create the Outlook calendar event.");
    } finally {
      setIsCreatingOutlookEvent(false);
    }
  };

  return (
    <>
      <section className="rounded-xl border border-slate-200 p-5">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Appearances and claims</h2>

        {!isAidApproved ? (
          <p className="text-sm text-slate-500">This section will appear once aid is approved.</p>
        ) : (
          <>
            {(claimAvailabilityRows.length > 0 || planner.matter.matterType === "Criminal") && (
              <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
                <div className="mb-3">
                  <h4 className="text-sm font-semibold text-slate-900">Claim allocation tracker</h4>
                  {grantTypeLabel && (
                    <p className="mt-1 text-sm font-medium text-purple-700">Grant type: {grantTypeLabel}</p>
                  )}
                  <p className="mt-1 text-sm text-slate-500">
                    This table shows the fees, claimable appearance types, available days or lump sums, and what remains after lodged claims are counted.
                  </p>
                </div>
                {claimAvailabilityRows.length === 0 && (
                  <div className="mb-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                    Showing the currently supported claim table preview. Once the matter is recognised as a supported aid type, the claimed and remaining balances will calculate live.
                  </div>
                )}
                <div className="overflow-x-auto">
                  <table className="w-full table-fixed divide-y divide-slate-200 text-xs">
                    <thead>
                      <tr className="text-left text-slate-600">
                        <th className="w-[28%] px-2 py-2 font-semibold">Appearance type</th>
                        <th className="w-[14%] px-2 py-2 font-semibold whitespace-nowrap">Available</th>
                        <th className="w-[14%] px-2 py-2 font-semibold whitespace-nowrap">Fee</th>
                        <th className="w-[10%] px-2 py-2 font-semibold whitespace-nowrap">Claimed</th>
                        <th className="w-[16%] px-2 py-2 font-semibold whitespace-nowrap">Remaining</th>
                        <th className="w-[18%] px-2 py-2 font-semibold whitespace-nowrap">Claimed to date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {visibleClaimRows.map((row) => {
                        const isLow = row.remaining <= 1;
                        return (
                          <tr key={row.feeType} className={isLow ? "bg-amber-50" : ""}>
                            <td className="px-2 py-2 font-medium text-slate-900 break-words">{row.appearanceType}</td>
                            <td className="px-2 py-2 text-slate-700">{formatClaimAvailabilityLabel(row)}</td>
                            <td className="px-2 py-2 text-slate-700 whitespace-nowrap">{formatClaimFeeLabel(row)}</td>
                            <td className="px-2 py-2 text-slate-700">{row.claimed}</td>
                            <td className={`px-2 py-2 font-medium ${isLow ? "text-amber-700" : "text-slate-900"}`}>
                              {row.remainingLabel}
                            </td>
                            <td className="px-2 py-2 text-slate-700 whitespace-nowrap">{formatClaimedToDateLabel(row)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-slate-200 bg-slate-50">
                        <td className="px-2 py-2 font-semibold text-slate-900">Total</td>
                        <td className="px-2 py-2" />
                        <td className="px-2 py-2" />
                        <td className="px-2 py-2" />
                        <td className="px-2 py-2" />
                        <td className="px-2 py-2 font-semibold text-slate-900 whitespace-nowrap">{claimedToDateTotalLabel}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {claims.length === 0 ? (
              <div className="mt-4 rounded-lg border border-dashed border-slate-200 bg-white px-4 py-5 text-sm text-slate-500">
                No appearances recorded yet.
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                {claims.map((claim) => {
                  const claimAvailability = findClaimAvailabilityRow(planner, claim);
                  const claimWarning = getClaimRowWarning(claim, claimAvailability);
                  const effectiveDateWarning = getEffectiveDateWarning(claim);

                  return (
                    <div
                      key={claim.id}
                      className={`rounded-xl border bg-white p-4 ${claimWarning || effectiveDateWarning ? "border-rose-300 bg-rose-50/40" : "border-slate-200"}`}
                    >
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <div className="text-sm font-semibold text-slate-900">
                          {claim.customAppearanceType || claim.appearanceType || claim.date || "New appearance"}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAppearanceClaim(claim.id)}
                          className="text-sm font-medium text-rose-600 hover:text-rose-700"
                        >
                          Remove
                        </button>
                      </div>

                      {grantTypeLabel && (
                        <div className="mb-4 rounded-lg border border-purple-100 bg-purple-50 px-3 py-2 text-sm font-medium text-purple-700">
                          Grant type: {grantTypeLabel}
                        </div>
                      )}

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                        <label className="space-y-1 text-sm">
                          <span className="font-medium text-slate-700">Appearance date</span>
                          <input
                            type="date"
                            value={claim.date}
                            onChange={(e) => updateAppearanceClaim(claim.id, "date", e.target.value)}
                            className="h-10 w-full rounded-lg border border-slate-200 px-3"
                          />
                        </label>

                        <SelectField
                          label="Appearance type"
                          value={claim.appearanceType}
                          onChange={(value) => updateAppearanceClaim(claim.id, "appearanceType", value)}
                          options={appearanceOptions}
                        />

                        <div className="space-y-2 text-sm">
                          <button
                            type="button"
                            onClick={() => updateAppearanceClaim(claim.id, "appearanceType", "Other")}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-purple-300 hover:text-purple-700"
                          >
                            + Other appearance type
                          </button>
                          {claim.appearanceType === "Other" && (
                            <label className="block space-y-1 text-sm">
                              <span className="font-medium text-slate-700">Other appearance type</span>
                              <input
                                value={claim.customAppearanceType || ""}
                                onChange={(e) => updateAppearanceClaim(claim.id, "customAppearanceType", e.target.value)}
                                className="h-10 w-full rounded-lg border border-slate-200 px-3"
                                placeholder="Enter other appearance type"
                              />
                            </label>
                          )}
                        </div>

                        <label className="space-y-1 text-sm">
                          <span className="font-medium text-slate-700">Outcome</span>
                          <input
                            value={claim.outcome}
                            onChange={(e) => updateAppearanceClaim(claim.id, "outcome", e.target.value)}
                            className="h-10 w-full rounded-lg border border-slate-200 px-3"
                            placeholder="e.g. adjourned to plea"
                          />
                        </label>

                        <SelectField
                          label="Grant action after outcome"
                          value={claim.grantActionRequired}
                          onChange={(value) => updateAppearanceClaim(claim.id, "grantActionRequired", value)}
                          options={POST_APPEARANCE_ACTIONS}
                        />

                        <label className="space-y-1 text-sm">
                          <span className="font-medium text-slate-700">Fee / claim type</span>
                          <input
                            value={claim.feeType}
                            onChange={(e) => updateAppearanceClaim(claim.id, "feeType", e.target.value)}
                            className="h-10 w-full rounded-lg border border-slate-200 px-3"
                          />
                        </label>

                        <label className="space-y-1 text-sm">
                          <span className="font-medium text-slate-700">Auto fee amount</span>
                          <input
                            value={claim.feeAmount}
                            readOnly
                            className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-slate-700"
                            placeholder="Select an appearance type"
                          />
                        </label>

                        <label className="space-y-1 text-sm">
                          <span className="font-medium text-slate-700">Fee table</span>
                          <input
                            value={claim.feeTable}
                            readOnly
                            className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-slate-700"
                            placeholder="Auto-filled from backsheet data"
                          />
                        </label>

                        <BooleanField
                          label="Claim expected?"
                          value={claim.claimExpected}
                          onChange={(value) => updateAppearanceClaim(claim.id, "claimExpected", value)}
                        />
                        <BooleanField
                          label="Claim lodged?"
                          value={claim.claimLodged}
                          onChange={(value) => updateAppearanceClaim(claim.id, "claimLodged", value)}
                        />
                        <BooleanField
                          label="Claim paid?"
                          value={claim.claimPaid}
                          onChange={(value) => updateAppearanceClaim(claim.id, "claimPaid", value)}
                        />
                      </div>

                      {claim.feeNote && (
                        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                          {claim.feeNote}
                        </div>
                      )}

                      {claimAvailability && (
                        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                          {claimAvailability.feeType}: {claimAvailability.remainingLabel}
                        </div>
                      )}

                      {claimWarning && (
                        <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
                          {claimWarning}
                        </div>
                      )}

                      {effectiveDateWarning && (
                        <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
                          {effectiveDateWarning}
                        </div>
                      )}

                      {claim.importSource && (
                        <div className="mt-3 text-xs font-medium uppercase tracking-wide text-slate-500">
                          Imported from {claim.importSource}
                        </div>
                      )}

                      <label className="mt-4 block space-y-1 text-sm">
                        <span className="font-medium text-slate-700">Notes</span>
                        <textarea
                          value={claim.notes}
                          onChange={(e) => updateAppearanceClaim(claim.id, "notes", e.target.value)}
                          rows={3}
                          className="w-full rounded-lg border border-slate-200 px-3 py-2"
                        />
                      </label>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 p-5">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Finalisation and closure</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <BooleanField
            label="Matter finalised?"
            value={planner.finalisation.matterFinalised}
            onChange={(value) => setFinalisationField("matterFinalised", value)}
          />
          <BooleanField
            label="Outcome entered in ATLAS?"
            value={planner.finalisation.outcomeEnteredInAtlas}
            onChange={(value) => setFinalisationField("outcomeEnteredInAtlas", value)}
          />
          <BooleanField
            label="Grant closed?"
            value={planner.finalisation.grantClosed}
            onChange={(value) => setFinalisationField("grantClosed", value)}
          />
          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-700">Closure date</span>
            <input
              type="date"
              value={planner.finalisation.closureDate}
              onChange={(e) => setFinalisationField("closureDate", e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 px-3"
            />
          </label>
        </div>
      </section>
    </>
  );
}
