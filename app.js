/* ============================================================
   Mees' weekoverzicht — app.js
   Werkt met Firebase Firestore (zie firebase-config.js).
   Is er geen (geldige) config, dan valt de app terug op
   lokale testmodus (localStorage, niet gedeeld tussen apparaten).
   ============================================================ */

const DAY_NAMES = ["Maandag","Dinsdag","Woensdag","Donderdag","Vrijdag","Zaterdag","Zondag"];
const NUM_WEEKS = (window.APP_CONFIG && window.APP_CONFIG.numWeeks) || 10;
const WEEKS_PER_PAGE = 2;
const EDIT_PIN = (window.APP_CONFIG && window.APP_CONFIG.editPin) || "1234";

const COLORS = {
  school: "var(--school)",
  opvang: "var(--opvang)",
  hockey: "var(--hockey)",
  vrij:   "var(--vrij)",
  overig: "var(--overig)",
};
const COLOR_LIST = [
  { key:"school", hex:"#3DA5D9" },
  { key:"opvang", hex:"#FFB347" },
  { key:"hockey", hex:"#63C29A" },
  { key:"vrij",   hex:"#F6C94C" },
  { key:"overig", hex:"#B39DDB" },
  { key:"grijs",  hex:"#9AA3AC" },
];
// oude sjabloon-kleuren (uit vorige versie) -> hex, voor terugwaartse compatibiliteit
const LEGACY_COLOR_HEX = { school:"#3DA5D9", opvang:"#FFB347", hockey:"#63C29A", vrij:"#F6C94C", overig:"#B39DDB", grijs:"#9AA3AC" };
function resolveColor(c){
  if (!c) return "#B39DDB";
  if (c.startsWith("#")) return c;
  return LEGACY_COLOR_HEX[c] || "#B39DDB";
}

