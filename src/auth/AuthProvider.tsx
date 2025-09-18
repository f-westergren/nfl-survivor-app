import React, { useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
  browserLocalPersistence,
  setPersistence,
} from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import { AuthContext } from "./useAuth";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set persistence and initialize auth listener
    const initializeAuth = async () => {
      try {
        // Set persistence first - this is crucial for maintaining login state
        await setPersistence(auth, browserLocalPersistence);
      } catch (error) {
        console.error("❌ Error setting persistence:", error);
      }

      // Now listen for auth state changes
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        setUser(firebaseUser);
        setLoading(false);
      });

      return unsubscribe;
    };

    let unsubscribe: (() => void) | undefined;

    initializeAuth().then((unsub) => {
      unsubscribe = unsub;
    });

    // Cleanup function
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const signup = async (
    email: string,
    password: string,
    displayName?: string
  ): Promise<User> => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);

      // Update displayName in Firebase Auth
      if (displayName) {
        await updateProfile(cred.user, { displayName });
      }

      // Create Firestore profile
      await setDoc(doc(db, "profiles", cred.user.uid), {
        email: cred.user.email,
        displayName: displayName || null,
        createdAt: new Date().toISOString(),
      });
      return cred.user;
    } catch (error) {
      console.error("❌ Signup error:", error);
      throw error;
    }
  };

  const login = async (email: string, password: string): Promise<User> => {
    try {
      // Note: We already set persistence in useEffect, but it's safe to set it again
      await setPersistence(auth, browserLocalPersistence);
      const cred = await signInWithEmailAndPassword(auth, email, password);
      return cred.user;
    } catch (error) {
      console.error("❌ Login error:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("❌ Logout error:", error);
      throw error;
    }
  };

  // Don't render children until we know the auth state
  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        Loading...
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, signup, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
