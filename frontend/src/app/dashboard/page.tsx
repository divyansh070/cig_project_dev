"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, Calendar, Image as ImageIcon, MapPin, Loader2, Search, Trash2 } from "lucide-react";
import { api, API_URL } from "@/lib/api";
import Link from "next/link";

interface Event {
  id: number;
  name: string;
  description: string;
  date: string;
  category: string;
  is_public: boolean;
  creator_id: number;
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

  const [username, setUsername] = useState("");
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [isSuperuser, setIsSuperuser] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

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
      setUsername(userRes.data.username);
      setCurrentUserId(userRes.data.id);
      setIsSuperuser(userRes.data.is_superuser);
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

  // Generate avatar initials
  const initials = username ? username.substring(0, 2).toUpperCase() : "U";

  return (
    <div className="min-h-screen p-8 max-w-7xl mx-auto text-gray-900">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Events Dashboard</h1>
          <p className="text-gray-500">Welcome back! You are viewing as a <span className="text-primary font-medium">{isClubMember ? "Club Member" : "Standard User"}</span>.</p>
        </div>
        
        <div className="flex gap-4 items-center">
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
          
          {/* Profile Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="w-11 h-11 rounded-full bg-gradient-to-br from-primary to-blue-400 text-white flex items-center justify-center font-bold shadow-md hover:shadow-lg transition-all border-2 border-white focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {initials}
            </button>
            
            {showProfileMenu && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowProfileMenu(false)}
                ></div>
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="absolute right-0 mt-3 w-64 glass-panel bg-white/95 rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden"
                >
                  <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                    <p className="font-bold text-gray-900 truncate">{username}</p>
                    <div className="flex items-center mt-1 gap-2">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${isClubMember ? 'bg-primary/10 text-primary' : 'bg-gray-200 text-gray-600'}`}>
                        {isClubMember ? "Club Member" : "Standard User"}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-2">
                    <button 
                      onClick={() => {
                        setShowProfileMenu(false);
                        alert("Settings page coming soon!");
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-primary rounded-xl transition-colors flex items-center gap-2"
                    >
                      Account Settings
                    </button>
                  </div>
                  
                  <div className="p-2 border-t border-gray-100">
                    <button 
                      onClick={() => {
                        localStorage.removeItem("token");
                        router.push("/");
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                      Log out
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </div>
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
              className="relative glass-panel p-6 rounded-2xl cursor-pointer hover:border-primary/30 transition-all group border border-gray-100"
            >
              {(event.creator_id === currentUserId || isSuperuser) && (
                <button
                  onClick={async (e) => {
                    e.preventDefault();
                    if (confirm(`Are you sure you want to delete "${event.name}"? This cannot be undone.`)) {
                      try {
                        await api.delete(`/events/${event.id}`);
                        fetchData();
                      } catch (err) {
                        alert("Failed to delete event.");
                      }
                    }
                  }}
                  className="absolute top-4 right-4 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white p-2 rounded-xl transition-all z-10 border border-red-100 shadow-sm opacity-0 group-hover:opacity-100"
                  title="Delete Event"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
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
