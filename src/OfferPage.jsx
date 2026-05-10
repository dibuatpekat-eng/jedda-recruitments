import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase.js";

const sans = "'DM Sans', sans-serif";

const ZONES_PT = [
  { icon: "store", title: "in-store", sub: "Your home base", items: ["Welcome and assist customers", "Guide product selection", "Maintain display & visual standards", "Stock & inventory management"] },
  { icon: "comms", title: "customer comms", sub: "WhatsApp channel", items: ["Handle customer inquiries", "Reply in Jedda's tone", "Follow up when needed"] },
  { icon: "database", title: "customer database", sub: "Know your regulars", items: ["Log purchase history", "Track preferences", "Lay groundwork for membership tiers"] },
];

const ZONES_FT = [
  { icon: "store", title: "in-store", sub: "3 days / week", items: ["Welcome and assist customers", "Guide product selection", "Maintain display & visual standards", "Stock & inventory management"] },
  { icon: "comms", title: "digital comms", sub: "WhatsApp · Instagram DM", items: ["Handle all inbound customer messages", "Reply in Jedda's tone across channels", "Coordinate with the team when needed"] },
  { icon: "orders", title: "website orders", sub: "Order coordination", items: ["Process incoming web orders", "Coordinate with the distribution team", "Keep customers informed on status"] },
  { icon: "database", title: "customer database", sub: "Know your VIPs", items: ["Log purchase history & preferences", "Maintain customer profiles", "Prepare for membership & tier rollout"] },
];

const CONN_PT = [
  { node: "customers", label: "walk-ins · WhatsApp", dir: "in" },
  { node: "store team", label: "day-to-day coordination", dir: "out" },
];

const CONN_FT = [
  { node: "customers", label: "store · DM · WhatsApp · web", dir: "in" },
  { node: "distribution", label: "order fulfillment", dir: "out" },
  { node: "store team", label: "day-to-day", dir: "out" },
];

const ICON_SVG = {
  store: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="8" width="16" height="10" rx="1"/><path d="M2 8l2-5h12l2 5"/><path d="M7 18v-5h6v5"/></svg>`,
  comms: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H6l-4 3V5a1 1 0 0 1 1-1z"/></svg>`,
  orders: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="14" height="14" rx="1"/><path d="M7 7h6M7 10h6M7 13h4"/></svg>`,
  database: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="10" cy="5" rx="7" ry="2.5"/><path d="M3 5v5c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V5"/><path d="M3 10v5c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-5"/></svg>`,
};

