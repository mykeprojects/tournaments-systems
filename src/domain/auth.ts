import type { User as FirebaseUser } from "firebase/auth";

export type AppRole = "ADMIN" | "USER" | "EDITOR"; // Tus roles

export interface AppUser extends FirebaseUser {
    role: AppRole;
}