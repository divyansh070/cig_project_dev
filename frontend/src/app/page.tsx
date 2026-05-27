"use client";

import { motion } from "framer-motion";
import { Camera, Image as ImageIcon, Users, Shield, Sparkles, ArrowRight, Aperture } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <nav className="p-6 flex justify-between items-center max-w-7xl mx-auto w-full relative z-10">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <div className="bg-gradient-to-tr from-primary to-blue-400 p-2 rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.3)]">
            <Camera className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
            CaptureHub
          </span>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-6"
        >
          <Link href="/login" className="text-sm font-medium text-white/70 hover:text-white transition-colors">
            Log In
          </Link>
          <Link href="/register" className="group relative px-6 py-2.5 rounded-full overflow-hidden">
            <div className="absolute inset-0 bg-primary hover:bg-primary-hover transition-colors" />
            <div className="relative flex items-center gap-2 text-sm font-semibold text-white">
              Get Started
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </motion.div>
      </nav>

      <main className="flex-grow flex flex-col items-center justify-center p-6 text-center relative z-10 mt-10 md:mt-0">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-4xl w-full flex flex-col items-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-md">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-white/80">The new standard for event photography</span>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black tracking-tight mb-8 leading-[1.1]">
            Curate your moments with <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-400 to-purple-500">Intelligent</span> vision.
          </h1>
          
          <p className="text-xl md:text-2xl text-muted mb-12 max-w-2xl mx-auto leading-relaxed font-light">
            An exclusive platform for modern photography clubs. Featuring AI-powered facial recognition, dynamic watermarks, and granular privacy controls.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/register" className="px-8 py-4 bg-primary text-white rounded-full font-semibold text-lg transition-all shadow-[0_0_30px_rgba(59,130,246,0.3)] hover:shadow-[0_0_50px_rgba(59,130,246,0.5)] hover:-translate-y-1 flex items-center gap-2 w-full sm:w-auto justify-center">
              Create an Account
            </Link>
            <Link href="/login" className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-full font-semibold text-lg transition-all hover:-translate-y-1 flex items-center gap-2 w-full sm:w-auto justify-center">
              Member Sign In
            </Link>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl w-full mt-32 mb-12"
        >
          {[
            { 
              icon: Aperture, 
              title: "Contextual Roles", 
              desc: "Granular, event-specific roles. Be an Admin for one shoot and a Viewer for another." 
            },
            { 
              icon: Users, 
              title: "Social Ecosystem", 
              desc: "Foster community with built-in discussions, likes, and seamless sharing capabilities." 
            },
            { 
              icon: Shield, 
              title: "Enterprise Privacy", 
              desc: "Military-grade access controls ensuring private events remain completely invisible to the public." 
            }
          ].map((feature, i) => (
            <div key={i} className="group relative glass-panel p-8 rounded-3xl text-left border border-white/5 hover:border-primary/30 transition-all duration-500 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <div className="bg-white/5 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-500">
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted leading-relaxed text-lg">{feature.desc}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </main>
    </div>
  );
}
