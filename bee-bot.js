/* ============================================================
   Bee Weekly Planner — Telegram bot
   Same brain as the web app: batch-cook anchors, Kerala + world,
   lactose-free / gluten-light / less-masala, high-protein, no
   repeat next week. Auto-sends the week every Sunday morning.

   Setup:
     1) Get a token from @BotFather on Telegram  (see README-telegram.md)
     2) export BEE_BOT_TOKEN="123456:ABC-..."
     3) npm install && npm start
   ============================================================ */

const TelegramBot = require('node-telegram-bot-api');
const cron = require('node-cron');
const fs = require('fs');
const path = require('path');

const TOKEN = process.env.BEE_BOT_TOKEN;
if (!TOKEN) {
  console.error('\n❌ Missing BEE_BOT_TOKEN.\n   Run:  export BEE_BOT_TOKEN="your-token-from-BotFather"\n');
  process.exit(1);
}
const TZ = process.env.BEE_TZ || 'Europe/Berlin';
const SEND_CRON = process.env.BEE_CRON || '0 8 * * 0'; // Sunday 08:00
const STATE_FILE = path.join(__dirname, 'bee-state.json');

/* ------------------------------------------------------------
   DISH DATABASE  (identical to the web app)
   ing tuple: [name, qtyPerDayFor2, unit, store]  store g|i|p
   ------------------------------------------------------------ */
