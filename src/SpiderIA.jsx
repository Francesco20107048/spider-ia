import { useState, useEffect, useRef, useCallback } from "react";

/* ── LOGICA SPIDER IA ───────────────────────────────────────────────────── */
const REGOLE = [
  { keyword: "ciao",        risposte: ["Ciao! Sono Spider IA 🕷️", "Hey! Come posso aiutarti?", "Salve! Sono qui."] },
  { keyword: "come stai",   risposte: ["Sto benissimo, grazie!", "Tutti i fili della ragnatela sono a posto!", "Ottimamente! E tu?"] },
  { keyword: "chi sei",     risposte: ["Sono Spider IA, un chatbot in C puro.", "Spider IA — intelligenza tessuta in C.", "Mi chiamo Spider IA, vivo nella ragnatela."] },
  { keyword: "cosa sai",    risposte: ["So rispondere e chiacchierare!", "Conosco un po' di tutto. Provami!", "Chiedimi qualcosa!"] },
  { keyword: "programm",    risposte: ["Il C è il re della programmazione!", "Adoro il C: veloce e potente.", "Con il C controlli tutto."] },
  { keyword: "aiuto",       risposte: ["Sono qui per aiutarti!", "Di cosa hai bisogno?", "Dimmi pure!"] },
  { keyword: "grazie",      risposte: ["Prego! 🕸️", "Figurati!", "Con piacere!"] },
  { keyword: "barzelletta", risposte: ["Un puntatore entra in un bar... e crasha tutto.", "Perché i programmatori C non escono? Segmentation fault!", "Il debugging: sei il detective e il colpevole."] },
  { keyword: "nome",        risposte: ["Sono Spider IA!", "Mi chiamo Spider IA.", "Spider IA, per servirti."] },
  { keyword: "addio",       risposte: ["A presto! 🕷️", "Arrivederci!", "Torna quando vuoi!"] },
  { keyword: "ciao ciao",   risposte: ["Ci vediamo!", "A presto!", "Buona giornata!"] },
];
const FALLBACK = ["Non ho capito... riprova!", "Interessante! Dimmi di più.", "Puoi riformulare?"];

function cercaRisposta(input) {
  const lower = input.toLowerCase().trim();
  for (const r of REGOLE) {
    if (lower.includes(r.keyword)) return r.risposte[Math.floor(Math.random() * 3)];
  }
  return FALLBACK[Math.floor(Math.random() * 3)];
}

/* ── GEOMETRIA RAGNATELA ────────────────────────────────────────────────── */
const CX = 340, CY = 270;
const RINGS = 4;
const SPOKES = 8;
const RING_GAP = 62;

function spokeAngle(i) { return (i / SPOKES) * Math.PI * 2 - Math.PI / 2; }
function nodePos(ring, spoke) {
  const r = ring * RING_GAP;
  const a = spokeAngle(spoke);
  return { x: CX + r * Math.cos(a), y: CY + r * Math.sin(a) };
}

function buildNodes() {
  const nodes = [{ id: "c", x: CX, y: CY, ring: 0, spoke: 0 }];
  for (let ring = 1; ring <= RINGS; ring++)
    for (let spoke = 0; spoke < SPOKES; spoke++) {
      const { x, y } = nodePos(ring, spoke);
      nodes.push({ id: `${ring}-${spoke}`, x, y, ring, spoke });
    }
  return nodes;
}

function buildSpokes() {
  const lines = [];
  for (let spoke = 0; spoke < SPOKES; spoke++) {
    const outer = nodePos(RINGS, spoke);
    lines.push({ x1: CX, y1: CY, x2: outer.x, y2: outer.y });
  }
  return lines;
}

function buildRingLines() {
  const lines = [];
  for (let ring = 1; ring <= RINGS; ring++)
    for (let spoke = 0; spoke < SPOKES; spoke++) {
      const a = nodePos(ring, spoke);
      const b = nodePos(ring, (spoke + 1) % SPOKES);
      lines.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y });
    }
  return lines;
}

