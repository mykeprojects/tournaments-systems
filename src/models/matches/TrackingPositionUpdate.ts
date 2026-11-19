export type TrackingPositionUpdate = {
  matchId: number;
  subjectType: "PLAYER" | "BALL";
  playerId?: number;
  ballId?: number;
  teamId?: number;
  x: number;
  y: number;
  recordedAt: string;
};
