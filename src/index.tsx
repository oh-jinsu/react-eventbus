import React from "react";
import { createContext, useContext } from "react";

export function createEventBusContext<TEventMap>() {
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
  const EventbusContext = createContext<EventbusContextProps | null>(null);

  const useEventbus = () => {
    const context = useContext(EventbusContext);

    if (!context) {
      throw new Error("useChannel must be used within a ChannelProvider");
    }

    return context;
  };

  function EventbusProvider({ children }: { children: React.ReactNode }) {
    const listeners = new Map<keyof TEventMap, Set<(payload: never) => void>>();

    const subscribe = <T extends keyof TEventMap>(
      type: T,
      callback: (payload: TEventMap[T]) => void
    ) => {
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

    const dispatch = <T extends keyof TEventMap>(
      type: T,
      payload: TEventMap[T]
    ) => {
      const set = listeners.get(type);

      if (set) {
        set.forEach((callback) => callback(payload as never));
      }
    };

    const value = {
      dispatch,
      subscribe,
    };

    return (
      <EventbusContext.Provider value={value}>
        {children}
      </EventbusContext.Provider>
    );
  }

  return {
    useEventbus,
    EventbusProvider,
  };
}
