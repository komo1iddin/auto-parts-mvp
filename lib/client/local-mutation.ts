"use client";

export const LOCAL_MUTATION_STORAGE_KEY = "app:last-local-mutation-at";
export const LOCAL_MUTATION_SUPPRESS_MS = 2500;

export function markLocalMutation() {
  window.sessionStorage.setItem(LOCAL_MUTATION_STORAGE_KEY, String(Date.now()));
}

export function wasRecentLocalMutation() {
  const value = Number(window.sessionStorage.getItem(LOCAL_MUTATION_STORAGE_KEY) ?? 0);
  return Number.isFinite(value) && Date.now() - value < LOCAL_MUTATION_SUPPRESS_MS;
}
