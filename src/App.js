import React, { useMemo, useState } from "react";
import indiaCities from "./cities-in-india.json";

const INDIA_CITIES = [...indiaCities, "Others/Outside India"];

const ISSUES = [
  "Feeling sad","Low mood","Anxiety","Stress","Insomnia","Panic attacks","OCD","Depression",
  "Relationship issues","Work stress","Burnout","Grief","Trauma","ADHD","Addiction","Anger"
];

const LANGUAGES = [
  "English","Hindi","Tamil","Telugu","Kannada","Malayalam","Marathi","Gujarati","Bengali","Punjabi","Urdu","Odia","Assamese","Konkani","Other"
];

const DOCTORS = [
  { id: "doc1", name: "Dr. A", role: "Psychiatrist", bio: "Adult mood and anxiety specialist.", weekday: true, weekend: true, morning: true, evening: false, acceptsChild: false },
  { id: "doc2", name: "Dr. B", role: "Psychiatrist", bio: "Child & adolescent care; ADHD and anxiety.", weekday: true, weekend: false, morning: false, evening: true, acceptsChild: true },
  { id: "doc3", name: "C", role: "Psychologist", bio: "CBT for stress, work burnout, and relationships.", weekday: true, weekend: true, morning: true, evening: true, acceptsChild: false },
];

const DUMMY_SLOTS = (doctorId) => {
  const now = new Date();
  const slots = [];
  for (let d = 0; d < 14; d++) {
    const day = new Date(now); day.setDate(now.getDate() + d);
    const dayStr = day.toISOString().slice(0,10);
    ["09:30","14:30","19:00"].forEach(t => {
      slots.push({ id: `${doctorId}-${dayStr}-${t}`, doctorId, date: dayStr, time: t });
    });
  }
  return slots;
};

function inferAgeGroup(dobISO) {
  if (!dobISO) return null;
  const dob = new Date(dobISO);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age < 18 ? "child" : "adult";
}

function assignDoctor({ dayPref, timePref, ageGroup }) {
  const preferWeekends = dayPref === "Weekends";
  const preferWeekdays = dayPref === "Weekdays";
  const preferMorning = timePref === "Morning";
  const preferEvening = timePref === "Evening";

  const pool = DOCTORS.filter(d => {
    const dayOk = preferWeekends ? d.weekend : preferWeekdays ? d.weekday : true;
    const timeOk = preferMorning ? d.morning : preferEvening ? d.evening : true;
    const ageOk = ageGroup === "child" ? d.acceptsChild : true;
    return dayOk && timeOk && ageOk;
  });

  return pool || DOCTORS;
}

