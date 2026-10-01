import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Loader2,
  MapPin,
  Search,
  Sparkles,
  X,
} from "lucide-react";

/* ──────────────────────────────────────────────────────────────────────────
   Design tokens
   ────────────────────────────────────────────────────────────────────────── */

const PALETTE = {
  ink: "#1B1A17",
  cream: "#F6F1E4",
  paper: "#FFFDF7",
  yellow: "#F2B32F",
};

const CATEGORIES = {
  asia: { label: "Asia & Pacific", bg: "#E8572A", fg: "#FFFFFF", soft: "#FBE4DA" },
  americas: { label: "Americas", bg: "#2F6FDE", fg: "#FFFFFF", soft: "#DDE8FB" },
  europe: { label: "Europe", bg: "#F2B32F", fg: "#1B1A17", soft: "#FCEFCF" },
  africa: { label: "Africa & Middle East", bg: "#1F9D63", fg: "#FFFFFF", soft: "#D6F0E3" },
  global: { label: "Global & Multicultural", bg: "#7C5CDB", fg: "#FFFFFF", soft: "#E9E2FA" },
};
const CATEGORY_ORDER = ["asia", "americas", "europe", "africa", "global"];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEKDAYS_LONG = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const LUNAR_RANGE = [2024, 2030];

/* ──────────────────────────────────────────────────────────────────────────
   Date rules — fixed dates are "MM-DD"; movable feasts are functions (year) => Date
   ────────────────────────────────────────────────────────────────────────── */

// n-th weekday of a month (weekday: 0=Sun … 6=Sat; n = -1 means last)
const nthWeekday = (month, weekday, n) => (y) => {
  if (n > 0) {
    const first = new Date(y, month - 1, 1);
    const offset = (weekday - first.getDay() + 7) % 7;
    return new Date(y, month - 1, 1 + offset + (n - 1) * 7);
  }
  const last = new Date(y, month, 0);
  const offset = (last.getDay() - weekday + 7) % 7;
  return new Date(y, month - 1, last.getDate() - offset);
};

const weekdayOnOrAfter = (month, day, weekday) => (y) => {
  const d = new Date(y, month - 1, day);
  d.setDate(d.getDate() + ((weekday - d.getDay() + 7) % 7));
  return d;
};

const weekdayOnOrBefore = (month, day, weekday) => (y) => {
  const d = new Date(y, month - 1, day);
  d.setDate(d.getDate() - ((d.getDay() - weekday + 7) % 7));
  return d;
};

// Anonymous Gregorian algorithm (Meeus/Jones/Butcher)
function westernEaster(y) {
  const a = y % 19;
  const b = Math.floor(y / 100);
  const c = y % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(y, month - 1, day);
}

// Julian computus converted to Gregorian (valid 1900–2099)
function orthodoxEasterDate(y) {
  const a = y % 4;
  const b = y % 7;
  const c = y % 19;
  const d = (19 * c + 15) % 30;
  const e = (2 * a + 4 * b - d + 34) % 7;
  const month = Math.floor((d + e + 114) / 31);
  const day = ((d + e + 114) % 31) + 1;
  const dt = new Date(y, month - 1, day);
  dt.setDate(dt.getDate() + 13);
  return dt;
}

const easter = (offset = 0) => (y) => {
  const d = westernEaster(y);
  d.setDate(d.getDate() + offset);
  return d;
};
const orthodoxEaster = () => (y) => orthodoxEasterDate(y);

// Lunar / lunisolar festivals use tabulated dates (approximate; may vary by a day regionally)
const lunar = (table, offset = 0) => (y) => {
  const v = table[y];
  if (!v) return null;
  const [m, d] = v.split("-").map(Number);
  return new Date(y, m - 1, d + offset);
};

const LUNAR_NEW_YEAR = { 2024: "02-10", 2025: "01-29", 2026: "02-17", 2027: "02-06", 2028: "01-26", 2029: "02-13", 2030: "02-03" };
const RAMADAN_START = { 2024: "03-11", 2025: "03-01", 2026: "02-18", 2027: "02-08", 2028: "01-28", 2029: "01-16", 2030: "01-06" };
const EID_AL_FITR = { 2024: "04-10", 2025: "03-30", 2026: "03-20", 2027: "03-09", 2028: "02-26", 2029: "02-14", 2030: "02-05" };
const EID_AL_ADHA = { 2024: "06-16", 2025: "06-06", 2026: "05-27", 2027: "05-16", 2028: "05-05", 2029: "04-24", 2030: "04-13" };
const ISLAMIC_NEW_YEAR = { 2024: "07-07", 2025: "06-26", 2026: "06-16", 2027: "06-06", 2028: "05-25", 2029: "05-14", 2030: "05-03" };
const HOLI = { 2024: "03-25", 2025: "03-14", 2026: "03-04", 2027: "03-22", 2028: "03-11", 2029: "03-01", 2030: "03-20" };
const DIWALI = { 2024: "10-31", 2025: "10-20", 2026: "11-08", 2027: "10-29", 2028: "10-17", 2029: "11-05", 2030: "10-26" };
const DUSSEHRA = { 2024: "10-12", 2025: "10-02", 2026: "10-20", 2027: "10-09", 2028: "09-27", 2029: "10-16", 2030: "10-06" };
const GANESH_CHATURTHI = { 2024: "09-07", 2025: "08-27", 2026: "09-14", 2027: "09-04", 2028: "08-23", 2029: "09-11", 2030: "09-01" };
const MID_AUTUMN = { 2024: "09-17", 2025: "10-06", 2026: "09-25", 2027: "09-15", 2028: "10-03", 2029: "09-22", 2030: "09-12" };
const DRAGON_BOAT = { 2024: "06-10", 2025: "05-31", 2026: "06-19", 2027: "06-09", 2028: "05-28", 2029: "06-16", 2030: "06-05" };
const ROSH_HASHANAH = { 2024: "10-03", 2025: "09-23", 2026: "09-12", 2027: "10-02", 2028: "09-21", 2029: "09-10", 2030: "09-28" };
const HANUKKAH = { 2024: "12-25", 2025: "12-14", 2026: "12-04", 2027: "12-24", 2028: "12-12", 2029: "12-01", 2030: "12-20" };
const LOY_KRATHONG = { 2024: "11-15", 2025: "11-05", 2026: "11-24", 2027: "11-13", 2028: "11-02", 2029: "11-20", 2030: "11-09" };
const MATARIKI = { 2024: "06-28", 2025: "06-20", 2026: "07-10", 2027: "06-25", 2028: "07-14", 2029: "07-06", 2030: "06-21" };

/* ──────────────────────────────────────────────────────────────────────────
   Dataset
   [title, region, flag, category, when, shortDescription, wikipediaSlug]
   ────────────────────────────────────────────────────────────────────────── */

