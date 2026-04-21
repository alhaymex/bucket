import { create } from "zustand";

type AuthFlowState = {
  email: string | null;
  setEmail: (email: string) => void;
  clearEmail: () => void;
};

export const useAuthFlowStore = create<AuthFlowState>((set) => ({
  email: null,
  setEmail: (email) => set({ email }),
  clearEmail: () => set({ email: null }),
}));
