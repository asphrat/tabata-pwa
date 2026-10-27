import { useRef, useState } from "react";
import { generateWorkout } from "../claude.js";
import { fmt, normalizeConfig, totalSeconds } from "../engine.js";

export default function ClaudeCard({ settings, onOpenSettings, onWorkout }) {
  const [request, setRequest] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ text: "", err: false });
  const ctl = useRef(null);

  const hasKey = Boolean(settings.apiKey);

  async function generate() {
    if (!request.trim()) {
      setMsg({ text: "Escreva o que você quer treinar.", err: true });
      return;
    }
    ctl.current = new AbortController();
    setBusy(true);
    setMsg({ text: "Montando o treino…", err: false });
    try {
      const raw = await generateWorkout({
        request: request.trim(),
        apiKey: settings.apiKey,
        model: settings.model,
        signal: ctl.current.signal,
      });
      const cfg = normalizeConfig(raw);
      onWorkout(cfg);
      const tip = raw.tip ? ` ${String(raw.tip).slice(0, 160)}` : "";
      setMsg({ text: `Pronto: ${cfg.name} · ${fmt(totalSeconds(cfg))}.${tip}`, err: false });
    } catch (e) {
      if (e.name === "AbortError") setMsg({ text: "", err: false });
      else setMsg({ text: e.message || "Algo falhou. Tente de novo.", err: true });
    } finally {
      setBusy(false);
      ctl.current = null;
    }
  }

  return (
    <section className="card">
      <h2>Montar treino com Claude</h2>
      {!hasKey ? (
        <>
          <p className="hint">
            Cole sua chave da API do Claude nas configurações para gerar treinos a partir de uma descrição. O timer funciona normalmente sem ela.
          </p>
          <div className="row">
            <button className="btn" onClick={onOpenSettings}>Abrir configurações</button>
          </div>
        </>
      ) : (
        <>
          <p className="hint">Descreva o que você quer e o Claude preenche tempos, rodadas e exercícios.</p>
          <textarea
            id="ai-request"
            value={request}
            onChange={(e) => setRequest(e.target.value)}
            placeholder="Ex.: 15 minutos de pernas e core, sem equipamento, nível intermediário"
          />
          <div className="row">
            <button className="btn claude" onClick={generate} disabled={busy}>Gerar treino</button>
            {busy && <button className="btn" onClick={() => ctl.current?.abort()}>Parar</button>}
          </div>
          <p className={`status ${msg.err ? "err" : ""}`}>{msg.text}</p>
        </>
      )}
    </section>
  );
}