/* ---------------- Icons (inline SVG, no assets needed) ---------------- */
const ICONS = {
  school: `<svg viewBox="0 0 100 100" fill="none"><path d="M36 30 L41 45" stroke="#fff" stroke-width="6" stroke-linecap="round"/><path d="M64 30 L59 45" stroke="#fff" stroke-width="6" stroke-linecap="round"/><rect x="24" y="42" width="52" height="46" rx="13" fill="#fff"/><rect x="38" y="59" width="24" height="23" rx="7" fill="currentColor"/><rect x="31" y="25" width="38" height="21" rx="9" fill="#fff"/></svg>`,
  gym: `<svg viewBox="0 0 100 100" fill="none"><circle cx="50" cy="21" r="9" fill="#fff"/><line x1="50" y1="30" x2="50" y2="60" stroke="#fff" stroke-width="7" stroke-linecap="round"/><line x1="50" y1="38" x2="24" y2="18" stroke="#fff" stroke-width="7" stroke-linecap="round"/><line x1="50" y1="38" x2="76" y2="18" stroke="#fff" stroke-width="7" stroke-linecap="round"/><line x1="50" y1="60" x2="28" y2="86" stroke="#fff" stroke-width="7" stroke-linecap="round"/><line x1="50" y1="60" x2="72" y2="86" stroke="#fff" stroke-width="7" stroke-linecap="round"/></svg>`,
  huiswerk: `<svg viewBox="0 0 100 100" fill="none"><g transform="rotate(45 50 50)"><rect x="44" y="12" width="12" height="58" rx="3" fill="#fff"/><path d="M44 70 L50 88 L56 70Z" fill="#fff"/><rect x="44" y="8" width="12" height="10" fill="currentColor"/></g></svg>`,
  muziekles: `<svg viewBox="0 0 100 100" fill="none"><circle cx="33" cy="72" r="11" fill="#fff"/><circle cx="70" cy="64" r="11" fill="#fff"/><rect x="42" y="24" width="6" height="48" fill="#fff"/><rect x="79" y="18" width="6" height="46" fill="#fff"/><rect x="42" y="24" width="43" height="9" fill="#fff"/></svg>`,
  zwemles: `<svg viewBox="0 0 100 100" fill="none"><path d="M12 48 q9 -12 18 0 t18 0 t18 0 t18 0" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M12 66 q9 -12 18 0 t18 0 t18 0 t18 0" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round"/></svg>`,
  bibliotheek: `<svg viewBox="0 0 100 100" fill="none"><rect x="20" y="56" width="60" height="11" rx="2" fill="#fff"/><rect x="25" y="43" width="50" height="11" rx="2" fill="#fff"/><rect x="30" y="30" width="40" height="11" rx="2" fill="#fff"/></svg>`,
  knutselen: `<svg viewBox="0 0 100 100" fill="none"><ellipse cx="48" cy="52" rx="35" ry="27" fill="#fff"/><circle cx="30" cy="45" r="6" fill="currentColor"/><circle cx="48" cy="33" r="6" fill="currentColor"/><circle cx="66" cy="45" r="6" fill="currentColor"/><circle cx="60" cy="66" r="8" fill="currentColor"/></svg>`,
  hockey: `<svg viewBox="0 0 100 100" fill="none"><line x1="32" y1="18" x2="60" y2="76" stroke="#fff" stroke-width="7" stroke-linecap="round"/><line x1="60" y1="76" x2="80" y2="80" stroke="#fff" stroke-width="7" stroke-linecap="round"/><circle cx="24" cy="82" r="8.5" fill="#fff"/></svg>`,
  trophy: `<svg viewBox="0 0 100 100" fill="none"><path d="M33 22 h34 v16 a17 17 0 0 1 -34 0 z" fill="#fff"/><path d="M33 26 q-16 0 -16 15 q0 13 16 13" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M67 26 q16 0 16 15 q0 13 -16 13" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round"/><rect x="45" y="38" width="10" height="24" fill="#fff"/><rect x="32" y="62" width="36" height="9" rx="3" fill="#fff"/></svg>`,
  voetbal: `<svg viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="34" fill="#fff"/><path d="M50 32 L63 42 L58 58 H42 L37 42 Z" fill="currentColor"/></svg>`,
  tennis: `<svg viewBox="0 0 100 100" fill="none"><ellipse cx="40" cy="36" rx="22" ry="26" fill="none" stroke="#fff" stroke-width="6"/><line x1="40" y1="62" x2="40" y2="90" stroke="#fff" stroke-width="7" stroke-linecap="round"/><circle cx="76" cy="76" r="9" fill="#fff"/></svg>`,
  ballet: `<svg viewBox="0 0 100 100" fill="none"><path d="M22 68 q0 -16 22 -19 q30 -5 34 9 q3 10 -9 15 q-26 8 -40 2 q-9 -3 -7 -7z" fill="#fff"/><circle cx="38" cy="42" r="6" fill="#fff"/></svg>`,
  fietsen: `<svg viewBox="0 0 100 100" fill="none"><circle cx="26" cy="70" r="16" fill="none" stroke="#fff" stroke-width="6"/><circle cx="74" cy="70" r="16" fill="none" stroke="#fff" stroke-width="6"/><path d="M26 70 L48 34 L74 70 M38 50 H60 M48 34 L57 50" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  opvang: `<svg viewBox="0 0 100 100" fill="none"><circle cx="28" cy="26" r="13" fill="#fff"/><circle cx="72" cy="26" r="13" fill="#fff"/><circle cx="50" cy="52" r="32" fill="#fff"/><circle cx="38" cy="46" r="5.5" fill="currentColor"/><circle cx="62" cy="46" r="5.5" fill="currentColor"/><circle cx="50" cy="60" r="15" fill="currentColor"/><circle cx="50" cy="58" r="6" fill="#fff"/></svg>`,
  opa_oma: `<svg viewBox="0 0 100 100" fill="none"><circle cx="34" cy="32" r="13" fill="#fff"/><path d="M34 48 q-20 0 -20 20 v8 h40 v-8 q0 -20 -20 -20z" fill="#fff"/><circle cx="70" cy="32" r="13" fill="#fff"/><path d="M70 48 q-20 0 -20 20 v8 h40 v-8 q0 -20 -20 -20z" fill="#fff"/></svg>`,
  logeren: `<svg viewBox="0 0 100 100" fill="none"><rect x="18" y="56" width="58" height="20" rx="4" fill="#fff"/><rect x="22" y="44" width="18" height="15" rx="4" fill="#fff"/><line x1="18" y1="76" x2="18" y2="83" stroke="#fff" stroke-width="6" stroke-linecap="round"/><line x1="76" y1="76" x2="76" y2="83" stroke="#fff" stroke-width="6" stroke-linecap="round"/><path d="M68 20 a12 12 0 1 0 11 16 a10 10 0 0 1 -11 -16z" fill="#fff"/></svg>`,
  oppas: `<svg viewBox="0 0 100 100" fill="none"><path d="M50 20 L85 48 H77 V80 H23 V48 H15 Z" fill="#fff"/><path d="M50 62 c-5 -7 -16 -3 -16 5 c0 8 16 16 16 16 s16 -8 16 -16 c0 -8 -11 -12 -16 -5z" fill="currentColor"/></svg>`,
  vriendjes: `<svg viewBox="0 0 100 100" fill="none"><circle cx="33" cy="50" r="21" fill="#fff"/><circle cx="67" cy="50" r="21" fill="#fff"/><circle cx="26" cy="45" r="3.2" fill="currentColor"/><circle cx="40" cy="45" r="3.2" fill="currentColor"/><path d="M26 58 q7 6 14 0" stroke="currentColor" stroke-width="3.5" fill="none" stroke-linecap="round"/><circle cx="60" cy="45" r="3.2" fill="currentColor"/><circle cx="74" cy="45" r="3.2" fill="currentColor"/><path d="M60 58 q7 6 14 0" stroke="currentColor" stroke-width="3.5" fill="none" stroke-linecap="round"/></svg>`,
  verjaardag: `<svg viewBox="0 0 100 100" fill="none"><rect x="24" y="55" width="52" height="27" rx="5" fill="#fff"/><rect x="24" y="44" width="52" height="11" fill="#fff"/><rect x="47" y="18" width="6" height="22" fill="#fff"/><path d="M50 10 q7 8 0 15 q-7 -7 0 -15z" fill="#fff"/></svg>`,
  cadeau: `<svg viewBox="0 0 100 100" fill="none"><rect x="20" y="42" width="60" height="40" rx="4" fill="#fff"/><rect x="20" y="42" width="60" height="13" fill="currentColor"/><rect x="44" y="18" width="10" height="64" fill="currentColor"/><path d="M49 30 q-16 0 -16 -10 q0 -8 8 -8 q11 0 8 18z M49 30 q16 0 16 -10 q0 -8 -8 -8 q-11 0 -8 18z" fill="#fff"/></svg>`,
  ballon: `<svg viewBox="0 0 100 100" fill="none"><ellipse cx="50" cy="36" rx="24" ry="28" fill="#fff"/><path d="M50 64 l-5 8 l5 5 l5 -5z" fill="#fff"/><line x1="50" y1="77" x2="50" y2="92" stroke="#fff" stroke-width="4"/></svg>`,
  feest: `<svg viewBox="0 0 100 100" fill="none"><path d="M28 82 L52 22 L68 68 Z" fill="#fff"/><circle cx="78" cy="24" r="5" fill="#fff"/><circle cx="62" cy="12" r="4" fill="#fff"/><circle cx="90" cy="42" r="4" fill="#fff"/></svg>`,
  kerst: `<svg viewBox="0 0 100 100" fill="none"><path d="M50 12 L64 36 H57 L69 55 H59 L73 78 H27 L41 55 H31 L43 36 H36 Z" fill="#fff"/><rect x="45" y="78" width="10" height="9" fill="#fff"/></svg>`,
  pasen: `<svg viewBox="0 0 100 100" fill="none"><path d="M50 16 c17 0 27 27 27 43 a27 27 0 0 1 -54 0 c0 -16 10 -43 27 -43z" fill="#fff"/><path d="M27 54 q23 -10 46 0 M25 66 q25 -8 50 0" stroke="currentColor" stroke-width="4.5" fill="none"/></svg>`,
  dierentuin: `<svg viewBox="0 0 100 100" fill="none"><circle cx="50" cy="56" r="26" fill="#fff"/><path d="M30 36 L19 15 L42 28Z" fill="#fff"/><path d="M70 36 L81 15 L58 28Z" fill="#fff"/><circle cx="40" cy="53" r="5" fill="currentColor"/><circle cx="60" cy="53" r="5" fill="currentColor"/></svg>`,
  zwembad: `<svg viewBox="0 0 100 100" fill="none"><rect x="14" y="28" width="72" height="9" rx="3" fill="#fff"/><path d="M14 62 q9 -12 18 0 t18 0 t18 0 t18 0" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round"/></svg>`,
  strand: `<svg viewBox="0 0 100 100" fill="none"><line x1="50" y1="18" x2="50" y2="55" stroke="#fff" stroke-width="6" stroke-linecap="round"/><path d="M18 55 a32 21 0 0 1 64 0z" fill="#fff"/><path d="M50 55 q-6 22 -15 30" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round"/></svg>`,
  bioscoop: `<svg viewBox="0 0 100 100" fill="none"><rect x="18" y="40" width="64" height="42" rx="4" fill="#fff"/><path d="M18 40 L26 24 H80 L82 40Z" fill="#fff"/><rect x="30" y="24" width="8" height="16" fill="currentColor"/><rect x="52" y="24" width="8" height="16" fill="currentColor"/></svg>`,
  pretpark: `<svg viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="31" fill="none" stroke="#fff" stroke-width="6"/><circle cx="50" cy="50" r="5.5" fill="#fff"/><line x1="50" y1="19" x2="50" y2="81" stroke="#fff" stroke-width="4"/><line x1="19" y1="50" x2="81" y2="50" stroke="#fff" stroke-width="4"/><line x1="28" y1="28" x2="72" y2="72" stroke="#fff" stroke-width="4"/><line x1="72" y1="28" x2="28" y2="72" stroke="#fff" stroke-width="4"/></svg>`,
  museum: `<svg viewBox="0 0 100 100" fill="none"><path d="M14 40 L50 19 L86 40 Z" fill="#fff"/><rect x="14" y="40" width="72" height="8" fill="#fff"/><rect x="22" y="50" width="9" height="26" fill="#fff"/><rect x="46" y="50" width="9" height="26" fill="#fff"/><rect x="70" y="50" width="9" height="26" fill="#fff"/><rect x="14" y="78" width="72" height="8" fill="#fff"/></svg>`,
  speeltuin: `<svg viewBox="0 0 100 100" fill="none"><line x1="23" y1="18" x2="23" y2="82" stroke="#fff" stroke-width="6"/><line x1="77" y1="18" x2="77" y2="82" stroke="#fff" stroke-width="6"/><line x1="23" y1="18" x2="77" y2="18" stroke="#fff" stroke-width="6"/><line x1="35" y1="18" x2="30" y2="62" stroke="#fff" stroke-width="4"/><line x1="65" y1="18" x2="70" y2="62" stroke="#fff" stroke-width="4"/><rect x="27" y="62" width="46" height="6" rx="3" fill="#fff"/></svg>`,
  kamperen: `<svg viewBox="0 0 100 100" fill="none"><path d="M50 22 L86 80 H64 L50 52 L36 80 H14 Z" fill="#fff"/><path d="M50 52 L41 80 H59 Z" fill="currentColor"/></svg>`,
  wandelen: `<svg viewBox="0 0 100 100" fill="none"><circle cx="57" cy="18" r="8" fill="#fff"/><path d="M57 27 L46 54 L57 60 L62 86" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M46 54 L24 65" stroke="#fff" stroke-width="7" stroke-linecap="round"/><path d="M57 60 L78 76" stroke="#fff" stroke-width="7" stroke-linecap="round"/><line x1="24" y1="65" x2="19" y2="38" stroke="#fff" stroke-width="5" stroke-linecap="round"/></svg>`,
  auto: `<svg viewBox="0 0 100 100" fill="none"><rect x="16" y="48" width="68" height="23" rx="8" fill="#fff"/><path d="M27 48 l9 -17 h28 l9 17z" fill="#fff"/><circle cx="31" cy="73" r="9.5" fill="#fff"/><circle cx="69" cy="73" r="9.5" fill="#fff"/></svg>`,
  trein: `<svg viewBox="0 0 100 100" fill="none"><rect x="24" y="24" width="52" height="47" rx="11" fill="#fff"/><rect x="32" y="35" width="15" height="15" fill="currentColor"/><rect x="53" y="35" width="15" height="15" fill="currentColor"/><circle cx="34" cy="82" r="7" fill="#fff"/><circle cx="66" cy="82" r="7" fill="#fff"/></svg>`,
  vliegtuig: `<svg viewBox="0 0 100 100" fill="none"><path d="M50 13 L58 44 L86 55 L86 62 L58 56 L54 78 L65 86 L65 91 L50 87 L35 91 L35 86 L46 78 L42 56 L14 62 L14 55 L42 44 Z" fill="#fff"/></svg>`,
  vakantie: `<svg viewBox="0 0 100 100" fill="none"><rect x="20" y="38" width="60" height="44" rx="6" fill="#fff"/><rect x="38" y="24" width="24" height="16" rx="4" fill="none" stroke="#fff" stroke-width="6"/><rect x="20" y="56" width="60" height="7" fill="currentColor"/></svg>`,
  tandarts: `<svg viewBox="0 0 100 100" fill="none"><path d="M50 18 c-15 0 -24 8 -24 21 c0 15 6 19 9 34 c1.5 7 9 7 10 -2 c1 -8 3 -13 5 -13 s4 5 5 13 c1 9 8.5 9 10 2 c3 -15 9 -19 9 -34 c0 -13 -9 -21 -24 -21z" fill="#fff"/></svg>`,
  dokter: `<svg viewBox="0 0 100 100" fill="none"><rect x="41" y="20" width="18" height="60" rx="4" fill="#fff"/><rect x="20" y="41" width="60" height="18" rx="4" fill="#fff"/></svg>`,
  ziek: `<svg viewBox="0 0 100 100" fill="none"><rect x="43" y="12" width="14" height="52" rx="7" fill="#fff"/><circle cx="50" cy="76" r="16" fill="#fff"/><rect x="46" y="34" width="8" height="38" fill="currentColor"/></svg>`,
  kapper: `<svg viewBox="0 0 100 100" fill="none"><circle cx="27" cy="27" r="10.5" fill="none" stroke="#fff" stroke-width="6"/><circle cx="27" cy="73" r="10.5" fill="none" stroke="#fff" stroke-width="6"/><line x1="35" y1="34" x2="84" y2="82" stroke="#fff" stroke-width="6" stroke-linecap="round"/><line x1="35" y1="66" x2="84" y2="18" stroke="#fff" stroke-width="6" stroke-linecap="round"/></svg>`,
  agenda: `<svg viewBox="0 0 100 100" fill="none"><rect x="16" y="24" width="68" height="60" rx="6" fill="#fff"/><rect x="16" y="24" width="68" height="17" fill="currentColor"/><rect x="29" y="13" width="7" height="17" rx="3.5" fill="#fff"/><rect x="64" y="13" width="7" height="17" rx="3.5" fill="#fff"/></svg>`,
  telefoon: `<svg viewBox="0 0 100 100" fill="none"><path d="M27 21 c-8 4 -10 14 -6 24 c8 20 24 36 44 44 c10 4 20 2 24 -6 l4 -8 c2 -4 0 -8 -4 -10 l-14 -8 c-4 -2 -8 -1 -10 2 l-4 6 c-10 -6 -18 -14 -24 -24 l6 -4 c3 -2 4 -6 2 -10 l-8 -14 c-2 -4 -6 -6 -10 -4z" fill="#fff"/></svg>`,
  huisdier: `<svg viewBox="0 0 100 100" fill="none"><circle cx="50" cy="64" r="17" fill="#fff"/><circle cx="28" cy="42" r="9" fill="#fff"/><circle cx="72" cy="42" r="9" fill="#fff"/><circle cx="40" cy="27" r="8" fill="#fff"/><circle cx="60" cy="27" r="8" fill="#fff"/></svg>`,
  sun: `<svg viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="19" fill="#fff"/><g stroke="#fff" stroke-width="7" stroke-linecap="round"><line x1="50" y1="8" x2="50" y2="20"/><line x1="50" y1="80" x2="50" y2="92"/><line x1="8" y1="50" x2="20" y2="50"/><line x1="80" y1="50" x2="92" y2="50"/><line x1="19" y1="19" x2="27" y2="27"/><line x1="73" y1="73" x2="81" y2="81"/><line x1="81" y1="19" x2="73" y2="27"/><line x1="27" y1="73" x2="19" y2="81"/></g></svg>`,
  regen: `<svg viewBox="0 0 100 100" fill="none"><path d="M26 47 a19 19 0 0 1 35 -9 a15 15 0 0 1 10 28 h-45 a15 15 0 0 1 0 -19z" fill="#fff"/><line x1="34" y1="72" x2="29" y2="87" stroke="#fff" stroke-width="6" stroke-linecap="round"/><line x1="50" y1="72" x2="45" y2="87" stroke="#fff" stroke-width="6" stroke-linecap="round"/><line x1="66" y1="72" x2="61" y2="87" stroke="#fff" stroke-width="6" stroke-linecap="round"/></svg>`,
  sneeuw: `<svg viewBox="0 0 100 100" fill="none"><g stroke="#fff" stroke-width="7" stroke-linecap="round"><line x1="50" y1="14" x2="50" y2="86"/><line x1="19" y1="29" x2="81" y2="71"/><line x1="19" y1="71" x2="81" y2="29"/></g></svg>`,
  maan: `<svg viewBox="0 0 100 100" fill="none"><path d="M64 18 a34 34 0 1 0 19 46 a25 25 0 0 1 -19 -46z" fill="#fff"/></svg>`,
  star: `<svg viewBox="0 0 100 100" fill="none"><path d="M50 10 L61 39 L92 40 L67 59 L77 89 L50 71 L23 89 L33 59 L8 40 L39 39 Z" fill="#fff"/></svg>`,
  hart: `<svg viewBox="0 0 100 100" fill="none"><path d="M50 83 C8 55 19 20 45 29 C48 30 50 34 50 34 C50 34 52 30 55 29 C81 20 92 55 50 83 Z" fill="#fff"/></svg>`,
};

