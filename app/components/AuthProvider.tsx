"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { User, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut as firebaseSignOut } from "firebase/auth";
import { auth } from "../lib/firebase/client";
import { toast } from "sonner";
import { bootstrapUser } from "../actions/auth";

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          // Call Server Action to bootstrap user instead of client-side Firestore write
          await bootstrapUser(currentUser.uid);
        } catch (error) {
          console.error("Failed to bootstrap user:", error);
        }
      }
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = useCallback(async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      await signInWithPopup(auth, provider);
    } catch (error: unknown) {
      console.error("Sign in failed", error);
      toast.error(`عذراً، فشل تسجيل الدخول: ${error instanceof Error ? error.message : "خطأ غير معروف"} - جرب استخدام متصفح آخر أو إيقاف مانع النوافذ المنبثقة`);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error: unknown) {
      console.error("Sign out failed", error);
      toast.error("حدث خطأ أثناء محاولة تسجيل الخروج.");
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
