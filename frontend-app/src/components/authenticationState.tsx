import { createContext } from "react";

export const AuthenticationContext = createContext({
  userID: null,
  setUserID: (value: number) => {},
});
