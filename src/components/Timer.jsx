import { useEffect } from "react";
import { PHASE_LABEL, fmt } from "../engine.js";

export default function Timer({ t, onClose, onRestart }) {
  const finished = t.status === "finished";
  const phaseType = finished ? "done" : t.phase.type;

  // espaço = pausar, esc = sair (útil no computador)
  useEffect(() => {
    const onKey = (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        finished ? onRestart() : t.togglePause();
      }
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [t, finished, onClose, onRestart]);

  let roundLabel;
  if (finished) roundLabel = `${t.totalRounds} rodadas`;
  else if (t.phase.type === "prep") roundLabel = `${t.totalRounds} rodadas`;
  else roundLabel = `Rodada ${t.phase.n}/${t.totalRounds}` + (t.config.cycles > 1 ? ` · Ciclo ${t.phase.cycle}` : "");

  let sub = "";
  if (finished) sub = `${fmt(t.total)} de treino concluídos`;
  else if (t.phase.type === "work") sub = t.phase.ex;

  const nextLabel = !finished && t.phase.type !== "work" && t.next ? `A seguir: ${t.next.ex || "Esforço"}` : "";

  return (
    <div className="timer" data-phase={phaseType}>
      <div className="t-top">
        <span>{roundLabel}</span>
        <span>{fmt(t.totalLeft)}</span>
      </div>

      <div className="t-mid" onClick={() => !finished && t.togglePause()}>
        <div className="t-phase">{t.status === "paused" ? "Pausado" : PHASE_LABEL[phaseType]}</div>
        <div className="t-num" aria-live="off">{finished ? "✓" : t.secondsLeft}</div>
        <div className="t-ex">{sub}</div>
        <div className="t-next">{nextLabel}</div>
      </div>

      <div className="bar" aria-hidden="true">
        <i style={{ width: `${Math.min(100, t.phaseProgress * 100)}%` }} />
      </div>

      <div className="t-ctrl">
        <button onClick={onClose}>{finished ? "Sair" : "Parar"}</button>
        <button className="main" onClick={finished ? onRestart : t.togglePause}>
          {finished ? "De novo" : t.status === "paused" ? "Retomar" : "Pausar"}
        </button>
        <button onClick={t.skip} disabled={finished}>Pular</button>
      </div>
    </div>
  );
}
