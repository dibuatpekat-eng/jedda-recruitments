import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const sans = "'DM Sans', sans-serif";

const RESP_PT = [
  "Assist customers in-store — understanding their needs, guiding product selection, and ensuring a considered shopping experience.",
  "Maintain deep familiarity with all current Jedda products, materials, and collection context.",
  "Uphold store visual standards — display arrangement, cleanliness, and overall presentation.",
  "Manage in-store inventory: receiving, organizing, and conducting regular stock checks.",
  "Handle customer inquiries via WhatsApp promptly and in line with the brand's tone.",
  "Maintain and update the customer database, tracking purchase history and preferences to support future clienteling.",
];

const RESP_FT = [
  "Assist customers in-store — understanding their needs, guiding product selection, and ensuring a considered shopping experience.",
  "Maintain deep familiarity with all current Jedda products, materials, and collection context.",
  "Uphold store visual standards — display arrangement, cleanliness, and overall presentation.",
  "Manage in-store inventory: receiving, organizing, and conducting regular stock checks.",
  "Handle all customer communication across channels — WhatsApp, Instagram DMs, and website inquiries — promptly and in line with the brand's tone.",
  "Coordinate and process incoming orders from the website, liaising with relevant parties to ensure smooth fulfillment.",
  "Maintain and update the customer database, tracking purchase history, preferences, and tier status to support personalized clienteling and the upcoming membership program.",
];

function getResponsibilities(workType) {
  if (!workType) return [];
  return workType.toLowerCase().includes("full") ? RESP_FT : RESP_PT;
}

function getDetails(app) {
  const isFull = app.offer_work_type?.toLowerCase().includes("full");
  const rows = [
    ["Position", isFull ? "Sales & Customer Associate" : "Sales Associate"],
    ["Employment Type", app.offer_work_type || "—"],
    ["Schedule", isFull
      ? "4 shift days/week in-store (3 full days, 1 half day) + 5-day customer operations coverage (09.00–17.00 WIB)"
      : "Minimum 3 days per week"],
    ["Start Date", app.offer_start_date || "—"],
    ["Probation Period", isFull ? "2 months" : "None"],
  ];
  if (isFull) {
    rows.push(["Salary During Probation", app.offer_salary_probation || "—"]);
    rows.push(["Salary After Probation", app.offer_salary || "—"]);
  } else {
    rows.push(["Salary", app.offer_salary || "—"]);
  }
  return rows;
}

