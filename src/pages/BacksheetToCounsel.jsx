import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { getAppearanceTypesForCourt, getMatterTypesForAppearanceType } from "@/lib/vla-fees-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, FileText, X, Printer, RotateCcw, Plus, ArrowLeft } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createPageUrl } from "@/utils";

const EMPTY_FORM = {
  client_surname: "",
  client_first_name: "",
  case_id: "",
  court_name: "",
  location: "",
  regional_location: "",
  appearance_type: "",
  matter_type: "",
  extra_matter_types: [],
  jail_conference: false,
  prosecutor: "",
  prosecutor_other: "",
  local_council: "",
  counsel_name: "",
  counsel_email: "",
  counsel_phone: "",
  clerk: "",
  instructions: "",
  documents_attached: "",
  additional_notes: "",
  uploaded_files: [],
};

const LOCAL_COUNCILS = ["ALPINE SHIRE COUNCIL","ARARAT RURAL CITY COUNCIL","BALLARAT CITY COUNCIL","BANYULE CITY COUNCIL","BASS COAST SHIRE COUNCIL","BAW BAW SHIRE COUNCIL","BAYSIDE CITY COUNCIL","BENALLA RURAL CITY COUNCIL","BOROONDARA CITY COUNCIL","BOROUGH OF QUEENSCLIFFE COUNCIL","BRIMBANK CITY COUNCIL","BULOKE SHIRE COUNCIL","GREATER BENDIGO CITY COUNCIL","CAMPASPE SHIRE COUNCIL","CARDINIA SHIRE COUNCIL","CASEY CITY COUNCIL","CENTRAL GOLDFIELDS SHIRE COUNCIL","COLAC OTWAY SHIRE COUNCIL","CORANGAMITE SHIRE COUNCIL","DAREBIN CITY COUNCIL","GREATER DANDENONG CITY COUNCIL","EAST GIPPSLAND SHIRE COUNCIL","FRANKSTON CITY COUNCIL","GANNAWARRA SHIRE COUNCIL","GLEN EIRA CITY COUNCIL","GLENELG SHIRE COUNCIL","GOLDEN PLAINS SHIRE COUNCIL","GREATER GEELONG CITY COUNCIL","GREATER SHEPPARTON CITY COUNCIL","HEPBURN SHIRE COUNCIL","HINDMARSH SHIRE COUNCIL","HOBSONS BAY CITY COUNCIL","HORSHAM RURAL CITY COUNCIL","HUME CITY COUNCIL","INDIGO SHIRE COUNCIL","KINGSTON CITY COUNCIL","KNOX CITY COUNCIL","LATROBE CITY COUNCIL","LODDON SHIRE COUNCIL","MACEDON RANGES SHIRE COUNCIL","MANNINGHAM CITY COUNCIL","MANSFIELD SHIRE COUNCIL","MARIBYRNONG CITY COUNCIL","MAROONDAH CITY COUNCIL","MELBOURNE CITY COUNCIL","MELTON CITY COUNCIL","MERRI-BEK CITY COUNCIL","MILDURA RURAL CITY COUNCIL","MITCHELL SHIRE COUNCIL","MOIRA SHIRE COUNCIL","MONASH CITY COUNCIL","MOONEE VALLEY CITY COUNCIL","MOORABOOL SHIRE COUNCIL","MORNINGTON PENINSULA SHIRE COUNCIL","MOUNT ALEXANDER SHIRE COUNCIL","MOYNE SHIRE COUNCIL","MURRINDINDI SHIRE COUNCIL","NILLUMBIK SHIRE COUNCIL","NORTHERN GRAMPIANS SHIRE COUNCIL","PORT PHILLIP CITY COUNCIL","PYRENEES SHIRE COUNCIL","SOUTH GIPPSLAND SHIRE COUNCIL","SOUTHERN GRAMPIANS SHIRE COUNCIL","STONNINGTON CITY COUNCIL","STRATHBOGIE SHIRE COUNCIL","SURF COAST SHIRE COUNCIL","SWAN HILL RURAL CITY COUNCIL","TOWONG SHIRE COUNCIL","WANGARATTA RURAL CITY COUNCIL","WARRNAMBOOL CITY COUNCIL","WELLINGTON SHIRE COUNCIL","WEST WIMMERA SHIRE COUNCIL","WHITEHORSE CITY COUNCIL","WHITTLESEA CITY COUNCIL","WODONGA CITY COUNCIL","WYNDHAM CITY COUNCIL","YARRA CITY COUNCIL","YARRA RANGES SHIRE COUNCIL","YARRIAMBIACK SHIRE COUNCIL"];

