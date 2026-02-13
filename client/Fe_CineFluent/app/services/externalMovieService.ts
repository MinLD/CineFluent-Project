import axios from "axios";

const API_URL = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/v1/external`;

const getAuthHeader = () => {
  const token = localStorage.getItem("access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export interface ExternalMovie {
  tmdb_id: number;
  imdb_id?: string;
  title: string;
  original_title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  year: string;
  overview: string;
  vote_average: number;
}

export const externalMovieService = {
  // Tìm phim từ TMDb
  searchMovies: async (query: string, page: number = 1) => {
    try {
      const response = await axios.get(`${API_URL}/search`, {
        params: { query, page },
        headers: getAuthHeader(),
      });
      return response.data;
    } catch (error) {
      console.error("Error searching external movies:", error);
      throw error;
    }
  },

  // Import phim về DB (User confirm import)
  importMovie: async (tmdb_id: number, user_id?: string) => {
    try {
      const response = await axios.post(
        `${API_URL}/import`,
        { tmdb_id, user_id },
        { headers: getAuthHeader() },
      );
      return response.data;
    } catch (error) {
      console.error("Error importing movie:", error);
      throw error;
    }
  },

  importMovieStream: async (
    tmdb_id: number,
    onProgress: (data: any) => void,
    user_id?: string,
  ) => {
    const token = localStorage.getItem("access_token");
    try {
      const response = await fetch(`${API_URL}/import`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ tmdb_id, user_id }),
      });

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader available");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        const lines = buffer.split("\n");

        // Process all complete lines
        for (let i = 0; i < lines.length - 1; i++) {
          const line = lines[i].trim();
          if (line) {
            try {
              const data = JSON.parse(line);
              onProgress(data);
            } catch (e) {
              console.error("Error parsing JSON chunk:", e);
            }
          }
        }

        // Keep the last incomplete line in buffer
        buffer = lines[lines.length - 1];
      }
    } catch (error) {
      console.error("Error importing movie stream:", error);
      throw error;
    }
  },

  // Lấy stream URL
  getStream: async (video_id: number) => {
    try {
      const response = await axios.get(`${API_URL}/${video_id}/stream`, {
        headers: getAuthHeader(),
      });
      return response.data;
    } catch (error) {
      console.error("Error getting stream:", error);
      throw error;
    }
  },
};
