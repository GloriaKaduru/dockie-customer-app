import { formatDate, formatMoney, timeAgo, vehicleName } from "@/lib/format";
import { shipmentStatus } from "@/lib/status";
import type { Payment, Role, Shipment, ShipmentDocument } from "@/lib/types";
import { can } from "@/lib/permissions";
import { monthlyStats, routeStats } from "@/lib/data";

/*
  A scripted stand-in for the Dockie agent backend.
  It returns structured "parts" (text, shipment lists, choices, action cards…) rather than
  plain text, so the UI can render agentic components (PRD §4.5). Replace `respond()` with
  a call to the real agent API that returns the same Part shapes.
*/

// ---------- Context (PRD §20) ----------
export type DockieContext =
  | { kind: "home" }
  | { kind: "shipments" }
  | { kind: "shipment"; id: string; label: string }
  | { kind: "tracking" }
  | { kind: "documents" }
  | { kind: "payments" }
  | { kind: "analytics" }
  | { kind: "chats" };

// ---------- Message parts ----------
export type ProposedAction = {
  type: "change_destination" | "update_pickup" | "create_shipment";
  title: string; // "Change destination?"
  targetId: string;
  targetLabel: string; // "2021 Toyota Camry · DK-10482"
  field?: string;
  from?: string;
  to: string;
  consequence?: string;
  confirmLabel: string;
};

export type ActionState = "pending" | "running" | "success" | "failed" | "cancelled";

export type Choice = { label: string; send?: string; command?: string; href?: string };

export type Part =
  | { kind: "text"; text: string }
  | { kind: "note"; text: string }
  | { kind: "shipments"; ids: string[] }
  | { kind: "documents"; ids: string[] }
  | { kind: "payments"; ids: string[] }
  | { kind: "choices"; prompt?: string; options: Choice[] }
  | { kind: "action"; action: ProposedAction; state: ActionState; error?: string }
  | { kind: "vin-input" }
  | { kind: "vehicle"; vehicle: { year: number; make: string; model: string; trim: string; vin: string } }
  | { kind: "quote"; lines: [string, string][]; total: string };

/** `thoughtMs`: how long Dockie thought before replying (shown as "Thought for 2s"). */
export type Message = { id: string; role: "user" | "dockie"; parts: Part[]; at: number; thoughtMs?: number };

// ---------- New-shipment flow state (PRD §22) ----------
export type Flow =
  | null
  | { name: "new_shipment"; step: "vin" | "vehicle" | "pickup" | "destination" | "requirements" | "confirm"; pickup?: string; destination?: string; method?: string };

export type Env = {
  shipments: Shipment[];
  documents: ShipmentDocument[];
  payments: Payment[];
  role: Role;
};

// ---------- Prompt library (PRD §21) ----------
export function promptsFor(ctx: DockieContext): { heading: string; prompts: string[] } {
  switch (ctx.kind) {
    case "shipment":
      return { heading: "What would you like to know about this shipment?", prompts: ["Where is this vehicle?", "Why is it delayed?", "What's the ETA?", "Show documents", "Explain the timeline"] };
    case "shipments":
      return { heading: "Ask about your shipments", prompts: ["Which shipments are delayed?", "Find shipment by VIN", "Show shipments arriving this week", "Start a shipment"] };
    case "documents":
      return { heading: "Ask about your documents", prompts: ["Which shipments are missing titles?", "Upload a document", "Show rejected documents"] };
    case "payments":
      return { heading: "Ask about payments", prompts: ["What payments are outstanding?", "Which invoices are due this week?", "Show payments for DK-10482"] };
    case "tracking":
      return { heading: "Ask about movement", prompts: ["Which vehicles are currently in transit?", "What's arriving this week?", "Show vessel updates"] };
    case "analytics":
      return { heading: "Ask about performance", prompts: ["Why did pickup time increase?", "Which routes take longest?", "Summarize this month's shipments"] };
    case "chats":
      return { heading: "What do you want to do?", prompts: ["Get a shipping quote", "Check a shipment", "Track a vehicle", "Upload a document", "Ask something else"] };
    default:
      return { heading: "Ask Dockie anything", prompts: ["What needs my attention?", "Which shipments are delayed?", "Start a shipment", "Show outstanding payments"] };
  }
}

