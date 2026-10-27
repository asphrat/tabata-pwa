# Tabata Timer (PWA)

Timer de Tabata e HIIT que roda no navegador, funciona offline e pode ser instalado na tela inicial do iPhone como um app.

## Rodar no computador

Precisa do [Node.js](https://nodejs.org) 18 ou mais novo.

```bash
npm install
npm run dev
```

Abra o endereço que aparecer (ex.: `http://localhost:5173`). O `--host` já vem ligado, então dá para abrir do celular usando o IP do computador na mesma rede Wi-Fi (ex.: `http://192.168.0.10:5173`).

> O modo offline (service worker) só liga na versão de produção. Para testar como app de verdade: `npm run build` e depois `npm run preview`.

## Publicar (grátis)

O iPhone só instala o PWA a partir de um endereço **https**. Qualquer uma dessas opções serve:

**Netlify (mais fácil):** rode `npm run build` e arraste a pasta `dist` para [app.netlify.com/drop](https://app.netlify.com/drop).

**Vercel:** importe o repositório em [vercel.com/new](https://vercel.com/new). Ele detecta o Vite sozinho.

**GitHub Pages:** suba o projeto para um repositório, rode `npm run build` e publique a pasta `dist` (por exemplo, com a action oficial *Deploy static content to Pages*). O `base: "./"` no `vite.config.js` já faz funcionar em subpasta.

## Instalar no iPhone

1. Abra o endereço publicado no **Safari**.
2. Toque em **Compartilhar** → **Adicionar à Tela de Início**.
3. Abra pelo ícone. O app abre em tela cheia e funciona sem internet.

Dica: desligue o modo silencioso para ouvir os bipes.

## Gerar treinos com o Claude (opcional)

1. Crie uma chave em [console.anthropic.com](https://console.anthropic.com) (a API é cobrada por uso, separada da assinatura do Claude).
2. No app, toque no ícone de ajustes e cole a chave.
3. Descreva o treino ("15 min de pernas sem equipamento") e toque em **Gerar treino**.

A chave fica salva só no aparelho e é enviada direto para `api.anthropic.com`. Como o app não tem servidor, **não publique o app com a sua chave embutida no código**. Se um dia for abrir para outras pessoas, o certo é criar um pequeno backend (ex.: uma função na Vercel) que guarda a chave e faz a chamada.

## Estrutura

```
index.html                  metas do PWA e do iOS
public/
  manifest.webmanifest      nome, cores e ícones do app
  sw.js                     service worker (cache para offline)
  icons/                    ícones (192, 512, maskable, apple-touch)
src/
  engine.js                 campos, presets e a fila de fases do treino
  useTimer.js               máquina de estados do timer (baseada em timestamps)
  feedback.js               bipes, voz, vibração e tela acesa
  storage.js                localStorage protegido
  claude.js                 chamada à API do Claude
  App.jsx                   tela inicial (presets, editor, histórico)
  components/
    ConfigEditor.jsx        campos de tempo, rodadas e exercícios
    ClaudeCard.jsx          "Montar treino com Claude"
    Settings.jsx            som, voz, chave e modelo
    Timer.jsx               tela do treino em andamento
  styles.css
```

## Como o timer funciona

- `buildPhases()` transforma a configuração numa fila: preparo → esforço → descanso → … → pausa entre ciclos → …
- O tempo vem de `performance.now()`, não de contar ticks, então o timer não atrasa se o navegador desacelerar a aba.
- Estados: `idle → running ⇄ paused → finished`.
- O áudio é destravado no toque em **Iniciar** (exigência do iOS) e a tela fica acesa com a Wake Lock API.

## Próximas ideias

- Sons diferentes (apito, gongo) e volume ajustável
- Estatísticas do histórico (minutos por semana)
- Compartilhar um treino por link
- Notificação/som com a tela bloqueada (limitado no iOS)
