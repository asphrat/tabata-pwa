// Gera um treino com a API do Claude, usando a chave que o próprio usuário cola nas configurações.
// A chave fica só no aparelho (localStorage) e vai direto para api.anthropic.com.

const API_URL = "https://api.anthropic.com/v1/messages";
export const DEFAULT_MODEL = "claude-sonnet-5-5";

function buildPrompt(request) {
  return `Você é um treinador de HIIT/Tabata. Monte um treino intervalado para este pedido (em português do Brasil):
"""${request.slice(0, 1500)}"""

Responda SOMENTE com um objeto JSON neste formato, sem texto antes ou depois:
{"name": string curto (máx. 30 caracteres), "prep": segundos 0-60, "work": segundos 5-300, "rest": segundos 0-180, "rounds": rodadas por ciclo 1-20, "cycles": ciclos 1-10, "cycleRest": segundos entre ciclos 0-300, "exercises": array com um nome curto de exercício por rodada (tamanho = rounds), "tip": uma frase curta de dica}
Exemplo: {"name":"Pernas em fogo","prep":10,"work":20,"rest":10,"rounds":8,"cycles":2,"cycleRest":60,"exercises":["Agachamento","Afundo alternado","Agachamento com salto","Ponte de glúteo","Agachamento","Afundo alternado","Agachamento com salto","Ponte de glúteo"],"tip":"Mantenha o joelho alinhado com o pé."}
Respeite a duração total pedida, se houver.`;
}

function parseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    const m = text.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]);
    throw new Error("A resposta veio num formato inesperado. Tente de novo.");
  }
}

export async function generateWorkout({ request, apiKey, model = DEFAULT_MODEL, signal }) {
  if (!navigator.onLine) throw new Error("Sem internet. O timer funciona offline, mas o Claude precisa de conexão.");
  let res;
  try {
    res = await fetch(API_URL, {
      method: "POST",
      signal,
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        messages: [{ role: "user", content: buildPrompt(request) }],
      }),
    });
  } catch (e) {
    if (e.name === "AbortError") throw e;
    throw new Error("Não consegui falar com o Claude. Verifique a conexão.");
  }
  if (!res.ok) {
    if (res.status === 401) throw new Error("Chave da API inválida. Confira nas configurações.");
    if (res.status === 429) throw new Error("Muitos pedidos agora. Tente de novo daqui a pouco.");
    if (res.status === 404) throw new Error(`Modelo "${model}" não encontrado. Ajuste nas configurações.`);
    throw new Error(`O Claude respondeu com erro ${res.status}. Tente de novo.`);
  }
  const data = await res.json();
  const text = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("");
  return parseJson(text);
}
