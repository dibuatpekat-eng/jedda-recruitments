import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const PASS = import.meta.env.VITE_ADMIN_PASSWORD || "jedda2026";

const sans = "'DM Sans', sans-serif";

const DIVISION_MAP = {
  ddl: "design",
  fd: "design",
  vd: "creative",
  csm: "creative",
  dgs: "creative",
  sa: "retail",
};

function getDivision(position) {
  const p = position?.toLowerCase() || "";
  if (p.includes("fashion designer")) return "design";
  if (p.includes("design & development") || p.includes("design development")) return "design";
  if (p.includes("visual director")) return "creative";
  if (p.includes("content") || p.includes("social")) return "creative";
  if (p.includes("digital") || p.includes("growth")) return "creative";
  if (p.includes("sales")) return "retail";
  return "other";
}

function typeTag(workType) {
  const t = workType?.toLowerCase() || "";
  if (t.includes("full")) return { label: "full-time", style: { background: "#f5f0eb", color: "#a0826a" } };
  if (t.includes("part")) return { label: "part-time", style: { background: "#edf0f5", color: "#6a7fa0" } };
  if (t.includes("intern")) return { label: "internship", style: { background: "#edf5ef", color: "#6a9e76" } };
  return { label: t, style: { background: "#f5f5f5", color: "#999" } };
}