const CUIS = {
  kerala:['🥥','Kerala'], indian:['🌶️','Indian'], thai:['🌿','Thai'],
  jpn:['🍱','Japanese'], med:['🫒','Mediterranean'], greek:['🇬🇷','Greek'],
  levant:['🧆','Levantine'], mex:['🌮','Mexican'], viet:['🍜','Vietnamese'],
  korean:['🌶','Korean'], euro:['🍳','European']
};
const D = [
// BREAKFAST
{id:'b1',name:'Chia protein pudding',sub:'soy milk, berries, seeds',cuis:'euro',meal:'bf',prot:'plant',pg:16,spice:0,mins:5,cook:'Make-ahead',batch:true,gf:true,gut:true,light:true,
 ing:[['Soy milk',400,'ml','g'],['Chia seeds',40,'g','g'],['Mixed berries',150,'g','g'],['Mixed seeds',30,'g','g']]},
{id:'b2',name:'Soy yogurt & seed bowl',sub:'banana, nuts, honey',cuis:'euro',meal:'bf',prot:'plant',pg:15,spice:0,mins:4,cook:'No-cook',batch:false,gf:true,gut:true,light:true,
 ing:[['Soy yogurt',300,'g','g'],['Mixed seeds & nuts',60,'g','g'],['Banana',2,'pc','g']]},
{id:'b3',name:'Overnight oats + protein',sub:'GF oats, soy milk, apple',cuis:'euro',meal:'bf',prot:'plant',pg:20,spice:0,mins:5,cook:'Make-ahead',batch:true,gf:true,gut:true,light:true,
 ing:[['Gluten-free oats',120,'g','g'],['Soy milk',300,'ml','g'],['Apple',1,'pc','g'],['Chia seeds',20,'g','g']]},
{id:'b4',name:'Veggie egg muffins',sub:'air-fryer, spinach & pepper',cuis:'euro',meal:'bf',prot:'egg',pg:18,spice:0,mins:15,cook:'Air-fry',batch:true,gf:true,gut:true,light:true,
 ing:[['Eggs',6,'pc','g'],['Spinach',80,'g','g'],['Bell pepper',1,'pc','g']]},
{id:'b5',name:'Tofu scramble + GF toast',sub:'turmeric, veg',cuis:'euro',meal:'bf',prot:'plant',pg:19,spice:1,mins:12,cook:'Pan',batch:false,gf:true,gut:true,light:true,
 ing:[['Firm tofu',250,'g','g'],['Tomato',1,'pc','g'],['Gluten-free bread',4,'sl','g']]},
{id:'b6',name:'Protein green smoothie',sub:'soy, spinach, banana, PB',cuis:'euro',meal:'bf',prot:'plant',pg:22,spice:0,mins:5,cook:'Blend',batch:false,gf:true,gut:false,light:true,
 ing:[['Soy milk',400,'ml','g'],['Spinach',60,'g','g'],['Banana',2,'pc','g'],['Peanut butter',40,'g','g']]},
{id:'b7',name:'Shakshuka',sub:'eggs in tomato, GF bread',cuis:'levant',meal:'bf',prot:'egg',pg:18,spice:1,mins:20,cook:'Pan',batch:true,gf:true,gut:false,light:true,
 ing:[['Eggs',5,'pc','g'],['Tomato',4,'pc','g'],['Bell pepper',1,'pc','g'],['Gluten-free bread',4,'sl','g']]},
{id:'b8',name:'Avocado & eggs on GF toast',sub:'quick & filling',cuis:'euro',meal:'bf',prot:'egg',pg:17,spice:0,mins:8,cook:'Pan',batch:false,gf:true,gut:true,light:true,
 ing:[['Eggs',4,'pc','g'],['Avocado',1,'pc','g'],['Gluten-free bread',4,'sl','g']]},
// LUNCH
{id:'l1',name:'Kerala fish curry + matta rice',sub:'kudampuli, cabbage thoran',cuis:'kerala',meal:'lunch',prot:'fish',pg:32,spice:2,mins:35,cook:'Simmer',batch:true,gf:true,gut:false,light:true,
 ing:[['Fish (fresh, mackerel/cod)',450,'g','g'],['Matta rice',200,'g','i'],['Cabbage',200,'g','g'],['Grated coconut (frozen)',60,'g','i'],['Shallots',80,'g','g']]},
{id:'l2',name:'Light chicken curry + matta rice',sub:'coconut milk, beans thoran',cuis:'kerala',meal:'lunch',prot:'chicken',pg:34,spice:1,mins:35,cook:'Simmer',batch:true,gf:true,gut:false,light:true,
 ing:[['Chicken thigh',500,'g','g'],['Matta rice',200,'g','i'],['Coconut milk',150,'ml','i'],['Green beans',200,'g','g']]},
{id:'l3',name:'Egg roast + matta rice',sub:'cabbage-carrot thoran',cuis:'kerala',meal:'lunch',prot:'egg',pg:20,spice:1,mins:25,cook:'Pan',batch:true,gf:true,gut:false,light:true,
 ing:[['Eggs',6,'pc','g'],['Matta rice',200,'g','i'],['Onion',2,'pc','g'],['Cabbage',150,'g','g'],['Carrot',2,'pc','g']]},
{id:'l4',name:'Rajma masala + rice',sub:'kidney beans, high-fiber',cuis:'indian',meal:'lunch',prot:'plant',pg:22,spice:1,mins:30,cook:'Simmer',batch:true,gf:true,gut:false,light:true,
 ing:[['Kidney beans (dried/canned)',300,'g','g'],['Matta rice',200,'g','i'],['Tomato',3,'pc','g'],['Onion',2,'pc','g']]},
{id:'l5',name:'Sambar + rice + poriyal',sub:'toor dal, mixed veg',cuis:'kerala',meal:'lunch',prot:'plant',pg:18,spice:1,mins:35,cook:'Simmer',batch:true,gf:true,gut:false,light:true,
 ing:[['Toor dal',180,'g','i'],['Matta rice',200,'g','i'],['Mixed veg (carrot,beans,pumpkin)',300,'g','g'],['Tamarind',20,'g','i']]},
{id:'l6',name:'Mediterranean chicken & chickpea traybake',sub:'peppers, lemon, olives',cuis:'med',meal:'lunch',prot:'chicken',pg:40,spice:0,mins:30,cook:'Oven',batch:true,gf:true,gut:true,light:true,
 ing:[['Chicken thigh',500,'g','g'],['Chickpeas (canned)',400,'g','g'],['Bell pepper',3,'pc','g'],['Lemon',1,'pc','g']]},
{id:'l7',name:'Thai red chicken curry + rice',sub:'coconut, veg, aromatic',cuis:'thai',meal:'lunch',prot:'chicken',pg:33,spice:2,mins:30,cook:'Simmer',batch:true,gf:true,gut:false,light:true,
 ing:[['Chicken breast',500,'g','g'],['Coconut milk',200,'ml','i'],['Jasmine/basmati rice',200,'g','g'],['Mixed veg (pepper,broccoli)',250,'g','g']]},
{id:'l8',name:'Chicken burrito bowl',sub:'rice, black beans, salsa',cuis:'mex',meal:'lunch',prot:'chicken',pg:36,spice:1,mins:25,cook:'Pan',batch:true,gf:true,gut:false,light:true,
 ing:[['Chicken breast',450,'g','g'],['Rice',200,'g','g'],['Black beans (canned)',400,'g','g'],['Tomato',2,'pc','g'],['Avocado',1,'pc','g']]},
{id:'l9',name:'Salmon poke rice bowl',sub:'edamame, cucumber, tamari',cuis:'jpn',meal:'lunch',prot:'fish',pg:34,spice:0,mins:20,cook:'Assemble',batch:false,gf:true,gut:true,light:true,
 ing:[['Salmon fillet',400,'g','g'],['Sushi/short rice',200,'g','g'],['Edamame',150,'g','g'],['Cucumber',1,'pc','g']]},
{id:'l10',name:'Chicken shawarma bowl',sub:'salad, tahini, rice',cuis:'levant',meal:'lunch',prot:'chicken',pg:38,spice:1,mins:30,cook:'Air-fry',batch:true,gf:true,gut:true,light:true,
 ing:[['Chicken thigh',500,'g','g'],['Rice',180,'g','g'],['Cucumber',1,'pc','g'],['Tomato',2,'pc','g'],['Tahini',40,'g','g']]},
{id:'l11',name:'Dal + rice + greens',sub:'moong dal, gut-gentle',cuis:'indian',meal:'lunch',prot:'plant',pg:20,spice:1,mins:25,cook:'Simmer',batch:true,gf:true,gut:true,light:true,
 ing:[['Moong dal',180,'g','i'],['Matta rice',200,'g','i'],['Spinach',200,'g','g']]},
{id:'l12',name:'Greek lemon chicken & potatoes',sub:'oregano, roasted, salad',cuis:'greek',meal:'lunch',prot:'chicken',pg:39,spice:0,mins:35,cook:'Oven',batch:true,gf:true,gut:true,light:true,
 ing:[['Chicken thigh',500,'g','g'],['Potato',4,'pc','g'],['Lemon',1,'pc','g'],['Salad greens',150,'g','g']]},
// DINNER
{id:'d1',name:'Greek chicken souvlaki',sub:'grill, big salad, tzatziki (LF)',cuis:'greek',meal:'dinner',prot:'chicken',pg:42,spice:0,mins:20,cook:'Grill',batch:true,gf:true,lf:true,gut:true,light:true,
 ing:[['Chicken breast',500,'g','g'],['Lactose-free yogurt',150,'g','g'],['Cucumber',1,'pc','g'],['Salad greens',150,'g','g'],['Cherry tomato',150,'g','g']]},
{id:'d2',name:'Thai basil chicken',sub:'stir-fry, greens, chilli',cuis:'thai',meal:'dinner',prot:'chicken',pg:38,spice:2,mins:18,cook:'Pan',batch:true,gf:true,gut:false,light:true,
 ing:[['Chicken mince',450,'g','g'],['Green beans',200,'g','g'],['Basil',1,'bunch','g'],['Bell pepper',2,'pc','g']]},
{id:'d3',name:'Air-fryer fajita chicken bowl',sub:'peppers, onion, lime',cuis:'mex',meal:'dinner',prot:'chicken',pg:36,spice:1,mins:20,cook:'Air-fry',batch:true,gf:true,gut:false,light:true,
 ing:[['Chicken breast',500,'g','g'],['Bell pepper',3,'pc','g'],['Onion',1,'pc','g'],['Lime',1,'pc','g']]},
{id:'d4',name:'Harissa air-fryer chicken',sub:'roasted veg, gut-gentle',cuis:'levant',meal:'dinner',prot:'chicken',pg:40,spice:2,mins:22,cook:'Air-fry',batch:true,gf:true,gut:false,light:true,
 ing:[['Chicken thigh',500,'g','g'],['Zucchini',2,'pc','g'],['Bell pepper',2,'pc','g']]},
{id:'d5',name:'Teriyaki salmon (grill)',sub:'GF tamari, broccoli',cuis:'jpn',meal:'dinner',prot:'fish',pg:35,spice:0,mins:18,cook:'Grill',batch:false,gf:true,gut:true,light:true,
 ing:[['Salmon fillet',400,'g','g'],['Broccoli',300,'g','g'],['Tamari (GF)',30,'ml','g']]},
{id:'d6',name:'Korean gochujang chicken',sub:'air-fryer, slaw',cuis:'korean',meal:'dinner',prot:'chicken',pg:38,spice:2,mins:22,cook:'Air-fry',batch:true,gf:true,gut:false,light:true,
 ing:[['Chicken thigh',500,'g','g'],['White cabbage',250,'g','g'],['Carrot',2,'pc','g']]},
{id:'d7',name:'Grilled fish tacos',sub:'corn tortilla, slaw, lime',cuis:'mex',meal:'dinner',prot:'fish',pg:30,spice:1,mins:20,cook:'Grill',batch:false,gf:true,gut:true,light:true,
 ing:[['White fish fillet',400,'g','g'],['Corn tortillas',8,'pc','g'],['White cabbage',200,'g','g'],['Lime',1,'pc','g']]},
{id:'d8',name:'Air-fryer tandoori chicken',sub:'LF marinade, salad',cuis:'indian',meal:'dinner',prot:'chicken',pg:40,spice:2,mins:22,cook:'Air-fry',batch:true,gf:true,lf:true,gut:false,light:true,
 ing:[['Chicken thigh',500,'g','g'],['Lactose-free yogurt',120,'g','g'],['Salad greens',150,'g','g'],['Cucumber',1,'pc','g']]},
{id:'d9',name:'Grilled prawns & Med salad',sub:'garlic, lemon, olives',cuis:'med',meal:'dinner',prot:'prawns',pg:30,spice:1,mins:15,cook:'Grill',batch:false,gf:true,gut:true,light:true,
 ing:[['Prawns',350,'g','g'],['Salad greens',150,'g','g'],['Cherry tomato',150,'g','g'],['Lemon',1,'pc','g']]},
{id:'d10',name:'Vietnamese lemongrass chicken',sub:'grill, herb salad, rice noodle',cuis:'viet',meal:'dinner',prot:'chicken',pg:38,spice:1,mins:22,cook:'Grill',batch:true,gf:true,gut:true,light:true,
 ing:[['Chicken thigh',500,'g','g'],['Rice noodles',150,'g','g'],['Herbs & lettuce',1,'bunch','g'],['Carrot',2,'pc','g']]},
{id:'d11',name:'Pesto grilled chicken',sub:'zucchini ribbons, tomato',cuis:'med',meal:'dinner',prot:'chicken',pg:41,spice:0,mins:20,cook:'Grill',batch:true,gf:true,gut:true,light:true,
 ing:[['Chicken breast',500,'g','g'],['Zucchini',2,'pc','g'],['Cherry tomato',150,'g','g'],['Basil pesto',60,'g','g']]},
{id:'d12',name:'Air-fryer tofu & veg bowl',sub:'GF tamari, sesame, rice',cuis:'jpn',meal:'dinner',prot:'plant',pg:24,spice:1,mins:20,cook:'Air-fry',batch:true,gf:true,gut:true,light:true,
 ing:[['Firm tofu',400,'g','g'],['Broccoli',250,'g','g'],['Bell pepper',2,'pc','g'],['Rice',150,'g','g']]},
{id:'d13',name:'Veg & feta-style frittata',sub:'easy night, side salad',cuis:'euro',meal:'dinner',prot:'egg',pg:24,spice:0,mins:20,cook:'Bake',batch:true,gf:true,gut:true,light:true,
 ing:[['Eggs',7,'pc','g'],['Zucchini',1,'pc','g'],['Cherry tomato',150,'g','g'],['Salad greens',100,'g','g']]},
{id:'d14',name:'Grilled steak strips & veg',sub:'lean beef, peppers',cuis:'euro',meal:'dinner',prot:'beef',pg:38,spice:0,mins:18,cook:'Grill',batch:false,gf:true,gut:true,light:true,
 ing:[['Lean beef strips',400,'g','g'],['Bell pepper',2,'pc','g'],['Zucchini',1,'pc','g'],['Salad greens',100,'g','g']]},
{id:'d15',name:'Chicken meatballs & zoodles',sub:'air-fryer, tomato-basil',cuis:'med',meal:'dinner',prot:'chicken',pg:36,spice:0,mins:25,cook:'Air-fry',batch:true,gf:true,gut:true,light:true,
 ing:[['Chicken mince',450,'g','g'],['Egg',1,'pc','g'],['Zucchini',3,'pc','g'],['Passata',300,'g','g']]},
{id:'d16',name:'Miso-glazed grilled fish',sub:'GF miso, bok choy',cuis:'jpn',meal:'dinner',prot:'fish',pg:33,spice:0,mins:18,cook:'Grill',batch:false,gf:true,gut:true,light:true,
 ing:[['Cod/salmon fillet',400,'g','g'],['Pak choi',300,'g','g'],['Miso paste',40,'g','g']]},
];
const byId = Object.fromEntries(D.map(d => [d.id, d]));
const mealPool = m => D.filter(d => d.meal === m);
const DOW = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const DEFAULT_PREFS = {
  household:2, cuisineMix:'half', cookTime:'minimal',
  goalProtein:true, goalLight:true, goalVariety:true, goalWaste:false,
  lactoseFree:true, glutenLight:true, lessMasala:true, gutFriendly:false,
  noBeef:false, noPork:true,
};

