import * as THREE from "three";

// Registry of focusable objects keyed by name. Components register their
// THREE.Object3D ref so the camera can track them as they orbit.
export const focusRegistry = new Map<string, THREE.Object3D>();

type Listener = (name: string | null) => void;
const listeners = new Set<Listener>();
let current: string | null = null;

export const focusStore = {
  get(): string | null {
    return current;
  },
  set(name: string | null) {
    current = name;
    listeners.forEach((l) => l(current));
  },
  subscribe(l: Listener) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

import { useEffect, useState } from "react";
export function useFocus() {
  const [name, setName] = useState<string | null>(focusStore.get());
  useEffect(() => {
    const unsub = focusStore.subscribe(setName);
    return () => {
      unsub();
    };
  }, []);
  return [name, focusStore.set.bind(focusStore)] as const;
}

// Metadata for ideal viewing distance per registered object.
export const focusMeta = new Map<string, { distance: number }>();
