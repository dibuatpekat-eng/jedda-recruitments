import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "./supabase.js";

const sans = "'DM Sans', sans-serif";
const serif = "'Cormorant Garamond', serif";

// Q3 initial order — shuffled (not ideal order)
const RANK_ITEMS_DEFAULT = [
  "How it looks in photos",
  "The quality and construction — the intention behind how it's made",
  "Whether it feels consistent with the rest of the collection",
  "How comfortable it feels to wear",
  "Whether it's on-trend",
  "Whether the silhouette and proportions feel right",
];

const CORRECT_PICKS = [2, 7, 10];

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,200;0,300;0,400;1,200;1,300&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
html,body{background:#fafaf8!important;color:#111}
::selection{background:#111;color:#fafaf8}
input::placeholder,textarea::placeholder{color:#ccc}
input:focus,textarea:focus{outline:none}
.at-pitem:hover{opacity:0.82}
.at-pitem.dimmed{opacity:0.25;pointer-events:none}
.at-pitem.selected{outline:1.5px solid #111;outline-offset:-1px}
.at-pitem.selected .at-pcheck{opacity:1!important}
.at-rank-item{cursor:grab;touch-action:none;user-select:none}
.at-rank-item:active{cursor:grabbing}
.at-rank-item.dragging{opacity:0.35;background:#f5f5f3}
.at-btn:hover{opacity:0.35}
.at-btn-ghost:hover{opacity:0.5}
.at-ubox:hover{border-color:#999!important}
.at-ifield:focus{border-bottom-color:#111!important}
.at-tfield:focus{border-bottom-color:#111!important}
`;

const tf = { width: "100%", background: "transparent", border: "none", borderBottom: "1px solid #e8e8e4", padding: "11px 0 18px", fontFamily: sans, fontSize: 14, fontWeight: 300, color: "#111", resize: "none", lineHeight: 1.7, minHeight: 56 };
const btn = { background: "none", border: "none", borderBottom: "1px solid #111", paddingBottom: 3, fontFamily: sans, fontSize: 11, fontWeight: 300, color: "#111", cursor: "pointer", letterSpacing: 2 };
const btnGhost = { background: "none", border: "none", borderBottom: "1px solid #ddd", paddingBottom: 2, fontFamily: sans, fontSize: 10, fontWeight: 200, color: "#aaa", cursor: "pointer", letterSpacing: 1.5, marginRight: 24 };
const eyebrow = { fontSize: 9, fontWeight: 300, letterSpacing: 3.5, textTransform: "uppercase", color: "#c8a87a", marginBottom: 16 };
const titleStyle = { fontFamily: serif, fontSize: 38, fontWeight: 300, lineHeight: 1.2, color: "#111", marginBottom: 10 };
const sub = { fontSize: 13, fontWeight: 200, color: "#777", lineHeight: 1.9, marginBottom: 40 };
const subSm = { fontSize: 12, fontWeight: 200, color: "#aaa", lineHeight: 1.8, marginBottom: 32 };
const errStyle = { color: "#c47a5a", fontSize: 10, fontWeight: 300, marginTop: 10 };
const inputStyle = { border: "none", background: "transparent", fontFamily: sans, fontSize: 14, fontWeight: 300, color: "#111", width: "100%", padding: 0 };
const inputSmStyle = { border: "none", background: "transparent", fontFamily: sans, fontSize: 12, fontWeight: 300, color: "#999", padding: 0, textAlign: "right" };

// Logo — PNG image, same height as the text it replaces
function Logo() {
  return (
    <img src="/jedda-logo.png" alt="Jedda" style={{ height: 13, width: "auto", display: "block", filter: "invert(1)" }} />
  );
}

function Wrap({ children, prog }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "#fafaf8", overflowY: "auto", fontFamily: sans, color: "#111" }}>
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: 1, background: "#e8e8e4", zIndex: 100 }}>
        <div style={{ height: "100%", background: "#111", width: `${prog}%`, transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)" }} />
      </div>
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "22px 40px", zIndex: 50, background: "linear-gradient(#fafaf8 65%, transparent)" }}>
        <Logo />
      </nav>
      <div style={{ minHeight: "100vh", padding: "100px 40px 80px", maxWidth: 640, margin: "0 auto", display: "flex", flexDirection: "column" }}>
        {children}
      </div>
    </div>
  );
}

// Photos in order 1–10, loaded from public/
const P_ITEMS = [1,2,3,4,5,6,7,8,9,10].map(n => ({ src: `/${n}.jpg` }));

export default function AlignmentTest() {
  const applicantId = new URLSearchParams(window.location.search).get("id");

  const [initState, setInitState] = useState("loading");
  const [screen, setScreen] = useState(0);
  const [selected, setSelected] = useState([]);
  const [rankItems, setRankItems] = useState(RANK_ITEMS_DEFAULT);
  const [dragIdx, setDragIdx] = useState(null);
  const [q2, setQ2] = useState("");
  const [id1, setId1] = useState(""); const [id2, setId2] = useState(""); const [id3, setId3] = useState("");
  const [in1, setIn1] = useState(""); const [inf1, setInf1] = useState("");
  const [in2, setIn2] = useState(""); const [inf2, setInf2] = useState("");
  const [in3, setIn3] = useState(""); const [inf3, setInf3] = useState("");
  const [q6, setQ6] = useState("");
  const [moodFile, setMoodFile] = useState(null);
  const [moodFileName, setMoodFileName] = useState("");
  const [moodLink, setMoodLink] = useState("");
  const [uploadProgress, setUploadProgress] = useState(null);
  const [err, setErr] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const fileRef = useRef(null);
  const pointerDragIdx = useRef(null);
  const pointerStartY = useRef(null);
  const total = 7;

  useEffect(() => {
    const st = document.createElement("style");
    st.textContent = CSS;
    document.head.appendChild(st);
    return () => document.head.removeChild(st);
  }, []);

  useEffect(() => {
    if (!applicantId) { setInitState("invalid"); return; }
    (async () => {
      const { data: existing } = await supabase.from("alignment_tests").select("id").eq("applicant_id", applicantId).maybeSingle();
      if (existing) { setInitState("already"); return; }
      const { data: applicant } = await supabase.from("applications").select("id").eq("id", applicantId).maybeSingle();
      if (!applicant) { setInitState("invalid"); return; }
      setInitState("ok");
    })();
  }, [applicantId]);

  useEffect(() => { window.scrollTo(0, 0); }, [screen]);

  const prog = screen === 0 ? 0 : screen === 8 ? 100 : (screen / total) * 100;
  const go = (n) => { setErr({}); setScreen(n); };

  const pick = (num) => {
    if (selected.includes(num)) { setSelected(prev => prev.filter(s => s !== num)); }
    else { if (selected.length >= 3) return; setSelected(prev => [...prev, num]); }
    setErr({});
  };

  const onPointerDown = useCallback((e, i) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointerDragIdx.current = i;
    pointerStartY.current = e.clientY;
    setDragIdx(i);
  }, []);

  const onPointerMove = useCallback((e) => {
    if (pointerDragIdx.current === null) return;
    const dy = e.clientY - pointerStartY.current;
    const rowH = 54;
    const steps = Math.round(dy / rowH);
    if (steps === 0) return;
    const from = pointerDragIdx.current;
    const to = Math.max(0, Math.min(5, from + steps));
    if (to === from) return;
    setRankItems(prev => {
      const items = [...prev];
      const [moved] = items.splice(from, 1);
      items.splice(to, 0, moved);
      return items;
    });
    pointerDragIdx.current = to;
    setDragIdx(to);
    pointerStartY.current = e.clientY;
  }, []);

  const onPointerUp = useCallback(() => {
    pointerDragIdx.current = null;
    pointerStartY.current = null;
    setDragIdx(null);
  }, []);

  const next1 = () => { if (selected.length < 3) { setErr({ e1: true }); return; } go(2); };
  const next2 = () => { if (!q2.trim()) { setErr({ e2: true }); return; } go(3); };
  const next4 = () => { if (![id1, id2, id3].some(v => v.trim())) { setErr({ e4: true }); return; } go(5); };
  // Q5: all 3 brand names required, all 3 "from" fields required
  const next5 = () => {
    const brands = [in1, in2, in3];
    const froms = [inf1, inf2, inf3];
    if (!brands.every(v => v.trim())) { setErr({ e5: "please fill in all 3 brand names" }); return; }
    if (!froms.every(v => v.trim())) { setErr({ e5: "please fill in the origin country for each brand" }); return; }
    go(6);
  };
  const next6 = () => { if (!q6.trim()) { setErr({ e6: true }); return; } go(7); };

  const handleFile = (e) => {
    const f = e.target.files[0]; if (!f) return;
    const allowed = ["image/jpeg", "image/png", "application/pdf"];
    if (!allowed.includes(f.type)) { setErr({ e7: "only jpg, png, or pdf files are accepted" }); return; }
    if (f.size > 20 * 1024 * 1024) { setErr({ e7: "file is too large — max 20mb" }); return; }
    setMoodFile(f); setMoodFileName(f.name); setErr({});
  };

  const submitTest = async () => {
    if (!moodFile && !moodLink.trim()) { setErr({ e7: "please upload a file or paste a link" }); return; }
    setSubmitting(true); setErr({});
    try {
      let moodboardUrl = "";
      if (moodFile) {
        setUploadProgress("uploading");
        const ext = moodFile.name.split(".").pop();
        const path = `moodboards/${applicantId}_${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("documents").upload(path, moodFile, { upsert: true });
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage.from("documents").getPublicUrl(path);
        moodboardUrl = urlData.publicUrl;
      }

      const payload = {
        applicant_id: applicantId,
        visual_picks: selected.join(", "),
        wear_feeling: q2,
        design_ranking: rankItems.join(" | "),
        local_brands: [id1, id2, id3].filter(Boolean).join(", "),
        intl_brands: [[in1, inf1], [in2, inf2], [in3, inf3]].filter(([n]) => n).map(([n, f]) => `${n} (${f})`).join(", "),
        dimension: q6,
        moodboard_url: moodboardUrl || null,
        moodboard_link: moodLink.trim() || null,
        submitted_at: new Date().toISOString(),
      };

      const { error: insertErr } = await supabase.from("alignment_tests").insert(payload);
      if (insertErr) throw insertErr;

      await supabase.from("applications").update({ alignment_test_submitted: true }).eq("id", applicantId);

      setUploadProgress(null);
      go(8);
    } catch (e) {
      console.error(e);
      setErr({ e7: "something went wrong — please try again." });
      setUploadProgress(null);
    } finally {
      setSubmitting(false);
    }
  };

  if (initState === "loading") return <Wrap prog={0}><div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}><p style={{ fontSize: 11, fontWeight: 200, color: "#ccc", letterSpacing: 2 }}>loading...</p></div></Wrap>;
  if (initState === "invalid") return <Wrap prog={0}><div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}><p style={{ fontSize: 13, fontWeight: 200, color: "#999" }}>this link is no longer valid.</p></div></Wrap>;
  if (initState === "already") return (
    <Wrap prog={0}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
        <div style={{ width: 28, height: 1, background: "#ccc", marginBottom: 32 }} />
        <p style={{ fontSize: 13, fontWeight: 300, marginBottom: 10 }}>you've already submitted your alignment test.</p>
        <p style={{ fontSize: 12, fontWeight: 200, color: "#999", lineHeight: 1.9 }}>we'll be in touch soon.</p>
      </div>
    </Wrap>
  );

  // ── SCREEN 0: Welcome ──
  if (screen === 0) return (
    <Wrap prog={prog}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <p style={eyebrow}>for design division candidates</p>
        <h1 style={{ fontFamily: serif, fontSize: 52, fontWeight: 300, lineHeight: 1.15, color: "#111", marginBottom: 32 }}>
          Alignment<br /><em style={{ fontStyle: "italic", color: "#888" }}>Test.</em>
        </h1>
        <p style={{ fontSize: 13, fontWeight: 200, color: "#777", lineHeight: 1.9, marginBottom: 40, maxWidth: 420 }}>
          This is about how you see things — what you're drawn to, what you'd leave out, and whether your instincts align with where Jedda is going.
        </p>
        <div>
          <button className="at-btn" style={btn} onClick={() => go(1)}>begin →</button>
          <span style={{ fontSize: 10, fontWeight: 200, color: "#bbb", letterSpacing: 1, marginTop: 14, display: "block" }}>7 questions · ~10 minutes</span>
        </div>
      </div>
    </Wrap>
  );

  // ── SCREEN 1: Visual picks ──
  if (screen === 1) return (
    <Wrap prog={prog}>
      <p style={eyebrow}>01 / 07</p>
      <h2 style={titleStyle}>Which three feel<br/>like <em style={{ fontStyle: "italic", color: "#888" }}>Jedda?</em></h2>
      <p style={{ ...sub, marginBottom: 10 }}>Trust your eye. Don't overthink it.</p>
      <p style={{ fontSize: 10, fontWeight: 200, color: "#aaa", letterSpacing: 1, marginBottom: 16 }}>
        selected <b style={{ color: "#111", fontWeight: 400 }}>{selected.length}</b> / 3
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 6, marginBottom: 14 }}>
        {P_ITEMS.map((p, i) => {
          const num = i + 1;
          const isSel = selected.includes(num);
          const isDimmed = selected.length === 3 && !isSel;
          return (
            <div key={num}
              className={`at-pitem${isSel ? " selected" : ""}${isDimmed ? " dimmed" : ""}`}
              onClick={() => pick(num)}
              style={{ aspectRatio: "3/4", position: "relative", cursor: "pointer", overflow: "hidden", background: "#e8e8e4", outline: isSel ? "1.5px solid #111" : "none", outlineOffset: -1, opacity: isDimmed ? 0.25 : 1 }}>
              <img src={p.src} alt={`look ${num}`} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", display: "block" }} />
              <span style={{ position: "absolute", bottom: 7, left: 9, fontSize: 8, fontWeight: 200, letterSpacing: 1.5, color: "rgba(255,255,255,0.4)" }}>{String(num).padStart(2, "0")}</span>
              <div className="at-pcheck" style={{ position: "absolute", top: 7, right: 7, width: 17, height: 17, background: "#111", display: "flex", alignItems: "center", justifyContent: "center", opacity: isSel ? 1 : 0, transition: "opacity 0.2s" }}>
                <svg viewBox="0 0 9 7" fill="none" width="8" height="8"><path d="M1 3.5l2.5 2.5L8 1" stroke="white" strokeWidth="1.5" /></svg>
              </div>
            </div>
          );
        })}
      </div>
      {err.e1 && <p style={errStyle}>please select 3 before continuing</p>}
      <div style={{ marginTop: "auto", paddingTop: 40 }}>
        <button className="at-btn" style={btn} onClick={next1}>continue →</button>
      </div>
    </Wrap>
  );

  // ── SCREEN 2: Empathy ──
  if (screen === 2) return (
    <Wrap prog={prog}>
      <p style={eyebrow}>02 / 07</p>
      <h2 style={titleStyle}>What do you want<br/>someone to <em style={{ fontStyle: "italic", color: "#888" }}>feel?</em></h2>
      <p style={sub}>When they wear something you made.</p>
      <textarea className="at-tfield" style={tf} value={q2} onChange={e => setQ2(e.target.value)} placeholder="write freely." rows={3} />
      {err.e2 && <p style={errStyle}>please write something</p>}
      <div style={{ marginTop: "auto", paddingTop: 40 }}>
        <button className="at-btn-ghost" style={btnGhost} onClick={() => go(1)}>← back</button>
        <button className="at-btn" style={btn} onClick={next2}>continue →</button>
      </div>
    </Wrap>
  );

  // ── SCREEN 3: Design ranking ──
  if (screen === 3) return (
    <Wrap prog={prog}>
      <p style={eyebrow}>03 / 07</p>
      <h2 style={titleStyle}>When making a product,<br/>what do you <em style={{ fontStyle: "italic", color: "#888" }}>prioritize most?</em></h2>
      <p style={{ ...sub, marginBottom: 24 }}>rank from most to least important. drag to reorder.</p>
      <div style={{ display: "flex", flexDirection: "column", marginBottom: 16 }}>
        {rankItems.map((text, i) => (
          <div key={text}
            className={`at-rank-item${dragIdx === i ? " dragging" : ""}`}
            onPointerDown={e => onPointerDown(e, i)}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0", borderBottom: "1px solid #f0f0f0", opacity: dragIdx === i ? 0.35 : 1 }}>
            <span style={{ fontSize: 9, fontWeight: 200, color: "#ccc", letterSpacing: 2, width: 18, flexShrink: 0 }}>{String(i + 1).padStart(2, "0")}</span>
            <span style={{ fontSize: 13, fontWeight: 300, color: "#444", lineHeight: 1.5, flex: 1 }}>{text}</span>
            <span style={{ fontSize: 11, color: "#ccc", flexShrink: 0 }}>⠿</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: "auto", paddingTop: 40 }}>
        <button className="at-btn-ghost" style={btnGhost} onClick={() => go(2)}>← back</button>
        <button className="at-btn" style={btn} onClick={() => go(4)}>continue →</button>
      </div>
    </Wrap>
  );

  // ── SCREEN 4: Local brands ──
  if (screen === 4) return (
    <Wrap prog={prog}>
      <p style={eyebrow}>04 / 07</p>
      <h2 style={titleStyle}>3 Indonesian fashion brands<br/>you think are <em style={{ fontStyle: "italic", color: "#888" }}>genuinely cool.</em></h2>
      <p style={subSm}>(Jedda doesn't count, obviously.) · clothing, accessories, footwear — anything goes.</p>
      <div>
        {[[id1, setId1], [id2, setId2], [id3, setId3]].map(([val, set], i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "28px 1fr", alignItems: "end", borderBottom: "1px solid #e8e8e4", padding: "10px 0" }}>
            <span style={{ fontSize: 9, fontWeight: 200, color: "#bbb", letterSpacing: 2, paddingBottom: 2 }}>{String(i + 1).padStart(2, "0")}</span>
            <input style={inputStyle} placeholder="brand name" value={val} onChange={e => { set(e.target.value); setErr({}); }} />
          </div>
        ))}
      </div>
      {err.e4 && <p style={errStyle}>please fill in at least one</p>}
      <div style={{ marginTop: "auto", paddingTop: 40 }}>
        <button className="at-btn-ghost" style={btnGhost} onClick={() => go(3)}>← back</button>
        <button className="at-btn" style={btn} onClick={next4}>continue →</button>
      </div>
    </Wrap>
  );

  // ── SCREEN 5: International brands ──
  if (screen === 5) return (
    <Wrap prog={prog}>
      <p style={eyebrow}>05 / 07</p>
      <h2 style={titleStyle}>3 international fashion brands<br/>with the closest <em style={{ fontStyle: "italic", color: "#888" }}>vibe to Jedda.</em></h2>
      <p style={subSm}>clothing only — no mainstream luxury labels (Chanel, Dior, Louis Vuitton, etc.)</p>
      <div>
        {[[in1, setIn1, inf1, setInf1], [in2, setIn2, inf2, setInf2], [in3, setIn3, inf3, setInf3]].map(([name, setName, from, setFrom], i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "28px 1fr 90px", alignItems: "end", borderBottom: "1px solid #e8e8e4", padding: "10px 0" }}>
            <span style={{ fontSize: 9, fontWeight: 200, color: "#bbb", letterSpacing: 2, paddingBottom: 2 }}>{String(i + 1).padStart(2, "0")}</span>
            <input style={inputStyle} placeholder="brand name" value={name} onChange={e => { setName(e.target.value); setErr({}); }} />
            <input style={{ ...inputSmStyle, borderBottom: "1px solid #e8e8e4", paddingBottom: 4 }} placeholder="origin" value={from} onChange={e => { setFrom(e.target.value); setErr({}); }} />
          </div>
        ))}
      </div>
      {err.e5 && <p style={errStyle}>{err.e5}</p>}
      <div style={{ marginTop: "auto", paddingTop: 40 }}>
        <button className="at-btn-ghost" style={btnGhost} onClick={() => go(4)}>← back</button>
        <button className="at-btn" style={btn} onClick={next5}>continue →</button>
      </div>
    </Wrap>
  );

  // ── SCREEN 6: Dimension — hierarchy flipped ──
  if (screen === 6) return (
    <Wrap prog={prog}>
      <p style={eyebrow}>06 / 07</p>
      <p style={{ fontSize: 12, fontWeight: 200, color: "#aaa", lineHeight: 1.8, marginBottom: 16 }}>We have our own perspective, language, and identity of design.</p>
      <h2 style={{ ...titleStyle, marginBottom: 32 }}>What dimension would<br/>you <em style={{ fontStyle: "italic", color: "#888" }}>bring?</em></h2>
      <textarea className="at-tfield" style={tf} value={q6} onChange={e => setQ6(e.target.value)} placeholder="write freely." rows={3} />
      {err.e6 && <p style={errStyle}>please write something</p>}
      <div style={{ marginTop: "auto", paddingTop: 40 }}>
        <button className="at-btn-ghost" style={btnGhost} onClick={() => go(5)}>← back</button>
        <button className="at-btn" style={btn} onClick={next6}>continue →</button>
      </div>
    </Wrap>
  );

  // ── SCREEN 7: Moodboard ──
  if (screen === 7) return (
    <Wrap prog={prog}>
      <p style={eyebrow}>07 / 07</p>
      <h2 style={titleStyle}>Make your <em style={{ fontStyle: "italic", color: "#888" }}>moodboard.</em></h2>
      <p style={sub}>Silhouettes, garments, anything that feels aligned with Jedda's direction — pull from Pinterest, Instagram, screenshots, anywhere.</p>
      <p style={{ ...subSm, marginTop: -24 }}>Max 10 images. No need to name, explain, or tell us the story.</p>
      <input type="file" ref={fileRef} accept=".jpg,.jpeg,.png,.pdf" style={{ display: "none" }} onChange={handleFile} />
      <div className="at-ubox" onClick={() => fileRef.current?.click()}
        style={{ border: moodFileName ? "1px solid #111" : "1px dashed #d8d4ce", padding: "44px 24px", textAlign: "center", cursor: "pointer", transition: "border-color 0.25s", marginBottom: 14 }}>
        <span style={{ fontSize: 18, color: moodFileName ? "#111" : "#ccc", marginBottom: 12, display: "block" }}>{moodFileName ? "✓" : "↑"}</span>
        <p style={{ fontSize: 12, fontWeight: 300, color: moodFileName ? "#111" : "#bbb" }}>{moodFileName || "click to upload"}</p>
        {!moodFileName && <p style={{ fontSize: 10, fontWeight: 200, color: "#ccc", marginTop: 6 }}>pdf, jpg, png · max 20mb</p>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "4px 0 14px" }}>
        <div style={{ flex: 1, height: 1, background: "#eee" }} />
        <span style={{ fontSize: 10, fontWeight: 200, color: "#bbb", letterSpacing: 1 }}>or</span>
        <div style={{ flex: 1, height: 1, background: "#eee" }} />
      </div>
      <input
        className="at-ifield"
        style={{ ...inputStyle, borderBottom: "1px solid #e8e8e4", paddingBottom: 10, fontSize: 12, color: "#666" }}
        type="url"
        placeholder="paste a link — pinterest board, notion, are.na, google drive..."
        value={moodLink}
        onChange={e => { setMoodLink(e.target.value); setErr({}); }}
      />
      <p style={{ fontSize: 10, fontWeight: 200, color: "#bbb", marginTop: 8, letterSpacing: 0.5 }}>make sure it's set to public</p>
      {err.e7 && <p style={errStyle}>{err.e7}</p>}
      <div style={{ marginTop: "auto", paddingTop: 40 }}>
        <button className="at-btn-ghost" style={btnGhost} onClick={() => go(6)}>← back</button>
        <button className="at-btn" style={btn} onClick={submitTest} disabled={submitting}>
          {submitting ? (uploadProgress === "uploading" ? "uploading..." : "submitting...") : "submit →"}
        </button>
      </div>
    </Wrap>
  );

  // ── SCREEN 8: Closing ──
  if (screen === 8) return (
    <Wrap prog={100}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ width: 28, height: 1, background: "#111", marginBottom: 36 }} />
        <h2 style={{ fontFamily: serif, fontSize: 36, fontWeight: 300, lineHeight: 1.3, color: "#111", marginBottom: 20 }}>
          That's all<br />we needed<br />to see.
        </h2>
        <p style={{ fontSize: 13, fontWeight: 200, color: "#777", lineHeight: 2 }}>
          We'll take it from here. If there's an alignment,<br />you'll hear from us soon.
        </p>
        <div style={{ marginTop: 60, borderTop: "1px solid #eee", paddingTop: 24 }}>
          <p style={{ fontSize: 9, fontWeight: 200, color: "#ccc", letterSpacing: 3, textTransform: "uppercase" }}>Jedda — 2026</p>
        </div>
      </div>
    </Wrap>
  );

  return null;
}