const ICON_CATEGORIES = [
  { label:"School & activiteiten", keys:["school","gym","huiswerk","muziekles","zwemles","bibliotheek","knutselen"] },
  { label:"Sport", keys:["hockey","trophy","voetbal","tennis","ballet","fietsen"] },
  { label:"Familie & vrienden", keys:["opvang","opa_oma","logeren","oppas","vriendjes"] },
  { label:"Vieren", keys:["verjaardag","cadeau","ballon","feest","kerst","pasen"] },
  { label:"Uitjes", keys:["dierentuin","zwembad","strand","bioscoop","pretpark","museum","speeltuin","kamperen","wandelen"] },
  { label:"Vervoer", keys:["auto","trein","vliegtuig","vakantie"] },
  { label:"Praktisch", keys:["tandarts","dokter","ziek","kapper","agenda","telefoon","huisdier"] },
  { label:"Weer & overig", keys:["zon","regen","sneeuw","maan","ster","hart"] },
];
// mapping: nette NL-naam gebruikt in categorieën -> interne svg-key
const ICON_ALIASES = { zon:"sun", ster:"star" };
function iconKeyOf(name){ return ICON_ALIASES[name] || name; }
const ICON_KEYS = ICON_CATEGORIES.flatMap(c=>c.keys).map(iconKeyOf);