export default function App() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: "",
    dob: "",
    ageGroup: null,
    gender: "",
    city: "",
    language: "English",
    issues: [],
    dayPref: "Flexible",
    timePref: "Flexible",
    doctor: null,
    package: "",
    slotId: "",
    bookingTempId: "",
    paymentStatus: "init",
    meetingLink: "",
  });

  const totalSteps = 12; // steps 0..11
  const progressPct = ((step) / (totalSteps - 1)) * 100;

  const slots = useMemo(() => form.doctor ? DUMMY_SLOTS(form.doctor.id) : [], [form.doctor]);

  const setField = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const next = () => setStep(s => Math.min(s + 1, totalSteps - 1));
  const back = () => setStep(s => Math.max(s - 1, 0));

  const handleDOB = (v) => {
    const group = inferAgeGroup(v);
    setForm(prev => ({ ...prev, dob: v, ageGroup: group }));
  };

  const toggleIssue = (issue) => {
    setForm(prev => {
      const exists = prev.issues.includes(issue);
      return { ...prev, issues: exists ? prev.issues.filter(i => i !== issue) : [...prev.issues, issue] };
    });
  };

  const handleAssignDoctor = () => {
    const chosenArr = assignDoctor({ dayPref: form.dayPref, timePref: form.timePref, ageGroup: form.ageGroup });
    // Pick the first doctor from the array
    setField("doctor", chosenArr[0]);
  };

  const createTempBooking = () => {
    if (!form.slotId) return;
    const id = `tmp_${Date.now()}`;
    setField("bookingTempId", id);
  };

  // Redirect to localhost:3000 after payment “success”
  const startPayment = async () => {
    setField("paymentStatus", "processing");
    setTimeout(() => {
      setField("paymentStatus", "success");
      const meeting = `https://meet.zoho.in/${form.doctor?.id}-${Math.random().toString(36).slice(2,8)}`;
      setField("meetingLink", meeting);
      window.location.href = "http://localhost:3000";
    }, 1200);
  };

  // Save draft and exit from package step onwards
  const finishLater = () => {
    try { localStorage.setItem("onboardingDraft", JSON.stringify(form)); } catch {}
    window.location.href = "http://localhost:3000";
  };

  const canNext = () => {
    switch (step) {
      case 0: return true;
      case 1: return form.name.trim().length > 1;
      case 2: return !!form.dob && !!form.ageGroup;
      case 3: return !!form.gender;
      case 4: return !!form.city;
      case 5: return !!form.language;
      case 6: return form.issues.length > 0;
      case 7: return !!form.dayPref;
      case 8: return !!form.timePref;
      case 9: return !!form.package;
      case 10: return !!form.slotId;
      default: return true;
    }
  };

  return (
    <div className="onboarding-container">
      <div className="onboarding-card">
        <div className="progress"><div style={{ width: `${progressPct}%` }} /></div>

        {step === 0 && (
          <>
            <div className="header">
              <div className="logo-dot" />
              <h2>Welcome to NUMA</h2>
            </div>
            <p className="hint">Let’s personalize the care journey. One quick step at a time.</p>
            <div className="nav">
              <button className="btn" onClick={next}>Get started</button>
              <button className="btn ghost" onClick={() => setStep(1)}>Skip intro</button>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h2>What’s the name?</h2>
            <p className="hint">This helps personalize communication.</p>
            <div className="input-box">
              <label>Full name</label>
              <input value={form.name} onChange={e => setField("name", e.target.value)} placeholder="John Doe" />
            </div>
            <div className="nav">
              <button className="btn secondary" onClick={back}>Back</button>
              <button className="btn" onClick={next} disabled={!canNext()}>Next</button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2>Date of birth</h2>
            <p className="hint">Age group will be inferred automatically.</p>
            <div className="input-box">
              <label>DOB</label>
              <input type="date" value={form.dob} onChange={e => handleDOB(e.target.value)} />
            </div>
            {form.ageGroup && <p className="small">Detected age group: <strong>{form.ageGroup}</strong></p>}
            <div className="nav">
              <button className="btn secondary" onClick={back}>Back</button>
              <button className="btn" onClick={next} disabled={!canNext()}>Next</button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2>Gender</h2>
            <p className="hint">Optional, used to improve care matching.</p>
            <div className="input-box">
              <select value={form.gender} onChange={e => setField("gender", e.target.value)}>
                <option value="">Select gender</option>
                <option>Female</option>
                <option>Male</option>
                <option>Non-binary</option>
                <option>Prefer not to say</option>
              </select>
            </div>
            <div className="nav">
              <button className="btn secondary" onClick={back}>Back</button>
              <button className="btn" onClick={next} disabled={!canNext()}>Next</button>
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h2>City / Location</h2>
            <p className="hint">Choose an Indian city or Outside India.</p>
            <div className="input-box">
              <select value={form.city} onChange={e => setField("city", e.target.value)}>
                <option value="">Select city</option>
                {INDIA_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="nav">
              <button className="btn secondary" onClick={back}>Back</button>
              <button className="btn" onClick={next} disabled={!canNext()}>Next</button>
            </div>
          </>
        )}

        {step === 5 && (
          <>
            <h2>Preferred language</h2>
            <p className="hint">Pick the language most comfortable for sessions.</p>
            <div className="input-box">
              <select value={form.language} onChange={e => setField("language", e.target.value)}>
                {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div className="nav">
              <button className="btn secondary" onClick={back}>Back</button>
              <button className="btn" onClick={next} disabled={!canNext()}>Next</button>
            </div>
          </>
        )}

        {step === 6 && (
          <>
            <h2>What brings you here?</h2>
            <p className="hint">Select one or more that best describe the concern.</p>
            <div className="pills">
              {ISSUES.map(tag => (
                <button
                  type="button"
                  key={tag}
                  className={`pill ${form.issues.includes(tag) ? "active" : ""}`}
                  onClick={() => toggleIssue(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
            <div className="nav">
              <button className="btn secondary" onClick={back}>Back</button>
              <button className="btn" onClick={() => { next(); handleAssignDoctor(); }} disabled={!canNext()}>
                Next
              </button>
            </div>
          </>
        )}

        {step === 7 && (
          <>
            <h2>Session days</h2>
            <p className="hint">When are sessions preferred?</p>
            <div className="pills">
              {["Weekdays","Weekends","Flexible"].map(v => (
                <button key={v} className={`pill ${form.dayPref===v ? "active":""}`} onClick={() => setField("dayPref", v)}>{v}</button>
              ))}
            </div>
            <div className="nav">
              <button className="btn secondary" onClick={back}>Back</button>
              <button className="btn" onClick={() => { next(); }}>
                Next
              </button>
            </div>
          </>
        )}

        {step === 8 && (
          <>
            <h2>Time of day</h2>
            <p className="hint">Choose a preferred time window.</p>
            <div className="pills">
              {["Morning","Evening","Flexible"].map(v => (
                <button key={v} className={`pill ${form.timePref===v ? "active":""}`} onClick={() => setField("timePref", v)}>{v}</button>
              ))}
            </div>
            <div className="nav">
              <button className="btn secondary" onClick={back}>Back</button>
              <button className="btn" onClick={() => { handleAssignDoctor(); next(); }}>
                Next
              </button>
            </div>
          </>
        )}

        {step === 9 && (
          <>
            <h2>Assigned clinician</h2>
            <p className="hint">Matched by preference and age group.</p>
            {form.doctor && (
              <div className="doctor-card">
                <div className="doctor-avatar">{form.doctor.name.split(" ").map(w=>w[0]).join("")}</div>
                <div>
                  <div><strong>{form.doctor.name}</strong> • {form.doctor.role}</div>
                  <div className="small">{form.doctor.bio}</div>
                </div>
              </div>
            )}
            <div className="card-section">
              <label>Package</label>
              <div className="pills">
                <button className={`pill ${form.package==='psychiatrist_50_2500'?'active':''}`} onClick={()=>setField("package","psychiatrist_50_2500")}>Psychiatrist · 50 mins · ₹2500</button>
                <button className={`pill ${form.package==='psychiatrist_75_3600'?'active':''}`} onClick={()=>setField("package","psychiatrist_75_3600")}>Psychiatrist · 75 mins · ₹3600</button>
                <button className={`pill ${form.package==='psychologist_50'?'active':''}`} onClick={()=>setField("package","psychologist_50")}>Psychologist · 50 mins</button>
                <button className={`pill ${form.package==='psychologist_75'?'active':''}`} onClick={()=>setField("package","psychologist_75")}>Psychologist · 75 mins</button>
              </div>
            </div>
            <div className="nav">
              <button className="btn secondary" onClick={back}>Back</button>
              <button className="btn" onClick={next} disabled={!form.package}>Next</button>
              <button
                className="btn ghost"
                style={{ marginLeft: "auto", fontSize: "0.85rem" }}
                onClick={finishLater}
              >
                Finish later
              </button>
            </div>
          </>
        )}

        {step === 10 && (
          <>
            <h2>First session slot</h2>
            <p className="hint">Choose a slot in the next 2 weeks.</p>
            <div className="input-box">
              <label>Available slots</label>
              <select value={form.slotId} onChange={e => setField("slotId", e.target.value)}>
                <option value="">Select a slot</option>
                {slots.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.date} · {s.time}
                  </option>
                ))}
              </select>
            </div>
            <div className="nav">
              <button className="btn secondary" onClick={back}>Back</button>
              <button className="btn" onClick={() => { createTempBooking(); startPayment(); }}>
                Continue to payment
              </button>
              <button
                className="btn ghost"
                style={{ marginLeft: "auto", fontSize: "0.85rem" }}
                onClick={finishLater}
              >
                Finish later
              </button>
            </div>
            {form.paymentStatus === "processing" && <p className="small">Redirecting to payment…</p>}
          </>
        )}

        {step === 11 && (
          <>
            <h2>Booking confirmed</h2>
            <p className="hint">Payment successful. Session scheduled.</p>
            <div className="card-section">
              <div className="small">Doctor: <strong>{form.doctor?.name}</strong></div>
              <div className="small">Package: <strong>{form.package}</strong></div>
              <div className="small">Slot: <strong>{form.slotId}</strong></div>
              <div className="small">Meeting: <a href={form.meetingLink} target="_blank" rel="noreferrer">{form.meetingLink}</a></div>
            </div>
            <div className="nav">
              <button className="btn" onClick={() => window.location.href = "http://localhost:3000"}>
                Go to dashboard
              </button>
              <button
                className="btn ghost"
                style={{ marginLeft: "auto", fontSize: "0.85rem" }}
                onClick={() => window.location.href = "http://localhost:3000"}
              >
                Finish later
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
