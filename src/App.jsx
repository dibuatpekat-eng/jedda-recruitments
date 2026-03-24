import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase.js";

const DIVISIONS = [
  {
    label: "design",
    roles: [
      {
        id: "ddl", title: "Design & Development Lead",
        skills: ["trend research", "moodboard creation", "fabric sourcing", "reference development", "production coordination"],
        workTypes: ["Full-time"],
        desc: "You'll lead the research and development side of each collection — gathering references, studying trends, building moodboards, and sourcing the right fabrics to bring a concept to life. You'll coordinate with manufacturers and oversee the journey from initial idea to production-ready sample. You don't need a fashion design degree or background for this role. What matters is your eye for detail, your ability to research with intention, and your instinct for materials and processes that align with the brand's direction.",
        niceToHave: "experience in trend forecasting, material research, working with Indonesian manufacturers, or knowledge of sustainable fabrics",
      },
      {
        id: "fd", title: "Fashion Designer",
        skills: ["fashion design", "sketching", "silhouette development", "fabric selection", "collection planning"],
        workTypes: ["Full-time", "Part-time", "Internship"],
        desc: "You'll work closely with the founder to shape the visual language of each collection. From the earliest sketches to the final fitting, you're involved in every creative decision — developing silhouettes, selecting fabrics, refining proportions, and crafting pieces that feel right to wear every day. The work is quiet and detail-driven. It's not about chasing trends — it's about making clothes that someone can reach for daily and still notice something new.",
        niceToHave: "experience with modest fashion, small-batch production, or a personal textile craft practice",
        hasSpec: true,
      },
    ],
  },
  {
    label: "creative",
    roles: [
      {
        id: "vd", title: "Visual Director",
        skills: ["art direction", "photography", "visual identity", "Adobe Creative Suite"],
        workTypes: ["Full-time"],
        desc: "You'll define how Jedda looks beyond the garment — art directing photoshoots, shaping campaign visuals, designing lookbook layouts, and making sure every image across every touchpoint belongs to the same quiet world. This is about restraint — knowing what to leave out, how to let the clothes breathe in a frame, and building a visual language that people recognize without needing to see a logo.",
        niceToHave: "editorial or fashion photography background, experience with brand identity systems, or a portfolio of intentional visual storytelling",
      },
      {
        id: "csm", title: "Content & Social Media Strategist",
        skills: ["copywriting", "content planning", "social media management", "brand voice"],
        workTypes: ["Full-time", "Internship"],
        desc: "You'll shape what Jedda says and how it shows up online — from Instagram captions and campaign copy to content calendars and engagement strategy. The voice isn't loud or trendy. It's considered, quiet, and intentional. You'll plan and create content that builds the brand's presence, coordinate with the visual team, track what resonates, and refine the approach based on what you learn.",
        niceToHave: "experience with fashion or lifestyle brands, bilingual ID/EN content creation, or a personal writing practice",
      },
      {
        id: "dgs", title: "Digital & Growth Strategist",
        skills: ["website management", "data analytics", "digital marketing", "inventory coordination"],
        workTypes: ["Full-time"],
        desc: "You'll manage everything behind the screen — from the website to sales analytics, stock coordination, and digital marketing. You'll track what's selling, identify growth opportunities, manage campaigns, and make sure the operational side of Jedda's digital presence runs smoothly. This role connects the dots between product, data, and customer — making decisions based on numbers but always in service of the brand.",
        niceToHave: "experience with Shopify, familiarity with fashion e-commerce, or background in growth/performance marketing",
      },
    ],
  },
  {
    label: "retail",
    roles: [
      {
        id: "sa", title: "Sales Associate",
        skills: ["product knowledge", "visual merchandising", "customer relationship", "retail experience"],
        workTypes: ["Full-time", "Part-time"],
        desc: "You'll be the face of Jedda in person — the first point of contact between the brand and the people who wear it. This role is about understanding before selling. You'll greet customers, share the story behind each piece, help them find what fits, and keep the store running smoothly. From styling the display to managing inventory to handling customer inquiries via WhatsApp — you'll make sure every interaction feels as considered as the clothes themselves.",
        niceToHave: "fashion retail background, experience with POS systems, or genuine interest in styling and wardrobe building",
      },
    ],
  },
];

const FD_SPECS = ["shirts", "outerwear", "knitwear", "pants & bottoms", "pattern design", "other"];
const AVAIL_OPTIONS = ["immediately", "within 1 month", "within 3 months", "other"];
const sans = "'DM Sans', sans-serif";

