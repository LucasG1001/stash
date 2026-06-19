import type { MovieCard } from "../types/movie";
import type { MovieLibraryEntry } from "../types/movieLibrary";

export function movieLibraryEntryToCard(entry: MovieLibraryEntry): MovieCard {
  return {
    id: entry.tmdbId,
    title: entry.title,
    posterImage: entry.posterImage ?? "",
    backdropImage: null,
    releaseDate: entry.releaseDate,
    voteAverage: null,
    overview: null,
    movieStatus: entry.movieStatus || "RELEASED",
  };
}
