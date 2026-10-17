import type { User as FirebaseUser } from "firebase/auth";
import type { AppUser } from "../domain/auth";

const API_BASE_URL = import.meta.env.VITE_API_URL;

export const fetchUserProfile = async (firebaseUser: FirebaseUser): Promise<AppUser> => {
  const token = await firebaseUser.getIdToken();

  const response = await fetch(`${API_BASE_URL}/users/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Error en el backend (${response.status}): ${response.statusText}`);
  }

  const backendData = await response.json();

  return Object.assign(firebaseUser, {
    role: backendData.role,
  }) as AppUser;
};