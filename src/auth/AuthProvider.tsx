import React, { useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import { AuthContext } from "./useAuth";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });
    return unsubscribe;
  }, []);

  const signup = async (email: string, password: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, "profiles", cred.user.uid), {
      email: cred.user.email,
      createdAt: new Date().toISOString(),
    });
  };

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = () => signOut(auth);

  return <AuthContext.Provider value={{ user, signup, login, logout }}>{children}</AuthContext.Provider>;
};
