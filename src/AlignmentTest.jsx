import { useState, useRef, useEffect } from "react";
import { supabase } from "./supabase.js";

const sans = "'DM Sans', sans-serif";
const serif = "'Cormorant Garamond', serif";

const RANK_ITEMS_DEFAULT = [
  "The quality and construction — the intention behind how it's made",
  "How comfortable it feels to wear",
  "Whether the silhouette and proportions feel right",
  "Whether it feels consistent with the rest of the collection",
  "How it looks in photos",
  "Whether it's on-trend",
];

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
.at-rank-item{cursor:grab}
.at-rank-item:active{cursor:grabbing}
.at-rank-item.dragging{opacity:0.3}
.at-btn:hover{opacity:0.35}
.at-btn-ghost:hover{opacity:0.5}
.at-ubox:hover{border-color:#999!important}
.at-ifield:focus{border-bottom-color:#111!important}
.at-tfield:focus{border-bottom-color:#111!important}
.at-brand-item:focus-within{border-bottom-color:#111!important}
.at-brand-origin:focus-within{border-bottom-color:#111!important}
`;

export default function AlignmentTest() {
  const applicantId = new URLSearchParams(window.location.search).get("id");

  const [initState, setInitState] = useState("loading"); // loading | invalid | already | ok
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
  const [err, setErr] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const fileRef = useRef(null);
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
    if (selected.includes(num)) { setSelected(selected.filter(s => s !== num)); }
    else { if (selected.length >= 2) return; setSelected([...selected, num]); }
    setErr({});
  };

  // drag rank — mouse + touch compatible
  const dragIdxRef = useRef(null);
  const onDragStart = (i) => { setDragIdx(i); dragIdxRef.current = i; };
  const onDragOver = (e, i) => {
    e.preventDefault();
    if (dragIdxRef.current === null || dragIdxRef.current === i) return;
    const items = [...rankItems];
    const [moved] = items.splice(dragIdxRef.current, 1);
    items.splice(i, 0, moved);
    setRankItems(items);
    setDragIdx(i);
    dragIdxRef.current = i;
  };
  const onDragEnd = () => { setDragIdx(null); dragIdxRef.current = null; };

  // touch drag
  const touchStartIdx = useRef(null);
  const onTouchStart = (i) => { touchStartIdx.current = i; setDragIdx(i); };
  const onTouchMove = (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    const row = el?.closest("[data-rank-idx]");
    if (!row) return;
    const targetIdx = parseInt(row.dataset.rankIdx);
    if (isNaN(targetIdx) || targetIdx === dragIdxRef.current) return;
    const items = [...rankItems];
    const from = dragIdxRef.current ?? touchStartIdx.current;
    if (from === null) return;
    const [moved] = items.splice(from, 1);
    items.splice(targetIdx, 0, moved);
    setRankItems(items);
    setDragIdx(targetIdx);
    dragIdxRef.current = targetIdx;
    touchStartIdx.current = targetIdx;
  };
  const onTouchEnd = () => { setDragIdx(null); dragIdxRef.current = null; touchStartIdx.current = null; };

  const next1 = () => { if (selected.length < 2) { setErr({ e1: true }); return; } go(2); };
  const next2 = () => { if (!q2.trim()) { setErr({ e2: true }); return; } go(3); };
  const next4 = () => { if (![id1,id2,id3].some(v => v.trim())) { setErr({ e4: true }); return; } go(5); };
  const next5 = () => { if (![in1,in2,in3].some(v => v.trim())) { setErr({ e5: true }); return; } go(6); };
  const next6 = () => { if (!q6.trim()) { setErr({ e6: true }); return; } go(7); };

  const handleFile = (e) => {
    const f = e.target.files[0]; if (!f) return;
    if (f.size > 20 * 1024 * 1024) { setErr({ e7: "max 20mb" }); return; }
    setMoodFile(f); setMoodFileName(f.name); setErr({});
  };

  const submitTest = async () => {
    if (!moodFile && !moodLink.trim()) { setErr({ e7: true }); return; }
    setSubmitting(true); setErr({});
    try {
      let moodboardUrl = "";
      if (moodFile) {
        const ts = Date.now();
        const path = `moodboards/${ts}_${applicantId}_${moodFile.name}`;
        const { error: upErr } = await supabase.storage.from("documents").upload(path, moodFile);
        if (upErr) throw new Error(upErr.message);
        const { data } = supabase.storage.from("documents").getPublicUrl(path);
        moodboardUrl = data.publicUrl;
      }

      const localBrands = [id1,id2,id3].filter(Boolean).join(", ");
      const intlBrands = [
        [in1,inf1],[in2,inf2],[in3,inf3]
      ].filter(([n]) => n.trim()).map(([n,f]) => f.trim() ? `${n} (${f})` : n).join(", ");
      const ranking = rankItems.join(" | ");

      const { error: dbErr } = await supabase.from("alignment_tests").insert({
        applicant_id: parseInt(applicantId),
        visual_picks: selected.join(", "),
        wear_feeling: q2.trim(),
        design_ranking: ranking,
        local_brands: localBrands,
        intl_brands: intlBrands,
        dimension: q6.trim(),
        moodboard_url: moodboardUrl,
        moodboard_link: moodLink.trim(),
      });
      if (dbErr) throw new Error(dbErr.message);

      await supabase.from("applications").update({ alignment_test_submitted: true }).eq("id", applicantId);
      go(8);
    } catch (e) {
      setErr({ submit: e.message || "something went wrong. please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  // ── styles ──
  const il = { width: "100%", background: "transparent", border: "none", borderBottom: "1px solid #e8e8e4", padding: "11px 0", fontFamily: sans, fontSize: 14, fontWeight: 300, color: "#111", transition: "border-color 0.3s", display: "block" };
  const tf = { width: "100%", background: "transparent", border: "none", borderBottom: "1px solid #e8e8e4", padding: "11px 0", fontFamily: sans, fontSize: 14, fontWeight: 300, color: "#111", transition: "border-color 0.3s", resize: "none", lineHeight: 1.7, minHeight: 56 };
  const btn = { background: "none", border: "none", borderBottom: "1px solid #111", paddingBottom: 3, fontFamily: sans, fontSize: 11, fontWeight: 300, color: "#111", cursor: "pointer", letterSpacing: 2, transition: "opacity 0.2s" };
  const btnGhost = { background: "none", border: "none", borderBottom: "1px solid #ddd", paddingBottom: 2, fontFamily: sans, fontSize: 10, fontWeight: 200, color: "#aaa", cursor: "pointer", letterSpacing: 1.5, transition: "opacity 0.2s", marginRight: 24 };
  const eyebrow = { fontSize: 9, fontWeight: 300, letterSpacing: 3.5, textTransform: "uppercase", color: "#c8a87a", marginBottom: 16 };
  const title = { fontFamily: serif, fontSize: 38, fontWeight: 300, lineHeight: 1.2, color: "#111", marginBottom: 10 };
  const sub = { fontSize: 13, fontWeight: 200, color: "#777", lineHeight: 1.9, marginBottom: 40 };
  const subSm = { fontSize: 11, fontWeight: 200, color: "#aaa", lineHeight: 1.8, marginBottom: 32 };
  const errStyle = { color: "#c47a5a", fontSize: 10, fontWeight: 300, marginTop: 10 };

  const Wrap = ({ children }) => (
    <div style={{ position: "fixed", inset: 0, background: "#fafaf8", overflowY: "auto", fontFamily: sans, color: "#111" }}>
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: 1, background: "#e8e8e4", zIndex: 100 }}>
        <div style={{ height: "100%", background: "#111", width: `${prog}%`, transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)" }} />
      </div>
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "22px 40px", zIndex: 50, background: "linear-gradient(#fafaf8 65%, transparent)" }}>
        <span style={{ fontSize: 11, fontWeight: 300, letterSpacing: 5, textTransform: "uppercase" }}>Jedda</span>
        <span style={{ fontSize: 10, fontWeight: 200, color: "#aaa", letterSpacing: 2 }}>
          {screen > 0 && screen < 8 ? `0${screen} / 0${total}` : ""}
        </span>
      </nav>
      <div style={{ minHeight: "100vh", padding: "100px 40px 80px", maxWidth: 640, margin: "0 auto", display: "flex", flexDirection: "column" }}>
        {children}
      </div>
    </div>
  );

  // ── states ──
  if (initState === "loading") return <Wrap><div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}><p style={{ fontSize: 11, fontWeight: 200, color: "#ccc", letterSpacing: 2 }}>loading...</p></div></Wrap>;

  if (initState === "invalid") return (
    <Wrap>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontSize: 13, fontWeight: 200, color: "#999" }}>this link is no longer valid.</p>
      </div>
    </Wrap>
  );

  if (initState === "already") return (
    <Wrap>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
        <div style={{ width: 28, height: 1, background: "#ccc", marginBottom: 32 }} />
        <p style={{ fontSize: 13, fontWeight: 300, marginBottom: 10 }}>you've already submitted your alignment test.</p>
        <p style={{ fontSize: 12, fontWeight: 200, color: "#999", lineHeight: 1.9 }}>we'll be in touch soon.</p>
      </div>
    </Wrap>
  );

  // ── welcome ──
  if (screen === 0) return (
    <Wrap>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <p style={eyebrow}>alignment test</p>
        <h1 style={{ ...title, fontSize: 42 }}>There are no<br/><em style={{ fontStyle: "italic", color: "#888" }}>right answers.</em></h1>
        <p style={sub}>This is about how you see things — what you're drawn to, what you'd leave out, and whether your instincts align with where Jedda is going.</p>
        <div>
          <button className="at-btn" style={btn} onClick={() => go(1)}>begin →</button>
          <span style={{ fontSize: 10, fontWeight: 200, color: "#bbb", letterSpacing: 1, marginTop: 14, display: "block" }}>7 questions · ~10 minutes</span>
        </div>
      </div>
    </Wrap>
  );

  // ── Q1 ──
  if (screen === 1) {
    const pItems = [
      { bg: "#e2ddd7", svg: <svg width="50" height="114" viewBox="0 0 50 114" fill="none"><ellipse cx="25" cy="11" rx="9" ry="9" fill="#9a9490" opacity=".5"/><rect x="15" y="22" width="20" height="46" rx="1" fill="#9a9490" opacity=".45"/><rect x="6" y="24" width="10" height="32" rx="5" fill="#9a9490" opacity=".35"/><rect x="34" y="24" width="10" height="32" rx="5" fill="#9a9490" opacity=".35"/><rect x="15" y="66" width="9" height="40" rx="2" fill="#9a9490" opacity=".45"/><rect x="26" y="66" width="9" height="40" rx="2" fill="#9a9490" opacity=".45"/></svg> },
      { bg: "#cec9c2", svg: <svg width="54" height="114" viewBox="0 0 54 114" fill="none"><ellipse cx="27" cy="11" rx="10" ry="9" fill="#7a756e" opacity=".45"/><path d="M12 22 Q27 17 42 22 L45 68 Q27 72 9 68 Z" fill="#7a756e" opacity=".4"/><rect x="4" y="24" width="9" height="28" rx="4" fill="#7a756e" opacity=".35"/><rect x="41" y="24" width="9" height="28" rx="4" fill="#7a756e" opacity=".35"/><rect x="13" y="66" width="11" height="42" rx="2" fill="#7a756e" opacity=".4"/><rect x="30" y="66" width="11" height="42" rx="2" fill="#7a756e" opacity=".4"/></svg> },
      { bg: "#dbd5cd", svg: <svg width="46" height="114" viewBox="0 0 46 114" fill="none"><ellipse cx="23" cy="10" rx="8" ry="8" fill="#908880" opacity=".45"/><rect x="14" y="20" width="15" height="54" rx="1" fill="#908880" opacity=".4"/><rect x="5" y="22" width="10" height="34" rx="4" fill="#908880" opacity=".35"/><rect x="31" y="22" width="10" height="34" rx="4" fill="#908880" opacity=".35"/><path d="M14 72 L9 112 L19 112 L23 86 L27 112 L37 112 L32 72 Z" fill="#908880" opacity=".4"/></svg> },
      { bg: "#c4bfb8", svg: <svg width="52" height="114" viewBox="0 0 52 114" fill="none"><ellipse cx="26" cy="10" rx="9" ry="9" fill="#6e6960" opacity=".45"/><path d="M10 20 Q26 15 42 20 L43 60 L9 60 Z" fill="#6e6960" opacity=".4"/><rect x="3" y="22" width="8" height="26" rx="4" fill="#6e6960" opacity=".35"/><rect x="41" y="22" width="8" height="26" rx="4" fill="#6e6960" opacity=".35"/><path d="M11 58 Q15 84 11 112 L23 112 Q25 88 26 78 Q27 88 29 112 L41 112 Q37 84 41 58 Z" fill="#6e6960" opacity=".4"/></svg> },
      { bg: "#d5d0c9", svg: <svg width="48" height="114" viewBox="0 0 48 114" fill="none"><ellipse cx="24" cy="10" rx="8" ry="8" fill="#888079" opacity=".45"/><rect x="16" y="20" width="16" height="29" rx="1" fill="#888079" opacity=".4"/><rect x="6" y="22" width="11" height="23" rx="4" fill="#888079" opacity=".35"/><rect x="31" y="22" width="11" height="23" rx="4" fill="#888079" opacity=".35"/><path d="M15 47 L4 112 L17 112 L24 70 L31 112 L44 112 L33 47 Z" fill="#888079" opacity=".4"/></svg> },
      { bg: "#cac4bc", svg: <svg width="50" height="114" viewBox="0 0 50 114" fill="none"><ellipse cx="25" cy="10" rx="9" ry="9" fill="#787068" opacity=".45"/><path d="M10 20 Q25 14 40 20 L42 57 L8 57 Z" fill="#787068" opacity=".4"/><rect x="3" y="22" width="8" height="25" rx="4" fill="#787068" opacity=".35"/><rect x="39" y="22" width="8" height="25" rx="4" fill="#787068" opacity=".35"/><rect x="9" y="55" width="13" height="54" rx="2" fill="#787068" opacity=".4"/><rect x="28" y="55" width="13" height="54" rx="2" fill="#787068" opacity=".4"/></svg> },
    ];
    return (
      <Wrap>
        <p style={eyebrow}>01 / 07</p>
        <h2 style={title}>Which two feel<br/>like Jedda?</h2>
        <p style={{ ...sub, marginBottom: 10 }}>Trust your eye. Don't overthink it.</p>
        <p style={{ fontSize: 10, fontWeight: 200, color: "#aaa", letterSpacing: 1, marginBottom: 10 }}>selected <b style={{ color: "#111", fontWeight: 400 }}>{selected.length}</b> / 2</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 7, marginBottom: 14 }}>
          {pItems.map((p, i) => {
            const num = i + 1;
            const isSel = selected.includes(num);
            const isDimmed = selected.length === 2 && !isSel;
            return (
              <div key={num} className={`at-pitem${isSel ? " selected" : ""}${isDimmed ? " dimmed" : ""}`}
                onClick={() => pick(num)}
                style={{ aspectRatio: "3/4", position: "relative", cursor: "pointer", overflow: "hidden", background: p.bg, transition: "all 0.3s", outline: isSel ? "1.5px solid #111" : "none", outlineOffset: -1, opacity: isDimmed ? 0.25 : 1 }}>
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>{p.svg}</div>
                <span style={{ position: "absolute", bottom: 9, left: 11, fontSize: 9, fontWeight: 200, letterSpacing: 1.5, color: "rgba(255,255,255,0.4)" }}>{String(num).padStart(2,"0")}</span>
                <div className="at-pcheck" style={{ position: "absolute", top: 8, right: 8, width: 19, height: 19, background: "#111", display: "flex", alignItems: "center", justifyContent: "center", opacity: isSel ? 1 : 0, transition: "opacity 0.2s" }}>
                  <svg viewBox="0 0 9 7" fill="none" width="9" height="9"><path d="M1 3.5l2.5 2.5L8 1" stroke="white" strokeWidth="1.5"/></svg>
                </div>
              </div>
            );
          })}
        </div>
        {err.e1 && <p style={errStyle}>please select 2 before continuing</p>}
        <div style={{ marginTop: "auto", paddingTop: 40 }}>
          <button className="at-btn" style={btn} onClick={next1}>continue →</button>
        </div>
      </Wrap>
    );
  }

  // ── Q2 ──
  if (screen === 2) return (
    <Wrap>
      <p style={eyebrow}>02 / 07</p>
      <h2 style={title}>What do you want<br/>someone to <em style={{ fontStyle: "italic", color: "#888" }}>feel?</em></h2>
      <p style={sub}>The first time they wear something you made.</p>
      <textarea className="at-tfield" style={tf} value={q2} onChange={e => setQ2(e.target.value)} placeholder="write freely." rows={3} />
      {err.e2 && <p style={errStyle}>please write something</p>}
      <div style={{ marginTop: "auto", paddingTop: 40 }}>
        <button className="at-btn-ghost" style={btnGhost} onClick={() => go(1)}>← back</button>
        <button className="at-btn" style={btn} onClick={next2}>continue →</button>
      </div>
    </Wrap>
  );

  // ── Q3 ──
  if (screen === 3) return (
    <Wrap>
      <p style={eyebrow}>03 / 07</p>
      <h2 style={title}>When evaluating<br/>a finished piece —</h2>
      <p style={{ ...sub, marginBottom: 24 }}>rank what you check first. drag to reorder.</p>
      <div style={{ display: "flex", flexDirection: "column", marginBottom: 16, userSelect: "none" }}>
        {rankItems.map((text, i) => (
          <div key={text}
            data-rank-idx={i}
            className={`at-rank-item${dragIdx === i ? " dragging" : ""}`}
            draggable
            onDragStart={() => onDragStart(i)}
            onDragOver={e => onDragOver(e, i)}
            onDragEnd={onDragEnd}
            onTouchStart={() => onTouchStart(i)}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 0", borderBottom: "1px solid #f0f0f0", transition: "opacity 0.15s", opacity: dragIdx === i ? 0.3 : 1, cursor: "grab", touchAction: "none" }}>
            <span style={{ fontSize: 9, fontWeight: 200, color: "#ccc", letterSpacing: 2, width: 18, flexShrink: 0 }}>{String(i+1).padStart(2,"0")}</span>
            <span style={{ fontSize: 13, fontWeight: 300, color: "#444", lineHeight: 1.5, flex: 1 }}>{text}</span>
            <span style={{ fontSize: 11, color: "#ddd", flexShrink: 0 }}>⠿</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: "auto", paddingTop: 40 }}>
        <button className="at-btn-ghost" style={btnGhost} onClick={() => go(2)}>← back</button>
        <button className="at-btn" style={btn} onClick={() => go(4)}>continue →</button>
      </div>
    </Wrap>
  );

  // ── Q4 ──
  if (screen === 4) return (
    <Wrap>
      <p style={eyebrow}>04 / 07</p>
      <h2 style={title}>3 Indonesian fashion brands<br/>you think are <em style={{ fontStyle: "italic", color: "#888" }}>genuinely cool.</em></h2>
      <p style={subSm}>(Jedda doesn't count, obviously.) · clothing, accessories, footwear — anything goes.</p>
      <div>
        {[[id1,setId1,"id1"],[id2,setId2,"id2"],[id3,setId3,"id3"]].map(([val,set,key],i) => (
          <div key={key} className="at-brand-item" style={{ display: "grid", gridTemplateColumns: "28px 1fr", alignItems: "end", borderBottom: "1px solid #e8e8e4", padding: "10px 0" }}>
            <span style={{ fontSize: 9, fontWeight: 200, color: "#bbb", letterSpacing: 2, paddingBottom: 2 }}>{String(i+1).padStart(2,"0")}</span>
            <input style={{ border: "none", background: "transparent", fontFamily: sans, fontSize: 14, fontWeight: 300, color: "#111", width: "100%", padding: 0 }} placeholder="brand name" value={val} onChange={e => { set(e.target.value); setErr({}); }} />
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

  // ── Q5 ──
  if (screen === 5) return (
    <Wrap>
      <p style={eyebrow}>05 / 07</p>
      <h2 style={title}>3 international fashion brands<br/>with the closest <em style={{ fontStyle: "italic", color: "#888" }}>vibe to Jedda.</em></h2>
      <p style={subSm}>clothing only — no mainstream luxury labels (Chanel, Dior, Louis Vuitton, etc.)</p>
      <div>
        {[[in1,setIn1,inf1,setInf1],[in2,setIn2,inf2,setInf2],[in3,setIn3,inf3,setInf3]].map(([name,setName,from,setFrom],i) => (
          <div key={i} className="at-brand-origin" style={{ display: "grid", gridTemplateColumns: "28px 1fr 80px", alignItems: "end", borderBottom: "1px solid #e8e8e4", padding: "10px 0" }}>
            <span style={{ fontSize: 9, fontWeight: 200, color: "#bbb", letterSpacing: 2, paddingBottom: 2 }}>{String(i+1).padStart(2,"0")}</span>
            <input style={{ border: "none", background: "transparent", fontFamily: sans, fontSize: 14, fontWeight: 300, color: "#111", padding: 0 }} placeholder="brand name" value={name} onChange={e => { setName(e.target.value); setErr({}); }} />
            <input style={{ border: "none", background: "transparent", fontFamily: sans, fontSize: 12, fontWeight: 300, color: "#999", padding: 0, textAlign: "right" }} placeholder="from" value={from} onChange={e => setFrom(e.target.value)} />
          </div>
        ))}
      </div>
      {err.e5 && <p style={errStyle}>please fill in at least one brand</p>}
      <div style={{ marginTop: "auto", paddingTop: 40 }}>
        <button className="at-btn-ghost" style={btnGhost} onClick={() => go(4)}>← back</button>
        <button className="at-btn" style={btn} onClick={next5}>continue →</button>
      </div>
    </Wrap>
  );

  // ── Q6 ──
  if (screen === 6) return (
    <Wrap>
      <p style={eyebrow}>06 / 07</p>
      <h2 style={title}>We have our own perspective,<br/>language, and <em style={{ fontStyle: "italic", color: "#888" }}>identity of design.</em></h2>
      <p style={sub}>But we know it's far from complete. What dimension would you bring?</p>
      <textarea className="at-tfield" style={tf} value={q6} onChange={e => setQ6(e.target.value)} placeholder="write freely." rows={3} />
      {err.e6 && <p style={errStyle}>please write something</p>}
      <div style={{ marginTop: "auto", paddingTop: 40 }}>
        <button className="at-btn-ghost" style={btnGhost} onClick={() => go(5)}>← back</button>
        <button className="at-btn" style={btn} onClick={next6}>continue →</button>
      </div>
    </Wrap>
  );

  // ── Q7 moodboard ──
  if (screen === 7) return (
    <Wrap>
      <p style={eyebrow}>07 / 07</p>
      <h2 style={title}>Make your<br/><em style={{ fontStyle: "italic", color: "#888" }}>moodboard.</em></h2>
      <p style={sub}>Silhouettes, garments, anything that feels aligned with Jedda's direction — pull from Pinterest, Instagram, screenshots, anywhere.</p>
      <p style={{ ...subSm, marginTop: -24 }}>Max 10 images. No need to name, explain, or tell us the story.</p>
      <input type="file" ref={fileRef} accept=".pdf,.jpg,.jpeg,.png,.zip" style={{ display: "none" }} onChange={handleFile} />
      <div className="at-ubox" onClick={() => fileRef.current?.click()}
        style={{ border: moodFileName ? "1px solid #111" : "1px dashed #d8d4ce", padding: "44px 24px", textAlign: "center", cursor: "pointer", transition: "border-color 0.25s", marginBottom: 14 }}>
        <span style={{ fontSize: 18, color: moodFileName ? "#111" : "#ccc", marginBottom: 12, display: "block" }}>{moodFileName ? "✓" : "↑"}</span>
        <p style={{ fontSize: 12, fontWeight: 300, color: moodFileName ? "#111" : "#888" }}>{moodFileName || "click to upload"}</p>
        <p style={{ fontSize: 10, fontWeight: 200, color: "#bbb", marginTop: 5 }}>{moodFileName ? "click to replace" : "pdf, jpg, png · max 20mb"}</p>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "12px 0 14px" }}>
        <div style={{ flex: 1, height: 1, background: "#eee" }} />
        <span style={{ fontSize: 10, fontWeight: 200, color: "#bbb", letterSpacing: 1 }}>or</span>
        <div style={{ flex: 1, height: 1, background: "#eee" }} />
      </div>
      <input className="at-ifield" style={il} type="url" placeholder="paste a link — pinterest board, notion, are.na, google drive..." value={moodLink} onChange={e => { setMoodLink(e.target.value); setErr({}); }} />
      <p style={{ fontSize: 10, fontWeight: 200, color: "#bbb", marginTop: 8 }}>make sure it's set to public</p>
      {err.e7 && <p style={errStyle}>please upload a file or paste a link</p>}
      {err.submit && <p style={errStyle}>{err.submit}</p>}
      <div style={{ marginTop: "auto", paddingTop: 40 }}>
        <button className="at-btn-ghost" style={btnGhost} onClick={() => go(6)}>← back</button>
        <button className="at-btn" style={{ ...btn, opacity: submitting ? 0.4 : 1 }} onClick={submitting ? undefined : submitTest}>
          {submitting ? "submitting..." : "submit →"}
        </button>
      </div>
    </Wrap>
  );

  // ── done ──
  if (screen === 8) return (
    <Wrap>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ width: 28, height: 1, background: "#111", marginBottom: 40 }} />
        <h2 style={{ fontFamily: serif, fontSize: 44, fontWeight: 300, lineHeight: 1.15, color: "#111", marginBottom: 20 }}>
          That's all<br/>we needed<br/>to <em style={{ fontStyle: "italic", color: "#888" }}>see.</em>
        </h2>
        <p style={{ fontSize: 13, fontWeight: 200, color: "#999", lineHeight: 2, maxWidth: 300 }}>
          We'll take it from here. If there's an alignment, you'll hear from us soon.
        </p>
        <div style={{ width: "100%", height: 1, background: "#eee", margin: "52px 0 24px" }} />
        <p style={{ fontSize: 9, fontWeight: 300, letterSpacing: 4, textTransform: "uppercase", color: "#ccc" }}>
          Jedda — {new Date().getFullYear()}
        </p>
      </div>
    </Wrap>
  );

  return null;
}
