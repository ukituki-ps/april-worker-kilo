import { describe, expect, it } from "vitest";
import { matchShellRoute } from "./shell-paths";

describe("matchShellRoute", () => {
  it("matches profiles shell routes", () => {
    expect(matchShellRoute("/")).toEqual({ kind: "redirect" });
    expect(matchShellRoute("/app")).toEqual({ kind: "profiles-list" });
    expect(matchShellRoute("/app/profile/entities")).toEqual({ kind: "profiles-list" });
    expect(matchShellRoute("/app/profile/entities/e-1/card")).toEqual({ kind: "profile-entity", entityId: "e-1", tab: "card" });
    expect(matchShellRoute("/app/any-legacy-route")).toEqual({ kind: "not-found" });
  });
});
