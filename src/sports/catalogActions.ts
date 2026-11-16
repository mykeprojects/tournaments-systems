import { addYears, todayIso, uid } from "./format";
import type {
  CatalogData,
  Contract,
  Player,
  Skill,
  Sport,
  Status,
  Team,
} from "./types";

export type ActionResult =
  | { ok: true; message: string; id?: string }
  | { ok: false; message: string };

export type Mutation = { data: CatalogData; result: ActionResult };

export type SportInput = {
  id?: string;
  name: string;
  category: string;
  description: string;
  status: Status;
  subdeportes: string[];
};

export type TeamInput = {
  id?: string;
  name: string;
  shortName: string;
  city: string;
  description: string;
  status: Status;
};

export type PlayerInput = {
  id?: string;
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
  teamId: string;
};

export type SkillInput = {
  id?: string;
  name: string;
  category: Skill["category"];
  description: string;
  glyph?: Skill["glyph"];
};

export type AssignContractInput = {
  playerId: string;
  teamId: string;
  startDate: string;
  endDate: string;
};

const normalize = (value: string) => value.trim().replace(/\s+/g, " ");

const sameName = (left: string, right: string) =>
  normalize(left).toLocaleLowerCase("es") === normalize(right).toLocaleLowerCase("es");

const fail = (data: CatalogData, message: string): Mutation => ({
  data,
  result: { ok: false, message },
});

const ok = (data: CatalogData, message: string, id?: string): Mutation => ({
  data,
  result: { ok: true, message, id },
});

