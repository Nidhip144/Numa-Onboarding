// src/App.js
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./App.css";

function App() {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    preference: "",
  });

  const steps = [
    {
      question: "Welcome to NUMA 🌿",
      input: (
        <p className="welcome-text">
          Let’s personalize your care journey. Click next to continue.
        </p>
      ),
    },
    {
      question: "What’s your name?",
      input: (
        <input
          type="text"
          placeholder="Enter your name"
          value={formData.name}
          onChange={(e) =>
            setFormData({ ...formData, name: e.target.value })
          }
        />
      ),
    },
    {
      question: "How old are you?",
      input: (
        <input
          type="number"
          placeholder="Enter your age"
          value={formData.age}
          onChange={(e) =>
            setFormData({ ...formData, age: e.target.value })
          }
        />
      ),
    },
    {
      question: "What type of care do you prefer?",
      input: (
        <select
          value={formData.preference}
          onChange={(e) =>
            setFormData({ ...formData, preference: e.target.value })
          }
        >
          <option value="">Select one</option>
          <option value="therapy">Therapy</option>
          <option value="nutrition">Nutrition</option>
          <option value="holistic">Holistic Wellness</option>
        </select>
      ),
    },
  ];

  const handleNext = () => {
    if (step < steps.length) {
      setStep(step + 1);
    }
  };

  return (
    <div className="onboarding-container">
      <AnimatePresence mode="wait">
        {step < steps.length ? (
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6 }}
            className="onboarding-card"
          >
            <h2>{steps[step].question}</h2>
            <div className="input-box">{steps[step].input}</div>
            <button onClick={handleNext} className="next-btn">
              {step === steps.length - 1 ? "Finish" : "Next"}
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="done"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="onboarding-card"
          >
            <h2>Thank you, {formData.name || "Friend"} 🎉</h2>
            <p>Your preferences have been saved.</p>
            <button
              onClick={() =>
                (window.location.href = "http://localhost:3000?onboarded=true")
              }
              className="next-btn"
            >
              Go to Dashboard
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