const RAW_EVENTS = [
  // January
  ["New Year's Day", "Worldwide", "🌍", "global", "01-01", "The first day of the Gregorian year, greeted with fireworks, resolutions and family gatherings across the globe.", "New_Year%27s_Day"],
  ["Three Kings' Day", "Spain & Latin America", "🇪🇸", "europe", "01-06", "Epiphany is celebrated with parades of the Magi, gifts for children and the ring-shaped roscón de reyes.", "Epiphany_(holiday)"],
  ["Orthodox Christmas", "Serbia & Orthodox world", "🇷🇸", "europe", "01-07", "Churches following the Julian calendar celebrate the Nativity with midnight liturgies, oak branches and festive bread.", "Serbian_Christmas_traditions"],
  ["Makar Sankranti", "India", "🇮🇳", "asia", "01-14", "A harvest festival marking the sun's move into Capricorn, famous for kite-flying and sesame-jaggery sweets.", "Makar_Sankranti"],
  ["Pongal", "Tamil Nadu, India", "🇮🇳", "asia", "01-15", "A four-day Tamil harvest thanksgiving named after the sweet rice dish boiled until it overflows the pot.", "Pongal_(festival)"],
  ["Martin Luther King Jr. Day", "United States", "🇺🇸", "americas", nthWeekday(1, 1, 3), "Honours the civil rights leader with a national day of service, marches and community events.", "Martin_Luther_King_Jr._Day"],
  ["Timkat", "Ethiopia", "🇪🇹", "africa", "01-19", "Ethiopian Orthodox Epiphany, with colourful processions carrying replicas of the Ark of the Covenant to water.", "Timkat"],
  ["Burns Night", "Scotland", "🏴󠁧󠁢󠁳󠁣󠁴󠁿", "europe", "01-25", "Suppers honouring poet Robert Burns, with haggis piped to the table, whisky toasts and poetry recitals.", "Burns_supper"],
  ["Australia Day", "Australia", "🇦🇺", "asia", "01-26", "Australia's national day — marked by citizenship ceremonies and barbecues, and also by Indigenous-led reflection.", "Australia_Day"],
  ["Republic Day", "India", "🇮🇳", "asia", "01-26", "Celebrates India's constitution coming into force, with a grand military and cultural parade in New Delhi.", "Republic_Day_(India)"],
  ["Holocaust Remembrance Day", "Worldwide", "🌍", "global", "01-27", "UN day of commemoration marking the liberation of Auschwitz-Birkenau and remembering victims of the Holocaust.", "International_Holocaust_Remembrance_Day"],
  ["Up Helly Aa", "Shetland, Scotland", "🏴󠁧󠁢󠁳󠁣󠁴󠁿", "europe", nthWeekday(1, 2, -1), "A Viking fire festival where a torch-lit procession ends with the burning of a full-size longship.", "Up_Helly_Aa"],
  ["Lunar New Year", "China, Korea, Vietnam & diaspora", "🇨🇳", "asia", lunar(LUNAR_NEW_YEAR), "The most important festival in the lunisolar calendar: reunion dinners, red envelopes, lion dances and fireworks.", "Lunar_New_Year"],

  // February
  ["Groundhog Day", "United States & Canada", "🇺🇸", "americas", "02-02", "Folk tradition in which a groundhog's shadow 'predicts' whether winter will last six more weeks.", "Groundhog_Day"],
  ["Black History Month (US)", "United States & Canada", "🇺🇸", "americas", "02-01", "A month recognising the achievements, history and culture of African Americans and Black Canadians.", "Black_History_Month"],
  ["Waitangi Day", "New Zealand", "🇳🇿", "asia", "02-06", "Commemorates the 1840 signing of the Treaty of Waitangi between the British Crown and Māori chiefs.", "Waitangi_Day"],
  ["Valentine's Day", "Worldwide", "💌", "global", "02-14", "A day for romance and friendship, with cards, flowers and chocolates exchanged around the world.", "Valentine%27s_Day"],
  ["International Mother Language Day", "Worldwide", "🌍", "global", "02-21", "UNESCO day promoting linguistic and cultural diversity, rooted in the 1952 Bengali language movement.", "International_Mother_Language_Day"],
  ["Lantern Festival", "China & East Asia", "🏮", "asia", lunar(LUNAR_NEW_YEAR, 14), "Closes the New Year season on the first full moon, with lantern displays, riddles and sweet tangyuan dumplings.", "Lantern_Festival"],
  ["Ramadan Begins", "Muslim communities worldwide", "🌙", "africa", lunar(RAMADAN_START), "The holy month of fasting from dawn to sunset, prayer, reflection and nightly iftar meals.", "Ramadan"],
  ["Rio Carnival", "Rio de Janeiro, Brazil", "🇧🇷", "americas", easter(-51), "The world's largest carnival: samba school parades in the Sambadrome and street parties across the city.", "Rio_Carnival"],
  ["Mardi Gras", "New Orleans, USA", "🇺🇸", "americas", easter(-47), "Fat Tuesday brings parades, krewes, beads and king cake before the start of Lent.", "Mardi_Gras_in_New_Orleans"],
  ["Pancake Day", "United Kingdom & Ireland", "🇬🇧", "europe", easter(-47), "Shrove Tuesday tradition of using up rich ingredients before Lent — with pancake races in many towns.", "Shrove_Tuesday"],

  // March
  ["St David's Day", "Wales", "🏴󠁧󠁢󠁷󠁬󠁳󠁿", "europe", "03-01", "Wales' national day: daffodils, leeks, traditional dress and parades celebrating the patron saint.", "Saint_David%27s_Day"],
  ["Independence Day", "Ghana", "🇬🇭", "africa", "03-06", "Marks Ghana becoming the first sub-Saharan African colony to gain independence, in 1957.", "Independence_Day_(Ghana)"],
  ["International Women's Day", "Worldwide", "🌍", "global", "03-08", "Celebrates women's achievements and campaigns for gender equality around the world.", "International_Women%27s_Day"],
  ["St Patrick's Day", "Ireland", "🇮🇪", "europe", "03-17", "Ireland's national holiday, with parades, music, shamrocks and green-lit landmarks worldwide.", "Saint_Patrick%27s_Day"],
  ["Las Fallas", "Valencia, Spain", "🇪🇸", "europe", "03-19", "Giant satirical papier-mâché sculptures are paraded and then burned in a spectacular final night.", "Falles"],
  ["Nowruz", "Iran, Central Asia & beyond", "🇮🇷", "africa", "03-20", "Persian New Year at the spring equinox, with the haft-sin table, spring cleaning and family visits.", "Nowruz"],
  ["Human Rights Day", "South Africa", "🇿🇦", "africa", "03-21", "Commemorates the 1960 Sharpeville massacre and celebrates the rights enshrined in the constitution.", "Human_Rights_Day_(South_Africa)"],
  ["World Poetry Day", "Worldwide", "🌍", "global", "03-21", "UNESCO day celebrating poetry's role in expressing and preserving languages and cultures.", "World_Poetry_Day"],
  ["Holi", "India & Nepal", "🇮🇳", "asia", lunar(HOLI), "The festival of colours: people drench each other in coloured powder and water to welcome spring.", "Holi"],
  ["Eid al-Fitr", "Muslim communities worldwide", "🌙", "africa", lunar(EID_AL_FITR), "Marks the end of Ramadan with special prayers, new clothes, charity and festive family feasts.", "Eid_al-Fitr"],
  ["Mothering Sunday", "United Kingdom", "🇬🇧", "europe", easter(-21), "The UK's Mother's Day, on the fourth Sunday of Lent, with flowers, cards and simnel cake.", "Mothering_Sunday"],

  // April
  ["April Fools' Day", "Worldwide", "🃏", "global", "04-01", "A day of pranks and hoaxes — known as poisson d'avril in France and Italy.", "April_Fools%27_Day"],
  ["Songkran", "Thailand", "🇹🇭", "asia", "04-13", "Thai New Year, celebrated with joyous nationwide water fights and merit-making at temples.", "Songkran_(Thailand)"],
  ["Vaisakhi", "Punjab, India & Sikh diaspora", "🇮🇳", "asia", "04-14", "Spring harvest festival and the founding day of the Khalsa, with processions and bhangra dancing.", "Vaisakhi"],
  ["Sinhala & Tamil New Year", "Sri Lanka", "🇱🇰", "asia", "04-14", "Astrologically timed new-year rituals, oil-lamp lighting, games and kiribath milk rice.", "Sinhalese_New_Year"],
  ["Pohela Boishakh", "Bangladesh", "🇧🇩", "asia", "04-14", "Bengali New Year, opened with the colourful Mangal Shobhajatra procession in Dhaka.", "Pohela_Boishakh"],
  ["Earth Day", "Worldwide", "🌱", "global", "04-22", "A global day of environmental action, clean-ups and climate awareness.", "Earth_Day"],
  ["Anzac Day", "Australia & New Zealand", "🇦🇺", "asia", "04-25", "Dawn services remember those who served and died in wars, beginning with Gallipoli in 1915.", "Anzac_Day"],
  ["King's Day", "Netherlands", "🇳🇱", "europe", "04-27", "The Netherlands turns orange for the monarch's birthday: street markets, canal parties and music.", "Koningsdag"],
  ["Freedom Day", "South Africa", "🇿🇦", "africa", "04-27", "Commemorates South Africa's first democratic, non-racial elections in 1994.", "Freedom_Day_(South_Africa)"],
  ["Walpurgis Night", "Sweden, Germany & Finland", "🇸🇪", "europe", "04-30", "Bonfires and choral singing welcome spring on the eve of May Day.", "Walpurgis_Night"],
  ["Easter Sunday", "Christian communities worldwide", "✝️", "global", easter(0), "Christianity's central feast of the resurrection, with church services, egg hunts and family meals.", "Easter"],
  ["Orthodox Easter", "Greece, Eastern Europe & beyond", "🇬🇷", "europe", orthodoxEaster(), "Pascha is celebrated with midnight candlelit services, red-dyed eggs and lamb feasts.", "Easter"],

  // May
  ["International Workers' Day", "Worldwide", "🌍", "global", "05-01", "May Day honours labour movements with marches and rallies across the world.", "International_Workers%27_Day"],
  ["Cinco de Mayo", "Mexico & United States", "🇲🇽", "americas", "05-05", "Commemorates the 1862 Battle of Puebla; widely celebrated as a festival of Mexican-American heritage.", "Cinco_de_Mayo"],
  ["Children's Day", "Japan", "🇯🇵", "asia", "05-05", "Families fly carp-shaped koinobori streamers to wish children health and strength.", "Children%27s_Day_(Japan)"],
  ["Europe Day", "European Union", "🇪🇺", "europe", "05-09", "Celebrates peace and unity in Europe on the anniversary of the 1950 Schuman Declaration.", "Europe_Day"],
  ["Constitution Day", "Norway", "🇳🇴", "europe", "05-17", "Syttende mai: children's parades, bunads, flags and ice cream across Norway.", "Constitution_Day_(Norway)"],
  ["Africa Day", "African Union", "🌍", "africa", "05-25", "Marks the 1963 founding of the Organisation of African Unity, celebrating the continent's diversity.", "Africa_Day"],
  ["Mother's Day (US)", "United States & many countries", "🇺🇸", "americas", nthWeekday(5, 0, 2), "Honours mothers with cards, flowers and brunch on the second Sunday of May.", "Mother%27s_Day_(United_States)"],
  ["Victoria Day", "Canada", "🇨🇦", "americas", weekdayOnOrBefore(5, 24, 1), "Canada's unofficial start of summer, honouring Queen Victoria with fireworks and long-weekend gatherings.", "Victoria_Day"],
  ["Memorial Day", "United States", "🇺🇸", "americas", nthWeekday(5, 1, -1), "Honours US military personnel who died in service, with parades and cemetery visits.", "Memorial_Day"],
  ["Eid al-Adha", "Muslim communities worldwide", "🌙", "africa", lunar(EID_AL_ADHA), "The Feast of Sacrifice, coinciding with the Hajj — prayers, shared meat and generosity to those in need.", "Eid_al-Adha"],
  ["Islamic New Year", "Muslim communities worldwide", "🌙", "africa", lunar(ISLAMIC_NEW_YEAR), "Marks the start of the Hijri year and the Prophet's migration from Mecca to Medina.", "Islamic_New_Year"],

  // June
  ["Pride Month", "Worldwide", "🏳️‍🌈", "global", "06-01", "A month of parades and events celebrating LGBTQ+ communities and commemorating the Stonewall uprising.", "Pride_Month"],
  ["Portugal Day", "Portugal", "🇵🇹", "europe", "06-10", "Honours poet Luís de Camões and Portuguese communities around the world.", "Portugal_Day"],
  ["Day of the African Child", "African Union", "🌍", "africa", "06-16", "Remembers the 1976 Soweto student uprising and advocates for children's education and rights.", "International_Day_of_the_African_Child"],
  ["Juneteenth", "United States", "🇺🇸", "americas", "06-19", "Commemorates the end of slavery in the US, with cookouts, music and readings of the 1865 proclamation.", "Juneteenth"],
  ["World Refugee Day", "Worldwide", "🌍", "global", "06-20", "UN day honouring the strength and courage of people forced to flee their homes.", "World_Refugee_Day"],
  ["Fête de la Musique", "France & worldwide", "🇫🇷", "europe", "06-21", "Free music in streets and squares on the summer solstice, born in Paris in 1982.", "Fête_de_la_Musique"],
  ["Inti Raymi", "Cusco, Peru", "🇵🇪", "americas", "06-24", "The Inca Festival of the Sun, re-enacted with costumed processions at Sacsayhuamán.", "Inti_Raymi"],
  ["Festa Junina", "Brazil", "🇧🇷", "americas", "06-24", "Rural-themed June parties with quadrilha dances, bonfires, plaid shirts and corn treats.", "Festa_Junina"],
  ["Midsummer", "Sweden", "🇸🇪", "europe", weekdayOnOrAfter(6, 19, 5), "Maypole dancing, flower crowns, herring and schnapps under the long Nordic daylight.", "Midsummer"],
  ["Dragon Boat Festival", "China & East Asia", "🐉", "asia", lunar(DRAGON_BOAT), "Dragon boat races and zongzi rice dumplings commemorate the poet Qu Yuan.", "Dragon_Boat_Festival"],

  // July
  ["Canada Day", "Canada", "🇨🇦", "americas", "07-01", "Celebrates Confederation in 1867 with fireworks, concerts and maple-leaf flags.", "Canada_Day"],
  ["Independence Day", "United States", "🇺🇸", "americas", "07-04", "Fireworks, parades and barbecues mark the 1776 Declaration of Independence.", "Independence_Day_(United_States)"],
  ["San Fermín", "Pamplona, Spain", "🇪🇸", "europe", "07-06", "A week-long fiesta in white and red, famous for its morning bull runs and street celebrations.", "San_Fermín"],
  ["Tanabata", "Japan", "🇯🇵", "asia", "07-07", "The star festival: wishes written on paper strips are hung on bamboo to honour two star-crossed lovers.", "Tanabata"],
  ["Bastille Day", "France", "🇫🇷", "europe", "07-14", "France's Fête nationale, with the Champs-Élysées military parade and fireworks over the Eiffel Tower.", "Bastille_Day"],
  ["Gion Matsuri", "Kyoto, Japan", "🇯🇵", "asia", "07-17", "One of Japan's most famous festivals, with towering ornate floats paraded through Kyoto.", "Gion_Matsuri"],
  ["Nelson Mandela Day", "Worldwide", "🇿🇦", "africa", "07-18", "On Mandela's birthday, people are asked to give 67 minutes of service to their communities.", "Nelson_Mandela_International_Day"],
  ["Fiestas Patrias", "Peru", "🇵🇪", "americas", "07-28", "Peru's independence celebrations with parades, music, pisco and traditional food.", "Fiestas_Patrias_(Peru)"],
  ["International Day of Friendship", "Worldwide", "🤝", "global", "07-30", "UN day promoting friendship between peoples, cultures and countries.", "International_Day_of_Friendship"],
  ["Matariki", "New Zealand", "🇳🇿", "asia", lunar(MATARIKI), "Māori New Year, marked by the rising of the Matariki star cluster — a time for remembrance and renewal.", "Matariki"],

  // August
  ["Independence Day", "Jamaica", "🇯🇲", "americas", "08-06", "Celebrates independence from Britain in 1962 with music, parades and Grand Gala festivities.", "Independence_Day_(Jamaica)"],
  ["Edinburgh Festival Fringe", "Edinburgh, Scotland", "🏴󠁧󠁢󠁳󠁣󠁴󠁿", "europe", nthWeekday(8, 5, 1), "The world's largest arts festival, with thousands of comedy, theatre and music shows across the city.", "Edinburgh_Festival_Fringe"],
  ["Indigenous Peoples Day (UN)", "Worldwide", "🌍", "global", "08-09", "UN day raising awareness of the rights and cultures of the world's Indigenous peoples.", "International_Day_of_the_World%27s_Indigenous_Peoples"],
  ["National Women's Day", "South Africa", "🇿🇦", "africa", "08-09", "Commemorates the 1956 march of 20,000 women on Pretoria's Union Buildings against pass laws.", "National_Women%27s_Day"],
  ["International Youth Day", "Worldwide", "🌍", "global", "08-12", "UN day spotlighting young people's role in culture, society and change.", "International_Youth_Day"],
  ["Obon", "Japan", "🇯🇵", "asia", "08-13", "Ancestors are welcomed home with lanterns, Bon Odori dances and family gatherings.", "Bon_Festival"],
  ["Independence Day", "Pakistan", "🇵🇰", "asia", "08-14", "Flag-hoisting, green-and-white decorations and fireworks mark Pakistan's founding in 1947.", "Independence_Day_(Pakistan)"],
  ["Independence Day", "India", "🇮🇳", "asia", "08-15", "The Prime Minister raises the flag at Delhi's Red Fort; kites fill the skies nationwide.", "Independence_Day_(India)"],
  ["Notting Hill Carnival", "London, United Kingdom", "🇬🇧", "europe", (y) => { const d = nthWeekday(8, 1, -1)(y); d.setDate(d.getDate() - 1); return d; }, "Europe's biggest street festival, celebrating Caribbean culture with soca, steel bands and costume parades.", "Notting_Hill_Carnival"],
  ["La Tomatina", "Buñol, Spain", "🇪🇸", "europe", nthWeekday(8, 3, -1), "A joyful, messy hour in which thousands of people pelt each other with ripe tomatoes.", "La_Tomatina"],
  ["Ganesh Chaturthi", "India", "🇮🇳", "asia", lunar(GANESH_CHATURTHI), "Ten days honouring Lord Ganesha, ending with idols immersed in seas and rivers.", "Ganesh_Chaturthi"],

  // September
  ["Labor Day", "United States & Canada", "🇺🇸", "americas", nthWeekday(9, 1, 1), "Honours workers and marks the unofficial end of summer.", "Labor_Day"],
  ["Independence Day", "Brazil", "🇧🇷", "americas", "09-07", "Sete de Setembro celebrates independence from Portugal in 1822 with military parades.", "Independence_Day_(Brazil)"],
  ["Hispanic Heritage Month", "United States", "🇺🇸", "americas", "09-15", "A month celebrating the histories and cultures of Hispanic and Latino Americans.", "Hispanic_Heritage_Month"],
  ["Mexican Independence Day", "Mexico", "🇲🇽", "americas", "09-16", "Begins with El Grito the night before, followed by parades, mariachi and fireworks.", "Grito_de_Dolores"],
  ["Fiestas Patrias", "Chile", "🇨🇱", "americas", "09-18", "Chile's national holidays: fondas, cueca dancing, empanadas and kite flying.", "Fiestas_Patrias_(Chile)"],
  ["International Day of Peace", "Worldwide", "🕊️", "global", "09-21", "A UN day dedicated to strengthening ideals of peace, including 24 hours of non-violence.", "International_Day_of_Peace"],
  ["Heritage Day", "South Africa", "🇿🇦", "africa", "09-24", "Celebrates the rainbow nation's diverse cultures — affectionately known as National Braai Day.", "Heritage_Day_(South_Africa)"],
  ["European Day of Languages", "Europe", "🇪🇺", "europe", "09-26", "Encourages language learning and celebrates Europe's 200+ languages.", "European_Day_of_Languages"],
  ["Meskel", "Ethiopia", "🇪🇹", "africa", "09-27", "UNESCO-listed festival marking the finding of the True Cross, with a towering bonfire, the Demera.", "Meskel"],
  ["Oktoberfest Opens", "Munich, Germany", "🇩🇪", "europe", weekdayOnOrAfter(9, 16, 6), "The world's largest folk festival opens with the tapping of the first keg in Munich.", "Oktoberfest"],
  ["Mid-Autumn Festival", "China, Vietnam & diaspora", "🥮", "asia", lunar(MID_AUTUMN), "Families gather under the full harvest moon to share mooncakes and light lanterns.", "Mid-Autumn_Festival"],
  ["Chuseok", "South Korea", "🇰🇷", "asia", lunar(MID_AUTUMN), "Korean harvest festival: ancestral rites, songpyeon rice cakes and journeys to hometowns.", "Chuseok"],
  ["Rosh Hashanah", "Jewish communities worldwide", "✡️", "africa", lunar(ROSH_HASHANAH), "The Jewish New Year, with shofar blowing and apples dipped in honey for a sweet year.", "Rosh_Hashanah"],
  ["Yom Kippur", "Jewish communities worldwide", "✡️", "africa", lunar(ROSH_HASHANAH, 9), "The Day of Atonement — the holiest day of the Jewish year, observed with fasting and prayer.", "Yom_Kippur"],
  ["Sukkot", "Jewish communities worldwide", "✡️", "africa", lunar(ROSH_HASHANAH, 14), "A week-long harvest festival when families eat in decorated outdoor huts called sukkahs.", "Sukkot"],

  // October
  ["Black History Month (UK)", "United Kingdom", "🇬🇧", "europe", "10-01", "A month recognising the contributions and histories of Black people in Britain.", "Black_History_Month"],
  ["National Day", "China", "🇨🇳", "asia", "10-01", "Begins the Golden Week holiday, marking the founding of the People's Republic in 1949.", "National_Day_of_the_People%27s_Republic_of_China"],
  ["Independence Day", "Nigeria", "🇳🇬", "africa", "10-01", "Celebrates independence from Britain in 1960 with parades, music and cultural displays.", "Independence_Day_(Nigeria)"],
  ["German Unity Day", "Germany", "🇩🇪", "europe", "10-03", "Marks the 1990 reunification of East and West Germany.", "German_Unity_Day"],
  ["World Mental Health Day", "Worldwide", "💚", "global", "10-10", "A global day for mental-health awareness, education and advocacy.", "World_Mental_Health_Day"],
  ["Fiesta Nacional", "Spain", "🇪🇸", "europe", "10-12", "Spain's national day, with a military parade in Madrid and celebrations of Hispanic heritage.", "Fiesta_Nacional_de_España"],
  ["Thanksgiving (Canada)", "Canada", "🇨🇦", "americas", nthWeekday(10, 1, 2), "A harvest thanksgiving with turkey, pumpkin pie and family gatherings.", "Thanksgiving_(Canada)"],
  ["Indigenous Peoples' Day", "United States", "🇺🇸", "americas", nthWeekday(10, 1, 2), "Honours Native American peoples and their histories and cultures.", "Indigenous_Peoples%27_Day"],
  ["United Nations Day", "Worldwide", "🇺🇳", "global", "10-24", "Marks the anniversary of the UN Charter coming into force in 1945.", "United_Nations_Day"],
  ["Halloween", "Worldwide (Celtic roots)", "🎃", "global", "10-31", "Rooted in the Celtic Samhain: costumes, trick-or-treating and carved jack-o'-lanterns.", "Halloween"],
  ["Dussehra", "India & Nepal", "🇮🇳", "asia", lunar(DUSSEHRA), "Celebrates the victory of good over evil, with giant effigies of Ravana burned at dusk.", "Vijayadashami"],
  ["Diwali", "India & worldwide", "🪔", "asia", lunar(DIWALI), "The festival of lights: oil lamps, rangoli, sweets and fireworks celebrate light over darkness.", "Diwali"],

  // November
  ["All Saints' Day", "Europe & Catholic world", "🕯️", "europe", "11-01", "Families visit cemeteries to light candles and leave flowers for loved ones.", "All_Saints%27_Day"],
  ["Día de los Muertos", "Mexico", "🇲🇽", "americas", "11-02", "Altars, marigolds, sugar skulls and pan de muerto welcome the spirits of the departed.", "Day_of_the_Dead"],
  ["Bonfire Night", "United Kingdom", "🇬🇧", "europe", "11-05", "Fireworks and bonfires remember the failed Gunpowder Plot of 1605.", "Guy_Fawkes_Night"],
  ["Remembrance Day", "Commonwealth & Europe", "🌺", "europe", "11-11", "Two minutes of silence at 11am and poppies honour those who died in war.", "Remembrance_Day"],
  ["Shichi-Go-San", "Japan", "🇯🇵", "asia", "11-15", "Children aged three, five and seven visit shrines in kimono to pray for healthy growth.", "Shichi-Go-San"],
  ["World Children's Day", "Worldwide", "🌍", "global", "11-20", "UNICEF day promoting children's rights and international togetherness.", "Universal_Children%27s_Day"],
  ["Thanksgiving", "United States", "🇺🇸", "americas", nthWeekday(11, 4, 4), "A harvest feast of turkey and pie, parades and American football with family.", "Thanksgiving_(United_States)"],
  ["St Andrew's Day", "Scotland", "🏴󠁧󠁢󠁳󠁣󠁴󠁿", "europe", "11-30", "Scotland's national day, with ceilidhs, food and celebrations of Scottish culture.", "Saint_Andrew%27s_Day"],
  ["Loy Krathong", "Thailand", "🇹🇭", "asia", lunar(LOY_KRATHONG), "Floating candlelit baskets on rivers under the full moon to give thanks to the water goddess.", "Loy_Krathong"],

  // December
  ["St Nicholas Day", "Netherlands, Germany & Central Europe", "🇳🇱", "europe", "12-06", "Children leave out shoes and wake to sweets and small gifts from Saint Nicholas.", "Saint_Nicholas_Day"],
  ["Human Rights Day", "Worldwide", "🌍", "global", "12-10", "Commemorates the 1948 adoption of the Universal Declaration of Human Rights.", "Human_Rights_Day"],
  ["Jamhuri Day", "Kenya", "🇰🇪", "africa", "12-12", "Celebrates Kenya's independence and becoming a republic, with festivities across the country.", "Jamhuri_Day"],
  ["Our Lady of Guadalupe", "Mexico", "🇲🇽", "americas", "12-12", "Millions of pilgrims visit the Basilica in Mexico City for one of the world's largest pilgrimages.", "Our_Lady_of_Guadalupe"],
  ["Santa Lucia", "Sweden & Scandinavia", "🇸🇪", "europe", "12-13", "Processions led by a girl in a crown of candles bring light to the darkest time of year.", "Saint_Lucy%27s_Day"],
  ["Day of Reconciliation", "South Africa", "🇿🇦", "africa", "12-16", "A public holiday fostering reconciliation and national unity.", "Day_of_Reconciliation"],
  ["Las Posadas", "Mexico & Latin America", "🇲🇽", "americas", "12-16", "Nine nights of processions re-enacting Mary and Joseph's search for shelter, ending in festive parties.", "Las_Posadas"],
  ["Dongzhi Festival", "China & East Asia", "🥣", "asia", "12-22", "The winter solstice festival, when families gather to eat tangyuan and dumplings.", "Dongzhi_Festival"],
  ["Christmas Day", "Worldwide", "🎄", "global", "12-25", "Celebrates the birth of Jesus with church services, gifts, carols and festive feasts.", "Christmas"],
  ["Boxing Day", "UK & Commonwealth", "🇬🇧", "europe", "12-26", "A holiday of leftovers, football fixtures, walks and sales the day after Christmas.", "Boxing_Day"],
  ["Kwanzaa Begins", "United States", "🇺🇸", "americas", "12-26", "A week-long celebration of African-American culture built on seven principles, the Nguzo Saba.", "Kwanzaa"],
  ["Hogmanay", "Scotland", "🏴󠁧󠁢󠁳󠁣󠁴󠁿", "europe", "12-31", "Scotland's New Year's Eve: torchlight, fireworks, first-footing and 'Auld Lang Syne'.", "Hogmanay"],
  ["Ōmisoka", "Japan", "🇯🇵", "asia", "12-31", "Japanese New Year's Eve: toshikoshi soba noodles and temple bells rung 108 times.", "Ōmisoka"],
  ["Hanukkah Begins", "Jewish communities worldwide", "🕎", "africa", lunar(HANUKKAH), "The eight-night festival of lights, with menorah candles, latkes and spinning dreidels.", "Hanukkah"],
];

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const EVENTS = RAW_EVENTS.map(([title, region, flag, category, when, shortDescription, wiki], i) => ({
  id: `${slugify(title)}-${slugify(region)}-${i}`,
  title,
  region,
  flag,
  category,
  when,
  movable: typeof when !== "string",
  shortDescription,
  learnMoreUrl: `https://en.wikipedia.org/wiki/${wiki}`,
}));

