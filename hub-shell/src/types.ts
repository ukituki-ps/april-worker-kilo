export type UserProfile = {
  sub: string;
  username: string;
  email: string;
  name: string;
  roles: string[];
};

export type ShellUserContext = {
  user: UserProfile;
  roles: string[];
  orgScope: string;
  correlationId: string;
};

export type SharedViewState = "loading" | "empty" | "error" | "forbidden";
