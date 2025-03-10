import { atom } from 'jotai';

export const routesAtom = atom<string[]>(['home']);

export const prevRouteAtom = atom<string[]>([]);