function eventsForYear(year) {
  const out = [];
  for (const ev of EVENTS) {
    let d;
    if (typeof ev.when === "string") {
      const [m, day] = ev.when.split("-").map(Number);
      d = new Date(year, m - 1, day);
    } else {
      d = ev.when(year);
    }
    if (!d || d.getFullYear() !== year) continue;
    out.push({
      ...ev,
      key: `${ev.id}-${year}`,
      date: { day: d.getDate(), month: d.getMonth() + 1 },
      year,
    });
  }
  const order = (e) => CATEGORY_ORDER.indexOf(e.category);
  return out.sort(
    (a, b) =>
      a.date.month - b.date.month ||
      a.date.day - b.date.day ||
      order(a) - order(b) ||
      a.title.localeCompare(b.title)
  );
}

function buildGrid(year, month) {
  const first = new Date(year, month, 1);
  const lead = (first.getDay() + 6) % 7; // Monday-first
  const total = Math.ceil((lead + new Date(year, month + 1, 0).getDate()) / 7) * 7;
  return Array.from({ length: total }, (_, i) => {
    const d = new Date(year, month, 1 - lead + i);
    return { day: d.getDate(), month: d.getMonth(), year: d.getFullYear(), inMonth: d.getMonth() === month };
  });
}

const formatDate = (ev) => {
  const d = new Date(ev.year, ev.date.month - 1, ev.date.day);
  return `${WEEKDAYS_LONG[(d.getDay() + 6) % 7]}, ${ev.date.day} ${MONTHS[ev.date.month - 1]} ${ev.year}`;
};

