import type { Contract, PlayerSkill, Skill, Sport, TeamSport } from "./types";

export function parentSports(sports: Sport[]): Sport[] {
  return sports.filter((sport) => sport.parentId === null);
}

export function subdeportesOf(sports: Sport[], parentId: string): Sport[] {
  return sports.filter((sport) => sport.parentId === parentId);
}

export function familyIds(sports: Sport[], parentId: string): string[] {
  return [parentId, ...subdeportesOf(sports, parentId).map((sport) => sport.id)];
}

export function activeContract(contracts: Contract[], playerId: string): Contract | null {
  return (
    contracts.find((contract) => contract.playerId === playerId && contract.status === "activo") ??
    null
  );
}

export function skillScore(
  skills: Skill[],
  playerSkills: PlayerSkill[],
  playerId: string,
  names: readonly string[]
): number | null {
  const skill = skills.find((item) =>
    names.some((name) => item.name.toLocaleLowerCase("es") === name.toLocaleLowerCase("es"))
  );
  if (!skill) {
    return null;
  }
  return (
    playerSkills.find((link) => link.playerId === playerId && link.skillId === skill.id)?.score ??
    null
  );
}

export function sportsOfTeam(teamSports: TeamSport[], sports: Sport[], teamId: string): Sport[] {
  return teamSports
    .filter((link) => link.teamId === teamId)
    .map((link) => sports.find((sport) => sport.id === link.sportId))
    .filter((sport): sport is Sport => Boolean(sport));
}
