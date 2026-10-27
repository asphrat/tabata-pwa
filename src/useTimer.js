import { useCallback, useEffect, useRef, useState } from "react";
import { buildPhases } from "./engine.js";
import { keepAwake, releaseAwake, say, sounds, stopSpeech, unlockAudio, vibrate } from "./feedback.js";

/**
 * Máquina de estados do timer: idle → running ⇄ paused → finished.
 * O tempo vem de timestamps (performance.now), não de contar ticks,
 * então o timer não atrasa quando o navegador desacelera a aba.
 */
export function useTimer({ sound = true, voice = true, onFinish } = {}) {
  const run = useRef(null);
  const [, setFrame] = useState(0);
  const opts = useRef({ sound, voice, onFinish });
  opts.current = { sound, voice, onFinish };

  const rerender = () => setFrame((f) => (f + 1) % 1e6);

  const enterPhase = useCallback(() => {
    const r = run.current;
    const p = r.phases[r.idx];
    r.lastSec = null;
    const { sound, voice } = opts.current;
    if (p.type === "work") {
      sound && sounds.work();
      say(p.ex, voice);
      vibrate(200);
    } else if (p.type !== "prep") {
      sound && sounds.rest();
      vibrate([80, 60, 80]);
    }
  }, []);

  const finish = useCallback(() => {
    const r = run.current;
    r.status = "finished";
    r.idx = r.phases.length - 1;
    opts.current.sound && sounds.done();
    say("Treino concluído", opts.current.voice);
    releaseAwake();
    opts.current.onFinish?.(r.config, r.total);
    rerender();
  }, []);

  const tick = useCallback(() => {
    const r = run.current;
    if (!r || r.status !== "running") return;
    const now = performance.now();
    let p = r.phases[r.idx];
    while ((now - r.t0) / 1000 >= p.dur) {
      r.t0 += p.dur * 1000;
      r.idx++;
      if (r.idx >= r.phases.length) return finish();
      p = r.phases[r.idx];
      enterPhase();
    }
    const sec = Math.ceil(p.dur - (now - r.t0) / 1000);
    if (sec !== r.lastSec) {
      if (r.lastSec !== null && sec >= 1 && sec <= 3 && opts.current.sound) sounds.tick();
      r.lastSec = sec;
    }
    rerender();
  }, [enterPhase, finish]);

  // loop: rAF para fluidez + intervalo para quando o rAF é pausado
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      tick();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const iv = setInterval(tick, 250);
    const onVis = () => {
      if (document.visibilityState === "visible" && run.current?.status === "running") keepAwake();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(iv);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [tick]);

  const start = useCallback(
    (config) => {
      unlockAudio();
      keepAwake();
      const phases = buildPhases(config);
      run.current = {
        config,
        phases,
        idx: 0,
        t0: performance.now(),
        pauseAt: 0,
        lastSec: null,
        status: "running",
        total: phases.reduce((a, p) => a + p.dur, 0),
      };
      enterPhase();
      rerender();
    },
    [enterPhase]
  );

  const togglePause = useCallback(() => {
    const r = run.current;
    if (!r) return;
    const now = performance.now();
    if (r.status === "running") {
      r.status = "paused";
      r.pauseAt = now;
      stopSpeech();
    } else if (r.status === "paused") {
      r.t0 += now - r.pauseAt;
      r.status = "running";
      unlockAudio();
      keepAwake();
    }
    rerender();
  }, []);

  const skip = useCallback(() => {
    const r = run.current;
    if (!r || r.status === "finished") return;
    r.idx++;
    if (r.idx >= r.phases.length) return finish();
    r.t0 = performance.now();
    if (r.status === "paused") r.pauseAt = r.t0;
    enterPhase();
    rerender();
  }, [enterPhase, finish]);

  const stop = useCallback(() => {
    run.current = null;
    stopSpeech();
    releaseAwake();
    rerender();
  }, []);

  // ---- snapshot para a interface ----
  const r = run.current;
  if (!r) return { status: "idle", start, togglePause, skip, stop };

  const now = r.status === "paused" ? r.pauseAt : performance.now();
  const phase = r.phases[r.idx];
  const finished = r.status === "finished";
  const elapsed = finished ? phase.dur : Math.min(phase.dur, (now - r.t0) / 1000);
  const before = r.phases.slice(0, r.idx).reduce((a, p) => a + p.dur, 0);
  const next = r.phases.slice(r.idx + 1).find((p) => p.type === "work");

  return {
    status: r.status,
    config: r.config,
    phase,
    next,
    secondsLeft: finished ? 0 : Math.ceil(phase.dur - elapsed),
    phaseProgress: phase.dur ? elapsed / phase.dur : 1,
    totalLeft: finished ? 0 : r.total - before - elapsed,
    total: r.total,
    totalRounds: r.config.rounds * r.config.cycles,
    start,
    togglePause,
    skip,
    stop,
  };
}
