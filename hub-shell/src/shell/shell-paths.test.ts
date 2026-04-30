import { describe, expect, it } from "vitest";
import { matchShellRoute } from "./shell-paths";

describe("matchShellRoute", () => {
  it("matches profiles shell routes", () => {
    expect(matchShellRoute("/")).toEqual({ kind: "redirect" });
    expect(matchShellRoute("/app")).toEqual({ kind: "profiles-list" });
    expect(matchShellRoute("/app/profile/entities")).toEqual({ kind: "profiles-list" });
    expect(matchShellRoute("/app/profile/entity-types")).toEqual({ kind: "entity-types-list" });
    expect(matchShellRoute("/app/overview")).toEqual({ kind: "not-found" });
    expect(matchShellRoute("/app/any-legacy-route")).toEqual({ kind: "not-found" });
  });
});