/* ──────────────────────────────────────────────────────────────────────────
   Canvas export
   ────────────────────────────────────────────────────────────────────────── */

function roundRectPath(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function fitText(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > maxWidth) t = t.slice(0, -1);
  return `${t.trimEnd()}…`;
}

const DISPLAY_FONT = 'Fraunces, Georgia, "Times New Roman", serif';
const BODY_FONT = '"Space Grotesk", "Helvetica Neue", Arial, sans-serif';

async function renderCalendarPNG({ year, month, cells, byDay, today, activeCats, query, eventCount }) {
  if (document.fonts) {
    try {
      await Promise.all([
        document.fonts.load(`900 64px ${DISPLAY_FONT}`),
        document.fonts.load(`600 16px ${BODY_FONT}`),
        document.fonts.load(`700 16px ${BODY_FONT}`),
      ]);
    } catch (_) {
      /* fall back to system fonts */
    }
  }

  const W = 1600;
  const M = 56;
  const GAP = 12;
  const rows = cells.length / 7;
  const cellW = (W - 2 * M - 6 * GAP) / 7;
  const cellH = 212;
  const headerH = 210;
  const weekTop = headerH + 36;
  const gridTop = weekTop + 50;
  const gridH = rows * cellH + (rows - 1) * GAP;
  const H = gridTop + gridH + 140;
  const scale = 2;

  const canvas = document.createElement("canvas");
  canvas.width = W * scale;
  canvas.height = H * scale;
  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);
  ctx.textBaseline = "alphabetic";

  // Paper
  ctx.fillStyle = PALETTE.cream;
  ctx.fillRect(0, 0, W, H);

  // Header band
  ctx.fillStyle = PALETTE.ink;
  roundRectPath(ctx, 24, 24, W - 48, headerH - 24, 28);
  ctx.fill();

  CATEGORY_ORDER.forEach((c, i) => {
    ctx.fillStyle = CATEGORIES[c].bg;
    roundRectPath(ctx, M + i * 30, 62, 22, 22, 6);
    ctx.fill();
  });
  ctx.fillStyle = PALETTE.cream;
  ctx.font = `700 16px ${BODY_FONT}`;
  ctx.fillText("A YEAR OF WORLD CULTURE", M + 5 * 30 + 12, 79);

  const title = `Cultural Calendar - ${MONTHS[month]} ${year}`;
  ctx.font = `900 66px ${DISPLAY_FONT}`;
  [[6, CATEGORIES.americas.bg], [3, CATEGORIES.asia.bg]].forEach(([o, c]) => {
    ctx.fillStyle = c;
    ctx.fillText(title, M + o, 160 + o);
  });
  ctx.fillStyle = PALETTE.cream;
  ctx.fillText(title, M, 160);

  ctx.textAlign = "right";
  ctx.fillStyle = PALETTE.yellow;
  ctx.font = `700 20px ${BODY_FONT}`;
  ctx.fillText(`${eventCount} event${eventCount === 1 ? "" : "s"}`, W - M, 158);
  ctx.textAlign = "left";

  // Weekday header
  WEEKDAYS.forEach((d, i) => {
    const x = M + i * (cellW + GAP);
    ctx.fillStyle = PALETTE.ink;
    roundRectPath(ctx, x, weekTop, cellW, 36, 18);
    ctx.fill();
    ctx.fillStyle = PALETTE.cream;
    ctx.font = `700 15px ${BODY_FONT}`;
    ctx.textAlign = "center";
    ctx.fillText(d.toUpperCase(), x + cellW / 2, weekTop + 24);
  });
  ctx.textAlign = "left";

  // Cells
  cells.forEach((cell, i) => {
    const x = M + (i % 7) * (cellW + GAP);
    const y = gridTop + Math.floor(i / 7) * (cellH + GAP);
    const evs = cell.inMonth ? byDay.get(cell.day) || [] : [];
    const isToday =
      cell.inMonth &&
      cell.day === today.getDate() &&
      cell.month === today.getMonth() &&
      cell.year === today.getFullYear();

    ctx.save();
    if (cell.inMonth) {
      ctx.shadowColor = "rgba(27,26,23,0.10)";
      ctx.shadowBlur = 14;
      ctx.shadowOffsetY = 4;
    }
    ctx.fillStyle = !cell.inMonth
      ? "rgba(27,26,23,0.04)"
      : evs.length
      ? CATEGORIES[evs[0].category].soft
      : PALETTE.paper;
    roundRectPath(ctx, x, y, cellW, cellH, 18);
    ctx.fill();
    ctx.restore();

    if (isToday) {
      ctx.strokeStyle = PALETTE.ink;
      ctx.lineWidth = 3;
      roundRectPath(ctx, x + 1.5, y + 1.5, cellW - 3, cellH - 3, 17);
      ctx.stroke();
      ctx.fillStyle = PALETTE.ink;
      roundRectPath(ctx, x + cellW - 74, y + 16, 60, 24, 12);
      ctx.fill();
      ctx.fillStyle = PALETTE.cream;
      ctx.font = `700 11px ${BODY_FONT}`;
      ctx.textAlign = "center";
      ctx.fillText("TODAY", x + cellW - 44, y + 32);
      ctx.textAlign = "left";
    }

    ctx.fillStyle = cell.inMonth ? PALETTE.ink : "rgba(27,26,23,0.25)";
    ctx.font = `900 40px ${DISPLAY_FONT}`;
    ctx.fillText(String(cell.day), x + 16, y + 50);

    evs.slice(0, 3).forEach((ev, j) => {
      const c = CATEGORIES[ev.category];
      const by = y + 66 + j * 38;
      ctx.fillStyle = c.bg;
      roundRectPath(ctx, x + 10, by, cellW - 20, 32, 9);
      ctx.fill();
      ctx.fillStyle = c.fg;
      ctx.font = `600 15px ${BODY_FONT}`;
      ctx.fillText(fitText(ctx, `${ev.flag} ${ev.title}`, cellW - 40), x + 20, by + 21);
    });

    if (evs.length > 3) {
      ctx.fillStyle = PALETTE.ink;
      ctx.font = `700 14px ${BODY_FONT}`;
      ctx.fillText(`+${evs.length - 3} more`, x + 14, y + 66 + 3 * 38 + 14);
    }
  });

  // Legend
  const ly = gridTop + gridH + 50;
  let lx = M;
  ctx.font = `600 16px ${BODY_FONT}`;
  CATEGORY_ORDER.forEach((c) => {
    ctx.globalAlpha = activeCats.has(c) ? 1 : 0.3;
    ctx.fillStyle = CATEGORIES[c].bg;
    roundRectPath(ctx, lx, ly - 14, 18, 18, 5);
    ctx.fill();
    ctx.fillStyle = PALETTE.ink;
    ctx.fillText(CATEGORIES[c].label, lx + 26, ly);
    lx += 26 + ctx.measureText(CATEGORIES[c].label).width + 32;
  });
  ctx.globalAlpha = 1;

  ctx.fillStyle = "rgba(27,26,23,0.6)";
  ctx.font = `500 14px ${BODY_FONT}`;
  const note = `${query ? `Filtered by "${query}" · ` : ""}Lunar and lunisolar festival dates are approximate and may vary by region.`;
  ctx.fillText(note, M, ly + 40);

  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