export default function AdminDashboard() {
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState("");
  const [pwErr, setPwErr] = useState(false);
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all");

  const login = () => {
    if (pw === PASS) { setAuthed(true); setPwErr(false); }
    else setPwErr(true);
  };

  useEffect(() => {
    if (!authed) return;
    setLoading(true);
    supabase
      .from("applications")
      .select("*")
      .order("id", { ascending: false })
      .then(({ data }) => { setApps(data || []); setLoading(false); });
  }, [authed]);

  const filtered = filter === "all" ? apps : apps.filter(a => getDivision(a.position) === filter);
  const withPortfolio = apps.filter(a => a.portfolio_url).length;
  const thisWeek = apps.filter(a => {
    if (!a.created_at) return false;
    const d = new Date(a.created_at);
    const now = new Date();
    const diff = (now - d) / (1000 * 60 * 60 * 24);
    return diff <= 7;
  }).length;

  // ── LOGIN ──
  if (!authed) return (
    <div style={{ position: "fixed", inset: 0, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: sans }}>
      <div style={{ textAlign: "center", width: 280 }}>
        <p style={{ fontSize: 9, fontWeight: 300, letterSpacing: 4, color: "#bbb", textTransform: "uppercase", marginBottom: 32 }}>jedda — recruitment</p>
        <input
          type="password"
          placeholder="password"
          value={pw}
          onChange={e => { setPw(e.target.value); setPwErr(false); }}
          onKeyDown={e => e.key === "Enter" && login()}
          style={{ width: "100%", border: "none", borderBottom: `1px solid ${pwErr ? "#c47a5a" : "#e8e8e8"}`, padding: "10px 0", fontFamily: sans, fontSize: 13, fontWeight: 300, outline: "none", background: "transparent", textAlign: "center", letterSpacing: 2 }}
          autoFocus
        />
        {pwErr && <p style={{ fontSize: 10, color: "#c47a5a", marginTop: 8, fontWeight: 300 }}>incorrect password</p>}
        <div style={{ height: 28 }} />
        <button onClick={login} style={{ background: "none", border: "none", fontFamily: sans, fontSize: 11, fontWeight: 300, color: "#1a1a1a", cursor: "pointer", letterSpacing: 2, borderBottom: "1px solid #1a1a1a", paddingBottom: 3 }}>enter →</button>
      </div>
    </div>
  );

  // ── DASHBOARD ──
  return (
    <div style={{ minHeight: "100vh", background: "#fff", fontFamily: sans, color: "#1a1a1a" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@200;300;400&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #fff; }
        .a-row { display: grid; grid-template-columns: 2fr 1.5fr 1fr 64px 64px; align-items: center; padding: 13px 20px; border-bottom: 1px solid #f5f5f5; gap: 16px; transition: background 0.15s; }
        .a-row:hover { background: #fafafa; }
        .a-row:last-child { border-bottom: none; }
        .f-btn { font-size: 10px; font-weight: 300; letter-spacing: 1.5px; color: #bbb; background: none; border: none; cursor: pointer; font-family: 'DM Sans', sans-serif; padding: 6px 12px; border-radius: 20px; transition: all 0.2s; }
        .f-btn.active { background: #1a1a1a; color: #fff; }
        .f-btn:hover:not(.active) { color: #1a1a1a; }
        .o-btn { font-size: 11px; font-weight: 300; color: #999; background: none; border: none; padding: 0; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: opacity 0.2s; white-space: nowrap; text-decoration: none; display: inline-block; }
        .o-btn:hover { opacity: 0.4; }
        .o-btn.empty { color: #ddd; pointer-events: none; }
        input::placeholder { color: #ccc; }
        input:focus { border-color: #1a1a1a !important; outline: none; }
      `}</style>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 36 }}>
          <div>
            <p style={{ fontSize: 9, fontWeight: 300, letterSpacing: 4, color: "#bbb", textTransform: "uppercase", marginBottom: 8 }}>jedda — recruitment</p>
            <p style={{ fontSize: 22, fontWeight: 300 }}>applications</p>
          </div>
          <p style={{ fontSize: 11, fontWeight: 200, color: "#bbb" }}>{apps.length} submissions</p>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 28 }}>
          {[["total", apps.length], ["this week", thisWeek], ["with portfolio", withPortfolio]].map(([label, val]) => (
            <div key={label} style={{ padding: 16, border: "1px solid #f0f0f0" }}>
              <p style={{ fontSize: 9, fontWeight: 300, letterSpacing: 2, color: "#bbb", textTransform: "uppercase", marginBottom: 8 }}>{label}</p>
              <p style={{ fontSize: 26, fontWeight: 300 }}>{val}</p>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
          {["all", "design", "creative", "retail"].map(f => (
            <button key={f} className={`f-btn${filter === f ? " active" : ""}`} onClick={() => setFilter(f)}>{f}</button>
          ))}
        </div>

        {/* Table */}
        <div style={{ border: "1px solid #f0f0f0" }}>
          {/* Header */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 64px 64px", padding: "10px 20px", background: "#fafafa", gap: 16, borderBottom: "1px solid #f0f0f0" }}>
            {["name", "position", "type", "cv", "porto"].map(h => (
              <span key={h} style={{ fontSize: 9, fontWeight: 400, letterSpacing: 2, color: "#bbb", textTransform: "uppercase" }}>{h}</span>
            ))}
          </div>

          {loading && (
            <div style={{ padding: 40, textAlign: "center" }}>
              <p style={{ fontSize: 11, fontWeight: 200, color: "#ccc", letterSpacing: 2 }}>loading...</p>
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div style={{ padding: 40, textAlign: "center" }}>
              <p style={{ fontSize: 11, fontWeight: 200, color: "#ccc", letterSpacing: 2 }}>no applications yet</p>
            </div>
          )}

          {!loading && filtered.map(app => {
            const tag = typeTag(app.work_type);
            return (
              <div key={app.id} className="a-row">
                <div>
                  <p style={{ fontSize: 13, fontWeight: 400, marginBottom: 2 }}>{app.full_name}</p>
                  <p style={{ fontSize: 10, fontWeight: 200, color: "#999" }}>{app.city}{app.availability ? ` · ${app.availability}` : ""}</p>
                </div>
                <p style={{ fontSize: 12, fontWeight: 300 }}>{app.position?.toLowerCase()}</p>
                <span style={{ display: "inline-block", fontSize: 9, fontWeight: 300, letterSpacing: 1, padding: "4px 9px", ...tag.style }}>{tag.label}</span>
                {app.cv_url
                  ? <a href={app.cv_url} target="_blank" rel="noreferrer" className="o-btn">open →</a>
                  : <span className="o-btn empty">—</span>
                }
                {app.portfolio_url
                  ? <a href={app.portfolio_url} target="_blank" rel="noreferrer" className="o-btn">open →</a>
                  : <span className="o-btn empty">—</span>
                }
              </div>
            );
          })}
        </div>

        <p style={{ fontSize: 9, fontWeight: 200, color: "#ccc", letterSpacing: 2, marginTop: 24, textAlign: "center" }}>© 2026 jedda</p>
      </div>
    </div>
  );
}