const REGIONAL_LOCATIONS = ["Ararat","Bacchus Marsh","Bairnsdale","Ballarat","Benalla","Bendigo","Castlemaine","Cobram","Colac","Corryong","Dromana","Echuca","Edenhope","Geelong","Hamilton","Hopetoun","Horsham","Kerang","Korumburra","Kyneton","Latrobe Valley","Mansfield","Maryborough","Mildura","Myrtleford","Nhill","Omeo","Orbost","Ouyen","Portland","Robinvale","Sale","Seymour","Shepparton","St Arnaud","Stawell","Swan Hill","Wangaratta","Warrnambool","Wodonga","Wonthaggi"];

const GREENS_LIST_CLERK_PHONE = "(03) 9225 7222";
const GREENS_LIST_BARRISTERS = ["Tiphanie Acreman","Joseph Acutt","Neil Adams SC","Nussen Ainsworth","Yusur Al-Azzawi","Lachlan Allan","Jonathon Allan","Todd Allen","Lisa Andrews","Richard Antill","Karen Argiropoulos SC","David Bailey","Melanie Baker KC","Damian Ballan","Martha Banda","Csaba Baranyai","Prudence Barker","Anita Bartfeld","Michael Bearman","Anthony Beck-Godoy","Andrew Beckwith","Miguel Belmar","Felicity Bentley","Antony Berger","Ashleigh Best","Sam Bird","John Bolton","Catherine Boston SC","Paul Bourke","Joseph Bourke","Kieran Bowling","Nick Boyd-Caine","Joshua Bridgett","Michelle Britbart KC","Mitch Brogden","Neil Brown KC","Lauren Burke","Gavan Burns","Mark Burton","Rena Burton","Julie Buxton","Domenic Cafari","Peter Caillard","Olivia Cameron","James Cameron","Mark Campbell","David Carlile","Haydn Carmichael","David Carolan","Lachlan Carter","Deanna Caruso","Redmond Casey","Ella Casey","Sean Cash","Rachel Cashmore","Geoff Chancellor","Jessica Clark","Thomas Clark","Jack Cleveland","Eleanor Coates","Felicity Cockram","Georgina Coghlan KC","Fiona Connor","Dan Coombes","Debra Coombs","Carmendy Cooper","Adam Coote","Benedict Coxon","Adam Craig","Peter Crofts","Matthew Crowley","Marko Cvjeticanin","Joseph D'Abaco","Greg Davies KC","Sascha Dawson","Lucy Dawson","Andrea de Souza","Mark E Dean KC","Sheeana Dhanji","Daniel Diaz","Liam Dogger","Tim Donaghey","Patrick Doyle SC","Richard Edmunds","Tom Egan","Paul Ehrlich KC","Esther Faine-Vallantin","Emma Fargher","Katherine Farrell","Andrew Felkel","Shannon Finegan","Richard Fink","Matt Fisher","Megan Fitzgerald","Michael Flynn KC","Alex Fogarty","James Forsaith","Ariadne French","Benjamin Fry","Eli Fryar","Benjamin Gahan","Angus Galbraith","Nicholas Gallina","Michael Galvin KC","Erin Gardner","Maryann Gassert","Dr Felicity Gerry KC","Leisa Glass","Briana Goding","Nilanka Goonetillake","Robert Gordon","Timothy Graham","Mihal Greener","Julia Greenham","Georgina Grigoriou","Krystyna Grinberg","Nancy Grunwald","Kirsty Ha","Kirsti Halcomb","Paul Halley","Peter Hamilton","Ruth Hamnett","Campbell Hangay","Justin Hannebery KC","Brett Harding","Emma Harold","Joel Harris","Peter Harris","Ashleigh Harrold","Robert Hay KC","Ian Hill KC","Hannah Hofmann","Lindsay Hogan","Samantha Holmes","Eliza Holt","James Hooper","Samuel Hopper SC","Zoe Hough","Nicholas Howard","Stephanie Howson","Marion Isobel","Mark James","Julianne Jaques KC","Sam Jayasekara","Amy Johnstone","Vivienne Jones","Christie Jones","Ron Jorgensen","Jason Kane","Theo Kassimatis KC","Roslyn Kaye KC","Michael Keks","Philippa Kelly","Mathew Kenneally","Brian Kennedy","Philip Kennon KC","Rabea Khan","Lee Kimonides","Aimee Kinda","Mitchell King","Georgia King-Siem","Simone Kipen","Mitchell Kirk","Piotr Klank","Phoebe Knowles","Elefteria Konstantinou","Jonathan Korman","Gregory Lascaris","Angela Lee","Christopher Lees","Joshua Lessing","David Levin KC","Kevin Li","Khai-Yin Lim","Stephen Linden","Peter Little","David Lloyd","Anthony Lo Surdo SC FCIArb","Nunzio Lucarelli KC","Ryan Maguire","Eitan Makowski","Rhiannon Malone","Kieren Malone","John Maloney","Jonathan Manning","Anna Martin","Shanta Martin","Philip Marzella","Jonathan McCoy","Kyle McDonald","Kylie McInnes","Hannah McIvor","James McKay","Jim McKenna","Bruce McKenzie","Mitch McKenzie","Morgan McLay","Ann McMahon","Julian McMahon AC SC","Matthew Meng","Dean Merriman","Kieren Mihaly","Yuliya Mik","Simon Minahan","Travis Mitchell KC","Edward Moon","Andy Moore","Charles Morgan","Reegan Morison","Charles Morshead","Rutendo Muchinguri","Abhi Mukherjee","Gautam Mukherji","Toby Mullen","Adrian Muller","Nick Mutton","Shakti Nambiar","Geoffrey Nettle AC KC","Gisela Nip","Tim Noonan","Stephen O'Connell","David O'Doherty","Michael O'Haire","Patrick O'Halloran","John O'Halloran","Chris O'Neill","Conor O'Sullivan","Bill Orow","Kate Ottrey","Bryn Overend","Brad Parker","Peter Pascoe","Neale Paterson","Michael Pearce SC","Luke Perilli","Janine Perlman","Serge Petrovich","Thomas Pikusa","Simon Pitt KC","Joanne Poole","Sam Prendergast","Diana Price","Anthony Pyne","Martin Radzaj","Robert Redlich AM KC","Georgina Rhodes","Ed Richards","Mark Ridgeway","Bree Ridgeway","William Rimmer","John Riordan","David Risstrom","Lee Ristivojevic","Justin Rizzi","Abbie Roodenburg","Simon Rubenstein","James Ryan","Fiona Ryan SC","David Sanders","Paul Santamaria KC","Paul Scanlon KC","Meredith Schilling SC","Sanjay Schrapel","Frank Scully","Stephanie Scully","Bryony Seignior","Cassie Serpell","Stephen Sharpley KC","Jim Shaw","Emily Sheales","Kahlia Shenstone","Joshua Sheppard","Andrew Silver","Abilene Singh","Bridget Slocum","Paul Smallwood","Jeremy Smith","Tom Smyth","Fiona Spencer KC","Andrew Sprague","Tim Staindl","Drosso Stamboulakis","William Stark","Brett Stevens","Matthew Stirling","Taylah Stretton","John Styring","Georgia Suhren","Carolyn Symons","Keith Sypott","Rebecca Tambasco","Gavan Tellefson","Jayr Teng","James Tierney","Justin Tomlinson SC","Nick Tweedie SC","Vytas Valasinavicius","Nina Vallins","Tom Vasilopoulos","Andrew Verspaandonk"];

