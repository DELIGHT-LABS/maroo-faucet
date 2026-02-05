import type { AuthenticationStatus } from "@rainbow-me/rainbowkit";
import { atom, createStore } from "jotai";

export const authStatusAtom = atom<AuthenticationStatus>("unauthenticated");

export const authStore = createStore();

export const authActions = {
  login: () => authStore.set(authStatusAtom, "authenticated"),
  logout: () => authStore.set(authStatusAtom, "unauthenticated"),
  setStatus: (status: AuthenticationStatus) =>
    authStore.set(authStatusAtom, status),
};