const NODES       = buildNodes();
const SPOKE_LINES = buildSpokes();
const RING_LINES  = buildRingLines();
const POOL        = NODES.filter(n => n.ring > 0).map(n => n.id);

function pickNode(usedIds) {
  const free = POOL.filter(id => !usedIds.includes(id));
  const src  = free.length > 0 ? free : POOL;
  return src[Math.floor(Math.random() * src.length)];
}

/* ── COMPONENTE ─────────────────────────────────────────────────────────── */
export default function SpiderIA() {
  const [input, setInput]       = useState("");
  const [bubbles, setBubbles]   = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [activeNode, setActive] = useState(null);
  const [vibrate, setVibrate]   = useState(false);
  const inputRef                = useRef(null);
  const usedRef                 = useRef([]);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const triggerVibrate = useCallback(() => {
    setVibrate(true);
    setTimeout(() => setVibrate(false), 700);
  }, []);

  const send = useCallback(() => {
    const text = input.trim();
    if (!text || isTyping) return;
    setInput("");
    setIsTyping(true);
    triggerVibrate();

    const uid = Date.now();
    setBubbles(prev => [...prev, { id: uid, nodeId: "c", role: "user", text, opacity: 1 }]);

    setTimeout(() => {
      const risposta = cercaRisposta(text);
      const nodeId   = pickNode(usedRef.current);
      usedRef.current = [...usedRef.current.slice(-10), nodeId];

      setActive(nodeId);
      const bid = Date.now() + 1;
      setBubbles(prev => [...prev, { id: bid, nodeId, role: "bot", text: risposta, opacity: 0 }]);

      setTimeout(() => {
        setBubbles(prev => prev.map(b => b.id === bid ? { ...b, opacity: 1 } : b));
        setIsTyping(false);
      }, 80);

      setTimeout(() => {
        setBubbles(prev => prev.map(b => b.id === uid ? { ...b, opacity: 0 } : b));
        setTimeout(() => setBubbles(prev => prev.filter(b => b.id !== uid)), 700);
      }, 3000);

      setTimeout(() => setActive(null), 2200);
    }, 950);
  }, [input, isTyping, triggerVibrate]);

  const handleKey = (e) => { if (e.key === "Enter") send(); };

  function bubbleOffset(node) {
    const isRight  = node.x > CX + 20;
    const isLeft   = node.x < CX - 20;
    const isBottom = node.y > CY + 20;

    let left = node.x, top = node.y;
    let transform = "translate(-50%, -130%)";

    if (node.id === "c") {
      transform = "translate(-50%, -130%)";
    } else if (isRight) {
      left = node.x + 14; top = node.y;
      transform = "translate(0, -50%)";
    } else if (isLeft) {
      left = node.x - 14; top = node.y;
      transform = "translate(-100%, -50%)";
    } else if (isBottom) {
      transform = "translate(-50%, 14px)";
    }

    return { position: "absolute", left, top, transform };
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0d1117; }

        @keyframes bounceDot {
          0%,80%,100% { transform:translateY(0); opacity:.4; }
          40%         { transform:translateY(-5px); opacity:1; }
        }
        @keyframes webShake {
          0%,100% { transform:rotate(0deg) scale(1); }
          15%     { transform:rotate(0.5deg) scale(1.002); }
          35%     { transform:rotate(-0.5deg) scale(0.999); }
          55%     { transform:rotate(0.3deg) scale(1.001); }
          75%     { transform:rotate(-0.2deg) scale(1); }
        }
        @keyframes popIn {
          0%   { transform: scale(0.6); opacity:0; }
          65%  { transform: scale(1.06); }
          100% { transform: scale(1); opacity:1; }
        }
        @keyframes spiderFloat {
          0%,100% { transform: translateY(0px); }
          50%     { transform: translateY(-7px); }
        }
        .spider-float { animation: spiderFloat 3.5s ease-in-out infinite; }
        .web-svg.shake { animation: webShake 0.7s ease-in-out; }
        .bubble-pop { animation: popIn 0.35s cubic-bezier(.34,1.56,.64,1) forwards; }

        input:focus { outline: none; box-shadow: 0 0 0 2px #38bdf880; }
        input::placeholder { color: #475569; }
        button:hover { transform: scale(1.04) !important; }
        button:active { transform: scale(0.97) !important; }
      `}</style>

      <div style={S.root}>
        <div style={S.stars} />

        <div style={S.header}>
          <span className="spider-float" style={{ fontSize: 40, lineHeight: 1 }}>🕷️</span>
          <h1 style={S.title}>Spider IA</h1>
          <p style={S.sub}>Fai una domanda — la risposta appare sulla ragnatela</p>
        </div>

        <div style={S.webWrap}>
          <svg
            className={`web-svg${vibrate ? " shake" : ""}`}
            width="680" height="560"
            viewBox="0 0 680 560"
            style={S.svg}
          >
            <defs>
              <radialGradient id="rg" cx="50%" cy="50%" r="50%">
                <stop offset="0%"   stopColor="#94a3b8" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#334155" stopOpacity="0.02" />
              </radialGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
              <filter id="softglow">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>

            <circle cx={CX} cy={CY} r={RINGS * RING_GAP + 20} fill="url(#rg)" />

            {SPOKE_LINES.map((l, i) => (
              <line key={`s${i}`} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
                stroke="#64748b" strokeWidth="0.9" strokeOpacity="0.35" />
            ))}

            {RING_LINES.map((l, i) => (
              <line key={`r${i}`} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
                stroke="#94a3b8" strokeWidth="0.6" strokeOpacity="0.22" />
            ))}

            {NODES.map(node => {
              const isActive  = node.id === activeNode;
              const isCenter  = node.id === "c";
              const hasBubble = bubbles.some(b => b.nodeId === node.id && b.opacity > 0);
              const r    = isCenter ? 10 : isActive ? 7 : hasBubble ? 5.5 : 3;
              const fill = isCenter ? "#38bdf8"
                         : isActive ? "#7dd3fc"
                         : hasBubble ? "#38bdf8"
                         : "#475569";
              const op = isCenter ? 1 : isActive ? 1 : hasBubble ? 0.9 : 0.6;
              return (
                <circle key={node.id}
                  cx={node.x} cy={node.y} r={r}
                  fill={fill} fillOpacity={op}
                  filter={isActive || isCenter ? "url(#glow)" : hasBubble ? "url(#softglow)" : "none"}
                  style={{ transition: "all 0.4s cubic-bezier(.34,1.56,.64,1)" }}
                />
              );
            })}
          </svg>

          {bubbles.map(bubble => {
            const node = NODES.find(n => n.id === bubble.nodeId);
            if (!node) return null;
            return (
              <div
                key={bubble.id}
                className={bubble.opacity === 1 ? "bubble-pop" : ""}
                style={{
                  ...bubbleOffset(node),
                  ...S.bubble,
                  ...(bubble.role === "user" ? S.bubbleUser : S.bubbleBot),
                  opacity: bubble.opacity,
                  transition: bubble.opacity === 0 ? "opacity 0.6s ease" : "none",
                  pointerEvents: "none",
                  zIndex: 20,
                }}
              >
                <span style={S.bubbleLabel}>
                  {bubble.role === "user" ? "Tu" : "Spider IA"}
                </span>
                <p style={S.bubbleText}>{bubble.text}</p>
              </div>
            );
          })}

          {isTyping && (
            <div style={{ position:"absolute", left:CX, top:CY, transform:"translate(-50%,-160%)", ...S.dots }}>
              {[0, 0.2, 0.4].map((d, i) => (
                <span key={i} style={{ ...S.dot, animationDelay: `${d}s` }} />
              ))}
            </div>
          )}
        </div>

        <div style={S.inputRow}>
          <input
            ref={inputRef}
            style={S.input}
            type="text"
            placeholder="Chiedimi qualcosa..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            disabled={isTyping}
          />
          <button
            style={{ ...S.btn, opacity: isTyping ? 0.5 : 1 }}
            onClick={send}
            disabled={isTyping}
          >
            🕷️ Invia
          </button>
        </div>
      </div>
    </>
  );
}

/* ── STILI ──────────────────────────────────────────────────────────────── */
const S = {
  root: {
    minHeight: "100vh",
    background: "radial-gradient(ellipse at 50% 0%, #0f2027 0%, #0d1117 60%, #080c10 100%)",
    display: "flex", flexDirection: "column", alignItems: "center",
    fontFamily: "'Nunito', sans-serif",
    padding: "20px 16px 32px",
    position: "relative", overflow: "hidden",
  },
  stars: {
    position: "fixed", inset: 0, pointerEvents: "none",
    background: `
      radial-gradient(circle at 10% 20%, #ffffff08 1px, transparent 1px),
      radial-gradient(circle at 30% 50%, #ffffff06 1px, transparent 1px),
      radial-gradient(circle at 70% 15%, #ffffff07 1px, transparent 1px),
      radial-gradient(circle at 90% 70%, #ffffff05 1px, transparent 1px),
      radial-gradient(circle at 55% 85%, #ffffff06 1px, transparent 1px)
    `,
  },
  header: {
    display: "flex", flexDirection: "column", alignItems: "center",
    gap: 5, marginBottom: 0, zIndex: 1, textAlign: "center",
  },
  title: {
    fontSize: 30, fontWeight: 800,
    color: "#e2e8f0",
    letterSpacing: 2,
    textShadow: "0 0 24px #38bdf840",
  },
  sub: {
    fontSize: 12, color: "#64748b",
    letterSpacing: 0.3, maxWidth: 300,
  },
  webWrap: {
    position: "relative",
    width: 680, maxWidth: "100%",
    marginTop: -10,
    marginBottom: -20,
    zIndex: 1, userSelect: "none",
  },
  svg: { width: "100%", height: "auto", display: "block" },
  bubble: {
    position: "absolute",
    maxWidth: 172,
    borderRadius: 12,
    padding: "8px 12px",
    boxShadow: "0 6px 24px rgba(0,0,0,0.5)",
  },
  bubbleBot: {
    background: "#0f172aee",
    border: "1px solid #38bdf840",
  },
  bubbleUser: {
    background: "#1e293bee",
    border: "1px solid #94a3b830",
  },
  bubbleLabel: {
    fontSize: 9, fontWeight: 800, letterSpacing: 2,
    textTransform: "uppercase", color: "#94a3b860",
    display: "block", marginBottom: 3,
  },
  bubbleText: {
    fontSize: 12.5, color: "#e2e8f0",
    lineHeight: 1.55, margin: 0, wordBreak: "break-word",
  },
  dots: {
    display: "flex", gap: 5, alignItems: "center",
    background: "#1e293bdd", border: "1px solid #38bdf830",
    borderRadius: 20, padding: "7px 12px",
  },
  dot: {
    display: "inline-block", width: 6, height: 6,
    borderRadius: "50%", background: "#38bdf8",
    animation: "bounceDot 1.2s ease-in-out infinite",
  },
  inputRow: {
    display: "flex", gap: 10,
    width: "100%", maxWidth: 460,
    zIndex: 1,
    marginTop: 16,
  },
  input: {
    flex: 1,
    background: "#1e293b",
    border: "1.5px solid #334155",
    borderRadius: 50,
    padding: "13px 20px",
    color: "#e2e8f0",
    fontSize: 14,
    fontFamily: "'Nunito', sans-serif",
    transition: "border-color 0.2s, box-shadow 0.2s",
  },
  btn: {
    background: "#0ea5e9",
    border: "none", borderRadius: 50,
    padding: "13px 22px",
    color: "#fff", fontFamily: "'Nunito', sans-serif",
    fontWeight: 800, fontSize: 14, cursor: "pointer",
    whiteSpace: "nowrap",
    boxShadow: "0 4px 16px #0ea5e940",
    transition: "transform 0.15s, box-shadow 0.2s",
  },
};
