import { describe, expect, it } from "vitest";
import { matchShellRoute } from "./shell-paths";

describe("matchShellRoute", () => {
<<<<<<< HEAD
  it("matches auth-only shell routes", () => {
=======
  it("matches minimal authorized shell routes", () => {
>>>>>>> parent of 41f02aa (Merge pull request #74 from ukituki-ps/feature/045-profiles-sidebar-widget)
    expect(matchShellRoute("/")).toEqual({ kind: "redirect" });
    expect(matchShellRoute("/app")).toEqual({ kind: "home" });
    expect(matchShellRoute("/app/overview")).toEqual({ kind: "not-found" });
    expect(matchShellRoute("/app/profile/entities")).toEqual({ kind: "not-found" });
    expect(matchShellRoute("/app/any-legacy-route")).toEqual({ kind: "not-found" });
  });
});
