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

export default function JeddaRecruitment() {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [animating, setAnimating] = useState(false);
  const [visible, setVisible] = useState(true);
  const [data, setData] = useState({
    position: "",
    onsite: null,
    workType: "",
    fullName: "",
    phone: "",
    email: "",
    city: "",
    cv: null,
  });
  const [cvFileName, setCvFileName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});
  const fileRef = useRef(null);
  const inputRefs = useRef({});

  const isSales = data.position === "Sales Associate";

  const steps = [
    "welcome",
    "position",
    ...(isSales ? ["onsite"] : []),
    "workType",
    "fullName",
    "phone",
    "email",
    "city",
    "cv",
    "review",
  ];

  const totalSteps = steps.length;
  const currentKey = steps[step];
  const progress = step / (totalSteps - 1);

  useEffect(() => {
    const key = steps[step];
    if (inputRefs.current[key]) {
      setTimeout(() => inputRefs.current[key]?.focus(), 400);
    }
  }, [step]);

  const goTo = (nextStep) => {
    if (animating || nextStep < 0 || nextStep >= totalSteps) return;
    setDirection(nextStep > step ? 1 : -1);
    setAnimating(true);
    setVisible(false);
    setTimeout(() => {
      setStep(nextStep);
      setVisible(true);
      setAnimating(false);
    }, 350);
  };

  const next = () => {
    if (validateCurrent()) goTo(step + 1);
  };
  const prev = () => goTo(step - 1);

  const validateCurrent = () => {
    const key = steps[step];
    let err = {};
    if (key === "position" && !data.position) err.position = "Please select a position";
    if (key === "onsite" && data.onsite === null) err.onsite = "Please confirm";
    if (key === "workType" && !data.workType) err.workType = "Please select one";
    if (key === "fullName" && !data.fullName.trim()) err.fullName = "Required";
    if (key === "phone" && !data.phone.trim()) err.phone = "Required";
    if (key === "email") {
      if (!data.email.trim()) err.email = "Required";
      else if (!/\S+@\S+\.\S+/.test(data.email)) err.email = "Invalid email";
    }
    if (key === "city" && !data.city.trim()) err.city = "Required";
    if (key === "cv" && !data.cv) err.cv = "Please upload your CV";
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && currentKey !== "welcome" && currentKey !== "review") {
      e.preventDefault();
      next();
    }
  };

  const handleSubmit = () => {
    console.log("Submitted:", data);
    setSubmitted(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== "application/pdf") {
        setErrors({ cv: "PDF files only" });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrors({ cv: "Max 5MB" });
        return;
      }
      setData({ ...data, cv: file });
      setCvFileName(file.name);
      setErrors({});
    }
  };

  const slideStyle = {
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : `translateY(${direction * 30}px)`,
    transition: "all 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
  };

  if (submitted) {
    return (
      <div style={styles.container}>
        <div style={styles.grain} />
        <div style={{ ...styles.inner, justifyContent: "center", alignItems: "center" }}>
          <div style={{ textAlign: "center", ...slideStyle, opacity: 1 }}>
            <p style={styles.logo}>J e d d a</p>
            <div style={{ height: 48 }} />
            <div style={styles.thinLine} />
            <div style={{ height: 40 }} />
            <p style={styles.thankYouTitle}>Thank you for your application.</p>
            <div style={{ height: 16 }} />
            <p style={styles.thankYouSub}>
              We have received your submission and will review it carefully.
              <br />
              You will hear from us soon.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const renderStep = () => {
    switch (currentKey) {
      case "welcome":
        return (
          <div style={{ textAlign: "center" }}>
            <p style={styles.logo}>J e d d a</p>
            <div style={{ height: 48 }} />
            <div style={styles.thinLine} />
            <div style={{ height: 40 }} />
            <p style={styles.welcomeTitle}>Open Recruitment</p>
            <div style={{ height: 12 }} />
            <p style={styles.welcomeSub}>
              We're looking for people who care about craft,
              <br />
              detail, and quiet intention.
            </p>
            <div style={{ height: 48 }} />
            <button style={styles.primaryBtn} onClick={next}>
              Begin Application
            </button>
          </div>
        );

      case "position":
        return (
          <div>
            <p style={styles.stepNum}>01</p>
            <p style={styles.question}>Which position are you interested in?</p>
            <div style={{ height: 32 }} />
            <div style={styles.optionsGrid}>
              {POSITIONS.map((p) => (
                <button
                  key={p}
                  style={{
                    ...styles.optionBtn,
                    ...(data.position === p ? styles.optionBtnActive : {}),
                  }}
                  onClick={() => {
                    setData({ ...data, position: p, onsite: null });
                    setErrors({});
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
            {errors.position && <p style={styles.error}>{errors.position}</p>}
          </div>
        );

      case "onsite":
        return (
          <div>
            <p style={styles.stepNum}>—</p>
            <p style={styles.statement}>
              Sales Representative role requires on-site placement in{" "}
              <span style={{ fontWeight: 600 }}>Bandung</span>.
            </p>
            <p style={styles.subQuestion}>Are you able to work on-site?</p>
            <div style={{ height: 32 }} />
            <div style={{ display: "flex", gap: 12 }}>
              {[true, false].map((val) => (
                <button
                  key={String(val)}
                  style={{
                    ...styles.optionBtn,
                    flex: 1,
                    ...(data.onsite === val ? styles.optionBtnActive : {}),
                  }}
                  onClick={() => {
                    setData({ ...data, onsite: val });
                    setErrors({});
                  }}
                >
                  {val ? "Yes" : "No"}
                </button>
              ))}
            </div>
            {errors.onsite && <p style={styles.error}>{errors.onsite}</p>}
          </div>
        );

      case "workType":
        return (
          <div>
            <p style={styles.stepNum}>{isSales ? "02" : "02"}</p>
            <p style={styles.question}>How would you like to be part of the team?</p>
            <div style={{ height: 32 }} />
            <div style={styles.optionsGrid}>
              {WORK_TYPES.map((w) => (
                <button
                  key={w}
                  style={{
                    ...styles.optionBtn,
                    ...(data.workType === w ? styles.optionBtnActive : {}),
                  }}
                  onClick={() => {
                    setData({ ...data, workType: w });
                    setErrors({});
                  }}
                >
                  {w}
                </button>
              ))}
            </div>
            {errors.workType && <p style={styles.error}>{errors.workType}</p>}
          </div>
        );

      case "fullName":
        return (
          <div>
            <p style={styles.stepNum}>03</p>
            <p style={styles.question}>Full name</p>
            <div style={{ height: 24 }} />
            <input
              ref={(el) => (inputRefs.current.fullName = el)}
              style={styles.input}
              placeholder="Your full name"
              value={data.fullName}
              onChange={(e) => { setData({ ...data, fullName: e.target.value }); setErrors({}); }}
              onKeyDown={handleKeyDown}
            />
            {errors.fullName && <p style={styles.error}>{errors.fullName}</p>}
          </div>
        );

      case "phone":
        return (
          <div>
            <p style={styles.stepNum}>04</p>
            <p style={styles.question}>Phone number</p>
            <div style={{ height: 24 }} />
            <input
              ref={(el) => (inputRefs.current.phone = el)}
              style={styles.input}
              placeholder="+62"
              value={data.phone}
              onChange={(e) => { setData({ ...data, phone: e.target.value }); setErrors({}); }}
              onKeyDown={handleKeyDown}
              type="tel"
            />
            {errors.phone && <p style={styles.error}>{errors.phone}</p>}
          </div>
        );

      case "email":
        return (
          <div>
            <p style={styles.stepNum}>05</p>
            <p style={styles.question}>Email address</p>
            <div style={{ height: 24 }} />
            <input
              ref={(el) => (inputRefs.current.email = el)}
              style={styles.input}
              placeholder="your@email.com"
              value={data.email}
              onChange={(e) => { setData({ ...data, email: e.target.value }); setErrors({}); }}
              onKeyDown={handleKeyDown}
              type="email"
            />
            {errors.email && <p style={styles.error}>{errors.email}</p>}
          </div>
        );

      case "city":
        return (
          <div>
            <p style={styles.stepNum}>06</p>
            <p style={styles.question}>What city do you live in?</p>
            <div style={{ height: 24 }} />
            <input
              ref={(el) => (inputRefs.current.city = el)}
              style={styles.input}
              placeholder="City"
              value={data.city}
              onChange={(e) => { setData({ ...data, city: e.target.value }); setErrors({}); }}
              onKeyDown={handleKeyDown}
            />
            {errors.city && <p style={styles.error}>{errors.city}</p>}
          </div>
        );

      case "cv":
        return (
          <div>
            <p style={styles.stepNum}>07</p>
            <p style={styles.question}>Upload your CV / Resume</p>
            <p style={styles.subText}>PDF format, max 5MB</p>
            <div style={{ height: 28 }} />
            <input
              ref={fileRef}
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
            <div
              style={styles.uploadArea}
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const file = e.dataTransfer.files[0];
                if (file) {
                  if (file.type !== "application/pdf") {
                    setErrors({ cv: "PDF files only" });
                    return;
                  }
                  setData({ ...data, cv: file });
                  setCvFileName(file.name);
                  setErrors({});
                }
              }}
            >
              {cvFileName ? (
                <div style={{ textAlign: "center" }}>
                  <p style={{ ...styles.uploadIcon, fontSize: 20 }}>✓</p>
                  <p style={styles.uploadFileName}>{cvFileName}</p>
                  <p style={styles.uploadHint}>Click to replace</p>
                </div>
              ) : (
                <div style={{ textAlign: "center" }}>
                  <p style={styles.uploadIcon}>↑</p>
                  <p style={styles.uploadText}>Drop your file here or click to browse</p>
                  <p style={styles.uploadHint}>PDF only</p>
                </div>
              )}
            </div>
            {errors.cv && <p style={styles.error}>{errors.cv}</p>}
          </div>
        );

      case "review":
        return (
          <div>
            <p style={styles.stepNum}>—</p>
            <p style={styles.question}>Review your application</p>
            <div style={{ height: 28 }} />
            <div style={styles.reviewCard}>
              <ReviewRow label="Position" value={data.position} />
              {isSales && <ReviewRow label="On-site (Bandung)" value={data.onsite ? "Yes" : "No"} />}
              <ReviewRow label="Work type" value={data.workType} />
              <ReviewRow label="Name" value={data.fullName} />
              <ReviewRow label="Phone" value={data.phone} />
              <ReviewRow label="Email" value={data.email} />
              <ReviewRow label="City" value={data.city} />
              <ReviewRow label="CV" value={cvFileName} />
            </div>
            <div style={{ height: 36 }} />
            <button style={styles.primaryBtn} onClick={handleSubmit}>
              Submit Application
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={styles.container} onKeyDown={currentKey === "welcome" ? undefined : undefined}>
      <div style={styles.grain} />

      {/* Progress bar */}
      {step > 0 && !submitted && (
        <div style={styles.progressWrap}>
          <div style={{ ...styles.progressBar, width: `${progress * 100}%` }} />
        </div>
      )}

      {/* Navigation */}
      {step > 0 && currentKey !== "review" && (
        <div style={styles.navTop}>
          <button style={styles.backBtn} onClick={prev}>
            ← Back
          </button>
          <p style={styles.stepIndicator}>
            {String(step).padStart(2, "0")} / {String(totalSteps - 1).padStart(2, "0")}
          </p>
        </div>
      )}
      {currentKey === "review" && (
        <div style={styles.navTop}>
          <button style={styles.backBtn} onClick={prev}>
            ← Back
          </button>
        </div>
      )}

      <div style={{ ...styles.inner, justifyContent: currentKey === "welcome" ? "center" : "flex-start", paddingTop: currentKey === "welcome" ? 0 : 100 }}>
        <div style={{ ...styles.slideWrap, ...slideStyle }}>{renderStep()}</div>

        {/* Next button for non-welcome, non-review steps */}
        {currentKey !== "welcome" && currentKey !== "review" && (
          <div style={{ ...slideStyle, marginTop: 40 }}>
            <button style={styles.nextBtn} onClick={next}>
              Continue
              <span style={styles.enterHint}>press Enter ↵</span>
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        <p style={styles.footerText}>J e d d a</p>
      </div>
    </div>
  );
}

function ReviewRow({ label, value }) {
  return (
    <div style={styles.reviewRow}>
      <span style={styles.reviewLabel}>{label}</span>
      <span style={styles.reviewValue}>{value}</span>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "#EDEBE7",
    position: "relative",
    overflow: "hidden",
    fontFamily: "'Times New Roman', 'Georgia', serif",
    color: "#2C2A27",
    display: "flex",
    flexDirection: "column",
  },
  grain: {
    position: "fixed",
    inset: 0,
    opacity: 0.03,
    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
    pointerEvents: "none",
    zIndex: 1,
  },
  inner: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "0 24px",
    position: "relative",
    zIndex: 2,
    maxWidth: 520,
    margin: "0 auto",
    width: "100%",
    boxSizing: "border-box",
  },
  slideWrap: {
    width: "100%",
  },
  logo: {
    fontSize: 18,
    letterSpacing: 8,
    fontWeight: 400,
    margin: 0,
    textTransform: "lowercase",
    color: "#2C2A27",
  },
  thinLine: {
    width: 40,
    height: 1,
    background: "#B8B4AD",
    margin: "0 auto",
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 400,
    letterSpacing: 6,
    textTransform: "uppercase",
    margin: 0,
  },
  welcomeSub: {
    fontSize: 14,
    fontWeight: 400,
    lineHeight: 1.8,
    color: "#7A756D",
    margin: 0,
    letterSpacing: 0.3,
  },
  stepNum: {
    fontSize: 12,
    letterSpacing: 3,
    color: "#B8B4AD",
    marginBottom: 12,
    fontFamily: "'Courier New', monospace",
  },
  question: {
    fontSize: 22,
    fontWeight: 400,
    lineHeight: 1.4,
    margin: 0,
    letterSpacing: 0.5,
  },
  statement: {
    fontSize: 18,
    fontWeight: 400,
    lineHeight: 1.6,
    margin: 0,
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  subQuestion: {
    fontSize: 14,
    color: "#7A756D",
    margin: 0,
    fontStyle: "italic",
  },
  subText: {
    fontSize: 13,
    color: "#9E998F",
    marginTop: 8,
    marginBottom: 0,
    letterSpacing: 0.2,
  },
  optionsGrid: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  optionBtn: {
    background: "transparent",
    border: "1px solid #C8C3BA",
    borderRadius: 0,
    padding: "14px 20px",
    fontSize: 14,
    fontFamily: "'Times New Roman', serif",
    color: "#2C2A27",
    cursor: "pointer",
    textAlign: "left",
    letterSpacing: 0.5,
    transition: "all 0.2s ease",
  },
  optionBtnActive: {
    background: "#2C2A27",
    borderColor: "#2C2A27",
    color: "#EDEBE7",
  },
  input: {
    width: "100%",
    background: "transparent",
    border: "none",
    borderBottom: "1px solid #C8C3BA",
    padding: "12px 0",
    fontSize: 18,
    fontFamily: "'Times New Roman', serif",
    color: "#2C2A27",
    outline: "none",
    letterSpacing: 0.5,
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  },
  uploadArea: {
    border: "1px dashed #B8B4AD",
    padding: "48px 24px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    textAlign: "center",
  },
  uploadIcon: {
    fontSize: 24,
    color: "#9E998F",
    marginBottom: 12,
  },
  uploadText: {
    fontSize: 14,
    color: "#7A756D",
    margin: 0,
    letterSpacing: 0.3,
  },
  uploadHint: {
    fontSize: 12,
    color: "#B8B4AD",
    marginTop: 8,
    letterSpacing: 0.5,
  },
  uploadFileName: {
    fontSize: 14,
    color: "#2C2A27",
    margin: 0,
    letterSpacing: 0.3,
  },
  primaryBtn: {
    background: "#2C2A27",
    color: "#EDEBE7",
    border: "none",
    padding: "16px 48px",
    fontSize: 13,
    letterSpacing: 3,
    textTransform: "uppercase",
    fontFamily: "'Times New Roman', serif",
    cursor: "pointer",
    transition: "opacity 0.2s",
    width: "100%",
  },
  nextBtn: {
    background: "#2C2A27",
    color: "#EDEBE7",
    border: "none",
    padding: "14px 36px",
    fontSize: 13,
    letterSpacing: 2,
    textTransform: "uppercase",
    fontFamily: "'Times New Roman', serif",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 16,
  },
  enterHint: {
    fontSize: 11,
    opacity: 0.5,
    letterSpacing: 0,
    textTransform: "none",
  },
  error: {
    color: "#A0522D",
    fontSize: 12,
    marginTop: 12,
    letterSpacing: 0.3,
  },
  progressWrap: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    background: "#D5D0C8",
    zIndex: 10,
  },
  progressBar: {
    height: "100%",
    background: "#2C2A27",
    transition: "width 0.5s cubic-bezier(0.22, 1, 0.36, 1)",
  },
  navTop: {
    position: "fixed",
    top: 24,
    left: 24,
    right: 24,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 10,
  },
  backBtn: {
    background: "none",
    border: "none",
    fontSize: 13,
    color: "#7A756D",
    cursor: "pointer",
    fontFamily: "'Times New Roman', serif",
    letterSpacing: 1,
    padding: 0,
  },
  stepIndicator: {
    fontSize: 11,
    color: "#B8B4AD",
    fontFamily: "'Courier New', monospace",
    letterSpacing: 2,
    margin: 0,
  },
  reviewCard: {
    border: "1px solid #C8C3BA",
    padding: "24px",
  },
  reviewRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "12px 0",
    borderBottom: "1px solid #E0DDD7",
    gap: 16,
  },
  reviewLabel: {
    fontSize: 12,
    color: "#9E998F",
    letterSpacing: 1,
    textTransform: "uppercase",
    flexShrink: 0,
  },
  reviewValue: {
    fontSize: 14,
    color: "#2C2A27",
    textAlign: "right",
    letterSpacing: 0.3,
    wordBreak: "break-word",
  },
  footer: {
    padding: "24px 0",
    textAlign: "center",
    position: "relative",
    zIndex: 2,
  },
  footerText: {
    fontSize: 11,
    letterSpacing: 6,
    color: "#B8B4AD",
    margin: 0,
  },
  thankYouTitle: {
    fontSize: 22,
    fontWeight: 400,
    letterSpacing: 1,
    margin: 0,
  },
  thankYouSub: {
    fontSize: 14,
    color: "#7A756D",
    lineHeight: 1.8,
    margin: 0,
    letterSpacing: 0.3,
  },
};