function nextCode(items: { code: string }[], prefix: string): string {
  const max = items.reduce((highest, item) => {
    const match = new RegExp(`^${prefix}-(\\d+)$`).exec(item.code);
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0);
  return `${prefix}-${String(max + 1).padStart(3, "0")}`;
}

function nameTaken(sports: Sport[], name: string, ignore: Set<string>): boolean {
  return sports.some((sport) => !ignore.has(sport.id) && sameName(sport.name, name));
}

export function saveSport(data: CatalogData, input: SportInput): Mutation {
  const name = normalize(input.name);
  const category = normalize(input.category);
  const description = input.description.trim();
  const subdeportes = input.subdeportes.map(normalize).filter(Boolean);

  if (!name || !category) {
    return fail(data, "Completa los campos obligatorios.");
  }
  if (description.length > 250) {
    return fail(data, "La descripción admite máximo 250 caracteres.");
  }

  const ownChildren = new Set(
    data.sports.filter((sport) => input.id && sport.parentId === input.id).map((sport) => sport.id)
  );
  const ignore = new Set<string>(input.id ? [input.id, ...ownChildren] : []);
  if (nameTaken(data.sports, name, ignore)) {
    return fail(data, "Ya existe un deporte con este nombre.");
  }

  const uniqueSubs: string[] = [];
  for (const sub of subdeportes) {
    if (sameName(sub, name) || uniqueSubs.some((item) => sameName(item, sub))) {
      return fail(data, `El subdeporte "${sub}" está repetido.`);
    }
    const existingChild = data.sports.find(
      (sport) => input.id && sport.parentId === input.id && sameName(sport.name, sub)
    );
    const subIgnore = new Set(ignore);
    if (existingChild) {
      subIgnore.add(existingChild.id);
    }
    if (nameTaken(data.sports, sub, subIgnore)) {
      return fail(data, `Ya existe un deporte con el nombre "${sub}".`);
    }
    uniqueSubs.push(sub);
  }

  if (!input.id) {
    const parent: Sport = {
      id: uid("dep"),
      code: nextCode(data.sports, "DEP"),
      name,
      category,
      description,
      status: input.status,
      parentId: null,
      createdAt: todayIso(),
    };
    const children: Sport[] = [];
    for (const sub of uniqueSubs) {
      children.push({
        id: uid("dep"),
        code: nextCode([...data.sports, parent, ...children], "DEP"),
        name: sub,
        category,
        description: `Subdeporte de ${name}.`,
        status: input.status,
        parentId: parent.id,
        createdAt: todayIso(),
      });
    }
    return ok(
      { ...data, sports: [...data.sports, parent, ...children] },
      "El deporte se registró correctamente.",
      parent.id
    );
  }

  const current = data.sports.find((sport) => sport.id === input.id && sport.parentId === null);
  if (!current) {
    return fail(data, "No se encontró el deporte.");
  }

  const removed = data.sports.filter(
    (sport) =>
      sport.parentId === current.id && !uniqueSubs.some((sub) => sameName(sub, sport.name))
  );
  const blocked = removed.find((sport) =>
    data.teamSports.some((link) => link.sportId === sport.id)
  );
  if (blocked) {
    return fail(data, `No se puede quitar "${blocked.name}" porque tiene equipos asociados.`);
  }

  const withoutChildren = data.sports
    .filter((sport) => sport.parentId !== current.id)
    .map((sport) =>
      sport.id === current.id
        ? { ...sport, name, category, description, status: input.status }
        : sport
    );
  const rebuilt: Sport[] = [];
  for (const sub of uniqueSubs) {
    const existing = data.sports.find(
      (sport) => sport.parentId === current.id && sameName(sport.name, sub)
    );
    if (existing) {
      rebuilt.push({ ...existing, name: sub, category, status: input.status });
      continue;
    }
    rebuilt.push({
      id: uid("dep"),
      code: nextCode([...withoutChildren, ...rebuilt], "DEP"),
      name: sub,
      category,
      description: `Subdeporte de ${name}.`,
      status: input.status,
      parentId: current.id,
      createdAt: todayIso(),
    });
  }

  return ok(
    { ...data, sports: [...withoutChildren, ...rebuilt] },
    "El deporte se actualizó correctamente.",
    current.id
  );
}

export function deleteSport(data: CatalogData, id: string): Mutation {
  const sport = data.sports.find((item) => item.id === id && item.parentId === null);
  if (!sport) {
    return fail(data, "No se encontró el deporte.");
  }
  const family = data.sports
    .filter((item) => item.id === id || item.parentId === id)
    .map((item) => item.id);
  if (data.teamSports.some((link) => family.includes(link.sportId))) {
    return fail(data, `No se puede eliminar "${sport.name}" porque tiene equipos asociados.`);
  }
  return ok(
    {
      ...data,
      sports: data.sports.filter((item) => !family.includes(item.id)),
      players: data.players.map((player) =>
        family.includes(player.preferredSportId) ? { ...player, preferredSportId: "" } : player
      ),
    },
    `Se eliminó "${sport.name}".`
  );
}

export function saveTeam(data: CatalogData, input: TeamInput): Mutation {
  const name = normalize(input.name);
  const shortName = normalize(input.shortName);
  const city = normalize(input.city);
  const description = input.description.trim();
  if (!name || !shortName || !city) {
    return fail(data, "Completa los campos obligatorios.");
  }
  if (
    data.teams.some((team) => team.id !== input.id && sameName(team.name, name))
  ) {
    return fail(data, "Ya existe un equipo con este nombre.");
  }

  if (!input.id) {
    const team: Team = {
      id: uid("eq"),
      code: nextCode(data.teams, "EQ"),
      name,
      shortName,
      city,
      description,
      status: input.status,
      createdAt: todayIso(),
      color: "#3dff7a",
    };
    return ok(
      { ...data, teams: [...data.teams, team] },
      "El equipo se registró correctamente.",
      team.id
    );
  }

  const current = data.teams.find((team) => team.id === input.id);
  if (!current) {
    return fail(data, "No se encontró el equipo.");
  }
  return ok(
    {
      ...data,
      teams: data.teams.map((team) =>
        team.id === current.id
          ? { ...team, name, shortName, city, description, status: input.status }
          : team
      ),
    },
    "El equipo se actualizó correctamente.",
    current.id
  );
}

export function deleteTeam(data: CatalogData, id: string): Mutation {
  const team = data.teams.find((item) => item.id === id);
  if (!team) {
    return fail(data, "No se encontró el equipo.");
  }
  if (data.contracts.some((contract) => contract.teamId === id)) {
    return fail(
      data,
      "No se puede eliminar el equipo porque tiene jugadores o competencias asociadas."
    );
  }
  if (data.teamSports.some((link) => link.teamId === id)) {
    return fail(
      data,
      "No se puede eliminar el equipo porque tiene deportes asociados. Retira las asociaciones primero."
    );
  }
  return ok(
    { ...data, teams: data.teams.filter((item) => item.id !== id) },
    `Se eliminó "${team.name}".`
  );
}

export function associateSport(data: CatalogData, teamId: string, sportId: string): Mutation {
  const team = data.teams.find((item) => item.id === teamId);
  const sport = data.sports.find((item) => item.id === sportId);
  if (!team || !sport) {
    return fail(data, "El equipo y el deporte deben existir.");
  }
  if (data.teamSports.some((link) => link.teamId === teamId && link.sportId === sportId)) {
    return fail(data, "Este deporte ya se encuentra asociado al equipo.");
  }
  return ok(
    { ...data, teamSports: [...data.teamSports, { teamId, sportId }] },
    `${sport.name} asociado correctamente.`
  );
}

export function removeSportAssociation(
  data: CatalogData,
  teamId: string,
  sportId: string
): Mutation {
  const sport = data.sports.find((item) => item.id === sportId);
  if (!data.teamSports.some((link) => link.teamId === teamId && link.sportId === sportId)) {
    return fail(data, "Esa asociación no existe.");
  }
  return ok(
    {
      ...data,
      teamSports: data.teamSports.filter(
        (link) => !(link.teamId === teamId && link.sportId === sportId)
      ),
    },
    `Se retiró la asociación${sport ? ` de ${sport.name}` : ""}. El equipo y el deporte siguen registrados.`
  );
}

function closeContract(contract: Contract, reason: string, detail: string): Contract {
  const today = todayIso();
  const endDate = contract.startDate > today ? contract.startDate : today;
  return {
    ...contract,
    status: "finalizado",
    endReason: reason,
    detail,
    endDate,
  };
}

function openContract(playerId: string, teamId: string, startDate: string, endDate: string): Contract {
  return {
    id: uid("con"),
    playerId,
    teamId,
    startDate,
    endDate,
    status: "activo",
    endReason: null,
    detail: null,
  };
}

export function savePlayer(data: CatalogData, input: PlayerInput): Mutation {
  const fullName = normalize(input.fullName);
  const document = normalize(input.document);
  const nationality = normalize(input.nationality);
  const position = normalize(input.position);
  const dominantFoot = normalize(input.dominantFoot);
  const email = input.email.trim();
  const phone = input.phone.trim();
  if (!fullName || !document || !nationality || !position || !dominantFoot) {
    return fail(data, "Completa los campos obligatorios.");
  }
  if (!Number.isFinite(input.age) || input.age < 15 || input.age > 50) {
    return fail(data, "La edad debe estar entre 15 y 50 años.");
  }
  if (!Number.isFinite(input.heightM) || input.heightM < 1.4 || input.heightM > 2.3) {
    return fail(data, "La altura debe estar entre 1.40 m y 2.30 m.");
  }
  if (email && !email.includes("@")) {
    return fail(data, "El correo no tiene un formato válido.");
  }
  if (
    input.preferredSportId &&
    !data.sports.some((sport) => sport.id === input.preferredSportId)
  ) {
    return fail(data, "El deporte preferido no existe.");
  }
  if (
    data.players.some(
      (player) => player.id !== input.id && sameName(player.document, document)
    )
  ) {
    return fail(data, "Ya existe un jugador registrado con este número de documento.");
  }
  if (input.teamId && !data.teams.some((team) => team.id === input.teamId)) {
    return fail(data, "El equipo seleccionado no existe.");
  }

  const current = input.id ? data.players.find((player) => player.id === input.id) : undefined;
  if (input.id && !current) {
    return fail(data, "No se encontró el jugador.");
  }

  const player: Player = {
    id: current?.id ?? uid("jug"),
    fullName,
    document,
    age: input.age,
    nationality,
    position,
    heightM: input.heightM,
    dominantFoot,
    status: input.status,
    email,
    phone,
    preferredSportId: input.preferredSportId,
    stats: current?.stats ?? { matches: 0, goals: 0, assists: 0, rating: 0 },
  };

  let contracts = data.contracts;
  const active = contracts.find(
    (contract) => contract.playerId === player.id && contract.status === "activo"
  );
  if (!input.teamId && active) {
    contracts = contracts.map((contract) =>
      contract.id === active.id
        ? closeContract(contract, "Transferido", "Retirado de la plantilla")
        : contract
    );
  } else if (input.teamId && active && active.teamId !== input.teamId) {
    const destination = data.teams.find((team) => team.id === input.teamId);
    contracts = contracts.map((contract) =>
      contract.id === active.id
        ? closeContract(
            contract,
            "Transferido",
            `Transferido a ${destination?.name ?? "otro equipo"}`
          )
        : contract
    );
    const start = todayIso();
    contracts = [...contracts, openContract(player.id, input.teamId, start, addYears(start, 1))];
  } else if (input.teamId && !active) {
    const start = todayIso();
    contracts = [...contracts, openContract(player.id, input.teamId, start, addYears(start, 1))];
  }

  const players = current
    ? data.players.map((item) => (item.id === player.id ? player : item))
    : [...data.players, player];

  return ok(
    { ...data, players, contracts },
    current ? "El jugador se actualizó correctamente." : "El jugador se registró correctamente.",
    player.id
  );
}

export function deletePlayer(data: CatalogData, id: string): Mutation {
  const player = data.players.find((item) => item.id === id);
  if (!player) {
    return fail(data, "No se encontró el jugador.");
  }
  if (data.contracts.some((contract) => contract.playerId === id)) {
    return fail(
      data,
      "No se puede eliminar el jugador porque tiene equipos con información deportiva asociada."
    );
  }
  return ok(
    {
      ...data,
      players: data.players.filter((item) => item.id !== id),
      playerSkills: data.playerSkills.filter((link) => link.playerId !== id),
    },
    `Se eliminó a ${player.fullName}.`
  );
}

export function assignContract(data: CatalogData, input: AssignContractInput): Mutation {
  const player = data.players.find((item) => item.id === input.playerId);
  const team = data.teams.find((item) => item.id === input.teamId);
  if (!player || !team) {
    return fail(data, "El jugador y el equipo deben existir.");
  }
  if (!input.startDate || !input.endDate) {
    return fail(data, "Indica la fecha de inicio y la fecha de fin del contrato.");
  }
  if (input.endDate < input.startDate) {
    return fail(data, "La fecha de fin debe ser igual o posterior a la de inicio.");
  }
  const active = data.contracts.find(
    (contract) => contract.playerId === player.id && contract.status === "activo"
  );
  if (active?.teamId === team.id) {
    return fail(data, "Este jugador ya se encuentra asociado al equipo.");
  }
  if (active) {
    const currentTeam = data.teams.find((item) => item.id === active.teamId);
    return fail(
      data,
      `El jugador ya pertenece a ${currentTeam?.name ?? "otro equipo"}. Retíralo de esa plantilla para asignarlo.`
    );
  }
  return ok(
    {
      ...data,
      contracts: [
        ...data.contracts,
        openContract(player.id, team.id, input.startDate, input.endDate),
      ],
    },
    `${player.fullName} quedó asignado a ${team.name}. Su historial anterior se conserva.`
  );
}

export function updateContract(
  data: CatalogData,
  contractId: string,
  startDate: string,
  endDate: string
): Mutation {
  const current = data.contracts.find((contract) => contract.id === contractId);
  if (!current) {
    return fail(data, "No se encontró la vinculación.");
  }
  if (!startDate || !endDate || endDate < startDate) {
    return fail(data, "Revisa las fechas del contrato.");
  }
  const finished = current.status === "activo" && endDate < todayIso();
  return ok(
    {
      ...data,
      contracts: data.contracts.map((contract) =>
        contract.id === contractId
          ? {
              ...contract,
              startDate,
              endDate,
              status: finished ? "finalizado" : contract.status,
              endReason: finished ? "Finalizó contrato" : contract.endReason,
              detail: finished ? "Fin del contrato acordado" : contract.detail,
            }
          : contract
      ),
    },
    "La vinculación se actualizó correctamente."
  );
}

export function releasePlayer(
  data: CatalogData,
  contractId: string,
  reason: string,
  detail: string
): Mutation {
  const current = data.contracts.find((contract) => contract.id === contractId);
  if (!current || current.status !== "activo") {
    return fail(data, "El jugador no tiene una vinculación activa para retirar.");
  }
  return ok(
    {
      ...data,
      contracts: data.contracts.map((contract) =>
        contract.id === contractId ? closeContract(contract, reason, detail) : contract
      ),
    },
    "El jugador dejó la plantilla actual. Su vinculación quedó en el historial."
  );
}

export function saveSkill(data: CatalogData, input: SkillInput): Mutation {
  const name = normalize(input.name);
  const description = input.description.trim();
  if (!name || !input.category || !description) {
    return fail(data, "Completa los campos obligatorios.");
  }
  if (data.skills.some((skill) => skill.id !== input.id && sameName(skill.name, name))) {
    return fail(data, "Ya existe una habilidad con este nombre.");
  }
  if (!input.id) {
    const skill: Skill = {
      id: uid("hab"),
      name,
      category: input.category,
      description,
      glyph: input.glyph ?? "target",
    };
    return ok(
      { ...data, skills: [...data.skills, skill] },
      "La habilidad se registró correctamente.",
      skill.id
    );
  }
  const current = data.skills.find((skill) => skill.id === input.id);
  if (!current) {
    return fail(data, "No se encontró la habilidad.");
  }
  return ok(
    {
      ...data,
      skills: data.skills.map((skill) =>
        skill.id === current.id ? { ...skill, name, category: input.category, description } : skill
      ),
    },
    "La habilidad se actualizó correctamente.",
    current.id
  );
}

export function deleteSkill(data: CatalogData, id: string): Mutation {
  const skill = data.skills.find((item) => item.id === id);
  if (!skill) {
    return fail(data, "No se encontró la habilidad.");
  }
  const assigned = data.playerSkills.filter((link) => link.skillId === id).length;
  if (assigned > 0) {
    return fail(
      data,
      `No se puede eliminar "${skill.name}" porque está asignada a ${assigned} ${assigned === 1 ? "jugador" : "jugadores"}.`
    );
  }
  return ok(
    { ...data, skills: data.skills.filter((item) => item.id !== id) },
    `Se eliminó "${skill.name}".`
  );
}

export function assignSkill(data: CatalogData, playerId: string, skillId: string): Mutation {
  const player = data.players.find((item) => item.id === playerId);
  const skill = data.skills.find((item) => item.id === skillId);
  if (!player || !skill) {
    return fail(data, "El jugador y la habilidad deben existir.");
  }
  if (data.playerSkills.some((link) => link.playerId === playerId && link.skillId === skillId)) {
    return fail(data, "Esta habilidad ya se encuentra asignada al jugador.");
  }
  const seed = `${playerId}:${skillId}`
    .split("")
    .reduce((total, char) => total + char.charCodeAt(0), 0);
  return ok(
    {
      ...data,
      playerSkills: [...data.playerSkills, { playerId, skillId, score: 68 + (seed % 28) }],
    },
    "Habilidad asignada correctamente."
  );
}

export function removePlayerSkill(data: CatalogData, playerId: string, skillId: string): Mutation {
  if (!data.playerSkills.some((link) => link.playerId === playerId && link.skillId === skillId)) {
    return fail(data, "El jugador no tiene esa habilidad.");
  }
  return ok(
    {
      ...data,
      playerSkills: data.playerSkills.filter(
        (link) => !(link.playerId === playerId && link.skillId === skillId)
      ),
    },
    "Se retiró la habilidad del jugador. La habilidad sigue en el catálogo."
  );
}
