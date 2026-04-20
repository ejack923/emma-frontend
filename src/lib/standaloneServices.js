const OUTBOX_KEY = "demo_standalone_outbox";
const UPLOADS_KEY = "demo_standalone_uploads";
const LEGAL_AID_APPLICATIONS_KEY = "demo_legal_aid_applications";

function createBarristerList(prefix, names, email = "", phone = "") {
  return names.map((name, index) => ({
    id: `${prefix}-${index + 1}`,
    name,
    email,
    phone,
  }));
}

function buildClerkBarristerList({ prefix, phone, names, email = "" }) {
  return createBarristerList(prefix, names, email, phone);
}

function createGreensListEmail(name = "") {
  return `${String(name)
    .toLowerCase()
    .replace(/\s+(sc|kc|qc|ac)$/i, "")
    .replace(/\s+/g, ".")
    .replace(/[^a-z.]/g, "")}@greenslist.com.au`;
}

function createGreensBarristerList(names, phone) {
  return names.map((name, index) => ({
    id: `gr-${index + 1}`,
    name,
    email: createGreensListEmail(name),
    phone,
  }));
}

const CLERK_CONTACTS = {
  greens: { prefix: "gr", phone: "(03) 9225 7222" },
  chapmans: { prefix: "ch", phone: "(03) 9225 7666", email: "chapmanslist@vicbar.com.au" },
  devers: { prefix: "de", phone: "(03) 9225 8896", email: "dever@vicbar.com.au" },
  foleys: { prefix: "fo", phone: "(03) 9225 7777", email: "foleys@foleys.com.au" },
  listG: { prefix: "lg", phone: "(03) 9225 8558" },
  lennons: { prefix: "le", phone: "(03) 9225 7555" },
  holmes: { prefix: "ho", phone: "(03) 9225 6444", email: "holmeslist@vicbar.com.au" },
  meldrums: { prefix: "me", phone: "(03) 9225 7444", email: "meldrums@vicbar.com.au" },
  parnells: { prefix: "pa", phone: "(03) 9225 7000", email: "matt@parnellsbarristers.com.au" },
  svenson: { prefix: "sv", phone: "(03) 9225 7333", email: "clerks@svenson.com.au" },
};

const CLERK_FALLBACK_CONTACTS = {
  getGreensListBarristers: { email: "", phone: CLERK_CONTACTS.greens.phone },
  getChapmansList: { email: CLERK_CONTACTS.chapmans.email, phone: CLERK_CONTACTS.chapmans.phone },
  getDeversListBarristers: { email: CLERK_CONTACTS.devers.email, phone: CLERK_CONTACTS.devers.phone },
  getFoleysListBarristers: { email: CLERK_CONTACTS.foleys.email, phone: CLERK_CONTACTS.foleys.phone },
  getListGBarristers: { email: "", phone: CLERK_CONTACTS.listG.phone },
  getLennonsListBarristers: { email: "", phone: CLERK_CONTACTS.lennons.phone },
  getHolmesListBarristers: { email: CLERK_CONTACTS.holmes.email, phone: CLERK_CONTACTS.holmes.phone },
  getMeldrumsListBarristers: { email: CLERK_CONTACTS.meldrums.email, phone: CLERK_CONTACTS.meldrums.phone },
  getParnellsBarristers: { email: CLERK_CONTACTS.parnells.email, phone: CLERK_CONTACTS.parnells.phone },
  getSvensonsBarristers: { email: CLERK_CONTACTS.svenson.email, phone: CLERK_CONTACTS.svenson.phone },
};

