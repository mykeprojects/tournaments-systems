import type { TrackingBoard, TrackingPositionUpdate } from "../../models/matches";

export type TrackingEvent = TrackingBoard | TrackingPositionUpdate;

export type TrackingConnectionState =
  | "CONNECTING"
  | "CONNECTED"
  | "RECONNECTING"
  | "DISCONNECTED";

export function isTrackingBoard(event: TrackingEvent): event is TrackingBoard {
  return "teams" in event && "field" in event;
}

export function applyTrackingPosition(
  board: TrackingBoard,
  update: TrackingPositionUpdate,
): TrackingBoard {
  if (board.matchId !== update.matchId) return board;

  if (update.subjectType === "BALL") {
    if (update.ballId != null && update.ballId !== board.ball.id) return board;
    return { ...board, ball: { ...board.ball, x: update.x, y: update.y } };
  }

  if (update.playerId == null) return board;
  let foundPlayer = false;
  const teams = board.teams.map((team) => ({
    ...team,
    players: team.players.map((player) => {
      if (player.playerId !== update.playerId) return player;
      foundPlayer = true;
      return { ...player, x: update.x, y: update.y };
    }),
  }));
  return foundPlayer ? { ...board, teams } : board;
}
