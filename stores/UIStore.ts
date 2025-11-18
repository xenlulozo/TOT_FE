"use client";
import { create } from "zustand";

interface UIStore {
  popup: string | null;
  openPopup: (name: string) => void;
  closePopup: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  popup: null,
  openPopup: (name: string) => set({ popup: name }),
  closePopup: () => set({ popup: null }),
}));
