import { useState, useEffect, useRef } from "react";

const POSITIONS = [
  "Fashion Designer",
  "Design Development & Research",
  "Sales Associate",
  "Content Strategist",
  "Visual Director",
  "Customer Experience & Admin",
  "Other",
];

const WORK_TYPES = ["Full-time", "Part-time", "Internship"];

const FONT = "https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,200;0,300;0,400;0,500;1,200;1,300&display=swap";

const Logo = ({ height = 28, style = {} }) => (
  <img src="/logo.png" alt="Jedda" style={{ height, width: "auto", display: "block", ...style }} />
);

export default function JeddaMoia() {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [anim, setAnim] = useState(false);
  const [vis, setVis] = useState(true);
  const [ready, setReady] = useState(false);
  const [data, setData] = useState({
    position: "", onsite: null, workType: "",
    fullName: "", phone: "", email: "", city: "", cv: null,
  });
  const [cvName, setCvName] = useState("");
  const [done, setDone] = useState(false);
  const [err, setErr] = useState({});
  const fileRef = useRef(null);
  const inputRefs = useRef({});

  useEffect(() => {
    const l = document.createElement("link");
    l.rel = "stylesheet"; l.href = FONT;
    document.head.appendChild(l);
    const st = document.createElement("style");
    st.textContent = `
      *{margin:0;padding:0;box-sizing:border-box}
      html,body{background:#fff;overflow-x:hidden}
      ::selection{background:#1a1a1a;color:#fff}
      input::placeholder{color:#c0c0c0}
      input:focus{border-bottom-color:#1a1a1a !important}
      @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
      @keyframes lineGrow{from{transform:scaleX(0)}to{transform:scaleX(1)}}
      .m-opt:hover{border-color:#1a1a1a !important}
      .m-btn:hover{opacity:0.7}
      .m-back:hover{opacity:1 !important}
      .m-upload:hover{border-color:#999 !important}
    `;
    document.head.appendChild(st);
    setTimeout(() => setReady(true), 150);
    return () => { document.head.removeChild(l); document.head.removeChild(st); };
  }, []);

  const sans = "'DM Sans', sans-serif";
  const isSales = data.position === "Sales Associate";
  const steps = [
    "welcome", "position", ...(isSales ? ["onsite"] : []),
    "workType", "fullName", "phone", "email", "city", "cv", "review",
  ];
  const total = steps.length;
  const cur = steps[step];
  const prog = step / (total - 1);

  useEffect(() => {
    const k = steps[step];
    if (inputRefs.current[k]) setTimeout(() => inputRefs.current[k]?.focus(), 420);
  }, [step]);

  const go = (n) => {
    if (anim || n < 0 || n >= total) return;
    setDir(n > step ? 1 : -1); setAnim(true); setVis(false);
    setTimeout(() => { setStep(n); setVis(true); setAnim(false); }, 380);
  };
  const next = () => { if (validate()) go(step + 1); };
  const prev = () => go(step - 1);

  const validate = () => {
    const k = steps[step]; let e = {};
    if (k === "position" && !data.position) e.position = "please select a position";
    if (k === "onsite" && data.onsite === null) e.onsite = "please confirm";
    if (k === "workType" && !data.workType) e.workType = "please select one";
    if (k === "fullName" && !data.fullName.trim()) e.fullName = "required";
    if (k === "phone" && !data.phone.trim()) e.phone = "required";
    if (k === "email") {
      if (!data.email.trim()) e.email = "required";
      else if (!/\S+@\S+\.\S+/.test(data.email)) e.email = "invalid email";
    }
    if (k === "city" && !data.city.trim()) e.city = "required";
    if (k === "cv" && !data.cv) e.cv = "please upload your cv";
    setErr(e); return !Object.keys(e).length;
  };

  const onKey = (e) => { if (e.key === "Enter" && cur !== "welcome" && cur !== "review") { e.preventDefault(); next(); } };
  const submit = () => { console.log("Submitted:", data); setDone(true); };
  const onFile = (e) => {
    const f = e.target.files[0]; if (!f) return;
    if (f.type !== "application/pdf") { setErr({ cv: "pdf files only" }); return; }
    if (f.size > 5 * 1024 * 1024) { setErr({ cv: "max 5mb" }); return; }
    setData({ ...data, cv: f }); setCvName(f.name); setErr({});
  };

  const slide = {
    opacity: vis ? 1 : 0,
    transform: vis ? "translateY(0)" : `translateY(${dir * 14}px)`,
    transition: "all 0.38s cubic-bezier(0.4, 0, 0.2, 1)",
  };

  if (done) {
    return (
      <div style={{ ...page, fontFamily: sans }}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ textAlign: "center", animation: "fadeUp 0.7s ease forwards" }}>
            <Logo height={32} style={{ margin: "0 auto" }} />
            <div style={{ height: 40 }} />
            <div style={{ width: 40, height: 1, background: "#ddd", margin: "0 auto", animation: "lineGrow 0.5s ease 0.3s forwards", transformOrigin: "center", transform: "scaleX(0)" }} />
            <div style={{ height: 36 }} />
            <p style={{ fontSize: 13, fontWeight: 300, color: "#1a1a1a", letterSpacing: 0.5 }}>thank you for your application.</p>
            <div style={{ height: 12 }} />
            <p style={{ fontSize: 12, fontWeight: 200, color: "#999", lineHeight: 1.8 }}>
              we have received your submission and will review it carefully.
              <br />you will hear from us soon.
            </p>
          </div>
        </div>
        <Foot sans={sans} />
      </div>
    );
  }

  if (cur === "welcome") {
    return (
      <div style={{ ...page, fontFamily: sans }}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{
            textAlign: "center", maxWidth: 400,
            opacity: ready ? 1 : 0, transform: ready ? "translateY(0)" : "translateY(20px)",
            transition: "all 0.9s cubic-bezier(0.4, 0, 0.2, 1)",
          }}>
            <Logo height={36} style={{ margin: "0 auto" }} />
            <div style={{ height: 44 }} />
            <p style={{ fontSize: 10, fontWeight: 400, letterSpacing: 5, textTransform: "uppercase", color: "#1a1a1a" }}>open recruitment</p>
            <div style={{ height: 24 }} />
            <div style={{
              width: 40, height: 1, background: "#ccc", margin: "0 auto",
              animation: ready ? "lineGrow 0.6s ease 0.5s forwards" : "none",
              transformOrigin: "center", transform: "scaleX(0)",
            }} />
            <div style={{ height: 28 }} />
            <p style={{ fontSize: 12, fontWeight: 200, lineHeight: 2, color: "#888" }}>
              we're looking for people who care about craft,
              <br />detail, and quiet intention.
            </p>
            <div style={{ height: 52 }} />
            <button className="m-btn" onClick={next} style={btnFull(sans)}>begin application</button>
            <div style={{ height: 18 }} />
            <p style={{ fontSize: 10, fontWeight: 200, color: "#bbb", letterSpacing: 1 }}>7 questions · ~3 min</p>
          </div>
        </div>
        <Foot sans={sans} />
      </div>
    );
  }

  const Q = ({ children }) => <p style={{ fontFamily: sans, fontSize: 20, fontWeight: 300, lineHeight: 1.4, color: "#1a1a1a", margin: 0 }}>{children}</p>;

  const renderStep = () => {
    switch (cur) {
      case "position":
        return (<div><Num n="01" t={total-2} sans={sans} /><Q>which position are you interested in?</Q><div style={{height:32}}/><div style={{display:"flex",flexDirection:"column",gap:6}}>{POSITIONS.map((p,i)=>(<button className="m-opt" key={p} onClick={()=>{setData({...data,position:p,onsite:null});setErr({});}} style={{...optBase(sans),...(data.position===p?optAct:{})}}><span style={letterStyle}>{String.fromCharCode(97+i)}</span>{p.toLowerCase()}</button>))}</div>{err.position&&<p style={errStyle}>{err.position}</p>}</div>);
      case "onsite":
        return (<div><Num n="—" sans={sans}/><p style={{fontFamily:sans,fontSize:18,fontWeight:300,lineHeight:1.6,color:"#1a1a1a"}}>the sales representative role requires <em>on-site</em> placement in <strong style={{fontWeight:500}}>Bandung</strong>.</p><p style={{fontSize:12,fontWeight:200,color:"#999",marginTop:6,fontStyle:"italic"}}>are you able to work on-site?</p><div style={{height:28}}/><div style={{display:"flex",gap:8}}>{[true,false].map(v=>(<button className="m-opt" key={String(v)} onClick={()=>{setData({...data,onsite:v});setErr({});}} style={{...optBase(sans),flex:1,justifyContent:"center",...(data.onsite===v?optAct:{})}}>{v?"yes":"no"}</button>))}</div>{err.onsite&&<p style={errStyle}>{err.onsite}</p>}</div>);
      case "workType":
        return (<div><Num n="02" t={total-2} sans={sans}/><Q>how would you like to be part of the team?</Q><div style={{height:32}}/><div style={{display:"flex",flexDirection:"column",gap:6}}>{WORK_TYPES.map((w,i)=>(<button className="m-opt" key={w} onClick={()=>{setData({...data,workType:w});setErr({});}} style={{...optBase(sans),...(data.workType===w?optAct:{})}}><span style={letterStyle}>{String.fromCharCode(97+i)}</span>{w.toLowerCase()}</button>))}</div>{err.workType&&<p style={errStyle}>{err.workType}</p>}</div>);
      case "fullName": return <Field num="03" t={total-2} q="your full name" ph="full name" val={data.fullName} onChange={v=>{setData({...data,fullName:v});setErr({});}} onKey={onKey} iRef={el=>inputRefs.current.fullName=el} error={err.fullName} sans={sans}/>;
      case "phone": return <Field num="04" t={total-2} q="phone number" ph="+62" val={data.phone} type="tel" onChange={v=>{setData({...data,phone:v});setErr({});}} onKey={onKey} iRef={el=>inputRefs.current.phone=el} error={err.phone} sans={sans}/>;
      case "email": return <Field num="05" t={total-2} q="email address" ph="your@email.com" val={data.email} type="email" onChange={v=>{setData({...data,email:v});setErr({});}} onKey={onKey} iRef={el=>inputRefs.current.email=el} error={err.email} sans={sans}/>;
      case "city": return <Field num="06" t={total-2} q="what city do you live in?" ph="city" val={data.city} onChange={v=>{setData({...data,city:v});setErr({});}} onKey={onKey} iRef={el=>inputRefs.current.city=el} error={err.city} sans={sans}/>;
      case "cv":
        return (<div><Num n="07" t={total-2} sans={sans}/><Q>upload your cv</Q><p style={{fontSize:11,fontWeight:200,color:"#aaa",marginTop:6}}>pdf format, max 5mb</p><div style={{height:28}}/><input ref={fileRef} type="file" accept=".pdf" onChange={onFile} style={{display:"none"}}/><div className="m-upload" onClick={()=>fileRef.current?.click()} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();const f=e.dataTransfer.files[0];if(!f)return;if(f.type!=="application/pdf"){setErr({cv:"pdf only"});return;}setData({...data,cv:f});setCvName(f.name);setErr({});}} style={{border:"1px dashed #d0d0d0",padding:"44px 20px",cursor:"pointer",transition:"all 0.2s",textAlign:"center"}}>{cvName?(<><p style={{fontSize:18,color:"#1a1a1a",marginBottom:10}}>✓</p><p style={{fontSize:12,fontWeight:400,color:"#1a1a1a"}}>{cvName}</p><p style={{fontSize:10,fontWeight:200,color:"#bbb",marginTop:6}}>click to replace</p></>):(<><p style={{fontSize:18,color:"#bbb",marginBottom:10}}>↑</p><p style={{fontSize:12,fontWeight:300,color:"#888"}}>drop your file here, or click to browse</p><p style={{fontSize:10,fontWeight:200,color:"#bbb",marginTop:6}}>pdf only</p></>)}</div>{err.cv&&<p style={errStyle}>{err.cv}</p>}</div>);
      case "review":
        return (<div><Q>review your application</Q><p style={{fontSize:11,fontWeight:200,color:"#aaa",marginTop:6}}>please confirm everything looks correct.</p><div style={{height:28}}/><div style={{borderTop:"1px solid #eee"}}><RR l="position" v={data.position?.toLowerCase()} sans={sans}/>{isSales&&<RR l="on-site" v={data.onsite?"yes":"no"} sans={sans}/>}<RR l="type" v={data.workType?.toLowerCase()} sans={sans}/><RR l="name" v={data.fullName} sans={sans}/><RR l="phone" v={data.phone} sans={sans}/><RR l="email" v={data.email} sans={sans}/><RR l="city" v={data.city} sans={sans}/><RR l="cv" v={cvName} sans={sans} last/></div><div style={{height:36}}/><button className="m-btn" onClick={submit} style={btnFull(sans)}>submit application</button></div>);
      default: return null;
    }
  };

  return (
    <div style={{...page,fontFamily:sans,color:"#1a1a1a"}}>
      {step>0&&(<div style={{position:"fixed",top:0,left:0,right:0,height:1,background:"#eee",zIndex:20}}><div style={{height:"100%",background:"#1a1a1a",transition:"width 0.5s ease",width:`${prog*100}%`}}/></div>)}
      <div style={{position:"fixed",top:0,left:0,right:0,zIndex:10,display:"flex",justifyContent:"space-between",alignItems:"center",padding:"20px 28px",background:"linear-gradient(#fff 70%, transparent)"}}>
        <button className="m-back" onClick={prev} style={{background:"none",border:"none",fontFamily:sans,fontSize:11,fontWeight:300,color:"#999",cursor:"pointer",letterSpacing:0.5,padding:0,opacity:0.7,transition:"opacity 0.2s",minWidth:50,textAlign:"left"}}>← back</button>
        <Logo height={18} style={{position:"absolute",left:"50%",transform:"translateX(-50%)"}}/>
        <p style={{fontSize:10,fontWeight:200,color:"#bbb",letterSpacing:2,minWidth:50,textAlign:"right"}}>{String(step).padStart(2,"0")}/{String(total-1).padStart(2,"0")}</p>
      </div>
      <div style={{flex:1,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"110px 28px 80px"}}>
        <div style={{width:"100%",maxWidth:440,...slide}}>
          {renderStep()}
          {cur!=="review"&&(<div style={{marginTop:40}}><button className="m-btn" onClick={next} style={{background:"#1a1a1a",color:"#fff",border:"none",padding:"14px 36px",fontFamily:sans,fontSize:10,fontWeight:400,letterSpacing:3,textTransform:"lowercase",cursor:"pointer",transition:"opacity 0.2s",display:"inline-flex",alignItems:"center",gap:14}}>continue<span style={{fontSize:9,fontWeight:200,opacity:0.4,letterSpacing:0}}>enter ↵</span></button></div>)}
        </div>
      </div>
      <Foot sans={sans}/>
    </div>
  );
}