function iconSvg(key, colorForCutout, mainColor){
  let svg = ICONS[iconKeyOf(key)] || ICONS.star;
  svg = svg.replace(/currentColor/g, colorForCutout || "#000");
  if (mainColor) svg = svg.replace(/#fff/g, mainColor);
  return svg;
}

/* ---------------- Default weekly template ---------------- */
const DEFAULT_TEMPLATE = [
  [ {span:2,color:"#3DA5D9",icon:"school",label:"School"}, {span:1,color:"#63C29A",icon:"hockey",label:"Hockey­training"} ], // ma
  [ {span:2,color:"#3DA5D9",icon:"school",label:"School"} ], // di
  [ {span:1,color:"#3DA5D9",icon:"gym",label:"School + gym"}, {span:1,color:"#FFB347",icon:"opvang",label:"Opvang"}, {span:1,color:"#63C29A",icon:"hockey",label:"Hockey­training"} ], // wo
  [ {span:2,color:"#3DA5D9",icon:"school",label:"School"}, {span:1,color:"#FFB347",icon:"opvang",label:"Opvang"} ], // do
  [ {span:1,color:"#3DA5D9",icon:"school",label:"School"} ], // vr
  [ {span:1,color:"#63C29A",icon:"trophy",label:"Hockey­wedstrijd"} ], // za
  [ {span:3,color:"#F6C94C",icon:"sun",label:"Vrije dag!"} ], // zo
];

/* ---------------- Data layer (Firebase or local fallback) ---------------- */
let store; // { getData(), subscribe(cb), saveWeekday(i,slots), saveOverride(dateISO,slots), clearOverride(dateISO) }
let usingLocal = false;

const DEFAULT_DATA = { weekdays: DEFAULT_TEMPLATE, overrides: {}, ranges: [], recurring: [] };
function normalizeData(d){
  d = d || {};
  if (!d.weekdays) d.weekdays = DEFAULT_TEMPLATE;
  if (!d.overrides) d.overrides = {};
  if (!d.ranges) d.ranges = [];
  if (!d.recurring) d.recurring = [];
  return d;
}
function newId(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,7); }

async function initStore(){
  const cfg = window.APP_CONFIG && window.APP_CONFIG.firebase;
  if (cfg && cfg.apiKey && cfg.apiKey !== "VUL_JE_FIREBASE_CONFIG_IN") {
    try {
      const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js");
      const { getFirestore, doc, onSnapshot, setDoc, getDoc } =
        await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
      const fbApp = initializeApp(cfg);
      const db = getFirestore(fbApp);
      const ref = doc(db, "meesKalender", "template");

      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, DEFAULT_DATA);
      }

      store = {
        subscribe(cb){
          return onSnapshot(ref, (s) => cb(normalizeData(s.data())));
        },
        async saveWeekday(i, slots){
          const s = await getDoc(ref);
          const d = normalizeData(s.data());
          d.weekdays[i] = slots;
          await setDoc(ref, d);
        },
        async saveOverride(dateISO, slots){
          const s = await getDoc(ref);
          const d = normalizeData(s.data());
          d.overrides[dateISO] = slots;
          await setDoc(ref, d);
        },
        async clearOverride(dateISO){
          const s = await getDoc(ref);
          const d = normalizeData(s.data());
          delete d.overrides[dateISO];
          await setDoc(ref, d);
        },
        async saveRange(range){
          const s = await getDoc(ref);
          const d = normalizeData(s.data());
          const idx = d.ranges.findIndex(r=>r.id===range.id);
          if (idx>=0) d.ranges[idx] = range; else d.ranges.push(range);
          await setDoc(ref, d);
        },
        async deleteRange(id){
          const s = await getDoc(ref);
          const d = normalizeData(s.data());
          d.ranges = d.ranges.filter(r=>r.id!==id);
          await setDoc(ref, d);
        },
        async saveRecurring(rule){
          const s = await getDoc(ref);
          const d = normalizeData(s.data());
          const idx = d.recurring.findIndex(r=>r.id===rule.id);
          if (idx>=0) d.recurring[idx] = rule; else d.recurring.push(rule);
          await setDoc(ref, d);
        },
        async deleteRecurring(id){
          const s = await getDoc(ref);
          const d = normalizeData(s.data());
          d.recurring = d.recurring.filter(r=>r.id!==id);
          await setDoc(ref, d);
        },
        async resetDefault(){
          await setDoc(ref, DEFAULT_DATA);
        },
      };
      usingLocal = false;
      return;
    } catch (e) {
      console.warn("Firebase-init mislukt, val terug op lokale testmodus:", e);
    }
  }

  // ---- Lokale testmodus (localStorage) ----
  usingLocal = true;
  const KEY = "meesKalenderLocal";
  function read(){
    try { return normalizeData(JSON.parse(localStorage.getItem(KEY))); }
    catch { return normalizeData(null); }
  }
  function write(d){ localStorage.setItem(KEY, JSON.stringify(d)); }
  if (!localStorage.getItem(KEY)) write(DEFAULT_DATA);

  let listeners = [];
  const notify = (d) => listeners.forEach(l=>l(d));
  store = {
    subscribe(cb){ listeners.push(cb); cb(read()); return () => { listeners = listeners.filter(l=>l!==cb); }; },
    async saveWeekday(i, slots){ const d = read(); d.weekdays[i] = slots; write(d); notify(d); },
    async saveOverride(dateISO, slots){ const d = read(); d.overrides[dateISO]=slots; write(d); notify(d); },
    async clearOverride(dateISO){ const d = read(); delete d.overrides[dateISO]; write(d); notify(d); },
    async saveRange(range){
      const d = read();
      const idx = d.ranges.findIndex(r=>r.id===range.id);
      if (idx>=0) d.ranges[idx] = range; else d.ranges.push(range);
      write(d); notify(d);
    },
    async deleteRange(id){ const d = read(); d.ranges = d.ranges.filter(r=>r.id!==id); write(d); notify(d); },
    async saveRecurring(rule){
      const d = read();
      const idx = d.recurring.findIndex(r=>r.id===rule.id);
      if (idx>=0) d.recurring[idx] = rule; else d.recurring.push(rule);
      write(d); notify(d);
    },
    async deleteRecurring(id){ const d = read(); d.recurring = d.recurring.filter(r=>r.id!==id); write(d); notify(d); },
    async resetDefault(){ const d = DEFAULT_DATA; write(d); notify(d); },
  };
}

/* ---------------- Date helpers ---------------- */
function isoDate(d){
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,"0");
  const day = String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
}
function mondayOfThisWeek(){
  const d = new Date();
  const dow = (d.getDay()+6)%7;
  d.setDate(d.getDate()-dow);
  d.setHours(0,0,0,0);
  return d;
}
const MONTHS_SHORT = ["jan","feb","mrt","apr","mei","jun","jul","aug","sep","okt","nov","dec"];

/* ---------------- Rendering ---------------- */
let currentData = { weekdays: DEFAULT_TEMPLATE, overrides: {}, ranges: [], recurring: [] };
let editMode = false;
const startMonday = mondayOfThisWeek();

function slotsForDate(date){
  const iso = isoDate(date);
  if (currentData.overrides && currentData.overrides[iso]) return { slots: currentData.overrides[iso], isOverride:true };
  const dow = (date.getDay()+6)%7;
  return { slots: (currentData.weekdays && currentData.weekdays[dow]) || [], isOverride:false };
}

function parseIso(iso){ return new Date(iso+"T00:00:00"); }
function diffDays(isoA, isoB){ return Math.round((parseIso(isoA) - parseIso(isoB)) / 86400000); }

function activeRangesOn(iso){
  return (currentData.ranges||[]).filter(r => r.start <= iso && iso <= r.end);
}
function activeRecurringOn(date){
  const iso = isoDate(date);
  const dow = (date.getDay()+6)%7;
  return (currentData.recurring||[]).filter(r => {
    if (r.dow !== dow) return false;
    if (iso < r.start) return false;
    const weeks = Math.floor(diffDays(iso, r.start) / 7);
    return weeks % Math.max(1, r.interval) === 0;
  });
}

