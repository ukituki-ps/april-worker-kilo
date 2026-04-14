import type { ComponentType } from "react";
import type { ShellUserContext } from "./types";
import { BrokenWidget, OverviewWidget, RolesWidget } from "./widgets";

export type WidgetComponent = ComponentType<{ context: ShellUserContext }>;

export type CompositionModule = {
  id: string;
  title: string;
  requiresRole?: string;
  loader: () => Promise<{ default: WidgetComponent }>;
};

const staticLoad = (component: WidgetComponent) => async () => ({ default: component });

export const shellRegistry: CompositionModule[] = [
  {
    id: "overview",
    title: "Overview",
    loader: staticLoad(OverviewWidget),
  },
  {
    id: "roles",
    title: "Roles",
    loader: staticLoad(RolesWidget),
  },
  {
    id: "admin-control",
    title: "Admin control",
    requiresRole: "admin",
    loader: staticLoad(BrokenWidget),
  },
];