const GREENS_LIST_NAMES = ["Tiphanie Acreman","Joseph Acutt","Neil Adams SC","Nussen Ainsworth","Yusur Al-Azzawi","Lachlan Allan","Jonathon Allan","Todd Allen","Lisa Andrews","Richard Antill","Karen Argiropoulos SC","David Bailey","Melanie Baker KC","Damian Ballan","Martha Banda","Csaba Baranyai","Prudence Barker","Anita Bartfeld","Michael Bearman","Anthony Beck-Godoy","Andrew Beckwith","Miguel Belmar","Felicity Bentley","Antony Berger","Ashleigh Best","Sam Bird","John Bolton","Catherine Boston SC","Paul Bourke","Joseph Bourke","Kieran Bowling","Nick Boyd-Caine","Joshua Bridgett","Michelle Britbart KC","Mitch Brogden","Neil Brown KC","Lauren Burke","Gavan Burns","Mark Burton","Rena Burton","Julie Buxton","Domenic Cafari","Peter Caillard","Olivia Cameron","James Cameron","Mark Campbell","David Carlile","Haydn Carmichael","David Carolan","Lachlan Carter","Deanna Caruso","Redmond Casey","Ella Casey","Sean Cash","Rachel Cashmore","Geoff Chancellor","Jessica Clark","Thomas Clark","Jack Cleveland","Eleanor Coates","Felicity Cockram","Georgina Coghlan KC","Fiona Connor","Dan Coombes","Debra Coombs","Carmendy Cooper","Adam Coote","Benedict Coxon","Adam Craig","Peter Crofts","Matthew Crowley","Marko Cvjeticanin","Joseph D'Abaco","Greg Davies KC","Sascha Dawson","Lucy Dawson","Andrea de Souza","Mark E Dean KC","Sheeana Dhanji","Daniel Diaz","Liam Dogger","Tim Donaghey","Patrick Doyle SC","Richard Edmunds","Tom Egan","Paul Ehrlich KC","Esther Faine-Vallantin","Emma Fargher","Katherine Farrell","Andrew Felkel","Shannon Finegan","Richard Fink","Matt Fisher","Megan Fitzgerald","Michael Flynn KC","Alex Fogarty","James Forsaith","Ariadne French","Benjamin Fry","Eli Fryar","Benjamin Gahan","Angus Galbraith","Nicholas Gallina","Michael Galvin KC","Erin Gardner","Maryann Gassert","Dr Felicity Gerry KC","Leisa Glass","Briana Goding","Nilanka Goonetillake","Robert Gordon","Timothy Graham","Mihal Greener","Julia Greenham","Georgina Grigoriou","Krystyna Grinberg","Nancy Grunwald","Kirsty Ha","Kirsti Halcomb","Paul Halley","Peter Hamilton","Ruth Hamnett","Campbell Hangay","Justin Hannebery KC","Brett Harding","Emma Harold","Joel Harris","Peter Harris","Ashleigh Harrold","Robert Hay KC","Ian Hill KC","Hannah Hofmann","Lindsay Hogan","Samantha Holmes","Eliza Holt","James Hooper","Samuel Hopper SC","Zoe Hough","Nicholas Howard","Stephanie Howson","Marion Isobel","Mark James","Julianne Jaques KC","Sam Jayasekara","Amy Johnstone","Vivienne Jones","Christie Jones","Ron Jorgensen","Jason Kane","Theo Kassimatis KC","Roslyn Kaye KC","Michael Keks","Philippa Kelly","Mathew Kenneally","Brian Kennedy","Philip Kennon KC","Rabea Khan","Lee Kimonides","Aimee Kinda","Mitchell King","Georgia King-Siem","Simone Kipen","Mitchell Kirk","Piotr Klank","Phoebe Knowles","Elefteria Konstantinou","Jonathan Korman","Gregory Lascaris","Angela Lee","Christopher Lees","Joshua Lessing","David Levin KC","Kevin Li","Khai-Yin Lim","Stephen Linden","Peter Little","David Lloyd","Anthony Lo Surdo SC FCIArb","Nunzio Lucarelli KC","Ryan Maguire","Eitan Makowski","Rhiannon Malone","Kieren Malone","John Maloney","Jonathan Manning","Anna Martin","Shanta Martin","Philip Marzella","Jonathan McCoy","Kyle McDonald","Kylie McInnes","Hannah McIvor","James McKay","Jim McKenna","Bruce McKenzie","Mitch McKenzie","Morgan McLay","Ann McMahon","Julian McMahon AC SC","Matthew Meng","Dean Merriman","Kieren Mihaly","Yuliya Mik","Simon Minahan","Travis Mitchell KC","Edward Moon","Andy Moore","Charles Morgan","Reegan Morison","Charles Morshead","Rutendo Muchinguri","Abhi Mukherjee","Gautam Mukherji","Toby Mullen","Adrian Muller","Nick Mutton","Shakti Nambiar","Geoffrey Nettle AC KC","Gisela Nip","Tim Noonan","Stephen O'Connell","David O'Doherty","Michael O'Haire","Patrick O'Halloran","John O'Halloran","Chris O'Neill","Conor O'Sullivan","Bill Orow","Kate Ottrey","Bryn Overend","Brad Parker","Peter Pascoe","Neale Paterson","Michael Pearce SC","Luke Perilli","Janine Perlman","Serge Petrovich","Thomas Pikusa","Simon Pitt KC","Joanne Poole","Sam Prendergast","Diana Price","Anthony Pyne","Martin Radzaj","Robert Redlich AM KC","Georgina Rhodes","Ed Richards","Mark Ridgeway","Bree Ridgeway","William Rimmer","John Riordan","David Risstrom","Lee Ristivojevic","Justin Rizzi","Abbie Roodenburg","Simon Rubenstein","James Ryan","Fiona Ryan SC","David Sanders","Paul Santamaria KC","Paul Scanlon KC","Meredith Schilling SC","Sanjay Schrapel","Frank Scully","Stephanie Scully","Bryony Seignior","Cassie Serpell","Stephen Sharpley KC","Jim Shaw","Emily Sheales","Kahlia Shenstone","Joshua Sheppard","Andrew Silver","Abilene Singh","Bridget Slocum","Paul Smallwood","Jeremy Smith","Tom Smyth","Fiona Spencer KC","Andrew Sprague","Tim Staindl","Drosso Stamboulakis","William Stark","Brett Stevens","Matthew Stirling","Taylah Stretton","John Styring","Georgia Suhren","Carolyn Symons","Keith Sypott","Rebecca Tambasco","Gavan Tellefson","Jayr Teng","James Tierney","Justin Tomlinson SC","Nick Tweedie SC","Vytas Valasinavicius","Nina Vallins","Tom Vasilopoulos","Andrew Verspaandonk"];

