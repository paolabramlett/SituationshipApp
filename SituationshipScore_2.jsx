import { useState, useCallback } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────
const WEIGHTS = {
  safety: 2.0, clarity: 1.6, plans: 1.4, consistency: 1.4,
  expectations: 1.2, respect: 1.2, initiation: 1.0,
};

const SLIDER_META = [
  { key: "consistency", label: "Consistency", lo: "Ghost mode", hi: "Always here" },
  { key: "initiation", label: "Initiation Balance", lo: "Only you", hi: "Equal effort" },
  { key: "plans", label: "Actual Plans", lo: "All talk", hi: "Happens weekly" },
  { key: "clarity", label: "Where You Stand", lo: "Total mystery", hi: "Crystal clear" },
  { key: "safety", label: "Emotional Safety", lo: "Walking on glass", hi: "Completely safe" },
  { key: "expectations", label: "Aligned Goals", lo: "Different worlds", hi: "Same page" },
  { key: "respect", label: "Respect", lo: "Dismissive", hi: "Deeply respectful" },
]; 

const INSIGHT_LIBRARY = {
  lowConsistency: ["If it's hot/cold, it's not love. It's availability.", "Confusion is the product."],
  lowInitiation: ["You're the engine. They're the passenger.", "If you stop texting, does it die? Exactly."],
  lowPlans: ["If it never makes it to the calendar, it's not real.", "They're not busy. They're not prioritizing."],
  lowClarity: ["Vague is a decision.", "If they wanted to be clear, they would."],
  lowSafety: ["Your nervous system is not being dramatic. It's reporting.", "Love shouldn't feel like a threat."],
  lowExpectations: ["You're dating a fantasy, not a person.", "Different goals = different relationship."],
  lowRespect: ["How they act when it's hard is the truth.", "Disappearing is an answer."],
  overrideNotSafe: ["The cost is your peace. That's too expensive."],
  overrideMismatch: ["Stop trying to win someone into wanting the same thing."],
  overridePenPal: ["Texting isn't intimacy. It's entertainment."],
  overrideChasing: ["If you have to chase, they already chose."],
};

const SCRIPTS = {
  notSafe: "Hey — I'm stepping back. This dynamic doesn't feel respectful or emotionally safe for me. Take care.",
  mismatch: "I like you, but I'm not looking for something vague. What are you actually looking for right now?",
  penPal: "I'm down to talk, but I prefer in-person. Want to pick a day this week? If not, all good.",
  chasing: "I'm going to match your pace. If you want to see me, take the lead.",
  low: "I'm enjoying this, but I don't do mixed signals. Are you interested in building something real or not?",
  mid: "Feels good so far. I want clarity — let's plan something this week and keep it consistent.",
  high: "I like how this is going — it feels mutual and clear. Let's keep building it without rushing.",
};

