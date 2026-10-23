import axios from "axios";
import { Fragment, useEffect, useState } from "react";
import "./App.css";

// FIX: Keep Field outside App so inputs don't remount on every keystroke.
const Field = ({ label, children, hint }) => (
  <div className="field">
    <label>{label}</label>
    {children}
    {hint && <small>{hint}</small>}
  </div>
);

/* ---------- Speedometer helpers ---------- */
const MIN_SCORE = 1;
const MAX_SCORE = 10;

const polar = (cx, cy, r, angleDeg) => {
  const a = (angleDeg * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy - r * Math.sin(a)];
};

const scoreToAngle = (score) =>
  180 - ((score - MIN_SCORE) / (MAX_SCORE - MIN_SCORE)) * 180;

const arcPath = (cx, cy, r, s1, s2) => {
  const [x1, y1] = polar(cx, cy, r, scoreToAngle(s1));
  const [x2, y2] = polar(cx, cy, r, scoreToAngle(s2));
  return `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`;
};

const BANDS = [
  { from: 1, to: 2.8, color: "#ef4444" },
  { from: 2.8, to: 4.6, color: "#f97316" },
  { from: 4.6, to: 6.4, color: "#facc15" },
  { from: 6.4, to: 8.2, color: "#84cc16" },
  { from: 8.2, to: 10, color: "#22c55e" },
];

const getVerdict = (score) => {
  if (score < 4) return { text: "Poor", color: "#ef4444" };
  if (score < 6) return { text: "Fair", color: "#f97316" };
  if (score < 8) return { text: "Good", color: "#84cc16" };
  return { text: "Excellent", color: "#22c55e" };
};