// Slots zoals ze op het rooster te zien zijn: vaste/afwijkende basis,
// leeg tijdens een vakantieperiode (de balk bovenin toont dat al),
// plus eventuele herhalende blokjes er bovenop (als er ruimte is).
function computeBaseSlots(date){
  const iso = isoDate(date);
  const inRange = activeRangesOn(iso).length > 0;
  let slots;
  if (inRange){
    // Een meerdaags blok (vakantie e.d.) overschrijft alles op die dag,
    // ook een eventuele losse uitzondering voor die datum.
    slots = [];
  } else if (currentData.overrides && currentData.overrides[iso]){
    slots = currentData.overrides[iso].map(s=>({...s}));
  } else {
    const dow = (date.getDay()+6)%7;
    slots = ((currentData.weekdays && currentData.weekdays[dow]) || []).map(s=>({...s}));
  }
  if (inRange) return slots; // geen herhalende blokjes tussendoor tijdens een vakantieperiode
  let used = slots.reduce((a,s)=>a+(s?.span||0),0);
  for (const rule of activeRecurringOn(date)){
    const span = rule.span || 1;
    if (used + span > 3) continue;
    slots.push({ span, color: rule.color, icon: rule.icon, label: rule.label });
    used += span;
  }
  return slots;
}

function renderSlot(slot){
  if (!slot || slot.empty) return `<div class="slot empty" style="flex:${(slot&&slot.span)||1}"></div>`;
  const bg = resolveColor(slot.color);
  return `<div class="slot" style="flex:${slot.span||1}; background:${bg};">
    <div style="width:16px;height:16px;">${iconSvg(slot.icon, bg)}</div>
    <div class="lab">${(slot.label||"").replace(/\n/g,"<br>")}</div>
  </div>`;
}
function withPadding(slots){
  const used = (slots||[]).reduce((a,s)=>a+(s?.span||0),0);
  if (used < 3) return [...slots, { empty:true, span: 3-used }];
  return slots;
}

function dayColHTML(date, opts){
  const slots = computeBaseSlots(date);
  const todayISO = isoDate(new Date());
  const isToday = isoDate(date) === todayISO;
  const dayNum = date.getDate();
  const label = date.getDate()===1 || opts.firstCell ? `${dayNum} ${MONTHS_SHORT[date.getMonth()]}` : `${dayNum}`;
  let slotsHTML = withPadding(slots).map(renderSlot).join("");
  const iso = isoDate(date);
  const editableCls = editMode ? "editable" : "";
  return `<div class="day-col ${isToday?"today":""} ${editableCls}" data-date="${iso}">
      <div class="daynum">${label}</div>
      <div class="slots">${slotsHTML}</div>
    </div>`;
}

function alldayRowHTML(monday){
  const weekStartIso = isoDate(monday);
  const weekEnd = new Date(monday); weekEnd.setDate(weekEnd.getDate()+6);
  const weekEndIso = isoDate(weekEnd);
  const segs = (currentData.ranges||[])
    .filter(r => r.start <= weekEndIso && r.end >= weekStartIso)
    .map(r => {
      const segStartIso = r.start > weekStartIso ? r.start : weekStartIso;
      const segEndIso = r.end < weekEndIso ? r.end : weekEndIso;
      const startCol = diffDays(segStartIso, weekStartIso);
      const endCol = diffDays(segEndIso, weekStartIso);
      return {
        r, startCol, endCol,
        isTrueStart: segStartIso === r.start,
        isTrueEnd: segEndIso === r.end,
      };
    });
  if (segs.length === 0) return "";
  const bars = segs.map(seg => {
    const bg = resolveColor(seg.r.color);
    const capCls = `${seg.isTrueStart?'cap-start':''} ${seg.isTrueEnd?'cap-end':''}`;
    return `<div class="allday-bar ${capCls} ${editMode?'editable':''}" data-range-id="${seg.r.id}"
        style="grid-column:${seg.startCol+1} / ${seg.endCol+2}; background:${bg};">
      <div class="allday-icon">${iconSvg(seg.r.icon, bg)}</div>
      <span class="allday-label">${seg.r.label||""}</span>
    </div>`;
  }).join("");
  return `<div class="allday-row">${bars}</div>`;
}

function pageHTML(pageIndex){
  const weeksHTML = [];
  for (let w=0; w<WEEKS_PER_PAGE; w++){
    const weekIdx = pageIndex*WEEKS_PER_PAGE + w;
    if (weekIdx >= NUM_WEEKS) continue;
    const monday = new Date(startMonday);
    monday.setDate(monday.getDate() + weekIdx*7);
    const endDate = new Date(monday); endDate.setDate(endDate.getDate()+6);
    const label = `${monday.getDate()} ${MONTHS_SHORT[monday.getMonth()]} – ${endDate.getDate()} ${MONTHS_SHORT[endDate.getMonth()]}`;

    const headHTML = DAY_NAMES.map((n,i)=>
      `<div class="day-head ${editMode?"editable":""}" data-dow="${i}">${n.slice(0,2)}</div>`
    ).join("");

    const colsHTML = [];
    for (let i=0;i<7;i++){
      const d = new Date(monday); d.setDate(d.getDate()+i);
      colsHTML.push(dayColHTML(d, { firstCell:false }));
    }

    weeksHTML.push(`<div class="week">
      <div class="week-label">${label}</div>
      ${alldayRowHTML(monday)}
      <div class="days-grid">${headHTML}${colsHTML.join("")}</div>
    </div>`);
  }
  return `<div class="page">${weeksHTML.join("")}</div>`;
}

const totalPages = Math.ceil(NUM_WEEKS / WEEKS_PER_PAGE);

function renderAll(){
  const scroller = document.getElementById("scroller");
  const already = scroller.dataset.built === "1";
  if (!already){
    let html = "";
    for (let p=0;p<totalPages;p++) html += pageHTML(p);
    scroller.innerHTML = html;
    scroller.dataset.built = "1";
    const dotsEl = document.getElementById("dots");
    dotsEl.innerHTML = Array.from({length:totalPages}).map((_,i)=>`<div class="dot ${i===0?'active':''}"></div>`).join("");
  } else {
    // her-render inhoud van elke pagina zonder scrollpositie te verliezen
    const pages = scroller.querySelectorAll(".page");
    pages.forEach((el, idx) => { el.outerHTML = pageHTML(idx); });
  }
  attachDayHandlers();
  updateRangeLabel();
}

function updateRangeLabel(){
  const endDate = new Date(startMonday);
  endDate.setDate(endDate.getDate() + NUM_WEEKS*7 - 1);
  document.getElementById("rangeLabel").textContent =
    `${startMonday.getDate()} ${MONTHS_SHORT[startMonday.getMonth()]} – ${endDate.getDate()} ${MONTHS_SHORT[endDate.getMonth()]} ${endDate.getFullYear()}`;
}

function renderLegend(){
  const items = [
    {icon:"school", label:"School", color:"school"},
    {icon:"opvang", label:"Opvang", color:"opvang"},
    {icon:"hockey", label:"Hockey", color:"hockey"},
    {icon:"sun", label:"Vrije dag", color:"vrij"},
  ];
  document.getElementById("legend").innerHTML = items.map(it=>`
    <div class="item">
      <div class="sw" style="background:${COLORS[it.color]}">${iconSvg(it.icon, COLORS[it.color])}</div>
      <span>${it.label}</span>
    </div>`).join("");
}

/* ---------------- Paging controls ---------------- */
function currentPageIndex(){
  const scroller = document.getElementById("scroller");
  return Math.round(scroller.scrollLeft / scroller.clientWidth);
}
function goToPage(i){
  const scroller = document.getElementById("scroller");
  i = Math.max(0, Math.min(totalPages-1, i));
  scroller.scrollTo({ left: i*scroller.clientWidth, behavior:"smooth" });
}
function updatePagerUI(){
  const idx = currentPageIndex();
  document.querySelectorAll(".dot").forEach((d,i)=>d.classList.toggle("active", i===idx));
  document.getElementById("prevBtn").disabled = idx<=0;
  document.getElementById("nextBtn").disabled = idx>=totalPages-1;
}