// ─── Logic ───────────────────────────────────────────────────────────────────
function computeResult(vals, earlyStage) {
  const total = Object.values(WEIGHTS).reduce((a, b) => a + b, 0);
  let weighted = 0;
  for (const [k, w] of Object.entries(WEIGHTS)) weighted += (vals[k] * 10) * w;
  let score = Math.round(weighted / total);
  if (earlyStage && score > 85) score = 85;

  // Override
  let override = null;
  if (vals.respect <= 3) override = "notSafe";
  else if (vals.expectations <= 3 && vals.safety <= 4) override = "mismatch";
  else if (vals.plans <= 2 && vals.clarity >= 6) override = "penPal";
  else if (vals.consistency <= 3 && vals.initiation <= 3) override = "chasing";

  // Base label
  let label, subtitle;
  if (score <= 19) { label = "Breadcrumbed"; subtitle = "They're keeping you just close enough to stay."; }
  else if (score <= 34) { label = "Hot & Cold"; subtitle = "One good week, one disappearing act."; }
  else if (score <= 49) { label = "Ambiguous"; subtitle = "The vibe is there. The follow-through isn't."; }
  else if (score <= 64) { label = "Potential, But Unclear"; subtitle = "Something's here. You just don't know what yet."; }
  else if (score <= 79) { label = "Stable-ish"; subtitle = "Mostly good. A few things to name."; }
  else { label = "Aligned"; subtitle = "This one actually makes sense."; }

  // Softening
  if (earlyStage) {
    if (label === "Breadcrumbed") { label = "Early Breadcrumb Energy"; subtitle = "Too soon to tell — but pay attention."; }
    if (label === "Hot & Cold") { label = "Mixed Signals (Early)"; subtitle = "Normal to be figuring things out — don't ignore your gut."; }
  }

  // Override label
  if (override === "notSafe") { label = "Not Safe"; subtitle = "Your peace is non-negotiable."; }
  else if (override === "mismatch") { label = "Mismatch"; subtitle = "You want different things. That matters."; }
  else if (override === "penPal") { label = "Pen Pal"; subtitle = "Great conversation. Zero real-world presence."; }
  else if (override === "chasing") { label = "Chasing"; subtitle = "Stop running. See if they follow."; }

  // Signal breakdown
  const signalKeys = Object.keys(WEIGHTS);
  const signals = signalKeys.map(k => ({ key: k, val: vals[k], pct: vals[k] * 10 }));
  signals.sort((a, b) => a.val - b.val);

  // Insights
  const keyToInsightKey = {
    consistency: "lowConsistency", initiation: "lowInitiation", plans: "lowPlans",
    clarity: "lowClarity", safety: "lowSafety", expectations: "lowExpectations", respect: "lowRespect",
  };
  const getInsight = (ik) => {
    const arr = INSIGHT_LIBRARY[ik];
    return arr[Math.floor(Math.random() * arr.length)];
  };
  const insights = [
    getInsight(keyToInsightKey[signals[0].key]),
    getInsight(keyToInsightKey[signals[1].key]),
  ];
  if (override) {
    const oKey = { notSafe: "overrideNotSafe", mismatch: "overrideMismatch", penPal: "overridePenPal", chasing: "overrideChasing" }[override];
    insights.push(getInsight(oKey));
  } else {
    insights.push(getInsight(keyToInsightKey[signals[2].key]));
  }

  // Script
  let scriptKey = "low";
  if (override === "notSafe") scriptKey = "notSafe";
  else if (override === "mismatch") scriptKey = "mismatch";
  else if (override === "penPal") scriptKey = "penPal";
  else if (override === "chasing") scriptKey = "chasing";
  else if (score >= 80) scriptKey = "high";
  else if (score >= 50) scriptKey = "mid";

  return { score, label, subtitle, signals, insights, override, scriptKey };
}

// ─── Components ──────────────────────────────────────────────────────────────
const cx = (...classes) => classes.filter(Boolean).join(" ");

function SliderInput({ meta, value, onChange }) {
  const pct = (value / 10) * 100;
  const hue = Math.round(pct * 1.2); // 0=red 120=green
  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-1">
        <label className="text-sm font-bold uppercase tracking-widest text-neutral-300">{meta.label}</label>
        <span className="text-lg font-black tabular-nums" style={{ color: `hsl(${hue},80%,60%)` }}>{value}</span>
      </div>
      <input
        type="range" min={0} max={10} value={value}
        onChange={e => onChange(Number(e.target.value))}
        aria-label={meta.label}
        className="w-full h-2 rounded-full appearance-none cursor-pointer outline-none focus:ring-2 focus:ring-pink-400"
        style={{
          background: `linear-gradient(to right, hsl(${hue},80%,55%) ${pct}%, #333 ${pct}%)`,
        }}
      />
      <div className="flex justify-between mt-1">
        <span className="text-xs text-neutral-500">{meta.lo}</span>
        <span className="text-xs text-neutral-500">{meta.hi}</span>
      </div>
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button
      role="switch" aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cx(
        "relative inline-flex w-14 h-7 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-pink-400",
        checked ? "bg-pink-500" : "bg-neutral-700"
      )}
    >
      <span className={cx(
        "absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200",
        checked ? "translate-x-7" : "translate-x-0"
      )} />
    </button>
  );
}