const CHAPMANS_LIST_NAMES = [
  "Barry Hess KC",
  "David Gilbertson KC",
  "David Robertson KC",
  "Francis Tiernan KC",
  "Ian Upjohn KC",
  "Michael Green SC",
  "Thomas Keely SC",
  "Adam Maloney",
  "Adrian Strauch",
  "Alan Ford",
  "Alexander Campbell",
  "Amanda Wynne",
  "Amit Malik",
  "Andrew Barnett",
  "Andrew Blair",
  "Andrew Imrie",
  "Andrew McKenry",
  "Anthony O'Donoghue",
  "Anthony Stavrinos",
  "Bernard Carr",
  "Bradley Wright",
  "Brian Lacy",
  "Cahal Fairfield",
  "Cameron Moir",
  "Catherine Jones Williams",
  "Chris Twidale",
  "Christopher Jensen",
  "Christopher O'Donnell",
  "Daniel Cole",
  "Dave Barton",
  "David Crocker",
  "David Downey",
  "David Kelsey-Sugg",
  "David Mence",
  "David Rofe",
  "Douglas James",
  "Dr. Ian Turnbull",
  "Dr. Rowena Cantley-Smith",
  "Dr. Vicky Priskich",
  "Elissa Taylor",
  "Elliott Young",
  "F John Morgan",
  "Frank Tallarida",
  "Gabrielle Fitzgibbon",
  "Geoff Herbert",
  "Gerald Parncutt",
  "Gregory Buchhorn",
  "Harry Redwood",
  "Hugh Fraser",
  "Jacob Fronistas O.A.M.",
  "James Kewley",
  "James Mitchell",
  "James Moutsias",
  "James Portelli",
  "James Samargis",
  "Jason Allen",
  "John Willis",
  "Julie Zhou",
  "Julien Lowy",
  "Ken Cheng",
  "Kim Baker",
  "Kim Cullen",
  "Kumar Kappadath",
  "Lindy Barrett",
  "Lyma Nguyen",
  "Margo Harris",
  "Marian C Clarkin",
  "Mark Lapirow",
  "Mark Leach",
  "Martin Pirrie",
  "Matthew Weinman",
  "Michael Gregurek",
  "Michael Reardon",
  "Michael Sanger",
  "Michelle Wilson",
  "Mitchell Latham",
  "Natalie Sheridan-Smith",
  "Neville Kenyon",
  "Nicholas Andreou",
  "Nicholas Bird",
  "Nick Doukas",
  "Nick Ferguson",
  "Nigel Leslie",
  "Oliver Scoullar-Greig",
  "Paul Stefanovic",
  "Paul McDermott",
  "Peter McDermott",
  "Ramon Fowler",
  "Reiko Okazaki",
  "Remi Cuce",
  "Robert Cochrane",
  "Robert Shepherd",
  "Rolf Sorensen",
  "Royce Deckker",
  "Ryan Mallia",
  "Sandra Karabidian",
  "Shaun Ryan",
  "Simon Bobko",
  "Simone Jacobson",
  "Stephen Chambers",
  "Steven Anger",
  "Steven Lowry",
  "Susan Porter",
  "Tim Huestis",
  "Tim White",
  "Timothy Sowden",
  "Veronika Drago",
];

