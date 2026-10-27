// Som, voz, vibração e tela acesa.

let ctx = null;

/** Precisa ser chamado dentro de um toque/clique (regra do iOS). */
export function unlockAudio() {
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();
    // toca um som mudo para "destravar" o áudio no Safari
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    g.gain.value = 0;
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.01);
  } catch {
    /* sem áudio */
  }
}

export function beep(freq = 880, ms = 120, vol = 0.35) {
  if (!ctx) return;
  try {
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "square";
    o.frequency.value = freq;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + ms / 1000);
    o.connect(g).connect(ctx.destination);
    o.start(t);
    o.stop(t + ms / 1000 + 0.02);
  } catch {
    /* ignore */
  }
}

export const sounds = {
  tick: () => beep(880, 110),
  work: () => beep(1320, 380, 0.4),
  rest: () => beep(520, 380, 0.35),
  done: () => [0, 180, 360].forEach((d) => setTimeout(() => beep(1320, 160, 0.4), d)),
};

export function say(text, enabled = true) {
  if (!enabled || !text || !("speechSynthesis" in window)) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "pt-BR";
    u.rate = 1.05;
    speechSynthesis.speak(u);
  } catch {
    /* ignore */
  }
}

export function stopSpeech() {
  try {
    speechSynthesis.cancel();
  } catch {
    /* ignore */
  }
}

/** Não funciona no Safari do iOS; em Android vibra. */
export function vibrate(pattern) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* ignore */
  }
}

let lock = null;
export async function keepAwake() {
  try {
    if ("wakeLock" in navigator && !lock) {
      lock = await navigator.wakeLock.request("screen");
      lock.addEventListener?.("release", () => (lock = null));
    }
  } catch {
    lock = null;
  }
}
export function releaseAwake() {
  try {
    lock?.release();
  } catch {
    /* ignore */
  }
  lock = null;
}