/* ---------------- Edit mode: PIN ---------------- */
let pinBuffer = "";
function openPinOverlay(){
  pinBuffer = "";
  document.getElementById("pinError").textContent = "";
  renderPinDots();
  document.getElementById("pinOverlay").classList.add("show");
}
function closePinOverlay(){ document.getElementById("pinOverlay").classList.remove("show"); }
function renderPinDots(){
  const dots = document.getElementById("pinDots");
  dots.innerHTML = Array.from({length:Math.max(4,EDIT_PIN.length)}).map((_,i)=>
    `<span class="${i<pinBuffer.length?'filled':''}"></span>`).join("");
}
function buildKeypad(){
  const keys = ["1","2","3","4","5","6","7","8","9","wis","0","ok"];
  document.getElementById("keypad").innerHTML = keys.map(k=>{
    if (k==="wis") return `<button data-k="wis" class="wide">Wis</button>`;
    if (k==="ok") return `<button data-k="ok" class="wide">OK</button>`;
    return `<button data-k="${k}">${k}</button>`;
  }).join("");
  document.getElementById("keypad").addEventListener("click", (e)=>{
    const b = e.target.closest("button"); if (!b) return;
    const k = b.dataset.k;
    if (k==="wis"){ pinBuffer = pinBuffer.slice(0,-1); renderPinDots(); return; }
    if (k==="ok"){ tryPin(); return; }
    if (pinBuffer.length < 8){ pinBuffer += k; renderPinDots(); }
    if (pinBuffer.length === EDIT_PIN.length) tryPin();
  });
}
function tryPin(){
  if (pinBuffer === EDIT_PIN){
    editMode = true;
    closePinOverlay();
    applyEditModeUI();
  } else {
    document.getElementById("pinError").textContent = "Onjuiste pincode";
    pinBuffer = "";
    renderPinDots();
  }
}
function applyEditModeUI(){
  document.getElementById("lockBtn").classList.toggle("active", editMode);
  document.getElementById("lockBtn").innerHTML = editMode ? "&#128275;" : "&#128274;";
  document.getElementById("editHint").classList.toggle("show", editMode);
  document.getElementById("openWeekdayListBtn").classList.toggle("show", editMode);
  document.querySelector(".btn-row-2").classList.toggle("show", editMode);
  const scroller = document.getElementById("scroller");
  scroller.dataset.built = "0";
  renderAll();
}

/* ---------------- Vast weekpatroon: overzichtslijst ---------------- */
function renderWeekdayList(){
  const wrap = document.getElementById("weekdayList");
  wrap.innerHTML = DAY_NAMES.map((name, i) => {
    const slots = (currentData.weekdays && currentData.weekdays[i]) || [];
    const chips = slots.map(s => {
      const bg = resolveColor(s.color);
      return `<div class="wd-chip" style="background:${bg}">${iconSvg(s.icon, bg)}</div>`;
    }).join("") || `<span style="color:var(--muted); font-size:12px; font-style:italic;">leeg</span>`;
    return `<button class="weekday-row" data-wd="${i}" style="width:100%; text-align:left; background:none; border:none;">
      <div class="wd-name">${name}</div>
      <div class="wd-preview">${chips}</div>
      <div class="wd-arrow">&#8250;</div>
    </button>`;
  }).join("");
  wrap.querySelectorAll("[data-wd]").forEach(btn=>{
    btn.onclick = () => {
      const i = parseInt(btn.dataset.wd);
      closeWeekdayList();
      const slots = JSON.parse(JSON.stringify(currentData.weekdays[i] || []));
      openEditor({ mode:"weekday", index:i, slots, returnTo:"weekday" });
    };
  });
}
function openWeekdayList(){ renderWeekdayList(); document.getElementById("weekdayListOverlay").classList.add("show"); }
function closeWeekdayList(){ document.getElementById("weekdayListOverlay").classList.remove("show"); }

/* ---------------- Day / weekday editor ---------------- */
let editorCtx = null; // { mode: 'weekday'|'override', index or dateISO, slots }

function openEditor(ctx){
  editorCtx = ctx;
  editorCtx.openIconIdx = -1;
  const extra = document.getElementById("editorExtraFields");
  const noteEl = document.getElementById("overrideNote");
  extra.innerHTML = "";
  noteEl.innerHTML = "";

  if (ctx.mode === "weekday"){
    document.getElementById("editTitle").textContent = DAY_NAMES[ctx.index];
    document.getElementById("editSub").textContent = "Vast weekpatroon — geldt voor elke " + DAY_NAMES[ctx.index].toLowerCase();
  } else if (ctx.mode === "override"){
    document.getElementById("editTitle").textContent = formatDateLong(ctx.dateISO);
    document.getElementById("editSub").textContent = "Uitzondering voor deze ene dag";
    const hasOverride = !!(currentData.overrides && currentData.overrides[ctx.dateISO]);
    noteEl.innerHTML = hasOverride
      ? `<div class="override-note">Deze dag wijkt af van het vaste patroon. <a href="#" id="clearOverrideLink">Terug naar vast patroon</a></div>`
      : `<div class="override-note">Je past hier alleen déze datum aan, het vaste weekpatroon blijft ongewijzigd.</div>`;
  } else if (ctx.mode === "range"){
    document.getElementById("editTitle").textContent = ctx.rangeId ? "Periode bewerken" : "Nieuwe periode";
    document.getElementById("editSub").textContent = "Verschijnt als doorlopende balk over meerdere dagen";
    extra.innerHTML = `
      <div class="field-row-2">
        <div class="field-row"><label>Van</label><input type="date" class="field-input" id="rangeStartInput" value="${ctx.rangeStart||''}"></div>
        <div class="field-row"><label>Tot en met</label><input type="date" class="field-input" id="rangeEndInput" value="${ctx.rangeEnd||''}"></div>
      </div>`;
    if (ctx.rangeId) noteEl.innerHTML = `<button class="delete-entry-link" id="deleteRangeBtn">Periode verwijderen</button>`;
  } else if (ctx.mode === "recurring"){
    document.getElementById("editTitle").textContent = ctx.recurId ? "Herhalend blok bewerken" : "Nieuw herhalend blok";
    document.getElementById("editSub").textContent = "Verschijnt bovenop het vaste patroon, als er ruimte is";
    extra.innerHTML = `
      <div class="field-row">
        <label>Dag van de week</label>
        <select class="field-input" id="recurDowInput">
          ${DAY_NAMES.map((n,i)=>`<option value="${i}" ${ctx.recurDow===i?'selected':''}>${n}</option>`).join("")}
        </select>
      </div>
      <div class="field-row-2">
        <div class="field-row"><label>Vanaf</label><input type="date" class="field-input" id="recurStartInput" value="${ctx.recurStart||''}"></div>
        <div class="field-row">
          <label>Herhaal elke</label>
          <div class="interval-row">
            <input type="number" min="1" max="12" class="field-input" id="recurIntervalInput" value="${ctx.recurInterval||2}">
            <span style="font-size:13px;color:var(--muted)">weken</span>
          </div>
        </div>
      </div>`;
    if (ctx.recurId) noteEl.innerHTML = `<button class="delete-entry-link" id="deleteRecurringBtn">Herhalend blok verwijderen</button>`;
  }

  renderSlotList();
  document.getElementById("editOverlay").classList.add("show");

  const link = document.getElementById("clearOverrideLink");
  if (link) link.addEventListener("click", async (e)=>{
    e.preventDefault();
    await store.clearOverride(ctx.dateISO);
    closeEditor();
  });
  const delRange = document.getElementById("deleteRangeBtn");
  if (delRange) delRange.addEventListener("click", async ()=>{
    await store.deleteRange(ctx.rangeId);
    closeEditor();
  });
  const delRecur = document.getElementById("deleteRecurringBtn");
  if (delRecur) delRecur.addEventListener("click", async ()=>{
    await store.deleteRecurring(ctx.recurId);
    closeEditor();
  });
}
function closeEditor(){
  document.getElementById("editOverlay").classList.remove("show");
  const returnTo = editorCtx && editorCtx.returnTo;
  editorCtx=null;
  if (returnTo === "weekday") openWeekdayList();
  else if (returnTo === "range") openRangeList();
  else if (returnTo === "recurring") openRecurringList();
}

