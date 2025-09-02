import React, { useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import { AuthContext } from "./useAuth";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });
    return unsubscribe;
  }, []);

  // ✅ Updated signup
  const signup = async (
    email: string,
    password: string,
    name?: string
  ): Promise<User> => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);

    // Update name in Firebase Auth
    if (name) {
      await updateProfile(cred.user, { name });
    }

    // Create Firestore profile
    await setDoc(doc(db, "profiles", cred.user.uid), {
      email: cred.user.email,
      name: name || null,
      createdAt: new Date().toISOString(),
    });

    return cred.user;
  };

  const login = async (email: string, password: string): Promise<User> => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  };

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
