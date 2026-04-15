const OUTBOX_KEY = "demo_standalone_outbox";
const UPLOADS_KEY = "demo_standalone_uploads";
const LEGAL_AID_APPLICATIONS_KEY = "demo_legal_aid_applications";

const CLERK_LISTS = {
  getListABarristers: [
    { id: "la-1", name: "Joseph Acutt", email: "joseph.acutt@lista.example", phone: "(03) 9225 7222" },
    { id: "la-2", name: "Lisa Andrews", email: "lisa.andrews@lista.example", phone: "(03) 9225 7222" },
    { id: "la-3", name: "Nick Boyd-Caine", email: "nick.boyd-caine@lista.example", phone: "(03) 9225 7222" },
  ],
  getChapmansList: [
    { id: "ch-1", name: "Olivia Cameron", email: "olivia.cameron@chapmans.example", phone: "(03) 9225 8555" },
    { id: "ch-2", name: "David Carlile", email: "david.carlile@chapmans.example", phone: "(03) 9225 8555" },
  ],
  getDeversListBarristers: [
    { id: "de-1", name: "Lucy Dawson", email: "lucy.dawson@devers.example", phone: "(03) 9225 7333" },
    { id: "de-2", name: "Daniel Diaz", email: "daniel.diaz@devers.example", phone: "(03) 9225 7333" },
  ],
  getFoleysListBarristers: [
    { id: "fo-1", name: "Ariadne French", email: "ariadne.french@foleys.example", phone: "(03) 9225 7444" },
  ],
  getListGBarristers: [
    { id: "lg-1", name: "Paul Halley", email: "paul.halley@listg.example", phone: "(03) 9225 7555" },
  ],
  getLennonsListBarristers: [
    { id: "le-1", name: "Amy Johnstone", email: "amy.johnstone@lennons.example", phone: "(03) 9225 7666" },
  ],
  getHolmesListBarristers: [
    { id: "ho-1", name: "Samantha Holmes", email: "samantha.holmes@holmes.example", phone: "(03) 9225 7777" },
  ],
  getMeldrumsListBarristers: [
    { id: "me-1", name: "Mark James", email: "mark.james@meldrums.example", phone: "(03) 9225 7888" },
  ],
  getParnellsBarristers: [
    { id: "pa-1", name: "David Levin KC", email: "david.levin@parnells.example", phone: "(03) 9225 7999" },
  ],
  getSvensonsBarristers: [
    { id: "sv-1", name: "Kylie McInnes", email: "kylie.mcinnes@svensons.example", phone: "(03) 9225 7001" },
  ],
};

