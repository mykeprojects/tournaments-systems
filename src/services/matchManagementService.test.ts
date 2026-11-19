import { afterEach, describe, expect, it, vi } from "vitest";
import { sportClient } from "../infrastructure/backend/SportHttpClient";
import { matchManagementService } from "./matchManagementService";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("matchManagementService", () => {
  it("loads matches, annotations, and players from the backend resources", async () => {
    const get = vi.spyOn(sportClient, "get").mockResolvedValue({ data: [] } as never);

    await matchManagementService.listMatches();
    await matchManagementService.listAnnotations(12);
    await matchManagementService.listPlayersByTeam(34);

    expect(get).toHaveBeenNthCalledWith(1, "/matches");
    expect(get).toHaveBeenNthCalledWith(2, "/matches/12/annotations");
    expect(get).toHaveBeenNthCalledWith(3, "/players", { params: { teamId: 34 } });
  });

  it("registers an official result on the selected match", async () => {
    const patch = vi.spyOn(sportClient, "patch").mockResolvedValue({ data: {} } as never);

    await matchManagementService.registerResult(12, "HOME");

    expect(patch).toHaveBeenCalledWith("/matches/12/result", { officialResult: "HOME" });
  });

  it("creates, updates, and removes annotations within their match resource", async () => {
    const post = vi.spyOn(sportClient, "post").mockResolvedValue({ data: {} } as never);
    const patch = vi.spyOn(sportClient, "patch").mockResolvedValue({ data: {} } as never);
    const remove = vi.spyOn(sportClient, "delete").mockResolvedValue({} as never);
    const input = { playerId: 7, minute: 42, description: "Gol" };

    await matchManagementService.createAnnotation(12, input);
    await matchManagementService.updateAnnotation(12, 8, input);
    await matchManagementService.removeAnnotation(12, 8);

    expect(post).toHaveBeenCalledWith("/matches/12/annotations", input);
    expect(patch).toHaveBeenCalledWith("/matches/12/annotations/8", input);
    expect(remove).toHaveBeenCalledWith("/matches/12/annotations/8");
  });
});
