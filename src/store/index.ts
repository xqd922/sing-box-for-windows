import { create } from "zustand";

export type ServiceStatus = "stopped" | "starting" | "started" | "stopping";

interface LogEntry {
  id: number;
  level: string;
  message: string;
  timestamp: string;
}

interface Profile {
  id: string;
  name: string;
  type: "local" | "remote";
  path?: string;
  url?: string;
  lastUpdated?: string;
  active: boolean;
}

interface AppState {
  serviceStatus: ServiceStatus;
  logs: LogEntry[];
  profiles: Profile[];
  activeProfileId: string | null;

  setServiceStatus: (status: ServiceStatus) => void;
  addLog: (log: LogEntry) => void;
  clearLogs: () => void;
  setProfiles: (profiles: Profile[]) => void;
  setActiveProfile: (id: string) => void;
}

export const useStore = create<AppState>((set) => ({
  serviceStatus: "stopped",
  logs: [],
  profiles: [],
  activeProfileId: null,

  setServiceStatus: (status) => set({ serviceStatus: status }),
  addLog: (log) =>
    set((state) => ({
      logs: [...state.logs.slice(-2999), log],
    })),
  clearLogs: () => set({ logs: [] }),
  setProfiles: (profiles) => set({ profiles }),
  setActiveProfile: (id) => set({ activeProfileId: id }),
}));