/* ──────────────────────────────────────────────────────────────────────────
   UI pieces
   ────────────────────────────────────────────────────────────────────────── */

function useFonts() {
  useEffect(() => {
    if (document.getElementById("cc-fonts")) return;
    const link = document.createElement("link");
    link.id = "cc-fonts";
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,800;9..144,900&family=Space+Grotesk:wght@400;500;600;700&display=swap";
    document.head.appendChild(link);
  }, []);
}

function Modal({ onClose, labelledBy, children }) {
  const panelRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-6 cc-fade"
      style={{ background: "rgba(27,26,23,0.55)", backdropFilter: "blur(6px)" }}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className="w-full max-w-md rounded-[28px] overflow-hidden outline-none cc-pop"
        style={{ background: PALETTE.paper, boxShadow: "0 30px 80px -20px rgba(27,26,23,0.55)" }}
      >
        {children}
      </div>
    </div>
  );
}

function EventModal({ event, onClose }) {
  const cat = CATEGORIES[event.category];
  return (
    <Modal onClose={onClose} labelledBy="cc-event-title">
      <div className="relative px-6 pt-6 pb-7" style={{ background: cat.bg, color: cat.fg }}>
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 h-9 w-9 rounded-full flex items-center justify-center transition hover:scale-105"
          style={{ background: "rgba(255,255,255,0.22)", color: cat.fg }}
        >
          <X size={18} />
        </button>
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em]"
          style={{ background: PALETTE.paper, color: PALETTE.ink }}
        >
          <span className="h-2 w-2 rounded-full" style={{ background: cat.bg }} />
          {cat.label}
        </span>
        <div className="mt-5 flex items-end gap-4">
          <div className="cc-display text-7xl leading-[0.8]">{event.date.day}</div>
          <div className="pb-1 text-sm font-semibold uppercase tracking-[0.14em] opacity-90">
            {MONTHS[event.date.month - 1]}
            <br />
            {event.year}
          </div>
          <div className="ml-auto text-5xl leading-none drop-shadow-sm" aria-hidden>
            {event.flag}
          </div>
        </div>
      </div>

      <div className="px-6 pt-6 pb-6">
        <h2 id="cc-event-title" className="cc-display text-3xl leading-tight" style={{ color: PALETTE.ink }}>
          {event.title}
        </h2>
        <div className="mt-4 space-y-2 text-sm" style={{ color: "rgba(27,26,23,0.75)" }}>
          <div className="flex items-center gap-2">
            <MapPin size={16} className="shrink-0" />
            <span>
              <span className="mr-1" aria-hidden>
                {event.flag}
              </span>
              {event.region}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <CalendarDays size={16} className="shrink-0" />
            <span>{formatDate(event)}</span>
          </div>
        </div>
        <p className="mt-5 text-[15px] leading-relaxed" style={{ color: PALETTE.ink }}>
          {event.shortDescription}
        </p>
        {event.movable && (
          <p
            className="mt-4 rounded-2xl px-4 py-3 text-xs leading-relaxed"
            style={{ background: cat.soft, color: PALETTE.ink }}
          >
            This date moves each year. Festivals that follow a lunar or lunisolar calendar can also differ by a day between
            countries.
          </p>
        )}
        <a
          href={event.learnMoreUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 text-base font-bold transition hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus-visible:ring-4"
          style={{ background: PALETTE.ink, color: PALETTE.cream }}
        >
          Explore Full Story <ExternalLink size={18} />
        </a>
      </div>
    </Modal>
  );
}