const DEVERS_LIST_NAMES = [
  "Greg Ahern",
  "Raph Ajzensztat",
  "Matthew Albert",
  "Coral Alden",
  "Ross Allen",
  "Fiona Alpins",
  "Paul Anastassiou KC",
  "Adrian Anderson",
  "Johannes Angenent",
  "Jack Aquilina",
  "Grant Atkinson",
  "Fatmir Badali",
  "Adam Baker",
  "Andrea Bannon",
  "James Barber KC",
  "Brad Barr",
  "Edward Batrouney",
  "Kevin Bell The Hon. AM KC",
  "Georgia Berlic",
  "Chris Blanden KC",
  "Victoria Blidman",
  "Daniel Bongiorno SC",
  "Susan Borg",
  "Phillip Bornstein",
  "Stephanie C.B. Brenker",
  "Rebecca Brezzi",
  "Daniel Briggs",
  "Andrew Broadfoot KC",
  "David Brookes SC",
  "Louise Brown",
  "Margie Brown",
  "Spike Buchanan",
  "Darryl J. Burnett",
  "Kelly Butler",
  "Philip Cadman",
  "Chris Caleo KC",
  "Megan Cameron",
  "Roshena Campbell",
  "Sebastian Campbell",
  "Hannah Canham",
  "Audrey Capasso",
  "Tom Carmody",
  "Peter Cawthorn KC",
  "Rosie Cham",
  "Sarah Cherry",
  "Angus Christophersen",
  "Michael Clarke SC",
  "Allen Clayton-Greene",
  "Tom Clelland",
  "Andrew Clements KC",
  "Daniel Clough",
  "Toby Cogley",
  "Patrick Coleridge",
  "Nicola Collingwood",
  "David Collins KC",
  "Tim Connard",
  "Liam Connolly",
  "Paul Connor KC",
  "Gemma-Jane Cooper",
  "Michael Corrigan",
  "Jennifer Cowen",
  "Kathleen Crennan",
  "Susan Crennan The Hon. AC KC",
  "Sam Crock",
  "Philip Crutchfield KC",
  "Lachlan Currie",
  "Paul Czarnota",
  "Mark Goldblatt",
  "Emily Golshtein",
  "Timothy Gorton",
  "Jon Gottschall",
  "Simon Grant",
  "Malcolm Gray",
  "Gavan Griffith AO KC",
  "Astrid Haban-Beer",
  "Harriet Haig",
  "John Hall",
  "Colin Ham",
  "Paul A Hannan",
  "Robert Harper",
  "Greg Harris KC",
  "Mary Anne Hartley KC",
  "Sam Hay KC",
  "Paul Hayes KC",
  "Jack Heeley",
  "Ruby Heffernan",
  "Wayne Henwood",
  "Perry Herzfeld SC",
  "Erin Hill",
  "Justin Lipinski",
  "Karen Liu",
  "Gregory S. Lucas",
  "Christopher Lum",
  "Angus Mackenzie",
  "Sashi Maharaj KC",
  "Katie Manning",
  "Simon Marks KC",
  "David Martin",
  "Simon Martin",
  "Rachel Matson",
  "J. Paul McCaffrey",
  "Rebecca McCarthy",
  "James McComish",
  "Ian McDonald KC",
  "Hannah McGuire",
  "The Hon. Michael McInerney",
  "Banjo McLachlan",
  "Fiona McLeod AO SC",
  "Adrian McMillan",
  "Sarah McNaught",
  "Bruce McTaggart KC",
  "Dugald McWilliams SC",
  "Tim Puckey KC",
  "Charles Pym",
  "Tamara Quinn (nee Leane)",
  "Neil Y. Rattray",
  "Hamish Redd SC",
  "Sebastian Reid",
  "John B. Richards KC",
  "Emily Riordan",
  "Peter Riordan The Hon. KC",
  "Mark Robins KC",
  "Andrew Robinson",
  "Ross Robson The Hon. KC",
  "Maya Rozner",
  "Jesse Rudd",
  "Jeremy Ruskin KC",
  "Jade Ryan",
  "Patrick Santamaria",
  "Anthony Schlicht",
  "Georgina Schoff KC",
  "Harley Schumann",
  "Tim Scotter SC",
];