const Logo = ({ hero = false, img = false }) => {
  const h = hero ? 20 : 14;
  if (img) return <img src="/logo.png" alt="Jedda" style={{ height: h, width: "auto", display: "block", margin: "0 auto" }} />;
  return <span style={{ fontFamily: sans, fontSize: hero ? 18 : 12, fontWeight: 400, letterSpacing: hero ? 6 : 3, color: "#1a1a1a" }}>Jedda</span>;
};
const Lnk = ({ text, onClick, bold }) => (
  <button className="m-link" onClick={onClick} style={{ background: "none", border: "none", fontFamily: sans, fontSize: 11, fontWeight: 300, color: "#1a1a1a", cursor: "pointer", letterSpacing: 1.5, transition: "opacity 0.2s", padding: 0, borderBottom: `1px solid ${bold ? "#1a1a1a" : "#ccc"}`, paddingBottom: 3 }}>{text}</button>
);

export default function App() {
  const [phase, setPhase] = useState("welcome");
  const [role, setRole] = useState(null);
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [anim, setAnim] = useState(false);
  const [vis, setVis] = useState(true);
  const [ready, setReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr] = useState("");
  const [d, setD] = useState({ otherRole: "", fdSpecs: [], fdSpecOther: "", workType: "", fullName: "", phone: "", email: "", city: "", bandung: null, whyJedda: "", avail: "", availOther: "", cv: null, portfolio: null, onsite: null });
  const [cvName, setCvName] = useState("");
  const [portName, setPortName] = useState("");
  const [done, setDone] = useState(false);
  const [err, setErr] = useState({});
  const cvRef = useRef(null);
  const portRef = useRef(null);
  const inputRefs = useRef({});

  useEffect(() => {
    document.documentElement.style.background = "#fff";
    document.body.style.background = "#fff";
    document.body.style.margin = "0";
    const st = document.createElement("style");
    st.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,200;0,300;0,400;0,500;1,200;1,300&display=swap');
      *{margin:0;padding:0;box-sizing:border-box}
      html,body{background:#fff !important}
      ::selection{background:#1a1a1a;color:#fff}
      input::placeholder,textarea::placeholder{color:#c0c0c0}
      input:focus,textarea:focus{border-color:#1a1a1a !important;outline:none}
      .m-opt:hover{border-color:#1a1a1a !important}
      .m-back:hover{color:#1a1a1a !important}
      .m-upload:hover{border-color:#999 !important}
      .m-link:hover{opacity:0.5}
      .m-row:hover .m-rt{opacity:0.5 !important}
      .m-chk:hover{border-color:#999 !important}
      html{scroll-behavior:smooth}
    `;
    document.head.appendChild(st);
    setTimeout(() => setReady(true), 50);
    return () => document.head.removeChild(st);
  }, []);

  const isFD = role?.id === "fd";
  const isSales = role?.id === "sa";
  const isOther = role?.id === "other";
  const needsBandung = !isSales;

  const formSteps = [
    ...(isOther ? ["otherRole"] : []),
    ...(isFD ? ["fdSpec"] : []),
    ...(isSales ? ["onsite"] : []),
    "workType", "fullName", "phone", "email", "city",
    ...(needsBandung ? ["bandung"] : []),
    "avail", "upload", "whyJedda", "review"
  ];
  const totalForm = formSteps.length;
  const curForm = formSteps[step];
  const prog = (step + 1) / totalForm;

  useEffect(() => {
    if (phase === "form") {
      const k = formSteps[step];
      if (inputRefs.current[k]) setTimeout(() => inputRefs.current[k]?.focus(), 420);
    }
  }, [step, phase]);

  const goForm = (n) => { if (anim || n < 0 || n >= totalForm) return; setDir(n > step ? 1 : -1); setAnim(true); setVis(false); setTimeout(() => { setStep(n); setVis(true); setAnim(false); }, 350); };
  const nextForm = () => {
    if (!validateForm()) return;
    if (curForm === "onsite" && d.onsite === false) { setPhase("listing"); return; }
    goForm(step + 1);
  };
  const prevForm = () => { if (step === 0) { setPhase(isOther ? "listing" : "detail"); return; } goForm(step - 1); };

  const validateForm = () => {
    const k = formSteps[step]; let e = {};
    if (k === "otherRole" && !d.otherRole.trim()) e.otherRole = "required";
    if (k === "fdSpec" && d.fdSpecs.length === 0) e.fdSpec = "please select at least one";
    if (k === "fdSpec" && d.fdSpecs.includes("other") && !d.fdSpecOther.trim()) e.fdSpecOther = "please specify";
    if (k === "onsite" && d.onsite === null) e.onsite = "please confirm";
    if (k === "workType" && !d.workType) e.workType = "please select one";
    if (k === "fullName" && !d.fullName.trim()) e.fullName = "required";
    if (k === "phone" && !d.phone.trim()) e.phone = "required";
    if (k === "email") { if (!d.email.trim()) e.email = "required"; else if (!/\S+@\S+\.\S+/.test(d.email)) e.email = "invalid email"; }
    if (k === "city" && !d.city.trim()) e.city = "required";
    if (k === "bandung" && d.bandung === null) e.bandung = "please select one";
    if (k === "whyJedda" && !d.whyJedda.trim()) e.whyJedda = "required";
    if (k === "avail" && !d.avail) e.avail = "please select one";
    if (k === "avail" && d.avail === "other" && !d.availOther.trim()) e.availOther = "please specify";
    if (k === "upload" && !d.cv) e.cv = "please upload your cv";
    setErr(e); return !Object.keys(e).length;
  };

  const onKey = (e) => { if (e.key === "Enter" && !e.shiftKey && curForm !== "review" && curForm !== "whyJedda") { e.preventDefault(); nextForm(); } };

  const submitForm = async () => {
    setSubmitting(true);
    setSubmitErr("");
    try {
      const ts = Date.now();
      const safeName = d.fullName.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
      let cvUrl = "";
      let portfolioUrl = "";

      if (d.cv) {
        const cvPath = `cv/${ts}_${safeName}_cv.pdf`;
        const { error: cvErr } = await supabase.storage.from("documents").upload(cvPath, d.cv, { contentType: "application/pdf" });
        if (cvErr) throw new Error("CV upload failed: " + cvErr.message);
        const { data: cvData } = supabase.storage.from("documents").getPublicUrl(cvPath);
        cvUrl = cvData.publicUrl;
      }

      if (d.portfolio) {
        const portPath = `portfolio/${ts}_${safeName}_portfolio.pdf`;
        const { error: portErr } = await supabase.storage.from("documents").upload(portPath, d.portfolio, { contentType: "application/pdf" });
        if (portErr) throw new Error("Portfolio upload failed: " + portErr.message);
        const { data: portData } = supabase.storage.from("documents").getPublicUrl(portPath);
        portfolioUrl = portData.publicUrl;
      }

      const { error: dbErr } = await supabase.from("applications").insert({
        position: isOther ? d.otherRole : role.title,
        fd_sub: isFD ? "Fashion Designer" : (role?.id === "ddl" ? "Design & Development Lead" : ""),
        fd_specs: isFD ? d.fdSpecs.map(s => s === "other" ? d.fdSpecOther : s).join(", ") : "",
        work_type: d.workType,
        full_name: d.fullName,
        phone: d.phone,
        email: d.email,
        city: d.city,
        bandung: needsBandung ? (d.bandung ? "yes" : "no") : "",
        onsite: isSales ? (d.onsite ? "yes" : "no") : "",
        availability: d.avail === "other" ? d.availOther : d.avail,
        why_jedda: d.whyJedda,
        cv_url: cvUrl,
        portfolio_url: portfolioUrl,
      });

      if (dbErr) throw new Error("Submission failed: " + dbErr.message);
      setDone(true);
    } catch (error) {
      console.error(error);
      setSubmitErr(error.message || "something went wrong. please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFile = (type) => (e) => {
    const f = e.target.files[0]; if (!f) return;
    if (f.type !== "application/pdf") { setErr({ [type]: "pdf only" }); return; }
    if (f.size > 5 * 1024 * 1024) { setErr({ [type]: "max 5mb" }); return; }
    if (type === "cv") { setD({ ...d, cv: f }); setCvName(f.name); } else { setD({ ...d, portfolio: f }); setPortName(f.name); }
    setErr({});
  };
  const toggleSpec = (spec) => { const c = [...d.fdSpecs]; const i = c.indexOf(spec); if (i >= 0) c.splice(i, 1); else c.push(spec); setD({ ...d, fdSpecs: c }); setErr({}); };
  const goTo = (p, r) => { if (r) setRole(r); setPhase(p); window.scrollTo(0, 0); };
  const startApply = () => { setD({ otherRole: "", fdSpecs: [], fdSpecOther: "", workType: "", fullName: "", phone: "", email: "", city: "", bandung: null, whyJedda: "", avail: "", availOther: "", cv: null, portfolio: null, onsite: null }); setCvName(""); setPortName(""); setStep(0); setSubmitErr(""); goTo("form"); };

  const slide = { opacity: vis ? 1 : 0, transform: vis ? "translateY(0)" : `translateY(${dir * 10}px)`, transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)" };

  // ═══ DONE ═══
  if (done) return (
    <Sh><div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}><div style={{ textAlign: "center" }}>
      <Logo hero img /><div style={{ height: 36 }} /><div style={{ width: 32, height: 1, background: "#ddd", margin: "0 auto" }} /><div style={{ height: 32 }} />
      <p style={{ fontSize: 12, fontWeight: 300 }}>thank you for your application.</p><div style={{ height: 10 }} />
      <p style={{ fontSize: 11, fontWeight: 200, color: "#999", lineHeight: 1.8 }}>we have received your submission and will review it carefully.<br />you will hear from us soon.</p>
    </div></div></Sh>
  );

  // ═══ WELCOME ═══
  if (phase === "welcome") return (
    <Sh><div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ textAlign: "center", maxWidth: 360, opacity: ready ? 1 : 0, transform: ready ? "translateY(0)" : "translateY(12px)", transition: "all 0.8s cubic-bezier(0.4, 0, 0.2, 1)" }}>
        <Logo hero img /><div style={{ height: 36 }} />
        <p style={{ fontSize: 9, fontWeight: 400, letterSpacing: 5, textTransform: "uppercase" }}>open recruitment</p>
        <div style={{ height: 20 }} /><div style={{ width: 32, height: 1, background: "#ccc", margin: "0 auto" }} /><div style={{ height: 24 }} />
        <p style={{ fontSize: 11, fontWeight: 200, lineHeight: 2, color: "#999" }}>seeking individuals who value<br />thoughtful work and quiet precision.</p>
        <div style={{ height: 44 }} />
        <Lnk text="view open roles →" onClick={() => goTo("listing")} bold />
      </div>
    </div></Sh>
  );

  // ═══ LISTING ═══
  if (phase === "listing") return (
    <Sh scroll>
      <div style={{ padding: "0 24px", maxWidth: 520, margin: "0 auto", width: "100%" }}>
        <TopNav onBack={() => goTo("welcome")} />
        <p style={{ fontSize: 9, letterSpacing: 4, textTransform: "uppercase", color: "#bbb", marginBottom: 40 }}>open positions</p>
        {DIVISIONS.map((div, di) => (
          <div key={div.label} style={{ marginBottom: di < DIVISIONS.length - 1 ? 40 : 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
              <p style={{ fontSize: 9, fontWeight: 400, letterSpacing: 3, textTransform: "uppercase", color: "#bbb", margin: 0, whiteSpace: "nowrap" }}>{div.label}</p>
              <div style={{ flex: 1, height: 1, background: "#f0f0f0" }} />
            </div>
            {div.roles.map((r) => (
              <div key={r.id} className="m-row" onClick={() => goTo("detail", r)} style={{ borderBottom: "1px solid #f0f0f0", padding: "18px 0", cursor: "pointer" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <p className="m-rt" style={{ fontSize: 13, fontWeight: 400, margin: 0, transition: "opacity 0.2s" }}>{r.title.toLowerCase()}</p>
                  <span style={{ fontSize: 10, color: "#ccc" }}>→</span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {r.skills.slice(0, 3).map((s, j) => <span key={s} style={{ fontSize: 9, fontWeight: 300, color: "#bbb" }}>{s}{j < 2 ? " ·" : ""}</span>)}
                </div>
              </div>
            ))}
          </div>
        ))}
        <div style={{ marginTop: 40, textAlign: "center" }}>
          <p style={{ fontSize: 11, fontWeight: 200, color: "#aaa" }}>don't see your role? <span style={{ borderBottom: "1px solid #ccc", cursor: "pointer", paddingBottom: 1 }} onClick={() => { setRole({ id: "other", title: "Other", skills: [], workTypes: ["Full-time", "Part-time", "Internship"], desc: "", niceToHave: "" }); startApply(); }}>apply anyway →</span></p>
        </div>
      </div>
      <div style={{ height: 60 }} /><Ft />
    </Sh>
  );

  // ═══ DETAIL ═══
  if (phase === "detail" && role) return (
    <Sh scroll>
      <div style={{ padding: "0 24px", maxWidth: 480, margin: "0 auto", width: "100%" }}>
        <TopNav onBack={() => goTo("listing")} />
        <h1 style={{ fontSize: 20, fontWeight: 400, margin: "0 0 6px", letterSpacing: 0.3 }}>{role.title.toLowerCase()}</h1>
        <p style={{ fontSize: 11, color: "#bbb", margin: "0 0 48px", letterSpacing: 0.5 }}>{role.workTypes.map(w => w.toLowerCase()).join(" · ")}</p>
        <div style={{ width: 24, height: 1, background: "#ddd", marginBottom: 36 }} />
        <p style={{ fontSize: 13, fontWeight: 300, lineHeight: 2.1, color: "#666", margin: "0 0 40px" }}>{role.desc}</p>
        {role.skills.length > 0 && <>
          <p style={{ fontSize: 9, letterSpacing: 3, textTransform: "uppercase", color: "#bbb", margin: "0 0 14px" }}>you'll need</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
            {role.skills.map(s => <span key={s} style={{ fontSize: 11, fontWeight: 300, color: "#888", border: "1px solid #e8e8e8", padding: "5px 12px" }}>{s}</span>)}
          </div>
        </>}
        {role.niceToHave && <p style={{ fontSize: 11, fontWeight: 200, color: "#bbb", margin: "0 0 56px", lineHeight: 1.7 }}>nice to have — {role.niceToHave}</p>}
        <div style={{ width: "100%", height: 1, background: "#f0f0f0", marginBottom: 32 }} />
        <div style={{ textAlign: "center", marginBottom: 60 }}>
          <Lnk text="apply →" onClick={startApply} bold />
          <p style={{ fontSize: 9, fontWeight: 200, color: "#ccc", margin: "14px 0 0", letterSpacing: 1 }}>~3 min</p>
        </div>
      </div>
      <Ft />
    </Sh>
  );

  // ═══ FORM ═══
  if (phase === "form") {
    const sIdx = (key) => String(formSteps.indexOf(key) + 1).padStart(2, "0");

    const renderStep = () => {
      switch (curForm) {
        case "otherRole":
          return (<div><Nm n="01" t={totalForm-1} /><Q>what role do you have in mind?</Q><div style={{ height: 20 }} />
            <input ref={el=>inputRefs.current.otherRole=el} style={il} placeholder="describe the role you'd like to apply for" value={d.otherRole} onChange={e=>{setD({...d,otherRole:e.target.value});setErr({});}} onKeyDown={onKey} />
            {err.otherRole && <p style={es}>{err.otherRole}</p>}</div>);

        case "fdSpec":
          return (<div><Nm n="01" t={totalForm-1} /><Q>what's your specialization?</Q><p style={{ fontSize: 10, fontWeight: 200, color: "#aaa", marginTop: 6 }}>select all that apply</p><div style={{ height: 24 }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>{FD_SPECS.map(spec => {
              const checked = d.fdSpecs.includes(spec);
              return (<div key={spec} className="m-chk" onClick={() => toggleSpec(spec)} style={{ ...ob, cursor: "pointer", ...(checked ? oa : {}) }}>
                <span style={{ fontSize: 10, width: 14, flexShrink: 0, opacity: checked ? 1 : 0.3 }}>{checked ? "✓" : "○"}</span>{spec}
              </div>);
            })}</div>
            {d.fdSpecs.includes("other") && (<div style={{ marginTop: 16 }}><input style={il} placeholder="please specify" value={d.fdSpecOther} onChange={e=>{setD({...d,fdSpecOther:e.target.value});setErr({});}} onKeyDown={onKey} />{err.fdSpecOther && <p style={es}>{err.fdSpecOther}</p>}</div>)}
            {err.fdSpec && <p style={es}>{err.fdSpec}</p>}</div>);

        case "onsite":
          return (<div><Nm n={sIdx("onsite")} /><p style={{ fontSize: 14, fontWeight: 300, lineHeight: 1.7 }}>this role requires <em>on-site</em> placement in <strong style={{ fontWeight: 500 }}>Bandung</strong>.</p><p style={{ fontSize: 11, fontWeight: 200, color: "#999", marginTop: 6, fontStyle: "italic" }}>are you able to work on-site?</p><div style={{ height: 24 }} /><div style={{ display: "flex", gap: 6 }}>{[true, false].map(v => (<button className="m-opt" key={String(v)} onClick={() => { setD({ ...d, onsite: v }); setErr({}); }} style={{ ...ob, flex: 1, justifyContent: "center", ...(d.onsite === v ? oa : {}) }}>{v ? "yes" : "no"}</button>))}</div>{err.onsite && <p style={es}>{err.onsite}</p>}</div>);

        case "workType":
          return (<div><Nm n={sIdx("workType")} t={totalForm-1} /><Q>how would you like to be part of the team?</Q><div style={{ height: 24 }} /><div style={{ display: "flex", flexDirection: "column", gap: 5 }}>{(role?.workTypes || []).map((w, i) => (<button className="m-opt" key={w} onClick={() => { setD({ ...d, workType: w }); setErr({}); }} style={{ ...ob, ...(d.workType === w ? oa : {}) }}><span style={ls}>{String.fromCharCode(97+i)}</span>{w.toLowerCase()}</button>))}</div>{err.workType && <p style={es}>{err.workType}</p>}</div>);

        case "fullName": return <Fld num={sIdx("fullName")} t={totalForm-1} q="your full name" ph="full name" val={d.fullName} onChange={v=>{setD({...d,fullName:v});setErr({});}} onKey={onKey} iRef={el=>inputRefs.current.fullName=el} error={err.fullName} />;
        case "phone": return <Fld num={sIdx("phone")} t={totalForm-1} q="phone number" ph="+62" val={d.phone} type="tel" onChange={v=>{setD({...d,phone:v});setErr({});}} onKey={onKey} iRef={el=>inputRefs.current.phone=el} error={err.phone} />;
        case "email": return <Fld num={sIdx("email")} t={totalForm-1} q="email address" ph="your@email.com" val={d.email} type="email" onChange={v=>{setD({...d,email:v});setErr({});}} onKey={onKey} iRef={el=>inputRefs.current.email=el} error={err.email} />;
        case "city": return <Fld num={sIdx("city")} t={totalForm-1} q="what city do you live in?" ph="city" val={d.city} onChange={v=>{setD({...d,city:v});setErr({});}} onKey={onKey} iRef={el=>inputRefs.current.city=el} error={err.city} />;

        case "bandung":
          return (<div><Nm n={sIdx("bandung")} t={totalForm-1} /><Q>would you be open to being based in Bandung?</Q><div style={{ height: 24 }} /><div style={{ display: "flex", gap: 6 }}>{[true, false].map(v => (<button className="m-opt" key={String(v)} onClick={() => { setD({ ...d, bandung: v }); setErr({}); }} style={{ ...ob, flex: 1, justifyContent: "center", ...(d.bandung === v ? oa : {}) }}>{v ? "yes" : "no"}</button>))}</div>{err.bandung && <p style={es}>{err.bandung}</p>}</div>);

        case "avail":
          return (<div><Nm n={sIdx("avail")} t={totalForm-1} /><Q>when are you available to start?</Q><div style={{ height: 24 }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>{AVAIL_OPTIONS.map((a, i) => (
              <button className="m-opt" key={a} onClick={() => { setD({ ...d, avail: a, availOther: a === "other" ? d.availOther : "" }); setErr({}); }} style={{ ...ob, ...(d.avail === a ? oa : {}) }}><span style={ls}>{String.fromCharCode(97+i)}</span>{a}</button>
            ))}</div>
            {d.avail === "other" && (<div style={{ marginTop: 16 }}><input style={il} placeholder="please specify" value={d.availOther} onChange={e=>{setD({...d,availOther:e.target.value});setErr({});}} onKeyDown={onKey} />{err.availOther && <p style={es}>{err.availOther}</p>}</div>)}
            {err.avail && <p style={es}>{err.avail}</p>}</div>);

        case "upload":
          return (<div><Nm n={sIdx("upload")} t={totalForm-1} /><Q>upload your documents</Q><p style={{ fontSize: 10, fontWeight: 200, color: "#aaa", marginTop: 6 }}>pdf format, max 5mb each</p><div style={{ height: 24 }} />
            <p style={ul}>cv / resume *</p>
            <input ref={cvRef} type="file" accept=".pdf" onChange={handleFile("cv")} style={{ display: "none" }} />
            <div className="m-upload" onClick={() => cvRef.current?.click()} style={ub}>
              {cvName ? (<><p style={{ fontSize: 12, color: "#1a1a1a", marginBottom: 4 }}>✓</p><p style={{ fontSize: 11, fontWeight: 400, color: "#1a1a1a" }}>{cvName}</p><p style={uh}>click to replace</p></>) : (<><p style={{ fontSize: 12, color: "#ccc", marginBottom: 4 }}>↑</p><p style={{ fontSize: 11, fontWeight: 300, color: "#999" }}>click to upload</p></>)}
            </div>{err.cv && <p style={es}>{err.cv}</p>}
            <p style={{ ...ul, marginTop: 20 }}>portfolio <span style={{ textTransform: "none", letterSpacing: 0 }}>(optional)</span></p>
            <input ref={portRef} type="file" accept=".pdf" onChange={handleFile("portfolio")} style={{ display: "none" }} />
            <div className="m-upload" onClick={() => portRef.current?.click()} style={ub}>
              {portName ? (<><p style={{ fontSize: 12, color: "#1a1a1a", marginBottom: 4 }}>✓</p><p style={{ fontSize: 11, fontWeight: 400, color: "#1a1a1a" }}>{portName}</p><p style={uh}>click to replace</p></>) : (<><p style={{ fontSize: 12, color: "#ccc", marginBottom: 4 }}>↑</p><p style={{ fontSize: 11, fontWeight: 300, color: "#999" }}>click to upload</p></>)}
            </div></div>);

        case "whyJedda":
          return (<div><Nm n={sIdx("whyJedda")} t={totalForm-1} /><Q>why do you want to be part of jedda?</Q><div style={{ height: 20 }} />
            <input ref={el=>inputRefs.current.whyJedda=el} style={il} placeholder="I believe in what Jedda stands for and I want to grow with it." value={d.whyJedda} onChange={e=>{setD({...d,whyJedda:e.target.value});setErr({});}} onKeyDown={onKey} />
            {err.whyJedda && <p style={es}>{err.whyJedda}</p>}</div>);

        case "review":
          return (<div><Q>review your application</Q><p style={{ fontSize: 10, fontWeight: 200, color: "#aaa", marginTop: 6 }}>please confirm everything looks correct.</p><div style={{ height: 24 }} />
            <div style={{ borderTop: "1px solid #f0f0f0" }}>
              <RR l="position" v={isOther ? d.otherRole : role?.title?.toLowerCase()} />
              {isFD && <RR l="specialization" v={d.fdSpecs.map(s => s === "other" ? d.fdSpecOther : s).join(", ")} />}
              {isSales && <RR l="on-site" v={d.onsite ? "yes" : "no"} />}
              <RR l="type" v={d.workType?.toLowerCase()} />
              <RR l="name" v={d.fullName} />
              <RR l="phone" v={d.phone} />
              <RR l="email" v={d.email} />
              <RR l="city" v={d.city} />
              {needsBandung && <RR l="bandung" v={d.bandung ? "yes" : "no"} />}
              <RR l="available" v={d.avail === "other" ? d.availOther : d.avail} />
              <RR l="cv" v={cvName} />
              <RR l="portfolio" v={portName || "—"} />
              <RR l="why jedda" v={d.whyJedda.length > 50 ? d.whyJedda.substring(0, 50) + "..." : d.whyJedda} last />
            </div>
            <div style={{ height: 32 }} />
            {submitErr && <p style={{ ...es, marginBottom: 16 }}>{submitErr}</p>}
            <Lnk text={submitting ? "submitting..." : "submit application →"} onClick={submitting ? undefined : submitForm} bold />
          </div>);

        default: return null;
      }
    };

    return (
      <Sh>
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: 1, background: "#f0f0f0", zIndex: 20 }}><div style={{ height: "100%", background: "#1a1a1a", transition: "width 0.5s ease", width: `${prog*100}%` }} /></div>
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 10, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 24px", background: "linear-gradient(#fff 70%, transparent)" }}>
          <button className="m-back" onClick={prevForm} style={{ background: "none", border: "none", fontFamily: sans, fontSize: 10, fontWeight: 300, color: "#aaa", cursor: "pointer", padding: 0, transition: "color 0.2s", minWidth: 44, textAlign: "left" }}>← back</button>
          <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)" }}><Logo img /></div>
          <p style={{ fontSize: 9, fontWeight: 200, color: "#ccc", letterSpacing: 2, minWidth: 44, textAlign: "right" }}>{String(step+1).padStart(2,"0")}/{String(totalForm).padStart(2,"0")}</p>
        </div>
        <div style={{ padding: "90px 24px 0", maxWidth: 420, margin: "0 auto", width: "100%" }}>
          <p style={{ fontSize: 9, fontWeight: 300, color: "#ccc", letterSpacing: 1, marginBottom: 24 }}>applying for: {isOther ? (d.otherRole || "other") : role?.title?.toLowerCase()}</p>
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "0 24px 80px" }}>
          <div style={{ width: "100%", maxWidth: 420, ...slide }}>
            {renderStep()}
            {curForm !== "review" && <div style={{ marginTop: 36 }}><Lnk text="continue →" onClick={nextForm} /></div>}
          </div>
        </div>
      </Sh>
    );
  }
  return null;
}

function Sh({ children, scroll }) { return <div style={{ position: scroll ? "relative" : "fixed", inset: scroll ? undefined : 0, background: "#fff", overflowY: "auto", minHeight: "100vh", display: "flex", flexDirection: "column", fontFamily: sans, color: "#1a1a1a" }}>{children}</div>; }
function TopNav({ onBack }) { return <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 0 48px" }}><button className="m-back" onClick={onBack} style={{ background: "none", border: "none", fontFamily: sans, fontSize: 10, fontWeight: 300, color: "#aaa", cursor: "pointer", padding: 0, transition: "color 0.2s" }}>← back</button><Logo img /><span style={{ minWidth: 44 }} /></div>; }
function Nm({ n, t }) { return <div style={{ marginBottom: 14 }}><span style={{ fontFamily: sans, fontSize: 9, fontWeight: 300, color: "#ccc", letterSpacing: 2 }}>{n}</span>{t && <span style={{ fontFamily: sans, fontSize: 9, fontWeight: 200, color: "#e0e0e0", letterSpacing: 2 }}> / {String(t).padStart(2,"0")}</span>}</div>; }
function Q({ children }) { return <p style={{ fontFamily: sans, fontSize: 16, fontWeight: 300, lineHeight: 1.5, color: "#1a1a1a", margin: 0 }}>{children}</p>; }
function Fld({ num, t, q, ph, val, type, onChange, onKey, iRef, error }) { return <div><Nm n={num} t={t} /><p style={{ fontFamily: sans, fontSize: 16, fontWeight: 300, lineHeight: 1.5, color: "#1a1a1a" }}>{q}</p><div style={{ height: 20 }} /><input ref={iRef} style={il} placeholder={ph} value={val} type={type||"text"} onChange={e=>onChange(e.target.value)} onKeyDown={onKey} />{error && <p style={es}>{error}</p>}</div>; }
function RR({ l, v, last }) { return <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: last ? "none" : "1px solid #f5f5f5", gap: 16 }}><span style={{ fontFamily: sans, fontSize: 9, fontWeight: 300, color: "#bbb", letterSpacing: 2, flexShrink: 0 }}>{l}</span><span style={{ fontFamily: sans, fontSize: 12, fontWeight: 300, color: "#1a1a1a", textAlign: "right", wordBreak: "break-word" }}>{v}</span></div>; }
function Ft() { return <div style={{ padding: "0 24px 20px", textAlign: "center" }}><div style={{ height: 1, background: "#f5f5f5", maxWidth: 520, margin: "0 auto" }} /><div style={{ height: 14 }} /><p style={{ fontFamily: sans, fontSize: 9, fontWeight: 200, color: "#d0d0d0", letterSpacing: 2 }}>© 2026 jedda</p></div>; }

const il = { width: "100%", background: "transparent", border: "none", borderBottom: "1px solid #e8e8e8", padding: "10px 0", fontFamily: sans, fontSize: 14, fontWeight: 300, color: "#1a1a1a", outline: "none", boxSizing: "border-box", transition: "border-color 0.3s" };
const ob = { background: "transparent", border: "1px solid #ebebeb", borderRadius: 0, padding: "12px 16px", fontFamily: sans, fontSize: 11, fontWeight: 300, color: "#1a1a1a", cursor: "pointer", textAlign: "left", transition: "all 0.2s", display: "flex", alignItems: "center", gap: 10 };
const oa = { background: "#1a1a1a", borderColor: "#1a1a1a", color: "#fff" };
const ls = { fontSize: 8, fontWeight: 400, opacity: 0.3, letterSpacing: 1, width: 12, flexShrink: 0 };
const es = { color: "#c47a5a", fontSize: 10, fontWeight: 300, marginTop: 10 };
const ul = { fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: "#bbb", marginBottom: 10 };
const ub = { border: "1px dashed #d8d8d8", padding: "28px 20px", cursor: "pointer", transition: "all 0.2s", textAlign: "center" };
const uh = { fontSize: 9, fontWeight: 200, color: "#bbb", marginTop: 4 };