function DayModal({ day, month, year, events, onPick, onClose }) {
  const d = new Date(year, month, day);
  return (
    <Modal onClose={onClose} labelledBy="cc-day-title">
      <div className="relative px-6 pt-6 pb-5" style={{ background: PALETTE.ink, color: PALETTE.cream }}>
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 h-9 w-9 rounded-full flex items-center justify-center transition hover:scale-105"
          style={{ background: "rgba(246,241,228,0.15)" }}
        >
          <X size={18} />
        </button>
        <div className="text-xs font-bold uppercase tracking-[0.14em] opacity-70">{WEEKDAYS_LONG[(d.getDay() + 6) % 7]}</div>
        <h2 id="cc-day-title" className="cc-display text-4xl mt-1">
          {day} {MONTHS[month]}
        </h2>
        <div className="mt-1 text-sm opacity-70">
          {events.length} event{events.length === 1 ? "" : "s"}
        </div>
      </div>
      <ul className="max-h-[60vh] overflow-y-auto p-3 space-y-2">
        {events.map((ev) => {
          const c = CATEGORIES[ev.category];
          return (
            <li key={ev.key}>
              <button
                onClick={() => onPick(ev)}
                className="group w-full flex items-center gap-3 rounded-2xl p-3 text-left transition hover:-translate-y-0.5"
                style={{ background: c.soft }}
              >
                <span
                  className="h-11 w-11 shrink-0 rounded-xl flex items-center justify-center text-xl"
                  style={{ background: c.bg }}
                  aria-hidden
                >
                  {ev.flag}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold truncate" style={{ color: PALETTE.ink }}>
                    {ev.title}
                  </span>
                  <span className="block text-xs truncate" style={{ color: "rgba(27,26,23,0.65)" }}>
                    {ev.region} · {c.label}
                  </span>
                </span>
                <ChevronRight size={18} className="shrink-0 opacity-50 transition group-hover:translate-x-0.5" />
              </button>
            </li>
          );
        })}
      </ul>
    </Modal>
  );
}

function EventBadge({ event, onClick }) {
  const c = CATEGORIES[event.category];
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick(event);
      }}
      title={`${event.title} — ${event.region}`}
      className="w-full flex items-center gap-1 rounded-lg px-1.5 md:px-2 py-1 text-left text-[11px] md:text-xs font-semibold leading-tight transition hover:-translate-y-px hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
      style={{ background: c.bg, color: c.fg, "--tw-ring-color": PALETTE.ink }}
    >
      <span className="shrink-0" aria-hidden>
        {event.flag}
      </span>
      <span className="truncate">{event.title}</span>
    </button>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Main component
   ────────────────────────────────────────────────────────────────────────── */

