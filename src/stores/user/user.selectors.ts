import { useUserStore } from "./user.config";

export const useEmailSelector = () => useUserStore((state: ZUSTAND.IUserState) => state.email);
export const useUserSetEmail = () => useUserStore((state: ZUSTAND.IUserState) => state.setEmail)