import { prevRouteAtom, routesAtom } from '@/stores/route';
import { useAtom } from 'jotai';

export function useRoutes() {
  const [routes, setRoutes] = useAtom(routesAtom);
  const [prevRoutes, setPrevRoutes] = useAtom(prevRouteAtom);

  function push(route: string) {
    setRoutes((prev) => [...prev, route]);
    return route;
  }

  function pop() {
    const poppedRoute = routes[routes.length - 1];
    setRoutes((prev) => prev.slice(0, -1));
    setPrevRoutes((prev) => [...prev, poppedRoute]);
    return poppedRoute;
  }

  function replace(route: string) {
    setRoutes((prev) => [...prev.slice(0, -1), route]);
    return route;
  }

  function go(route: string) {
    return push(route);
  }

  function back() {
    return pop();
  }

  function forward() {
    const prevRoute = prevRoutes[prevRoutes.length - 1];
    setPrevRoutes((prev) => prev.slice(0, -1));
    setRoutes((prev) => [...prev.slice(0, -1), prevRoute]);
    return prevRoute;
  }

  return {
    routes,
    current: routes[routes.length - 1],
    push,
    pop,
    replace,
    go,
    back,
    forward,
  };
}
