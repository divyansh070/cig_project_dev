"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useDropzone } from "react-dropzone";
import { UploadCloud, ArrowLeft, Loader2, Image as ImageIcon, Search, Share2 } from "lucide-react";
import { api } from "@/lib/api";
import Link from "next/link";

interface Event {
  id: number;
  name: string;
  description: string;
}

interface Media {
  id: number;
  filename: string;
  url: string;
  upload_date: string;
}

export default function EventGalleryPage() {
  const params = useParams();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isClubMember, setIsClubMember] = useState(false);
  const [eventRole, setEventRole] = useState("Viewer");
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [likesCount, setLikesCount] = useState(0);

  const eventId = params.id;
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const [userRes, roleRes, eventRes, mediaRes] = await Promise.all([
        api.get("/auth/me").catch(() => ({ data: { is_club_member: false } })),
        api.get(`/events/${eventId}/role`).catch(() => ({ data: { role: "Viewer" } })),
        api.get(`/events/${eventId}`),
        api.get(`/media/event/${eventId}`)
      ]);
      setIsClubMember(userRes.data.is_club_member);
      setEventRole(roleRes.data.role);
      setEvent(eventRes.data);
      setMedia(mediaRes.data);
    } catch (err) {
      console.error(err);
      alert("Failed to load event.");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  const openMediaDetails = async (m: Media) => {
    setSelectedMedia(m);
    try {
      const [commentsRes, likesRes] = await Promise.all([
        api.get(`/social/comments/${m.id}`),
        api.get(`/social/likes/${m.id}`)
      ]);
      setComments(commentsRes.data);
      setLikesCount(likesRes.data.likes_count);
    } catch (err) {
      console.error("Failed to load social details", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploading(true);
    for (const file of acceptedFiles) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("event_id", eventId as string);

      try {
        await api.post("/media/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } catch (err) {
        console.error(err);
        alert("Failed to upload some files.");
      }
    }
    setUploading(false);
    fetchData(); // Refresh gallery
  }, [eventId, fetchData]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  const filteredMedia = media.filter(m => 
    m.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen p-8 max-w-7xl mx-auto">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-muted hover:text-white mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      <div className="mb-10 flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold mb-2">{event?.name}</h1>
          <p className="text-muted text-lg mb-2">{event?.description}</p>
          <div className="flex gap-2">
            <span className="text-xs bg-white/10 px-3 py-1 rounded-full text-white/70">Your role: {eventRole}</span>
          </div>
        </div>
        <div className="flex gap-3">
          {eventRole === "Admin" && (
            <button 
              onClick={async () => {
                const username = prompt("Enter username to assign as Photographer:");
                if (username) {
                  try {
                    await api.post(`/events/${eventId}/roles?username=${username}&role=Photographer`);
                    alert(`Successfully assigned Photographer role to ${username}!`);
                  } catch (e) {
                    alert("Failed to assign role. Check username.");
                  }
                }
              }}
              className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-all shadow-lg border border-blue-500/20"
            >
              Assign Role
            </button>
          )}
          <button 
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              alert("Event link copied to clipboard!");
            }}
            className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-all shadow-lg border border-white/5"
          >
            <Share2 className="w-4 h-4" />
            Share Event
          </button>
        </div>
      </div>

      {(eventRole === "Admin" || eventRole === "Photographer") && (
        <div 
          {...getRootProps()} 
          className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 mb-10 flex flex-col items-center justify-center
            ${isDragActive ? 'border-primary bg-primary/10 scale-[1.02]' : 'border-white/20 hover:border-white/40 bg-black/40'}
            ${uploading ? 'opacity-50 cursor-wait' : ''}`}
        >
          <input {...getInputProps()} disabled={uploading} />
          {uploading ? (
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
          ) : (
            <UploadCloud className={`w-12 h-12 mb-4 ${isDragActive ? 'text-primary' : 'text-muted'}`} />
          )}
          <p className="text-xl font-medium mb-2">{uploading ? "Uploading media..." : "Drag & drop photos here"}</p>
          <p className="text-muted text-sm">or click to select files from your computer</p>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <ImageIcon className="w-6 h-6 text-primary" />
          Event Gallery
        </h2>
        
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input 
            type="text" 
            placeholder="Search photos by filename..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-full pl-9 pr-4 py-2 focus:outline-none focus:border-primary/50 text-sm min-w-[250px]"
          />
        </div>
      </div>

      {filteredMedia.length === 0 ? (
        <div className="py-20 text-center glass-panel rounded-2xl">
          <p className="text-muted text-lg">No photos found matching your search.</p>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
          <AnimatePresence>
            {filteredMedia.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                layout
                className="relative group rounded-xl overflow-hidden glass-panel border-0 mb-4 inline-block w-full"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={`http://localhost:8000/media/view/${m.url.split('/').pop()}`} 
                  alt={m.filename}
                  className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                  <p className="text-sm font-medium truncate mb-1">{m.filename}</p>
                  
                  {/* AI Tags Simulation */}
                  <div className="flex gap-1 mb-2 overflow-x-auto no-scrollbar">
                    {["event", "photography", "fun"].map((tag, i) => (
                       <span key={i} className="text-[10px] bg-primary/40 px-2 py-0.5 rounded-full border border-primary/20">{tag}</span>
                    ))}
                  </div>

                  <div className="flex justify-between items-center mt-2">
                    <div className="flex gap-2">
                      <button 
                        onClick={async (e) => {
                          e.preventDefault();
                          await api.post(`/social/like/${m.id}`);
                          alert('Liked!');
                        }}
                        className="text-xs bg-white/20 hover:bg-primary py-1.5 px-3 rounded-full transition-colors backdrop-blur-md font-medium"
                      >
                        Like
                      </button>
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          openMediaDetails(m);
                        }}
                        className="text-xs bg-white/20 hover:bg-white/40 py-1.5 px-3 rounded-full transition-colors backdrop-blur-md font-medium"
                      >
                        Discussion
                      </button>
                    </div>
                    <button 
                      onClick={async (e) => {
                        e.preventDefault();
                        const filename = m.url.split('/').pop();
                        try {
                          const response = await api.get(`/media/download/${filename}`, {
                            responseType: 'blob'
                          });
                          const blob = new Blob([response.data]);
                          const url = window.URL.createObjectURL(blob);
                          const link = document.createElement('a');
                          link.href = url;
                          link.download = `watermarked_${m.filename}`;
                          document.body.appendChild(link);
                          link.click();
                          link.remove();
                          window.URL.revokeObjectURL(url);
                        } catch(err) {
                          alert("Failed to download image.");
                        }
                      }}
                      className="text-xs bg-primary hover:bg-primary-hover text-white py-1.5 px-3 rounded-full transition-colors font-medium shadow-lg"
                    >
                      Download
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Social Modal */}
      {selectedMedia && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-panel rounded-2xl w-full max-w-4xl flex flex-col md:flex-row overflow-hidden max-h-[90vh]"
          >
            <div className="w-full md:w-2/3 bg-black flex items-center justify-center p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={`http://localhost:8000/media/view/${selectedMedia.url.split('/').pop()}`} 
                alt="Selected"
                className="max-w-full max-h-[80vh] object-contain"
              />
            </div>
            <div className="w-full md:w-1/3 p-6 flex flex-col border-l border-white/10 bg-[#111]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg">Discussion</h3>
                <button onClick={() => setSelectedMedia(null)} className="text-muted hover:text-white">&times; Close</button>
              </div>
              
              <div className="flex-grow overflow-y-auto mb-4 space-y-4 no-scrollbar">
                {comments.length === 0 ? (
                  <p className="text-muted text-sm text-center mt-10">No comments yet. Be the first!</p>
                ) : (
                  comments.map(c => (
                    <div key={c.id} className="bg-white/5 p-3 rounded-lg">
                      <p className="text-xs text-primary mb-1">User {c.user_id}</p>
                      <p className="text-sm">{c.text}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-4 border-t border-white/10">
                <p className="text-sm mb-4 font-medium text-primary">{likesCount} Likes</p>
                <div className="flex gap-2">
                  <button 
                    onClick={async () => {
                      await api.post(`/social/like/${selectedMedia.id}`);
                      openMediaDetails(selectedMedia); // Refresh
                    }}
                    className="flex-1 bg-white/10 hover:bg-white/20 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Like
                  </button>
                  <button 
                    onClick={async () => {
                      const text = prompt("Add a comment:");
                      if (text) {
                        await api.post(`/social/comment/${selectedMedia.id}`, { text });
                        openMediaDetails(selectedMedia); // Refresh
                      }
                    }}
                    className="flex-1 bg-primary hover:bg-primary-hover text-white py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Comment
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