export default function CulturalCalendar() {
  useFonts();

  const today = useMemo(() => new Date(), []);
  const [view, setView] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [activeCats, setActiveCats] = useState(() => new Set(CATEGORY_ORDER));
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [dayList, setDayList] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const searchRef = useRef(null);

  const years = useMemo(() => {
    const base = today.getFullYear();
    return Array.from({ length: 21 }, (_, i) => base - 10 + i);
  }, [today]);

  const yearEvents = useMemo(() => eventsForYear(view.year), [view.year]);
  const q = query.trim().toLowerCase();

  const matchesSearch = useCallback(
    (ev) =>
      !q ||
      [ev.title, ev.region, ev.shortDescription, CATEGORIES[ev.category].label].some((s) =>
        s.toLowerCase().includes(q)
      ),
    [q]
  );
  const matches = useCallback((ev) => activeCats.has(ev.category) && matchesSearch(ev), [activeCats, matchesSearch]);

  const monthEvents = useMemo(
    () => yearEvents.filter((e) => e.date.month === view.month + 1),
    [yearEvents, view.month]
  );
  const visibleEvents = useMemo(() => monthEvents.filter(matches), [monthEvents, matches]);

  const byDay = useMemo(() => {
    const map = new Map();
    visibleEvents.forEach((e) => {
      if (!map.has(e.date.day)) map.set(e.date.day, []);
      map.get(e.date.day).push(e);
    });
    return map;
  }, [visibleEvents]);

  const categoryCounts = useMemo(() => {
    const counts = Object.fromEntries(CATEGORY_ORDER.map((c) => [c, 0]));
    monthEvents.filter(matchesSearch).forEach((e) => (counts[e.category] += 1));
    return counts;
  }, [monthEvents, matchesSearch]);

  const searchResults = useMemo(() => (q ? yearEvents.filter(matches) : []), [q, yearEvents, matches]);
  const cells = useMemo(() => buildGrid(view.year, view.month), [view]);

  const shiftMonth = useCallback((delta) => {
    setView(({ year, month }) => {
      const d = new Date(year, month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }, []);
  const goToday = () => setView({ year: today.getFullYear(), month: today.getMonth() });

  // Arrow keys switch months when nothing else has focus
  useEffect(() => {
    const onKey = (e) => {
      if (selected || dayList) return;
      const tag = document.activeElement?.tagName;
      if (["INPUT", "SELECT", "TEXTAREA"].includes(tag)) return;
      if (e.key === "ArrowLeft") shiftMonth(-1);
      if (e.key === "ArrowRight") shiftMonth(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, dayList, shiftMonth]);

  const toggleCategory = (cat) => {
    setActiveCats((prev) => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  };
  const allActive = activeCats.size === CATEGORY_ORDER.length;
  const resetFilters = () => {
    setActiveCats(new Set(CATEGORY_ORDER));
    setQuery("");
  };

  const jumpToEvent = (ev) => {
    setView({ year: ev.year, month: ev.date.month - 1 });
    setSearchOpen(false);
    setSelected(ev);
  };

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const blob = await renderCalendarPNG({
        year: view.year,
        month: view.month,
        cells,
        byDay,
        today,
        activeCats,
        query: query.trim(),
        eventCount: visibleEvents.length,
      });
      if (!blob) throw new Error("Could not render image");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cultural-calendar-${view.year}-${String(view.month + 1).padStart(2, "0")}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
    } catch (err) {
      console.error(err);
      alert("Sorry — the image could not be generated in this browser.");
    } finally {
      setDownloading(false);
    }
  };

  const lunarOutOfRange = view.year < LUNAR_RANGE[0] || view.year > LUNAR_RANGE[1];
  const isTodayCell = (cell) =>
    cell.inMonth &&
    cell.day === today.getDate() &&
    cell.month === today.getMonth() &&
    cell.year === today.getFullYear();
  const isCurrentMonth = view.year === today.getFullYear() && view.month === today.getMonth();

  return (
    <div
      className="cc-body min-h-screen w-full"
      style={{
        background: PALETTE.cream,
        backgroundImage: "radial-gradient(rgba(27,26,23,0.06) 1px, transparent 1px)",
        backgroundSize: "18px 18px",
        color: PALETTE.ink,
      }}
    >
      <style>{`
        .cc-display { font-family: ${DISPLAY_FONT}; font-weight: 900; font-variation-settings: "opsz" 144; letter-spacing: -0.02em; }
        .cc-body { font-family: ${BODY_FONT}; }
        .cc-select { appearance: none; -webkit-appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23F6F1E4' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; padding-right: 32px; }
        .cc-select option { color: ${PALETTE.ink}; }
        @keyframes ccFade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes ccPop { from { opacity: 0; transform: translateY(16px) scale(.97) } to { opacity: 1; transform: none } }
        .cc-fade { animation: ccFade .18s ease-out; }
        .cc-pop { animation: ccPop .24s cubic-bezier(.2,.9,.3,1.2); }
        @media (prefers-reduced-motion: reduce) { .cc-fade, .cc-pop { animation: none; } }
      `}</style>

      <div className="mx-auto max-w-7xl px-4 py-5 md:px-6 md:py-8">
        {/* ── Hero / toolbar ───────────────────────────────────── */}
        <header
          className="relative overflow-hidden rounded-[28px] px-5 py-6 md:px-8 md:py-8"
          style={{ background: PALETTE.ink, color: PALETTE.cream, boxShadow: "0 20px 50px -24px rgba(27,26,23,0.7)" }}
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="flex gap-1" aria-hidden>
                  {CATEGORY_ORDER.map((c) => (
                    <span key={c} className="h-3.5 w-3.5 rounded-[4px]" style={{ background: CATEGORIES[c].bg }} />
                  ))}
                </div>
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] opacity-80">Cultural Calendar</span>
              </div>
              <h1 className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <span
                  className="cc-display text-6xl md:text-8xl leading-[0.9]"
                  style={{ textShadow: `4px 4px 0 ${CATEGORIES.asia.bg}, 8px 8px 0 ${CATEGORIES.americas.bg}` }}
                >
                  {MONTHS[view.month]}
                </span>
                <span className="cc-display text-4xl md:text-6xl leading-none" style={{ color: PALETTE.yellow }}>
                  {view.year}
                </span>
              </h1>
              <p className="mt-4 text-sm opacity-75">
                {visibleEvents.length} festival{visibleEvents.length === 1 ? "" : "s"} &amp; holiday
                {visibleEvents.length === 1 ? "" : "s"} from around the world this month
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 rounded-full p-1" style={{ background: "rgba(246,241,228,0.1)" }}>
                <button
                  onClick={() => shiftMonth(-1)}
                  aria-label="Previous month"
                  className="h-10 w-10 rounded-full flex items-center justify-center transition hover:bg-white/15"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={goToday}
                  disabled={isCurrentMonth}
                  className="h-10 rounded-full px-4 text-sm font-bold transition hover:bg-white/15 disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  Today
                </button>
                <button
                  onClick={() => shiftMonth(1)}
                  aria-label="Next month"
                  className="h-10 w-10 rounded-full flex items-center justify-center transition hover:bg-white/15"
                >
                  <ChevronRight size={20} />
                </button>
              </div>

              <label className="sr-only" htmlFor="cc-month">
                Month
              </label>
              <select
                id="cc-month"
                value={view.month}
                onChange={(e) => setView((v) => ({ ...v, month: Number(e.target.value) }))}
                className="cc-select h-12 rounded-full pl-4 text-sm font-bold outline-none focus-visible:ring-2"
                style={{ background: "rgba(246,241,228,0.1)", color: PALETTE.cream, "--tw-ring-color": PALETTE.yellow }}
              >
                {MONTHS.map((m, i) => (
                  <option key={m} value={i}>
                    {m}
                  </option>
                ))}
              </select>

              <label className="sr-only" htmlFor="cc-year">
                Year
              </label>
              <select
                id="cc-year"
                value={view.year}
                onChange={(e) => setView((v) => ({ ...v, year: Number(e.target.value) }))}
                className="cc-select h-12 rounded-full pl-4 text-sm font-bold outline-none focus-visible:ring-2"
                style={{ background: "rgba(246,241,228,0.1)", color: PALETTE.cream, "--tw-ring-color": PALETTE.yellow }}
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>

              <button
                onClick={handleDownload}
                disabled={downloading}
                className="h-12 rounded-full px-5 flex items-center gap-2 text-sm font-bold transition hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-70"
                style={{ background: PALETTE.yellow, color: PALETTE.ink }}
              >
                {downloading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                {downloading ? "Rendering…" : "Download as Image"}
              </button>
            </div>
          </div>
        </header>

        {/* ── Search & filters ─────────────────────────────────── */}
        <section
          className="relative z-20 mt-4 rounded-[24px] p-3 md:p-4 flex flex-col gap-3 md:flex-row md:items-center"
          style={{ background: PALETTE.paper, boxShadow: "0 10px 30px -18px rgba(27,26,23,0.35)" }}
        >
          <div className="relative md:w-80 shrink-0" ref={searchRef}>
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-50 pointer-events-none" />
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              onBlur={() => setTimeout(() => setSearchOpen(false), 120)}
              onKeyDown={(e) => {
                if (e.key === "Escape") setSearchOpen(false);
                if (e.key === "Enter" && searchResults[0]) jumpToEvent(searchResults[0]);
              }}
              placeholder="Search festivals or countries…"
              aria-label="Search festivals or countries"
              className="h-12 w-full rounded-full pl-11 pr-10 text-sm font-medium outline-none transition focus:ring-2"
              style={{ background: PALETTE.cream, "--tw-ring-color": PALETTE.ink }}
            />
            {query && (
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full flex items-center justify-center hover:bg-black/5"
              >
                <X size={15} />
              </button>
            )}

            {searchOpen && q && (
              <div
                className="absolute left-0 right-0 top-[calc(100%+8px)] rounded-2xl p-2 cc-fade md:w-[26rem]"
                style={{ background: PALETTE.paper, boxShadow: "0 24px 60px -20px rgba(27,26,23,0.5)" }}
              >
                <div className="px-3 pt-1 pb-2 text-[11px] font-bold uppercase tracking-[0.14em] opacity-60">
                  {searchResults.length ? `${searchResults.length} match${searchResults.length === 1 ? "" : "es"} in ${view.year}` : `No matches in ${view.year}`}
                </div>
                <ul className="max-h-80 overflow-y-auto">
                  {searchResults.slice(0, 10).map((ev) => {
                    const c = CATEGORIES[ev.category];
                    return (
                      <li key={ev.key}>
                        <button
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => jumpToEvent(ev)}
                          className="w-full flex items-center gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-black/5"
                        >
                          <span
                            className="w-12 shrink-0 rounded-lg py-1 text-center leading-none"
                            style={{ background: c.bg, color: c.fg }}
                          >
                            <span className="cc-display block text-lg">{ev.date.day}</span>
                            <span className="block text-[9px] font-bold uppercase tracking-wider">
                              {MONTHS[ev.date.month - 1].slice(0, 3)}
                            </span>
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-bold">
                              <span aria-hidden className="mr-1">
                                {ev.flag}
                              </span>
                              {ev.title}
                            </span>
                            <span className="block truncate text-xs opacity-60">{ev.region}</span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by region">
            <button
              onClick={() => setActiveCats(new Set(CATEGORY_ORDER))}
              aria-pressed={allActive}
              className="h-10 rounded-full px-4 text-sm font-bold transition"
              style={
                allActive
                  ? { background: PALETTE.ink, color: PALETTE.cream }
                  : { background: PALETTE.cream, color: PALETTE.ink }
              }
            >
              All
            </button>
            {CATEGORY_ORDER.map((cat) => {
              const c = CATEGORIES[cat];
              const on = activeCats.has(cat);
              return (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  aria-pressed={on}
                  className="h-10 rounded-full pl-2 pr-3.5 flex items-center gap-2 text-sm font-bold transition hover:-translate-y-px"
                  style={
                    on
                      ? { background: c.bg, color: c.fg, boxShadow: `0 6px 16px -8px ${c.bg}` }
                      : { background: PALETTE.cream, color: "rgba(27,26,23,0.55)" }
                  }
                >
                  <span
                    className="h-6 min-w-6 px-1.5 rounded-full flex items-center justify-center text-[11px]"
                    style={
                      on
                        ? { background: "rgba(255,255,255,0.28)" }
                        : { background: c.bg, color: c.fg, opacity: 0.6 }
                    }
                  >
                    {categoryCounts[cat]}
                  </span>
                  {c.label}
                </button>
              );
            })}
          </div>
        </section>

        {(lunarOutOfRange || visibleEvents.length === 0) && (
          <div
            className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl px-4 py-3 text-sm"
            style={{ background: PALETTE.paper, boxShadow: "0 8px 24px -18px rgba(27,26,23,0.4)" }}
          >
            <Sparkles size={16} className="shrink-0" />
            {visibleEvents.length === 0 ? (
              <>
                <span>No events match your filters this month.</span>
                <button onClick={resetFilters} className="font-bold underline underline-offset-4">
                  Reset filters
                </button>
              </>
            ) : (
              <span>
                Lunar and lunisolar festivals (Diwali, Eid, Lunar New Year and others) are tabulated for {LUNAR_RANGE[0]}–
                {LUNAR_RANGE[1]}; fixed-date and rule-based holidays show for every year.
              </span>
            )}
          </div>
        )}

        {/* ── Calendar grid ────────────────────────────────────── */}
        <main className="mt-5">
          <div className="grid grid-cols-7 gap-1.5 md:gap-3">
            {WEEKDAYS.map((d, i) => (
              <div
                key={d}
                className="rounded-full py-2 text-center text-[10px] md:text-xs font-bold uppercase tracking-[0.14em]"
                style={{ background: PALETTE.ink, color: PALETTE.cream }}
              >
                <span className="md:hidden">{d.slice(0, 1)}</span>
                <span className="hidden md:inline">{WEEKDAYS[i]}</span>
              </div>
            ))}

            {cells.map((cell) => {
              const evs = cell.inMonth ? byDay.get(cell.day) || [] : [];
              const isToday = isTodayCell(cell);
              const tint = evs.length ? CATEGORIES[evs[0].category].soft : PALETTE.paper;
              const hasMore = evs.length > 3;

              if (!cell.inMonth) {
                return (
                  <div
                    key={`${cell.year}-${cell.month}-${cell.day}`}
                    className="min-h-[96px] md:min-h-[136px] lg:min-h-[156px] rounded-xl md:rounded-2xl p-2 md:p-3"
                    style={{ background: "rgba(27,26,23,0.04)" }}
                    aria-hidden
                  >
                    <span className="cc-display text-xl md:text-3xl" style={{ color: "rgba(27,26,23,0.22)" }}>
                      {cell.day}
                    </span>
                  </div>
                );
              }

              return (
                <div
                  key={`${cell.year}-${cell.month}-${cell.day}`}
                  onClick={() => evs.length && setDayList({ day: cell.day, events: evs })}
                  className={`group relative min-h-[96px] md:min-h-[136px] lg:min-h-[156px] rounded-xl md:rounded-2xl p-1.5 md:p-2.5 flex flex-col transition ${
                    evs.length ? "cursor-pointer hover:-translate-y-0.5" : ""
                  }`}
                  style={{
                    background: tint,
                    boxShadow: isToday
                      ? `0 0 0 3px ${PALETTE.ink}, 0 14px 30px -16px rgba(27,26,23,0.5)`
                      : "0 8px 22px -16px rgba(27,26,23,0.35)",
                  }}
                  aria-label={`${cell.day} ${MONTHS[cell.month]}, ${evs.length} event${evs.length === 1 ? "" : "s"}`}
                >
                  <div className="flex items-start justify-between gap-1 px-0.5">
                    <span className="cc-display text-xl md:text-3xl lg:text-4xl leading-none">{cell.day}</span>
                    {isToday && (
                      <span
                        className="rounded-full px-1.5 md:px-2 py-0.5 text-[9px] md:text-[10px] font-bold uppercase tracking-wider"
                        style={{ background: PALETTE.ink, color: PALETTE.cream }}
                      >
                        Today
                      </span>
                    )}
                  </div>

                  <div className="mt-1.5 md:mt-2.5 flex flex-col gap-1">
                    {evs.slice(0, 3).map((ev) => (
                      <EventBadge key={ev.key} event={ev} onClick={setSelected} />
                    ))}
                    {hasMore && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDayList({ day: cell.day, events: evs });
                        }}
                        className="self-start rounded-md px-1.5 py-0.5 text-[11px] md:text-xs font-bold transition hover:bg-black/10"
                      >
                        +{evs.length - 3} more
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </main>

        {/* ── Legend / footnote ────────────────────────────────── */}
        <footer className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between text-xs" style={{ color: "rgba(27,26,23,0.65)" }}>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {CATEGORY_ORDER.map((c) => (
              <span key={c} className="flex items-center gap-1.5" style={{ opacity: activeCats.has(c) ? 1 : 0.35 }}>
                <span className="h-3 w-3 rounded-[4px]" style={{ background: CATEGORIES[c].bg }} />
                {CATEGORIES[c].label}
              </span>
            ))}
          </div>
          <p>
            Tip: use ← → to change month. Lunar festival dates are approximate and can differ by a day between regions.
          </p>
        </footer>
      </div>

      {dayList && !selected && (
        <DayModal
          day={dayList.day}
          month={view.month}
          year={view.year}
          events={dayList.events}
          onPick={(ev) => setSelected(ev)}
          onClose={() => setDayList(null)}
        />
      )}
      {selected && (
        <EventModal
          event={selected}
          onClose={() => {
            setSelected(null);
          }}
        />
      )}
    </div>
  );
}