/* ------------------------------------------------------------
   ENGINE  (same logic as the web app; prefs passed in)
   ------------------------------------------------------------ */
function allowed(d, prefs) {
  if (prefs.noBeef && d.prot === 'beef') return false;
  if (prefs.glutenLight && d.gf === false) return false;
  return true;
}
function weightOf(d, ctx) {
  const { prefs, ratings, prevAnchors } = ctx;
  let w = 1;
  const r = ratings[d.id]; if (r === 1) w *= 3; else if (r === -1) w *= 0.12;
  if (prevAnchors.includes(d.id)) w *= 0.15;
  if (prefs.goalProtein) w *= (1 + d.pg / 55);
  if (prefs.goalLight && d.light) w *= 1.15;
  if (prefs.gutFriendly && d.gut) w *= 1.3; else if (d.gut) w *= 1.05;
  if (prefs.lessMasala) { if (d.spice === 0) w *= 1.25; else if (d.spice === 1) w *= 1.1; else w *= 0.7; }
  const home = (d.cuis === 'kerala' || d.cuis === 'indian');
  if (prefs.cuisineMix === 'kerala') w *= home ? 1.7 : 0.6;
  else if (prefs.cuisineMix === 'wide') w *= home ? 0.6 : 1.3;
  return w;
}
function pickWeighted(c, ctx) {
  if (!c.length) return null;
  const ws = c.map(d => weightOf(d, ctx));
  let s = ws.reduce((a, b) => a + b, 0), r = Math.random() * s;
  for (let i = 0; i < c.length; i++) { r -= ws[i]; if (r <= 0) return c[i]; }
  return c[c.length - 1];
}
function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const SPANS = {
  minimal:{ bf:[3,2,2], lunch:[3,2,2], dinner:[2,2,2,1] },
  moderate:{ bf:[3,2,2], lunch:[2,2,2,1], dinner:[2,2,1,1,1] },
  more:{ bf:[2,2,2,1], lunch:[2,2,1,1,1], dinner:[2,1,1,1,1,1] },
};
function buildTrack(meal, spanPattern, ctx) {
  const spans = shuffle(spanPattern);
  const base = mealPool(meal).filter(d => allowed(d, ctx.prefs));
  const used = new Set(); let lastCuis = null, day = 0; const segs = [];
  for (const len of spans) {
    let cands = base.filter(d => !used.has(d.id) && d.cuis !== lastCuis);
    if (!cands.length) cands = base.filter(d => !used.has(d.id));
    if (!cands.length) cands = base.length ? base : mealPool(meal);
    const pick = pickWeighted(cands, ctx);
    used.add(pick.id); lastCuis = pick.cuis;
    segs.push({ id: pick.id, start: day, len }); day += len;
  }
  return segs;
}
function generatePlan(ctx) {
  const sp = SPANS[ctx.prefs.cookTime] || SPANS.minimal;
  return { bf: buildTrack('bf', sp.bf, ctx), lunch: buildTrack('lunch', sp.lunch, ctx), dinner: buildTrack('dinner', sp.dinner, ctx) };
}
const planAnchorIds = p => [...p.bf, ...p.lunch, ...p.dinner].map(s => s.id);
const segForDay = (track, day) => track.find(s => day >= s.start && day < s.start + s.len);

