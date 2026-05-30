"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, Calendar, Image as ImageIcon, MapPin, Loader2, Search } from "lucide-react";
import { api, API_URL } from "@/lib/api";
import Link from "next/link";

interface Event {
  id: number;
  name: string;
  description: string;
  date: string;
  category: string;
  is_public: boolean;
  media: { id: number; url: string; filename: string }[];
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
    <div className="min-h-screen p-8 max-w-7xl mx-auto text-gray-900">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Events Dashboard</h1>
          <p className="text-gray-500">Welcome back! You are viewing as a <span className="text-primary font-medium">{isClubMember ? "Club Member" : "Standard User"}</span>.</p>
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
            className="bg-green-100 hover:bg-green-200 text-green-700 border border-green-200 px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm"
          >
            Add Member
          </button>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all shadow-md"
          >
            <Plus className="w-5 h-5" />
            Create Event
          </button>
          <Link 
            href="/face-search"
            className="bg-white hover:bg-gray-50 text-gray-800 border border-gray-200 px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all shadow-sm"
          >
            <Search className="w-5 h-5" />
            Find Myself
          </Link>
          <button 
            onClick={() => {
              localStorage.removeItem("token");
              router.push("/");
            }}
            className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm"
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
          className="flex-grow bg-white border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm shadow-sm"
        />
        <select 
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-white border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm min-w-[200px] shadow-sm"
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
              className="glass-panel p-6 rounded-2xl cursor-pointer hover:border-primary/30 transition-all group border border-gray-100"
            >
              <div className="bg-blue-50 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors border border-blue-100">
                <ImageIcon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">{event.name}</h3>
              <p className="text-gray-500 text-sm mb-4 line-clamp-2">{event.description || "No description provided."}</p>
              
              {event.media && event.media.length > 0 && (
                <div className="flex gap-2 mb-4">
                  {event.media.slice(0, 3).map((m) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      key={m.id} 
                      src={`${API_URL}/media/view/${m.url.split('/').pop()}`} 
                      alt={m.filename} 
                      className="w-12 h-12 rounded-lg object-cover border border-gray-200 shadow-sm"
                    />
                  ))}
                  {event.media.length > 3 && (
                    <div className="w-12 h-12 rounded-lg bg-gray-50 flex items-center justify-center text-xs font-medium text-gray-500 border border-gray-200 shadow-sm">
                      +{event.media.length - 3}
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
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
                <div className={`px-2 py-0.5 rounded-full ml-auto ${event.is_public ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                  {event.is_public ? 'Public' : 'Private'}
                </div>
              </div>
            </motion.div>
          </Link>
        ))}
        {events.length === 0 && (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-gray-200 rounded-2xl bg-white/50">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-medium mb-2 text-gray-900">No events found</h3>
            <p className="text-gray-500">Create your first event to get started.</p>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-panel p-8 rounded-2xl w-full max-w-lg bg-white/90 border border-gray-200 shadow-2xl"
          >
            <h2 className="text-2xl font-bold mb-6 text-gray-900">Create New Event</h2>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Event Name</label>
                <input
                  type="text"
                  value={newEvent.name}
                  onChange={(e) => setNewEvent({...newEvent, name: e.target.value})}
                  className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 text-gray-900 shadow-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Description</label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                  className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 text-gray-900 h-24 shadow-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Category / Location</label>
                <input
                  type="text"
                  value={newEvent.category}
                  onChange={(e) => setNewEvent({...newEvent, category: e.target.value})}
                  className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 text-gray-900 shadow-sm"
                />
              </div>
              <div className="flex items-center gap-2 mt-4">
                <input
                  type="checkbox"
                  id="is_public"
                  checked={newEvent.is_public}
                  onChange={(e) => setNewEvent({...newEvent, is_public: e.target.checked})}
                  className="w-4 h-4 rounded border-gray-300 bg-white text-primary focus:ring-primary"
                />
                <label htmlFor="is_public" className="text-sm font-medium text-gray-800">Make this event public</label>
              </div>
              
              <div className="flex gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2.5 rounded-lg transition-colors border border-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-primary hover:bg-primary-hover text-white font-medium py-2.5 rounded-lg transition-colors shadow-sm"
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
