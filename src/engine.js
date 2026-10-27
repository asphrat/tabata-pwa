// Regras do treino: campos, presets e a fila de fases.

export const FIELDS = [
  { k: "work", label: "Esforço", unit: "segundos", min: 5, max: 600, step: 5 },
  { k: "rest", label: "Descanso", unit: "segundos", min: 0, max: 600, step: 5 },
  { k: "rounds", label: "Rodadas", unit: "por ciclo", min: 1, max: 50, step: 1 },
  { k: "cycles", label: "Ciclos", unit: "repetições do bloco", min: 1, max: 20, step: 1 },
  { k: "prep", label: "Preparo", unit: "segundos", min: 0, max: 120, step: 5 },
  { k: "cycleRest", label: "Pausa entre ciclos", unit: "segundos", min: 0, max: 600, step: 15 },
];

export const BUILTIN_PRESETS = [
  { name: "Tabata clássico", prep: 10, work: 20, rest: 10, rounds: 8, cycles: 1, cycleRest: 60, exercises: [] },
  { name: "HIIT 40/20", prep: 10, work: 40, rest: 20, rounds: 10, cycles: 1, cycleRest: 60, exercises: [] },
  { name: "Tabata duplo", prep: 10, work: 20, rest: 10, rounds: 8, cycles: 2, cycleRest: 60, exercises: ["Burpee", "Agachamento com salto"] },
  {
    name: "Exemplo: core", prep: 10, work: 30, rest: 15, rounds: 6, cycles: 2, cycleRest: 45,
    exercises: ["Prancha", "Abdominal bicicleta", "Mountain climber", "Prancha lateral D", "Prancha lateral E", "Hollow hold"],
  },
];

export const PHASE_LABEL = {
  prep: "Prepare-se",
  work: "Esforço",
  rest: "Descanso",
  cycleRest: "Pausa",
  done: "Fim!",
};

export const clampField = (field, value) =>
  Math.min(field.max, Math.max(field.min, Math.round(Number(value) || 0)));

/** Normaliza qualquer objeto (preset salvo, resposta do Claude) para uma config válida. */
export function normalizeConfig(raw, fallback = BUILTIN_PRESETS[0]) {
  const cfg = { name: String(raw?.name || fallback.name || "Treino").slice(0, 30) };
  for (const f of FIELDS) cfg[f.k] = clampField(f, raw?.[f.k] ?? fallback[f.k]);
  cfg.exercises = Array.isArray(raw?.exercises)
    ? raw.exercises.map((x) => String(x).trim().slice(0, 40)).filter(Boolean).slice(0, 50)
    : [];
  return cfg;
}

/**
 * Gera a fila de fases. O descanso depois da última rodada de um ciclo é
 * substituído pela pausa entre ciclos, e o treino termina no último esforço.
 */
export function buildPhases(c) {
  const out = [];
  const ex = c.exercises || [];
  const totalRounds = c.rounds * c.cycles;
  if (c.prep > 0) out.push({ type: "prep", dur: c.prep, round: 0, cycle: 1, ex: "" });
  let n = 0;
  for (let cy = 1; cy <= c.cycles; cy++) {
    for (let r = 1; r <= c.rounds; r++) {
      n++;
      out.push({ type: "work", dur: c.work, round: r, cycle: cy, n, ex: ex.length ? ex[(r - 1) % ex.length] : "" });
      const lastOfCycle = r === c.rounds;
      const lastOverall = n === totalRounds;
      if (!lastOverall && !(lastOfCycle && c.cycleRest > 0) && c.rest > 0) {
        out.push({ type: "rest", dur: c.rest, round: r, cycle: cy, n, ex: "" });
      }
    }
    if (cy < c.cycles && c.cycleRest > 0) {
      out.push({ type: "cycleRest", dur: c.cycleRest, round: c.rounds, cycle: cy, n, ex: "" });
    }
  }
  return out;
}

export const totalSeconds = (c) => buildPhases(c).reduce((a, p) => a + p.dur, 0);

export const fmt = (s) => {
  s = Math.max(0, Math.round(s));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};