function ProgressBarRow({ label, value }) {
  const pct = value * 10;
  const hue = Math.round(pct * 1.2);
  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs uppercase tracking-widest text-neutral-400">{label}</span>
        <span className="text-xs font-bold" style={{ color: `hsl(${hue},70%,60%)` }}>{value}/10</span>
      </div>
      <div className="h-2 rounded-full bg-neutral-800 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: `hsl(${hue},70%,50%)` }} />
      </div>
    </div>
  );
}

function InsightCard({ text, index }) {
  const accents = ["border-pink-500", "border-amber-400", "border-cyan-400"];
  return (
    <div className={cx("border-l-4 pl-4 py-2 mb-3", accents[index % 3])}>
      <p className="text-sm leading-relaxed text-neutral-200 italic">"{text}"</p>
    </div>
  );
}

function ScriptBox({ script }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(script).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <div className="relative bg-neutral-800 border border-neutral-700 rounded-xl p-4 mt-2">
      <p className="text-sm leading-relaxed text-neutral-200 pr-16">"{script}"</p>
      <button
        onClick={copy}
        className="absolute top-3 right-3 text-xs font-bold px-3 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-500 transition-colors focus:outline-none focus:ring-2 focus:ring-pink-400"
      >
        {copied ? "✓ Copied" : "Copy"}
      </button>
    </div>
  );
}

// ─── Score color ─────────────────────────────────────────────────────────────
function scoreColor(s) {
  if (s <= 34) return "#f87171";
  if (s <= 49) return "#fb923c";
  if (s <= 64) return "#facc15";
  if (s <= 79) return "#a3e635";
  return "#34d399";
}

// ─── Screens ─────────────────────────────────────────────────────────────────
function IntroScreen({ onStart }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <div className="mb-6 text-7xl">💀</div>
      <h1 className="text-4xl font-black tracking-tight text-white mb-3" style={{ fontFamily: "'Bebas Neue', 'Impact', sans-serif", letterSpacing: "0.05em" }}>
        SITUATIONSHIP<br />CLARITY SCORE
      </h1>
      <p className="text-neutral-300 text-base max-w-sm mb-4 leading-relaxed">
        7 questions. One brutally honest number. Find out where you actually stand.
      </p>
      <p className="text-xs uppercase tracking-widest text-neutral-500 mb-10 border border-neutral-700 px-4 py-2 rounded-full">
        Not therapy. Just math.
      </p>
      <button
        onClick={onStart}
        className="bg-pink-600 hover:bg-pink-500 active:scale-95 text-white font-black text-lg px-10 py-4 rounded-2xl transition-all focus:outline-none focus:ring-2 focus:ring-pink-400 shadow-lg shadow-pink-900/40"
      >
        Get My Score →
      </button>
    </div>
  );
}

function InputScreen({ values, earlyStage, onChange, onToggle, onSubmit }) {
  return (
    <div className="min-h-screen px-6 py-10 max-w-lg mx-auto">
      <h2 className="text-2xl font-black text-white mb-1" style={{ fontFamily: "'Bebas Neue', 'Impact', sans-serif" }}>RATE YOUR SITUATION</h2>
      <p className="text-xs text-neutral-500 uppercase tracking-widest mb-8">Be honest. No one's watching.</p>

      {SLIDER_META.map(meta => (
        <SliderInput key={meta.key} meta={meta} value={values[meta.key]} onChange={v => onChange(meta.key, v)} />
      ))}

      <div className="flex items-center justify-between bg-neutral-800 rounded-xl px-5 py-4 mb-8 mt-2">
        <div>
          <p className="text-sm font-bold text-white">Been together less than 3 weeks?</p>
          <p className="text-xs text-neutral-500 mt-0.5">Adjusts scoring for early stage</p>
        </div>
        <Toggle checked={earlyStage} onChange={onToggle} />
      </div>

      <button
        onClick={onSubmit}
        className="w-full bg-pink-600 hover:bg-pink-500 active:scale-95 text-white font-black text-lg py-4 rounded-2xl transition-all focus:outline-none focus:ring-2 focus:ring-pink-400 shadow-lg shadow-pink-900/40"
      >
        Calculate My Score →
      </button>
    </div>
  );
}

