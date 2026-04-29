import { describe, expect, it } from "vitest";
import { matchShellRoute } from "./shell-paths";

describe("matchShellRoute", () => {
  it("matches auth-only shell routes", () => {
    expect(matchShellRoute("/")).toEqual({ kind: "redirect" });
    expect(matchShellRoute("/app")).toEqual({ kind: "home" });
    expect(matchShellRoute("/app/overview")).toEqual({ kind: "not-found" });
    expect(matchShellRoute("/app/profile/entities")).toEqual({ kind: "not-found" });
    expect(matchShellRoute("/app/any-legacy-route")).toEqual({ kind: "not-found" });
  });
});
