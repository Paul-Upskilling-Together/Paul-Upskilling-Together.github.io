# ABC Tutoring — Discovery

**Client:** Dana, owner of ABC Tutoring
**Us:** PostHog
**Deliverables:** prototype w/ live telemetry (~35 min) → 3–5 slide PDF for Dana (~10 min)
**Budget:** 50 turns with Dana. **Used: 8. CONVERSATION CLOSED.**

## Hard constraint driving discovery

35 minutes of build time. Discovery is not "extract everything" — it is
"find the smallest set of things Dana cares most about that we can ship
with real telemetry." Steer her away from calendar sync, payments, email,
accounts. Steer her toward: browse → view tutor → pick slot → confirm →
availability visibly updates.

## Status legend

`[ ]` open · `[~]` partially answered · `[x]` settled

---

## A. Business & goals

- [x] What the business is — tutoring service, ABC Tutoring
- [x] Current web presence — Facebook page only, no website
- [x] Core pain — booking admin runs through her personal phone, volume rising
- [ ] What "success" looks like to her in 3 months
- [ ] Roughly how many tutors / how many bookings a week
- [x] Where the schedule lives today — **a Google Sheet**, maintained by hand
- [ ] Does the Sheet stay? (matters for what "the site updates" can honestly mean)

## B. The visitor

- [x] Who visits — **parents**, not students (her word, unprompted)
- [x] How they arrive — **see the Facebook post, then text or call her**
- [ ] What a parent already knows when they arrive (referral? cold?)
- [ ] What makes a parent hesitate / go elsewhere
- [ ] Desktop or phone

## C. Tutor listing

- [x] What a parent needs to see — her own pitch, verbatim: **subjects, grade levels,
      rate, and a little about their experience**. All four now on the card.
- [~] How they narrow down — subject and grade are the two axes she already uses
- [x] Grade sits on the card; subject is the filter (three subjects, six tutors — a
      second filter would be clutter)
- [x] **Six tutors** — grid on one page, no search, no pagination
- [ ] How many tutors (decides list vs grid vs search)

## D. Booking flow

- [x] What happens today, end to end:
      Facebook post → parent texts/calls → Dana asks subject + grade → checks Google
      Sheet → suggests a tutor and times → **back and forth until settled** → adds to
      Sheet → texts the tutor
- [x] **Instant confirmation** — parent picks an available tutor and time, confirmed
      on the spot. Dana is out of the loop entirely. Matches what we built.
- [ ] Tutor-side: she texts them today. Does the tutor need anything from the site?
- [x] **Dana must be notified after every booking — EMAIL.** "I check it more reliably
      than texts when I'm catching up between appointments." She is out of the
      *approval* loop but not the *awareness* loop. Static site can't send mail →
      hang it off `booking_completed` via a PostHog destination/webhook.
- [x] **Fields, her exact list:** parent's name + email, student's *first* name +
      grade, and subject. Built. (Optional "anything the tutor should know" kept.)
- [x] **PII stays out of analytics** — booking events carry tutor/subject/grade/slot
      only, never name or email. Deliberate.
- [ ] What the parent sees after booking
- [ ] What "the website updates to reflect the booking" means to her

## E. Look & feel

- [x] **"Clean and friendly, warm and local — not dark or corporate."** Applied:
      lighter cream ground, warmer green, no dark surfaces anywhere.
- [ ] Logo / existing brand? (low value — not worth a turn)

## ⚠ MARKET — caught turn 6

Dana is **US**, not UK. "Elementary math through Algebra II", "K–12", "elementary
reading". The entire first scaffold was British (GCSE, A-Level, Key Stage, Year
groups, £). Rewritten: $ rates, Grades K–12, US date/time format, US subject names.
Lesson: never infer locale from a name or a brief.

## F. Analytics — what Dana wants to LEARN

Translate to PostHog primitives on our side; never say "funnel" to her.

She named two, unprompted and unled. These are THE analytics requirements.

