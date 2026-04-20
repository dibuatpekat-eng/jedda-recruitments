import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const PASS = import.meta.env.VITE_ADMIN_PASSWORD || "jedda2026";
const sans = "'DM Sans', sans-serif";

// ─── Scoring constants ──────────────────────────────────────
// FIX: correct picks adalah 2, 7, 10 (bukan 2, 6)
const CORRECT_PICKS = [2, 7, 10];
const IDEAL_RANKING = [
  "The quality and construction — the intention behind how it's made",
  "How comfortable it feels to wear",
  "Whether the silhouette and proportions feel right",
  "Whether it feels consistent with the rest of the collection",
  "How it looks in photos",
  "Whether it's on-trend",
];
// FIX: bobot Q1 → 15%, Q4 → 5.5%, Q5 → 9.5%
const WEIGHTS = { q1: 0.15, q2: 0.15, q3: 0.25, q4: 0.055, q5: 0.095, q6: 0.10, q7: 0.20 };

// FIX: scoreQ1 sekarang 3 pilihan — 100/75/40/0
function scoreQ1(visualPicks) {
  if (!visualPicks) return null;
  const picks = visualPicks.split(",").map(s => parseInt(s.trim()));
  const correct = picks.filter(p => CORRECT_PICKS.includes(p)).length;
  if (correct === 3) return 100;
  if (correct === 2) return 75;
  if (correct === 1) return 60;
  return 0;
}

function scoreQ3(rankingStr) {
  if (!rankingStr) return null;
  const items = rankingStr.split(" | ").map(s => s.trim());
  let swaps = 0;
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const idealI = IDEAL_RANKING.indexOf(items[i]);
      const idealJ = IDEAL_RANKING.indexOf(items[j]);
      if (idealI > idealJ) swaps++;
    }
  }
  const trendIdx = items.findIndex(s => s.toLowerCase().includes("on-trend"));
  if (trendIdx <= 1) return 65;
  if (swaps === 0) return 100;
  if (swaps <= 2) return 90;
  if (swaps <= 4) return 80;
  if (swaps <= 7) return 75;
  if (swaps <= 11) return 70;
  return 65;
}

function calcTotal(scores) {
  const keys = ["q1","q2","q3","q4","q5","q6","q7"];
  let weightedSum = 0, totalWeight = 0;
  keys.forEach(k => {
    if (scores[k] != null) {
      weightedSum += scores[k] * WEIGHTS[k];
      totalWeight += WEIGHTS[k];
    }
  });
  if (totalWeight === 0) return null;
  return Math.round((weightedSum / totalWeight) * 10) / 10;
}

