"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, Calendar, Image as ImageIcon, MapPin, Loader2, Search } from "lucide-react";
import { api } from "@/lib/api";
import Link from "next/link";

interface Event {
  id: number;
  name: string;
  description: string;
  date: string;
  category: string;
  is_public: boolean;
}

export default function DashboardPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClubMember, setIsClubMember] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Create Event Form State
  const [newEvent, setNewEvent] = useState({ name: "", description: "", category: "", is_public: false });
  
  // Search & Sorting State
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("date_desc");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [userRes, eventsRes] = await Promise.all([
        api.get("/auth/me"),
        api.get("/events/")
      ]);
      setIsClubMember(userRes.data.is_club_member);
      setEvents(eventsRes.data);
    } catch (err) {
      console.error(err);
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/events/", newEvent);
      setShowCreateModal(false);
      setNewEvent({ name: "", description: "", category: "", is_public: false });
      fetchData(); // Refresh list
    } catch (err) {
      alert("Failed to create event. Ensure you have the right permissions.");
    }
  };

  const filteredAndSortedEvents = events
    .filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                 (e.category && e.category.toLowerCase().includes(searchQuery.toLowerCase())))
    .sort((a, b) => {
      if (sortBy === "date_desc") return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortBy === "date_asc") return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortBy === "name_asc") return a.name.localeCompare(b.name);
      if (sortBy === "category") return (a.category || "").localeCompare(b.category || "");
      return 0;
    });

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Events Dashboard</h1>
          <p className="text-muted">Welcome back! You are viewing as a <span className="text-primary font-medium">{isClubMember ? "Club Member" : "Standard User"}</span>.</p>
        </div>
        
        <div className="flex gap-4">
          <button 
            onClick={async () => {
              const username = prompt("Enter the username to promote to Club Member:");
              if (username) {
                try {
                  await api.put(`/auth/upgrade-role?username=${username}`);
                  alert(`Successfully promoted ${username} to Club Member!`);
                } catch (e) {
                  alert("Failed to promote user. Check username.");
                }
              }
            }}
            className="bg-green-500/20 hover:bg-green-500/30 text-green-400 px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg border border-green-500/20"
          >
            Add Member
          </button>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all shadow-lg shadow-primary/20"
          >
            <Plus className="w-5 h-5" />
            Create Event
          </button>
          <Link 
            href="/face-search"
            className="bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all shadow-lg border border-white/5"
          >
            <Search className="w-5 h-5" />
            Find Myself
          </Link>
          <button 
            onClick={() => {
              localStorage.removeItem("token");
              router.push("/login");
            }}
            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg border border-red-500/10"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Advanced Search & Sorting */}
      <div className="flex flex-col md:flex-row gap-4 mb-10">
        <input 
          type="text" 
          placeholder="Search events by name or category..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-grow bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary/50 text-sm"
        />
        <select 
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary/50 text-sm min-w-[200px]"
        >
          <option value="date_desc">Newest First</option>
          <option value="date_asc">Oldest First</option>
          <option value="name_asc">Name (A-Z)</option>
          <option value="category">Category</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAndSortedEvents.map((event) => (
          <Link href={`/event/${event.id}`} key={event.id}>
            <motion.div 
              whileHover={{ y: -5 }}
              className="glass-panel p-6 rounded-2xl cursor-pointer hover:border-primary/50 transition-all group"
            >
              <div className="bg-white/5 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <ImageIcon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">{event.name}</h3>
              <p className="text-muted text-sm mb-4 line-clamp-2">{event.description || "No description provided."}</p>
              
              <div className="flex items-center gap-4 text-xs font-medium text-muted">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(event.date).toLocaleDateString()}
                </div>
                {event.category && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {event.category}
                  </div>
                )}
                <div className={`px-2 py-0.5 rounded-full ml-auto ${event.is_public ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'}`}>
                  {event.is_public ? 'Public' : 'Private'}
                </div>
              </div>
            </motion.div>
          </Link>
        ))}
        {events.length === 0 && (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-white/10 rounded-2xl">
            <Calendar className="w-12 h-12 text-muted mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-medium mb-2">No events found</h3>
            <p className="text-muted">Create your first event to get started.</p>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-panel p-8 rounded-2xl w-full max-w-lg"
          >
            <h2 className="text-2xl font-bold mb-6">Create New Event</h2>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-muted">Event Name</label>
                <input
                  type="text"
                  value={newEvent.name}
                  onChange={(e) => setNewEvent({...newEvent, name: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-muted">Description</label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 text-white h-24"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-muted">Category / Location</label>
                <input
                  type="text"
                  value={newEvent.category}
                  onChange={(e) => setNewEvent({...newEvent, category: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 text-white"
                />
              </div>
              <div className="flex items-center gap-2 mt-4">
                <input
                  type="checkbox"
                  id="is_public"
                  checked={newEvent.is_public}
                  onChange={(e) => setNewEvent({...newEvent, is_public: e.target.checked})}
                  className="w-4 h-4 rounded border-white/10 bg-black/40 text-primary focus:ring-primary"
                />
                <label htmlFor="is_public" className="text-sm font-medium text-white">Make this event public</label>
              </div>
              
              <div className="flex gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white font-medium py-2.5 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-primary hover:bg-primary-hover text-white font-medium py-2.5 rounded-lg transition-colors"
                >
                  Create Event
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
