import { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase/client";

export function useUserBalance(userId: string | undefined | null) {
  const [balance, setBalance] = useState<number | null>(null);
  const [isBalanceLoading, setIsBalanceLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBalance(null);
      setIsBalanceLoading(false);
      return;
    }

    setIsBalanceLoading(true);
    const userRef = doc(db, "users", userId);
    
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        setBalance(docSnap.data().balance || 0);
      } else {
        setBalance(0);
      }
      setIsBalanceLoading(false);
    }, (err) => {
      console.error("Error fetching balance snapshot:", err);
      setIsBalanceLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  return { balance, isBalanceLoading };
}