// ─── helpers ───────────────────────────────────────────────
function getDivision(pos = "") {
  const p = pos.toLowerCase();
  if (p.includes("designer") || p.includes("design") || p.includes("development")) return "design";
  if (p.includes("visual") || p.includes("content") || p.includes("social") || p.includes("digital") || p.includes("growth")) return "creative";
  if (p.includes("sales")) return "retail";
  return "other";
}
function typeTag(wt = "") {
  const t = wt.toLowerCase();
  if (t.includes("full")) return { label: "full-time", bg: "#f5f0eb", color: "#a0826a" };
  if (t.includes("part")) return { label: "part-time", bg: "#edf0f5", color: "#6a7fa0" };
  if (t.includes("intern")) return { label: "internship", bg: "#edf5ef", color: "#6a9e76" };
  return { label: t || "—", bg: "#f5f5f5", color: "#999" };
}
function statusStyle(s = "") {
  const map = {
    "new":            { bg: "#f5f5f5",  color: "#aaa"    },
    "on hold":        { bg: "#faeeda",  color: "#854f0b" },
    "shortlisted":    { bg: "#e6f1fb",  color: "#185fa5" },
    "evaluating":     { bg: "#f0eaf5",  color: "#6b3fa0" },
    "finalist":       { bg: "#e1f5ee",  color: "#0f6e56" },
    "interview":      { bg: "#f5f0eb",  color: "#a0826a" },
    "rejected":       { bg: "#fcebeb",  color: "#a32d2d" },
    "the final team": { bg: "#1a1a1a",  color: "#fff"    },
    "withdrawn":      { bg: "#f5f5f5",  color: "#aaa"    },
    "referred out":   { bg: "#f0f0f5",  color: "#7a6aaa" },
  };
  return map[s] || { bg: "#f5f5f5", color: "#aaa" };
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@200;300;400;500&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%;background:#f7f7f5}
input::placeholder{color:#ccc}
input:focus{border-color:#1a1a1a!important;outline:none}
.sb-item:hover{background:#fafafa}
.sb-item.active{border-left-color:#1a1a1a!important;background:#fafafa}
.sb-item.active .sb-label{color:#1a1a1a!important;font-weight:400!important}
.sb-item.active .sb-count{color:#888!important;background:#eee!important}
.tr-row:hover{background:#fafafa}
.ar-btn{transition:all 0.15s}
.ar-btn:hover{opacity:0.5}
.ar-primary:hover{opacity:0.4!important}
.ar-danger:hover{color:#8b2a00!important}
.tc-card:hover{border-color:#ccc!important}
.f-btn:hover:not(.f-active){color:#1a1a1a}
.score-input{width:48px;border:none;border-bottom:1px solid #e8e8e4;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:300;color:#1a1a1a;background:transparent;text-align:right;padding:2px 0}
.score-input:focus{outline:none;border-bottom-color:#1a1a1a}
.score-input::-webkit-inner-spin-button{opacity:0}
`;

// ─── Gmail helpers ──────────────────────────────────────────
function openRequestDocEmail(a) {
  window.open(
    `https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(a.email)}&su=Your%20Jedda%20Application%20%E2%80%94%20Portfolio%20Update%20Request&body=Hi%20${encodeURIComponent(a.full_name.split(" ")[0])}%2C%0A%0AWe%E2%80%99re%20currently%20reviewing%20portfolios%20from%20our%20applicants%20%E2%80%94%20however%2C%20we%20weren%E2%80%99t%20able%20to%20open%20yours.%0A%0ACould%20you%20re-share%20it%20via%20the%20link%20below%3F%20You%20can%20upload%20a%20PDF%20or%20paste%20a%20link%20to%20Behance%2C%20Dribbble%2C%20Notion%2C%20or%20Google%20Drive.%0A%0A${encodeURIComponent("https://careers.jeddawear.com/reupload?id="+a.id)}%0A%0APlease%20make%20sure%20the%20link%20is%20accessible%20and%20set%20to%20public%20if%20you%E2%80%99re%20sharing%20via%20Drive%20or%20any%20cloud%20platform.%0A%0A%E2%80%94%20Jedda`,
    "_blank"
  );
}

function openAlignmentTestEmail(a) {
  const link = `https://careers.jeddawear.com/alignment-test?id=${a.id}`;
  const firstName = a.full_name.split(" ")[0];
  const body = `Hi ${firstName},\n\nWe apologize for the delayed response, we received hundreds of applications for the design division alone, far more than we expected.\n\nCongratulations! You are one of the few candidates who made it past our initial review.\n\nBefore the final selection, to narrow down our candidates and find the right fit, there's an alignment test you need to complete. This test is to understand how you see things and whether your instincts align with where Jedda is going.\n\nIt will only take around 10 minutes. You can answer in Bahasa Indonesia or English, whichever feels most natural. It won't affect how we evaluate you.\n\nPlease complete this test within 2 days of receiving this email. Once submitted, the test cannot be resubmitted.\n\n${link}\n\nBest regards,\nJedda`;
  window.open(
    `https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(a.email)}&su=Your%20Next%20Step%20with%20Jedda&body=${encodeURIComponent(body)}`,
    "_blank"
  );
}

// ─── Division Filter Bar ────────────────────────────────────
function DivFilter({ allApps, active, onChange }) {
  return (
    <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
      {["all", "design", "creative", "retail"].map(f => {
        const cnt = f === "all" ? allApps.length : allApps.filter(a => getDivision(a.position) === f).length;
        return (
          <button key={f} className={`f-btn${active === f ? " f-active" : ""}`} onClick={() => onChange(f)}
            style={{ fontSize: 10, fontWeight: 300, color: active === f ? "#fff" : "#bbb", background: active === f ? "#1a1a1a" : "none", border: "none", cursor: "pointer", fontFamily: sans, padding: "5px 12px", borderRadius: 20, transition: "all 0.15s" }}>
            {`${f} (${cnt})`}
          </button>
        );
      })}
    </div>
  );
}

// ─── sub-components ────────────────────────────────────────
function Badge({ wt }) {
  const t = typeTag(wt);
  return <div style={{ display: "flex" }}><span style={{ fontSize: 9, fontWeight: 300, padding: "3px 8px", background: t.bg, color: t.color }}>{t.label}</span></div>;
}
function StatusBadge({ status }) {
  const s = statusStyle(status);
  return <span style={{ fontSize: 9, fontWeight: 300, padding: "3px 8px", background: s.bg, color: s.color, display: "inline-block", letterSpacing: 0.5 }}>{status}</span>;
}
function ArDivider() {
  return <div style={{ width: 1, height: 10, background: "#e8e8e8", margin: "0 10px", flexShrink: 0 }} />;
}
function ArBtn({ label, onClick, cls }) {
  const styles = {
    base: { fontSize: 10, fontWeight: 300, background: "none", border: "none", cursor: "pointer", fontFamily: sans, padding: 0, letterSpacing: 0.3, whiteSpace: "nowrap", color: "#aaa" },
    primary: { color: "#1a1a1a" },
    danger: { color: "#c47a5a" },
  };
  return (
    <button className={`ar-btn ar-${cls || "base"}`} onClick={e => { e.stopPropagation(); onClick(); }} style={{ ...styles.base, ...(styles[cls] || {}) }}>{label}</button>
  );
}
function ActionRow({ actions }) {
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      {actions.map((a, i) => (
        <span key={i} style={{ display: "flex", alignItems: "center" }}>
          {i > 0 && <ArDivider />}
          <ArBtn {...a} />
        </span>
      ))}
    </div>
  );
}
function THead({ cols, children }) {
  return <div style={{ display: "grid", gridTemplateColumns: cols, gap: 12, padding: "9px 18px", background: "#fafafa", borderBottom: "1px solid #f0f0f0" }}>{children}</div>;
}
function TH({ children }) {
  return <span style={{ fontSize: 9, fontWeight: 400, letterSpacing: 2, color: "#bbb", textTransform: "uppercase" }}>{children}</span>;
}
function TRow({ cols, onClick, children }) {
  return (
    <div className="tr-row" onClick={onClick} style={{ display: "grid", gridTemplateColumns: cols, gap: 12, padding: "13px 18px", borderBottom: "1px solid #f5f5f5", alignItems: "center", cursor: "pointer", transition: "background 0.1s" }}>{children}</div>
  );
}
function TName({ name, sub }) {
  return <div><p style={{ fontSize: 13, fontWeight: 400, marginBottom: 2 }}>{name}</p><p style={{ fontSize: 10, fontWeight: 200, color: "#aaa" }}>{sub}</p></div>;
}
function TPos({ children }) {
  return <p style={{ fontSize: 12, fontWeight: 300, color: "#555" }}>{children}</p>;
}
function Tbl({ children }) {
  return <div style={{ background: "#fff", border: "1px solid #f0f0f0" }}>{children}</div>;
}
function Empty({ msg = "nothing here yet" }) {
  return <div style={{ padding: "56px 20px", textAlign: "center", fontSize: 11, fontWeight: 200, color: "#ccc", letterSpacing: 2 }}>{msg}</div>;
}
function DocLink({ url }) {
  if (!url) return <span style={{ fontSize: 11, fontWeight: 200, color: "#ccc" }}>—</span>;
  return <a href={url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ fontSize: 11, fontWeight: 300, color: "#999", textDecoration: "none" }}>open →</a>;
}
function SentLabel({ text }) {
  return <span style={{ fontSize: 10, fontWeight: 200, color: "#bbb" }}>{text}</span>;
}
function Stats({ cols = 4, items }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 8, marginBottom: 20 }}>
      {items.map(([label, val]) => (
        <div key={label} style={{ background: "#fff", border: "1px solid #f0f0f0", padding: "14px 18px" }}>
          <p style={{ fontSize: 9, fontWeight: 300, letterSpacing: 2, textTransform: "uppercase", color: "#bbb", marginBottom: 6 }}>{label}</p>
          <p style={{ fontSize: 24, fontWeight: 300 }}>{val}</p>
        </div>
      ))}
    </div>
  );
}
function ScoreChip({ score }) {
  if (score == null) return <span style={{ fontSize: 10, fontWeight: 200, color: "#ccc" }}>—</span>;
  const color = score >= 85 ? "#0f6e56" : score >= 70 ? "#854f0b" : "#a32d2d";
  const bg = score >= 85 ? "#e1f5ee" : score >= 70 ? "#faeeda" : "#fcebeb";
  return <span style={{ fontSize: 11, fontWeight: 400, padding: "3px 10px", background: bg, color, letterSpacing: 0.3 }}>{score}</span>;
}

// ─── Request Doc Action ─────────────────────────────────────
function RequestDocAction({ app, updateStatus, showToast }) {
  if (!app.document_requested) {
    return (
      <ArBtn label="request document" onClick={() => {
        openRequestDocEmail(app);
        updateStatus(app.id, "on hold", { document_requested: true });
        showToast("document requested ✓");
      }} />
    );
  }
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      <span style={{ fontSize: 10, fontWeight: 200, color: "#bbb", whiteSpace: "nowrap" }}>requested ✓</span>
      <ArDivider />
      <ArBtn label="send again" onClick={() => { openRequestDocEmail(app); showToast("email reopened ✓"); }} />
    </div>
  );
}

// ─── Score Row ──────────────────────────────────────────────
function ScoreRow({ qKey, label, autoScore, manualScores, setManualScores }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid #f5f5f5" }}>
      <div>
        <span style={{ fontSize: 9, fontWeight: 300, color: "#bbb", letterSpacing: 1.5, textTransform: "uppercase" }}>{label}</span>
        <span style={{ fontSize: 9, fontWeight: 200, color: "#ccc", marginLeft: 6 }}>{autoScore != null ? "auto" : "0–100"}</span>
      </div>
      {autoScore != null
        ? <ScoreChip score={autoScore} />
        : <input
            className="score-input"
            type="number" min="0" max="100"
            value={manualScores[qKey]}
            onChange={e => setManualScores(prev => ({ ...prev, [qKey]: e.target.value }))}
          />
      }
    </div>
  );
}

// ─── Scoring Sidebar — HARUS di luar EvaluatingDetail ──────
function ScoringSidebar({ autoQ1, autoQ3, manualScores, setManualScores, total, totalColor, saving, saveScores, onPass, onFail }) {
  return (
    <div style={{ position: "sticky", top: 36, display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ background: "#fff", border: "1px solid #f0f0f0", padding: "18px 22px" }}>
        <p style={{ fontSize: 9, fontWeight: 300, letterSpacing: 2, textTransform: "uppercase", color: "#bbb", marginBottom: 14 }}>scoring</p>
        <ScoreRow qKey="q1" label="Q1 visual" autoScore={autoQ1} manualScores={manualScores} setManualScores={setManualScores} />
        <ScoreRow qKey="q2" label="Q2 empathy" autoScore={null} manualScores={manualScores} setManualScores={setManualScores} />
        <ScoreRow qKey="q3" label="Q3 ranking" autoScore={autoQ3} manualScores={manualScores} setManualScores={setManualScores} />
        <ScoreRow qKey="q4" label="Q4 local brands" autoScore={null} manualScores={manualScores} setManualScores={setManualScores} />
        <ScoreRow qKey="q5" label="Q5 intl brands" autoScore={null} manualScores={manualScores} setManualScores={setManualScores} />
        <ScoreRow qKey="q6" label="Q6 dimension" autoScore={null} manualScores={manualScores} setManualScores={setManualScores} />
        <ScoreRow qKey="q7" label="Q7 moodboard" autoScore={null} manualScores={manualScores} setManualScores={setManualScores} />
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 9, fontWeight: 300, color: "#bbb", letterSpacing: 2, textTransform: "uppercase" }}>total</span>
          <span style={{ fontSize: 22, fontWeight: 300, color: totalColor }}>{total != null ? total : "—"}</span>
        </div>
        <button onClick={saveScores} disabled={saving}
          style={{ marginTop: 14, width: "100%", background: "#1a1a1a", border: "none", color: "#fff", fontFamily: sans, fontSize: 10, fontWeight: 300, padding: "10px 0", cursor: saving ? "default" : "pointer", letterSpacing: 1, opacity: saving ? 0.5 : 1 }}>
          {saving ? "saving..." : "save scores"}
        </button>
      </div>
      <div style={{ background: "#fff", border: "1px solid #f0f0f0", padding: "18px 22px" }}>
        <p style={{ fontSize: 9, fontWeight: 300, letterSpacing: 2, textTransform: "uppercase", color: "#bbb", marginBottom: 14 }}>decision</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <button onClick={onPass}
            style={{ background: "none", border: "none", borderBottom: "1px solid #1a1a1a", paddingBottom: 2, fontFamily: sans, fontSize: 10, fontWeight: 300, color: "#1a1a1a", cursor: "pointer", textAlign: "left" }}>
            move to finalist →
          </button>
          <button onClick={onFail}
            style={{ background: "none", border: "none", borderBottom: "1px solid #f0e8e4", paddingBottom: 2, fontFamily: sans, fontSize: 10, fontWeight: 300, color: "#c47a5a", cursor: "pointer", textAlign: "left" }}>
            reject
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Evaluating Detail ──────────────────────────────────────
function EvaluatingDetail({ app, onBack, onPass, onFail, showToast }) {
  const [atData, setAtData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [manualScores, setManualScores] = useState({ q2: "", q4: "", q5: "", q6: "", q7: "" });
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("answers");

  useEffect(() => {
    supabase.from("alignment_tests").select("*").eq("applicant_id", app.id).maybeSingle()
      .then(({ data }) => {
        setAtData(data);
        if (data) {
          setManualScores({
            q2: data.score_q2 ?? "",
            q4: data.score_q4 ?? "",
            q5: data.score_q5 ?? "",
            q6: data.score_q6 ?? "",
            q7: data.score_q7 ?? "",
          });
        }
        setLoading(false);
      });
  }, [app.id]);

  const autoQ1 = atData ? scoreQ1(atData.visual_picks) : null;
  const autoQ3 = atData ? scoreQ3(atData.design_ranking) : null;

  const allScores = {
    q1: autoQ1,
    q2: manualScores.q2 !== "" ? parseFloat(manualScores.q2) : null,
    q3: autoQ3,
    q4: manualScores.q4 !== "" ? parseFloat(manualScores.q4) : null,
    q5: manualScores.q5 !== "" ? parseFloat(manualScores.q5) : null,
    q6: manualScores.q6 !== "" ? parseFloat(manualScores.q6) : null,
    q7: manualScores.q7 !== "" ? parseFloat(manualScores.q7) : null,
  };
  const total = calcTotal(allScores);
  const totalColor = total == null ? "#ccc" : total >= 85 ? "#0f6e56" : total >= 70 ? "#854f0b" : "#a32d2d";

  const saveScores = async () => {
    if (!atData) return;
    setSaving(true);
    await supabase.from("alignment_tests").update({
      score_q2: allScores.q2,
      score_q4: allScores.q4,
      score_q5: allScores.q5,
      score_q6: allScores.q6,
      score_q7: allScores.q7,
      score_total: total,
    }).eq("id", atData.id);
    await supabase.from("applications").update({ score_total: total }).eq("id", app.id);
    setSaving(false);
    showToast("scores saved ✓");
  };

  const rankItems = atData?.design_ranking ? atData.design_ranking.split(" | ") : [];
  const trendPos = rankItems.findIndex(s => s.toLowerCase().includes("on-trend"));

  if (loading) return <div style={{ padding: "36px 40px", fontSize: 11, fontWeight: 200, color: "#ccc" }}>loading...</div>;

  if (!atData) return (
    <div style={{ padding: "36px 40px", fontFamily: sans }}>
      <button onClick={onBack} style={{ background: "none", border: "none", fontFamily: sans, fontSize: 10, fontWeight: 300, color: "#aaa", cursor: "pointer", marginBottom: 28, padding: 0 }}>← back to evaluating</button>
      <p style={{ fontSize: 13, fontWeight: 300, color: "#bbb" }}>alignment test not submitted yet.</p>
    </div>
  );

  return (
    <div style={{ padding: "36px 40px", fontFamily: sans, color: "#1a1a1a" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", fontFamily: sans, fontSize: 10, fontWeight: 300, color: "#aaa", cursor: "pointer", marginBottom: 28, padding: 0 }}>← back to evaluating</button>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <p style={{ fontSize: 21, fontWeight: 300, marginBottom: 4 }}>{app.full_name}</p>
          <p style={{ fontSize: 11, fontWeight: 200, color: "#bbb" }}>{app.position?.toLowerCase()} · {typeTag(app.work_type).label}</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: 9, fontWeight: 300, letterSpacing: 2, textTransform: "uppercase", color: "#bbb", marginBottom: 6 }}>total score</p>
          <p style={{ fontSize: 36, fontWeight: 300, color: totalColor }}>{total != null ? total : "—"}</p>
        </div>
      </div>

      {/* Tabs profile | answers */}
      <div style={{ display: "flex", borderBottom: "1px solid #f0f0f0", marginBottom: 24 }}>
        {["profile", "answers"].map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ background: "none", border: "none", borderBottom: tab === t ? "1.5px solid #1a1a1a" : "1.5px solid transparent", marginBottom: -1, padding: "8px 20px 10px", fontFamily: sans, fontSize: 11, fontWeight: tab === t ? 400 : 300, color: tab === t ? "#1a1a1a" : "#bbb", cursor: "pointer", letterSpacing: 0.3, transition: "all 0.15s" }}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab — Profile */}
      {tab === "profile" ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 268px", gap: 24, alignItems: "start" }}>
          <div style={{ background: "#fff", border: "1px solid #f0f0f0", padding: "18px 22px" }}>
            {[
              ["position", app.position],
              ...(getDivision(app.position) === "design" && app.fd_sub ? [["division", app.fd_sub]] : []),
              ...(getDivision(app.position) === "design" && app.fd_specs ? [["specialization", app.fd_specs]] : []),
              ["work type", app.work_type],
              ["city", app.city],
              ["open to bandung", app.bandung],
              ["on-site", app.onsite],
              ["phone", app.phone],
              ["email", app.email],
              ["availability", app.availability],
              ["why jedda", app.why_jedda],
            ].filter(([, v]) => v).map(([label, val]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "11px 0", borderBottom: "1px solid #f5f5f5", gap: 16 }}>
                <span style={{ fontSize: 9, fontWeight: 300, color: "#bbb", letterSpacing: 2, textTransform: "uppercase", flexShrink: 0, paddingTop: 2 }}>{label}</span>
                <span style={{ fontSize: 12, fontWeight: 300, color: "#1a1a1a", textAlign: "right", lineHeight: 1.7, wordBreak: "break-word", maxWidth: "62%" }}>{val}</span>
              </div>
            ))}
            {(app.cv_url || app.portfolio_url || app.portfolio_link) && (
              <div style={{ paddingTop: 16, display: "flex", gap: 16 }}>
                {app.cv_url && <a href={app.cv_url} target="_blank" rel="noreferrer" style={{ fontSize: 11, fontWeight: 300, color: "#1a1a1a", textDecoration: "none", borderBottom: "1px solid #1a1a1a", paddingBottom: 2 }}>open cv →</a>}
                {(app.portfolio_url || app.portfolio_link) && <a href={app.portfolio_url || app.portfolio_link} target="_blank" rel="noreferrer" style={{ fontSize: 11, fontWeight: 300, color: "#1a1a1a", textDecoration: "none", borderBottom: "1px solid #1a1a1a", paddingBottom: 2 }}>open portfolio →</a>}
              </div>
            )}
          </div>
          <ScoringSidebar autoQ1={autoQ1} autoQ3={autoQ3} manualScores={manualScores} setManualScores={setManualScores} total={total} totalColor={totalColor} saving={saving} saveScores={saveScores} onPass={onPass} onFail={onFail} />
        </div>
      ) : (
      /* Tab — Answers */
      <div style={{ display: "grid", gridTemplateColumns: "1fr 268px", gap: 24, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Q1 */}
          <div style={{ background: "#fff", border: "1px solid #f0f0f0", padding: "18px 22px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <p style={{ fontSize: 9, fontWeight: 300, letterSpacing: 2, textTransform: "uppercase", color: "#bbb" }}>Q1 — visual instinct · 15%</p>
              <ScoreChip score={autoQ1} />
            </div>
            {(() => {
              const picks = atData.visual_picks
                ? atData.visual_picks.split(",").map(s => parseInt(s.trim())).filter(Boolean)
                : [];
              return (
                <div>
                  <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                    {picks.length > 0 ? picks.map(num => {
                      const isCorrect = CORRECT_PICKS.includes(num);
                      return (
                        <div key={num} style={{ position: "relative", width: 80, flexShrink: 0 }}>
                          <img src={`/${num}.jpg`} alt={`pick ${num}`}
                            style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover", objectPosition: "center top", display: "block", border: isCorrect ? "1.5px solid #6a9e76" : "1.5px solid #e8e8e8" }} />
                          <span style={{ position: "absolute", bottom: 5, left: 6, fontSize: 8, fontWeight: 300, letterSpacing: 1.5, color: "rgba(255,255,255,0.75)" }}>{String(num).padStart(2, "0")}</span>
                          {isCorrect && (
                            <div style={{ position: "absolute", top: 5, right: 5, width: 14, height: 14, background: "#6a9e76", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <svg viewBox="0 0 9 7" fill="none" width="8" height="8"><path d="M1 3.5l2.5 2.5L8 1" stroke="white" strokeWidth="1.5"/></svg>
                            </div>
                          )}
                        </div>
                      );
                    }) : <span style={{ fontSize: 12, fontWeight: 200, color: "#ccc" }}>—</span>}
                  </div>
                  <p style={{ fontSize: 10, fontWeight: 200, color: "#bbb" }}>
                    correct: {CORRECT_PICKS.join(", ")} · {autoQ1 === 100 ? "all 3 correct ✓" : autoQ1 === 75 ? "2 correct" : autoQ1 === 40 ? "1 correct" : "none correct"}
                  </p>
                </div>
              );
            })()}
          </div>

          {/* Q2 */}
          <div style={{ background: "#fff", border: "1px solid #f0f0f0", padding: "18px 22px" }}>
            <p style={{ fontSize: 9, fontWeight: 300, letterSpacing: 2, textTransform: "uppercase", color: "#bbb", marginBottom: 10 }}>Q2 — empathy · 15%</p>
            <p style={{ fontSize: 13, fontWeight: 300, color: "#444", lineHeight: 1.9 }}>{atData.wear_feeling || "—"}</p>
          </div>

          {/* Q3 */}
          <div style={{ background: "#fff", border: "1px solid #f0f0f0", padding: "18px 22px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <p style={{ fontSize: 9, fontWeight: 300, letterSpacing: 2, textTransform: "uppercase", color: "#bbb" }}>Q3 — design ranking · 25%</p>
              <ScoreChip score={autoQ3} />
            </div>
            {rankItems.length > 0
              ? rankItems.map((item, i) => {
                  const idealPos = IDEAL_RANKING.indexOf(item);
                  const diff = Math.abs(i - idealPos);
                  const isTrendRed = item.toLowerCase().includes("on-trend") && i <= 1;
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "7px 0", borderBottom: "1px solid #f8f8f8" }}>
                      <span style={{ fontSize: 9, fontWeight: 200, color: "#ccc", width: 16, flexShrink: 0 }}>{i + 1}</span>
                      <span style={{ fontSize: 12, fontWeight: 300, color: isTrendRed ? "#c47a5a" : "#444", flex: 1, lineHeight: 1.5 }}>{item}</span>
                      {diff === 0
                        ? <span style={{ fontSize: 9, color: "#6a9e76" }}>✓</span>
                        : <span style={{ fontSize: 9, color: diff >= 3 ? "#c47a5a" : "#ccc" }}>+{diff}</span>
                      }
                    </div>
                  );
                })
              : <p style={{ fontSize: 12, fontWeight: 200, color: "#ccc" }}>—</p>
            }
            {trendPos >= 0 && trendPos <= 1 && (
              <p style={{ fontSize: 10, fontWeight: 200, color: "#c47a5a", marginTop: 10 }}>⚠ on-trend ranked #{trendPos + 1} — minimum score applied</p>
            )}
          </div>

          {/* Q4 */}
          <div style={{ background: "#fff", border: "1px solid #f0f0f0", padding: "18px 22px" }}>
            <p style={{ fontSize: 9, fontWeight: 300, letterSpacing: 2, textTransform: "uppercase", color: "#bbb", marginBottom: 10 }}>Q4 — local brands · 5.5%</p>
            <p style={{ fontSize: 13, fontWeight: 300, color: "#444" }}>{atData.local_brands || "—"}</p>
          </div>

          {/* Q5 */}
          <div style={{ background: "#fff", border: "1px solid #f0f0f0", padding: "18px 22px" }}>
            <p style={{ fontSize: 9, fontWeight: 300, letterSpacing: 2, textTransform: "uppercase", color: "#bbb", marginBottom: 10 }}>Q5 — international brands · 9.5%</p>
            <p style={{ fontSize: 13, fontWeight: 300, color: "#444" }}>{atData.intl_brands || "—"}</p>
          </div>

          {/* Q6 */}
          <div style={{ background: "#fff", border: "1px solid #f0f0f0", padding: "18px 22px" }}>
            <p style={{ fontSize: 9, fontWeight: 300, letterSpacing: 2, textTransform: "uppercase", color: "#bbb", marginBottom: 10 }}>Q6 — dimension · 10%</p>
            <p style={{ fontSize: 13, fontWeight: 300, color: "#444", lineHeight: 1.9 }}>{atData.dimension || "—"}</p>
          </div>

          {/* Q7 */}
          <div style={{ background: "#fff", border: "1px solid #f0f0f0", padding: "18px 22px" }}>
            <p style={{ fontSize: 9, fontWeight: 300, letterSpacing: 2, textTransform: "uppercase", color: "#bbb", marginBottom: 10 }}>Q7 — moodboard · 20%</p>
            {(atData.moodboard_url || atData.moodboard_link)
              ? <a href={atData.moodboard_url || atData.moodboard_link} target="_blank" rel="noreferrer"
                  style={{ fontSize: 12, fontWeight: 300, color: "#1a1a1a", textDecoration: "none", borderBottom: "1px solid #ddd", paddingBottom: 2 }}>
                  open moodboard →
                </a>
              : <p style={{ fontSize: 12, fontWeight: 200, color: "#ccc" }}>—</p>
            }
          </div>

        </div>
        <ScoringSidebar autoQ1={autoQ1} autoQ3={autoQ3} manualScores={manualScores} setManualScores={setManualScores} total={total} totalColor={totalColor} saving={saving} saveScores={saveScores} onPass={onPass} onFail={onFail} />
      </div>
      )}
    </div>
  );
}

// ─── Detail Panel ──────────────────────────────────────────
function DetailPanel({ app, onClose, onMoveBack, onReferOut }) {
  if (!app) return null;
  const tag = typeTag(app.work_type);
  const isDesign = getDivision(app.position) === "design";
  const fields = [
    ["position", app.position],
    ...(isDesign && app.fd_sub ? [["division", app.fd_sub]] : []),
    ...(isDesign && app.fd_specs ? [["specialization", app.fd_specs]] : []),
    ["work type", app.work_type],
    ["phone", app.phone],
    ["email", app.email],
    ["city", app.city],
    ["open to bandung", app.bandung],
    ["availability", app.availability],
    ["why jedda", app.why_jedda],
  ].filter(([, v]) => v);

  const moveBackOptions = {
    "new":            [],
    "on hold":        [{ label: "← pending review", status: "new" }],
    "shortlisted":    [{ label: "← pending review", status: "new" }, { label: "on hold", status: "on hold" }],
    "evaluating":     [{ label: "← pending review", status: "new" }, { label: "← shortlisted", status: "shortlisted" }],
    "finalist":       [{ label: "← pending review", status: "new" }, { label: "← evaluating", status: "evaluating" }, { label: "← shortlisted", status: "shortlisted" }],
    "interview":      [{ label: "← pending review", status: "new" }, { label: "← finalist", status: "finalist" }],
    "the final team": [{ label: "← pending review", status: "new" }],
    "rejected":       [{ label: "← pending review", status: "new" }],
    "referred out":   [{ label: "← pending review", status: "new" }],
  };
  const moveOpts = moveBackOptions[app.status] || [];
  const canReferOut = ["new", "on hold", "shortlisted", "evaluating", "finalist"].includes(app.status);

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.1)", zIndex: 300, display: "flex", justifyContent: "flex-end" }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 400, height: "100%", background: "#fff", overflowY: "auto", padding: "36px 28px", borderLeft: "1px solid #f0f0f0", fontFamily: sans }}>
        <button onClick={onClose} style={{ background: "none", border: "none", fontFamily: sans, fontSize: 9, fontWeight: 300, color: "#ccc", cursor: "pointer", letterSpacing: 2, marginBottom: 28, display: "block", textTransform: "uppercase" }}>← back</button>
        <p style={{ fontSize: 19, fontWeight: 300, marginBottom: 8 }}>{app.full_name}</p>
        <span style={{ fontSize: 9, fontWeight: 300, padding: "3px 8px", background: tag.bg, color: tag.color }}>{tag.label}</span>
        <div style={{ width: 20, height: 1, background: "#eee", margin: "20px 0" }} />
        <div style={{ borderTop: "1px solid #f0f0f0" }}>
          {fields.map(([l, v]) => (
            <div key={l} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "11px 0", borderBottom: "1px solid #f5f5f5", gap: 16 }}>
              <span style={{ fontSize: 9, fontWeight: 300, color: "#bbb", letterSpacing: 2, textTransform: "uppercase", flexShrink: 0, paddingTop: 2 }}>{l}</span>
              <span style={{ fontSize: 12, fontWeight: 300, color: "#1a1a1a", textAlign: "right", lineHeight: 1.7, wordBreak: "break-word", maxWidth: "62%" }}>{v}</span>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 9, fontWeight: 300, letterSpacing: 3, textTransform: "uppercase", color: "#bbb", margin: "24px 0 12px" }}>documents</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {app.cv_url
            ? <a href={app.cv_url} target="_blank" rel="noreferrer" style={{ fontSize: 12, fontWeight: 300, color: "#1a1a1a", textDecoration: "none", borderBottom: "1px solid #ddd", paddingBottom: 2, width: "fit-content" }}>cv / resume →</a>
            : <span style={{ fontSize: 11, fontWeight: 200, color: "#ccc" }}>no cv uploaded</span>
          }
          {app.portfolio_url
            ? <a href={app.portfolio_url} target="_blank" rel="noreferrer" style={{ fontSize: 12, fontWeight: 300, color: "#1a1a1a", textDecoration: "none", borderBottom: "1px solid #ddd", paddingBottom: 2, width: "fit-content" }}>portfolio →</a>
            : app.portfolio_link
              ? <a href={app.portfolio_link} target="_blank" rel="noreferrer" style={{ fontSize: 12, fontWeight: 300, color: "#888", textDecoration: "none", borderBottom: "1px solid #e8e8e8", paddingBottom: 2, width: "fit-content" }}>portfolio link ↗</a>
              : <span style={{ fontSize: 11, fontWeight: 200, color: "#ccc" }}>no portfolio uploaded</span>
          }
        </div>
        {moveOpts.length > 0 && (
          <>
            <p style={{ fontSize: 9, fontWeight: 300, letterSpacing: 3, textTransform: "uppercase", color: "#bbb", margin: "28px 0 12px" }}>change status</p>
            <div style={{ display: "flex", alignItems: "center", paddingTop: 4 }}>
              <span style={{ fontSize: 9, fontWeight: 300, color: "#ccc", letterSpacing: 1, textTransform: "uppercase", flexShrink: 0, marginRight: 10 }}>move back to</span>
              {moveOpts.map((opt, i) => (
                <span key={opt.status} style={{ display: "flex", alignItems: "center" }}>
                  {i > 0 && <div style={{ width: 1, height: 10, background: "#e8e8e8", margin: "0 10px" }} />}
                  <button onClick={() => { onMoveBack(app.id, opt.status); onClose(); }}
                    style={{ background: "none", border: "none", fontFamily: sans, fontSize: 10, fontWeight: 300, color: "#aaa", cursor: "pointer", padding: 0 }}
                    onMouseOver={e => e.target.style.color = "#1a1a1a"}
                    onMouseOut={e => e.target.style.color = "#aaa"}
                  >{opt.label}</button>
                </span>
              ))}
            </div>
          </>
        )}
        {canReferOut && (
          <>
            <div style={{ width: "100%", height: 1, background: "#f5f5f5", margin: "28px 0" }} />
            <p style={{ fontSize: 9, fontWeight: 300, letterSpacing: 3, textTransform: "uppercase", color: "#bbb", marginBottom: 10 }}>refer out</p>
            <p style={{ fontSize: 11, fontWeight: 200, color: "#bbb", lineHeight: 1.7, marginBottom: 14 }}>not the right fit for jedda right now — but worth passing on to another company.</p>
            <button onClick={() => { onReferOut(app.id); onClose(); }}
              style={{ background: "none", border: "none", fontFamily: sans, fontSize: 10, fontWeight: 300, color: "#7a6aaa", cursor: "pointer", padding: 0, borderBottom: "1px solid #c8c0e8", paddingBottom: 2 }}
              onMouseOver={e => e.currentTarget.style.opacity = "0.5"}
              onMouseOut={e => e.currentTarget.style.opacity = "1"}
            >move to referred out →</button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Interview Modal ────────────────────────────────────────
const OFFLINE_LOCATION = "Fragment Project — Jl. Ir. H. Juanda No.23, Bandung";
const OFFLINE_MAPS_URL = "https://share.google/D3ep92gL1rmffWXYZ";

function buildInterviewEmail(app, mode, dt) {
  const firstName = app.full_name.split(" ")[0];
  const d = dt ? new Date(dt) : null;
  const dateStr = d ? d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "[date]";
  const timeStr = d ? d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "[time]";

  if (mode === "offline") {
    return `Hi ${firstName},

Congratulations — you've made it to the interview stage.

We received hundreds of applications, and we're glad yours stood out. Before we finalize the team, we'd like to meet you in person — just a casual conversation to get a better sense of who you are and how you'd fit into the Jedda environment.

Interview details:
When: ${dateStr} at ${timeStr}
Where: ${OFFLINE_LOCATION}
Get directions: ${OFFLINE_MAPS_URL}

Please reply to confirm whether this time works for you. If it doesn't, let us know and we'll find another slot.

See you there,
Jedda.`;
  } else {
    return `Hi ${firstName},

Congratulations — you've made it to the interview stage.

We received hundreds of applications, and we're glad yours stood out. Before we finalize the team, we'd like to have a conversation with you — just a casual call to get a better sense of who you are and how you'd fit into the Jedda environment.

We're proposing the following time slot for our online interview:
${dateStr} at ${timeStr}

Please reply to confirm whether this works for you. If it doesn't, let us know and we'll find another slot. Once confirmed, we'll send over the meeting link.

See you soon,
Jedda.`;
  }
}

function InterviewModal({ app, onClose, onConfirm }) {
  const [mode, setMode] = useState("offline");
  const [dt, setDt] = useState("");
  if (!app) return null;

  const preview = dt
    ? buildInterviewEmail(app, mode, dt)
    : "select a date & time first.";

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.12)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", padding: "36px 32px", width: 480, border: "1px solid #f0f0f0", fontFamily: sans, maxHeight: "90vh", overflowY: "auto" }}>
        <p style={{ fontSize: 14, fontWeight: 300, marginBottom: 4 }}>schedule interview</p>
        <p style={{ fontSize: 11, fontWeight: 200, color: "#aaa", marginBottom: 24 }}>{app.full_name} — {app.position?.toLowerCase()}</p>

        {/* Mode toggle */}
        <p style={{ fontSize: 9, fontWeight: 300, letterSpacing: 2, textTransform: "uppercase", color: "#bbb", marginBottom: 10 }}>interview type</p>
        <div style={{ display: "flex", gap: 0, marginBottom: 24, border: "1px solid #f0f0f0" }}>
          {["offline", "online"].map((m, i) => (
            <button key={m} onClick={() => setMode(m)}
              style={{
                flex: 1, padding: "9px 0", border: "none", borderRight: i === 0 ? "1px solid #f0f0f0" : "none",
                background: mode === m ? "#1a1a1a" : "#fff",
                color: mode === m ? "#fff" : "#bbb",
                fontFamily: sans, fontSize: 11, fontWeight: 300, cursor: "pointer",
                transition: "all 0.15s", letterSpacing: 0.5
              }}>
              {m}
            </button>
          ))}
        </div>

        {/* Offline location info */}
        {mode === "offline" && (
          <div style={{ background: "#fafafa", border: "1px solid #f0f0f0", padding: "12px 14px", marginBottom: 22, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ fontSize: 9, fontWeight: 300, letterSpacing: 2, textTransform: "uppercase", color: "#bbb", marginBottom: 4 }}>location</p>
              <p style={{ fontSize: 11, fontWeight: 300, color: "#555" }}>Fragment Project, Jl. Ir. H. Juanda No.23</p>
            </div>
            <a href={OFFLINE_MAPS_URL} target="_blank" rel="noreferrer"
              style={{ fontSize: 10, fontWeight: 300, color: "#999", textDecoration: "none", borderBottom: "1px solid #ddd", paddingBottom: 1, whiteSpace: "nowrap", marginLeft: 12 }}>
              maps →
            </a>
          </div>
        )}

        {/* Date & time */}
        <p style={{ fontSize: 9, fontWeight: 300, letterSpacing: 2, textTransform: "uppercase", color: "#bbb", marginBottom: 8 }}>date & time</p>
        <input type="datetime-local" value={dt} onChange={e => setDt(e.target.value)}
          style={{ width: "100%", border: "none", borderBottom: "1px solid #e8e8e8", padding: "8px 0", fontFamily: sans, fontSize: 12, fontWeight: 300, color: "#1a1a1a", outline: "none", background: "transparent", marginBottom: 22 }} />

        {/* Email preview */}
        <p style={{ fontSize: 9, fontWeight: 300, letterSpacing: 2, textTransform: "uppercase", color: "#bbb", marginBottom: 8 }}>email preview</p>
        <div style={{ background: "#fafafa", border: "1px solid #f0f0f0", padding: "16px 18px", marginBottom: 24, fontSize: 11, fontWeight: 300, color: "#777", lineHeight: 1.9, minHeight: 80, whiteSpace: "pre-wrap" }}>{preview}</div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button onClick={onClose} style={{ background: "none", border: "none", borderBottom: "1px solid #ddd", paddingBottom: 2, fontFamily: sans, fontSize: 10, fontWeight: 300, color: "#999", cursor: "pointer" }}>cancel</button>
          <button onClick={() => { if (!dt) return; onConfirm(dt, mode); }} style={{ background: "none", border: "none", borderBottom: "1px solid #1a1a1a", paddingBottom: 2, fontFamily: sans, fontSize: 10, fontWeight: 300, color: "#1a1a1a", cursor: "pointer", opacity: dt ? 1 : 0.3 }}>send email →</button>
        </div>
      </div>
    </div>
  );
}

// ─── Acceptance Modal ───────────────────────────────────────
function AcceptanceModal({ app, onClose, onConfirm }) {
  if (!app) return null;
  const preview = `Hi ${app.full_name.split(" ")[0]},\n\nWelcome to Jedda.\n\nYou're officially part of the team as ${app.position?.toLowerCase()}. We're glad to have you with us — onboarding details will follow shortly.\n\n— Jedda Team`;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.12)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", padding: "36px 32px", width: 420, border: "1px solid #f0f0f0", fontFamily: sans }}>
        <p style={{ fontSize: 14, fontWeight: 300, marginBottom: 4 }}>send acceptance email</p>
        <p style={{ fontSize: 11, fontWeight: 200, color: "#aaa", marginBottom: 24 }}>{app.full_name} — {app.position?.toLowerCase()}</p>
        <p style={{ fontSize: 9, fontWeight: 300, letterSpacing: 2, textTransform: "uppercase", color: "#bbb", marginBottom: 8 }}>email preview</p>
        <div style={{ background: "#fafafa", border: "1px solid #f0f0f0", padding: "16px 18px", marginBottom: 24, fontSize: 11, fontWeight: 300, color: "#777", lineHeight: 1.9, whiteSpace: "pre-wrap" }}>{preview}</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button onClick={onClose} style={{ background: "none", border: "none", borderBottom: "1px solid #ddd", paddingBottom: 2, fontFamily: sans, fontSize: 10, fontWeight: 300, color: "#999", cursor: "pointer" }}>cancel</button>
          <button onClick={onConfirm} style={{ background: "none", border: "none", borderBottom: "1px solid #1a1a1a", paddingBottom: 2, fontFamily: sans, fontSize: 10, fontWeight: 300, color: "#1a1a1a", cursor: "pointer" }}>send email →</button>
        </div>
      </div>
    </div>
  );
}

// ─── Page components ────────────────────────────────────────
function OnHoldPage({ apps, updateStatus, showToast, setPanelApp }) {
  const [div, setDiv] = useState("all");
  const all = apps.filter(a => a.status === "on hold");
  const filtered = all.filter(a => div === "all" || getDivision(a.position) === div);
  return (
    <div style={{ padding: "36px 40px" }}>
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 21, fontWeight: 300, marginBottom: 3 }}>on hold</p>
        <p style={{ fontSize: 11, fontWeight: 200, color: "#bbb" }}>under consideration — request missing documents or move to next stage</p>
      </div>
      <DivFilter allApps={all} active={div} onChange={setDiv} />
      <Tbl>
        <THead cols="200px 1fr 90px 56px 56px 1fr">
          <TH>name</TH><TH>position</TH><TH>type</TH><TH>cv</TH><TH>porto</TH><TH><span style={{ paddingLeft: 24 }}>action</span></TH>
        </THead>
        {filtered.length === 0 ? <Empty msg="nothing on hold" /> :
          filtered.map(a => (
            <TRow key={a.id} cols="200px 1fr 90px 56px 56px 1fr" onClick={() => setPanelApp(a)}>
              <TName name={a.full_name} sub={a.city} />
              <TPos>{a.position?.toLowerCase()}</TPos>
              <Badge wt={a.work_type} />
              <DocLink url={a.cv_url} />
              <DocLink url={a.portfolio_url || a.portfolio_link} />
              <div style={{ paddingLeft: 24 }} onClick={e => e.stopPropagation()}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <RequestDocAction app={a} updateStatus={updateStatus} showToast={showToast} />
                  <ArDivider />
                  <ArBtn label="shortlisted" cls="primary" onClick={() => { updateStatus(a.id, "shortlisted"); showToast("→ shortlisted"); }} />
                  <ArDivider />
                  <ArBtn label="reject" cls="danger" onClick={() => { updateStatus(a.id, "rejected", { rejection_sent: false }); showToast("→ rejected"); }} />
                </div>
              </div>
            </TRow>
          ))
        }
      </Tbl>
    </div>
  );
}

