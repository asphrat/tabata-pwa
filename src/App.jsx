import { useCallback, useEffect, useState } from "react";
import { BUILTIN_PRESETS, fmt, normalizeConfig, totalSeconds } from "./engine.js";
import { KEYS, storage } from "./storage.js";
import { useTimer } from "./useTimer.js";
import { DEFAULT_MODEL } from "./claude.js";
import ConfigEditor from "./components/ConfigEditor.jsx";
import ClaudeCard from "./components/ClaudeCard.jsx";
import Settings from "./components/Settings.jsx";
import Timer from "./components/Timer.jsx";

const DEFAULT_SETTINGS = { sound: true, voice: true, apiKey: "", model: DEFAULT_MODEL };

export default function App() {
  const [config, setConfig] = useState(() => normalizeConfig(storage.get(KEYS.last, BUILTIN_PRESETS[0])));
  const [active, setActive] = useState(config.name);
  const [custom, setCustom] = useState(() => storage.get(KEYS.presets, []));
  const [history, setHistory] = useState(() => storage.get(KEYS.history, []));
  const [settings, setSettings] = useState(() => ({ ...DEFAULT_SETTINGS, ...storage.get(KEYS.settings, {}) }));
  const [showSettings, setShowSettings] = useState(false);
  const [saveName, setSaveName] = useState("");

  useEffect(() => storage.set(KEYS.last, config), [config]);
  useEffect(() => storage.set(KEYS.presets, custom), [custom]);
  useEffect(() => storage.set(KEYS.history, history), [history]);
  useEffect(() => storage.set(KEYS.settings, settings), [settings]);

  const onFinish = useCallback((cfg, secs) => {
    setHistory((h) => [{ name: cfg.name, secs, rounds: cfg.rounds * cfg.cycles, at: Date.now() }, ...h].slice(0, 30));
  }, []);

  const t = useTimer({ sound: settings.sound, voice: settings.voice, onFinish });

  const safeConfig = normalizeConfig(config); // campos vazios durante a digitação
  const allPresets = [...BUILTIN_PRESETS.map((p) => ({ ...p, builtin: true })), ...custom];

  function editConfig(next) {
    setConfig(next);
    setActive("");
  }
  function pick(p) {
    setConfig(normalizeConfig(p));
    setActive(p.name);
  }
  function savePreset() {
    const name = saveName.trim();
    if (!name) return;
    const preset = { ...safeConfig, name };
    setCustom((c) => [...c.filter((p) => p.name !== name), preset]);
    setConfig(preset);
    setActive(name);
    setSaveName("");
  }

  if (t.status !== "idle") {
    return <Timer t={t} onClose={t.stop} onRestart={() => t.start(t.config)} />;
  }

  return (
    <main className="wrap">
      <header className="top">
        <h1>Tabata<span>.</span></h1>
        <div className="top-right">
          <div className="total">Total <b>{fmt(totalSeconds(safeConfig))}</b></div>
          <button className="icon-btn" aria-label="Configurações" onClick={() => setShowSettings(true)}>
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12" />
              <circle cx="16" cy="6" r="2" /><circle cx="10" cy="12" r="2" /><circle cx="18" cy="18" r="2" />
            </svg>
          </button>
        </div>
      </header>

      <section className="card">
        <h2>Presets</h2>
        <div className="presets">
          {allPresets.map((p) => (
            <span key={(p.builtin ? "b:" : "c:") + p.name} className={`chip ${p.name === active ? "on" : ""}`}>
              <button className="chip-main" onClick={() => pick(p)}>
                {p.name}{" "}
                <small>
                  {p.work}/{p.rest}×{p.rounds}
                  {p.cycles > 1 ? `×${p.cycles}` : ""}
                </small>
              </button>
              {!p.builtin && (
                <button className="x" aria-label={`Apagar ${p.name}`} onClick={() => setCustom((c) => c.filter((q) => q.name !== p.name))}>
                  ×
                </button>
              )}
            </span>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>Configurar treino</h2>
        <ConfigEditor config={config} onChange={editConfig} />
      </section>

      <ClaudeCard settings={settings} onOpenSettings={() => setShowSettings(true)} onWorkout={editConfig} />

      <button className="go" onClick={() => { setConfig(safeConfig); t.start(safeConfig); }}>Iniciar</button>

      <section className="card">
        <h2>Salvar como preset</h2>
        <form className="save" onSubmit={(e) => { e.preventDefault(); savePreset(); }}>
          <input id="save-name" placeholder="Nome do preset" maxLength={30} value={saveName} onChange={(e) => setSaveName(e.target.value)} />
          <button className="btn" type="submit">Salvar</button>
        </form>
      </section>

      {history.length > 0 && (
        <section className="card">
          <div className="row between">
            <h2>Histórico</h2>
            <button className="link" onClick={() => setHistory([])}>Limpar</button>
          </div>
          <ul className="history">
            {history.slice(0, 10).map((h) => (
              <li key={h.at}>
                <span>{h.name}</span>
                <span className="muted">
                  {fmt(h.secs)} · {h.rounds} rodadas ·{" "}
                  {new Date(h.at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {showSettings && (
        <Settings settings={settings} onSave={setSettings} onClose={() => setShowSettings(false)} />
      )}
    </main>
  );
}