// ─── Signature Canvas ──────────────────────────────────────────
function SignatureCanvas({ onSign }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const [signed, setSigned] = useState(false);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if (e.touches) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const start = (e) => {
    e.preventDefault();
    drawing.current = true;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e) => {
    e.preventDefault();
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e, canvas);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineWidth = 1.8;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    setSigned(true);
    onSign(null); // clear confirmed state while drawing
  };

  const stop = (e) => {
    e?.preventDefault();
    if (!drawing.current) return;
    drawing.current = false;
    const canvas = canvasRef.current;
    onSign(canvas.toDataURL("image/png"));
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSigned(false);
    onSign(null);
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={560}
        height={120}
        onMouseDown={start}
        onMouseMove={draw}
        onMouseUp={stop}
        onMouseLeave={stop}
        onTouchStart={start}
        onTouchMove={draw}
        onTouchEnd={stop}
        style={{
          width: "100%",
          height: 120,
          border: "1px solid #e8e8e8",
          borderBottom: "1px solid #1a1a1a",
          display: "block",
          cursor: "crosshair",
          touchAction: "none",
          background: "#fafafa",
        }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 200, color: "#bbb", fontFamily: sans }}>
          {signed ? "signature captured" : "draw your signature above"}
        </span>
        {signed && (
          <button onClick={clear} style={{ background: "none", border: "none", fontFamily: sans, fontSize: 10, fontWeight: 300, color: "#bbb", cursor: "pointer", borderBottom: "1px solid #e8e8e8", paddingBottom: 1 }}>
            clear
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Print / Export styles ─────────────────────────────────────
const PRINT_CSS = `
@media print {
  .no-print { display: none !important; }
  body { background: #fff !important; }
  .print-page { max-width: 100% !important; padding: 0 !important; }
}
@page { margin: 18mm 20mm; }
`;

// ─── Main Page ────────────────────────────────────────────────
export default function OfferPage() {
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [phase, setPhase] = useState("offer"); // offer | sign | accepted
  const [signature, setSignature] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr] = useState("");

  const id = new URLSearchParams(window.location.search).get("id");

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@200;300;400&display=swap');
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { background: #f7f7f5; font-family: '${sans}'; }
      ${PRINT_CSS}
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  useEffect(() => {
    if (!id) { setError("Invalid link."); setLoading(false); return; }
    supabase.from("applications").select("*").eq("id", id).maybeSingle()
      .then(({ data, error: err }) => {
        if (err || !data) { setError("Offer not found."); }
        else if (data.offer_accepted_at) { setPhase("accepted"); setApp(data); }
        else if (!data.offer_sent) { setError("This offer is not available yet."); }
        else { setApp(data); }
        setLoading(false);
      });
  }, [id]);

  const handleAccept = async () => {
    if (!signature) return;
    setSubmitting(true);
    setSubmitErr("");
    try {
      const now = new Date().toISOString();
      const { error: err } = await supabase.from("applications").update({
        offer_accepted_at: now,
        offer_signature: signature,
      }).eq("id", id);
      if (err) throw err;
      setApp(prev => ({ ...prev, offer_accepted_at: now }));
      setPhase("accepted");
    } catch (e) {
      setSubmitErr("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: sans }}>
      <p style={{ fontSize: 11, fontWeight: 200, color: "#bbb", letterSpacing: 2 }}>loading...</p>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: sans }}>
      <p style={{ fontSize: 11, fontWeight: 300, color: "#bbb" }}>{error}</p>
    </div>
  );

  const firstName = app.full_name.split(" ")[0];
  const isFull = app.offer_work_type?.toLowerCase().includes("full");
  const roleTitle = isFull ? "Sales & Customer Associate" : "Sales Associate";
  const details = getDetails(app);
  const responsibilities = getResponsibilities(app.offer_work_type);
  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  // ── ACCEPTED ────────────────────────────────────────────────
  if (phase === "accepted") return (
    <div style={{ minHeight: "100vh", background: "#f7f7f5", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: sans, padding: 24 }}>
      <div style={{ textAlign: "center", maxWidth: 360 }}>
        <p style={{ fontSize: 10, letterSpacing: 4, color: "#bbb", marginBottom: 24 }}>JEDDA</p>
        <div style={{ width: 32, height: 1, background: "#ddd", margin: "0 auto 28px" }} />
        <p style={{ fontSize: 15, fontWeight: 300, marginBottom: 12 }}>Welcome to the team.</p>
        <p style={{ fontSize: 12, fontWeight: 200, color: "#999", lineHeight: 1.9 }}>
          Your offer has been accepted.<br />We'll be in touch with the next steps.
        </p>
        <div style={{ height: 40 }} />
        <button onClick={() => window.print()}
          style={{ background: "none", border: "none", fontFamily: sans, fontSize: 11, fontWeight: 300, color: "#aaa", cursor: "pointer", borderBottom: "1px solid #ddd", paddingBottom: 2, letterSpacing: 0.5 }}>
          download / print →
        </button>
      </div>
    </div>
  );

  // ── OFFER DOC ────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#f7f7f5", fontFamily: sans, padding: "40px 24px 80px" }}>
      <div className="print-page" style={{ maxWidth: 640, margin: "0 auto" }}>

        {/* ── Header ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 6 }}>
          <p style={{ fontSize: 10, fontWeight: 400, letterSpacing: 5, color: "#1a1a1a" }}>JEDDA</p>
          <p style={{ fontSize: 9, fontWeight: 200, color: "#bbb" }}>{today}</p>
        </div>
        <div style={{ height: 1, background: "#1a1a1a", marginBottom: 32 }} />

        {/* ── Title block ── */}
        <p style={{ fontSize: 9, fontWeight: 300, letterSpacing: 3, color: "#bbb", marginBottom: 8 }}>JOB OFFER</p>
        <p style={{ fontSize: 24, fontWeight: 300, color: "#1a1a1a", marginBottom: 4 }}>{roleTitle}</p>
        <div style={{ height: 1, background: "#ebebeb", marginBottom: 28 }} />

        {/* ── Salutation ── */}
        <p style={{ fontSize: 13, fontWeight: 300, marginBottom: 12, color: "#1a1a1a" }}>Dear {firstName},</p>
        <p style={{ fontSize: 12, fontWeight: 200, color: "#666", lineHeight: 1.9, marginBottom: 36 }}>
          {isFull
            ? "We're pleased to offer you a position at Jedda. After our conversation, we're confident you'd bring the right energy and capability to the role — and we'd love to welcome you to the team."
            : "We're pleased to offer you a position at Jedda. After our conversation, we're confident you'd bring the right energy and capability to the role — and we'd love to welcome you to the team."
          }
        </p>

        {/* ── Offer Details ── */}
        <Section label="Offer Details">
          {details.map(([lbl, val]) => (
            <DetailRow key={lbl} label={lbl} value={val} />
          ))}
        </Section>

        {/* ── Responsibilities ── */}
        <Section label="Responsibilities">
          {responsibilities.map((r, i) => (
            <div key={i} style={{ display: "flex", gap: 14, padding: "10px 0", borderBottom: "1px solid #f0f0f0" }}>
              <span style={{ fontSize: 10, color: "#ccc", flexShrink: 0, paddingTop: 1 }}>—</span>
              <p style={{ fontSize: 12, fontWeight: 200, color: "#555", lineHeight: 1.8 }}>{r}</p>
            </div>
          ))}
        </Section>

        {/* ── Closing ── */}
        <div style={{ height: 1, background: "#ebebeb", margin: "32px 0 24px" }} />
        <p style={{ fontSize: 12, fontWeight: 200, color: "#666", lineHeight: 1.9, marginBottom: 40 }}>
          Please review this offer carefully. If you'd like to accept, sign below — your digital signature will be recorded along with the timestamp of your acceptance. You can also download or print this document for your records.
        </p>

        {/* ── Signatures ── */}
        {phase === "offer" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, marginBottom: 40 }}>
            {/* Jedda side */}
            <div>
              <p style={{ fontSize: 9, fontWeight: 300, letterSpacing: 2, color: "#bbb", marginBottom: 12 }}>JEDDA</p>
              <div style={{ height: 1, background: "#1a1a1a", marginBottom: 10 }} />
              <p style={{ fontSize: 11, fontWeight: 400, color: "#1a1a1a", marginBottom: 3 }}>Agif</p>
              <p style={{ fontSize: 10, fontWeight: 200, color: "#999" }}>Brand Director</p>
            </div>
            {/* Candidate side */}
            <div>
              <p style={{ fontSize: 9, fontWeight: 300, letterSpacing: 2, color: "#bbb", marginBottom: 12 }}>CANDIDATE</p>
              <SignatureCanvas onSign={setSignature} />
              <p style={{ fontSize: 10, fontWeight: 200, color: "#bbb", marginTop: 8 }}>{app.full_name}</p>
            </div>
          </div>
        )}

        {/* ── Accept CTA ── */}
        {phase === "offer" && (
          <div className="no-print" style={{ borderTop: "1px solid #f0f0f0", paddingTop: 28, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 12 }}>
            {submitErr && <p style={{ fontSize: 11, color: "#c47a5a", fontWeight: 300 }}>{submitErr}</p>}
            {!signature && (
              <p style={{ fontSize: 11, fontWeight: 200, color: "#bbb" }}>please sign above to accept</p>
            )}
            <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
              <button
                onClick={handleAccept}
                disabled={!signature || submitting}
                style={{
                  background: signature ? "#1a1a1a" : "#e8e8e8",
                  border: "none", color: signature ? "#fff" : "#bbb",
                  fontFamily: sans, fontSize: 11, fontWeight: 300,
                  padding: "12px 28px", cursor: signature ? "pointer" : "default",
                  letterSpacing: 1, transition: "all 0.2s",
                }}>
                {submitting ? "confirming..." : "accept offer →"}
              </button>
              <button
                onClick={() => window.print()}
                style={{ background: "none", border: "none", fontFamily: sans, fontSize: 11, fontWeight: 300, color: "#bbb", cursor: "pointer", borderBottom: "1px solid #e8e8e8", paddingBottom: 1, letterSpacing: 0.5 }}>
                print / download
              </button>
            </div>
          </div>
        )}

        {/* ── Confidential footer ── */}
        <div style={{ marginTop: 60, borderTop: "1px solid #f0f0f0", paddingTop: 16, textAlign: "center" }}>
          <p style={{ fontSize: 9, fontWeight: 200, color: "#ccc", letterSpacing: 2 }}>
            CONFIDENTIAL — PLEASE DO NOT SHARE OR DISTRIBUTE
          </p>
        </div>
      </div>
    </div>
  );
}

function Section({ label, children }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <p style={{ fontSize: 9, fontWeight: 300, letterSpacing: 3, color: "#bbb", marginBottom: 10 }}>{label.toUpperCase()}</p>
      <div style={{ height: 1, background: "#1a1a1a", marginBottom: 4 }} />
      {children}
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 16, padding: "11px 0", borderBottom: "1px solid #f0f0f0", alignItems: "start" }}>
      <p style={{ fontSize: 9, fontWeight: 300, color: "#aaa", letterSpacing: 1, paddingTop: 1 }}>{label.toUpperCase()}</p>
      <p style={{ fontSize: 12, fontWeight: 300, color: "#1a1a1a", lineHeight: 1.7 }}>{value}</p>
    </div>
  );
}