function getMode(workType = "") {
  const w = workType.toLowerCase();
  if (w.includes("/")) return "both";
  if (w.includes("full")) return "ft";
  return "pt";
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@200;300;400&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:#f5f5f3;font-family:'DM Sans',sans-serif;color:#1a1a1a;min-height:100%}
.topbar{background:#fff;border-bottom:1px solid #ebebeb;position:sticky;top:0;z-index:100}
.topbar-inner{max-width:720px;margin:0 auto;padding:0 48px;display:flex;justify-content:space-between;align-items:center}
.doc{max-width:720px;margin:0 auto;padding:0 48px 80px}
.section{margin-bottom:44px}
.eyebrow{font-size:8px;font-weight:300;letter-spacing:3px;color:#bbb;margin-bottom:10px;text-transform:uppercase}
.rule-dark{height:1px;background:#1a1a1a;margin-bottom:0}
.rule-light{height:1px;background:#ebebeb}
.detail-grid{border-top:1px solid #f0f0f0}
.detail-row{display:grid;grid-template-columns:160px 1fr;gap:16px;padding:12px 0;border-bottom:1px solid #f0f0f0}
.detail-label{font-size:8px;font-weight:300;color:#aaa;letter-spacing:1.5px;padding-top:2px;text-transform:uppercase}
.detail-value{font-size:12px;font-weight:300;color:#1a1a1a;line-height:1.7}
.week-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin:20px 0 12px}
.day-cell{border-radius:3px;padding:12px 4px;text-align:center}
.day-name{font-size:8px;font-weight:300;letter-spacing:1px;margin-bottom:8px;text-transform:uppercase}
.schedule-note{font-size:10px;font-weight:200;color:#aaa;line-height:1.8;margin-top:4px}
.zones{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:20px 0 0}
.zones.three{grid-template-columns:repeat(3,1fr)}
.zone-card{border:1px solid #ebebeb;border-radius:3px;padding:20px 22px;cursor:pointer;transition:border-color 0.15s,background 0.15s}
.zone-card:hover{border-color:#ccc}
.zone-card.open{border-color:#1a1a1a;background:#fafafa}
.zone-icon{color:#bbb;margin-bottom:14px;display:block;line-height:1;transition:color 0.15s}
.zone-card.open .zone-icon{color:#1a1a1a}
.zone-title{font-size:12px;font-weight:400;color:#1a1a1a;margin-bottom:4px}
.zone-sub{font-size:9px;font-weight:200;color:#bbb;letter-spacing:0.5px}
.zone-items{margin-top:14px;border-top:1px solid #f0f0f0;padding-top:14px}
.zone-item{font-size:11px;font-weight:200;color:#555;line-height:1.9;display:flex;gap:10px;margin-bottom:2px}
.zone-item::before{content:"—";color:#ccc;flex-shrink:0}
.conn-box{margin-top:16px;padding:20px 24px;background:#fafafa;border:1px solid #f0f0f0;border-radius:3px}
.conn-node{font-size:10px;font-weight:300;color:#1a1a1a;padding:7px 14px;border:1px solid #ddd;background:#fff;border-radius:2px;white-space:nowrap}
.conn-node.you{background:#1a1a1a;color:#fff;border-color:#1a1a1a;font-weight:400}
.conn-line{flex:1;height:1px;background:#e0e0e0;min-width:16px}
.conn-arrow{font-size:9px;color:#ccc;padding:0 3px}
canvas{display:block;width:100%;height:100px;background:#fafafa;border:1px solid #e8e8e8;border-bottom:1.5px solid #1a1a1a;cursor:crosshair;touch-action:none;border-radius:2px 2px 0 0}
.btn-accept{background:#e8e8e8;border:none;color:#bbb;font-family:'DM Sans',sans-serif;font-size:10px;font-weight:300;padding:12px 28px;cursor:default;letter-spacing:1.5px;transition:all 0.2s;border-radius:2px}
.btn-accept.on{background:#1a1a1a;color:#fff;cursor:pointer}
.btn-print{background:none;border:none;border-bottom:1px solid #ddd;font-family:'DM Sans',sans-serif;font-size:10px;font-weight:300;color:#bbb;cursor:pointer;padding-bottom:2px;letter-spacing:1px}
.cta-row{display:flex;align-items:center;gap:24px;border-top:1px solid #f0f0f0;padding-top:28px;flex-wrap:wrap}
.confirm-check{display:flex;align-items:flex-start;gap:12px;padding:16px;background:#fafafa;border:1px solid #ebebeb;border-radius:3px;cursor:pointer;transition:border-color 0.15s;user-select:none;margin-bottom:28px}
.confirm-check:hover{border-color:#ccc}
.confirm-check.checked{border-color:#1a1a1a;background:#fff}
.typed-sig{width:100%;background:transparent;border:none;border-bottom:1px solid #e8e8e8;padding:10px 0;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:300;font-style:italic;color:#1a1a1a;outline:none;transition:border-color 0.2s}
.typed-sig:focus{border-bottom-color:#1a1a1a}
.typed-sig::placeholder{color:#ccc;font-style:normal}
@media print{
  @page{size:A4 portrait;margin:22mm 20mm 22mm 20mm}
  .topbar,.cta-row,.no-print,.btn-print,.conn-box,.zones{display:none!important}
  .print-show{display:block!important}
  .doc{padding:0;max-width:100%;margin:0}
  body,html{background:#fff;font-size:11px}
  .detail-row{break-inside:avoid;page-break-inside:avoid}
  .print-role-block{break-inside:avoid;page-break-inside:avoid}
  .print-schedule-row{break-inside:avoid;page-break-inside:avoid}
  .print-section{break-inside:avoid;page-break-inside:avoid}
  .print-sig{break-inside:avoid;page-break-inside:avoid}
  h1,h2,p{orphans:3;widows:3}
}
`;

function WeekSchedule({ mode }) {
  const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const closed = (n) => n === "Wed";
  return (
    <div style={{ marginTop: 20 }}>
      <div className="week-grid">
        {days.map(n => (
          <div key={n} className="day-cell" style={{ border: `1px ${closed(n) ? "solid #f0f0f0" : "dashed #e0e0e0"}`, background: closed(n) ? "#fff" : "#fafafa" }}>
            <p className="day-name" style={{ color: closed(n) ? "#ddd" : "#aaa" }}>{n}</p>
            <p style={{ fontSize: 8, fontWeight: 200, color: closed(n) ? "#e8e8e8" : "#ccc" }}>{closed(n) ? "closed" : mode === "pt" ? "any 3" : "pick"}</p>
          </div>
        ))}
      </div>
      {mode === "ft" && (
        <div style={{ margin: "14px 0 10px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div style={{ padding: "12px 14px", border: "1px solid #ebebeb", borderRadius: 3 }}>
            <p style={{ fontSize: 8, fontWeight: 300, letterSpacing: 1.5, color: "#bbb", marginBottom: 4, textTransform: "uppercase" }}>store shifts</p>
            <p style={{ fontSize: 12, fontWeight: 300, color: "#1a1a1a" }}>3 full days + 1 half day</p>
            <p style={{ fontSize: 10, fontWeight: 300, color: "#aaa", marginTop: 2 }}>10.00–17.00 · half day flexible</p>
          </div>
          <div style={{ padding: "12px 14px", border: "1px solid #ebebeb", borderRadius: 3 }}>
            <p style={{ fontSize: 8, fontWeight: 300, letterSpacing: 1.5, color: "#bbb", marginBottom: 4, textTransform: "uppercase" }}>customer experience</p>
            <p style={{ fontSize: 12, fontWeight: 300, color: "#1a1a1a" }}>weekdays · remote</p>
            <p style={{ fontSize: 10, fontWeight: 300, color: "#aaa", marginTop: 2 }}>DM · WhatsApp · order handling</p>
          </div>
        </div>
      )}
      <p className="schedule-note">
        {mode === "pt"
          ? "You choose any 3 days per week — agreed with the team. Shift hours are 10.00–17.00. Store is closed on Wednesdays."
          : "You choose 3 full days (10.00–17.00) + 1 half day for store shifts — any days except Wednesday. Customer experience work is handled remotely on weekdays."}
      </p>
    </div>
  );
}

function ZoneCard({ zone, open, onToggle }) {
  return (
    <div className={`zone-card${open ? " open" : ""}`} onClick={onToggle}>
      <span className="zone-icon" dangerouslySetInnerHTML={{ __html: ICON_SVG[zone.icon] }} />
      <p className="zone-title">{zone.title}</p>
      <p className="zone-sub">{zone.sub}</p>
      {open && (
        <div className="zone-items">
          {zone.items.map((it, i) => <div key={i} className="zone-item">{it}</div>)}
        </div>
      )}
    </div>
  );
}

function ConnDiagram({ conn }) {
  const ins = conn.filter(c => c.dir === "in");
  const outs = conn.filter(c => c.dir === "out");
  const NODE_H = 52;
  const youH = Math.max(ins.length, outs.length) * NODE_H;
  return (
    <div className="conn-box">
      <p style={{ fontSize: 7, fontWeight: 300, letterSpacing: 3, color: "#ccc", marginBottom: 18, textTransform: "uppercase" }}>who you work with</p>
      <div style={{ display: "flex", alignItems: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 120 }}>
          {ins.map((c, i) => (
            <div key={i} style={{ height: NODE_H, display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div className="conn-node">{c.node}</div>
              <p style={{ fontSize: 8, fontWeight: 200, color: "#bbb", marginTop: 3 }}>{c.label}</p>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {ins.map((_, i) => (
            <div key={i} style={{ height: NODE_H, display: "flex", alignItems: "center" }}>
              <div className="conn-line" style={{ minWidth: 20 }} />
              <span className="conn-arrow">→</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", height: youH }}>
          <div className="conn-node you">you</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {outs.map((_, i) => (
            <div key={i} style={{ height: NODE_H, display: "flex", alignItems: "center" }}>
              <span className="conn-arrow">→</span>
              <div className="conn-line" style={{ minWidth: 20 }} />
            </div>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 120 }}>
          {outs.map((c, i) => (
            <div key={i} style={{ height: NODE_H, display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div className="conn-node">{c.node}</div>
              <p style={{ fontSize: 8, fontWeight: 200, color: "#bbb", marginTop: 3 }}>{c.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SigCanvas({ onSign, onClear }) {
  const ref = useRef(null);
  const drawing = useRef(false);
  const [signed, setSigned] = useState(false);

  const getPos = (e) => {
    const rect = ref.current.getBoundingClientRect();
    const sx = ref.current.width / rect.width, sy = ref.current.height / rect.height;
    if (e.touches) return { x: (e.touches[0].clientX - rect.left) * sx, y: (e.touches[0].clientY - rect.top) * sy };
    return { x: (e.clientX - rect.left) * sx, y: (e.clientY - rect.top) * sy };
  };
  const start = e => { e.preventDefault(); drawing.current = true; const p = getPos(e); const ctx = ref.current.getContext("2d"); ctx.beginPath(); ctx.moveTo(p.x, p.y); };
  const draw = e => {
    e.preventDefault(); if (!drawing.current) return;
    const p = getPos(e); const ctx = ref.current.getContext("2d");
    ctx.lineTo(p.x, p.y); ctx.strokeStyle = "#1a1a1a"; ctx.lineWidth = 1.8; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.stroke();
    if (!signed) { setSigned(true); onSign(null); }
  };
  const stop = e => { e?.preventDefault(); if (!drawing.current) return; drawing.current = false; onSign(ref.current.toDataURL("image/png")); };
  const clear = () => { ref.current.getContext("2d").clearRect(0, 0, ref.current.width, ref.current.height); setSigned(false); onClear(); };

  return (
    <div>
      <canvas ref={ref} width={560} height={100}
        onMouseDown={start} onMouseMove={draw} onMouseUp={stop} onMouseLeave={stop}
        onTouchStart={start} onTouchMove={draw} onTouchEnd={stop}
      />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
        <span style={{ fontSize: 9, fontWeight: 200, color: "#bbb" }}>{signed ? "signature captured" : "draw your signature above"}</span>
        {signed && <button onClick={clear} style={{ background: "none", border: "none", borderBottom: "1px solid #e0e0e0", fontFamily: sans, fontSize: 9, fontWeight: 300, color: "#bbb", cursor: "pointer", paddingBottom: 1 }}>clear</button>}
      </div>
    </div>
  );
}

export default function OfferPage() {
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [phase, setPhase] = useState("offer");
  const [activeMode, setActiveMode] = useState(null);
  const [openZone, setOpenZone] = useState(null);
  const [drawnSig, setDrawnSig] = useState(null);       // canvas dataUrl
  const [typedSig, setTypedSig] = useState("");          // typed name fallback
  const [confirmed, setConfirmed] = useState(false);     // acceptance checkbox
  const [sigDataUrl, setSigDataUrl] = useState(null);    // stored for print doc
  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr] = useState("");
  const [readOnly, setReadOnly] = useState(false);

  const id = new URLSearchParams(window.location.search).get("id");

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = CSS;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  useEffect(() => {
    if (!id) { setError("Invalid link."); setLoading(false); return; }
    supabase.from("applications").select("*").eq("id", id).maybeSingle()
      .then(({ data, error: err }) => {
        if (err || !data) { setError("Offer not found."); }
        else if (data.offer_accepted_at) {
          setPhase("accepted");
          setApp(data);
          // restore sigDataUrl if it was a drawn sig (dataUrl starts with "data:")
          if (data.offer_signature?.startsWith("data:")) setSigDataUrl(data.offer_signature);
        }
        else if (!data.offer_sent) { setError("This offer is not available yet."); }
        else { setApp(data); const m = getMode(data.offer_work_type); setActiveMode(m === "both" ? "pt" : m); }
        setLoading(false);
      });
  }, [id]);

  // Derived
  const hasSignature = drawnSig || typedSig.trim().length > 0;
  const canAccept = hasSignature && confirmed;

  const handleAccept = async () => {
    if (!canAccept) return;
    setSubmitting(true);
    try {
      // What to store: prefer drawn dataUrl, else typed name prefixed
      const sigToStore = drawnSig || `[typed] ${typedSig.trim()}`;
      const now = new Date().toISOString();
      const { error: err } = await supabase.from("applications").update({
        offer_accepted_at: now,
        offer_signature: sigToStore,
      }).eq("id", id);
      if (err) throw err;
      // Only store dataUrl for drawn sig (for print doc image)
      setSigDataUrl(drawnSig || null);
      setApp(prev => ({ ...prev, offer_accepted_at: now }));
      setPhase("accepted");
    } catch { setSubmitErr("Something went wrong. Please try again."); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: sans }}><p style={{ fontSize: 11, fontWeight: 300, color: "#bbb", letterSpacing: 2 }}>loading...</p></div>;
  if (error) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: sans }}><p style={{ fontSize: 11, fontWeight: 300, color: "#bbb" }}>{error}</p></div>;

  const rawMode = getMode(app.offer_work_type);
  const isBoth = rawMode === "both";
  const displayMode = isBoth ? activeMode : rawMode;
  const firstName = app.full_name.split(" ")[0];
  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const acceptedDate = app.offer_accepted_at ? new Date(app.offer_accepted_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : today;
  const roleTitle = displayMode === "ft" ? "Sales & Customer Associate" : "Sales Associate";

  const getDetails = (m) => {
    const rows = [];
    if (m === "ft") {
      rows.push(["position", "Sales & Customer Associate"]);
      rows.push(["employment type", "Full-Time"]);
      rows.push(["start date", app.offer_start_date || "—"]);
      rows.push(["probation period", "2 months"]);
      if (app.offer_salary_probation) rows.push(["salary during probation", `IDR ${app.offer_salary_probation} / month`]);
      if (app.offer_salary) rows.push(["salary after probation", app.offer_salary]);
    } else {
      rows.push(["position", "Sales Associate"]);
      rows.push(["employment type", "Part-Time"]);
      rows.push(["start date", app.offer_start_date || "—"]);
      rows.push(["probation period", "None"]);
      const ptSal = app.offer_salary_pt || app.offer_salary;
      if (ptSal) rows.push(["salary", `IDR ${ptSal} / month`]);
    }
    return rows;
  };

  const zones = displayMode === "ft" ? ZONES_FT : ZONES_PT;
  const conn = displayMode === "ft" ? CONN_FT : CONN_PT;

  // ── ACCEPTED ─────────────────────────────────────────────
  if (phase === "accepted") return (
    <div style={{ fontFamily: sans }}>
      <div className="no-print" style={{ minHeight: "100vh", background: "#f5f5f3", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ textAlign: "center", maxWidth: 380 }}>
          <p style={{ fontSize: 10, letterSpacing: 5, color: "#bbb", marginBottom: 28, fontWeight: 400 }}>JEDDA</p>
          <div style={{ width: 32, height: 1, background: "#ddd", margin: "0 auto 32px" }} />
          <p style={{ fontSize: 18, fontWeight: 300, marginBottom: 12 }}>You're in.</p>
          <p style={{ fontSize: 12, fontWeight: 300, color: "#999", lineHeight: 2, maxWidth: 320, margin: "0 auto 36px" }}>
            Your signature has been recorded. To finalize your placement, please complete the steps below.
          </p>
          <div style={{ background: "#fff", border: "1px solid #e8e8e8", padding: "24px 28px", textAlign: "left", marginBottom: 28 }}>
            <p style={{ fontSize: 9, fontWeight: 300, letterSpacing: 2, textTransform: "uppercase", color: "#bbb", marginBottom: 16 }}>what to do next</p>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 14 }}>
              <span style={{ fontSize: 9, fontWeight: 400, color: "#ccc", marginTop: 1, flexShrink: 0 }}>01</span>
              <p style={{ fontSize: 12, fontWeight: 300, color: "#555", lineHeight: 1.8 }}>
                Save your signed offer letter as a PDF using the button below.
              </p>
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <span style={{ fontSize: 9, fontWeight: 400, color: "#ccc", marginTop: 1, flexShrink: 0 }}>02</span>
              <p style={{ fontSize: 12, fontWeight: 300, color: "#555", lineHeight: 1.8 }}>
                Send the document to <span style={{ color: "#1a1a1a", fontWeight: 400 }}>jeddawear@gmail.com</span> within 24 hours to confirm your acceptance.
              </p>
            </div>
          </div>
          <button onClick={() => { setTimeout(() => window.print(), 150); }}
            style={{ background: "#1a1a1a", border: "none", color: "#fff", fontFamily: sans, fontSize: 11, fontWeight: 300, padding: "13px 32px", cursor: "pointer", letterSpacing: 1.5, display: "block", width: "100%", marginBottom: 8 }}>
            save signed offer as PDF →
          </button>
          <p style={{ fontSize: 10, fontWeight: 200, color: "#bbb", lineHeight: 1.8, marginBottom: 20 }}>
            choose "Save as PDF" in the print window, then email it to us within 24 hours.
          </p>
          <p style={{ fontSize: 10, fontWeight: 300, color: "#bbb", lineHeight: 1.8 }}>
            Subject: <em>Offer Acceptance — {firstName}</em>
          </p>
          <div style={{ height: 24 }} />
          <button onClick={() => { setReadOnly(true); setPhase("offer"); }}
            style={{ background: "none", border: "none", fontFamily: sans, fontSize: 10, fontWeight: 300, color: "#bbb", cursor: "pointer", letterSpacing: 1, borderBottom: "1px solid #e0e0e0", paddingBottom: 2 }}>
            ← view offer details
          </button>
        </div>
      </div>

      {/* Print doc */}
      <div className="print-show" style={{ display: "none" }}>
        <div className="doc" style={{ padding: "32px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <p style={{ fontSize: 10, fontWeight: 400, letterSpacing: 5 }}>JEDDA</p>
            <p style={{ fontSize: 9, fontWeight: 200, color: "#bbb" }}>{acceptedDate}</p>
          </div>
          <div className="rule-dark" style={{ marginBottom: 24 }} />
          <p className="eyebrow">job offer</p>
          <p style={{ fontSize: 22, fontWeight: 300, marginBottom: 4 }}>{roleTitle}</p>
          <div className="rule-light" style={{ marginBottom: 24 }} />
          <p style={{ fontSize: 13, fontWeight: 300, marginBottom: 10 }}>Dear {firstName},</p>
          <p style={{ fontSize: 12, fontWeight: 300, color: "#666", lineHeight: 1.9, marginBottom: 24 }}>
            We're pleased to offer you a position at Jedda. After our conversation, we're confident you'd bring the right energy and capability to the role — and we'd love to welcome you to the team.
          </p>

          <p className="eyebrow">offer details</p>
          <div className="rule-dark" style={{ marginBottom: 4 }} />
          <div className="detail-grid" style={{ marginBottom: 32 }}>
            {getDetails(rawMode === "both" ? "pt" : rawMode).map(([l, v]) => (
              <div key={l} className="detail-row"><p className="detail-label">{l}</p><p className="detail-value">{v}</p></div>
            ))}
          </div>

          <p className="eyebrow" style={{ marginTop: 28 }}>what you'll do</p>
          <div className="rule-dark" style={{ marginBottom: 16 }} />
          {(rawMode === "both" ? ZONES_PT : rawMode === "ft" ? ZONES_FT : ZONES_PT).map((z, i) => (
            <div key={i} style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 400, color: "#1a1a1a", marginBottom: 6 }}>{z.title.charAt(0).toUpperCase() + z.title.slice(1)}</p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {z.items.map((item, j) => (
                  <li key={j} style={{ fontSize: 11, fontWeight: 300, color: "#555", lineHeight: 1.9, paddingLeft: 12, position: "relative" }}>
                    <span style={{ position: "absolute", left: 0, color: "#ccc" }}>—</span>{item}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <p className="eyebrow print-section" style={{ marginTop: 28 }}>your schedule</p>
          <div className="rule-dark" style={{ marginBottom: 0 }} />
          {rawMode === "ft" || rawMode === "both" ? (
            <>
              <div className="print-schedule-row" style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid #f5f5f5" }}>
                <span style={{ fontSize: 9, fontWeight: 300, color: "#bbb", letterSpacing: 1, textTransform: "uppercase" }}>store shifts</span>
                <span style={{ fontSize: 11, fontWeight: 300, color: "#1a1a1a", textAlign: "right", maxWidth: 320 }}>3 full days (10.00–17.00) + 1 half day, any days except Wednesday</span>
              </div>
              <div className="print-schedule-row" style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid #f5f5f5" }}>
                <span style={{ fontSize: 9, fontWeight: 300, color: "#bbb", letterSpacing: 1, textTransform: "uppercase" }}>customer experience</span>
                <span style={{ fontSize: 11, fontWeight: 300, color: "#1a1a1a", textAlign: "right", maxWidth: 320 }}>Weekdays, remote — DM, WhatsApp, order handling</span>
              </div>
            </>
          ) : (
            <>
              <div className="print-schedule-row" style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid #f5f5f5" }}>
                <span style={{ fontSize: 9, fontWeight: 300, color: "#bbb", letterSpacing: 1, textTransform: "uppercase" }}>shift days</span>
                <span style={{ fontSize: 11, fontWeight: 300, color: "#1a1a1a", textAlign: "right", maxWidth: 320 }}>Any 3 days per week, agreed with the team. Store closed on Wednesdays.</span>
              </div>
              <div className="print-schedule-row" style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid #f5f5f5" }}>
                <span style={{ fontSize: 9, fontWeight: 300, color: "#bbb", letterSpacing: 1, textTransform: "uppercase" }}>shift hours</span>
                <span style={{ fontSize: 11, fontWeight: 300, color: "#1a1a1a", textAlign: "right" }}>10.00 – 17.00</span>
              </div>
            </>
          )}

          <div className="print-sig" style={{ marginTop: 40, paddingTop: 24, borderTop: "1px solid #f0f0f0" }}>
            <p style={{ fontSize: 8, fontWeight: 300, color: "#bbb", marginBottom: 8, letterSpacing: 2, textTransform: "uppercase" }}>your signature</p>
            {sigDataUrl
              ? <img src={sigDataUrl} alt="signature" style={{ height: 80, objectFit: "contain", objectPosition: "left", borderBottom: "1px solid #1a1a1a" }} />
              : <p style={{ fontSize: 18, fontWeight: 300, fontStyle: "italic", borderBottom: "1px solid #1a1a1a", paddingBottom: 8, display: "inline-block", minWidth: 200 }}>
                  {typedSig || app.full_name}
                </p>
            }
            <p style={{ fontSize: 11, fontWeight: 300, marginTop: 8 }}>{app.full_name}</p>
            <p style={{ fontSize: 9, fontWeight: 200, color: "#bbb", marginTop: 3 }}>Signed {acceptedDate}</p>
          </div>
        </div>
      </div>
    </div>
  );

  // ── OFFER ────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: sans }}>
      <div className="topbar">
        <div className="topbar-inner" style={{ padding: "0 48px" }}>
          <span style={{ fontSize: 10, fontWeight: 400, letterSpacing: 6, padding: "20px 0", display: "block" }}>JEDDA</span>
          <span style={{ fontSize: 9, fontWeight: 200, color: "#bbb" }}>{today}</span>
        </div>
        {isBoth && (
          <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 48px" }}>
            <div style={{ display: "flex", borderBottom: "1px solid #ebebeb" }}>
              {[["pt","part-time"],["ft","full-time"]].map(([val, lbl]) => (
                <button key={val} onClick={() => { setActiveMode(val); setOpenZone(null); }}
                  style={{ flex: 1, padding: "11px 0", background: "none", border: "none", fontFamily: sans, fontSize: 9, fontWeight: 300, cursor: "pointer", letterSpacing: 2, color: activeMode === val ? "#1a1a1a" : "#bbb", borderBottom: activeMode === val ? "2px solid #1a1a1a" : "2px solid transparent", marginBottom: -1, transition: "all 0.15s" }}>
                  {lbl}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="doc">
        <div style={{ padding: "40px 0 32px" }}>
          <p className="eyebrow" style={{ marginBottom: 8 }}>job offer</p>
          <p style={{ fontSize: 26, fontWeight: 300, marginBottom: 6, lineHeight: 1.2 }}>{roleTitle}</p>
          <div className="rule-light" />
        </div>

        <div className="section">
          <p style={{ fontSize: 13, fontWeight: 300, marginBottom: 12 }}>Dear {firstName},</p>
          <p style={{ fontSize: 12, fontWeight: 300, color: "#666", lineHeight: 2 }}>
            We're pleased to offer you a position at Jedda. After our conversation, we're confident you'd bring the right energy and capability to the role — and we'd love to welcome you to the team.
          </p>
        </div>

        <div className="section">
          <p className="eyebrow">offer details</p>
          <div className="rule-dark" />
          <div className="detail-grid">
            {getDetails(displayMode).map(([l, v]) => (
              <div key={l} className="detail-row">
                <p className="detail-label">{l}</p>
                <p className="detail-value">{v}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="section">
          <p className="eyebrow">your week</p>
          <div className="rule-dark" />
          <WeekSchedule mode={displayMode} />
        </div>

        <div className="section">
          <p className="eyebrow">your role</p>
          <div className="rule-dark" />
          <p style={{ fontSize: 12, fontWeight: 300, color: "#888", lineHeight: 1.9, margin: "16px 0 18px" }}>
            {displayMode === "ft"
              ? "You own the full customer journey at Jedda — from the moment someone walks into the store, to the DM they send at 9pm, to the order they place online. One person who holds it all together."
              : "You're the face of Jedda in the store. Your focus is the people who walk in, the space they experience, and making sure every interaction feels considered."}
          </p>
          <div className={`zones${zones.length === 3 ? " three" : ""}`}>
            {zones.map((z, i) => (
              <ZoneCard key={`${displayMode}-${i}`} zone={z} open={openZone === i} onToggle={() => setOpenZone(openZone === i ? null : i)} />
            ))}
          </div>
          <ConnDiagram conn={conn} />
        </div>

        <div className="rule-light" style={{ marginBottom: 24 }} />
        <p style={{ fontSize: 12, fontWeight: 300, color: "#666", lineHeight: 2, marginBottom: 40 }}>
          Please review this offer carefully. If you'd like to accept, sign below — your signature will be recorded along with the timestamp.
        </p>

        {readOnly ? (
          <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: 28, marginBottom: 40 }}>
            <p style={{ fontSize: 12, fontWeight: 300, color: "#aaa", lineHeight: 1.9, marginBottom: 20 }}>
              You've already accepted this offer. If you'd like to make any changes, please reach out to us directly.
            </p>
            <button onClick={() => setPhase("accepted")}
              style={{ background: "none", border: "none", fontFamily: sans, fontSize: 10, fontWeight: 300, color: "#bbb", cursor: "pointer", letterSpacing: 1, borderBottom: "1px solid #e0e0e0", paddingBottom: 2 }}>
              ← back
            </button>
          </div>
        ) : (
          <>
            {/* Signature section */}
            <div style={{ marginBottom: 24, maxWidth: 480 }}>
              <p style={{ fontSize: 8, fontWeight: 300, letterSpacing: 2, color: "#bbb", marginBottom: 12, textTransform: "uppercase" }}>your signature</p>
              <SigCanvas onSign={setDrawnSig} onClear={() => setDrawnSig(null)} />

              {/* Typed fallback */}
              <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "16px 0 10px" }}>
                <div style={{ flex: 1, height: 1, background: "#f0f0f0" }} />
                <span style={{ fontSize: 10, fontWeight: 200, color: "#ccc", letterSpacing: 1, whiteSpace: "nowrap" }}>or type your name</span>
                <div style={{ flex: 1, height: 1, background: "#f0f0f0" }} />
              </div>
              <input
                className="typed-sig"
                type="text"
                placeholder="your full name as signature"
                value={typedSig}
                onChange={e => setTypedSig(e.target.value)}
              />
              <p style={{ fontSize: 10, fontWeight: 300, color: "#bbb", marginTop: 8 }}>{app.full_name}</p>
            </div>

            {/* Confirmation checkbox */}
            <div
              className={`confirm-check${confirmed ? " checked" : ""}`}
              onClick={() => setConfirmed(v => !v)}
              style={{ maxWidth: 480 }}
            >
              <div style={{
                width: 16, height: 16, border: `1px solid ${confirmed ? "#1a1a1a" : "#ddd"}`,
                background: confirmed ? "#1a1a1a" : "#fff", flexShrink: 0, marginTop: 1,
                display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s"
              }}>
                {confirmed && (
                  <svg viewBox="0 0 9 7" fill="none" width="8" height="8">
                    <path d="M1 3.5l2.5 2.5L8 1" stroke="white" strokeWidth="1.5"/>
                  </svg>
                )}
              </div>
              <p style={{ fontSize: 12, fontWeight: 300, color: confirmed ? "#1a1a1a" : "#aaa", lineHeight: 1.7, transition: "color 0.15s" }}>
                I've reviewed the offer details and agree to accept this role at Jedda.
              </p>
            </div>

            {/* CTA */}
            <div className="cta-row no-print">
              {submitErr && <p style={{ fontSize: 11, color: "#c47a5a", fontWeight: 300 }}>{submitErr}</p>}
              {!hasSignature && <p style={{ fontSize: 11, fontWeight: 300, color: "#bbb" }}>please sign or type your name above to accept</p>}
              {hasSignature && !confirmed && <p style={{ fontSize: 11, fontWeight: 300, color: "#bbb" }}>please confirm your acceptance above</p>}
              <button className={`btn-accept${canAccept ? " on" : ""}`} disabled={!canAccept || submitting} onClick={handleAccept}>
                {submitting ? "confirming..." : "accept offer →"}
              </button>
              <button className="btn-print" onClick={() => window.print()}>print / save</button>
            </div>
          </>
        )}

        <div style={{ marginTop: 64, borderTop: "1px solid #f0f0f0", paddingTop: 16, textAlign: "center", fontSize: 8, fontWeight: 200, color: "#ccc", letterSpacing: 2, textTransform: "uppercase" }}>
          confidential — please do not share or distribute
        </div>
      </div>
    </div>
  );
}
