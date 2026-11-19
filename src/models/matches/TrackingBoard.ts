export type TrackingBoard = {
  matchId: number;
  sessionId: number;
  sportId: number | null;
  sportName: string;
  playersPerTeam: number;
  field: { width: number; height: number };
  status: "RUNNING" | "STOPPED";
  teams: {
    side: "HOME" | "AWAY";
    teamId: number;
    teamName: string;
    color: string;
    players: {
      playerId: number;
      name: string;
      position: string;
      jerseyNumber: number;
      x: number;
      y: number;
    }[];
  }[];
  ball: { id: number; name: string; x: number; y: number };
};