const label = (s: Shipment) => `${vehicleName(s.vehicle)} · ${s.id}`;
const text = (t: string): Part => ({ kind: "text", text: t });

function findShipment(q: string, env: Env) {
  const id = q.match(/DK-?\d{5}/i)?.[0].toUpperCase().replace(/^DK-?/, "DK-");
  if (id) return env.shipments.find((s) => s.id === id);
  const vin = q.match(/\b[A-HJ-NPR-Z0-9]{6,17}\b/i)?.[0].toUpperCase();
  if (vin && /\d/.test(vin)) return env.shipments.find((s) => s.vehicle.vin.endsWith(vin) || s.vehicle.vin === vin);
  const model = env.shipments.find((s) => q.toLowerCase().includes(s.vehicle.model.toLowerCase()));
  return model;
}

function picker(prompt: string, env: Env, intent: string, filter?: (s: Shipment) => boolean): Part[] {
  const list = env.shipments.filter(filter ?? ((s) => s.status !== "delivered")).slice(0, 4);
  return [
    { kind: "choices", prompt, options: [...list.map((s) => ({ label: label(s), command: `pick:${s.id}:${intent}` })), { label: "Search", href: "/shipments" }] },
  ];
}

/** Build the confirmation for a change (PRD §25: what, where, from, to, consequence, action). */
function proposeChange(s: Shipment, type: "change_destination" | "update_pickup", env: Env): Part[] {
  if (!can(env.role, "shipments.edit")) {
    // PERMISSION_DENIED
    return [text("You don't have permission to change this shipment. Ask your organization admin for Operations access."), { kind: "choices", options: [{ label: "View shipment", href: `/shipments/${s.id}` }] }];
  }
  if (type === "change_destination") {
    const to = s.destination.startsWith("Lagos") ? "Accra, Ghana" : "Lagos, Nigeria";
    return [
      text(`I can change the destination from ${s.destination.split(",")[0]} to ${to.split(",")[0]}. Would you like me to make that change?`),
      {
        kind: "action",
        state: "pending",
        action: { type, title: "Change destination?", targetId: s.id, targetLabel: label(s), field: "Destination", from: s.destination, to, consequence: "This may affect pricing and routing.", confirmLabel: "Confirm change" },
      },
    ];
  }
  const to = s.origin.startsWith("Baltimore") ? "Newark, NJ" : "Baltimore, MD";
  return [
    text(`I can update the pickup location to ${to}. Please confirm.`),
    {
      kind: "action",
      state: "pending",
      action: { type, title: "Update pickup location?", targetId: s.id, targetLabel: label(s), field: "Pickup", from: s.origin, to, consequence: "This may affect the shipping quote.", confirmLabel: "Confirm update" },
    },
  ];
}

