import { describe, expect, it } from "vitest";
import { matchShellRoute } from "./shell-paths";

describe("matchShellRoute", () => {
  it("matches overview and profile entity tabs", () => {
    expect(matchShellRoute("/")).toEqual({ kind: "redirect" });
    expect(matchShellRoute("/app/overview")).toEqual({ kind: "overview" });
    expect(matchShellRoute("/app/profile/entities/e1")).toEqual({
      kind: "profile-entity",
      entityId: "e1",
      tab: "card",
    });
    expect(matchShellRoute("/app/profile/entities/e1/meta")).toEqual({
      kind: "profile-entity",
      entityId: "e1",
      tab: "meta",
    });
    expect(matchShellRoute("/app/profile/instances/i1")).toEqual({
      kind: "profile-instance",
      instanceId: "i1",
    });
  });
});
