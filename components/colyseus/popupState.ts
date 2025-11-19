import { create } from "zustand";
export enum EPopupName{
  TowCard= "TowCard",
  CountdownPopup = "CountdownPopup",
  CardPlayerSelectedPopup = "CardPlayerSelectedPopup",
  CardSelectedPopup = "CardSelectedPopup",
}
export interface PopupState {
    activePopup: string | null;
    openPopup: (name: EPopupName) => void;
    closePopup: (name: EPopupName) => void;
  }
  
  export const usePopupStore = create<PopupState>((set) => ({
    activePopup: null,
    openPopup: (name) => set({ activePopup: name }),
    closePopup: (name) => set({ activePopup: null }),
  }));


