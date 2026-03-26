import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const PASS = import.meta.env.VITE_ADMIN_PASSWORD || "jedda2026";
const sans = "'DM Sans', sans-serif";

function getDivision(position) {
  const p = position?.toLowerCase() || "";
  if (p.includes("fashion designer")) return "design";
  if (p.includes("design & development") || p.includes("design development") || p.includes("development lead")) return "design";
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
  return { label: t || "—", style: { background: "#f5f5f5", color: "#999" } };
}

function DetailPanel({ app, onClose }) {
  if (!app) return null;
  const tag = typeTag(app.work_type);

  const fields = [
    { label: "position", value: app.position },
    { label: "specialization", value: app.fd_specs },
    { label: "work type", value: app.work_type },
    { label: "phone", value: app.phone },
    { label: "email", value: app.email },
    { label: "city", value: app.city },
    { label: "open to bandung", value: app.bandung },
    { label: "on-site confirm", value: app.onsite },
    { label: "availability", value: app.availability },
    { label: "why jedda", value: app.why_jedda },
  ].filter(f => f.value && f.value !== "");

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.2)", zIndex: 100, display: "flex", justifyContent: "flex-end" }}>
      <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 440, background: "#fff", height: "100%", overflowY: "auto", padding: "40px 32px", fontFamily: sans }}>
        <button onClick={onClose} style={{ background: "none", border: "none", fontFamily: sans, fontSize: 10, fontWeight: 300, color: "#bbb", cursor: "pointer", letterSpacing: 2, padding: 0, marginBottom: 36 }}>← back</button>

        <div style={{ marginBottom: 32 }}>
          <p style={{ fontSize: 22, fontWeight: 300, marginBottom: 8 }}>{app.full_name}</p>
          <span style={{ display: "inline-block", fontSize: 9, fontWeight: 300, letterSpacing: 1, padding: "4px 9px", ...typeTag(app.work_type).style }}>{typeTag(app.work_type).label}</span>
        </div>

        <div style={{ width: 24, height: 1, background: "#eee", marginBottom: 28 }} />

        <div style={{ borderTop: "1px solid #f0f0f0" }}>
          {fields.map(({ label, value }) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "13px 0", borderBottom: "1px solid #f5f5f5", gap: 16 }}>
              <span style={{ fontSize: 9, fontWeight: 300, color: "#bbb", letterSpacing: 2, textTransform: "uppercase", flexShrink: 0, paddingTop: 2 }}>{label}</span>
              <span style={{ fontSize: 12, fontWeight: 300, color: "#1a1a1a", textAlign: "right", lineHeight: 1.7, wordBreak: "break-word", maxWidth: "62%" }}>{value}</span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 32 }}>
          <p style={{ fontSize: 9, fontWeight: 300, letterSpacing: 3, textTransform: "uppercase", color: "#bbb", marginBottom: 16 }}>documents</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {app.cv_url
              ? <a href={app.cv_url} target="_blank" rel="noreferrer" style={{ fontSize: 12, fontWeight: 300, color: "#1a1a1a", textDecoration: "none", borderBottom: "1px solid #ddd", paddingBottom: 3, display: "inline-block", width: "fit-content" }}>cv / resume →</a>
              : <span style={{ fontSize: 12, fontWeight: 200, color: "#ccc" }}>no cv uploaded</span>
            }
            {app.portfolio_url
              ? <a href={app.portfolio_url} target="_blank" rel="noreferrer" style={{ fontSize: 12, fontWeight: 300, color: "#1a1a1a", textDecoration: "none", borderBottom: "1px solid #ddd", paddingBottom: 3, display: "inline-block", width: "fit-content" }}>portfolio →</a>
              : !app.portfolio_link && <span style={{ fontSize: 12, fontWeight: 200, color: "#ccc" }}>no portfolio uploaded</span>
            }
            {app.portfolio_link
              ? <a href={app.portfolio_link} target="_blank" rel="noreferrer" style={{ fontSize: 12, fontWeight: 300, color: "#888", textDecoration: "none", borderBottom: "1px solid #e8e8e8", paddingBottom: 3, display: "inline-block", width: "fit-content" }}>portfolio link ↗</a>
              : null
            }
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState("");
  const [pwErr, setPwErr] = useState(false);
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [divFilter, setDivFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  const login = () => {
    if (pw === PASS) { setAuthed(true); setPwErr(false); }
    else setPwErr(true);
  };

  useEffect(() => {
    if (!authed) return;
    setLoading(true);
    supabase.from("applications").select("*").order("id", { ascending: false })
      .then(({ data }) => { setApps(data || []); setLoading(false); });
  }, [authed]);

  const filtered = apps.filter(a => {
    const matchDiv = divFilter === "all" || getDivision(a.position) === divFilter;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      a.full_name?.toLowerCase().includes(q) ||
      a.position?.toLowerCase().includes(q) ||
      a.city?.toLowerCase().includes(q) ||
      a.work_type?.toLowerCase().includes(q) ||
      a.availability?.toLowerCase().includes(q);
    return matchDiv && matchSearch;
  });

  const fromBandung = apps.filter(a => a.city?.toLowerCase().includes("bandung")).length;
  const withPortfolio = apps.filter(a => a.portfolio_url).length;

  if (!authed) return (
    <div style={{ position: "fixed", inset: 0, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: sans }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@200;300;400&display=swap');*{box-sizing:border-box;margin:0;padding:0}input::placeholder{color:#ccc}input:focus{border-color:#1a1a1a !important;outline:none}`}</style>
      <div style={{ textAlign: "center", width: 280 }}>
        <p style={{ fontSize: 9, fontWeight: 300, letterSpacing: 4, color: "#bbb", textTransform: "uppercase", marginBottom: 32 }}>jedda — recruitment</p>
        <input type="password" placeholder="password" value={pw}
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

  return (
    <div style={{ minHeight: "100vh", background: "#fff", fontFamily: sans, color: "#1a1a1a" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@200;300;400&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}html,body{background:#fff}
        .a-row{display:grid;grid-template-columns:2fr 1.5fr 1fr 60px 60px;align-items:center;padding:13px 20px;border-bottom:1px solid #f5f5f5;gap:16px;transition:background 0.15s;cursor:pointer}
        .a-row:hover{background:#fafafa}
        .a-row:last-child{border-bottom:none}
        .f-btn{font-size:10px;font-weight:300;letter-spacing:1.5px;color:#bbb;background:none;border:none;cursor:pointer;font-family:'DM Sans',sans-serif;padding:6px 12px;border-radius:20px;transition:all 0.2s}
        .f-btn.active{background:#1a1a1a;color:#fff}
        .f-btn:hover:not(.active){color:#1a1a1a}
        .o-btn{font-size:11px;font-weight:300;color:#999;background:none;border:none;padding:0;cursor:pointer;font-family:'DM Sans',sans-serif;transition:opacity 0.2s;white-space:nowrap;text-decoration:none;display:inline-block}
        .o-btn:hover{opacity:0.4}
        .o-btn.empty{color:#ddd;pointer-events:none}
        input::placeholder{color:#ccc}
        input:focus{border-color:#1a1a1a !important;outline:none}
      `}</style>

      {selected && <DetailPanel app={selected} onClose={() => setSelected(null)} />}

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "48px 24px" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 36 }}>
          <div>
            <p style={{ fontSize: 9, fontWeight: 300, letterSpacing: 4, color: "#bbb", textTransform: "uppercase", marginBottom: 8 }}>jedda — recruitment</p>
            <p style={{ fontSize: 22, fontWeight: 300 }}>applications</p>
          </div>
          <p style={{ fontSize: 11, fontWeight: 200, color: "#bbb" }}>{apps.length} submissions</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 28 }}>
          {[["total", apps.length], ["from bandung", fromBandung], ["with portfolio", withPortfolio]].map(([label, val]) => (
            <div key={label} style={{ padding: 16, border: "1px solid #f0f0f0" }}>
              <p style={{ fontSize: 9, fontWeight: 300, letterSpacing: 2, color: "#bbb", textTransform: "uppercase", marginBottom: 8 }}>{label}</p>
              <p style={{ fontSize: 26, fontWeight: 300 }}>{val}</p>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, gap: 16 }}>
          <div style={{ display: "flex", gap: 4 }}>
            {["all", "design", "creative", "retail"].map(f => (
              <button key={f} className={`f-btn${divFilter === f ? " active" : ""}`} onClick={() => setDivFilter(f)}>{f}</button>
            ))}
          </div>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="search name, position, city..."
            style={{ border: "none", borderBottom: "1px solid #e8e8e8", padding: "6px 0", fontFamily: sans, fontSize: 11, fontWeight: 300, color: "#1a1a1a", background: "transparent", outline: "none", width: 220 }}
          />
        </div>

        <div style={{ border: "1px solid #f0f0f0" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 60px 60px", padding: "10px 20px", background: "#fafafa", gap: 16, borderBottom: "1px solid #f0f0f0" }}>
            {["name", "position", "type", "cv", "porto"].map(h => (
              <span key={h} style={{ fontSize: 9, fontWeight: 400, letterSpacing: 2, color: "#bbb", textTransform: "uppercase" }}>{h}</span>
            ))}
          </div>

          {loading && <div style={{ padding: 40, textAlign: "center" }}><p style={{ fontSize: 11, fontWeight: 200, color: "#ccc", letterSpacing: 2 }}>loading...</p></div>}
          {!loading && filtered.length === 0 && <div style={{ padding: 40, textAlign: "center" }}><p style={{ fontSize: 11, fontWeight: 200, color: "#ccc", letterSpacing: 2 }}>no applications found</p></div>}

          {!loading && filtered.map(app => {
            const tag = typeTag(app.work_type);
            return (
              <div key={app.id} className="a-row" onClick={() => setSelected(app)}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 400, marginBottom: 2 }}>{app.full_name}</p>
                  <p style={{ fontSize: 10, fontWeight: 200, color: "#999" }}>{app.city}{app.availability ? ` · ${app.availability}` : ""}</p>
                </div>
                <p style={{ fontSize: 12, fontWeight: 300 }}>{app.position?.toLowerCase()}</p>
                <span style={{ display: "inline-block", fontSize: 9, fontWeight: 300, letterSpacing: 1, padding: "4px 9px", ...tag.style }}>{tag.label}</span>
                <a href={app.cv_url} target="_blank" rel="noreferrer" className={`o-btn${!app.cv_url ? " empty" : ""}`} onClick={e => e.stopPropagation()}>{app.cv_url ? "open →" : "—"}</a>
                <a href={app.portfolio_url} target="_blank" rel="noreferrer" className={`o-btn${!app.portfolio_url ? " empty" : ""}`} onClick={e => e.stopPropagation()}>{app.portfolio_url ? "open →" : "—"}</a>
              </div>
            );
          })}
        </div>

        <p style={{ fontSize: 9, fontWeight: 200, color: "#ccc", letterSpacing: 2, marginTop: 24, textAlign: "center" }}>© 2026 jedda</p>
      </div>
    </div>
  );
}
