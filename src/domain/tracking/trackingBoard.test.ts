import { describe, expect, it } from "vitest";
import type { TrackingBoard } from "../../models/matches";
import { applyTrackingPosition } from "./trackingBoard";

const board: TrackingBoard = {
  matchId: 10,
  sessionId: 20,
  sportId: 1,
  sportName: "Fútbol",
  playersPerTeam: 1,
  field: { width: 105, height: 68 },
  status: "RUNNING",
  teams: [
    {
      side: "HOME",
      teamId: 1,
      teamName: "Local",
      color: "#00aa55",
      players: [{ playerId: 7, name: "Jugador", position: "Delantero", jerseyNumber: 9, x: 10, y: 20 }],
    },
    { side: "AWAY", teamId: 2, teamName: "Visitante", color: "#0055aa", players: [] },
  ],
  ball: { id: 4, name: "Pelota oficial", x: 52.5, y: 34 },
};

describe("tracking board updates", () => {
  it("moves only the player identified by a player update", () => {
    const updated = applyTrackingPosition(board, {
      matchId: 10,
      subjectType: "PLAYER",
      playerId: 7,
      x: 36,
      y: 42,
      recordedAt: "2026-11-18T18:00:00.000Z",
    });

    expect(updated.teams[0].players[0]).toMatchObject({ x: 36, y: 42 });
    expect(updated.ball).toEqual(board.ball);
    expect(updated.teams[1]).toEqual(board.teams[1]);
  });

  it("moves the matching ball independently from players", () => {
    const updated = applyTrackingPosition(board, {
      matchId: 10,
      subjectType: "BALL",
      ballId: 4,
      x: 60,
      y: 30,
      recordedAt: "2026-11-18T18:00:00.000Z",
    });

    expect(updated.ball).toMatchObject({ x: 60, y: 30 });
    expect(updated.teams).toEqual(board.teams);
  });

  it("ignores updates for another match or unknown subjects", () => {
    expect(
      applyTrackingPosition(board, {
        matchId: 11,
        subjectType: "BALL",
        x: 60,
        y: 30,
        recordedAt: "2026-11-18T18:00:00.000Z",
      }),
    ).toBe(board);
    expect(
      applyTrackingPosition(board, {
        matchId: 10,
        subjectType: "PLAYER",
        playerId: 99,
        x: 60,
        y: 30,
        recordedAt: "2026-11-18T18:00:00.000Z",
      }),
    ).toBe(board);
  });
});