function formatDateLong(iso){
  const d = new Date(iso+"T00:00:00");
  return `${DAY_NAMES[(d.getDay()+6)%7]} ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}

function totalSpanUsed(){
  return editorCtx.slots.reduce((a,s)=>a+(s.span||1),0);
}

function renderSlotList(){
  const list = document.getElementById("slotList");
  const singleOnly = editorCtx.mode === "range" || editorCtx.mode === "recurring";
  const showSpan = editorCtx.mode !== "range";
  list.innerHTML = editorCtx.slots.map((slot, idx) => {
    const bg = resolveColor(slot.color);
    const iconOpen = editorCtx.openIconIdx === idx;
    const isPreset = COLOR_LIST.some(c => c.hex.toLowerCase() === bg.toLowerCase());
    const rowActions = singleOnly
      ? (showSpan ? `<div class="row-actions"><div class="span-toggle">
          <button data-field="span" data-val="1" data-idx="${idx}" class="${slot.span===1?'sel':''}">enkel</button>
          <button data-field="span" data-val="2" data-idx="${idx}" class="${slot.span===2?'sel':''}">dubbel</button>
          <button data-field="span" data-val="3" data-idx="${idx}" class="${slot.span===3?'sel':''}">hele dag</button>
        </div></div>` : "")
      : `<div class="row-actions">
          <div class="span-toggle">
            <button data-field="span" data-val="1" data-idx="${idx}" class="${slot.span===1?'sel':''}">enkel</button>
            <button data-field="span" data-val="2" data-idx="${idx}" class="${slot.span===2?'sel':''}">dubbel</button>
            <button data-field="span" data-val="3" data-idx="${idx}" class="${slot.span===3?'sel':''}">hele dag</button>
          </div>
          <div>
            <button class="mini-btn" data-field="up" data-idx="${idx}">&#8593;</button>
            <button class="mini-btn" data-field="down" data-idx="${idx}">&#8595;</button>
            <button class="mini-btn danger" data-field="del" data-idx="${idx}">verwijder</button>
          </div>
        </div>`;

    if (slot.empty){
      return `
      <div class="slot-editor-row empty-row" data-idx="${idx}">
        <div class="top">
          <div class="slot-preview empty-preview">&#8213;</div>
          <div class="empty-label">Leeg vak (geen invulling)</div>
        </div>
        ${rowActions}
      </div>`;
    }
    return `
    <div class="slot-editor-row" data-idx="${idx}">
      <div class="top">
        <button class="slot-preview" data-field="toggleicon" data-idx="${idx}" style="background:${bg}">${iconSvg(slot.icon, bg)}</button>
        <input class="label-input" value="${(slot.label||"").replace(/"/g,'&quot;')}" data-field="label" data-idx="${idx}" placeholder="Tekstje">
      </div>
      ${iconOpen ? `
        <div class="icon-picker">
          ${ICON_CATEGORIES.map(cat => `
            <div class="icon-cat-label">${cat.label}</div>
            <div class="icon-row">
              ${cat.keys.map(k=>`<button class="icon-choice ${slot.icon===iconKeyOf(k)?'sel':''}" data-field="icon" data-val="${iconKeyOf(k)}" data-idx="${idx}">${iconSvg(k, "#EFEAE0", "#22303C")}</button>`).join("")}
            </div>
          `).join("")}
        </div>
      ` : ""}
      <div class="color-row">
        ${COLOR_LIST.map(c=>`<button class="color-choice ${bg.toLowerCase()===c.hex.toLowerCase()?'sel':''}" style="background:${c.hex}" data-field="color" data-val="${c.hex}" data-idx="${idx}"></button>`).join("")}
        <label class="color-choice wheel ${!isPreset?'sel':''}" title="Eigen kleur">
          <input type="color" data-field="customcolor" data-idx="${idx}" value="${bg.startsWith('#')?bg:'#B39DDB'}">
        </label>
      </div>
      ${rowActions}
    </div>
  `;
  }).join("");

  const used = totalSpanUsed();
  document.getElementById("addSlotBtn").style.display = (singleOnly || used >= 3) ? "none" : "block";
  document.getElementById("addEmptyBtn").style.display = (singleOnly || used >= 3) ? "none" : "block";
}

document.addEventListener("click", (e)=>{
  const t = e.target.closest("[data-field]");
  if (!t || !editorCtx) return;
  const field = t.dataset.field;
  const idx = t.dataset.idx !== undefined ? parseInt(t.dataset.idx) : null;

  if (field === "toggleicon"){
    editorCtx.openIconIdx = editorCtx.openIconIdx === idx ? -1 : idx;
    renderSlotList();
  }
  else if (field === "icon"){ editorCtx.slots[idx].icon = t.dataset.val; editorCtx.openIconIdx = -1; renderSlotList(); }
  else if (field === "color"){ editorCtx.slots[idx].color = t.dataset.val; renderSlotList(); }
  else if (field === "span"){
    const newSpan = parseInt(t.dataset.val);
    const others = totalSpanUsed() - editorCtx.slots[idx].span;
    if (others + newSpan <= 3){ editorCtx.slots[idx].span = newSpan; renderSlotList(); }
  }
  else if (field === "up" && idx>0){
    [editorCtx.slots[idx-1], editorCtx.slots[idx]] = [editorCtx.slots[idx], editorCtx.slots[idx-1]];
    renderSlotList();
  }
  else if (field === "down" && idx<editorCtx.slots.length-1){
    [editorCtx.slots[idx+1], editorCtx.slots[idx]] = [editorCtx.slots[idx], editorCtx.slots[idx+1]];
    renderSlotList();
  }
  else if (field === "del"){ editorCtx.slots.splice(idx,1); renderSlotList(); }
});

document.addEventListener("input", (e)=>{
  const labelT = e.target.closest('[data-field="label"]');
  if (labelT && editorCtx){ editorCtx.slots[parseInt(labelT.dataset.idx)].label = labelT.value; return; }
  const colorT = e.target.closest('[data-field="customcolor"]');
  if (colorT && editorCtx){
    editorCtx.slots[parseInt(colorT.dataset.idx)].color = colorT.value;
    renderSlotList();
  }
});

document.getElementById("addSlotBtn").addEventListener("click", ()=>{
  if (!editorCtx) return;
  const used = totalSpanUsed();
  if (used >= 3) return;
  editorCtx.slots.push({ span:1, color:"#B39DDB", icon:"star", label:"Nieuw" });
  renderSlotList();
});
document.getElementById("addEmptyBtn").addEventListener("click", ()=>{
  if (!editorCtx) return;
  const used = totalSpanUsed();
  if (used >= 3) return;
  editorCtx.slots.push({ empty:true, span:1 });
  renderSlotList();
});

document.getElementById("saveEditBtn").addEventListener("click", async ()=>{
  if (!editorCtx) return;
  const clean = editorCtx.slots.filter(s=>s.empty || (s.label && s.label.trim().length>0));

  if (editorCtx.mode === "weekday"){
    await store.saveWeekday(editorCtx.index, clean);
  } else if (editorCtx.mode === "override"){
    await store.saveOverride(editorCtx.dateISO, clean);
  } else if (editorCtx.mode === "range"){
    const start = document.getElementById("rangeStartInput").value;
    const end = document.getElementById("rangeEndInput").value;
    if (!start || !end || end < start) { alert("Kies een geldige periode (einddatum na startdatum)."); return; }
    const slot = clean[0] || { color:"#B39DDB", icon:"vakantie", label:"Weg" };
    await store.saveRange({ id: editorCtx.rangeId || newId(), start, end, color:slot.color, icon:slot.icon, label:slot.label });
  } else if (editorCtx.mode === "recurring"){
    const dow = parseInt(document.getElementById("recurDowInput").value);
    const start = document.getElementById("recurStartInput").value;
    const interval = Math.max(1, parseInt(document.getElementById("recurIntervalInput").value) || 2);
    if (!start) { alert("Kies een startdatum."); return; }
    const slot = clean[0] || { color:"#B39DDB", icon:"star", label:"Nieuw", span:1 };
    await store.saveRecurring({ id: editorCtx.recurId || newId(), dow, start, interval, color:slot.color, icon:slot.icon, label:slot.label, span:slot.span||1 });
  }
  closeEditor();
});
document.getElementById("cancelEditBtn").addEventListener("click", closeEditor);
document.getElementById("editClose").addEventListener("click", closeEditor);

/* ---------------- Meerdaagse blokken: lijst ---------------- */
function renderRangeList(){
  const wrap = document.getElementById("rangeList");
  const ranges = [...(currentData.ranges||[])].sort((a,b)=>a.start.localeCompare(b.start));
  if (ranges.length === 0){
    wrap.innerHTML = `<p style="color:var(--muted); font-size:13px;">Nog geen periodes toegevoegd.</p>`;
    return;
  }
  wrap.innerHTML = ranges.map(r => {
    const bg = resolveColor(r.color);
    return `<button class="weekday-row" data-range-id="${r.id}" style="width:100%; text-align:left; background:none; border:none;">
      <div class="wd-chip" style="background:${bg}; flex:none;">${iconSvg(r.icon, bg)}</div>
      <div class="wd-preview" style="flex:1; display:block;">
        <div style="font-weight:700; font-size:13.5px;">${r.label||"(geen tekst)"}</div>
        <div style="font-size:11.5px; color:var(--muted);">${formatDateLong(r.start)} &rarr; ${formatDateLong(r.end)}</div>
      </div>
      <div class="wd-arrow">&#8250;</div>
    </button>`;
  }).join("");
  wrap.querySelectorAll("[data-range-id]").forEach(btn=>{
    btn.onclick = () => {
      const r = ranges.find(x=>x.id===btn.dataset.rangeId);
      closeRangeList();
      openEditor({ mode:"range", rangeId:r.id, rangeStart:r.start, rangeEnd:r.end,
        slots:[{ span:3, color:r.color, icon:r.icon, label:r.label }], returnTo:"range" });
    };
  });
}
function openRangeList(){ renderRangeList(); document.getElementById("rangeListOverlay").classList.add("show"); }
function closeRangeList(){ document.getElementById("rangeListOverlay").classList.remove("show"); }

/* ---------------- Herhalende blokken: lijst ---------------- */
function recurringSummary(r){
  const everyTxt = r.interval===1 ? "elke week" : `elke ${r.interval} weken`;
  return `${DAY_NAMES[r.dow]} · ${everyTxt} · vanaf ${formatDateLong(r.start)}`;
}
function renderRecurringList(){
  const wrap = document.getElementById("recurringList");
  const rules = currentData.recurring||[];
  if (rules.length === 0){
    wrap.innerHTML = `<p style="color:var(--muted); font-size:13px;">Nog geen herhalende blokken toegevoegd.</p>`;
    return;
  }
  wrap.innerHTML = rules.map(r => {
    const bg = resolveColor(r.color);
    return `<button class="weekday-row" data-recur-id="${r.id}" style="width:100%; text-align:left; background:none; border:none;">
      <div class="wd-chip" style="background:${bg}; flex:none;">${iconSvg(r.icon, bg)}</div>
      <div class="wd-preview" style="flex:1; display:block;">
        <div style="font-weight:700; font-size:13.5px;">${r.label||"(geen tekst)"}</div>
        <div style="font-size:11.5px; color:var(--muted);">${recurringSummary(r)}</div>
      </div>
      <div class="wd-arrow">&#8250;</div>
    </button>`;
  }).join("");
  wrap.querySelectorAll("[data-recur-id]").forEach(btn=>{
    btn.onclick = () => {
      const r = rules.find(x=>x.id===btn.dataset.recurId);
      closeRecurringList();
      openEditor({ mode:"recurring", recurId:r.id, recurDow:r.dow, recurStart:r.start, recurInterval:r.interval,
        slots:[{ span:r.span||1, color:r.color, icon:r.icon, label:r.label }], returnTo:"recurring" });
    };
  });
}
function openRecurringList(){ renderRecurringList(); document.getElementById("recurringListOverlay").classList.add("show"); }
function closeRecurringList(){ document.getElementById("recurringListOverlay").classList.remove("show"); }

/* ---------------- Day click handlers ---------------- */
function attachDayHandlers(){
  document.querySelectorAll(".day-head.editable").forEach(el=>{
    el.onclick = () => {
      const i = parseInt(el.dataset.dow);
      const slots = JSON.parse(JSON.stringify(currentData.weekdays[i] || []));
      openEditor({ mode:"weekday", index:i, slots });
    };
  });
  document.querySelectorAll(".day-col.editable").forEach(el=>{
    el.onclick = () => {
      const iso = el.dataset.date;
      const { slots } = slotsForDate(new Date(iso+"T00:00:00"));
      openEditor({ mode:"override", dateISO:iso, slots: JSON.parse(JSON.stringify(slots)) });
    };
  });
  document.querySelectorAll(".allday-bar.editable").forEach(el=>{
    el.onclick = () => {
      const r = (currentData.ranges||[]).find(x=>x.id===el.dataset.rangeId);
      if (!r) return;
      openEditor({ mode:"range", rangeId:r.id, rangeStart:r.start, rangeEnd:r.end,
        slots:[{ span:3, color:r.color, icon:r.icon, label:r.label }], returnTo:null });
    };
  });
}

/* ---------------- Init ---------------- */
async function main(){
  buildKeypad();
  renderLegend();
  await initStore();

  if (usingLocal){
    const b = document.getElementById("statusBanner");
    b.textContent = "Lokale testmodus: er is nog geen Firebase-configuratie gevonden, wijzigingen worden nu alleen lokaal in deze browser bewaard.";
    b.classList.add("show");
  }

  store.subscribe((data)=>{
    currentData = data;
    const scroller = document.getElementById("scroller");
    scroller.dataset.built = "0";
    renderAll();
    if (document.getElementById("weekdayListOverlay").classList.contains("show")) renderWeekdayList();
    if (document.getElementById("rangeListOverlay").classList.contains("show")) renderRangeList();
    if (document.getElementById("recurringListOverlay").classList.contains("show")) renderRecurringList();
  });

  document.getElementById("lockBtn").addEventListener("click", ()=>{
    if (editMode){ editMode = false; applyEditModeUI(); }
    else openPinOverlay();
  });
  document.getElementById("pinClose").addEventListener("click", closePinOverlay);
  document.getElementById("openWeekdayListBtn").addEventListener("click", openWeekdayList);
  document.getElementById("weekdayListClose").addEventListener("click", closeWeekdayList);

  document.getElementById("openRangeListBtn").addEventListener("click", openRangeList);
  document.getElementById("rangeListClose").addEventListener("click", closeRangeList);
  document.getElementById("addRangeBtn").addEventListener("click", ()=>{
    closeRangeList();
    const today = isoDate(new Date());
    openEditor({ mode:"range", rangeId:null, rangeStart:today, rangeEnd:today,
      slots:[{ span:3, color:"#E4633E", icon:"vakantie", label:"Vakantie!" }], returnTo:"range" });
  });

  document.getElementById("openRecurringListBtn").addEventListener("click", openRecurringList);
  document.getElementById("recurringListClose").addEventListener("click", closeRecurringList);
  document.getElementById("addRecurringBtn").addEventListener("click", ()=>{
    closeRecurringList();
    const today = isoDate(new Date());
    openEditor({ mode:"recurring", recurId:null, recurDow:0, recurStart:today, recurInterval:2,
      slots:[{ span:1, color:"#B39DDB", icon:"star", label:"Nieuw" }], returnTo:"recurring" });
  });

  document.getElementById("prevBtn").addEventListener("click", ()=>goToPage(currentPageIndex()-1));
  document.getElementById("nextBtn").addEventListener("click", ()=>goToPage(currentPageIndex()+1));
  document.getElementById("scroller").addEventListener("scroll", ()=>{
    window.requestAnimationFrame(updatePagerUI);
  });

  window.addEventListener("resize", ()=>goToPage(currentPageIndex()));
}
main();
