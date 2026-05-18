"use client";

import { useEffect, useState } from "react";
import { collection, query, where, orderBy, onSnapshot, limit } from "firebase/firestore";
import { db } from "../lib/firebase/client";

export interface SystemNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  type: string;
  createdAt: any;
}

export function useUserNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SystemNotification[];
      
      setNotifications(data);
      setLoading(false);
    }, (error) => {
      console.error("Notifications Subscription Error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return { notifications, unreadCount, loading };
}