const FOLEYS_LIST_NAMES = [
  "Roger Gillard KC",
  "Philip Dunn KC",
  "O Paul Holdenson KC",
  "The Honourable Steven Strickland KC",
  "David Brown KC",
  "Bruce Walmsley KC",
  "Tim North OAM KC",
  "Fabian Dixon SC",
  "Andrew Panna KC",
  "Timothy Margetts KC",
  "Gavin Silbert KC",
  "Dr Ian Freckelton AO KC",
  "John Dickinson KC",
  "Samuel Horgan KC",
  "Dr Caroline Kenny KC",
  "David Brustman KC",
  "Michael Wilson SC",
  "Michael Wyles KC",
  "Peter Chadwick KC",
  "Daniel Masel SC",
  "Ian Coleman SC",
  "Geoffrey Dickson KC",
  "Susan Brennan SC",
  "Daniel Gurvich KC",
  "Her Honour Julie Condon KC",
  "Jonathan Evans KC",
  "Marcus Clarke KC",
  "William Lye OAM KC",
  "Juliet Forsyth SC",
  "Frank O'Loughlin KC",
  "Cam Truong KC",
  "Kate Mooney KC",
  "John Gurr KC",
  "Peter O'Farrell KC",
  "Peter Matthews SC",
  "Neill Hutton SC",
  "Michael Stanton SC",
  "Andrew de Wijn SC",
  "Matthew Verney KC",
  "Paul Chiappi SC",
  "Romesh Kumar SC",
  "Sarah Fisken SC",
  "Richard Weil",
  "Patrick Indovino",
  "Graeme McEwen",
  "Graeme Thompson",
  "Philip Barton",
  "His Honour Philip G Misso",
  "Simon Gillespie-Jones",
  "David Cordy",
  "Paul D'Arcy",
  "Samuel Tatarka OAM",
  "Antony Trood",
  "Trevor McLean",
  "William Gillies",
  "Daryl Brown",
  "Robert Barry",
  "Stephen Dewberry",
  "Rohan Hoult",
  "Andrew Donald",
  "Carmella Ben-Simon",
  "John Searle",
  "Anthony Rodbard-Bean",
  "David Colman",
  "Pierre Testart",
  "Bruce Shaw",
  "Marianne Barker",
  "Nicholas Gardiner",
  "Con Salpigtidis",
  "Nicholas Frenkel",
  "Mark McNamara",
  "Graeme Peake",
  "Rika Teicher",
  "Lachlan Wraith",
  "Mark Rinaldi",
  "Robert Peters",
  "David Klempfner",
  "Anthony Thomas",
  "Robyn Wheeler",
  "Shane Lethlean",
  "Jamie Singh",
  "Keith Nicholson",
  "Belle Lane",
  "Darren Bracken",
  "Bronia Tulloch",
  "Emma Swart",
  "Nicholas Harrington",
  "Anthony Klotz",
  "Melissa Mahady",
  "Rohan Millar",
  "David O'Brien",
  "Shivani Pillai",
  "Sandra MacDougall",
  "Laura Colla",
  "Andrew Dickenson",
];

