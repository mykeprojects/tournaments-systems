import React, { createContext, useEffect, useState, useMemo } from "react";
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from "firebase/auth";
import type { AuthProvider } from "firebase/auth";
import { auth, authProviders } from "../firebaseConfig";
import type { AppUser } from "../domain/auth";
import { fetchUserProfile } from "../services/userService";

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  loginWithProvider: (providerName: keyof typeof authProviders) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithGitHub: () => Promise<void>;
  loginWithMicrosoft: () => Promise<void>;
  loginWithCredentials: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const enrichedUser = await fetchUserProfile(currentUser);
          setUser(enrichedUser);
        } catch (error) {
          console.error("Error al sincronizar perfil con el backend:", error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithProvider = async (providerName: keyof typeof authProviders) => {
    const provider: AuthProvider = authProviders[providerName];
    await signInWithPopup(auth, provider);
  };

  const loginWithGoogle = () => loginWithProvider("google");
  const loginWithGitHub = () => loginWithProvider("github");
  const loginWithMicrosoft = () => loginWithProvider("microsoft");

  const loginWithCredentials = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const logout = async () => {
    await firebaseSignOut(auth);
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      loginWithProvider,
      loginWithGoogle,
      loginWithGitHub,
      loginWithMicrosoft,
      loginWithCredentials,
      logout,
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};