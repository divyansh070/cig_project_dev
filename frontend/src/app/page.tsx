"use client";

import { motion } from "framer-motion";
import { Camera, Image as ImageIcon, Users, Shield } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <nav className="p-6 flex justify-between items-center max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <Camera className="w-8 h-8 text-primary" />
          <span className="text-xl font-bold tracking-tight">CaptureHub</span>
        </div>
        <div className="flex gap-4">
          <Link href="/login" className="px-5 py-2 rounded-full hover:bg-white/10 transition-colors font-medium">
            Log In
          </Link>
          <Link href="/register" className="px-5 py-2 bg-primary hover:bg-primary-hover rounded-full transition-colors font-medium text-white">
            Get Started
          </Link>
        </div>
      </nav>

      <main className="flex-grow flex flex-col items-center justify-center p-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl"
        >
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-gradient-to-br from-white to-white/50 bg-clip-text text-transparent leading-tight">
            The Ultimate Platform for Event Photography
          </h1>
          <p className="text-xl text-muted mb-10 max-w-2xl mx-auto leading-relaxed">
            Manage your event media with AI-powered tagging, seamless sharing, and enterprise-grade security. Built for organizers and photographers.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/register" className="px-8 py-4 bg-primary hover:bg-primary-hover text-white rounded-full font-semibold text-lg transition-all shadow-[0_0_40px_rgba(59,130,246,0.3)] hover:shadow-[0_0_60px_rgba(59,130,246,0.5)]">
              Start Organizing Free
            </Link>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full mt-24"
        >
          {[
            { icon: ImageIcon, title: "Smart Organization", desc: "Event-wise albums with AI-powered tagging and search." },
            { icon: Users, title: "Social Experience", desc: "Like, comment, share and connect with other members." },
            { icon: Shield, title: "Access Control", desc: "Granular permissions, private albums, and dynamic watermarks." }
          ].map((feature, i) => (
            <div key={i} className="glass-panel p-6 rounded-2xl text-left hover:bg-white/[0.02] transition-colors">
              <div className="bg-white/5 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-muted leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </motion.div>
      </main>
    </div>
  );
}
