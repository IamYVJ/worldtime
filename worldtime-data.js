// ─────────────────────────────────────────────────────────────────────────────
// Worldtime — shared data & helpers
//
// Single source of truth for both index.html (clocks + zone view) and
// explore.html (world map). Loaded as a plain <script> before each page's inline
// script, so everything here lives on the global scope.
//
// Each entry carries every field either page needs:
//   key     stable card id (present only for alias cities that share one IANA
//           zone, e.g. Boston reuses America/New_York); defaults to `id`.
//   id      IANA zone id — always used for the actual time calculations.
//   city    display name.
//   country display country (used by the clocks view).
//   abbr    standard-time short name; `dst` (optional) is the daylight name.
//   lat/lon geographic coordinates for map plotting (null = not plotted).
// ─────────────────────────────────────────────────────────────────────────────

const TIMEZONE_DATA = [
  {id:"UTC",city:"UTC",country:"Coordinated Universal Time",abbr:"UTC",lat:null,lon:null},
  {id:"America/New_York",city:"New York",country:"United States",abbr:"EST",dst:"EDT",lat:40.7,lon:-74},
  {id:"America/Los_Angeles",city:"Los Angeles",country:"United States",abbr:"PST",dst:"PDT",lat:34.1,lon:-118.2},
  {id:"America/Chicago",city:"Chicago",country:"United States",abbr:"CST",dst:"CDT",lat:41.9,lon:-87.6},
  {id:"America/Toronto",city:"Toronto",country:"Canada",abbr:"EST",dst:"EDT",lat:43.7,lon:-79.4},
  {id:"America/Vancouver",city:"Vancouver",country:"Canada",abbr:"PST",dst:"PDT",lat:49.3,lon:-123.1},
  {id:"America/Sao_Paulo",city:"São Paulo",country:"Brazil",abbr:"BRT",lat:-23.5,lon:-46.6},
  {id:"America/Mexico_City",city:"Mexico City",country:"Mexico",abbr:"CST",lat:19.4,lon:-99.1},
  {id:"America/Buenos_Aires",city:"Buenos Aires",country:"Argentina",abbr:"ART",lat:-34.6,lon:-58.4},
  {id:"America/Denver",city:"Denver",country:"United States",abbr:"MST",dst:"MDT",lat:39.7,lon:-105},
  {id:"America/Phoenix",city:"Phoenix",country:"United States",abbr:"MST",lat:33.4,lon:-112.1},
  {id:"America/Anchorage",city:"Anchorage",country:"United States",abbr:"AKST",dst:"AKDT",lat:61.2,lon:-149.9},
  {id:"America/Bogota",city:"Bogota",country:"Colombia",abbr:"COT",lat:4.7,lon:-74.1},
  {id:"America/Lima",city:"Lima",country:"Peru",abbr:"PET",lat:-12,lon:-77},
  {id:"America/Santiago",city:"Santiago",country:"Chile",abbr:"CLT",dst:"CLST",lat:-33.4,lon:-70.7},
  {id:"Europe/London",city:"London",country:"United Kingdom",abbr:"GMT",dst:"BST",lat:51.5,lon:-0.1},
  {id:"Europe/Paris",city:"Paris",country:"France",abbr:"CET",dst:"CEST",lat:48.9,lon:2.4},
  {id:"Europe/Berlin",city:"Berlin",country:"Germany",abbr:"CET",dst:"CEST",lat:52.5,lon:13.4},
  {id:"Europe/Madrid",city:"Madrid",country:"Spain",abbr:"CET",dst:"CEST",lat:40.4,lon:-3.7},
  {id:"Europe/Rome",city:"Rome",country:"Italy",abbr:"CET",dst:"CEST",lat:41.9,lon:12.5},
  {id:"Europe/Amsterdam",city:"Amsterdam",country:"Netherlands",abbr:"CET",dst:"CEST",lat:52.4,lon:4.9},
  {id:"Europe/Stockholm",city:"Stockholm",country:"Sweden",abbr:"CET",dst:"CEST",lat:59.3,lon:18.1},
  {id:"Europe/Moscow",city:"Moscow",country:"Russia",abbr:"MSK",lat:55.8,lon:37.6},
  {id:"Europe/Istanbul",city:"Istanbul",country:"Turkey",abbr:"TRT",lat:41,lon:29},
  {id:"Europe/Dublin",city:"Dublin",country:"Ireland",abbr:"GMT",dst:"IST",lat:53.3,lon:-6.3},
  {id:"Europe/Lisbon",city:"Lisbon",country:"Portugal",abbr:"WET",dst:"WEST",lat:38.7,lon:-9.1},
  {id:"Europe/Zurich",city:"Zurich",country:"Switzerland",abbr:"CET",dst:"CEST",lat:47.4,lon:8.5},
  {id:"Europe/Vienna",city:"Vienna",country:"Austria",abbr:"CET",dst:"CEST",lat:48.2,lon:16.4},
  {id:"Europe/Athens",city:"Athens",country:"Greece",abbr:"EET",dst:"EEST",lat:38,lon:23.7},
  {id:"Europe/Warsaw",city:"Warsaw",country:"Poland",abbr:"CET",dst:"CEST",lat:52.2,lon:21},
  {id:"Europe/Kyiv",city:"Kyiv",country:"Ukraine",abbr:"EET",dst:"EEST",lat:50.5,lon:30.5},
  {id:"Africa/Cairo",city:"Cairo",country:"Egypt",abbr:"EET",dst:"EEST",lat:30,lon:31.2},
  {id:"Africa/Lagos",city:"Lagos",country:"Nigeria",abbr:"WAT",lat:6.5,lon:3.4},
  {id:"Africa/Johannesburg",city:"Johannesburg",country:"South Africa",abbr:"SAST",lat:-26.2,lon:28},
  {id:"Africa/Nairobi",city:"Nairobi",country:"Kenya",abbr:"EAT",lat:-1.3,lon:36.8},
  {id:"Africa/Accra",city:"Accra",country:"Ghana",abbr:"GMT",lat:5.6,lon:-0.2},
  {id:"Asia/Dubai",city:"Dubai",country:"UAE",abbr:"GST",lat:25.2,lon:55.3},
  {id:"Asia/Kolkata",city:"Mumbai",country:"India",abbr:"IST",lat:19.1,lon:72.9},
  {id:"Asia/Karachi",city:"Karachi",country:"Pakistan",abbr:"PKT",lat:24.9,lon:67},
  {id:"Asia/Dhaka",city:"Dhaka",country:"Bangladesh",abbr:"BST",lat:23.8,lon:90.4},
  {id:"Asia/Colombo",city:"Colombo",country:"Sri Lanka",abbr:"IST",lat:6.9,lon:79.9},
  {id:"Asia/Kathmandu",city:"Kathmandu",country:"Nepal",abbr:"NPT",lat:27.7,lon:85.3},
  {id:"Asia/Bangkok",city:"Bangkok",country:"Thailand",abbr:"ICT",lat:13.8,lon:100.5},
  {id:"Asia/Ho_Chi_Minh",city:"Ho Chi Minh City",country:"Vietnam",abbr:"ICT",lat:10.8,lon:106.7},
  {id:"Asia/Manila",city:"Manila",country:"Philippines",abbr:"PHT",lat:14.6,lon:121},
  {id:"Asia/Taipei",city:"Taipei",country:"Taiwan",abbr:"CST",lat:25,lon:121.6},
  {id:"Asia/Singapore",city:"Singapore",country:"Singapore",abbr:"SGT",lat:1.35,lon:103.8},
  {id:"Asia/Kuala_Lumpur",city:"Kuala Lumpur",country:"Malaysia",abbr:"MYT",lat:3.1,lon:101.7},
  {id:"Asia/Hong_Kong",city:"Hong Kong",country:"Hong Kong",abbr:"HKT",lat:22.3,lon:114.2},
  {id:"Asia/Shanghai",city:"Shanghai",country:"China",abbr:"CST",lat:31.2,lon:121.5},
  {id:"Asia/Tokyo",city:"Tokyo",country:"Japan",abbr:"JST",lat:35.7,lon:139.7},
  {id:"Asia/Seoul",city:"Seoul",country:"South Korea",abbr:"KST",lat:37.6,lon:127},
  {id:"Asia/Jakarta",city:"Jakarta",country:"Indonesia",abbr:"WIB",lat:-6.2,lon:106.8},
  {id:"Asia/Tehran",city:"Tehran",country:"Iran",abbr:"IRST",lat:35.7,lon:51.4},
  {id:"Asia/Riyadh",city:"Riyadh",country:"Saudi Arabia",abbr:"AST",lat:24.7,lon:46.7},
  {id:"Asia/Jerusalem",city:"Jerusalem",country:"Israel",abbr:"IST",dst:"IDT",lat:31.8,lon:35.2},
  {id:"Australia/Sydney",city:"Sydney",country:"Australia",abbr:"AEST",dst:"AEDT",lat:-33.9,lon:151.2},
  {id:"Australia/Melbourne",city:"Melbourne",country:"Australia",abbr:"AEST",dst:"AEDT",lat:-37.8,lon:145},
  {id:"Australia/Perth",city:"Perth",country:"Australia",abbr:"AWST",lat:-31.95,lon:115.9},
  {id:"Australia/Adelaide",city:"Adelaide",country:"Australia",abbr:"ACST",dst:"ACDT",lat:-34.9,lon:138.6},
  {id:"Australia/Brisbane",city:"Brisbane",country:"Australia",abbr:"AEST",lat:-27.5,lon:153},
  {id:"Pacific/Auckland",city:"Auckland",country:"New Zealand",abbr:"NZST",dst:"NZDT",lat:-36.85,lon:174.8},
  {id:"Pacific/Honolulu",city:"Honolulu",country:"United States",abbr:"HST",lat:21.3,lon:-157.85},
  {id:"Pacific/Fiji",city:"Suva",country:"Fiji",abbr:"FJT",lat:-18.1,lon:178.4},
  {key:"America/New_York|Boston",id:"America/New_York",city:"Boston",country:"United States",abbr:"EST",dst:"EDT",lat:42.36,lon:-71.06},
  {key:"America/New_York|Washington",id:"America/New_York",city:"Washington, D.C.",country:"United States",abbr:"EST",dst:"EDT",lat:38.9,lon:-77},
  {key:"America/New_York|Miami",id:"America/New_York",city:"Miami",country:"United States",abbr:"EST",dst:"EDT",lat:25.8,lon:-80.2},
  {key:"America/Los_Angeles|San_Francisco",id:"America/Los_Angeles",city:"San Francisco",country:"United States",abbr:"PST",dst:"PDT",lat:37.8,lon:-122.4},
  {key:"America/Los_Angeles|Seattle",id:"America/Los_Angeles",city:"Seattle",country:"United States",abbr:"PST",dst:"PDT",lat:47.6,lon:-122.3},
  {key:"America/Los_Angeles|Las_Vegas",id:"America/Los_Angeles",city:"Las Vegas",country:"United States",abbr:"PST",dst:"PDT",lat:36.2,lon:-115.1},
  {key:"America/Chicago|Houston",id:"America/Chicago",city:"Houston",country:"United States",abbr:"CST",dst:"CDT",lat:29.8,lon:-95.4},
  {key:"America/Chicago|Dallas",id:"America/Chicago",city:"Dallas",country:"United States",abbr:"CST",dst:"CDT",lat:32.8,lon:-96.8},
  {key:"Asia/Shanghai|Beijing",id:"Asia/Shanghai",city:"Beijing",country:"China",abbr:"CST",lat:39.9,lon:116.4},
  {key:"Europe/Madrid|Barcelona",id:"Europe/Madrid",city:"Barcelona",country:"Spain",abbr:"CET",dst:"CEST",lat:41.4,lon:2.2},
  {key:"Europe/Berlin|Munich",id:"Europe/Berlin",city:"Munich",country:"Germany",abbr:"CET",dst:"CEST",lat:48.1,lon:11.6},
  {key:"Europe/Berlin|Frankfurt",id:"Europe/Berlin",city:"Frankfurt",country:"Germany",abbr:"CET",dst:"CEST",lat:50.1,lon:8.7},
  {key:"Europe/Rome|Milan",id:"Europe/Rome",city:"Milan",country:"Italy",abbr:"CET",dst:"CEST",lat:45.5,lon:9.2},
  {id:"America/Edmonton",city:"Calgary",country:"Canada",abbr:"MST",dst:"MDT",lat:51.05,lon:-114.1},
  {id:"America/Halifax",city:"Halifax",country:"Canada",abbr:"AST",dst:"ADT",lat:44.6,lon:-63.6},
  {id:"America/St_Johns",city:"St. John's",country:"Canada",abbr:"NST",dst:"NDT",lat:47.6,lon:-52.7},
  {id:"America/Havana",city:"Havana",country:"Cuba",abbr:"CST",dst:"CDT",lat:23.1,lon:-82.4},
  {id:"America/Panama",city:"Panama City",country:"Panama",abbr:"EST",lat:9,lon:-79.5},
  {id:"America/Guatemala",city:"Guatemala City",country:"Guatemala",abbr:"CST",lat:14.6,lon:-90.5},
  {id:"America/Santo_Domingo",city:"Santo Domingo",country:"Dominican Republic",abbr:"AST",lat:18.5,lon:-69.9},
  {id:"America/Caracas",city:"Caracas",country:"Venezuela",abbr:"VET",lat:10.5,lon:-66.9},
  {id:"America/Guayaquil",city:"Quito",country:"Ecuador",abbr:"ECT",lat:-0.2,lon:-78.5},
  {id:"America/La_Paz",city:"La Paz",country:"Bolivia",abbr:"BOT",lat:-16.5,lon:-68.2},
  {id:"America/Montevideo",city:"Montevideo",country:"Uruguay",abbr:"UYT",lat:-34.9,lon:-56.2},
  {id:"Atlantic/Cape_Verde",city:"Praia",country:"Cape Verde",abbr:"CVT",lat:14.9,lon:-23.5},
  {id:"Pacific/Pago_Pago",city:"Pago Pago",country:"American Samoa",abbr:"SST",lat:-14.3,lon:-170.7},
  {id:"Pacific/Tahiti",city:"Papeete",country:"French Polynesia",abbr:"TAHT",lat:-17.5,lon:-149.6},
  {id:"Europe/Brussels",city:"Brussels",country:"Belgium",abbr:"CET",dst:"CEST",lat:50.8,lon:4.4},
  {id:"Europe/Copenhagen",city:"Copenhagen",country:"Denmark",abbr:"CET",dst:"CEST",lat:55.7,lon:12.6},
  {id:"Europe/Oslo",city:"Oslo",country:"Norway",abbr:"CET",dst:"CEST",lat:59.9,lon:10.8},
  {id:"Europe/Prague",city:"Prague",country:"Czechia",abbr:"CET",dst:"CEST",lat:50.1,lon:14.4},
  {id:"Europe/Budapest",city:"Budapest",country:"Hungary",abbr:"CET",dst:"CEST",lat:47.5,lon:19},
  {id:"Europe/Belgrade",city:"Belgrade",country:"Serbia",abbr:"CET",dst:"CEST",lat:44.8,lon:20.5},
  {id:"Europe/Helsinki",city:"Helsinki",country:"Finland",abbr:"EET",dst:"EEST",lat:60.2,lon:24.9},
  {id:"Europe/Bucharest",city:"Bucharest",country:"Romania",abbr:"EET",dst:"EEST",lat:44.4,lon:26.1},
  {id:"Europe/Sofia",city:"Sofia",country:"Bulgaria",abbr:"EET",dst:"EEST",lat:42.7,lon:23.3},
  {id:"Atlantic/Reykjavik",city:"Reykjavik",country:"Iceland",abbr:"GMT",lat:64.1,lon:-21.9},
  {id:"Africa/Casablanca",city:"Casablanca",country:"Morocco",abbr:"+01",lat:33.6,lon:-7.6},
  {id:"Africa/Algiers",city:"Algiers",country:"Algeria",abbr:"CET",lat:36.8,lon:3.1},
  {id:"Africa/Khartoum",city:"Khartoum",country:"Sudan",abbr:"CAT",lat:15.5,lon:32.5},
  {id:"Africa/Harare",city:"Harare",country:"Zimbabwe",abbr:"CAT",lat:-17.8,lon:31},
  {id:"Asia/Baghdad",city:"Baghdad",country:"Iraq",abbr:"AST",lat:33.3,lon:44.4},
  {id:"Asia/Qatar",city:"Doha",country:"Qatar",abbr:"AST",lat:25.3,lon:51.5},
  {id:"Asia/Kuwait",city:"Kuwait City",country:"Kuwait",abbr:"AST",lat:29.4,lon:48},
  {id:"Asia/Beirut",city:"Beirut",country:"Lebanon",abbr:"EET",dst:"EEST",lat:33.9,lon:35.5},
  {id:"Asia/Baku",city:"Baku",country:"Azerbaijan",abbr:"AZT",lat:40.4,lon:49.9},
  {id:"Asia/Tbilisi",city:"Tbilisi",country:"Georgia",abbr:"GET",lat:41.7,lon:44.8},
  {id:"Asia/Yerevan",city:"Yerevan",country:"Armenia",abbr:"AMT",lat:40.2,lon:44.5},
  {id:"Asia/Kabul",city:"Kabul",country:"Afghanistan",abbr:"AFT",lat:34.5,lon:69.2},
  {id:"Asia/Tashkent",city:"Tashkent",country:"Uzbekistan",abbr:"UZT",lat:41.3,lon:69.3},
  {id:"Asia/Almaty",city:"Almaty",country:"Kazakhstan",abbr:"+05",lat:43.3,lon:76.9},
  {id:"Asia/Yekaterinburg",city:"Yekaterinburg",country:"Russia",abbr:"YEKT",lat:56.8,lon:60.6},
  {id:"Asia/Yangon",city:"Yangon",country:"Myanmar",abbr:"MMT",lat:16.8,lon:96.2},
  {id:"Asia/Novosibirsk",city:"Novosibirsk",country:"Russia",abbr:"+07",lat:55,lon:82.9},
  {id:"Asia/Makassar",city:"Denpasar",country:"Indonesia",abbr:"WITA",lat:-8.7,lon:115.2},
  {id:"Asia/Ulaanbaatar",city:"Ulaanbaatar",country:"Mongolia",abbr:"ULAT",lat:47.9,lon:106.9},
  {id:"Asia/Vladivostok",city:"Vladivostok",country:"Russia",abbr:"VLAT",lat:43.1,lon:131.9},
  {id:"Australia/Darwin",city:"Darwin",country:"Australia",abbr:"ACST",lat:-12.5,lon:130.8},
  {id:"Pacific/Guam",city:"Hagåtña",country:"Guam",abbr:"ChST",lat:13.5,lon:144.8},
  {id:"Pacific/Port_Moresby",city:"Port Moresby",country:"Papua New Guinea",abbr:"PGT",lat:-9.5,lon:147.2},
  {id:"Pacific/Noumea",city:"Nouméa",country:"New Caledonia",abbr:"NCT",lat:-22.3,lon:166.5},
  {id:"Pacific/Tongatapu",city:"Nuku'alofa",country:"Tonga",abbr:"TOT",lat:-21.1,lon:-175.2},
  {id:"Pacific/Apia",city:"Apia",country:"Samoa",abbr:"WST",lat:-13.8,lon:-171.8},
  {key:"America/Toronto|Montreal",id:"America/Toronto",city:"Montreal",country:"Canada",abbr:"EST",dst:"EDT",lat:45.5,lon:-73.6},
  {key:"America/Toronto|Ottawa",id:"America/Toronto",city:"Ottawa",country:"Canada",abbr:"EST",dst:"EDT",lat:45.4,lon:-75.7},
  {key:"America/New_York|Atlanta",id:"America/New_York",city:"Atlanta",country:"United States",abbr:"EST",dst:"EDT",lat:33.7,lon:-84.4},
  {key:"America/New_York|Philadelphia",id:"America/New_York",city:"Philadelphia",country:"United States",abbr:"EST",dst:"EDT",lat:39.95,lon:-75.2},
  {key:"America/Sao_Paulo|Rio_de_Janeiro",id:"America/Sao_Paulo",city:"Rio de Janeiro",country:"Brazil",abbr:"BRT",lat:-22.9,lon:-43.2},
  {key:"America/Sao_Paulo|Brasilia",id:"America/Sao_Paulo",city:"Brasília",country:"Brazil",abbr:"BRT",lat:-15.8,lon:-47.9},
  {key:"Europe/Zurich|Geneva",id:"Europe/Zurich",city:"Geneva",country:"Switzerland",abbr:"CET",dst:"CEST",lat:46.2,lon:6.1},
  {key:"Europe/Moscow|Saint_Petersburg",id:"Europe/Moscow",city:"Saint Petersburg",country:"Russia",abbr:"MSK",lat:59.9,lon:30.3},
  {key:"Africa/Nairobi|Addis_Ababa",id:"Africa/Nairobi",city:"Addis Ababa",country:"Ethiopia",abbr:"EAT",lat:9,lon:38.7},
  {key:"Africa/Lagos|Kinshasa",id:"Africa/Lagos",city:"Kinshasa",country:"DR Congo",abbr:"WAT",lat:-4.3,lon:15.3},
  {key:"Asia/Dubai|Abu_Dhabi",id:"Asia/Dubai",city:"Abu Dhabi",country:"UAE",abbr:"GST",lat:24.5,lon:54.4},
  {key:"Asia/Jerusalem|Tel_Aviv",id:"Asia/Jerusalem",city:"Tel Aviv",country:"Israel",abbr:"IST",dst:"IDT",lat:32.1,lon:34.8},
  {key:"Asia/Kolkata|New_Delhi",id:"Asia/Kolkata",city:"New Delhi",country:"India",abbr:"IST",lat:28.6,lon:77.2},
  {key:"Asia/Kolkata|Bengaluru",id:"Asia/Kolkata",city:"Bengaluru",country:"India",abbr:"IST",lat:13,lon:77.6},
  {key:"Asia/Karachi|Islamabad",id:"Asia/Karachi",city:"Islamabad",country:"Pakistan",abbr:"PKT",lat:33.7,lon:73},
  {key:"Asia/Ho_Chi_Minh|Hanoi",id:"Asia/Ho_Chi_Minh",city:"Hanoi",country:"Vietnam",abbr:"ICT",lat:21,lon:105.8},
  {key:"Asia/Shanghai|Guangzhou",id:"Asia/Shanghai",city:"Guangzhou",country:"China",abbr:"CST",lat:23.1,lon:113.3},
  {key:"Asia/Shanghai|Shenzhen",id:"Asia/Shanghai",city:"Shenzhen",country:"China",abbr:"CST",lat:22.5,lon:114.1},
  {key:"Asia/Tokyo|Osaka",id:"Asia/Tokyo",city:"Osaka",country:"Japan",abbr:"JST",lat:34.7,lon:135.5},
  {key:"Australia/Sydney|Canberra",id:"Australia/Sydney",city:"Canberra",country:"Australia",abbr:"AEST",dst:"AEDT",lat:-35.3,lon:149.1},
  {key:"Pacific/Auckland|Wellington",id:"Pacific/Auckland",city:"Wellington",country:"New Zealand",abbr:"NZST",dst:"NZDT",lat:-41.3,lon:174.8},
];

