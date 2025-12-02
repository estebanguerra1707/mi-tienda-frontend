import { createContext } from "react";

export type Role = "SUPER_ADMIN" | "ADMIN" | "VENDOR";

export type User = {
  id?: number | null; 
  email: string | null;
  username: string | null;
  role: Role | null;
  branchId: number | null;
  businessType: number | null;
};

export type AuthCtx = {
  token: string | null;
  user: User | null; 
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};


export const AuthContext = createContext<AuthCtx | null>(null);

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}