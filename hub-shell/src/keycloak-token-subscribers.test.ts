import { describe, expect, it, vi } from "vitest";
import { notifyKeycloakTokenRotated, subscribeKeycloakTokenRotation } from "./keycloak-token-subscribers";

describe("keycloak-token-subscribers", () => {
  it("notifies subscribers and supports unsubscribe", () => {
    const a = vi.fn();
    const b = vi.fn();
    const unsubA = subscribeKeycloakTokenRotation(a);
    subscribeKeycloakTokenRotation(b);
    notifyKeycloakTokenRotated();
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);
    unsubA();
    notifyKeycloakTokenRotated();
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(2);
  });
});
