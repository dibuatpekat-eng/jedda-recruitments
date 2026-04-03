import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const PASS = import.meta.env.VITE_ADMIN_PASSWORD || "jedda2026";
const sans = "'DM Sans', sans-serif";

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
    "testing":        { bg: "#f0eaf5",  color: "#6b3fa0" },
    "finalist":       { bg: "#e1f5ee",  color: "#0f6e56" },
    "interview":      { bg: "#f5f0eb",  color: "#a0826a" },
    "rejected":       { bg: "#fcebeb",  color: "#a32d2d" },
    "the final team": { bg: "#1a1a1a",  color: "#fff"    },
    "withdrawn":      { bg: "#f5f5f5",  color: "#aaa"    },
  };
  return map[s] || { bg: "#f5f5f5", color: "#aaa" };
}

// ─── css injected once ─────────────────────────────────────
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
.ar-ghost:hover{color:#1a1a1a!important;border-color:#999!important;opacity:1!important}
.tc-card:hover{border-color:#ccc!important}
.f-btn:hover:not(.f-active){color:#1a1a1a}
`;

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
    ghost: { color: "#999", borderBottom: "1px solid #ddd", paddingBottom: 2 },
    standalone: { color: "#1a1a1a", borderBottom: "1px solid #1a1a1a", paddingBottom: 2 },
  };
  return (
    <button
      className={`ar-btn ar-${cls || "base"}`}
      onClick={e => { e.stopPropagation(); onClick(); }}
      style={{ ...styles.base, ...(styles[cls] || {}) }}
    >{label}</button>
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

// ─── TH / TR helpers ───────────────────────────────────────
function THead({ cols, children }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: cols, gap: 12, padding: "9px 18px", background: "#fafafa", borderBottom: "1px solid #f0f0f0" }}>
      {children}
    </div>
  );
}
function TH({ children }) {
  return <span style={{ fontSize: 9, fontWeight: 400, letterSpacing: 2, color: "#bbb", textTransform: "uppercase" }}>{children}</span>;
}
function TRow({ cols, onClick, children }) {
  return (
    <div
      className="tr-row"
      onClick={onClick}
      style={{ display: "grid", gridTemplateColumns: cols, gap: 12, padding: "13px 18px", borderBottom: "1px solid #f5f5f5", alignItems: "center", cursor: "pointer", transition: "background 0.1s" }}
    >{children}</div>
  );
}
function TName({ name, sub }) {
  return (
    <div>
      <p style={{ fontSize: 13, fontWeight: 400, marginBottom: 2 }}>{name}</p>
      <p style={{ fontSize: 10, fontWeight: 200, color: "#aaa" }}>{sub}</p>
    </div>
  );
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
function DocLink({ url, label }) {
  if (!url) return <span style={{ fontSize: 11, fontWeight: 200, color: "#ccc" }}>—</span>;
  return <a href={url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ fontSize: 11, fontWeight: 300, color: "#999", textDecoration: "none" }}>open →</a>;
}
function SentLabel({ text }) {
  return <span style={{ fontSize: 10, fontWeight: 200, color: "#bbb" }}>{text}</span>;
}

// ─── Stat cards ────────────────────────────────────────────
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

// ─── Detail Panel ──────────────────────────────────────────
function DetailPanel({ app, onClose, onMoveBack }) {
  if (!app) return null;
  const tag = typeTag(app.work_type);
  const fields = [
    ["position", app.position], ["work type", app.work_type],
    ["phone", app.phone], ["email", app.email],
    ["city", app.city], ["open to bandung", app.bandung],
    ["availability", app.availability],
    ["why jedda", app.why_jedda],
  ].filter(([, v]) => v);

  const moveBackOptions = {
    "shortlisted": [
      { label: "← pending review", status: "new" },
      { label: "on hold", status: "on hold" },
    ],
    "on hold": [
      { label: "← pending review", status: "new" },
    ],
    "testing": [
      { label: "← shortlisted", status: "shortlisted" },
    ],
    "finalist": [
      { label: "← testing", status: "testing" },
      { label: "← shortlisted", status: "shortlisted" },
    ],
  };
  const moveOpts = moveBackOptions[app.status] || [];

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
            <div style={{ display: "flex", alignItems: "center", gap: 0, paddingTop: 4 }}>
              <span style={{ fontSize: 9, fontWeight: 300, color: "#ccc", letterSpacing: 1, textTransform: "uppercase", flexShrink: 0, marginRight: 10 }}>move back to</span>
              {moveOpts.map((opt, i) => (
                <span key={opt.status} style={{ display: "flex", alignItems: "center" }}>
                  {i > 0 && <div style={{ width: 1, height: 10, background: "#e8e8e8", margin: "0 10px" }} />}
                  <button onClick={() => { onMoveBack(app.id, opt.status); onClose(); }}
                    style={{ background: "none", border: "none", fontFamily: sans, fontSize: 10, fontWeight: 300, color: "#aaa", cursor: "pointer", padding: 0, transition: "color 0.15s" }}
                    onMouseOver={e => e.target.style.color = "#1a1a1a"}
                    onMouseOut={e => e.target.style.color = "#aaa"}
                  >{opt.label}</button>
                </span>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Interview Modal ────────────────────────────────────────
function InterviewModal({ app, onClose, onConfirm }) {
  const [dt, setDt] = useState("");
  if (!app) return null;
  const d = dt ? new Date(dt) : null;
  const dateStr = d ? d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "";
  const timeStr = d ? d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "";
  const preview = d
    ? `Hi ${app.full_name.split(" ")[0]},\n\nCongratulations — you've been selected for an interview with Jedda.\n\nYour interview is scheduled for:\n${dateStr} at ${timeStr}\n\nWe'll share more details shortly.\n\n— Jedda Team`
    : "select a date first.";
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.12)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", padding: "36px 32px", width: 420, border: "1px solid #f0f0f0", fontFamily: sans }}>
        <p style={{ fontSize: 14, fontWeight: 300, marginBottom: 4 }}>schedule interview</p>
        <p style={{ fontSize: 11, fontWeight: 200, color: "#aaa", marginBottom: 24 }}>{app.full_name} — {app.position?.toLowerCase()}</p>
        <p style={{ fontSize: 9, fontWeight: 300, letterSpacing: 2, textTransform: "uppercase", color: "#bbb", marginBottom: 8 }}>date & time</p>
        <input type="datetime-local" value={dt} onChange={e => setDt(e.target.value)}
          style={{ width: "100%", border: "none", borderBottom: "1px solid #e8e8e8", padding: "8px 0", fontFamily: sans, fontSize: 12, fontWeight: 300, color: "#1a1a1a", outline: "none", background: "transparent", marginBottom: 22 }} />
        <p style={{ fontSize: 9, fontWeight: 300, letterSpacing: 2, textTransform: "uppercase", color: "#bbb", marginBottom: 8 }}>email preview</p>
        <div style={{ background: "#fafafa", border: "1px solid #f0f0f0", padding: "16px 18px", marginBottom: 24, fontSize: 11, fontWeight: 300, color: "#777", lineHeight: 1.9, minHeight: 80, whiteSpace: "pre-wrap" }}>{preview}</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button onClick={onClose} style={{ background: "none", border: "none", borderBottom: "1px solid #ddd", paddingBottom: 2, fontFamily: sans, fontSize: 10, fontWeight: 300, color: "#999", cursor: "pointer" }}>cancel</button>
          <button onClick={() => { if (!dt) return; onConfirm(dt); }} style={{ background: "none", border: "none", borderBottom: "1px solid #1a1a1a", paddingBottom: 2, fontFamily: sans, fontSize: 10, fontWeight: 300, color: "#1a1a1a", cursor: "pointer" }}>send email →</button>
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

// ─── Testing Detail ─────────────────────────────────────────
function TestingDetail({ app, onBack, onPass, onFail }) {
  if (!app) return null;
  return (
    <div style={{ padding: "36px 40px", fontFamily: sans, color: "#1a1a1a" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", fontFamily: sans, fontSize: 10, fontWeight: 300, color: "#aaa", cursor: "pointer", marginBottom: 28, padding: 0 }}>← back to testing</button>
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 21, fontWeight: 300, marginBottom: 3 }}>{app.full_name}</p>
        <p style={{ fontSize: 11, fontWeight: 200, color: "#bbb" }}>{app.position?.toLowerCase()} · {typeTag(app.work_type).label}</p>
      </div>
      {[
        ["question 1 — motivation", "The applicant's answer will appear here once they complete the test form. This page scrolls fully so nothing gets cut off."],
        ["question 2 — case study", "Case study answer appears here. The team can review everything comfortably — full width, no scroll limit."],
        ["question 3 — vision", "Third question and beyond flow downward. Everything reads clearly."],
      ].map(([q, a]) => (
        <div key={q} style={{ background: "#fff", border: "1px solid #f0f0f0", padding: "24px 28px", marginBottom: 12 }}>
          <p style={{ fontSize: 9, fontWeight: 300, letterSpacing: 2, textTransform: "uppercase", color: "#bbb", marginBottom: 10 }}>{q}</p>
          <p style={{ fontSize: 13, fontWeight: 300, color: "#444", lineHeight: 1.9 }}>{a}</p>
        </div>
      ))}
      <div style={{ display: "flex", alignItems: "center", marginTop: 20 }}>
        <ArBtn label="passed → make finalist" cls="primary" onClick={onPass} />
        <ArDivider />
        <ArBtn label="did not pass" cls="danger" onClick={onFail} />
      </div>
    </div>
  );
}

// ─── MAIN DASHBOARD ─────────────────────────────────────────
export default function AdminDashboard() {
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState("");
  const [pwErr, setPwErr] = useState(false);
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState("overview");
  const [panelApp, setPanelApp] = useState(null);
  const [interviewApp, setInterviewApp] = useState(null);
  const [acceptanceApp, setAcceptanceApp] = useState(null);
  const [testingApp, setTestingApp] = useState(null);
  const [newPosFilter, setNewPosFilter] = useState("all");
  const [search, setSearch] = useState("");
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
    overview: apps.length,
    new: apps.filter(a => a.status === "new").length,
    onhold: apps.filter(a => a.status === "on hold").length,
    shortlisted: apps.filter(a => a.status === "shortlisted").length,
    testing: apps.filter(a => a.status === "testing").length,
    finalist: apps.filter(a => a.status === "finalist").length,
    interview: apps.filter(a => a.status === "interview").length,
    thefinalteam: apps.filter(a => a.status === "the final team").length,
    rejected: apps.filter(a => a.status === "rejected").length,
  };

  const newApps = apps.filter(a => a.status === "new");
  const filteredNew = newApps.filter(a => {
    const matchDiv = newPosFilter === "all" || getDivision(a.position) === newPosFilter;
    const q = search.toLowerCase();
    const matchQ = !q || a.full_name?.toLowerCase().includes(q) || a.position?.toLowerCase().includes(q) || a.city?.toLowerCase().includes(q);
    return matchDiv && matchQ;
  });

  // ─── Login screen ───────────────────────────────────────
  if (!authed) return (
    <div style={{ position: "fixed", inset: 0, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: sans }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@200;300;400&display=swap');*{box-sizing:border-box;margin:0;padding:0}input::placeholder{color:#ccc}input:focus{outline:none}`}</style>
      <div style={{ textAlign: "center", width: 280 }}>
        <p style={{ fontSize: 9, fontWeight: 300, letterSpacing: 4, color: "#bbb", textTransform: "uppercase", marginBottom: 32 }}>jedda — recruitment</p>
        <input type="password" placeholder="password" value={pw}
          onChange={e => { setPw(e.target.value); setPwErr(false); }}
          onKeyDown={e => e.key === "Enter" && login()}
          style={{ width: "100%", border: "none", borderBottom: `1px solid ${pwErr ? "#c47a5a" : "#e8e8e8"}`, padding: "10px 0", fontFamily: sans, fontSize: 13, fontWeight: 300, outline: "none", background: "transparent", textAlign: "center", letterSpacing: 2 }}
          autoFocus />
        {pwErr && <p style={{ fontSize: 10, color: "#c47a5a", marginTop: 8, fontWeight: 300 }}>incorrect password</p>}
        <div style={{ height: 28 }} />
        <button onClick={login} style={{ background: "none", border: "none", fontFamily: sans, fontSize: 11, fontWeight: 300, color: "#1a1a1a", cursor: "pointer", letterSpacing: 2, borderBottom: "1px solid #1a1a1a", paddingBottom: 3 }}>enter →</button>
      </div>
    </div>
  );

  const SbItem = ({ id, label }) => (
    <div className={`sb-item${page === id ? " active" : ""}`} onClick={() => { setPage(id); setTestingApp(null); }}
      style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 22px", cursor: "pointer", transition: "all 0.12s", borderLeft: "2px solid transparent" }}>
      <span className="sb-label" style={{ fontSize: 12, fontWeight: 300, color: "#aaa", fontFamily: sans }}>{label}</span>
      <span className="sb-count" style={{ fontSize: 10, fontWeight: 300, color: "#ccc", background: "#f5f5f5", padding: "2px 7px", borderRadius: 10, minWidth: 22, textAlign: "center", fontFamily: sans }}>{counts[id] ?? 0}</span>
    </div>
  );

  // ─── Render pages ───────────────────────────────────────
  const renderPage = () => {
    if (testingApp) {
      return (
        <TestingDetail
          app={testingApp}
          onBack={() => setTestingApp(null)}
          onPass={async () => { await updateStatus(testingApp.id, "finalist", { is_priority: false }); setTestingApp(null); showToast("→ finalist"); }}
          onFail={async () => { await updateStatus(testingApp.id, "rejected", { rejection_sent: false }); setTestingApp(null); showToast("→ rejected"); }}
        />
      );
    }

    const ph = (title, sub) => (
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 21, fontWeight: 300, marginBottom: 3 }}>{title}</p>
        <p style={{ fontSize: 11, fontWeight: 200, color: "#bbb" }}>{sub}</p>
      </div>
    );

    switch (page) {

      // ── OVERVIEW ──────────────────────────────────────────
      case "overview": {
        const inPipeline = apps.filter(a => ["shortlisted","testing","finalist","interview"].includes(a.status)).length;
        return (
          <div style={{ padding: "36px 40px" }}>
            {ph("all applicants", "status overview — click a row to view details")}
            <Stats cols={4} items={[["total", apps.length], ["pending review", counts.new], ["in progress", inPipeline], ["rejected", counts.rejected]]} />
            <Tbl>
              <THead cols="1fr 1fr 1fr 110px">
                <TH>name</TH><TH>position</TH><TH>availability</TH><TH>status</TH>
              </THead>
              {loading ? <Empty msg="loading..." /> : apps.length === 0 ? <Empty msg="no applications yet" /> :
                apps.map(a => (
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

      // ── PENDING REVIEW ────────────────────────────────────
      case "new": {
        return (
          <div style={{ padding: "36px 40px" }}>
            {ph("pending review", "not yet reviewed — open cv or portfolio first, then take action")}
            <Stats cols={3} items={[["total", newApps.length], ["from bandung", newApps.filter(a => a.city?.toLowerCase().includes("bandung")).length], ["with portfolio", newApps.filter(a => a.portfolio_url || a.portfolio_link).length]]} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ display: "flex", gap: 4 }}>
                {["all","design","creative","retail"].map(f => {
                  const cnt = f === "all" ? newApps.length : newApps.filter(a => getDivision(a.position) === f).length;
                  return (
                    <button key={f} className={`f-btn${newPosFilter === f ? " f-active" : ""}`} onClick={() => setNewPosFilter(f)}
                      style={{ fontSize: 10, fontWeight: 300, color: newPosFilter === f ? "#fff" : "#bbb", background: newPosFilter === f ? "#1a1a1a" : "none", border: "none", cursor: "pointer", fontFamily: sans, padding: "5px 12px", borderRadius: 20, transition: "all 0.15s" }}>
                      {`${f} (${cnt})`}
                    </button>
                  );
                })}
              </div>
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

      // ── ON HOLD ───────────────────────────────────────────
      case "onhold": {
        const onholdApps = apps.filter(a => a.status === "on hold");
        return (
          <div style={{ padding: "36px 40px" }}>
            {ph("on hold", "under consideration — request missing documents or move to next stage")}
            <Tbl>
              <THead cols="200px 1fr 90px 56px 56px 1fr">
                <TH>name</TH><TH>position</TH><TH>type</TH><TH>cv</TH><TH>porto</TH><TH><span style={{ paddingLeft: 24 }}>action</span></TH>
              </THead>
              {onholdApps.length === 0 ? <Empty msg="nothing on hold" /> :
                onholdApps.map(a => (
                  <TRow key={a.id} cols="200px 1fr 90px 56px 56px 1fr" onClick={() => setPanelApp(a)}>
                    <TName name={a.full_name} sub={a.city} />
                    <TPos>{a.position?.toLowerCase()}</TPos>
                    <Badge wt={a.work_type} />
                    <DocLink url={a.cv_url} />
                    <DocLink url={a.portfolio_url || a.portfolio_link} />
                    <div style={{ paddingLeft: 24 }} onClick={e => e.stopPropagation()}>
                      <ActionRow actions={[
                        {
                          label: "request document",
                          onClick: () => {
                            const link = `https://careers.jeddawear.com/reupload?id=${a.id}`;
                            const body = `Hi%20${encodeURIComponent(a.full_name.split(" ")[0])}%2C%0A%0AThank%20you%20for%20applying%20to%20Jedda.%20We%E2%80%99ve%20reviewed%20your%20submission%20and%20would%20love%20to%20continue%20reviewing%20your%20work%20%E2%80%94%20however%2C%20we%20weren%E2%80%99t%20able%20to%20open%20your%20portfolio.%0A%0ACould%20you%20re-share%20it%20via%20the%20link%20below%3F%20You%20can%20upload%20a%20PDF%20or%20paste%20a%20link%20to%20Behance%2C%20Dribbble%2C%20Notion%2C%20or%20any%20accessible%20platform.%0A%0A${encodeURIComponent(link)}%0A%0ALooking%20forward%20to%20seeing%20your%20work.%0A%0A%E2%80%94%20Jedda%20Team`;
                            window.location.href = `mailto:${a.email}?subject=Your%20Jedda%20Application%20%E2%80%94%20Portfolio%20Update%20Request&body=${body}`;
                          }
                        },
                        { label: "shortlisted", cls: "primary", onClick: () => { updateStatus(a.id, "shortlisted"); showToast("→ shortlisted"); } },
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

      // ── SHORTLISTED ───────────────────────────────────────
      case "shortlisted": {
        const slApps = apps.filter(a => a.status === "shortlisted");
        return (
          <div style={{ padding: "36px 40px" }}>
            {ph("shortlisted", "passed initial review — send test link to proceed")}
            <Tbl>
              <THead cols="1fr 1fr 1fr 1fr">
                <TH>name</TH><TH>position</TH><TH>type</TH><TH>action</TH>
              </THead>
              {slApps.length === 0 ? <Empty msg="no one shortlisted yet" /> :
                slApps.map(a => (
                  <TRow key={a.id} cols="1fr 1fr 1fr 1fr" onClick={() => setPanelApp(a)}>
                    <TName name={a.full_name} sub={a.city} />
                    <TPos>{a.position?.toLowerCase()}</TPos>
                    <Badge wt={a.work_type} />
                    <div onClick={e => e.stopPropagation()}>
                      <button onClick={() => { updateStatus(a.id, "testing"); showToast("test link sent ✓"); }}
                        style={{ background: "none", border: "none", borderBottom: "1px solid #1a1a1a", paddingBottom: 2, fontFamily: sans, fontSize: 10, fontWeight: 300, color: "#1a1a1a", cursor: "pointer" }}>
                        send test link →
                      </button>
                    </div>
                  </TRow>
                ))
              }
            </Tbl>
          </div>
        );
      }

      // ── TESTING ───────────────────────────────────────────
      case "testing": {
        const testApps = apps.filter(a => a.status === "testing");
        return (
          <div style={{ padding: "36px 40px" }}>
            {ph("testing", "click a name to review their full answers")}
            {testApps.length === 0 ? <Empty msg="no one in testing yet" /> :
              testApps.map(a => (
                <div key={a.id} className="tc-card" onClick={() => setTestingApp(a)}
                  style={{ background: "#fff", border: "1px solid #f0f0f0", padding: "18px 20px", cursor: "pointer", transition: "border-color 0.12s", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 400, marginBottom: 3 }}>{a.full_name}</p>
                    <p style={{ fontSize: 11, fontWeight: 200, color: "#aaa" }}>{a.position?.toLowerCase()} · {typeTag(a.work_type).label}</p>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 200, color: "#ccc" }}>view answers →</span>
                </div>
              ))
            }
          </div>
        );
      }

      // ── FINALIST ──────────────────────────────────────────
      case "finalist": {
        const finApps = apps.filter(a => a.status === "finalist");
        return (
          <div style={{ padding: "36px 40px" }}>
            {ph("finalists", "schedule their interview")}
            <Tbl>
              <THead cols="1.8fr 1.4fr 80px 24px 1fr">
                <TH>name</TH><TH>position</TH><TH>type</TH><TH></TH><TH>action</TH>
              </THead>
              {finApps.length === 0 ? <Empty msg="no finalists yet" /> :
                finApps.map(a => (
                  <TRow key={a.id} cols="1.8fr 1.4fr 80px 24px 1fr" onClick={() => setPanelApp(a)}>
                    <TName name={a.full_name} sub={a.city} />
                    <TPos>{a.position?.toLowerCase()}</TPos>
                    <Badge wt={a.work_type} />
                    <span title={a.is_priority ? "priority" : "via testing"}>
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

      // ── INTERVIEW ─────────────────────────────────────────
      case "interview": {
        const intApps = [...apps.filter(a => a.status === "interview")].sort((a, b) => {
          const ta = a.interview_date ? new Date(a.interview_date).getTime() : Infinity;
          const tb = b.interview_date ? new Date(b.interview_date).getTime() : Infinity;
          return ta - tb;
        });
        return (
          <div style={{ padding: "36px 40px" }}>
            {ph("interview", "scheduled interviews — sorted by nearest date")}
            {intApps.length === 0 ? <Empty msg="no interviews scheduled yet" /> :
              intApps.map(a => {
                const d = a.interview_date ? new Date(a.interview_date) : null;
                const dateStr = d ? d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" }) : "—";
                const timeStr = d ? d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "";
                return (
                  <div key={a.id} style={{ background: "#fff", border: "1px solid #f0f0f0", padding: "18px 20px", marginBottom: 8, display: "grid", gridTemplateColumns: "160px 1fr 90px 1fr", gap: 16, alignItems: "center" }}>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 400, marginBottom: 2 }}>{dateStr}</p>
                      <p style={{ fontSize: 10, fontWeight: 200, color: "#aaa" }}>{timeStr}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 400, marginBottom: 2 }}>{a.full_name}</p>
                      <p style={{ fontSize: 10, fontWeight: 200, color: "#aaa" }}>{a.city}</p>
                    </div>
                    <Badge wt={a.work_type} />
                    <ActionRow actions={[
                      { label: "passed → the final team", cls: "primary", onClick: () => { updateStatus(a.id, "the final team"); showToast("→ the final team"); } },
                      { label: "did not pass", cls: "danger", onClick: () => { updateStatus(a.id, "rejected", { rejection_sent: false }); showToast("→ rejected"); } },
                    ]} />
                  </div>
                );
              })
            }
          </div>
        );
      }

      // ── THE FINAL TEAM ────────────────────────────────────
      case "thefinalteam": {
        const ftApps = apps.filter(a => a.status === "the final team");
        return (
          <div style={{ padding: "36px 40px" }}>
            {ph("the final team", "officially part of Jedda — send acceptance email")}
            <Tbl>
              <THead cols="1.8fr 1.4fr 80px 1fr">
                <TH>name</TH><TH>position</TH><TH>type</TH><TH>action</TH>
              </THead>
              {ftApps.length === 0 ? <Empty msg="no new team members yet" /> :
                ftApps.map(a => (
                  <TRow key={a.id} cols="1.8fr 1.4fr 80px 1fr" onClick={() => setPanelApp(a)}>
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

      // ── REJECTED ──────────────────────────────────────────
      case "rejected": {
        const rejApps = apps.filter(a => a.status === "rejected");
        return (
          <div style={{ padding: "36px 40px" }}>
            {ph("rejected", "did not pass — send rejection email manually")}
            <Tbl>
              <THead cols="1.8fr 1.4fr 80px 110px 1fr">
                <TH>name</TH><TH>position</TH><TH>type</TH><TH>rejected from</TH><TH>action</TH>
              </THead>
              {rejApps.length === 0 ? <Empty msg="no rejections" /> :
                rejApps.map(a => (
                  <TRow key={a.id} cols="1.8fr 1.4fr 80px 110px 1fr" onClick={() => setPanelApp(a)}>
                    <TName name={a.full_name} sub={a.city} />
                    <TPos>{a.position?.toLowerCase()}</TPos>
                    <Badge wt={a.work_type} />
                    <span style={{ fontSize: 10, fontWeight: 200, color: "#ccc" }}>{a.rejected_from ? "from " + a.rejected_from : "—"}</span>
                    <div onClick={e => e.stopPropagation()}>
                      {a.rejection_sent
                        ? <SentLabel text="rejection sent ✓" />
                        : <button onClick={async () => { await updateStatus(a.id, "rejected", { rejection_sent: true }); showToast("rejection email sent ✓"); }}
                            style={{ background: "none", border: "none", borderBottom: "1px solid #ddd", paddingBottom: 2, fontFamily: sans, fontSize: 10, fontWeight: 300, color: "#999", cursor: "pointer" }}>
                            send rejection email
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

      default: return null;
    }
  };

  // ─── Layout ─────────────────────────────────────────────
  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", fontFamily: sans, color: "#1a1a1a" }}>

      {/* SIDEBAR */}
      <div style={{ width: 196, flexShrink: 0, background: "#fff", borderRight: "1px solid #f0f0f0", display: "flex", flexDirection: "column", padding: "28px 0 20px", overflowY: "auto" }}>
        <div style={{ fontSize: 10, fontWeight: 400, letterSpacing: 4, color: "#1a1a1a", padding: "0 22px 28px", textTransform: "uppercase" }}>jedda</div>

        <div style={{ fontSize: 9, fontWeight: 400, letterSpacing: 2, color: "#ccc", textTransform: "uppercase", padding: "0 22px 8px" }}>overview</div>
        <SbItem id="overview" label="all applicants" />

        <div style={{ height: 1, background: "#f0f0f0", margin: "14px 22px" }} />
        <div style={{ fontSize: 9, fontWeight: 400, letterSpacing: 2, color: "#ccc", textTransform: "uppercase", padding: "0 22px 8px" }}>review</div>
        <SbItem id="new" label="pending review" />
        <SbItem id="onhold" label="on hold" />

        <div style={{ height: 1, background: "#f0f0f0", margin: "14px 22px" }} />
        <div style={{ fontSize: 9, fontWeight: 400, letterSpacing: 2, color: "#ccc", textTransform: "uppercase", padding: "0 22px 8px" }}>pipeline</div>
        <SbItem id="shortlisted" label="shortlisted" />
        <SbItem id="testing" label="testing" />
        <SbItem id="finalist" label="finalists" />
        <SbItem id="interview" label="interview" />

        <div style={{ height: 1, background: "#f0f0f0", margin: "14px 22px" }} />
        <div style={{ fontSize: 9, fontWeight: 400, letterSpacing: 2, color: "#ccc", textTransform: "uppercase", padding: "0 22px 8px" }}>closed</div>
        <SbItem id="thefinalteam" label="the final team" />
        <SbItem id="rejected" label="rejected" />
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {renderPage()}
      </div>

      {/* MODALS & PANEL */}
      {panelApp && <DetailPanel app={panelApp} onClose={() => setPanelApp(null)} onMoveBack={async (id, status) => { await updateStatus(id, status); showToast("→ " + status); setPanelApp(null); }} />}

      {interviewApp && (
        <InterviewModal
          app={interviewApp}
          onClose={() => setInterviewApp(null)}
          onConfirm={async (dt) => {
            await updateStatus(interviewApp.id, "interview", { interview_date: dt });
            setInterviewApp(null);
            showToast("interview email sent ✓");
          }}
        />
      )}

      {acceptanceApp && (
        <AcceptanceModal
          app={acceptanceApp}
          onClose={() => setAcceptanceApp(null)}
          onConfirm={async () => {
            await updateStatus(acceptanceApp.id, "the final team", { acceptance_sent: true });
            setAcceptanceApp(null);
            showToast("acceptance email sent ✓");
          }}
        />
      )}

      {/* TOAST */}
      {toast && (
        <div style={{ position: "fixed", bottom: 22, left: "50%", transform: "translateX(-50%)", background: "#1a1a1a", color: "#fff", fontSize: 11, fontWeight: 300, padding: "9px 18px", letterSpacing: 0.5, whiteSpace: "nowrap", zIndex: 999 }}>
          {toast}
        </div>
      )}
    </div>
  );
}
