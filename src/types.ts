export type Language = "zh" | "en";
export type Snapshot = {
  lang: Language;
  view: string;
  className: string;
  total: number;
  busy: boolean;
  html: string;
  logo: string;
  onAction: (action: string, data?: Record<string, string>) => void;
};

declare global {
  interface Window {
    GradeI18n: { t: (key: string, lang: Language) => string };
    GradeUI: { render: (snapshot: Snapshot) => void };
  }
}

export const translate = (lang: Language) => (key: string) =>
  window.GradeI18n.t(key, lang);
