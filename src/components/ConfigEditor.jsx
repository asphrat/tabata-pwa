import { FIELDS, clampField } from "../engine.js";

export default function ConfigEditor({ config, onChange }) {
  const set = (f, v) => onChange({ ...config, [f.k]: clampField(f, v) });

  return (
    <>
      <div className="grid">
        {FIELDS.map((f) => (
          <div className="field" data-k={f.k} key={f.k}>
            <label htmlFor={`f-${f.k}`}>{f.label}</label>
            <div className="stepper">
              <button type="button" aria-label={`Diminuir ${f.label}`} onClick={() => set(f, config[f.k] - f.step)}>−</button>
              <input
                id={`f-${f.k}`}
                type="number"
                inputMode="numeric"
                min={f.min}
                max={f.max}
                value={config[f.k]}
                onChange={(e) => onChange({ ...config, [f.k]: e.target.value === "" ? "" : Number(e.target.value) })}
                onBlur={(e) => set(f, e.target.value)}
              />
              <button type="button" aria-label={`Aumentar ${f.label}`} onClick={() => set(f, config[f.k] + f.step)}>+</button>
            </div>
            <div className="unit">{f.unit}</div>
          </div>
        ))}
      </div>

      <div className="ex-block">
        <h2>Exercícios por rodada</h2>
        <textarea
          id="exercises"
          rows={3}
          placeholder="Opcional. Um por linha: Burpee, Agachamento…"
          value={config.exercises.join("\n")}
          onChange={(e) => onChange({ ...config, exercises: e.target.value.split("\n") })}
          onBlur={() => onChange({ ...config, exercises: config.exercises.map((s) => s.trim()).filter(Boolean) })}
        />
        <p className="hint">Se houver menos exercícios que rodadas, a lista se repete. A voz fala o nome no início de cada rodada.</p>
      </div>
    </>
  );
}