/* ------------------------------------------------------------
   DATES
   ------------------------------------------------------------ */
function currentSunday() { const n = new Date(); const d = new Date(n.getFullYear(), n.getMonth(), n.getDate()); d.setDate(d.getDate() - d.getDay()); return d; }
function weekKeyOf(sun) { return sun.toISOString().slice(0, 10); }
function fmtRange(sun) { const sat = new Date(sun); sat.setDate(sat.getDate() + 6); return `${MON[sun.getMonth()]} ${sun.getDate()}–${sat.getDate()}`; }

/* ------------------------------------------------------------
   STATE  (per chat)
   ------------------------------------------------------------ */
function loadState() { try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); } catch (e) { return { chats: {} }; } }
function saveState(s) { try { fs.writeFileSync(STATE_FILE, JSON.stringify(s, null, 2)); } catch (e) { console.error('save failed', e); } }
let STATE = loadState();

function getChat(id) {
  if (!STATE.chats[id]) STATE.chats[id] = { prefs: { ...DEFAULT_PREFS }, ratings: {}, prevAnchors: [], plan: null, weekKey: null, subscribed: true };
  return STATE.chats[id];
}
function ctxFor(c) { return { prefs: c.prefs, ratings: c.ratings || {}, prevAnchors: c.prevAnchors || [] }; }

