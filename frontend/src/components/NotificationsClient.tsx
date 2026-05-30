"use client";

import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";
import { Bell, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function NotificationsClient() {
  const [notifications, setNotifications] = useState<{ id: string; message: string; isNew: boolean }[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Connect to WebSocket
    const wsUrl = API_URL.replace("http://", "ws://").replace("https://", "wss://") + "/notifications/ws";
        const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      const message = event.data;
      const newNotification = { id: Date.now().toString(), message, isNew: true };
      
      setNotifications((prev) => [newNotification, ...prev]);
      setUnreadCount((prev) => prev + 1);
      
      // Auto-remove "isNew" status after 5 seconds to clear the toast
      setTimeout(() => {
        setNotifications((prev) =>
          prev.map((n) => (n.id === newNotification.id ? { ...n, isNew: false } : n))
        );
      }, 5000);
    };

    return () => {
      ws.close();
    };
  }, []);

  const handleOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setUnreadCount(0); // Mark as read when opening
    }
  };

  const newToasts = notifications.filter((n) => n.isNew);

  return (
    <>
      {/* Global Toasts for incoming notifications */}
      <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {newToasts.map((toast) => (
            <motion.div
              key={`toast-${toast.id}`}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className="bg-gray-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 pointer-events-auto border border-gray-700/50"
            >
              <div className="bg-primary/20 p-2 rounded-full">
                <Bell className="w-4 h-4 text-primary-light" />
              </div>
              <p className="text-sm font-medium pr-4">{toast.message}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Floating Bell Icon for History */}
      <div className="fixed bottom-4 left-4 z-[60]">
        <button
          onClick={handleOpen}
          className="relative bg-white border border-gray-200 text-gray-800 p-3 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95 group"
        >
          <Bell className="w-6 h-6 text-gray-600 group-hover:text-primary transition-colors" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Notifications Dropdown Panel */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="absolute bottom-16 left-0 w-80 bg-white/90 backdrop-blur-xl border border-gray-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-primary" />
                  Activity Feed
                </h3>
                <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-900 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto p-2 space-y-1">
                {notifications.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-8">No notifications yet</p>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} className="p-3 hover:bg-gray-50 rounded-xl transition-colors">
                      <p className="text-sm text-gray-800">{n.message}</p>
                      <p className="text-[10px] text-gray-400 mt-1">Just now</p>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