const LIST_G_BARRISTERS_NAMES = [
  "Stewart Maiden KC",
  "Justin Bourke KC",
  "Jeremy Slattery KC",
  "Jenny Firkin KC",
  "Hamish Austin KC",
  "Malcolm Harding SC",
  "Nicholas De Young KC",
  "Martin Scott KC",
  "Tomo Boston KC",
  "Matthew Harvey KC",
  "Rachel Doyle SC",
  "Peter Willis SC",
  "William Edwards KC",
  "Richard Harris SC",
  "Andrew Cameron",
  "David Morgan",
  "Rebecca Davern",
  "Brendan Avallone",
  "Kane Loxley",
  "Tom Clarke",
  "Natalie Hickey",
  "Leigh Howard",
  "Nico Burmeister",
  "Andrew Pollock",
  "Jillian Williams",
  "Eugenia Levine",
  "Adam Segal",
  "Jennifer Collins",
  "Dean Luxton",
  "Dion Fahey",
  "Kess Dovey",
  "Rudi Kruse",
  "Laura Hilly",
  "Tom Warner",
  "Ben Ryde",
  "Albert Ounapuu",
  "Catherine Pase",
  "Andrew Crocker",
  "Marita Foley SC",
  "Daniel Preston",
  "Bruce Caine KC",
  "Colin Golvan AM KC",
  "Tom Cordiner KC",
  "Siobhan Ryan KC",
  "Ben Gardiner KC",
  "Luke Merrick KC",
  "Craig Smith SC",
  "Kate Beattie SC",
  "Stephen Rebikoff SC",
  "Andrew Sykes",
  "Marcus Fleming",
  "Clare Cunliffe",
  "Peter Creighton-Selvay",
  "Lucy Davis",
  "Melissa Marcus",
  "Amy Surkis",
  "Tidja Joseph",
  "William Liu",
  "Katie Gardiner",
  "Maxine Lange",
  "Jack Gracie",
  "Patrick O'Bryan-Gusah",
  "Jarrad Mathie",
  "Dan Miles",
  "Jessica Apel",
  "Tim Burn-Francis",
  "Stephanie Cheligoy",
  "Ned Marlow-Weir",
  "Edward Moore",
  "Jacob Waller",
  "Daniel Fawcett",
  "William Stone",
  "Gavin Rees",
  "Zoe Anderson",
  "Chris Fitzgerald",
  "Sophie Kearney",
  "Lara O'Rorke",
  "James Page",
  "Lisette Stevens",
  "Caitlin O'Neil",
  "Bianca Sacco",
  "Robert Marsh",
  "Joanna Davidson",
  "Paul Halley",
];

const LENNONS_LIST_NAMES = [
  "Bruce Anderson",
  "Emily Anderson",
  "Jonathon Allan",
  "Roisin Annesley KC",
  "Bill Baarini",
  "Simone Bailey",
  "Felicity Blair",
  "Rebecca Boyce",
  "Christine Boyle",
  "Kim Bradey",
  "Jonathan Brett KC",
  "Marietta Bylhouwer",
  "Manny Cao",
  "Steven Carson",
  "Jay Chandramohan",
  "Yi-Chuan Chen",
  "Duncan Chisholm",
  "Ray Ternes",
  "John Valiotis",
  "Stella Gold SC",
  "Kathy Karadimas",
  "Benjamin Reid",
  "Amy Johnstone",
];