function ShortlistedPage({ apps, updateStatus, showToast, setPanelApp }) {
  const [div, setDiv] = useState("all");
  const all = apps.filter(a => a.status === "shortlisted");
  const filtered = all.filter(a => div === "all" || getDivision(a.position) === div);
  return (
    <div style={{ padding: "36px 40px" }}>
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 21, fontWeight: 300, marginBottom: 3 }}>shortlisted</p>
        <p style={{ fontSize: 11, fontWeight: 200, color: "#bbb" }}>passed initial review — send alignment test to proceed</p>
      </div>
      <DivFilter allApps={all} active={div} onChange={setDiv} />
      <Tbl>
        <THead cols="1fr 1fr 90px 180px">
          <TH>name</TH><TH>position</TH><TH>type</TH><TH>alignment test</TH>
        </THead>
        {filtered.length === 0 ? <Empty msg="no one shortlisted yet" /> :
          filtered.map(a => (
            <TRow key={a.id} cols="1fr 1fr 90px 180px" onClick={() => setPanelApp(a)}>
              <TName name={a.full_name} sub={a.city} />
              <TPos>{a.position?.toLowerCase()}</TPos>
              <Badge wt={a.work_type} />
              <div onClick={e => e.stopPropagation()}>
                {a.alignment_test_submitted
                  ? <span style={{ fontSize: 10, fontWeight: 300, color: "#6a9e76" }}>submitted ✓</span>
                  : a.alignment_test_sent
                    ? <div style={{ display: "flex", alignItems: "center" }}>
                        <span style={{ fontSize: 10, fontWeight: 200, color: "#bbb", whiteSpace: "nowrap" }}>sent ✓</span>
                        <ArDivider />
                        <ArBtn label="resend" onClick={() => { openAlignmentTestEmail(a); showToast("email reopened ✓"); }} />
                      </div>
                    : <ArBtn label="send alignment test" onClick={() => {
                        openAlignmentTestEmail(a);
                        updateStatus(a.id, "evaluating", { alignment_test_sent: true });
                        showToast("alignment test sent ✓");
                      }} />
                }
              </div>
            </TRow>
          ))
        }
      </Tbl>
    </div>
  );
}