const Speedometer = ({ score }) => {
  const [needleScore, setNeedleScore] = useState(MIN_SCORE);

  // Animate needle from the start to the actual score.
  useEffect(() => {
    const t = setTimeout(() => setNeedleScore(score), 100);
    return () => clearTimeout(t);
  }, [score]);

  const verdict = getVerdict(score);
  const rotation = 90 - scoreToAngle(needleScore); // needle drawn pointing up

  return (
    <div style={{ width: "100%", textAlign: "center", padding: "8px 0" }}>
      <svg
        viewBox="0 0 200 125"
        style={{ width: "100%", maxWidth: 360, height: "auto" }}
      >
        {/* Track */}
        <path
          d={arcPath(100, 100, 80, 1, 10)}
          fill="none"
          stroke="rgba(128,128,128,0.2)"
          strokeWidth="18"
          strokeLinecap="round"
        />
        {/* Colour bands */}
        {BANDS.map((b) => (
          <path
            key={b.from}
            d={arcPath(100, 100, 80, b.from, b.to)}
            fill="none"
            stroke={b.color}
            strokeWidth="14"
          />
        ))}

        {/* Tick labels */}
        {[1, 5, 10].map((n) => {
          const [x, y] = polar(100, 100, 97, scoreToAngle(n));
          return (
            <text
              key={n}
              x={x}
              y={y + 3}
              fontSize="8"
              textAnchor="middle"
              fill="currentColor"
              opacity="0.7"
            >
              {n}
            </text>
          );
        })}

        {/* Needle */}
        <g
          style={{
            transformOrigin: "100px 100px",
            transform: `rotate(${rotation}deg)`,
            transition: "transform 1.2s cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          <polygon points="97,100 103,100 100,28" fill="currentColor" />
        </g>
        <circle cx="100" cy="100" r="7" fill="currentColor" />
        <circle cx="100" cy="100" r="3" fill="#fff" />
      </svg>

      <div style={{ fontSize: 40, fontWeight: 700, lineHeight: 1 }}>
        {score.toFixed(1)}
        <span style={{ fontSize: 18, opacity: 0.6 }}> / 10</span>
      </div>
      <div
        style={{
          marginTop: 6,
          fontSize: 18,
          fontWeight: 600,
          color: verdict.color,
        }}
      >
        {verdict.text}
      </div>

      <p style={{ marginTop: 10, fontSize: 14, opacity: 0.8 }}>
        <strong>10</strong> = Good mental well-being &nbsp;•&nbsp;{" "}
        <strong>1</strong> = Bad mental well-being
      </p>
    </div>
  );
};

function App() {
  const platforms = [
    "Facebook",
    "LinkedIn",
    "Instagram",
    "Snapchat",
    "Twitter",
    "YouTube",
    "TikTok",
    "LINE",
    "KakaoTalk",
    "VKontakte",
    "WhatsApp",
    "WeChat",
  ];

  const [data, setData] = useState({
    age: "",
    gender: "",
    country: "",
    academic_level: "",
    most_used_platform: "",
    purpose_of_use: "",
    avg_daily_usage_hours: "",
    daily_unlocks: "",
    study_hours: "",
    physical_activity_hours: "",
    sleep_hours_per_night: "",
    stress_level: "",
  });

  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState(null); // prediction score (1-10)

  // Update only the changed field without losing other values.
  const handleChange = (e) => {
    const { name, value } = e.target;

    setData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    setLoading(true);

    try {
      const payload = {
        ...data,
        age: Number(data.age),
        avg_daily_usage_hours: Number(data.avg_daily_usage_hours),
        daily_unlocks: Number(data.daily_unlocks),
        study_hours: Number(data.study_hours),
        physical_activity_hours: Number(data.physical_activity_hours),
        sleep_hours_per_night: Number(data.sleep_hours_per_night),
      };

      const response = await axios.post(
        "http://127.0.0.1:8000/predict",
        payload,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Prediction:", response.data);

      const value = Number(response.data.prediction);
      if (Number.isNaN(value)) {
        alert(`Prediction: ${response.data.prediction}`);
      } else {
        // Clamp to the 1-10 range for the gauge.
        setScore(Math.min(MAX_SCORE, Math.max(MIN_SCORE, value)));
      }
    } catch (error) {
      console.error(
        "API Error:",
        error.response?.data || error.message
      );

      const detail = error.response?.data?.detail;
      const message = Array.isArray(detail)
        ? detail.map((item) => item.msg).join("\n")
        : typeof detail === "string"
          ? detail
          : error.message;

      alert(`Prediction failed: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  // Go back to the form so the user can edit values and predict again.
  const handleRecalculate = () => {
    setScore(null);
  };

  return (
    <Fragment>
      <main className="page">
        <header className="hero">
          <div className="brain-icon">✺</div>
          <h1>
            Mental Stress <span>Prediction</span>
          </h1>
          <p>
            Your well-being matters. Fill in the details below
            to get a personalized mental stress prediction.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="form-card">
          <section className="section">
            <div className="section-heading">
              <div className="section-icon">♙</div>
              <div>
                <h2>Personal Information</h2>
                <p>Tell us a little about yourself</p>
              </div>
            </div>

            <div className="grid two-columns">
              <Field label="Age" hint="Must be between 15 and 100">
                <input
                  type="number"
                  name="age"
                  value={data.age}
                  onChange={handleChange}
                  placeholder="Enter your age"
                  min="15"
                  max="100"
                  required
                />
              </Field>

              <Field label="Gender">
                <select
                  name="gender"
                  value={data.gender}
                  onChange={handleChange}
                  required
                >
                  <option value="" disabled>Select your gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </Field>

              <Field label="Country" hint="Must be 2–100 characters">
                <input
                  type="text"
                  name="country"
                  value={data.country}
                  onChange={handleChange}
                  placeholder="Enter your country"
                  minLength={2}
                  maxLength={100}
                  required
                />
              </Field>

              <Field label="Academic Level">
                <select
                  name="academic_level"
                  value={data.academic_level}
                  onChange={handleChange}
                  required
                >
                  <option value="" disabled>
                    Select your academic level
                  </option>
                  <option value="High School">High School</option>
                  <option value="Undergraduate">Undergraduate</option>
                  <option value="Graduate">Graduate</option>
                </select>
              </Field>

              <Field label="Most Used Platform">
                <select
                  name="most_used_platform"
                  value={data.most_used_platform}
                  onChange={handleChange}
                  required
                >
                  <option value="" disabled>Select a platform</option>
                  {platforms.map((platform) => (
                    <option key={platform} value={platform}>
                      {platform}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Purpose of Use">
                <select
                  name="purpose_of_use"
                  value={data.purpose_of_use}
                  onChange={handleChange}
                  required
                >
                  <option value="" disabled>Select purpose of use</option>
                  <option value="Education">Education</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Work">Work</option>
                  <option value="Communication">Communication</option>
                  <option value="Other">Other</option>
                </select>
              </Field>
            </div>
          </section>

          <section className="section lifestyle">
            <div className="section-heading">
              <div className="section-icon">◷</div>
              <div>
                <h2>Usage &amp; Lifestyle</h2>
                <p>Tell us about your daily habits</p>
              </div>
            </div>

            <div className="grid three-columns">
              <Field
                label="Avg. Daily Usage Hours"
                hint="Between 0 and 24 hours"
              >
                <input
                  type="number"
                  name="avg_daily_usage_hours"
                  value={data.avg_daily_usage_hours}
                  onChange={handleChange}
                  min="0"
                  max="24"
                  step="0.1"
                  placeholder="Enter hours"
                  required
                />
              </Field>

              <Field label="Daily Unlocks" hint="Between 0 and 1000">
                <input
                  type="number"
                  name="daily_unlocks"
                  value={data.daily_unlocks}
                  onChange={handleChange}
                  min="0"
                  max="1000"
                  step="1"
                  placeholder="Enter number"
                  required
                />
              </Field>

              <Field label="Study Hours" hint="Between 0 and 24 hours">
                <input
                  type="number"
                  name="study_hours"
                  value={data.study_hours}
                  onChange={handleChange}
                  min="0"
                  max="24"
                  step="0.1"
                  placeholder="Enter hours"
                  required
                />
              </Field>

              <Field
                label="Physical Activity Hours"
                hint="Between 0 and 24 hours"
              >
                <input
                  type="number"
                  name="physical_activity_hours"
                  value={data.physical_activity_hours}
                  onChange={handleChange}
                  min="0"
                  max="24"
                  step="0.1"
                  placeholder="Enter hours"
                  required
                />
              </Field>

              <Field
                label="Sleep Hours Per Night"
                hint="Between 0 and 24 hours"
              >
                <input
                  type="number"
                  name="sleep_hours_per_night"
                  value={data.sleep_hours_per_night}
                  onChange={handleChange}
                  min="0"
                  max="24"
                  step="0.1"
                  placeholder="Enter hours"
                  required
                />
              </Field>
            </div>
          </section>

          <section className="section stress-section">
            <div className="section-heading">
              <div className="section-icon">♡</div>
              <div>
                <h2>Stress Level</h2>
                <p>How would you describe your current stress level?</p>
              </div>
            </div>

            <Field label="Current Stress Level">
              <select
                name="stress_level"
                value={data.stress_level}
                onChange={handleChange}
                required
              >
                <option value="" disabled>Select stress level</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </Field>
          </section>

          {score === null ? (
            <button
              className="predict-button"
              type="submit"
              disabled={loading}
            >
              <span>✧</span>{" "}
              {loading ? "Predicting..." : "Predict Mental Stress"}{" "}
              <span>→</span>
            </button>
          ) : (
            <Fragment>
              <Speedometer score={score} />

              <button
                className="predict-button"
                type="button"
                onClick={handleRecalculate}
              >
                <span>↻</span> Re-calculate your mental score
              </button>
            </Fragment>
          )}

          <p className="footer-note">
            Your well-being matters. Your information deserves care.
          </p>
        </form>
      </main>
    </Fragment>
  );
}

export default App;