const MELDRUMS_LIST_NAMES = [
  "Peter Morrissey SC",
  "Robert Richter KC",
  "Sally Flynn KC",
  "Adrian Bates",
  "Alan Herskope",
  "Alan L Hands",
  "Andrew Grant",
  "Andrew J Buckland",
  "Andrew Norris",
  "Anthony Frederick Krohn",
  "Ashley Richardson",
  "Bernard J. Sutherland",
  "Bill Guzzo",
  "Bruce Nibbs",
  "Cameron Baker",
  "Chris Glerum",
  "Chris Hooper",
  "Chris Pearson",
  "Chrisanthi (Chris) Paganis",
  "Chryssa Anagnostou",
  "Damian John Plummer",
  "Danielle Guesdon",
  "David Gray",
  "Deborah Bye",
];

const PARNELLS_LIST_NAMES = [
  "Christopher Carr SC",
  "Neil J Clelland KC",
  "Jason Gullaci SC",
  "David Hallowes SC",
  "Sharon E Lacy SC",
  "Garry H Livermore SC",
  "Colin Mandy SC",
  "Rishi Nathwani KC",
  "Ruth Shann SC",
  "Patrick Tehan OAM KC",
  "Megan Tittensor SC",
  "Tom Acutt",
  "Michael Allen",
  "James Anderson",
  "Nico Baarlink",
  "Jennifer Ball",
];

const SVENSONS_LIST_NAMES = [
  "Amanda Storey",
  "Annabelle Ballard",
  "Anne L O'Connell",
  "Anne Sheehan",
  "Anne-Louise Juneja",
  "Arna M Delle-Vergini",
  "Beth Warnock",
  "Bonnie Renou",
  "Caitrin Davis",
  "Carmel Morfuni",
  "Carmela Pezzimenti",
  "Carol McComish",
  "Caroline Graves",
  "Carolyn Sparke KC",
  "Christine Clough",
  "Daphne Foong",
  "Dee Brooker",
  "Dr Nadia Stojanova",
  "Dr Victoria Lambropoulos",
  "Eleanor Mallett KC",
  "Gemma Cafarella",
  "Geraldine F Gray",
  "Ingrid Braun",
  "Janine V Gleeson",
  "Jennifer Van Veldhuisen",
  "Jessica Sun Miller",
  "Joanna Dodd",
  "Joh Ollquist",
  "Jordana Cohen",
  "Karen J Le-Faucheur",
  "Karen J. Mak",
  "Karen Streckfuss",
  "Kate Stowell",
  "Kylie McInnes",
  "Kyriaki Vavoulis",
  "Lana Collaris",
  "Linden Woodfall",
  "Lydia Kinda",
  "Mary Anne Ryan",
  "Mayada Dib",
  "Michelle Bennett",
  "Michelle Jenkins",
  "Nicola Bowen",
  "Olivia Go (Olive)",
  "Rebecca Aoukar",
  "Regina Weiss",
  "Sagorika Platel",
  "Samantha Owen",
  "Sepideh Sadri",
  "Sharon Kermath",
  "Sitthana Theerathitiwong",
  "Stephanie Clancy",
  "Susan Aufgang",
  "Susannah R Portelli",
  "Temple Saville",
  "Ursula Stanisich",
  "Valentina Stoilkovska",
  "Veronica Holt",
  "Alan Blackman",
  "Andrew Crozier-Durham RFD",
  "Andrew J Kirkham AM, RFD, KC",
  "Angelo Bartzis",
  "David Pumpa",
  "Doug McLeod",
  "Douglas W Laidlaw CSC",
  "Garry Moffatt",
  "Graeme F. Hellyer",
  "James Cyngler",
  "James McIntyre",
  "Jason Korke",
  "John Hanna Karkar KC",
  "John Salamanca",
  "Jonathon Sprott",
  "Mark Hebblewhite",
  "Martin Garrett",
  "Nathan McComish",
  "Nicholas Jones",
  "Paul Duggan",
  "Paul J Rule",
  "Rodney M Garratt KC",
  "Robert Sadler",
  "Simon Loftus",
  "Vincent A Morfuni KC",
  "Mark Anthony Irving KC",
  "Gerard Nash KC",
  "Stephen Owen-Conway KC",
  "Chris Gunson SC",
  "Duncan Robertson",
  "Harry Lewis",
  "Nik Dragojlovic",
  "Trevor McKenna",
];

