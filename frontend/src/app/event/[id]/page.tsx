"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useDropzone } from "react-dropzone";
import { UploadCloud, ArrowLeft, Loader2, Image as ImageIcon, Search, Share2, Trash2 } from "lucide-react";
import { api, API_URL } from "@/lib/api";
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
  tags?: string;
  uploader_id: number;
}

const isVideo = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase();
  return ext === 'mp4' || ext === 'mov' || ext === 'webm';
};

function EventGalleryContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [event, setEvent] = useState<Event | null>(null);
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isClubMember, setIsClubMember] = useState(false);
  const [eventRole, setEventRole] = useState("Viewer");
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [likesCount, setLikesCount] = useState(0);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [members, setMembers] = useState<{username: string, is_club_member: boolean, role: string}[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  const eventId = params.id;
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const [userRes, roleRes, eventRes, mediaRes] = await Promise.all([
        api.get("/auth/me").catch(() => ({ data: { is_club_member: false, id: null } })),
        api.get(`/events/${eventId}/role`).catch(() => ({ data: { role: "Viewer" } })),
        api.get(`/events/${eventId}`),
        api.get(`/media/event/${eventId}`)
      ]);
      setIsClubMember(userRes.data.is_club_member);
      setCurrentUserId(userRes.data.id);
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

  const fetchMembers = async () => {
    try {
      const res = await api.get(`/events/${eventId}/members`);
      setMembers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle auto-opening photo from notification
  useEffect(() => {
    const photoId = searchParams.get("photo");
    if (photoId && media.length > 0 && !selectedMedia) {
      const targetMedia = media.find(m => m.id.toString() === photoId);
      if (targetMedia) {
        openMediaDetails(targetMedia);
        router.replace(`/event/${params.id}`, { scroll: false });
      }
    }
  }, [searchParams, media, selectedMedia, params.id, router]);

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
        // 500ms delay to prevent server OOM from concurrent background tasks
        await new Promise(resolve => setTimeout(resolve, 500));
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

  const filteredMedia = media.filter(m => {
    const matchesFilename = m.filename.toLowerCase().includes(searchQuery.toLowerCase());
    let matchesTags = false;
    if (m.tags) {
      try {
        const parsedTags = JSON.parse(m.tags);
        if (Array.isArray(parsedTags)) {
          matchesTags = parsedTags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
        }
      } catch (e) {
        // ignore parse error
      }
    }
    return matchesFilename || matchesTags;
  });

  return (
    <div className="min-h-screen p-8 max-w-7xl mx-auto text-gray-900">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      <div className="mb-10 flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold mb-2 text-gray-900">{event?.name}</h1>
          <p className="text-gray-500 text-lg mb-2">{event?.description}</p>
          <div className="flex gap-2">
            <span className="text-xs bg-gray-100 px-3 py-1 rounded-full text-gray-600 border border-gray-200 shadow-sm">Your role: {eventRole}</span>
          </div>
        </div>
        <div className="flex gap-3">
          {eventRole === "Admin" && (
            <button 
              onClick={() => {
                fetchMembers();
                setShowTeamModal(true);
              }}
              className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-all shadow-sm border border-blue-200"
            >
              Manage Team
            </button>
          )}
          {eventRole === "Admin" && (
            <button 
              onClick={async () => {
                if (confirm("Are you sure you want to delete this event? This action cannot be undone.")) {
                  try {
                    await api.delete(`/events/${eventId}`);
                    router.push('/dashboard');
                  } catch (err) {
                    alert("Failed to delete event.");
                  }
                }
              }}
              className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-all shadow-sm border border-red-200"
            >
              <Trash2 className="w-4 h-4" />
              Delete Event
            </button>
          )}
          <button 
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              alert("Event link copied to clipboard!");
            }}
            className="bg-white hover:bg-gray-50 text-gray-800 px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-all shadow-sm border border-gray-200"
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
            ${isDragActive ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-gray-300 hover:border-primary/50 bg-white/50 shadow-sm'}
            ${uploading ? 'opacity-50 cursor-wait' : ''}`}
        >
          <input {...getInputProps()} disabled={uploading} />
          {uploading ? (
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
          ) : (
            <UploadCloud className={`w-12 h-12 mb-4 ${isDragActive ? 'text-primary' : 'text-gray-400'}`} />
          )}
          <p className="text-xl font-medium mb-2 text-gray-900">{uploading ? "Uploading media..." : "Drag & drop photos here"}</p>
          <p className="text-gray-500 text-sm">or click to select files from your computer</p>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-900">
          <ImageIcon className="w-6 h-6 text-primary" />
          Event Gallery
        </h2>
        
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search photos by filename..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-white border border-gray-200 rounded-full pl-9 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm min-w-[250px] shadow-sm text-gray-900"
          />
        </div>
      </div>

      {filteredMedia.length === 0 ? (
        <div className="py-20 text-center glass-panel rounded-2xl border border-gray-100">
          <p className="text-gray-500 text-lg">No photos found matching your search.</p>
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
                className="relative group rounded-xl overflow-hidden bg-white border border-gray-100 mb-4 inline-block w-full shadow-sm break-inside-avoid"
              >
                {isVideo(m.filename) ? (
                  <video 
                    src={`${API_URL}/media/view/${m.url.split('/').pop()}#t=0.1`} 
                    className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105 min-h-[150px] bg-gray-100"
                    controls
                    preload="metadata"
                  />
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img 
                    src={`${API_URL}/media/view/${m.url.split('/').pop()}`} 
                    alt={m.filename}
                    onError={(e) => {
                      e.currentTarget.src = "https://placehold.co/400x300/f3f4f6/9ca3af?text=Image+Deleted";
                    }}
                    className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105 min-h-[150px] bg-gray-100"
                    loading="lazy"
                  />
                )}
                
                {/* Delete Button (Top Right) */}
                {(currentUserId === m.uploader_id || eventRole === "Admin") && (
                  <button
                    onClick={async (e) => {
                      e.preventDefault();
                      if (confirm("Are you sure you want to permanently delete this photo?")) {
                        try {
                          await api.delete(`/media/${m.id}`);
                          setMedia(prev => prev.filter(media => media.id !== m.id));
                        } catch (err) {
                          alert("Failed to delete photo.");
                        }
                      }
                    }}
                    className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 backdrop-blur-md"
                    title="Delete Photo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-gray-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                  <p className="text-sm font-medium truncate mb-1 text-white">{m.filename}</p>
                  
                  {/* AI Tags */}
                  <div className="flex gap-1 mb-2 overflow-x-auto no-scrollbar">
                    {(() => {
                      let tagArray = [];
                      try {
                        if (m.tags) tagArray = JSON.parse(m.tags);
                      } catch (e) {}
                      if (!Array.isArray(tagArray) || tagArray.length === 0) {
                        tagArray = ["processing..."];
                      }
                      return tagArray.map((tag, i) => (
                         <span key={i} className="text-[10px] bg-primary/80 text-white px-2 py-0.5 rounded-full border border-primary/50 shadow-sm whitespace-nowrap">{tag}</span>
                      ));
                    })()}
                  </div>

                  <div className="flex justify-between items-center mt-2">
                    <div className="flex gap-2">
                      <button 
                        onClick={async (e) => {
                          e.preventDefault();
                          await api.post(`/social/like/${m.id}`);
                          // Optional: could add a toast here, but silent is better than alert
                        }}
                        className="text-xs bg-white/20 hover:bg-primary text-white py-1.5 px-3 rounded-full transition-colors backdrop-blur-md font-medium border border-white/30"
                      >
                        Like
                      </button>
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          openMediaDetails(m);
                        }}
                        className="text-xs bg-white/20 hover:bg-white/40 text-white py-1.5 px-3 rounded-full transition-colors backdrop-blur-md font-medium border border-white/30"
                      >
                        Discussion
                      </button>
                    </div>
                    <button 
                      onClick={async (e) => {
                        e.preventDefault();
                        const filename = m.url.split('/').pop();
                        
                        // Direct download bypass for videos to prevent CORS redirect errors
                        if (isVideo(m.filename)) {
                          const link = document.createElement('a');
                          link.href = `${API_URL}/media/view/${filename}?download=true`;
                          link.download = m.filename;
                          document.body.appendChild(link);
                          link.click();
                          link.remove();
                          return;
                        }

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
                      className="text-xs bg-primary hover:bg-primary-hover text-white py-1.5 px-3 rounded-full transition-colors font-medium shadow-md"
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
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-panel rounded-2xl w-full max-w-4xl flex flex-col md:flex-row overflow-hidden max-h-[90vh] bg-white shadow-2xl border border-gray-200"
          >
            <div className="w-full md:w-2/3 bg-gray-100 flex items-center justify-center p-4 border-r border-gray-200">
              {isVideo(selectedMedia.filename) ? (
                <video 
                  src={`${API_URL}/media/view/${selectedMedia.url.split('/').pop()}`} 
                  controls
                  autoPlay
                  className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-sm"
                />
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img 
                  src={`${API_URL}/media/view/${selectedMedia.url.split('/').pop()}`} 
                  alt="Selected"
                  className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-sm"
                />
              )}
            </div>
            <div className="w-full md:w-1/3 p-6 flex flex-col bg-white">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg text-gray-900">Discussion</h3>
                <button onClick={() => setSelectedMedia(null)} className="text-gray-400 hover:text-gray-900 font-medium transition-colors">&times; Close</button>
              </div>
              
              <div className="flex-grow overflow-y-auto mb-4 space-y-4 no-scrollbar pr-2">
                {comments.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center mt-10">No comments yet. Be the first!</p>
                ) : (
                  comments.map(c => (
                    <div key={c.id} className="bg-gray-50 p-3 rounded-lg border border-gray-100 shadow-sm">
                      <p className="text-xs text-primary font-medium mb-1">{c.username || `User ${c.user_id}`}</p>
                      <p className="text-sm text-gray-800">{c.text}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-4 border-t border-gray-100">
                <p className="text-sm mb-4 font-medium text-primary">{likesCount} Likes</p>
                <div className="flex gap-2">
                  <button 
                    onClick={async () => {
                      await api.post(`/social/like/${selectedMedia.id}`);
                      openMediaDetails(selectedMedia); // Refresh
                    }}
                    className="flex-1 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-800 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
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
                    className="flex-1 bg-primary hover:bg-primary-hover text-white py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                  >
                    Comment
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Team Management Modal */}
      {showTeamModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-panel rounded-2xl w-full max-w-xl p-6 bg-white shadow-2xl border border-gray-200"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-xl text-gray-900">Manage Team</h3>
              <button onClick={() => setShowTeamModal(false)} className="text-gray-400 hover:text-gray-900 font-medium transition-colors">&times; Close</button>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
              <input 
                type="text" 
                id="newMemberUsername"
                placeholder="Enter username to invite..." 
                className="flex-grow border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-gray-900 bg-white shadow-sm"
              />
              <div className="flex gap-2">
                <button 
                  onClick={async () => {
                    const input = document.getElementById("newMemberUsername") as HTMLInputElement;
                    if (input && input.value) {
                      try {
                        await api.post(`/events/${eventId}/roles?username=${input.value}&role=Viewer`);
                        input.value = "";
                        fetchMembers();
                      } catch (err: any) {
                        alert(err.response?.data?.detail || "Failed to add user.");
                      }
                    }
                  }}
                  className="flex-1 sm:flex-none bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm whitespace-nowrap"
                >
                  + Viewer
                </button>
                <button 
                  onClick={async () => {
                    const input = document.getElementById("newMemberUsername") as HTMLInputElement;
                    if (input && input.value) {
                      try {
                        await api.post(`/events/${eventId}/roles?username=${input.value}&role=Photographer`);
                        input.value = "";
                        fetchMembers();
                      } catch (err: any) {
                        alert(err.response?.data?.detail || "Failed to add user.");
                      }
                    }
                  }}
                  className="flex-1 sm:flex-none bg-blue-50 hover:bg-blue-100 text-primary border border-blue-200 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm whitespace-nowrap"
                >
                  + Photographer
                </button>
              </div>
            </div>
            
            <div className="max-h-[50vh] overflow-y-auto space-y-3 pr-2">
              {members.map(m => (
                <div key={m.username} className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 p-4 border border-gray-100 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="font-semibold text-gray-900">{m.username}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {m.is_club_member ? "Club Member" : "Standard User"} &middot; <span className={`font-medium ${m.role === 'Admin' ? 'text-red-500' : m.role === 'Photographer' ? 'text-primary' : 'text-green-600'}`}>{m.role}</span>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {m.role !== "Admin" && m.role !== "Photographer" && (
                      <button 
                        onClick={async () => {
                          await api.post(`/events/${eventId}/roles?username=${m.username}&role=Photographer`);
                          fetchMembers();
                        }}
                        className="text-xs bg-white text-primary border border-primary/20 hover:bg-primary/5 px-3 py-2 rounded-lg font-medium transition-colors shadow-sm"
                      >
                        Promote to Photo
                      </button>
                    )}
                    {m.role !== "Admin" && (
                      <button 
                        onClick={async () => {
                          if (confirm(`Are you sure you want to remove ${m.username} from this event?`)) {
                            await api.delete(`/events/${eventId}/roles/${m.username}`);
                            fetchMembers();
                          }
                        }}
                        className="text-xs bg-white text-red-600 border border-red-200 hover:bg-red-50 px-3 py-2 rounded-lg font-medium transition-colors shadow-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {members.length === 0 && (
                 <p className="text-gray-500 text-sm text-center py-4">No members available.</p>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default function EventGalleryPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
      <EventGalleryContent />
    </Suspense>
  );
}
