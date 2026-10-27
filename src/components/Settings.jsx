import { useEffect, useRef, useState } from "react";
import { DEFAULT_MODEL } from "../claude.js";

export default function Settings({ settings, onSave, onClose }) {
  const [draft, setDraft] = useState(settings);
  const ref = useRef(null);

  useEffect(() => {
    ref.current?.showModal?.();
  }, []);

  const toggle = (k) => setDraft({ ...draft, [k]: !draft[k] });

  return (
    <dialog ref={ref} className="sheet" onClose={onClose} onCancel={onClose}>
      <form
        method="dialog"
        onSubmit={() => onSave({ ...draft, apiKey: draft.apiKey.trim(), model: draft.model.trim() || DEFAULT_MODEL })}
      >
        <h2 className="sheet-title">Configurações</h2>

        <label className="switch">
          <input type="checkbox" checked={draft.sound} onChange={() => toggle("sound")} />
          <span>Bipes</span>
        </label>
        <label className="switch">
          <input type="checkbox" checked={draft.voice} onChange={() => toggle("voice")} />
          <span>Falar o nome do exercício</span>
        </label>

        <div className="stack">
          <label htmlFor="api-key">Chave da API do Claude</label>
          <input
            id="api-key"
            type="password"
            autoComplete="off"
            placeholder="sk-ant-…"
            value={draft.apiKey}
            onChange={(e) => setDraft({ ...draft, apiKey: e.target.value })}
          />
          <p className="hint">
            Crie em console.anthropic.com. Fica salva só neste aparelho e é enviada apenas para a API da Anthropic. Cada treino gerado consome créditos da sua conta da API.
          </p>
        </div>

        <div className="stack">
          <label htmlFor="model">Modelo</label>
          <input id="model" value={draft.model} onChange={(e) => setDraft({ ...draft, model: e.target.value })} />
        </div>

        <div className="row end">
          <button type="button" className="btn" onClick={() => ref.current?.close()}>Cancelar</button>
          <button type="submit" className="btn claude">Salvar</button>
        </div>
      </form>
    </dialog>
  );
}