function EvaluatingPage({ apps, setEvaluatingApp, showToast }) {
  const [div, setDiv] = useState("all");
  const all = apps.filter(a => a.status === "evaluating");
  const filtered = all.filter(a => div === "all" || getDivision(a.position) === div);
  return (
    <div style={{ padding: "36px 40px" }}>
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 21, fontWeight: 300, marginBottom: 3 }}>evaluating</p>
        <p style={{ fontSize: 11, fontWeight: 200, color: "#bbb" }}>alignment test sent — click a name to review answers and score</p>
      </div>
      <DivFilter allApps={all} active={div} onChange={setDiv} />
      <Tbl>
        <THead cols="1fr 1fr 90px 96px 168px">
          <TH>name</TH><TH>position</TH><TH>type</TH><TH>score</TH><TH>test status</TH>
        </THead>
        {filtered.length === 0 ? <Empty msg="no one being evaluated yet" /> :
          filtered.map(a => (
            <TRow key={a.id} cols="1fr 1fr 90px 96px 168px" onClick={() => setEvaluatingApp(a)}>
              <TName name={a.full_name} sub={a.city} />
              <TPos>{a.position?.toLowerCase()}</TPos>
              <Badge wt={a.work_type} />
              <ScoreChip score={a.score_total ?? null} />
              <div onClick={e => e.stopPropagation()}>
                {a.alignment_test_submitted
                  ? <span style={{ fontSize: 10, fontWeight: 300, color: "#6a9e76" }}>submitted ✓</span>
                  : <div style={{ display: "flex", alignItems: "center" }}>
                      <span style={{ fontSize: 10, fontWeight: 200, color: "#bbb", whiteSpace: "nowrap" }}>awaiting...</span>
                      <ArDivider />
                      <ArBtn label="resend" onClick={() => { openAlignmentTestEmail(a); showToast("email reopened ✓"); }} />
                    </div>
                }
              </div>
            </TRow>
          ))
        }
      </Tbl>
    </div>
  );
}

