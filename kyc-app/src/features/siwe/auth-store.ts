import type { AuthenticationStatus } from "@rainbow-me/rainbowkit";
import { atom, createStore } from "jotai";

type AuthState = {
  status: AuthenticationStatus;
  verified: boolean;
};

export const authStateAtom = atom<AuthState>({
  status: "unauthenticated",
  verified: false,
});

export const authStore = createStore();

export const authActions = {
  login: (verified = false) =>
    authStore.set(authStateAtom, {
      status: "authenticated",
      verified,
    }),
  logout: () =>
    authStore.set(authStateAtom, {
      status: "unauthenticated",
      verified: false,
    }),
};