- [x] **"Which subjects people are looking for"** → breakdown of `tutor_viewed`
      and `filter_applied` by `subject`
- [x] **"Whether they're booking or just looking around and leaving"** → she
      described a funnel in plain English:
      `tutor_list_viewed → tutor_viewed → booking_started → booking_completed`
- [x] **Yes — wants demand for subjects she does NOT offer.** Built: a "looking for a
      subject we don't list?" capture on the listing page firing `subject_requested`
      with `requested_subject`. Sim generates realistic unmet demand (History, CS, 11+).
- [x] **The drop-off point, not the number** — "where they're getting stuck".
      Makes the funnel + session replay the centre of the demo, not a side note.
- [ ] Where parents come from → **referrer** (not asked; we capture it anyway — free win)
- [ ] Does she want to watch a real visitor's session? → **session replay** (already on;
      offer it in the deck as something she didn't know to ask for)
- [x] Subjects: **math, science, reading** — three areas, not four

## Deliberately not asked

Judged low-value against the 35-minute build. Noting them so it's clear they were
chosen against, not missed: bookings per week, what makes a parent hesitate,
desktop vs mobile split (we capture it anyway), whether the Google Sheet stays,
what the tutor needs from the site, existing logo/brand, 3-month success measure.

## G. Playback

- [x] Played back turn 7. **It caught two real misses** — the email notification and
      the exact form fields — neither of which she had mentioned in six prior turns.
      The playback paid for itself.

## Scope watchlist (named by Dana, likely NOT buildable in 35 min)

- **Notification on booking** — NOT out of scope, she asked for it directly. Delivered
  as a PostHog destination fired by `booking_completed`, not as site code.
- **Schedule changes / rescheduling** — she called this half the mess. BUILT: a
  "Your bookings" view where a parent can cancel and the time returns to the
  calendar, firing `booking_cancelled`. Moving a session to a different time is
  NOT built — named on the deck's next-steps slide.
- **Texting the tutor** — needs a backend. Same treatment.
- **Replacing the Google Sheet** — do not promise it.

---

## Confirmed requirements (Dana's words)

- Parents browse tutors and book a session
- Bookings must stop routing through her phone
- Parents are screened on **subject and grade** — both must be visible and filterable
- Dana currently does the tutor/time matchmaking by hand, every time — and wants out of it
- Booking is **instant-confirm**, not request-and-approve
- Six tutors
- Analytics: subject demand (including unmet), and **where people get stuck**, not just how many
- US market, K–12, math / science / reading
- Aesthetic: clean, friendly, warm, local — explicitly not dark or corporate
- Dana gets notified on every booking (email or text — confirming which)
- Form collects: parent name + email, student first name + grade, subject
- The back-and-forth to settle a time is the specific thing costing her evenings

## Quotable for the deck

> "I run a tutoring service and I've never had a real website, just a Facebook page."

> "Right now it all goes through my phone and it's getting to be a lot."

> "I'd like something where parents can look at our tutors and book a session."

> "I ask what subject and grade they need, check my Google Sheet, suggest a tutor and times, then go back and forth until we settle on something."

> "The messy part is keeping all those conversations and schedule changes straight."

> "I'd want parents to pick an available tutor and time and have it confirmed right away."

> "I usually tell them the tutor's subjects, grade levels, rate, and a little about their experience."

> "I'd really like to know which subjects people are looking for, and whether they're booking or just looking around and leaving."

> "Yes, I'd want to know what subjects people look for, including ones we don't offer."

> "If people are leaving without booking, I'd want to know where they're getting stuck."

> "We cover elementary math through Algebra II, science, and elementary reading, mostly for K–12 students."

> "I'd want it to feel clean and friendly, warm and local—not dark or corporate."

> "I do need the site to notify me by email or text after a booking."

> "The booking form should collect the parent's name and email, the student's first name and grade, and the subject."

> "Email is fine for the first version. I check it more reliably than texts when I'm catching up between appointments."
