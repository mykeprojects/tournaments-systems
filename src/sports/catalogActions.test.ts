import { describe, expect, it } from "vitest";
import {
  assignContract,
  associateSport,
  deletePlayer,
  deleteSkill,
  deleteSport,
  deleteTeam,
  saveSport,
} from "./catalogActions";
import { initialCatalog } from "./seed";

describe("catálogo deportivo local", () => {
  it("rechaza un deporte con el mismo nombre", () => {
    const result = saveSport(initialCatalog, {
      name: "Fútbol",
      category: "Balón",
      description: "",
      status: "active",
      subsports: [],
    });

    expect(result.result.ok).toBe(false);
  });

  it("registra un deporte con subdeportes", () => {
    const result = saveSport(initialCatalog, {
      name: "Atletismo",
      category: "Atlética",
      description: "Pista y campo",
      status: "active",
      subsports: ["Marcha"],
    });

    expect(result.result.ok).toBe(true);
    if (!result.result.ok) {
      return;
    }
    const createdId = result.result.id;
    expect(result.data.sports.some((sport) => sport.name === "Atletismo")).toBe(true);
    expect(
      result.data.sports.some((sport) => sport.name === "Marcha" && sport.parentId === createdId)
    ).toBe(true);
  });

  it("no elimina un deporte que tiene equipos asociados", () => {
    const result = deleteSport(initialCatalog, "futbol");

    expect(result.result.ok).toBe(false);
    if (!result.result.ok) {
      expect(result.result.message).toContain("equipos asociados");
    }
  });

  it("no repite la asociación entre un equipo y un deporte", () => {
    const result = associateSport(initialCatalog, "atletico", "futbol");

    expect(result.result.ok).toBe(false);
  });

  it("no elimina un equipo con jugadores vinculados", () => {
    const result = deleteTeam(initialCatalog, "atletico");

    expect(result.result.ok).toBe(false);
    if (!result.result.ok) {
      expect(result.result.message).toContain("jugadores");
    }
  });

  it("no elimina un jugador con historial de equipos", () => {
    const result = deletePlayer(initialCatalog, "juan");

    expect(result.result.ok).toBe(false);
  });

  it("permite eliminar un jugador sin equipos", () => {
    const result = deletePlayer(initialCatalog, "laura");

    expect(result.result.ok).toBe(true);
    expect(result.data.players.some((player) => player.id === "laura")).toBe(false);
  });

  it("no asigna dos veces al mismo jugador en el equipo", () => {
    const result = assignContract(initialCatalog, {
      playerId: "juan",
      teamId: "atletico",
      startDate: "2026-05-01",
      endDate: "2027-05-01",
    });

    expect(result.result.ok).toBe(false);
    if (!result.result.ok) {
      expect(result.result.message).toContain("asociado");
    }
  });

  it("no elimina una habilidad asignada a jugadores", () => {
    const result = deleteSkill(initialCatalog, "velocidad");

    expect(result.result.ok).toBe(false);
    if (!result.result.ok) {
      expect(result.result.message).toContain("jugadores");
    }
  });
});
