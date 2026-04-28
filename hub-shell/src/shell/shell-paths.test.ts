import { describe, expect, it } from "vitest";
import { matchShellRoute } from "./shell-paths";

describe("matchShellRoute", () => {
  it("matches minimal authorized shell routes", () => {
    expect(matchShellRoute("/")).toEqual({ kind: "redirect" });
    expect(matchShellRoute("/app/profile/entities")).toEqual({ kind: "profile-list" });
    expect(matchShellRoute("/app/overview")).toEqual({ kind: "not-found" });
    expect(matchShellRoute("/app/profile/entities/e1")).toEqual({ kind: "not-found" });
    expect(matchShellRoute("/app/profile/instances/i1")).toEqual({ kind: "not-found" });
  });
});
