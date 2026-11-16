export type Status = "activo" | "inactivo";

export type Sport = {
  id: string;
  code: string;
  name: string;
  category: string;
  description: string;
  status: Status;
  parentId: string | null;
  createdAt: string;
};

export type Team = {
  id: string;
  code: string;
  name: string;
  shortName: string;
  city: string;
  description: string;
  status: Status;
  createdAt: string;
  color: string;
};

export type TeamSport = {
  teamId: string;
  sportId: string;
};

export type PlayerStats = {
  matches: number;
  goals: number;
  assists: number;
  rating: number;
};

export type Player = {
  id: string;
  fullName: string;
  document: string;
  age: number;
  nationality: string;
  position: string;
  heightM: number;
  dominantFoot: string;
  status: Status;
  email: string;
  phone: string;
  preferredSportId: string;
  stats: PlayerStats;
};

export type Contract = {
  id: string;
  playerId: string;
  teamId: string;
  startDate: string;
  endDate: string;
  status: "activo" | "finalizado";
  endReason: string | null;
  detail: string | null;
};

export type SkillCategory = "Física" | "Técnica" | "Táctica" | "Mental";

export type SkillGlyph =
  | "run"
  | "ball"
  | "target"
  | "heart"
  | "pass"
  | "shield"
  | "eye"
  | "crown";

export type Skill = {
  id: string;
  name: string;
  category: SkillCategory;
  description: string;
  glyph: SkillGlyph;
};

export type PlayerSkill = {
  playerId: string;
  skillId: string;
  score: number;
};

export type CatalogData = {
  sports: Sport[];
  teams: Team[];
  teamSports: TeamSport[];
  players: Player[];
  contracts: Contract[];
  skills: Skill[];
  playerSkills: PlayerSkill[];
};