function FinalistPage({ apps, setInterviewApp, setPanelApp }) {
  const [div, setDiv] = useState("all");
  const all = apps.filter(a => a.status === "finalist");
  const filtered = all.filter(a => div === "all" || getDivision(a.position) === div);
  return (
    <div style={{ padding: "36px 40px" }}>
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 21, fontWeight: 300, marginBottom: 3 }}>finalists</p>
        <p style={{ fontSize: 11, fontWeight: 200, color: "#bbb" }}>schedule their interview</p>
      </div>
      <DivFilter allApps={all} active={div} onChange={setDiv} />
      <Tbl>
        <THead cols="1fr 1fr 80px 20px 160px">
          <TH>name</TH><TH>position</TH><TH>type</TH><TH></TH><TH>action</TH>
        </THead>
        {filtered.length === 0 ? <Empty msg="no finalists yet" /> :
          filtered.map(a => (
            <TRow key={a.id} cols="1fr 1fr 80px 20px 160px" onClick={() => setPanelApp(a)}>
              <TName name={a.full_name} sub={a.city} />
              <TPos>{a.position?.toLowerCase()}</TPos>
              <Badge wt={a.work_type} />
              <span title={a.is_priority ? "priority" : "via evaluating"}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: a.is_priority ? "#534ab7" : "#ccc", display: "inline-block" }} />
              </span>
              <div onClick={e => e.stopPropagation()}>
                <button onClick={() => setInterviewApp(a)}
                  style={{ background: "none", border: "none", borderBottom: "1px solid #1a1a1a", paddingBottom: 2, fontFamily: sans, fontSize: 10, fontWeight: 300, color: "#1a1a1a", cursor: "pointer" }}>
                  schedule interview →
                </button>
              </div>
            </TRow>
          ))
        }
      </Tbl>
    </div>
  );
}

