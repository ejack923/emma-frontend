const COURT_APPEARANCE_TYPES = {
  "Children's Court": [{ label: "Mention" }, { label: "Plea" }, { label: "Contest" }, { label: "Sentence" }, { label: "Bail Application" }, { label: "Directions Hearing" }, { label: "Other" }],
  "Magistrates Court": [{ label: "Mention" }, { label: "Further Mention" }, { label: "Bail Application" }, { label: "Committal Mention" }, { label: "Committal Hearing" }, { label: "Plea" }, { label: "Contest" }, { label: "Sentence" }, { label: "Return for Sentence" }, { label: "Directions Hearing" }, { label: "Case Assessment Hearing" }, { label: "Filing Hearing" }, { label: "ARC Review" }, { label: "Sentence Indication" }, { label: "Appeal" }, { label: "Other" }],
  "County Court": [{ label: "Mention" }, { label: "Directions Hearing" }, { label: "Case Conference" }, { label: "Bail Application" }, { label: "Plea" }, { label: "Trial" }, { label: "Sentence" }, { label: "Return for Sentence" }, { label: "Sentence Indication" }, { label: "Appeal from Magistrates Court" }, { label: "Other" }],
  "Supreme Court": [{ label: "Mention" }, { label: "Directions Hearing" }, { label: "Bail Application" }, { label: "Plea" }, { label: "Trial" }, { label: "Sentence" }, { label: "Return for Sentence" }, { label: "Appeal" }, { label: "Other" }],
  "Court of appeal": [{ label: "Application for Leave to Appeal" }, { label: "Appeal" }, { label: "Other" }],
  "High Court": [{ label: "Application for Special Leave" }, { label: "Appeal" }, { label: "Other" }],
  "Office of Chief Examiner": [{ label: "Examination" }, { label: "Other" }],
  "Other": [{ label: "Mention" }, { label: "Hearing" }, { label: "Other" }],
};

const APPEARANCE_MATTER_TYPES = {
  "Mention": [{ label: "Criminal" }, { label: "Family Violence Intervention Order" }, { label: "Personal Safety Intervention Order" }, { label: "Other" }],
  "Further Mention": [{ label: "Criminal" }, { label: "Family Violence Intervention Order" }, { label: "Personal Safety Intervention Order" }, { label: "Other" }],
  "Bail Application": [{ label: "Criminal" }, { label: "Other" }],
  "Committal Mention": [{ label: "Criminal" }, { label: "Other" }],
  "Committal Hearing": [{ label: "Criminal — Contested" }, { label: "Criminal — Uncontested" }, { label: "Other" }],
  "Plea": [{ label: "Criminal" }, { label: "Family Violence Intervention Order" }, { label: "Personal Safety Intervention Order" }, { label: "Other" }],
  "Contest": [{ label: "Criminal" }, { label: "Family Violence Intervention Order" }, { label: "Personal Safety Intervention Order" }, { label: "Other" }],
  "Trial": [{ label: "Criminal" }, { label: "Other" }],
  "Sentence": [{ label: "Criminal" }, { label: "Other" }],
  "Return for Sentence": [{ label: "Criminal" }, { label: "Other" }],
  "Directions Hearing": [{ label: "Criminal" }, { label: "Family Violence Intervention Order" }, { label: "Personal Safety Intervention Order" }, { label: "Other" }],
  "Case Assessment Hearing": [{ label: "Criminal" }, { label: "Other" }],
  "Case Conference": [{ label: "Criminal" }, { label: "Other" }],
  "Filing Hearing": [{ label: "Criminal" }, { label: "Other" }],
  "ARC Review": [{ label: "Drug Court" }, { label: "Other" }],
  "Sentence Indication": [{ label: "Criminal" }, { label: "Other" }],
  "Appeal": [{ label: "Criminal" }, { label: "Other" }],
  "Appeal from Magistrates Court": [{ label: "Criminal" }, { label: "Other" }],
  "Application for Leave to Appeal": [{ label: "Criminal" }, { label: "Other" }],
  "Application for Special Leave": [{ label: "Criminal" }, { label: "Other" }],
  "Examination": [{ label: "Other" }],
  "Hearing": [{ label: "Other" }],
  "Other": [{ label: "Other" }],
};

export function getAppearanceTypesForCourt(courtName) {
  return COURT_APPEARANCE_TYPES[courtName] || COURT_APPEARANCE_TYPES.Other;
}

export function getMatterTypesForAppearanceType(appearanceType) {
  return APPEARANCE_MATTER_TYPES[appearanceType] || [{ label: "Other" }];
}
