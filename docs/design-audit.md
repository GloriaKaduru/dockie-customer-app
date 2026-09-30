# Dockie Customer Platform — PRD audit & Mobbin research

_Sep 30, 2026 · Audit of the first prototype against the Screen-by-Screen Product Specification, and the Mobbin references used for the rebuild on shadcn/ui._

## 1. Audit of v1 against the PRD

The first prototype was built before the PRD existed. It modelled generic freight, not vehicles, and treated AI as a support-style add-on.

| Area | v1 | PRD requirement | Verdict |
|---|---|---|---|
| Domain | Pallets, weight, pieces | Vehicles: VIN, make/model, titles, vessels | ❌ Remodelled |
| Navigation | Overview, Shipments, Get a quote, Dockie AI, Billing, Documents | Home, Chats, Shipments, Tracking, Documents, Payments, Analytics (§0) | ❌ Replaced |
| Dockie panel | Overlay drawer covering the page | Reflows content: closed / open / expanded / full-screen (§0, §4.1) | ❌ Rebuilt |
| Dockie context | Generic "How can I help?" | Context header + contextual prompts per screen (§4.2–4.3, §20–21) | ❌ Added |
| Agent actions | Text answers only | Agentic cards, confirmation with from→to, success/failure (§4.5–4.8, §25) | ❌ Added |
| New shipment | Form-based quote page | Chat-first, progressive collection (§22–23) | ❌ Replaced |
| Shipment statuses | 7 generic | 15 canonical states, text + icon (§2.3–2.4) | ❌ Replaced |
| Shipment detail | Stepper + timeline | Summary above the fold, journey, 6 tabs, permission-aware actions (§3) | ⚠️ Expanded |
| Home | KPI cards first | Needs attention *before* statistics, Dockie input as hero (§1) | ⚠️ Re-prioritised |
| Onboarding, search, notifications, team, roles | — | Required (§10–14) | ❌ Added |
| States | Some empty states | Loading, empty, error, permission, stale, pending, success, failure (§31) | ⚠️ Systematised |
| Design system | Hand-rolled tokens | shadcn/ui zinc base | ❌ Migrated |

## 2. Mobbin research → decisions

