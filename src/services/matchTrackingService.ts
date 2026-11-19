import axios from "axios";
import { io, type Socket } from "socket.io-client";
import { sportClient } from "../infrastructure/backend/SportHttpClient";
import type { TrackingBoard, TrackingPositionUpdate } from "../models/matches";
import type { TrackingConnectionState, TrackingEvent } from "../domain/tracking/trackingBoard";

function isSessionNotStarted(error: unknown): boolean {
  if (!axios.isAxiosError(error) || error.response?.status !== 400) return false;
  const responseData: unknown = error.response.data;
  if (typeof responseData !== "object" || responseData === null || !("message" in responseData)) {
    return false;
  }
  return responseData.message === "The match tracking session was not started.";
}

function socketNamespaceUrl(): string {
  const baseURL = sportClient.defaults.baseURL ?? "http://localhost:3000";
  return `${baseURL.replace(/\/+$/, "")}/tracking`;
}

export const matchTrackingService = {
  async getBoard(matchId: number): Promise<TrackingBoard | null> {
    try {
      const response = await sportClient.get<TrackingBoard>(`/matches/${matchId}/tracking`);
      return response.data;
    } catch (error) {
      if (isSessionNotStarted(error)) return null;
      throw error;
    }
  },

  async start(matchId: number): Promise<TrackingBoard> {
    const response = await sportClient.post<TrackingBoard>(
      `/matches/${matchId}/tracking/start`,
      { simulationIntervalMs: 1000 },
    );
    return response.data;
  },

  async stop(matchId: number): Promise<TrackingBoard> {
    const response = await sportClient.post<TrackingBoard>(`/matches/${matchId}/tracking/stop`);
    return response.data;
  },

  subscribe(
    matchId: number,
    onUpdate: (event: TrackingEvent) => void,
    onConnectionChange: (state: TrackingConnectionState) => void,
  ): () => void {
    const socket: Socket = io(socketNamespaceUrl());

    const handleUpdate = (event: TrackingBoard | TrackingPositionUpdate) => {
      if (event.matchId === matchId) onUpdate(event);
    };
    const handleConnect = () => {
      socket.emit("tracking:join", { matchId });
      onConnectionChange("CONNECTED");
    };
    const handleDisconnect = () => onConnectionChange("DISCONNECTED");
    const handleConnectError = () => onConnectionChange("DISCONNECTED");
    const handleReconnectAttempt = () => onConnectionChange("RECONNECTING");

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);
    socket.on("tracking:update", handleUpdate);
    socket.io.on("reconnect_attempt", handleReconnectAttempt);

    return () => {
      if (socket.connected) socket.emit("tracking:leave", { matchId });
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
      socket.off("tracking:update", handleUpdate);
      socket.io.off("reconnect_attempt", handleReconnectAttempt);
      socket.disconnect();
    };
  },
};
