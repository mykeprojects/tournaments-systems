import { getApp, getApps, initializeApp } from "firebase/app";
import {
  GithubAuthProvider,
  GoogleAuthProvider,
  OAuthProvider,
  getAuth,
} from "firebase/auth";

const requiredEnvironmentValue = (name: string): string => {
  const value = import.meta.env[name];

  if (!value) {
    throw new Error(`Falta la variable de entorno requerida: ${name}`);
  }

  return value;
};

const firebaseConfig = {
  apiKey: requiredEnvironmentValue("VITE_FIREBASE_API_KEY"),
  authDomain: requiredEnvironmentValue("VITE_FIREBASE_AUTH_DOMAIN"),
  projectId: requiredEnvironmentValue("VITE_FIREBASE_PROJECT_ID"),
  storageBucket: requiredEnvironmentValue("VITE_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: requiredEnvironmentValue("VITE_FIREBASE_MESSAGING_SENDER_ID"),
  appId: requiredEnvironmentValue("VITE_FIREBASE_APP_ID"),
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const authProviders = {
  google: new GoogleAuthProvider(),
  github: new GithubAuthProvider(),
  microsoft: new OAuthProvider("microsoft.com"),
};