function ensureWeek(c, force) {
  const sun = currentSunday(); const wk = weekKeyOf(sun);
  if (force || !c.plan || c.weekKey !== wk) {
    if (c.plan) c.prevAnchors = planAnchorIds(c.plan);
    c.plan = generatePlan(ctxFor(c));
    c.weekKey = wk;
    saveState(STATE);
  }
  return c.plan;
}

/* ------------------------------------------------------------
   FORMATTING  (Telegram HTML)
   ------------------------------------------------------------ */
function dayProtein(plan, day) { let p = 0; ['bf','lunch','dinner'].forEach(m => { const s = segForDay(plan[m], day); if (s) p += byId[s.id].pg; }); return p; }
const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

function statusTag(d, seg, day) {
  if (day === seg.start) return d.meal === 'bf' && d.cook === 'No-cook' ? `🥄 ${d.cook}` : `🍳 cook ${d.mins}m`;
  return `♻ leftovers (${DOW[seg.start]})`;
}
function formatWeek(c) {
  const plan = c.plan; const sun = currentSunday();
  const cooks = plan.lunch.length + plan.dinner.length + plan.bf.filter(s => byId[s.id].cook !== 'No-cook').length;
  const cuisines = new Set(planAnchorIds(plan).map(id => byId[id].cuis)).size;
  let ptot = 0; for (let i = 0; i < 7; i++) ptot += dayProtein(plan, i);
  const avgP = Math.round(ptot / 7);

  let out = `🐝 <b>Bee — week of ${fmtRange(sun)}</b>\n`;
  out += `<i>Cook ~${cooks}× · 21 meals · ${cuisines} cuisines · ${avgP}g protein/day</i>\n`;
  for (let i = 0; i < 7; i++) {
    const dt = new Date(sun); dt.setDate(dt.getDate() + i);
    out += `\n<b>${DOW[i]} ${dt.getDate()}</b>  ·  ${dayProtein(plan, i)}g\n`;
    [['bf','🥣'],['lunch','🍚'],['dinner','🍗']].forEach(([m, ic]) => {
      const seg = segForDay(plan[m], i); const d = byId[seg.id];
      out += `${ic} ${esc(d.name)}  <i>${statusTag(d, seg, i)}</i>\n`;
    });
  }
  out += `\n<i>Lactose-free · gluten-light · less-masala baked in.</i>`;
  return out;
}
function formatShopping(c) {
  const plan = c.plan; const hh = (c.prefs.household || 2) / 2;
  const agg = {};
  ['bf','lunch','dinner'].forEach(m => plan[m].forEach(seg => {
    byId[seg.id].ing.forEach(([name, qty, unit, store]) => {
      const key = store + '|' + name + '|' + unit;
      if (!agg[key]) agg[key] = { name, qty: 0, unit, store };
      agg[key].qty += qty * seg.len * hh;
    });
  }));
  const round = (q, u) => (u === 'g' || u === 'ml') ? Math.round(q / 25) * 25 : (u === 'pc' || u === 'sl') ? Math.ceil(q) : Math.round(q * 10) / 10;
  const groups = { g: [], i: [], p: [] };
  Object.values(agg).forEach(it => groups[it.store] && groups[it.store].push(it));
  const PANTRY = ['Coconut oil','Mustard seeds','Turmeric','Chilli powder','Curry leaves','Hing / asafoetida','Black pepper','Olive oil','Garlic-infused oil','Salt & basics'];
  const heads = { g: '🛒 <b>German supermarket</b>', i: '📦 <b>Indian pantry (order online)</b>', p: '🫙 <b>Pantry check</b>' };
  let out = `🧺 <b>Shopping — for ${c.prefs.household}</b>\n`;
  ['g','i'].forEach(s => {
    if (!groups[s].length) return;
    out += `\n${heads[s]}\n`;
    groups[s].sort((a, b) => a.name.localeCompare(b.name)).forEach(it => {
      const q = round(it.qty, it.unit); const u = it.unit === 'pc' ? '' : ' ' + it.unit;
      out += `• ${esc(it.name)} — ${q}${u}\n`;
    });
  });
  out += `\n${heads.p}\n` + PANTRY.map(x => '• ' + x).join('\n');
  return out;
}