function readStorage(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

function createId(prefix) {
  if (globalThis.crypto?.randomUUID) {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function guessMimeCategory(type = "") {
  if (type.includes("pdf")) return "PDF";
  if (type.startsWith("image/")) return "image";
  if (type.includes("word") || type.includes("document")) return "document";
  return "file";
}

function getQuestionFromPrompt(prompt = "") {
  const lines = String(prompt || "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    if (/^(staff|user):/i.test(lines[i])) {
      return lines[i].replace(/^(staff|user):/i, "").trim();
    }
  }
  return String(prompt || "").trim();
}

function answerLegalQuestion(prompt = "") {
  const question = getQuestionFromPrompt(prompt).toLowerCase();
  if (question.includes("circuit fee")) return "Circuit fees usually depend on location, fee item, and whether the matter fits the relevant VLA schedule. Treat them as location-specific extras to confirm, not automatic additions.";
  if (question.includes("grant of aid")) return "Start with matter type, court, means, and merits. For criminal matters, check whether the matter fits a simplified grants pathway and whether any special circumstances strengthen eligibility.";
  if (question.includes("brief to counsel") || question.includes("backsheet")) return "For a backsheet, keep the court, appearance type, prosecutor, client identifiers, and instructions explicit, and confirm any list or grant-specific briefing requirement.";
  if (question.includes("bail")) return "For bail matters, focus on court level, basis for the application, urgency, and whether the grant pathway changes because of timing or complexity.";
  return "I can help with VLA workflow questions, grants, costs payable, briefing process, and practical next steps. Give me the matter type and the decision you need to make.";
}

function createStandaloneDiaryError() {
  const error = new Error("Standalone mode is active. PDF diary extraction needs a separate AI/file service. Set VITE_APP_INTEGRATION_MODE=remote and VITE_APP_API_BASE_URL to enable it.");
  error.code = "STANDALONE_EXTRACTION_UNAVAILABLE";
  return error;
}

function buildAddressSuggestions(input = "") {
  const query = String(input || "").trim();
  if (!query) return [];
  return [
    `${query}, Melbourne VIC 3000`,
    `${query}, Footscray VIC 3011`,
    `${query}, Dandenong VIC 3175`,
    `${query}, Broadmeadows VIC 3047`,
  ].map((description, index) => ({
    place_id: `standalone-address-${index + 1}`,
    description,
  }));
}

function readApplications() {
  return readStorage(LEGAL_AID_APPLICATIONS_KEY, []);
}

function writeApplications(applications) {
  writeStorage(LEGAL_AID_APPLICATIONS_KEY, applications);
}

export async function listLegalAidApplicationsStandalone(sort = "-updated_date", limit) {
  const applications = [...readApplications()];
  if (sort === "-updated_date") {
    applications.sort((a, b) => String(b.updated_date || "").localeCompare(String(a.updated_date || "")));
  }
  if (typeof limit === "number") {
    return applications.slice(0, limit);
  }
  return applications;
}

export async function getLegalAidApplicationStandalone(id) {
  const applications = readApplications();
  return applications.find((application) => application.id === id) || null;
}

export async function createLegalAidApplicationStandalone(payload = {}) {
  const applications = readApplications();
  const created = {
    id: createId("legal-aid-application"),
    ...payload,
    created_date: new Date().toISOString(),
    updated_date: new Date().toISOString(),
  };
  applications.unshift(created);
  writeApplications(applications);
  return created;
}

export async function updateLegalAidApplicationStandalone(id, payload = {}) {
  const applications = readApplications();
  const index = applications.findIndex((application) => application.id === id);
  if (index === -1) {
    throw new Error("Application not found");
  }
  const updated = {
    ...applications[index],
    ...payload,
    id,
    updated_date: new Date().toISOString(),
  };
  applications[index] = updated;
  writeApplications(applications);
  return updated;
}

export async function sendFormEmailStandalone(payload = {}) {
  const outbox = readStorage(OUTBOX_KEY, []);
  const email = {
    id: createId("email"),
    mode: "standalone",
    type: "intake-form",
    to: payload.recipientEmail || "",
    cc: payload.ccEmail || "",
    subject: `Client Intake Form${payload.formName ? ` - ${payload.formName}` : ""}`,
    body: payload.message || "",
    attachment_name: `${payload.formName || "client-intake-form"}.pdf`,
    attachment_type: "application/pdf",
    attachment_base64: payload.pdfBase64 || null,
    saved_at: new Date().toISOString(),
  };
  outbox.unshift(email);
  writeStorage(OUTBOX_KEY, outbox.slice(0, 100));
  return { ok: true, mode: "standalone", outbox_id: email.id };
}

export async function submitApplicationEmailStandalone(payload = {}) {
  const outbox = readStorage(OUTBOX_KEY, []);
  const applicantName = `${payload.formData?.first_name || ""} ${payload.formData?.last_name || ""}`.trim();
  const email = {
    id: createId("email"),
    mode: "standalone",
    type: "legal-aid-application",
    to: "applications@lacw.example",
    cc: "",
    subject: `Legal Aid Application${applicantName ? ` - ${applicantName}` : ""}`,
    body: JSON.stringify({
      applicationId: payload.applicationId || null,
      applicantName,
      savedAt: new Date().toISOString(),
    }, null, 2),
    saved_at: new Date().toISOString(),
  };
  outbox.unshift(email);
  writeStorage(OUTBOX_KEY, outbox.slice(0, 100));
  return { ok: true, mode: "standalone", outbox_id: email.id };
}

export async function uploadFileStandalone(file) {
  const readerResult = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });

  const uploads = readStorage(UPLOADS_KEY, []);
  const upload = {
    id: createId("upload"),
    name: file.name,
    type: file.type,
    size: file.size,
    category: guessMimeCategory(file.type),
    file_url: readerResult,
    created_at: new Date().toISOString(),
  };
  uploads.unshift(upload);
  writeStorage(UPLOADS_KEY, uploads.slice(0, 50));
  return upload;
}

export async function sendEmailStandalone({ to, cc = "", subject = "", body = "" }) {
  const outbox = readStorage(OUTBOX_KEY, []);
  const email = {
    id: createId("email"),
    to,
    cc,
    subject,
    body,
    mode: "standalone",
    saved_at: new Date().toISOString(),
  };
  outbox.unshift(email);
  writeStorage(OUTBOX_KEY, outbox.slice(0, 100));
  return { ok: true, mode: "standalone", outbox_id: email.id };
}

export async function invokeLlmStandalone(payload = {}) {
  if (payload?.response_json_schema) {
    throw createStandaloneDiaryError();
  }
  return answerLegalQuestion(payload?.prompt || "");
}

export async function invokeFunctionStandalone(name, payload = {}) {
  if (name === "sendFormEmail") {
    return sendFormEmailStandalone(payload);
  }
  if (name === "submitApplicationEmail") {
    return submitApplicationEmailStandalone(payload);
  }
  if (name === "addressAutocomplete") {
    return { suggestions: buildAddressSuggestions(payload?.input) };
  }
  const barristers = CLERK_LISTS[name];
  if (barristers) return { barristers };
  return { ok: true, mode: "standalone", message: `No local function handler is configured for ${name}.` };
}