// Cities shown by default on first visit (local zone is pinned in front of these
// at runtime). Keys must exist in TIMEZONE_DATA above.
const DEFAULT_TIMEZONES = [
  "UTC","America/New_York","Europe/London","Europe/Paris",
  "Asia/Dubai","Asia/Kolkata","Asia/Singapore","Asia/Tokyo",
  "Australia/Sydney","America/Los_Angeles","America/Sao_Paulo","America/Toronto"
];

// localStorage key shared by both pages. Only user preferences and the city
// selection are persisted here — never the transient time-travel offset.
const STORAGE_KEY = 'worldtime:v1';

// Resolve a zone id to its IANA canonical form (folds deprecated aliases like
// Asia/Calcutta -> Asia/Kolkata); falls back to the input if unsupported.
function canonicalTz(tz) {
  try { return Intl.DateTimeFormat('en-US', { timeZone: tz }).resolvedOptions().timeZone; }
  catch { return tz; }
}

// The visitor's own zone, mapped onto a catalog id when one matches.
const LOCAL_TZ = (() => {
  let raw;
  try { raw = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; }
  catch { return 'UTC'; }
  const canon = canonicalTz(raw);
  const match = TIMEZONE_DATA.find(d => canonicalTz(d.id) === canon);
  return match ? match.id : raw;
})();