function InterviewPage({ apps, updateStatus, showToast }) {
  const [div, setDiv] = useState("all");
  const all = [...apps.filter(a => a.status === "interview")].sort((a, b) => {
    const ta = a.interview_date ? new Date(a.interview_date).getTime() : Infinity;
    const tb = b.interview_date ? new Date(b.interview_date).getTime() : Infinity;
    return ta - tb;
  });
  const filtered = all.filter(a => div === "all" || getDivision(a.position) === div);
  return (
    <div style={{ padding: "36px 40px" }}>
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 21, fontWeight: 300, marginBottom: 3 }}>interview</p>
        <p style={{ fontSize: 11, fontWeight: 200, color: "#bbb" }}>scheduled interviews — mark as passed or did not pass</p>
      </div>
      <DivFilter allApps={all} active={div} onChange={setDiv} />
      <Tbl>
        <THead cols="1fr 1fr 80px 140px 1fr">
          <TH>name</TH><TH>position</TH><TH>type</TH><TH>date</TH><TH>action</TH>
        </THead>
        {filtered.length === 0 ? <Empty msg="no interviews scheduled yet" /> :
          filtered.map(a => {
            const d = a.interview_date ? new Date(a.interview_date) : null;
            const dateLabel = d ? d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) + " · " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "—";
            const resendEmail = () => {
              const body = buildInterviewEmail(a, a.interview_mode || "offline", a.interview_date);
              window.open(`https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(a.email)}&su=${encodeURIComponent(a.full_name.split(" ")[0])}%2C%20we%27d%20like%20to%20meet%20you.&body=${encodeURIComponent(body)}`, "_blank");
              showToast("email reopened ✓");
            };
            return (
              <TRow key={a.id} cols="1fr 1fr 80px 140px 1fr">
                <TName name={a.full_name} sub={a.city} />
                <TPos>{a.position?.toLowerCase()}</TPos>
                <Badge wt={a.work_type} />
                <span style={{ fontSize: 11, fontWeight: 200, color: "#999" }}>{dateLabel}</span>
                <div onClick={e => e.stopPropagation()}>
                  <ActionRow actions={[
                    { label: "passed →", cls: "primary", onClick: () => { updateStatus(a.id, "the final team", { acceptance_sent: false }); showToast("→ the final team"); } },
                    { label: "did not pass", cls: "danger", onClick: () => { updateStatus(a.id, "rejected", { rejection_sent: false }); showToast("→ rejected"); } },
                    { label: "resend email", onClick: resendEmail },
                  ]} />
                </div>
              </TRow>
            );
          })
        }
      </Tbl>
    </div>
  );
}

function FinalTeamPage({ apps, setPanelApp, setAcceptanceApp }) {
  const [div, setDiv] = useState("all");
  const all = apps.filter(a => a.status === "the final team");
  const filtered = all.filter(a => div === "all" || getDivision(a.position) === div);
  return (
    <div style={{ padding: "36px 40px" }}>
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 21, fontWeight: 300, marginBottom: 3 }}>the final team</p>
        <p style={{ fontSize: 11, fontWeight: 200, color: "#bbb" }}>they made it — send acceptance email</p>
      </div>
      <DivFilter allApps={all} active={div} onChange={setDiv} />
      <Tbl>
        <THead cols="1fr 1fr 80px 180px">
          <TH>name</TH><TH>position</TH><TH>type</TH><TH>action</TH>
        </THead>
        {filtered.length === 0 ? <Empty msg="no new team members yet" /> :
          filtered.map(a => (
            <TRow key={a.id} cols="1fr 1fr 80px 180px" onClick={() => setPanelApp(a)}>
              <TName name={a.full_name} sub={a.city} />
              <TPos>{a.position?.toLowerCase()}</TPos>
              <Badge wt={a.work_type} />
              <div onClick={e => e.stopPropagation()}>
                {a.acceptance_sent
                  ? <SentLabel text="acceptance sent ✓" />
                  : <button onClick={() => setAcceptanceApp(a)}
                      style={{ background: "none", border: "none", borderBottom: "1px solid #1a1a1a", paddingBottom: 2, fontFamily: sans, fontSize: 10, fontWeight: 300, color: "#1a1a1a", cursor: "pointer" }}>
                      send acceptance email →
                    </button>
                }
              </div>
            </TRow>
          ))
        }
      </Tbl>
    </div>
  );
}