function aboutShipment(s: Shipment, q: string, env: Env): Part[] | null {
  const docs = env.documents.filter((d) => d.shipmentId === s.id);
  if (/why|delay|late|explain the delay/.test(q)) {
    if (!s.delayReason && s.eta.kind !== "delayed") return [text(`${s.id} isn't delayed. It's ${shipmentStatus[s.status].label.toLowerCase()} and on track for ${s.eta.date ? formatDate(s.eta.date) : "its estimated date"}.`)];
    return [
      text(s.delayReason ?? "The ETA moved because the vehicle is waiting at the port."),
      { kind: "choices", options: [{ label: "Show timeline", send: "Explain the timeline" }, { label: "Explain the delay", send: "What caused the title delay?" }, { label: "Ask another question", command: "prompts" }] },
    ];
  }
  if (/title delay|caused/.test(q)) {
    return [text("Auctions release titles after payment clears, usually in 3–7 days. This title has been pending for 11 days. Operations has chased the auction; uploading the title yourself is the fastest fix if you already have it."), { kind: "choices", options: [{ label: "Upload title", href: `/documents?upload=${s.id}` }, { label: "Contact operations", send: "Contact operations" }] }];
  }
  if (/where|location|now/.test(q)) {
    // Information vs. Missing information (PRD §27)
    if (!s.location.available)
      return [text(`I don't have a current location update for this shipment. The last known location was ${s.location.label} on ${formatDate(s.location.updatedAt)}.`), { kind: "note", text: "DATA_STALE · Port systems update when the vehicle is moved." }];
    return [text(`Your vehicle is currently at ${s.location.label}. The last update was ${timeAgo(s.location.updatedAt)} from ${s.location.source}.`)];
  }
  if (/eta|arriv|when/.test(q)) {
    if (s.eta.kind === "unknown" || !s.eta.date) return [text("There's no ETA yet. I'll estimate one as soon as the vehicle is picked up.")];
    if (s.eta.kind === "delivered") return [text(`It was delivered on ${formatDate(s.eta.date)}.`)];
    return [
      text(`The current estimated arrival is ${formatDate(s.eta.date, { month: "long", day: "numeric" })}.${s.eta.kind === "delayed" && s.eta.previousDate ? ` That's later than the original ${formatDate(s.eta.previousDate)}.` : ""}`),
      { kind: "note", text: "This is an AI-generated estimate and may change." },
    ];
  }
  if (/document|paper|title/.test(q)) {
    return [text(`${s.id} has ${docs.length} documents.`), { kind: "documents", ids: docs.map((d) => d.id) }, { kind: "choices", prompt: "What would you like to do?", options: [{ label: "Upload title", href: `/documents?upload=${s.id}` }, { label: "View tracking", href: `/tracking?id=${s.id}` }, { label: "Change shipment", send: "Change destination" }, { label: "Contact operations", send: "Contact operations" }] }];
  }
  if (/timeline|history|happened/.test(q)) {
    const recent = [...s.events].slice(0, 3);
    return [text(`Here's what happened most recently:\n${recent.map((e) => `• ${formatDate(e.at)} — ${e.title}${e.location ? `, ${e.location}` : ""}`).join("\n")}`), { kind: "choices", options: [{ label: "Open full timeline", href: `/shipments/${s.id}?tab=tracking` }] }];
  }
  if (/destination/.test(q) || /change shipment/.test(q)) return proposeChange(s, "change_destination", env);
  if (/pickup/.test(q) && /change|update|move/.test(q)) return proposeChange(s, "update_pickup", env);
  if (/payment|invoice|owe/.test(q)) {
    const ps = env.payments.filter((p) => p.shipmentId === s.id);
    return [text(`${ps.length} invoices for ${s.id}.`), { kind: "payments", ids: ps.map((p) => p.id) }];
  }
  return null;
}

// ---------- New shipment flow (PRD §22–23) ----------
const DECODED = { year: 2020, make: "Honda", model: "Pilot", trim: "EX-L", vin: "5FNYF6H59LB041278" };

function startNewShipment(env: Env): { parts: Part[]; flow: Flow } {
  if (!can(env.role, "shipments.create")) return { parts: [text("You don't have permission to create shipments. Ask your organization admin for access.")], flow: null };
  return {
    parts: [text("Let's move a vehicle. What vehicle are you moving?"), { kind: "vin-input" }, { kind: "choices", options: [{ label: "Search vehicle", command: "ns:vin:5FNYF6H59LB041278" }, { label: "I'll provide details", command: "ns:details" }] }],
    flow: { name: "new_shipment", step: "vin" },
  };
}

function continueFlow(flow: NonNullable<Flow>, input: string): { parts: Part[]; flow: Flow } {
  const f = { ...flow };
  if (f.step === "vin") {
    if (input === "ns:details") return { parts: [text("Sure — tell me the year, make and model. For example: 2020 Honda Pilot.")], flow: f };
    return { parts: [text("I found:"), { kind: "vehicle", vehicle: DECODED }], flow: { ...f, step: "vehicle" } };
  }
  if (f.step === "vehicle") {
    if (input === "ns:edit") return { parts: [text("No problem. Enter the VIN again, or tell me the year, make and model."), { kind: "vin-input" }], flow: { ...f, step: "vin" } };
    return {
      parts: [{ kind: "choices", prompt: "Where is the vehicle being picked up?", options: [{ label: "Manheim New Jersey", command: "ns:pickup:Manheim New Jersey, Bordentown NJ" }, { label: "Copart Newark", command: "ns:pickup:Copart Newark, NJ" }] }, { kind: "note", text: "Or type an address." }],
      flow: { ...f, step: "pickup" },
    };
  }
  if (f.step === "pickup") {
    const pickup = input.replace(/^ns:pickup:/, "");
    return {
      parts: [{ kind: "choices", prompt: "Where is it going?", options: [{ label: "Lagos, Nigeria", command: "ns:dest:Lagos, Nigeria" }, { label: "Accra, Ghana", command: "ns:dest:Accra, Ghana" }, { label: "Cotonou, Benin", command: "ns:dest:Cotonou, Benin" }] }],
      flow: { ...f, step: "destination", pickup },
    };
  }
  if (f.step === "destination") {
    const destination = input.replace(/^ns:dest:/, "");
    return {
      parts: [{ kind: "choices", prompt: "How should we ship it?", options: [{ label: "RoRo (drive-on vessel)", command: "ns:method:RoRo" }, { label: "Shared container", command: "ns:method:Shared container" }, { label: "Exclusive container", command: "ns:method:Exclusive container" }] }],
      flow: { ...f, step: "requirements", destination },
    };
  }
  if (f.step === "requirements") {
    const method = input.replace(/^ns:method:/, "");
    const price = method === "RoRo" ? 4350 : method === "Shared container" ? 4900 : 6800;
    return {
      parts: [
        text("Here's your quote."),
        {
          kind: "quote",
          lines: [
            ["Vehicle", `${DECODED.year} ${DECODED.make} ${DECODED.model} ${DECODED.trim}`],
            ["Pickup", f.pickup ?? ""],
            ["Destination", f.destination ?? ""],
            ["Method", method],
            ["Transit", "30–34 days · ETA Nov 2"],
          ],
          total: formatMoney(price),
        },
        {
          kind: "action",
          state: "pending",
          action: {
            type: "create_shipment",
            title: "Create this shipment?",
            targetId: "DK-10520",
            targetLabel: `${DECODED.year} ${DECODED.make} ${DECODED.model} · new booking`,
            to: `${f.pickup} → ${f.destination} · ${method}`,
            consequence: `You'll be invoiced ${formatMoney(price)} after pickup.`,
            confirmLabel: "Create shipment",
          },
        },
      ],
      flow: { ...f, step: "confirm", method },
    };
  }
  return { parts: [], flow: null };
}

// ---------- Main entry ----------
export function respond(input: string, ctx: DockieContext, env: Env, flow: Flow): { parts: Part[]; flow: Flow } {
  const q = input.toLowerCase().trim();

  // Structured commands from agentic UI
  if (flow && (input.startsWith("ns:") || flow.step === "pickup" || (flow.step === "vin" && input.length > 3))) {
    return continueFlow(flow, input);
  }
  if (input.startsWith("pick:")) {
    const [, id, intent] = input.split(":");
    const s = env.shipments.find((x) => x.id === id)!;
    if (intent === "change_destination") return { parts: proposeChange(s, "change_destination", env), flow };
    return { parts: aboutShipment(s, intent, env) ?? [text(`${label(s)} is ${shipmentStatus[s.status].label.toLowerCase()}.`)], flow };
  }

  if (/start.*shipment|new shipment|move a vehicle|ship a (car|vehicle)|get a (shipping )?quote/.test(q)) return startNewShipment(env);

  // Object-scoped questions: explicit mention wins, otherwise page context
  const mentioned = findShipment(input, env);
  const scoped = mentioned ?? (ctx.kind === "shipment" ? env.shipments.find((s) => s.id === ctx.id) : undefined);
  if (scoped) {
    const a = aboutShipment(scoped, q, env);
    if (a) return { parts: mentioned && ctx.kind !== "shipment" ? [...a, { kind: "choices", options: [{ label: "Open shipment", href: `/shipments/${scoped.id}` }] }] : a, flow };
    if (mentioned) return { parts: [text(`${label(scoped)} is ${shipmentStatus[scoped.status].label.toLowerCase()}.`), { kind: "shipments", ids: [scoped.id] }], flow };
  }

  // Org-level questions
  if (/attention|what('s| is) happening|summary/.test(q)) {
    const issues = env.shipments.filter((s) => s.status === "issue_reported" || s.eta.kind === "delayed");
    const titles = env.documents.filter((d) => d.type === "Title" && (d.status === "required" || d.status === "rejected"));
    const due = env.payments.filter((p) => p.status === "outstanding" || p.status === "overdue");
    return {
      parts: [text(`${issues.length} shipment needs attention, ${titles.length} titles are missing and ${due.length} payments are due.`), { kind: "shipments", ids: issues.map((s) => s.id) }, { kind: "choices", options: [{ label: "Review documents", href: "/documents?status=required" }, { label: "Review payments", href: "/payments" }] }],
      flow,
    };
  }
  if (/delay|issue|late|stuck/.test(q)) {
    const ids = env.shipments.filter((s) => s.status === "issue_reported" || s.eta.kind === "delayed").map((s) => s.id);
    return { parts: [text(ids.length ? `${ids.length} shipment is delayed.` : "Nothing is delayed right now."), { kind: "shipments", ids }], flow };
  }
  if (/missing title|titles|missing document/.test(q)) {
    const ids = env.documents.filter((d) => d.type === "Title" && (d.status === "required" || d.status === "rejected")).map((d) => d.id);
    return { parts: [text(`${ids.length} shipments are missing a usable title.`), { kind: "documents", ids }, { kind: "choices", options: [{ label: "Upload a title", href: "/documents?upload=1" }] }], flow };
  }
  if (/rejected/.test(q)) {
    const ids = env.documents.filter((d) => d.status === "rejected").map((d) => d.id);
    return { parts: [text(`${ids.length} document was rejected and needs replacing.`), { kind: "documents", ids }], flow };
  }
  if (/upload/.test(q)) return { parts: [text("Which shipment is the document for?"), ...picker("", env, "documents")], flow };
  if (/payment|invoice|owe|outstanding|due/.test(q)) {
    if (!can(env.role, "payments.view")) return { parts: [text("You don't have permission to view payments.")], flow };
    const due = env.payments.filter((p) => p.status !== "paid");
    const total = due.reduce((n, p) => n + p.amount, 0);
    return { parts: [text(`You have ${formatMoney(total)} unpaid across ${due.length} invoices.`), { kind: "payments", ids: due.map((p) => p.id) }], flow };
  }
  if (/in transit|moving|arriving|this week|vessel/.test(q)) {
    const ids = env.shipments.filter((s) => ["in_transit", "in_transit_ocean", "loaded_on_vessel", "picked_up"].includes(s.status)).map((s) => s.id);
    return { parts: [text(/vessel/.test(q) ? "Latest vessel updates:" : `${ids.length} vehicles are moving right now.`), { kind: "shipments", ids }], flow };
  }
  if (/pickup time|pickup.*increase/.test(q)) {
    const [a, b] = [monthlyStats[3], monthlyStats[5]];
    return { parts: [text(`Average purchase → pickup rose from ${a.pickupDays} days in ${a.month} to ${b.pickupDays} days in ${b.month}. Most of the increase came from Savannah pickups waiting on auction title releases.`)], flow };
  }
  if (/route/.test(q)) {
    const r = routeStats[0];
    return { parts: [text(`${r.route} takes longest, averaging ${r.avgDays} days door to door across ${r.shipments} shipments. Newark → Lagos averages 36 days.`)], flow };
  }
  if (/summari[sz]e|this month/.test(q)) return { parts: [text("September: 18 shipments booked (+6% vs August), 2 delivered, 1 issue reported. Average delivery time improved to 36 days.")], flow };
  if (/contact operations|support/.test(q)) return { parts: [text("I've opened a request with operations. They usually reply within an hour, and you'll see the reply in Notifications.")], flow };
  if (/change|update|edit/.test(q)) return { parts: [text("Which shipment?"), ...picker("", env, "change_destination")], flow };
  // AMBIGUOUS_INTENT: an object question with no object
  if (/where|eta|when|document/.test(q)) return { parts: picker("Which shipment?", env, q), flow };
  if (/find.*vin|by vin/.test(q)) return { parts: [text("Type the VIN (or the last 6 characters) and I'll find it.")], flow };
  if (/check a shipment|track a vehicle/.test(q)) return { parts: picker("Which shipment?", env, "where"), flow };

  const { prompts } = promptsFor(ctx);
  return { parts: [text("I can help with shipments, tracking, documents and payments. Try one of these:"), { kind: "choices", options: prompts.map((p) => ({ label: p, send: p })) }], flow };
}

/** Mock voice transcription, contextual to the current page. */
export function mockTranscript(ctx: DockieContext) {
  if (ctx.kind === "shipment") return "Where is this vehicle right now?";
  if (ctx.kind === "payments") return "Which invoices are due this week?";
  return "Which shipments are delayed?";
}
