#!/usr/bin/env node
/**
 * Simulates a week of parent traffic against the ABC Tutoring prototype and
 * sends it straight to PostHog's capture API. Produces a realistic drop-off
 * shape so the funnel has something worth showing Dana.
 *
 *   POSTHOG_KEY=phc_xxx node simulate.js [visitors]
 *
 * Requires Node 18+ (built-in fetch). No dependencies.
 */

const KEY  = process.env.POSTHOG_KEY  || "phc_yiiWrS7TKNB9RrQryGnm65C2EWdukNgKkgnDZxfNaM5V";
const HOST = process.env.POSTHOG_HOST || "https://us.i.posthog.com";
const VISITORS = Number(process.argv[2]) || 200;

const TUTORS = [
  {id:"t1",name:"Priya Raman",    subject:"Math",    rate:32, pull:1.6},
  {id:"t2",name:"Tom Whelan",     subject:"Reading", rate:28, pull:1.0},
  {id:"t3",name:"Aisha Bello",    subject:"Science", rate:34, pull:1.3},
  {id:"t4",name:"Marcus Reid",    subject:"Math",    rate:26, pull:1.4},
  {id:"t5",name:"Sofia Marchetti",subject:"Reading", rate:30, pull:0.6},
  {id:"t6",name:"Dan Osei",       subject:"Science", rate:36, pull:0.7}
];

// where parents come from — gives Dana a referrer breakdown to look at
const SOURCES = [
  {referrer:"https://www.facebook.com/", name:"Facebook",     w:5},
  {referrer:"https://www.google.com/",   name:"Google",       w:3},
  {referrer:"$direct",                   name:"Direct",       w:3},
  {referrer:"https://nextdoor.com/",     name:"Nextdoor",     w:1}
];
const DAYS  = ["Mon, Oct 6","Tue, Oct 7","Wed, Oct 8","Thu, Oct 9"];
const TIMES = ["4:00 PM","5:00 PM","6:00 PM"];
const GRADES = ["Kindergarten","Grade 2","Grade 4","Grade 5","Grade 7","Grade 9","Grade 10","Grade 11"];

// subjects parents ask for that ABC Tutoring does not currently offer.
// this is Dana's hiring signal — she asked for it by name.
const UNMET = [
  {subject:"Geometry",        w:6},
  {subject:"SAT prep",        w:5},
  {subject:"Writing",         w:4},
  {subject:"Spanish",         w:3},
  {subject:"AP Chemistry",    w:2},
  {subject:"Elementary music",w:1}
];

const pick   = a => a[Math.floor(Math.random()*a.length)];
const chance = p => Math.random() < p;
const weighted = list => {
  let r = Math.random() * list.reduce((s,x)=>s+(x.w??x.pull),0);
  for (const x of list) { r -= (x.w ?? x.pull); if (r <= 0) return x; }
  return list[list.length-1];
};

const events = [];
const push = (distinct_id, event, props, when) => events.push({
  event,
  properties: { distinct_id, $lib:"abc-tutoring-sim", dataset:"v2", ...props },
  timestamp: when.toISOString()
});

const now = Date.now();
let started = 0, completed = 0, asked = 0, cancelled = 0;

for (let i = 0; i < VISITORS; i++) {
  const id  = `parent_${String(i).padStart(4,"0")}`;
  // spread over the last 7 days, weighted toward evenings
  const t0  = new Date(now - Math.random()*7*864e5);
  t0.setHours(17 + Math.floor(Math.random()*5), Math.floor(Math.random()*60));
  const src = weighted(SOURCES);
  const device = chance(0.68) ? "Mobile" : "Desktop";
  const base = { $referrer: src.referrer, $referring_domain: src.name, $device_type: device };
  let clock = new Date(t0);
  const tick = s => clock = new Date(clock.getTime() + s*1000);

  push(id, "$pageview", { ...base, $current_url:"https://abctutoring.example/" }, clock);
  push(id, "tutor_list_viewed", { ...base, tutor_count:6, filter:"All" }, tick(2));

  // some parents narrow by subject first
  if (chance(0.4)) {
    const s = pick(["Maths","English","Science","Languages"]);
    push(id, "filter_applied", { ...base, subject:s }, tick(6));
  }

  // some parents want a subject we don't cover and say so before leaving
  if (chance(0.14)) {
    const want = weighted(UNMET);
    push(id, "subject_requested", { ...base, requested_subject: want.subject, offered: false }, tick(20));
    asked++;
    continue;
  }

  // ~62% look at a tutor at all
  if (!chance(0.62)) continue;
  const tutor = weighted(TUTORS);
  const tp = { tutor_id:tutor.id, tutor_name:tutor.name, subject:tutor.subject, hourly_rate:tutor.rate };
  push(id, "tutor_viewed", { ...base, ...tp }, tick(9));

  // some compare a second tutor
  if (chance(0.35)) {
    const other = weighted(TUTORS.filter(t=>t.id!==tutor.id));
    push(id, "tutor_viewed", { ...base,
      tutor_id:other.id, tutor_name:other.name, subject:other.subject, hourly_rate:other.rate }, tick(24));
  }

  // ~55% of viewers pick a time — pricier tutors lose a few more here
  if (!chance(0.55 - (tutor.rate-26)*0.012)) continue;
  const slot = { slot_day: pick(DAYS), slot_time: pick(TIMES) };
  push(id, "booking_started", { ...base, ...tp, ...slot }, tick(18));
  started++;

  // ~64% finish the form; mobile drops off more — this is the gap Dana asks about
  const finishes = device === "Mobile" ? 0.58 : 0.76;
  if (!chance(finishes)) {
    push(id, "booking_abandoned", { ...base, ...tp, ...slot, step:"details_form" }, tick(41));
    continue;
  }
  const grade = pick(GRADES);
  push(id, "booking_completed", { ...base, ...tp, ...slot, grade, subject_booked: tutor.subject }, tick(55));
  completed++;

  // a few change their minds a day or two later — this is the "schedule changes" Dana named
  if (chance(0.09)) {
    const later = new Date(clock.getTime() + (0.5 + Math.random()*2)*864e5);
    push(id, "booking_cancelled", { ...base, ...tp, ...slot, subject_booked: tutor.subject }, later);
    cancelled++;
  }
}

const batches = [];
for (let i = 0; i < events.length; i += 500) batches.push(events.slice(i, i+500));

(async () => {
  if (!KEY.startsWith("phc_")) {
    console.error("Set POSTHOG_KEY first:  POSTHOG_KEY=phc_xxx node simulate.js");
    process.exit(1);
  }
  for (const [n, batch] of batches.entries()) {
    const res = await fetch(`${HOST}/batch/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: KEY, historical_migration: false, batch })
    });
    if (!res.ok) { console.error(`batch ${n+1} failed: ${res.status} ${await res.text()}`); process.exit(1); }
    console.log(`batch ${n+1}/${batches.length} sent (${batch.length} events)`);
  }
  console.log(`\n${VISITORS} visitors → ${events.length} events`);
  console.log(`${started} started a booking, ${completed} finished (${Math.round(completed/started*100)}%)`);
  console.log(`${asked} asked for a subject we don't offer`);
  console.log(`${cancelled} cancelled afterwards`);
  console.log("Events take ~30s to appear in PostHog.");
})();
