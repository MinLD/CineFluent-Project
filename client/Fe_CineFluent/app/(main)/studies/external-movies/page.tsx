"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  ExternalMovie,
  externalMovieService,
} from "@/app/services/externalMovieService";
import { useRouter } from "next/navigation";
import {
  Search,
  Loader2,
  Plus,
  Check,
  X,
  CheckCircle,
  AlertCircle,
  Play,
} from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

interface ImportLog {
  message: string;
  status: "progress" | "success" | "error";
  timestamp: number;
}

const ImportProgressModal = ({
  isOpen,
  onClose,
  logs,
  isFinished,
  slug,
}: {
  isOpen: boolean;
  onClose: () => void;
  logs: ImportLog[];
  isFinished: boolean;
  slug?: string;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
          <h3 className="font-bold text-lg text-white flex items-center gap-2">
            {!isFinished ? (
              <Loader2 className="animate-spin text-yellow-500" />
            ) : (
              <CheckCircle className="text-green-500" />
            )}
            Importing Movie...
          </h3>
          {isFinished && (
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="p-4 max-h-[300px] overflow-y-auto space-y-3 font-mono text-sm">
          {logs.map((log, index) => (
            <div
              key={index}
              className={`flex gap-3 ${
                log.status === "error"
                  ? "text-red-400"
                  : log.status === "success"
                    ? "text-green-400"
                    : "text-zinc-300"
              }`}
            >
              <span className="text-zinc-600 text-xs mt-0.5">
                {new Date(log.timestamp).toLocaleTimeString([], {
                  hour12: false,
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </span>
              <span>{log.message}</span>
            </div>
          ))}
          {!isFinished && (
            <div className="h-4 w-4 bg-yellow-500 rounded-full animate-pulse mx-auto mt-4" />
          )}
        </div>

        {isFinished && (
          <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="text-zinc-400 font-medium px-4 py-2 rounded-lg hover:text-white"
            >
              Close
            </button>
            {slug && (
              <button
                onClick={() => window.open(`/studies/movies/${slug}`, "_blank")}
                className="bg-yellow-500 text-black font-bold px-4 py-2 rounded-lg hover:bg-yellow-400 flex items-center gap-2"
              >
                <Play className="w-4 h-4" /> Xem Ngay
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default function ExternalMovieSearchPage() {
  const [movies, setMovies] = useState<ExternalMovie[]>([]);
  const [loading, setLoading] = useState(false);
  const [importingId, setImportingId] = useState<number | null>(null);

  // Import Progress State
  const [showImportModal, setShowImportModal] = useState(false);
  const [importLogs, setImportLogs] = useState<ImportLog[]>([]);
  const [isImportFinished, setIsImportFinished] = useState(false);

  const { register, handleSubmit } = useForm<{ query: string }>();
  const router = useRouter();

  const handleSearch = async (data: { query: string }) => {
    if (!data.query.trim()) return;
    setLoading(true);
    setMovies([]);
    try {
      const res = await externalMovieService.searchMovies(data.query);
      setMovies(res.results || []);
      if (res.results?.length === 0) {
        toast.info("Không tìm thấy phim nào!");
      }
    } catch (error) {
      toast.error("Lỗi khi tìm kiếm phim");
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (movie: ExternalMovie) => {
    setImportingId(movie.tmdb_id);
    setImportLogs([]);
    setIsImportFinished(false);
    setShowImportModal(true);

    try {
      await externalMovieService.importMovieStream(movie.tmdb_id, (data) => {
        setImportLogs((prev) => [
          ...prev,
          {
            message: data.message,
            status: data.status,
            timestamp: Date.now(),
          },
        ]);

        if (data.status === "success") {
          setIsImportFinished(true);
          setImportLogs(data.slug); // New state to store slug
          toast.success(`Import "${data.title}" thành công!`);
        } else if (data.status === "error") {
          setIsImportFinished(true);
        }
      });
    } catch (error: any) {
      setImportLogs((prev) => [
        ...prev,
        {
          message: "Connection lost or error occurred.",
          status: "error",
          timestamp: Date.now(),
        },
      ]);
      setIsImportFinished(true);
      toast.error("Lỗi khi import phim");
    } finally {
      setImportingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 pt-24">
      <ImportProgressModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        logs={importLogs}
        isFinished={isImportFinished}
      />

      <div className="max-w-6xl mx-auto">
        {/* ... (Existing JSX) ... */}
        <h1 className="text-3xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">
          Tìm Kiếm & Thêm Phim Mới
        </h1>

        {/* Search Bar */}
        <form
          onSubmit={handleSubmit(handleSearch)}
          className="mb-12 flex gap-4"
        >
          <div className="relative flex-1">
            <input
              {...register("query")}
              type="text"
              placeholder="Nhập tên phim (English or Vietnamese)..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-6 py-4 pl-14 focus:outline-none focus:ring-2 focus:ring-yellow-500 text-lg"
            />
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 w-6 h-6" />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-8 py-4 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : "Tìm kiếm"}
          </button>
        </form>

        {/* Results Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {movies.map((movie) => (
            <div
              key={movie.tmdb_id}
              className="group relative bg-zinc-900 rounded-xl overflow-hidden shadow-lg border border-zinc-800 hover:border-yellow-500/50 transition-all"
            >
              {/* Poster */}
              <div className="aspect-[2/3] relative">
                {movie.poster_path ? (
                  <Image
                    src={movie.poster_path}
                    alt={movie.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-zinc-600">
                    No Poster
                  </div>
                )}

                {/* Overlay Action */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                  <button
                    onClick={() => handleImport(movie)}
                    disabled={importingId === movie.tmdb_id}
                    className="bg-yellow-500 text-black font-bold px-6 py-3 rounded-full flex items-center gap-2 hover:scale-105 transition-transform"
                  >
                    {importingId === movie.tmdb_id ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />{" "}
                        Processing...
                      </>
                    ) : (
                      <>
                        <Plus className="w-5 h-5" /> Thêm vào web
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <h3
                  className="font-bold text-lg mb-1 truncate"
                  title={movie.title}
                >
                  {movie.title}
                </h3>
                <p
                  className="text-sm text-zinc-400 mb-2 truncate"
                  title={movie.original_title}
                >
                  {movie.original_title}
                </p>
                <div className="flex justify-between items-center text-xs text-zinc-500">
                  <span>{movie.year || "N/A"}</span>
                  <span className="flex items-center gap-1 text-yellow-500">
                    ⭐ {movie.vote_average.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {!loading && movies.length === 0 && (
          <div className="text-center text-zinc-600 mt-20">
            Nhập tên phim để bắt đầu tìm kiếm...
          </div>
        )}
      </div>
    </div>
  );
}