function Num({n,t,sans}){return(<div style={{marginBottom:16}}><span style={{fontFamily:sans,fontSize:10,fontWeight:300,color:"#bbb",letterSpacing:2}}>{n}</span>{t&&<span style={{fontFamily:sans,fontSize:10,fontWeight:200,color:"#ddd",letterSpacing:2}}> / {String(t).padStart(2,"0")}</span>}</div>);}

function Field({num,t,q,ph,val,type,onChange,onKey,iRef,error,sans}){return(<div><Num n={num} t={t} sans={sans}/><p style={{fontFamily:sans,fontSize:20,fontWeight:300,lineHeight:1.4,color:"#1a1a1a"}}>{q}</p><div style={{height:24}}/><input ref={iRef} style={{width:"100%",background:"transparent",border:"none",borderBottom:"1px solid #e0e0e0",padding:"12px 0",fontFamily:sans,fontSize:16,fontWeight:300,color:"#1a1a1a",outline:"none",boxSizing:"border-box",transition:"border-color 0.3s"}} placeholder={ph} value={val} type={type||"text"} onChange={e=>onChange(e.target.value)} onKeyDown={onKey}/>{error&&<p style={errStyle}>{error}</p>}</div>);}

function RR({l,v,sans,last}){return(<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 0",borderBottom:last?"none":"1px solid #f3f3f3",gap:16}}><span style={{fontFamily:sans,fontSize:10,fontWeight:300,color:"#aaa",letterSpacing:2,flexShrink:0}}>{l}</span><span style={{fontFamily:sans,fontSize:13,fontWeight:300,color:"#1a1a1a",textAlign:"right",wordBreak:"break-word"}}>{v}</span></div>);}

function Foot({sans}){return(<div style={{padding:"0 28px 24px",textAlign:"center"}}><div style={{height:1,background:"#f0f0f0",maxWidth:440,margin:"0 auto"}}/><div style={{height:16}}/><p style={{fontFamily:sans,fontSize:10,fontWeight:200,color:"#ccc",letterSpacing:2}}>© 2026 jedda</p></div>);}

const page={minHeight:"100vh",background:"#fff",display:"flex",flexDirection:"column"};
const btnFull=(sans)=>({background:"#1a1a1a",color:"#fff",border:"none",padding:"15px 0",width:"100%",maxWidth:280,fontFamily:sans,fontSize:10,fontWeight:400,letterSpacing:4,textTransform:"lowercase",cursor:"pointer",transition:"opacity 0.2s"});
const optBase=(sans)=>({background:"transparent",border:"1px solid #e8e8e8",borderRadius:0,padding:"14px 18px",fontFamily:sans,fontSize:12,fontWeight:300,color:"#1a1a1a",cursor:"pointer",textAlign:"left",transition:"all 0.2s",display:"flex",alignItems:"center",gap:12});
const optAct={background:"#1a1a1a",borderColor:"#1a1a1a",color:"#fff"};
const letterStyle={fontSize:9,fontWeight:400,opacity:0.35,letterSpacing:1,width:14,flexShrink:0};
const errStyle={color:"#c47a5a",fontSize:11,fontWeight:300,marginTop:12};