// If the visitor's zone isn't in the catalog, synthesize an entry so it can still
// be shown as a clock (lat/lon null => it simply won't plot on the map).
if (!TIMEZONE_DATA.some(d => d.id === LOCAL_TZ)) {
  const parts = LOCAL_TZ.split('/');
  TIMEZONE_DATA.push({
    id: LOCAL_TZ,
    city: parts[parts.length - 1].replace(/_/g, ' '),
    country: parts.length > 1 ? parts[0] : '',
    abbr: '',
    lat: null,
    lon: null,
  });
}

// Each card is identified by a stable `key`. Alias cities declare their own;
// everything else keys by its IANA id.
TIMEZONE_DATA.forEach(d => { if (!d.key) d.key = d.id; });

// Look up a catalog entry by card key, falling back to a raw IANA id.
function dataByKey(key) {
  return TIMEZONE_DATA.find(d => d.key === key) || TIMEZONE_DATA.find(d => d.id === key);
}

// DOM-safe, collision-free slug derived from a card key (for element ids).
function keySlug(key) {
  return String(key).replace(/[^a-zA-Z0-9]+/g, '_');
}

// Format a wall-clock time. 24h -> "HH:MM[:SS]"; 12h -> "H:MM[:SS] AM/PM".
function formatTime(hour, minute, second, use24h, showSeconds = true) {
  const pad = (n) => String(n).padStart(2, '0');
  const secs = showSeconds ? ':' + pad(second) : '';
  if (use24h) return pad(hour) + ':' + pad(minute) + secs;
  const h12 = hour % 12 || 12;
  return pad(h12) + ':' + pad(minute) + secs + ' ' + (hour < 12 ? 'AM' : 'PM');
}

// HTML-escaping helpers. City/country names come from the static catalog above,
// not user input, so this is defensive consistency rather than a live XSS fix —
// but every value interpolated into innerHTML on either page should go through
// one of these so escaping can never drift between the two.
//   escHtml  — for HTML text content (escapes & < >)
//   escAttr  — for values placed inside a double-quoted attribute (also escapes ")
function escHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function escAttr(s) {
  return escHtml(s).replace(/"/g, '&quot;');
}
