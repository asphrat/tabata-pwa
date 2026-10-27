// localStorage com proteção (modo privado do Safari pode lançar erro).

export const storage = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* cheio ou bloqueado */
    }
  },
};

export const KEYS = {
  last: "tabata.last",
  presets: "tabata.presets",
  history: "tabata.history",
  settings: "tabata.settings",
};