function ResultScreen({ result, values, onEdit }) {
  const { score, label, subtitle, signals, insights, scriptKey } = result;
  const col = scoreColor(score);
  const script = SCRIPTS[scriptKey];
  const ctaLabels = {
    notSafe: "Your move: Exit & protect yourself",
    mismatch: "Your move: Define expectations — once",
    penPal: "Your move: Convert to real plans",
    chasing: "Your move: Stop initiating for 7 days",
    low: "Your move: Ask the direct question",
    mid: "Your move: Clarify & plan something",
    high: "Your move: Confirm what's working",
  };

  return (
    <div className="min-h-screen px-6 py-10 max-w-lg mx-auto">
      {/* Score circle */}
      <div className="flex flex-col items-center mb-8">
        <div className="relative flex items-center justify-center w-36 h-36 rounded-full border-8 mb-4"
          style={{ borderColor: col }}>
          <span className="text-5xl font-black tabular-nums" style={{ color: col }}>{score}</span>
        </div>
        <h2 className="text-3xl font-black text-white text-center" style={{ fontFamily: "'Bebas Neue', 'Impact', sans-serif" }}>{label}</h2>
        <p className="text-neutral-400 text-sm text-center mt-1">{subtitle}</p>
      </div>

      {/* Signals */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 mb-6">
        <h3 className="text-xs uppercase tracking-widest text-neutral-500 mb-4">Signal Breakdown</h3>
        {signals.map(s => (
          <ProgressBarRow key={s.key} label={s.key} value={s.val} />
        ))}
      </div>

      {/* Insights */}
      <div className="mb-6">
        <h3 className="text-xs uppercase tracking-widest text-neutral-500 mb-3">What the data says</h3>
        {insights.map((ins, i) => <InsightCard key={i} text={ins} index={i} />)}
      </div>

      {/* CTA + Script */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 mb-6">
        <h3 className="text-xs uppercase tracking-widest text-neutral-500 mb-1">{ctaLabels[scriptKey]}</h3>
        <p className="text-xs text-neutral-600 mb-2">Use this if you need to say something:</p>
        <ScriptBox script={script} />
      </div> 

      <button
        onClick={onEdit}
        className="w-full border border-neutral-700 text-neutral-400 hover:text-white hover:border-neutral-500 font-bold py-3 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-500"
      >
        ← Edit answers
      </button>
    </div>
  );
}

// ─── App ─────────────────────────────────────────────────────────────────────
const DEFAULT_VALUES = { consistency: 5, initiation: 5, plans: 5, clarity: 5, safety: 5, expectations: 5, respect: 5 };

export default function App() {
  const [screen, setScreen] = useState("intro"); // intro | inputs | results
  const [values, setValues] = useState(DEFAULT_VALUES);
  const [earlyStage, setEarlyStage] = useState(false);
  const [result, setResult] = useState(null);

  const handleChange = useCallback((key, val) => setValues(v => ({ ...v, [key]: val })), []);

  const handleSubmit = () => {
    setResult(computeResult(values, earlyStage));
    setScreen("results");
  };

  return (
    <div className="bg-neutral-950 text-white min-h-screen"
      style={{ fontFamily: "'DM Mono', 'Courier New', monospace" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@400;500&display=swap');
        input[type=range]::-webkit-slider-thumb { -webkit-appearance:none; width:20px; height:20px; border-radius:50%; background:white; cursor:pointer; box-shadow:0 0 6px rgba(0,0,0,0.5); }
        input[type=range]::-moz-range-thumb { width:20px; height:20px; border-radius:50%; background:white; cursor:pointer; border:none; box-shadow:0 0 6px rgba(0,0,0,0.5); }
        * { -webkit-tap-highlight-color: transparent; }
      `}</style>

      {screen === "intro" && <IntroScreen onStart={() => setScreen("inputs")} />}
      {screen === "inputs" && (
        <InputScreen values={values} earlyStage={earlyStage}
          onChange={handleChange} onToggle={setEarlyStage} onSubmit={handleSubmit} />
      )}
      {screen === "results" && result && (
        <ResultScreen result={result} values={values} onEdit={() => setScreen("inputs")} />
      )}
    </div>
  );
}
