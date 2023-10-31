import { createContext } from "react";

export const AuthenticationContext = createContext({
  authenticatedUserID: null,
  setAuthenticatedUserID: (value: number) => {},
});