| PRD area | References | What we took |
|---|---|---|
| Docked AI panel (§4) | [Apollo](https://mobbin.com/screens/bd771aa7-8298-4f12-9344-eb4706cf7390), [Fabric](https://mobbin.com/screens/c6048777-510b-4293-8bc7-7ca53f75a515), [Customer.io](https://mobbin.com/screens/fafcbfb9-fa85-4b4d-b17f-54df962305b5), [Hashnode](https://mobbin.com/screens/a71f48df-66f0-4bbd-a8e3-b72fddf6649b) | Three columns (nav · page · panel) with the page squeezed, not covered. Context label in the panel header ("Shipment: …"), like Fabric's "Current file". Suggestion chips above the composer. |
| Agent confirmation (§4.6, §25) | [OpenAI Platform](https://mobbin.com/screens/b98de4c3-c6b2-4ad0-ad85-89f1d2345686), [Asana](https://mobbin.com/screens/a7c7d26a-be3a-4cfa-aef0-8c5688f18034), [Delphi](https://mobbin.com/screens/f224b7d4-a925-45a8-b0b0-26b0eb74f3ec), [Grammarly](https://mobbin.com/screens/5fb58d62-0fff-43de-9686-2cfbfe5c5ed3) | Current ↓ New stacked with an arrow. Consequence line before the buttons. The card lives inline in the conversation (Delphi), not in a modal. |
| Action success (§4.7) | [ClickUp Brain](https://mobbin.com/screens/bcdfbb23-91e1-4191-94d5-8f1c887b0069) | Success message links to the updated object; follow-ups offered. |
| Shipment detail (§3) | [Shopify order](https://mobbin.com/screens/931f0b54-59ef-4a01-ac43-bfedb8174e52), [Uvodo](https://mobbin.com/screens/026e5e51-ec1d-4054-90e0-0f18763569ef), [Deel](https://mobbin.com/screens/64373e1d-d81e-4016-9f63-0593fea580ca) | Status badge beside the title, "Actions ▾" menu, timeline grouped by day. Status labels use icon + text, never colour alone. |
| Tracking (§6) | [Walmart](https://mobbin.com/screens/c75ab520-4707-4e7b-9d65-7e5d7c888111), [Etsy](https://mobbin.com/screens/30d80a36-3186-4b99-80ce-f35de1b0c294), [Urban Outfitters](https://mobbin.com/screens/640f7618-77c5-44f4-abdb-2f7f3e413fad) | Large ETA date as the hero, horizontal milestone stepper, "Latest update" event list next to the map. |
| Global search (§11) | [Juicebox](https://mobbin.com/screens/84169c57-5cd6-4495-bb71-93d37266f4c4), [Mintlify](https://mobbin.com/screens/7c7ad31f-9dfe-4be7-83d7-6002fe31d4d0), [Magnific](https://mobbin.com/screens/e22e26e2-f813-4f1e-beda-43c9ecf26419) | ⌘K palette grouped by entity with title + subtitle rows. "Ask Dockie: <query>" as the first result (Magnific merges search and ask). |
| Chats (§5) | [Customer.io](https://mobbin.com/screens/fafcbfb9-fa85-4b4d-b17f-54df962305b5), [ClickUp](https://mobbin.com/screens/bcdfbb23-91e1-4191-94d5-8f1c887b0069) | Chat list grouped by Today / Yesterday. "+ New chat" at the top of the list. |
| Onboarding (§10) | [Perplexity](https://mobbin.com/flows/e97ed41a-5424-4282-a8a1-c89d723a292f), [Revolut Business](https://mobbin.com/flows/6554193e-3f98-44aa-9ae5-ceea3b0fe54e), [Fresha](https://mobbin.com/flows/9f71c12d-7568-4c9f-b8b6-6b5028daee9a) | Centred card with step dots and a back arrow on every step. Invite rows with a role per email and "I'll do this later". 6-digit code split 3–3 with a resend countdown. |
| Team & roles (§13) | [Copilot](https://mobbin.com/screens/6cd14492-9ff4-4564-80ee-d848043aba7b), [Cal.com](https://mobbin.com/screens/e752444b-4f9c-480a-821c-2bb90a605415), [User Interviews](https://mobbin.com/screens/1c0a6d5a-7d44-4410-8417-03345b64a4f3) | Name + email in one cell, Active / Invited status, ⋯ row menu, success toast, invite by email *or* copied link. |
| Payments & documents (§7–8) | [Exa](https://mobbin.com/screens/59581baf-6a88-4784-8e2b-ee2a6c886d6c), [Airwallex](https://mobbin.com/screens/67986ff3-6f6c-4516-a078-44dfbb42b4ee), [DoorDash Merchant](https://mobbin.com/screens/147163b2-eef8-40be-b199-dae113a33d9c) | Totals row above the table. Filters in one row. Row click opens a side sheet for detail. |

## 3. PRD coverage (v2)

✅ built · ⚠️ partial / prototype-level · ⏭️ deliberately deferred

| § | Screen | Status | Notes |
|---|---|---|---|
| 0 | App shell | ✅ | shadcn Sidebar (collapsible to icons), header, reflowing Dockie panel |
| 1 | Home | ✅ | Needs attention (normal, warning, critical, empty), overview → filtered list, empty org at `/home?state=empty` |
| 2 | Shipment list | ✅ | 9 columns, search as you type, 15-status filter + origin, destination, document and payment filters, sort. ⏭️ Bulk selection is P1 (§2.6). |
| 3 | Shipment detail | ✅ | Summary, journey (inland hides ocean steps), 6 tabs, permission-aware actions, stale and locked states |
| 4 | Dockie panel | ✅ | Open / expanded / full-screen on mobile; context header; agentic cards; confirm → success / failure |
| 5 | Chats | ✅ | List, search, rename, archive (undo), delete (confirm), new-chat starting points, voice states |
| 6 | Tracking | ✅ | Counts, cards, vessel details, schematic route map that never replaces the text |
| 7 | Documents | ✅ | 5 statuses, detail sheet, upload → processing → verified / rejected (a file name containing "blur" is rejected) |
| 8 | Payments | ✅ | Totals, table, detail, explicit pay confirmation |
| 9 | Analytics | ✅ | Tiles, metrics, trend charts with a table view, filter row (filters are visual only) |
| 10 | Onboarding | ✅ | `/onboarding/signup` → … → walkthrough. Code `000000` shows the error state. |
| 11 | Global search | ✅ | Ctrl/⌘ K |
| 12 | Notifications | ✅ | Unread, mark all read, deep links |
| 13 | Org settings | ✅ | General, Team, Roles & permissions, Billing, Activity |
| 14 | Profile | ✅ | Notification and voice preferences, verification status |
| 17 | Loading | ⚠️ | Route-level skeletons; per-widget skeletons come with real data fetching |
| 19 | Permissions | ✅ | Avatar menu → "Preview as role" |
| 26 | Error taxonomy | ⚠️ | DATA_STALE, PERMISSION_DENIED, ACTION_FAILED, AMBIGUOUS_INTENT and CONFIRMATION_REQUIRED are demonstrated; DEPENDENCY_UNAVAILABLE needs a real backend |

## 4. Prototype scenarios (§32), verified in the browser

1. **New dealer:** signup → verify → business → team → walkthrough → Home ✅
2. **Existing dealer:** Home shows 1 delayed + 5 missing titles → opens the shipment ✅
3. **Shipment investigation:** Lexus DK-10477 → Ask Dockie why → contextual explanation ✅
4. **Agent action:** Camry DK-10482 → change destination → confirm → page updates. On the locked Lexus it fails with "locked by operations" ✅
5. **Missing document:** upload a title → verified → Home count 5 → 4 ✅
6. **Tracking:** select a vehicle → last-known location + timeline → View shipment ✅
7. **Team member:** Preview as Viewer → New shipment disabled with a reason; Payments restricted ✅

## 5. Next

- Connect `src/lib/data.ts` and the workspace store to the API. Keep the types in `src/lib/types.ts` as the contract.
- Replace `respond()` in `src/components/dockie/engine.ts` with the agent API. It already returns structured parts (text, lists, choices, action cards), so the UI won't change.
- Save panel conversations into Chats (right now they're separate).
- Add a real map provider behind the schematic, keeping the text fallback.
- Design review on dark mode (tokens are defined, but it hasn't been reviewed screen by screen).
