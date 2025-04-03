import React, { useEffect } from "react";
import { createContext, useContext } from "react";

export type EventbusContextProps<TEventMap> = {
  dispatch: <T extends keyof TEventMap>(type: T, payload: TEventMap[T]) => void;
  subscribe: <T extends keyof TEventMap>(
    type: T,
    callback: (payload: TEventMap[T]) => void
  ) => () => void;
};

export function createEventbusContext<TEventMap>() {
  type EventbusContextProps = {
    dispatch: <T extends keyof TEventMap>(
      type: T,
      payload: TEventMap[T]
    ) => void;
    subscribe: <T extends keyof TEventMap>(
      type: T,
      callback: (payload: TEventMap[T]) => void
    ) => () => void;
  };

  const Context = createContext<EventbusContextProps>(null as never);

  const useEventbusContext = () => useContext(Context);

  function useSubscribe<T extends keyof TEventMap>(
    type: T,
    fn: (payload: TEventMap[T]) => void
  ) {
    const { subscribe } = useEventbusContext();

    useEffect(() => {
      const unsubscribe = subscribe(type, fn);

      return () => unsubscribe();
    }, [type, fn]);
  }

  function Provider({ children }: { children: React.ReactNode }) {
    const listeners = new Map<keyof TEventMap, Set<(payload: never) => void>>();

    const subscribe: EventbusContextProps["subscribe"] = (type, callback) => {
      const set = listeners.get(type) || new Set();

      set.add(callback);

      listeners.set(type, set);

      return () => {
        set.delete(callback);

        if (set.size === 0) {
          listeners.delete(type);
        }
      };
    };

    const dispatch: EventbusContextProps["dispatch"] = (type, payload) => {
      const set = listeners.get(type);

      if (set) {
        set.forEach((callback) => callback(payload as never));
      }
    };

    const value = {
      dispatch,
      subscribe,
    };

    return <Context.Provider value={value}>{children}</Context.Provider>;
  }

  return {
    Context,
    useContext: useEventbusContext,
    useSubscribe,
    Provider,
  };
}
