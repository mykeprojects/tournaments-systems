export const SPORT_CATEGORIES = [
  "Balón",
  "Red",
  "Raqueta",
  "Acuática",
  "Combate",
  "Atlética",
] as const;

export const CITIES = [
  "Manizales",
  "Pereira",
  "Armenia",
  "Ibagué",
  "Bogotá",
  "Medellín",
  "Cali",
] as const;

export const POSITIONS = ["DEL", "MC", "DEF", "POR"] as const;

export const NATIONALITIES = [
  "Colombia",
  "Argentina",
  "Brasil",
  "España",
  "Uruguay",
] as const;

export const DOMINANT_FEET = ["Derecho", "Izquierdo", "Ambos"] as const;

export const SKILL_CATEGORIES = ["Física", "Técnica", "Táctica", "Mental"] as const;

export const POSITION_CLASS: Record<string, string> = {
  DEL: "bg-red-500/15 text-red-300",
  MC: "bg-amber-400/15 text-amber-200",
  DEF: "bg-sky-400/15 text-sky-200",
  POR: "bg-emerald-400/15 text-emerald-200",
};

export const CATEGORY_TONE: Record<string, string> = {
  Física: "bg-emerald-400/15 text-emerald-300",
  Técnica: "bg-fuchsia-400/15 text-fuchsia-300",
  Táctica: "bg-amber-300/15 text-amber-200",
  Mental: "bg-yellow-300/15 text-yellow-200",
};

export const FLAGS: Record<string, string> = {
  Colombia: "🇨🇴",
  Argentina: "🇦🇷",
  Brasil: "🇧🇷",
  España: "🇪🇸",
  Uruguay: "🇺🇾",
};

export const RADAR_AXES = [
  { label: "Velocidad", names: ["Velocidad"] },
  { label: "Tiro", names: ["Definición", "Tiro"] },
  { label: "Pase", names: ["Pase"] },
  { label: "Defensa", names: ["Defensa"] },
  { label: "Regate", names: ["Regate"] },
  { label: "Físico", names: ["Resistencia", "Físico"] },
] as const;