function RejectedPage({ apps, updateStatus, showToast, setPanelApp }) {
  const [div, setDiv] = useState("all");
  const all = apps.filter(a => a.status === "rejected");
  const filtered = all.filter(a => div === "all" || getDivision(a.position) === div);
  return (
    <div style={{ padding: "36px 40px" }}>
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 21, fontWeight: 300, marginBottom: 3 }}>rejected</p>
        <p style={{ fontSize: 11, fontWeight: 200, color: "#bbb" }}>did not pass — send rejection email manually</p>
      </div>
      <DivFilter allApps={all} active={div} onChange={setDiv} />
      <Tbl>
        <THead cols="1fr 1fr 80px 120px 160px">
          <TH>name</TH><TH>position</TH><TH>type</TH><TH>rejected from</TH><TH>action</TH>
        </THead>
        {filtered.length === 0 ? <Empty msg="no rejections" /> :
          filtered.map(a => (
            <TRow key={a.id} cols="1fr 1fr 80px 120px 160px" onClick={() => setPanelApp(a)}>
              <TName name={a.full_name} sub={a.city} />
              <TPos>{a.position?.toLowerCase()}</TPos>
              <Badge wt={a.work_type} />
              <span style={{ fontSize: 10, fontWeight: 200, color: "#ccc" }}>{a.rejected_from ? "from " + a.rejected_from : "—"}</span>
              <div onClick={e => e.stopPropagation()}>
                {a.rejection_sent
                  ? <SentLabel text="rejection sent ✓" />
                  : <ArBtn label="mark rejection sent" onClick={() => { updateStatus(a.id, "rejected", { rejection_sent: true }); showToast("rejection marked ✓"); }} />
                }
              </div>
            </TRow>
          ))
        }
      </Tbl>
    </div>
  );
}

function ReferredOutPage({ apps, setPanelApp }) {
  const [div, setDiv] = useState("all");
  const all = apps.filter(a => a.status === "referred out");
  const filtered = all.filter(a => div === "all" || getDivision(a.position) === div);
  return (
    <div style={{ padding: "36px 40px" }}>
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 21, fontWeight: 300, marginBottom: 3 }}>referred out</p>
        <p style={{ fontSize: 11, fontWeight: 200, color: "#bbb" }}>passed on to other companies</p>
      </div>
      <DivFilter allApps={all} active={div} onChange={setDiv} />
      <Tbl>
        <THead cols="1fr 1fr 80px 120px">
          <TH>name</TH><TH>position</TH><TH>type</TH><TH>city</TH>
        </THead>
        {filtered.length === 0 ? <Empty msg="no one referred out yet" /> :
          filtered.map(a => (
            <TRow key={a.id} cols="1fr 1fr 80px 120px" onClick={() => setPanelApp(a)}>
              <TName name={a.full_name} sub={a.email} />
              <TPos>{a.position?.toLowerCase()}</TPos>
              <Badge wt={a.work_type} />
              <span style={{ fontSize: 11, fontWeight: 200, color: "#999" }}>{a.city}</span>
            </TRow>
          ))
        }
      </Tbl>
    </div>
  );
}

