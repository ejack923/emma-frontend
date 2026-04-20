import React from "react";
import { GUIDELINES } from "./guidelineCriteria";
import GuidelineDrawer from "./GuidelineDrawer";
import SignatureBox from "./SignatureBox";

export default function GuidelineSection({ form, onGuidelineChange, onCriteriaChange, onChange }) {
  const selected = GUIDELINES[form.guideline];

  return (
    <section>
      <div className="text-xs font-bold tracking-widest text-purple-700 uppercase border-b border-gray-300 dark:border-gray-600 pb-2 mb-6">
        Guideline Selection &amp; Criteria
      </div>

      <div className="mb-8">
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
          Select VLA Guideline
        </label>
        <GuidelineDrawer value={form.guideline} onChange={onGuidelineChange} />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Specific Criteria / Sub-Criteria
        </label>
        <div className="border border-gray-200 dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-800 p-4 min-h-[100px]">
          {!selected ? (
            <p className="text-gray-400 italic text-sm text-center mt-4">
              Please select a guideline above to view specific criteria.
            </p>
          ) : (
            <div className="space-y-6">
              {selected.criteria.map((group) => (
                <div key={group.id}>
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3">
                    {group.label}
                  </p>
                  <div className="space-y-2">
                    {group.items.map((item) => (
                      <label
                        key={item.id}
                        className="flex items-start gap-3 cursor-pointer group"
                      >
                        <input
                          type="checkbox"
                          checked={!!form.criteria[item.id]}
                          onChange={(e) => onCriteriaChange(item.id, e.target.checked)}
                          className="mt-0.5 w-4 h-4 accent-purple-700 shrink-0"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300 leading-snug group-hover:text-gray-900 dark:group-hover:text-gray-100">
                          {item.text}
                        </span>
                      </label>
                    ))}
                    {group.id.endsWith("_means") && (
                      <label className="flex items-start gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={!!form.waiver_applies}
                          onChange={(e) => onChange("waiver_applies", e.target.checked)}
                          className="mt-0.5 w-4 h-4 accent-purple-700 shrink-0"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300 leading-snug group-hover:text-gray-900 dark:group-hover:text-gray-100">
                          Means test waiver applies
                        </span>
                      </label>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1 mt-6">
        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Additional Certification Notes</label>
        <textarea
          value={form.notes}
          onChange={(e) => onChange("notes", e.target.value)}
          placeholder="Enter any specific compliance notes or merit assessment details..."
          rows={4}
          className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-purple-500 resize-none bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400"
        />
      </div>

      <div className="mt-6">
        <SignatureBox value={form.signature} onChange={(val) => onChange("signature", val)} />
      </div>
    </section>
  );
}
