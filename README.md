# Dockie — Customer Platform (frontend)

Customer workspace for Dockie, the AI logistics agent for moving vehicles.
**Next.js (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui (Radix · Blue theme · Neutral base).**
All data is mocked. See `docs/design-audit.md` for the PRD audit and Mobbin references.

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Try these

| What | Where |
|---|---|
| Ask Dockie with page context | Open any shipment → **Ask Dockie** |
| Agent action + confirmation | On `DK-10482`, Actions → Edit shipment (succeeds); on `DK-10477` it fails because the shipment is locked |
| Chat-first new shipment | Shipments → **New shipment** (VIN `5FNYF6H59LB041278`) |
| Upload flow | Documents → Upload (a file name containing "blur" is rejected) |
| Permission states | Avatar menu → Preview as role → Viewer |
| Empty Home (new org) | `/home?state=empty` |
| Onboarding | `/onboarding/signup` (code `000000` shows the error state) |
| Global search | Ctrl/⌘ + K |

## How it's organised

**Folders under `src/app` become URLs.** `(app)` and `(auth)` are route groups, which organise files but don't appear in the URL.
`[id]` is a dynamic segment.

```
src/app/
├── (app)/                     signed-in workspace — layout.tsx adds sidebar, header, Dockie panel
│   ├── home/                  /home
│   ├── chats/ [id]/           /chats, /chats/c1, /chats/new
│   ├── shipments/ [id]/       /shipments, /shipments/DK-10482?tab=documents
│   ├── tracking/              /tracking?id=DK-10482
│   ├── documents/             /documents?status=required
│   ├── payments/              /payments?invoice=INV-10283
│   ├── analytics/  settings/  profile/
│   ├── loading.tsx            skeleton while pages load
│   └── error.tsx              contextual error + Try again
└── (auth)/
    ├── login/
    └── onboarding/[step]/     signup → verify-email → verify-phone → account-type → business → team → walkthrough

src/components/
├── ui/          shadcn components (add more: npx shadcn@latest add <name>)
├── app/         shell: sidebar, header, search, notifications, workspace store, shared states
├── domain/      StatusBadge, ETADisplay, LocationDisplay, Timeline, Journey (PRD §15)
├── dockie/      agent: engine (mock), conversation hook, panel, action card, composer + voice
└── home/ shipments/ tracking/ documents/ payments/ analytics/ chats/ settings/ onboarding/

src/lib/
├── types.ts        data contracts
├── data.ts         mock data
├── status.ts       15 canonical shipment states, journeys, document/payment statuses
├── permissions.ts  roles → capabilities
└── format.ts       dates, money ("today" is fixed at Sep 30, 2026)
```

## Common tasks

- **Add a page:** create `src/app/(app)/<name>/page.tsx`, then add it to `src/lib/nav.ts`.
- **Add a shadcn component:** `npx shadcn@latest add <name>`. It's copied into `src/components/ui/` and you own it.
- **Retheme:** edit the CSS variables in `src/app/globals.css`.
- **Give Dockie context on a new page:** render `<SetDockieContext context={{ kind: "…" }} />`.
- **Connect the backend:** replace the mock data in `src/lib/data.ts` and the setters in `components/app/workspace-provider.tsx`. Point `respond()` in `components/dockie/engine.ts` at the agent API.