const AUTO_FILL_CLERKS = ["list_a_barristers","chapmans_list","devers_list","foleys_list","list_g_barristers","lennons_list","holmes_list","meldrums_list","parnells_list","svensons_list"];

export default function BacksheetToCounsel() {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [uploading, setUploading] = useState(false);
  const [showJailAlert, setShowJailAlert] = useState(false);
  const [showMilduraAlert, setShowMilduraAlert] = useState(false);
  const [barristerMap, setBarristerMap] = useState({});
  const [loadingBarristers, setLoadingBarristers] = useState(false);
  const [loadingContact, setLoadingContact] = useState(false);

  const CLERK_FUNCTION_MAP = {
    list_a_barristers: "getListABarristers",
    chapmans_list: "getChapmansList",
    devers_list: "getDeversListBarristers",
    foleys_list: "getFoleysListBarristers",
    list_g_barristers: "getListGBarristers",
    lennons_list: "getLennonsListBarristers",
    holmes_list: "getHolmesListBarristers",
    meldrums_list: "getMeldrumsListBarristers",
    parnells_list: "getParnellsBarristers",
    svensons_list: "getSvensonsBarristers",
  };

  const CONTACT_FUNCTION_MAP = {
    list_a_barristers: "getBarristerContact",
    chapmans_list: "getChapmanBarristerContact",
    devers_list: "getDeversListBarristerContact",
    foleys_list: "getFoleysListBarristerContact",
    list_g_barristers: "getListGBarristerContact",
    lennons_list: "getLennonsListBarristerContact",
    holmes_list: "getHolmesListBarristerContact",
    meldrums_list: "getMeldrumsListBarristerContact",
    parnells_list: "getParnellsBarristerContact",
    svensons_list: "getSvensonsBarristerContact",
  };

  useEffect(() => {
    const clerk = formData.clerk;
    if (!CLERK_FUNCTION_MAP[clerk]) return;
    if (barristerMap[clerk]) return; // already loaded
    setLoadingBarristers(true);
    base44.functions.invoke(CLERK_FUNCTION_MAP[clerk], {})
      .then(res => setBarristerMap(m => ({ ...m, [clerk]: res.data.barristers || [] })))
      .catch(() => setBarristerMap(m => ({ ...m, [clerk]: [] })))
      .finally(() => setLoadingBarristers(false));
  }, [formData.clerk]);

  const updateField = (field, value) => setFormData(f => ({ ...f, [field]: value }));

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    const results = await Promise.all(files.map(file => base44.integrations.Core.UploadFile({ file })));
    const newFiles = results.map((r, i) => ({ name: files[i].name, url: r.file_url }));
    setFormData(f => ({ ...f, uploaded_files: [...f.uploaded_files, ...newFiles] }));
    setUploading(false);
    e.target.value = "";
  };

  const removeFile = (index) => {
    setFormData(f => ({ ...f, uploaded_files: f.uploaded_files.filter((_, i) => i !== index) }));
  };

  const handleCounselSelect = (name) => {
    updateField("counsel_name", name);
    const clerk = formData.clerk;
    const barristers = barristerMap[clerk] || [];
    const barrister = barristers.find(b => b.name === name);
    updateField("counsel_email", barrister?.email || "");
    updateField("counsel_phone", barrister?.phone || "");
  };

  const today = new Date().toLocaleDateString("en-AU", { day: "2-digit", month: "long", year: "numeric" });
  const currentBarristers = barristerMap[formData.clerk] || [];
  const isAutoFillClerk = AUTO_FILL_CLERKS.includes(formData.clerk);
  const isGreensClerk = formData.clerk === "greens_list";

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between print:hidden">
        <a
          href={createPageUrl("Home")}
          className="flex items-center gap-2 text-slate-600 hover:text-purple-600 transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Portal
        </a>
        <div className="text-center">
          <p className="font-semibold text-slate-800 text-sm">Backsheet to Counsel</p>
          <p className="text-xs text-slate-400">Law and Advocacy Centre for Women</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setFormData(EMPTY_FORM)} className="gap-1.5">
            <RotateCcw className="w-3.5 h-3.5" /> New Backsheet
          </Button>
          <Button size="sm" onClick={() => window.print()} className="gap-1.5 bg-purple-600 hover:bg-purple-700">
            <Printer className="w-3.5 h-3.5" /> Print / Save PDF
          </Button>
        </div>
      </div>

      {/* Print header */}
      <div className="hidden print:block max-w-4xl mx-auto px-4 pt-6 pb-2">
        <div className="flex items-center justify-between border-b border-slate-300 pb-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Backsheet to Counsel</h1>
            <p className="text-sm text-slate-500">Law and Advocacy Centre for Women</p>
          </div>
          <div className="text-right text-sm text-slate-500">
            <p>Date: {today}</p>
            <p>RMIT Building 152, Level 1 · 147–155 Pelham Street, Carlton VIC 3053</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Client Information */}
        <Card className="border-slate-200">
          <CardHeader><CardTitle className="text-lg">Client Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Client Surname *</Label>
                <Input value={formData.client_surname} onChange={e => updateField("client_surname", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Client First Name *</Label>
                <Input value={formData.client_first_name} onChange={e => updateField("client_first_name", e.target.value)} required />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Court & Matter Details */}
        <Card className="border-slate-200">
          <CardHeader><CardTitle className="text-lg">Court &amp; Matter Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Court *</Label>
                <Select value={formData.court_name} onValueChange={v => {
                  updateField("court_name", v);
                  updateField("appearance_type", "");
                  updateField("matter_type", "");
                  updateField("extra_matter_types", []);
                }}>
                  <SelectTrigger><SelectValue placeholder="Select court" /></SelectTrigger>
                  <SelectContent>
                    {["Children's Court","Magistrates Court","County Court","Supreme Court","Court of appeal","High Court","Office of Chief Examiner","Other"].map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Select value={formData.location} onValueChange={v => updateField("location", v)}>
                  <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
                  <SelectContent>
                    {["Broadmeadows","Dandenong","Frankston","Heidelberg","Melbourne","Moorabbin Justice Centre","Neighbourhood Justice Centre","Ringwood","Sunshine","Werribee","Regional Location"].map(l => (
                      <SelectItem key={l} value={l}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.location === "Regional Location" && (
              <div className="space-y-2">
                <Label>Regional Location</Label>
                <Select value={formData.regional_location} onValueChange={v => {
                  updateField("regional_location", v);
                  if (v === "Mildura") setShowMilduraAlert(true);
                }}>
                  <SelectTrigger><SelectValue placeholder="Select regional location" /></SelectTrigger>
                  <SelectContent>
                    {REGIONAL_LOCATIONS.map(loc => (
                      <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Case ID</Label>
              <Input value={formData.case_id} onChange={e => updateField("case_id", e.target.value)} placeholder="e.g. M12345678" />
              <div className="flex flex-wrap gap-3 pt-1">
                <a href="https://dailylists.magistratesvic.com.au/EFAS/CaseSearch" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">EFAS Case Search</a>
                <a href="http://cjep.justice.vic.gov.au/pls/p100/ck_public_qry_crim.cp_crimlist_setup_idx" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">County Court Listings</a>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Prosecutor</Label>
              <Select value={formData.prosecutor} onValueChange={v => {
                updateField("prosecutor", v);
                updateField("local_council", "");
                updateField("prosecutor_other", "");
              }}>
                <SelectTrigger><SelectValue placeholder="Select prosecutor" /></SelectTrigger>
                <SelectContent>
                  {["VICTORIA POLICE","OFFICE OF PUBLIC PROSECUTION","COMMONWEALTH DEPARTMENT PUBLIC PROSECUTION","FINES VICTORIA","DEPARTMENT OF JUSTICE AND COMMUNITY SAFETY","CORRECTIONS VICTORIA","AUSTRALIAN FEDERAL POLICE","VIC ROADS","TAC","VICTORIAN GOVERNMENT SOLICITORS OFFICE","CHIEF EXAMINER","COMMISSIONER OF POLICE","LOCAL COUNCIL","ATO","OTHER"].map(v => (
                    <SelectItem key={v} value={v}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.prosecutor === "OTHER" && (
              <div className="space-y-2">
                <Label>Please specify</Label>
                <Input value={formData.prosecutor_other} onChange={e => updateField("prosecutor_other", e.target.value)} placeholder="Enter prosecutor..." />
              </div>
            )}

            {formData.prosecutor === "LOCAL COUNCIL" && (
              <div className="space-y-2">
                <Label>Select Council</Label>
                <Select value={formData.local_council} onValueChange={v => updateField("local_council", v)}>
                  <SelectTrigger><SelectValue placeholder="Select local council" /></SelectTrigger>
                  <SelectContent>
                    {LOCAL_COUNCILS.map(v => (
                      <SelectItem key={v} value={v}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Appearance Type</Label>
              <Select value={formData.appearance_type} onValueChange={v => {
                updateField("appearance_type", v);
                updateField("matter_type", "");
                updateField("extra_matter_types", []);
              }}>
                <SelectTrigger><SelectValue placeholder="Select appearance type" /></SelectTrigger>
                <SelectContent>
                  {getAppearanceTypesForCourt(formData.court_name).map(at => (
                    <SelectItem key={at.label} value={at.label}>{at.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.appearance_type && (
              <div className="space-y-2">
                <Label>Matter Type</Label>
                <Select value={formData.matter_type} onValueChange={v => updateField("matter_type", v)}>
                  <SelectTrigger><SelectValue placeholder="Select matter type" /></SelectTrigger>
                  <SelectContent>
                    {getMatterTypesForAppearanceType(formData.appearance_type, formData.court_name).map(item => (
                      <SelectItem key={item.label} value={item.label}>{item.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {formData.extra_matter_types.map((val, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Select value={val} onValueChange={v => {
                      const updated = [...formData.extra_matter_types];
                      updated[idx] = v;
                      updateField("extra_matter_types", updated);
                    }}>
                      <SelectTrigger><SelectValue placeholder="Select matter type" /></SelectTrigger>
                      <SelectContent>
                        {getMatterTypesForAppearanceType(formData.appearance_type, formData.court_name).map(item => (
                          <SelectItem key={item.label} value={item.label}>{item.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => updateField("extra_matter_types", formData.extra_matter_types.filter((_, i) => i !== idx))}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                <Button type="button" variant="outline" size="sm" className="mt-1 gap-1 text-xs" onClick={() => updateField("extra_matter_types", [...formData.extra_matter_types, ""])}>
                  <Plus className="h-3 w-3" /> Add another matter type
                </Button>

                <Label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input type="checkbox" checked={formData.jail_conference} onChange={e => {
                    updateField("jail_conference", e.target.checked);
                    if (e.target.checked) setShowJailAlert(true);
                  }} className="w-4 h-4 rounded border-slate-300" />
                  <span>Jail Conference</span>
                </Label>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Counsel Information */}
        <Card className="border-slate-200">
          <CardHeader><CardTitle className="text-lg">Counsel Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Clerk</Label>
              <Select value={formData.clerk} onValueChange={v => {
                updateField("clerk", v);
                updateField("counsel_name", "");
                updateField("counsel_email", "");
                updateField("counsel_phone", "");
              }}>
                <SelectTrigger><SelectValue placeholder="Select clerk" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="list_a_barristers">List A Barristers</SelectItem>
                  <SelectItem value="greens_list">Greens List</SelectItem>
                  <SelectItem value="chapmans_list">Chapman's List</SelectItem>
                  <SelectItem value="devers_list">Dever's List</SelectItem>
                  <SelectItem value="foleys_list">Foley's List</SelectItem>
                  <SelectItem value="list_g_barristers">List G Barristers</SelectItem>
                  <SelectItem value="lennons_list">Lennon's List</SelectItem>
                  <SelectItem value="holmes_list">Holmes List</SelectItem>
                  <SelectItem value="meldrums_list">Meldrums List</SelectItem>
                  <SelectItem value="parnells_list">Parnells List</SelectItem>
                  <SelectItem value="svensons_list">Svenson's List</SelectItem>
                  <SelectItem value="pattersons_list">Pattersons List</SelectItem>
                  <SelectItem value="youngs_list">Young's List</SelectItem>
                  <SelectItem value="agency_brief">Agency Brief</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Counsel Name *</Label>
              {isAutoFillClerk ? (
                <Select value={formData.counsel_name} onValueChange={handleCounselSelect} disabled={loadingBarristers}>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingBarristers ? "Loading barristers..." : "Select counsel"} />
                  </SelectTrigger>
                  <SelectContent>
                    {currentBarristers.map(b => (
                      <SelectItem key={b.id || b.slug} value={b.name}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : isGreensClerk ? (
                <Select value={formData.counsel_name} onValueChange={v => {
                  updateField("counsel_name", v);
                  if (v) {
                    const email = v.toLowerCase().replace(/\s+(sc|kc|qc|ac)$/i, '').replace(/\s+/g, '.').replace(/[^a-z.]/g, '') + '@greenslist.com.au';
                    updateField("counsel_email", email);
                    updateField("counsel_phone", GREENS_LIST_CLERK_PHONE);
                  } else {
                    updateField("counsel_email", "");
                    updateField("counsel_phone", "");
                  }
                }}>
                  <SelectTrigger><SelectValue placeholder="Select counsel" /></SelectTrigger>
                  <SelectContent>
                    {GREENS_LIST_BARRISTERS.map(name => (
                      <SelectItem key={name} value={name}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input value={formData.counsel_name} onChange={e => updateField("counsel_name", e.target.value)} placeholder="Enter counsel name" required />
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  Counsel Email
                  {loadingContact && <Loader2 className="h-3 w-3 animate-spin text-blue-500" />}
                  {!loadingContact && (isAutoFillClerk || isGreensClerk) && formData.counsel_email && (
                    <span className="text-xs text-blue-600">(auto-filled)</span>
                  )}
                </Label>
                <Input type="email" value={formData.counsel_email} onChange={e => updateField("counsel_email", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  Counsel Phone
                  {loadingContact && <Loader2 className="h-3 w-3 animate-spin text-blue-500" />}
                  {!loadingContact && (isAutoFillClerk || isGreensClerk) && formData.counsel_phone && (
                    <span className="text-xs text-blue-600">(auto-filled)</span>
                  )}
                </Label>
                <Input type="tel" value={formData.counsel_phone} onChange={e => updateField("counsel_phone", e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instructions to Counsel */}
        <Card className="border-slate-200">
          <CardHeader><CardTitle className="text-lg">Instructions to Counsel</CardTitle></CardHeader>
          <CardContent>
            <Textarea value={formData.instructions} onChange={e => updateField("instructions", e.target.value)} placeholder="Provide detailed instructions for counsel..." rows={10} />
          </CardContent>
        </Card>

        {/* Documents & Notes */}
        <Card className="border-slate-200">
          <CardHeader><CardTitle className="text-lg">Documents &amp; Additional Notes</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Documents Attached</Label>
              <Textarea value={formData.documents_attached} onChange={e => updateField("documents_attached", e.target.value)} placeholder="List documents being provided to counsel..." rows={3} />
            </div>
            <div className="space-y-2 print:hidden">
              <Label>Upload Documents</Label>
              <div className="flex items-center gap-2">
                <Input type="file" multiple onChange={handleFileUpload} disabled={uploading} className="cursor-pointer" />
                {uploading && <Loader2 className="h-4 w-4 animate-spin text-slate-500" />}
              </div>
              {formData.uploaded_files.length > 0 && (
                <div className="mt-3 space-y-2">
                  {formData.uploaded_files.map((file, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-slate-500" />
                        <span className="text-sm text-slate-700">{file.name}</span>
                      </div>
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeFile(i)} className="h-6 w-6 p-0">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Additional Notes</Label>
              <Textarea value={formData.additional_notes} onChange={e => updateField("additional_notes", e.target.value)} placeholder="Any other relevant information..." rows={3} />
            </div>
          </CardContent>
        </Card>

        {/* Alerts */}
        <AlertDialog open={showMilduraAlert} onOpenChange={setShowMilduraAlert}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Mildura Travel Reminder</AlertDialogTitle>
              <AlertDialogDescription>
                If flying to Mildura, please ensure a special disbursement is sought for the cost of the airfare. Counsel must provide the flight booking receipt to support the disbursement request.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction>Understood</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={showJailAlert} onOpenChange={setShowJailAlert}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Jail Conference Fee Reminder</AlertDialogTitle>
              <AlertDialogDescription>
                Please make sure the jail conference fee is available to pay to counsel. Only one jail conference fee is payable under each grant of aid.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction>Understood</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Actions */}
        <div className="flex justify-end gap-3 pb-8 print:hidden">
          <Button variant="outline" onClick={() => setFormData(EMPTY_FORM)} className="gap-2">
            <RotateCcw className="w-4 h-4" /> New Backsheet
          </Button>
          <Button onClick={() => window.print()} className="gap-2 bg-purple-600 hover:bg-purple-700">
            <Printer className="w-4 h-4" /> Print / Save PDF
          </Button>
        </div>
      </div>
    </div>
  );
}