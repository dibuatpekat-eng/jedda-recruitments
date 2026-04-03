import { useState, useRef, useEffect } from "react";
import { supabase } from "./supabase.js";

const sans = "'DM Sans', sans-serif";

export default function ReuploadPage() {
  const [status, setStatus] = useState("idle"); // idle | uploading | done | notfound
  const [portfolioLink, setPortfolioLink] = useState("");
  const [fileName, setFileName] = useState("");
  const [appName, setAppName] = useState("");
  const [err, setErr] = useState("");
  const fileRef = useRef(null);
  const fileObj = useRef(null);

  const id = new URLSearchParams(window.location.search).get("id");

  useEffect(() => {
    document.body.style.margin = "0";
    document.body.style.background = "#fff";
    const st = document.createElement("style");
    st.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@200;300;400&display=swap');
      *{box-sizing:border-box;margin:0;padding:0}
      html,body{background:#fff}
      input::placeholder{color:#ccc}
      input:focus{border-color:#1a1a1a!important;outline:none}
      .ru-upload:hover{border-color:#999!important}
    `;
    document.head.appendChild(st);

    if (!id) { setStatus("notfound"); return; }

    supabase.from("applications").select("full_name").eq("id", id).single()
      .then(({ data, error }) => {
        if (error || !data) setStatus("notfound");
        else setAppName(data.full_name.split(" ")[0]);
      });

    return () => document.head.removeChild(st);
  }, []);

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.type !== "application/pdf") { setErr("pdf only"); return; }
    if (f.size > 5 * 1024 * 1024) { setErr("max 5mb"); return; }
    fileObj.current = f;
    setFileName(f.name);
    setErr("");
  };

  const submit = async () => {
    if (!fileObj.current && !portfolioLink.trim()) {
      setErr("please upload a file or paste a link");
      return;
    }
    setStatus("uploading");
    setErr("");

    try {
      let portfolioUrl = "";

      if (fileObj.current) {
        const f = fileObj.current;
        const ts = Date.now();
        const path = `portfolio/${ts}_reupload_${id}_portfolio.pdf`;

        const { error: upErr } = await supabase.storage
          .from("documents")
          .upload(path, f, { contentType: "application/pdf" });

        if (upErr) throw new Error(upErr.message);

        const { data } = supabase.storage.from("documents").getPublicUrl(path);
        portfolioUrl = data.publicUrl;
      }

      const update = fileObj.current
        ? { portfolio_url: portfolioUrl, portfolio_link: "" }
        : { portfolio_link: portfolioLink.trim(), portfolio_url: "" };

      const { error: dbErr } = await supabase
        .from("applications")
        .update(update)
        .eq("id", id);

      if (dbErr) throw new Error(dbErr.message);
      setStatus("done");
    } catch (e) {
      setErr(e.message || "something went wrong. please try again.");
      setStatus("idle");
    }
  };

  // ── not found ──
  if (status === "notfound") return (
    <Shell>
      <p style={{ fontSize: 13, fontWeight: 300, color: "#999", textAlign: "center" }}>this link is no longer valid.</p>
    </Shell>
  );

  // ── done ──
  if (status === "done") return (
    <Shell>
      <img src="/logo.png" alt="Jedda" style={{ height: 16, width: "auto", display: "block", margin: "0 auto 32px" }} />
      <div style={{ width: 32, height: 1, background: "#ddd", margin: "0 auto 28px" }} />
      <p style={{ fontSize: 14, fontWeight: 300, textAlign: "center" }}>thank you, {appName}.</p>
      <p style={{ fontSize: 12, fontWeight: 200, color: "#999", marginTop: 10, textAlign: "center", lineHeight: 1.8 }}>
        we've received your portfolio<br />and will be in touch soon.
      </p>
    </Shell>
  );

  // ── form ──
  return (
    <Shell>
      <img src="/logo.png" alt="Jedda" style={{ height: 16, width: "auto", display: "block", margin: "0 auto 32px" }} />
      <div style={{ width: 32, height: 1, background: "#ddd", margin: "0 auto 28px" }} />
      {appName && (
        <p style={{ fontSize: 12, fontWeight: 200, color: "#999", textAlign: "center", marginBottom: 36, lineHeight: 1.8 }}>
          hi {appName} — please re-share your portfolio below.
        </p>
      )}

      {/* file upload */}
      <p style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "#bbb", marginBottom: 10 }}>
        portfolio <span style={{ textTransform: "none", letterSpacing: 0 }}>(pdf, max 5mb)</span>
      </p>
      <input ref={fileRef} type="file" accept=".pdf" onChange={handleFile} style={{ display: "none" }} />
      <div className="ru-upload" onClick={() => fileRef.current?.click()}
        style={{ border: "1px dashed #d8d8d8", padding: "28px 20px", cursor: "pointer", transition: "all 0.2s", textAlign: "center", marginBottom: 16 }}>
        {fileName
          ? <>
              <p style={{ fontSize: 13, color: "#1a1a1a", marginBottom: 4 }}>✓</p>
              <p style={{ fontSize: 12, fontWeight: 400, color: "#1a1a1a" }}>{fileName}</p>
              <p style={{ fontSize: 10, fontWeight: 200, color: "#bbb", marginTop: 4 }}>click to replace</p>
            </>
          : <>
              <p style={{ fontSize: 13, color: "#ccc", marginBottom: 4 }}>↑</p>
              <p style={{ fontSize: 12, fontWeight: 300, color: "#999" }}>click to upload</p>
            </>
        }
      </div>

      {/* or divider */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "4px 0 16px" }}>
        <div style={{ flex: 1, height: 1, background: "#f0f0f0" }} />
        <span style={{ fontSize: 10, fontWeight: 200, color: "#ccc", letterSpacing: 1 }}>or</span>
        <div style={{ flex: 1, height: 1, background: "#f0f0f0" }} />
      </div>

      {/* link input */}
      <input
        style={{ width: "100%", background: "transparent", border: "none", borderBottom: "1px solid #e8e8e8", padding: "10px 0", fontFamily: sans, fontSize: 13, fontWeight: 300, color: "#1a1a1a", outline: "none", transition: "border-color 0.3s" }}
        placeholder="paste a link — behance, dribbble, notion, etc."
        type="url"
        value={portfolioLink}
        onChange={e => { setPortfolioLink(e.target.value); setErr(""); }}
      />
      <p style={{ fontSize: 10, fontWeight: 200, color: "#bbb", marginTop: 7, marginBottom: 32 }}>
        make sure the link is publicly accessible
      </p>

      {err && <p style={{ fontSize: 11, fontWeight: 300, color: "#c47a5a", marginBottom: 16 }}>{err}</p>}

      <button
        onClick={status === "uploading" ? undefined : submit}
        style={{ background: "none", border: "none", fontFamily: sans, fontSize: 12, fontWeight: 300, color: "#1a1a1a", cursor: status === "uploading" ? "default" : "pointer", letterSpacing: 1.5, borderBottom: "1px solid #1a1a1a", paddingBottom: 3, opacity: status === "uploading" ? 0.4 : 1 }}
      >
        {status === "uploading" ? "uploading..." : "submit →"}
      </button>
    </Shell>
  );
}

function Shell({ children }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: sans, color: "#1a1a1a", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 360 }}>{children}</div>
    </div>
  );
}
