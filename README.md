# ABC Tutoring — prototype + findings

Pre-assessment deliverable. A booking website for ABC Tutoring, a K–12 tutoring
service, with PostHog telemetry wired in and a simulated week of traffic behind it.

## The files

| File | What it is |
|---|---|
| `index.html` | The prototype. Single file, no build step, no dependencies. |
| `simulate.js` | Generates a week of realistic parent traffic and sends it to PostHog. |
| `discovery.md` | The requirements, taken from the customer conversation, in her own words. |
| `ABC-Tutoring-Findings.pdf` | **The deliverable deck.** 5 slides, A4 landscape. |
| `slides.html` | Source for the deck. Edit this, then regenerate the PDF. |
| `make-pdf.mjs` | Regenerates the PDF from `slides.html`. |

## Running it

```sh
python3 -m http.server 8765     # then open http://localhost:8765
```

Serve it rather than opening the file directly — PostHog is unreliable from a
`file://` origin, where the page has no real domain to report.

## Regenerating the analytics data

```sh
node simulate.js 200            # Node 18+, no dependencies
```

Sends ~750 events across the funnel with a deliberate drop-off shape: about 62% of
visitors open a tutor, 55% of those pick a time, and mobile abandons the booking form
harder than desktop. It also generates requests for subjects ABC Tutoring doesn't
offer, which is the hiring signal the customer specifically asked for.

Events carry `dataset: "v2"`. Filter insights on that to exclude earlier test data.

## What's tracked

| Event | Fires when | Key properties |
|---|---|---|
| `tutor_list_viewed` | The listing renders | `tutor_count`, `filter` |
| `filter_applied` | A subject filter is clicked | `subject`, `results` |
| `tutor_viewed` | A tutor's page opens | `tutor_id`, `tutor_name`, `subject`, `hourly_rate` |
| `booking_started` | A time slot is selected | tutor props, `slot_day`, `slot_time` |
| `booking_abandoned` | They leave after picking a time | tutor props, `step` |
| `booking_completed` | The booking is confirmed | tutor props, `grade`, `subject_booked` |
| `booking_cancelled` | A booking is cancelled | tutor props, `subject_booked` |
| `subject_requested` | Someone asks for a subject we don't offer | `requested_subject`, `offered` |

**No personal data goes to PostHog.** The booking form collects the parent's name and
email, but events carry only tutor, subject, grade and time slot. Analytics doesn't
need to know who booked, so it isn't told.

## The three insights

Built in PostHog, named in the customer's own language:

- **"Where parents get stuck"** — funnel over `tutor_list_viewed` → `tutor_viewed` →
  `booking_started` → `booking_completed`
- **"What subjects parents want"** — `tutor_viewed`, broken down by `subject`
- **"Subjects we don't offer yet"** — `subject_requested`, broken down by
  `requested_subject`

Booking notification is a PostHog destination fired by `booking_completed`, rather
than application code — the event already carries everything the email needs.

## Adjusting it

Three marked blocks at the top of `index.html`:

1. **Palette** — CSS custom properties in `:root`
2. **Copy** — the `COPY` object; every word a visitor reads
3. **Tutors** — the `TUTORS` array; its fields drive the cards and the detail pages

## Regenerating the deck

`ABC-Tutoring-Findings.pdf` is already built. To rebuild it after editing `slides.html`:

```sh
python3 -m http.server 8765 &          # must be served, not opened as a file
npx puppeteer browsers install chrome  # first time only
npx --yes -p puppeteer node make-pdf.mjs
```

By hand instead: open `slides.html` in Chrome, print, **Save as PDF**, **Landscape**,
margins **None**, **Background graphics** ticked.

## Verifying it works

The full click-through is scriptable — see the checklist below, or drive it with
Puppeteer against `http://localhost:8765`. What must hold:

- the subject filter narrows to the right tutors (Science → 2)
- the booking button stays disabled until a time is picked
- a booked time is struck through and unclickable afterwards
- cancelling returns that time to the calendar and hides the nav at zero
- eight event names appear in the browser console, prefixed `[track]`
- no page errors
