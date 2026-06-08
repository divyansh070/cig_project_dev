"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Camera } from "lucide-react";
import { api } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      await api.post("/auth/register", {
        username,
        email,
        password,
        is_club_member: false
      });
      // After successful registration, redirect to login
      router.push("/login?registered=true");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to register. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-8 rounded-2xl w-full max-w-md relative z-10 border border-gray-200 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] bg-white/80"
      >
        <div className="flex justify-center mb-6">
          <div className="bg-gradient-to-tr from-primary to-blue-400 p-3 rounded-2xl shadow-[0_4px_20px_rgba(59,130,246,0.3)]">
            <Camera className="w-8 h-8 text-white" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-center mb-2 text-gray-900">Create Account</h1>
        <p className="text-gray-500 text-center mb-6">Join the photography platform</p>



        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 text-gray-900 transition-all shadow-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 text-gray-900 transition-all shadow-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 text-gray-900 transition-all shadow-sm"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-hover text-white font-medium py-2.5 rounded-lg transition-colors mt-6 shadow-[0_4px_14px_0_rgba(59,130,246,0.39)] hover:shadow-[0_6px_20px_rgba(59,130,246,0.23)]"
          >
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-gray-500">
          Already have an account? <a href="/login" className="text-primary hover:underline font-medium">Log in</a>
        </p>
      </motion.div>
    </div>
  );
}
