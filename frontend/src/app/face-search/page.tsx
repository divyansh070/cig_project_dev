"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, Loader2, Search, ArrowLeft } from "lucide-react";
import { api, API_URL } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Media {
  id: number;
  filename: string;
  url: string;
  upload_date: string;
  event_id: number;
}

export default function FaceSearchPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<Media[] | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setResults(null); // Reset previous results
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    maxFiles: 1,
  });

  const handleSearch = async () => {
    if (!file) return;
    setIsSearching(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await api.post("/face/search", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      setResults(response.data);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.detail || "Failed to search for faces. Make sure the image contains a clear face.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen p-8 max-w-5xl mx-auto">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-muted hover:text-white mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>
      
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">Find Myself</h1>
        <p className="text-muted text-lg max-w-2xl mx-auto">
          Upload a clear selfie, and our AI will scan all public and private events you have access to, fetching every photo you're in.
        </p>
      </div>

      <div className="glass-panel p-8 rounded-3xl mb-12 flex flex-col md:flex-row gap-8 items-center">
        <div className="w-full md:w-1/2">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center min-h-[300px]
              ${isDragActive ? "border-primary bg-primary/10 scale-[1.02]" : "border-white/20 hover:border-white/40 bg-black/40"}`}
          >
            <input {...getInputProps()} />
            {preview ? (
              <div className="relative w-full h-full flex flex-col items-center">
                 {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="Selfie preview" className="w-48 h-48 object-cover rounded-full shadow-2xl mb-4 border-4 border-primary/50" />
                <p className="text-sm font-medium text-primary">Click or drag to replace image</p>
              </div>
            ) : (
              <>
                <UploadCloud className={`w-16 h-16 mb-4 ${isDragActive ? "text-primary" : "text-muted"}`} />
                <p className="text-lg font-medium mb-2">Drag & drop your selfie here</p>
                <p className="text-sm text-muted">or click to select file from your computer</p>
              </>
            )}
          </div>
        </div>

        <div className="w-full md:w-1/2 flex flex-col items-center justify-center">
          <button
            onClick={handleSearch}
            disabled={!file || isSearching}
            className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all
              ${!file ? "bg-white/5 text-white/30 cursor-not-allowed" : 
                isSearching ? "bg-primary/50 text-white cursor-wait" : 
                "bg-primary hover:bg-primary-hover text-white shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-1"
              }`}
          >
            {isSearching ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Scanning Databases...
              </>
            ) : (
              <>
                <Search className="w-6 h-6" />
                Find My Photos
              </>
            )}
          </button>
        </div>
      </div>

      {results !== null && (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold">Matches Found</h2>
            <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-bold">{results.length}</span>
          </div>

          {results.length === 0 ? (
            <div className="glass-panel py-20 text-center rounded-2xl">
              <Search className="w-12 h-12 text-muted mx-auto mb-4 opacity-50" />
              <p className="text-muted text-lg">No matches found for this face.</p>
            </div>
          ) : (
            <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
              <AnimatePresence>
                {results.map((m) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    layout
                    className="relative group rounded-xl overflow-hidden glass-panel border-0 mb-4 inline-block w-full cursor-pointer"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={`${API_URL}/media/view/${m.url.split('/').pop()}`} 
                      alt={m.filename}
                      className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                      <p className="text-sm font-medium truncate mb-1">{m.filename}</p>
                      <button 
                        onClick={() => router.push(`/event/${m.event_id}?photo=${m.id}`)}
                        className="text-xs bg-primary hover:bg-primary-hover text-white py-1.5 px-3 rounded-full transition-colors font-medium mt-2 w-fit"
                      >
                        Go to Event
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