// ─── MAIN DASHBOARD ─────────────────────────────────────────
export default function AdminDashboard() {
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState("");
  const [pwErr, setPwErr] = useState(false);
  const [pwVisible, setPwVisible] = useState(false);
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState("overview");
  const [panelApp, setPanelApp] = useState(null);
  const [interviewApp, setInterviewApp] = useState(null);
  const [acceptanceApp, setAcceptanceApp] = useState(null);
  const [evaluatingApp, setEvaluatingApp] = useState(null);
  const [newPosFilter, setNewPosFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [overviewDiv, setOverviewDiv] = useState("all");
  const [ovSearch, setOvSearch] = useState("");
  const [toast, setToast] = useState("");
  const toastTimer = useRef(null);

  const showToast = (msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2400);
  };

  const login = () => {
    if (pw === PASS) { setAuthed(true); setPwErr(false); }
    else setPwErr(true);
  };

  useEffect(() => {
    if (!authed) return;
    const style = document.createElement("style");
    style.textContent = CSS;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, [authed]);

  useEffect(() => {
    if (!authed) return;
    setLoading(true);
    supabase.from("applications").select("*").order("id", { ascending: false })
      .then(({ data }) => { setApps(data || []); setLoading(false); });
  }, [authed]);

  const updateStatus = async (id, status, extra = {}) => {
    const update = { status, ...extra };
    await supabase.from("applications").update(update).eq("id", id);
    setApps(prev => prev.map(a => a.id === id ? { ...a, ...update } : a));
  };

  const counts = {
    new: apps.filter(a => a.status === "new").length,
    onhold: apps.filter(a => a.status === "on hold").length,
    referredout: apps.filter(a => a.status === "referred out").length,
    shortlisted: apps.filter(a => a.status === "shortlisted").length,
    evaluating: apps.filter(a => a.status === "evaluating").length,
    finalist: apps.filter(a => a.status === "finalist").length,
    interview: apps.filter(a => a.status === "interview").length,
    thefinalteam: apps.filter(a => a.status === "the final team").length,
    rejected: apps.filter(a => a.status === "rejected").length,
  };

  // ─── Login page ───────────────────────────────────────────
  if (!authed) {
    return (
      <div style={{ height: "100vh", display: "flex", fontFamily: sans, background: "#111" }}>
        {/* Left */}
        <div style={{ width: "46%", borderRight: "1px solid #222", display: "flex", flexDirection: "column", justifyContent: "center", padding: "40px 48px" }}>
          {/* FIX: logo proporsional + jarak ke teks */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <img src="/logoo.png" alt="Jedda" style={{ height: 20, width: "auto", maxWidth: 160, display: "block", filter: "invert(1)", objectFit: "contain", objectPosition: "left center" }} />
            <p style={{ fontSize: 9, fontWeight: 300, letterSpacing: 2, textTransform: "uppercase", color: "#444" }}>recruitment dashboard</p>
          </div>
        </div>
        {/* Right */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 240 }}>
            <div style={{ position: "relative", marginBottom: pwErr ? 12 : 20 }}>
              <input
                type={pwVisible ? "text" : "password"}
                placeholder="password"
                value={pw}
                onChange={e => setPw(e.target.value)}
                onKeyDown={e => e.key === "Enter" && login()}
                style={{ width: "100%", border: "none", borderBottom: `1px solid ${pwErr ? "#c47a5a" : "#333"}`, padding: "8px 40px 8px 0", fontFamily: sans, fontSize: 13, fontWeight: 300, color: "#fff", background: "transparent", outline: "none" }}
              />
              <button onClick={() => setPwVisible(v => !v)}
                style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 0, color: "#444", fontFamily: sans, fontSize: 10, fontWeight: 300, letterSpacing: 0.5 }}>
                {pwVisible ? "hide" : "show"}
              </button>
            </div>
            {pwErr && <p style={{ fontSize: 10, fontWeight: 200, color: "#c47a5a", marginBottom: 16 }}>incorrect password</p>}
            <button onClick={login}
              style={{ background: "#fff", border: "none", color: "#111", fontFamily: sans, fontSize: 10, fontWeight: 400, padding: "10px 22px", cursor: "pointer", letterSpacing: 1 }}>
              enter →
            </button>
          </div>
        </div>
      </div>
    );
  }

  const newApps = apps.filter(a => a.status === "new");
  const filteredNew = newApps
    .filter(a => newPosFilter === "all" || getDivision(a.position) === newPosFilter)
    .filter(a => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (a.full_name || "").toLowerCase().includes(q) || (a.position || "").toLowerCase().includes(q) || (a.city || "").toLowerCase().includes(q);
    });

  const SbItem = ({ id, label }) => (
    <div className={`sb-item${page === id && !evaluatingApp ? " active" : ""}`} onClick={() => { setPage(id); setEvaluatingApp(null); }}
      style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 22px", cursor: "pointer", transition: "all 0.12s", borderLeft: "2px solid transparent" }}>
      <span className="sb-label" style={{ fontSize: 12, fontWeight: 300, color: "#aaa", fontFamily: sans }}>{label}</span>
      <span className="sb-count" style={{ fontSize: 10, fontWeight: 300, color: "#ccc", background: "#f5f5f5", padding: "2px 7px", borderRadius: 10, minWidth: 22, textAlign: "center", fontFamily: sans }}>{counts[id] ?? 0}</span>
    </div>
  );

  const renderPage = () => {
    if (evaluatingApp) {
      return (
        <EvaluatingDetail
          app={evaluatingApp}
          onBack={() => setEvaluatingApp(null)}
          showToast={showToast}
          onPass={async () => { await updateStatus(evaluatingApp.id, "finalist", { is_priority: false }); setEvaluatingApp(null); showToast("→ finalist"); }}
          onFail={async () => { await updateStatus(evaluatingApp.id, "rejected", { rejection_sent: false }); setEvaluatingApp(null); showToast("→ rejected"); }}
        />
      );
    }

    switch (page) {
      case "overview": {
        const inPipeline = apps.filter(a => ["shortlisted","evaluating","finalist","interview"].includes(a.status)).length;
        const filteredOverview = apps
          .filter(a => overviewDiv === "all" || getDivision(a.position) === overviewDiv)
          .filter(a => {
            if (!ovSearch) return true;
            const q = ovSearch.toLowerCase();
            return (a.full_name || "").toLowerCase().includes(q) || (a.position || "").toLowerCase().includes(q) || (a.city || "").toLowerCase().includes(q);
          });
        return (
          <div style={{ padding: "36px 40px" }}>
            <div style={{ marginBottom: 28 }}>
              <p style={{ fontSize: 21, fontWeight: 300, marginBottom: 3 }}>all applicants</p>
              <p style={{ fontSize: 11, fontWeight: 200, color: "#bbb" }}>status overview — click a row to view details</p>
            </div>
            <Stats cols={4} items={[["total", apps.length], ["pending review", counts.new], ["in progress", inPipeline], ["rejected", counts.rejected]]} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <DivFilter allApps={apps} active={overviewDiv} onChange={setOverviewDiv} />
              <input value={ovSearch} onChange={e => setOvSearch(e.target.value)} placeholder="search name, position, city..."
                style={{ border: "none", borderBottom: "1px solid #e8e8e8", padding: "6px 0", fontFamily: sans, fontSize: 11, fontWeight: 300, color: "#1a1a1a", background: "transparent", outline: "none", width: 220 }} />
            </div>
            <Tbl>
              <THead cols="1fr 1fr 1fr 110px">
                <TH>name</TH><TH>position</TH><TH>availability</TH><TH>status</TH>
              </THead>
              {loading ? <Empty msg="loading..." /> : filteredOverview.length === 0 ? <Empty msg="no applications yet" /> :
                filteredOverview.map(a => (
                  <TRow key={a.id} cols="1fr 1fr 1fr 110px" onClick={() => setPanelApp(a)}>
                    <TName name={a.full_name} sub={a.city} />
                    <TPos>{a.position?.toLowerCase()}</TPos>
                    <span style={{ fontSize: 11, fontWeight: 200, color: "#999" }}>{a.availability}</span>
                    <StatusBadge status={a.status} />
                  </TRow>
                ))
              }
            </Tbl>
          </div>
        );
      }

      case "new": {
        return (
          <div style={{ padding: "36px 40px" }}>
            <div style={{ marginBottom: 28 }}>
              <p style={{ fontSize: 21, fontWeight: 300, marginBottom: 3 }}>pending review</p>
              <p style={{ fontSize: 11, fontWeight: 200, color: "#bbb" }}>not yet reviewed — open cv or portfolio first, then take action</p>
            </div>
            <Stats cols={3} items={[["total", newApps.length], ["from bandung", newApps.filter(a => a.city?.toLowerCase().includes("bandung")).length], ["with portfolio", newApps.filter(a => a.portfolio_url || a.portfolio_link).length]]} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <DivFilter allApps={newApps} active={newPosFilter} onChange={setNewPosFilter} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="search name, position, city..."
                style={{ border: "none", borderBottom: "1px solid #e8e8e8", padding: "6px 0", fontFamily: sans, fontSize: 11, fontWeight: 300, color: "#1a1a1a", background: "transparent", outline: "none", width: 220 }} />
            </div>
            <Tbl>
              <THead cols="200px 1fr 90px 56px 56px 60px 1fr">
                <TH>name</TH><TH>position</TH><TH>type</TH><TH>cv</TH><TH>porto</TH><TH>bandung</TH><TH><span style={{ paddingLeft: 24 }}>action</span></TH>
              </THead>
              {filteredNew.length === 0 ? <Empty msg="no pending applicants" /> :
                filteredNew.map(a => (
                  <TRow key={a.id} cols="200px 1fr 90px 56px 56px 60px 1fr" onClick={() => setPanelApp(a)}>
                    <TName name={a.full_name} sub={a.city} />
                    <TPos>{a.position?.toLowerCase()}</TPos>
                    <Badge wt={a.work_type} />
                    <DocLink url={a.cv_url} />
                    <DocLink url={a.portfolio_url || a.portfolio_link} />
                    <span style={{ fontSize: 11, fontWeight: 200, color: a.bandung === "yes" ? "#6a9e76" : "#ccc" }}>{a.bandung || "—"}</span>
                    <div style={{ paddingLeft: 24 }} onClick={e => e.stopPropagation()}>
                      <ActionRow actions={[
                        { label: "on hold", onClick: () => { updateStatus(a.id, "on hold"); showToast("→ on hold"); } },
                        { label: "shortlisted", cls: "primary", onClick: () => { updateStatus(a.id, "shortlisted"); showToast("→ shortlisted"); } },
                        { label: "priority", onClick: () => { updateStatus(a.id, "finalist", { is_priority: true }); showToast("→ finalist (priority)"); } },
                        { label: "reject", cls: "danger", onClick: () => { updateStatus(a.id, "rejected", { rejection_sent: false }); showToast("→ rejected"); } },
                      ]} />
                    </div>
                  </TRow>
                ))
              }
            </Tbl>
          </div>
        );
      }

      case "onhold":       return <OnHoldPage apps={apps} updateStatus={updateStatus} showToast={showToast} setPanelApp={setPanelApp} />;
      case "referredout":  return <ReferredOutPage apps={apps} setPanelApp={setPanelApp} />;
      case "shortlisted":  return <ShortlistedPage apps={apps} updateStatus={updateStatus} showToast={showToast} setPanelApp={setPanelApp} />;
      case "evaluating":   return <EvaluatingPage apps={apps} setEvaluatingApp={setEvaluatingApp} showToast={showToast} />;
      case "finalist":     return <FinalistPage apps={apps} setInterviewApp={setInterviewApp} setPanelApp={setPanelApp} />;
      case "interview":    return <InterviewPage apps={apps} updateStatus={updateStatus} showToast={showToast} />;
      case "thefinalteam": return <FinalTeamPage apps={apps} setPanelApp={setPanelApp} setAcceptanceApp={setAcceptanceApp} />;
      case "rejected":     return <RejectedPage apps={apps} updateStatus={updateStatus} showToast={showToast} setPanelApp={setPanelApp} />;
      default: return null;
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", fontFamily: sans, color: "#1a1a1a" }}>
      <div style={{ width: 196, flexShrink: 0, background: "#fff", borderRight: "1px solid #f0f0f0", display: "flex", flexDirection: "column", padding: "28px 0 20px", overflowY: "auto" }}>
        <div style={{ padding: "0 22px 20px" }}>
          <img src="/logoo.png" alt="Jedda" style={{ height: 14, width: "auto", display: "block" }} />
        </div>
        <div style={{ fontSize: 9, fontWeight: 400, letterSpacing: 2, color: "#ccc", textTransform: "uppercase", padding: "0 22px 8px" }}>overview</div>
        <SbItem id="overview" label="all applicants" />
        <div style={{ height: 1, background: "#f0f0f0", margin: "14px 22px" }} />
        <div style={{ fontSize: 9, fontWeight: 400, letterSpacing: 2, color: "#ccc", textTransform: "uppercase", padding: "0 22px 8px" }}>review</div>
        <SbItem id="new" label="pending review" />
        <SbItem id="onhold" label="on hold" />
        <SbItem id="referredout" label="referred out" />
        <div style={{ height: 1, background: "#f0f0f0", margin: "14px 22px" }} />
        <div style={{ fontSize: 9, fontWeight: 400, letterSpacing: 2, color: "#ccc", textTransform: "uppercase", padding: "0 22px 8px" }}>pipeline</div>
        <SbItem id="shortlisted" label="shortlisted" />
        <SbItem id="evaluating" label="evaluating" />
        <SbItem id="finalist" label="finalists" />
        <SbItem id="interview" label="interview" />
        <div style={{ height: 1, background: "#f0f0f0", margin: "14px 22px" }} />
        <div style={{ fontSize: 9, fontWeight: 400, letterSpacing: 2, color: "#ccc", textTransform: "uppercase", padding: "0 22px 8px" }}>closed</div>
        <SbItem id="thefinalteam" label="the final team" />
        <SbItem id="rejected" label="rejected" />
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {renderPage()}
      </div>

      {panelApp && (
        <DetailPanel
          app={panelApp}
          onClose={() => setPanelApp(null)}
          onMoveBack={(id, status) => { updateStatus(id, status); showToast(`→ ${status}`); }}
          onReferOut={(id) => { updateStatus(id, "referred out"); showToast("→ referred out"); }}
        />
      )}

      {interviewApp && (
        <InterviewModal
          app={interviewApp}
          onClose={() => setInterviewApp(null)}
          onConfirm={(dt, mode) => {
            const body = buildInterviewEmail(interviewApp, mode, dt);
            window.open(`https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(interviewApp.email)}&su=${encodeURIComponent(interviewApp.full_name.split(" ")[0])}%2C%20we%27d%20like%20to%20meet%20you.&body=${encodeURIComponent(body)}`, "_blank");
            updateStatus(interviewApp.id, "interview", { interview_date: dt, interview_mode: mode });
            setInterviewApp(null);
            showToast("interview scheduled ✓");
          }}
        />
      )}

      {acceptanceApp && (
        <AcceptanceModal
          app={acceptanceApp}
          onClose={() => setAcceptanceApp(null)}
          onConfirm={() => {
            const body = `Hi ${acceptanceApp.full_name.split(" ")[0]},\n\nWelcome to Jedda.\n\nYou're officially part of the team as ${acceptanceApp.position?.toLowerCase()}. We're glad to have you with us — onboarding details will follow shortly.\n\n— Jedda Team`;
            window.open(`https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(acceptanceApp.email)}&su=Welcome%20to%20Jedda&body=${encodeURIComponent(body)}`, "_blank");
            updateStatus(acceptanceApp.id, "the final team", { acceptance_sent: true });
            setAcceptanceApp(null);
            showToast("acceptance sent ✓");
          }}
        />
      )}

      {toast && (
        <div style={{ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", background: "#1a1a1a", color: "#fff", fontFamily: sans, fontSize: 11, fontWeight: 300, padding: "10px 20px", letterSpacing: 0.5, zIndex: 500 }}>
          {toast}
        </div>
      )}
    </div>
  );
}