const HOLMES_LIST_NAMES = [
  "Martin Bartfeld AM KC",
  "Georgina Connelly SC",
  "Dermot Dann KC",
  "Helen Dellidis SC",
  "Colin Forrest SC",
  "Shaun Ginsbourg SC",
  "Chris Nehmy SC",
  "Timothy North SC",
  "Chris O'Grady KC",
  "Carmen Randazzo SC",
  "Peter Tree KC",
  "Minal Vohra SC",
  "Syd Williams KC",
  "Brent Young KC",
  "Peter Young AM KC",
  "Stephen Lindner",
  "J Damian Ellwood",
  "Steven Kuan",
  "Elizabeth Johnson",
  "Henry Aizen",
  "Patrick Casey",
  "Ian Crisp",
  "Rose Weinberg",
  "Peter Kistler",
  "Wayne Toohey",
  "Mark Wilson",
  "Richard Pirrie",
  "R Deborah Wiener",
  "Alan Marshall",
  "P Daniel Sweeney",
  "Elle Addams",
  "Mary Agresta",
  "Alexander Albert",
  "Renata Alexander",
  "Geoffrey Ambrose",
  "Sam Andrianakis",
  "Ragunath Appudurai",
  "Christopher Arnold",
  "Richard Backwell",
  "Adele Balkin",
  "Andrew Barbayannis",
  "Luke Barker",
  "Sally Bastick",
  "Raj Bhattacharya",
];

const CLERK_LISTS = {
  getListABarristers: [
    { id: "la-1", name: "Joseph Acutt", email: "joseph.acutt@lista.example", phone: "(03) 9225 7222" },
    { id: "la-2", name: "Lisa Andrews", email: "lisa.andrews@lista.example", phone: "(03) 9225 7222" },
    { id: "la-3", name: "Nick Boyd-Caine", email: "nick.boyd-caine@lista.example", phone: "(03) 9225 7222" },
  ],
  getGreensListBarristers: createGreensBarristerList(GREENS_LIST_NAMES, CLERK_CONTACTS.greens.phone),
  getChapmansList: buildClerkBarristerList({ prefix: CLERK_CONTACTS.chapmans.prefix, names: CHAPMANS_LIST_NAMES }),
  getDeversListBarristers: buildClerkBarristerList({ prefix: CLERK_CONTACTS.devers.prefix, names: DEVERS_LIST_NAMES }),
  getFoleysListBarristers: buildClerkBarristerList({ prefix: CLERK_CONTACTS.foleys.prefix, names: FOLEYS_LIST_NAMES }),
  getListGBarristers: buildClerkBarristerList({ prefix: CLERK_CONTACTS.listG.prefix, names: LIST_G_BARRISTERS_NAMES }),
  getLennonsListBarristers: buildClerkBarristerList({ prefix: CLERK_CONTACTS.lennons.prefix, names: LENNONS_LIST_NAMES }),
  getHolmesListBarristers: buildClerkBarristerList({ prefix: CLERK_CONTACTS.holmes.prefix, names: HOLMES_LIST_NAMES }),
  getMeldrumsListBarristers: buildClerkBarristerList({ prefix: CLERK_CONTACTS.meldrums.prefix, names: MELDRUMS_LIST_NAMES }),
  getParnellsBarristers: buildClerkBarristerList({ prefix: CLERK_CONTACTS.parnells.prefix, names: PARNELLS_LIST_NAMES }),
  getSvensonsBarristers: buildClerkBarristerList({ prefix: CLERK_CONTACTS.svenson.prefix, names: SVENSONS_LIST_NAMES }),
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
  /** @type {Error & { code?: string }} */
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

export async function sendEmailStandalone({ to, cc = "", subject = "", body = "", attachment_name = null, attachment_type = null, attachment_base64 = null }) {
  const outbox = readStorage(OUTBOX_KEY, []);
  const email = {
    id: createId("email"),
    to,
    cc,
    subject,
    body,
    attachment_name,
    attachment_type,
    attachment_base64,
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
  if (barristers) {
    return {
      barristers,
      fallbackContact: CLERK_FALLBACK_CONTACTS[name] || null,
    };
  }
  return { ok: true, mode: "standalone", message: `No local function handler is configured for ${name}.` };
}