const kb = { inline_keyboard: [[
  { text: '🔄 New week', callback_data: 'new' },
  { text: '🧺 Shopping', callback_data: 'shop' },
  { text: '📅 This week', callback_data: 'week' },
]] };

/* ------------------------------------------------------------
   BOT
   ------------------------------------------------------------ */
const bot = new TelegramBot(TOKEN, { polling: true });
const send = (id, text) => bot.sendMessage(id, text, { parse_mode: 'HTML', reply_markup: kb, disable_web_page_preview: true });

bot.onText(/\/start/, (msg) => {
  const c = getChat(msg.chat.id); c.subscribed = true; ensureWeek(c); saveState(STATE);
  bot.sendMessage(msg.chat.id,
    `🐝 <b>Welcome to Bee!</b>\nYour batch-cook meal planner for two — Kerala + world, tuned lactose-free, gluten-light, less-masala, high-protein.\n\nI'll send your week every <b>Sunday morning</b>. Commands:\n/week · /new · /shopping · /stop`,
    { parse_mode: 'HTML' });
  send(msg.chat.id, formatWeek(c));
});
bot.onText(/\/week/, (msg) => { const c = getChat(msg.chat.id); ensureWeek(c); send(msg.chat.id, formatWeek(c)); });
bot.onText(/\/new/, (msg) => { const c = getChat(msg.chat.id); ensureWeek(c, true); send(msg.chat.id, formatWeek(c)); });
bot.onText(/\/shopping/, (msg) => { const c = getChat(msg.chat.id); ensureWeek(c); send(msg.chat.id, formatShopping(c)); });
bot.onText(/\/stop/, (msg) => { const c = getChat(msg.chat.id); c.subscribed = false; saveState(STATE); bot.sendMessage(msg.chat.id, 'Paused the Sunday send. /start to resume.'); });
bot.onText(/\/help/, (msg) => bot.sendMessage(msg.chat.id, 'Commands: /week /new /shopping /stop', { parse_mode: 'HTML' }));

bot.on('callback_query', (q) => {
  const c = getChat(q.message.chat.id);
  if (q.data === 'new') { ensureWeek(c, true); bot.editMessageText(formatWeek(c), { chat_id: q.message.chat.id, message_id: q.message.message_id, parse_mode: 'HTML', reply_markup: kb, disable_web_page_preview: true }); }
  else if (q.data === 'shop') { ensureWeek(c); send(q.message.chat.id, formatShopping(c)); }
  else if (q.data === 'week') { ensureWeek(c); send(q.message.chat.id, formatWeek(c)); }
  bot.answerCallbackQuery(q.id).catch(() => {});
});

// Sunday morning auto-send
cron.schedule(SEND_CRON, () => {
  console.log('[cron] weekly send…');
  Object.entries(STATE.chats).forEach(([id, c]) => {
    if (!c.subscribed) return;
    ensureWeek(c, true);
    send(id, formatWeek(c)).catch(e => console.error('send fail', id, e.message));
  });
}, { timezone: TZ });

bot.on('polling_error', e => console.error('polling_error:', e.code || e.message));
console.log(`🐝 Bee bot running. Weekly send: "${SEND_CRON}" (${TZ}). Message your bot /start on Telegram.`);
