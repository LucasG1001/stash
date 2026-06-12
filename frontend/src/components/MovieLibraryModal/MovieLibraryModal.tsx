import type { MovieCard } from "../../types/movie";
import type { MovieLibraryEntry, MovieLibraryStatus } from "../../types/movieLibrary";
import { MOVIE_LIBRARY_STATUS_LABELS } from "../../types/movieLibrary";
import { LibraryModalBase } from "../LibraryModalBase/LibraryModalBase";

interface MovieLibraryModalProps {
  movie: MovieCard;
  libraryEntry: MovieLibraryEntry | undefined;
  onClose: () => void;
  onSave: (movie: MovieCard, data: { status: MovieLibraryStatus; score: number }) => void;
  onRemove: (id: string) => void;
}

export function MovieLibraryModal({ movie, libraryEntry, onClose, onSave, onRemove }: MovieLibraryModalProps) {
  return (
    <LibraryModalBase
      title={movie.title}
      coverImage={movie.posterImage}
      placeholder="🎬"
      statusLabels={MOVIE_LIBRARY_STATUS_LABELS}
      initialStatus={libraryEntry?.status ?? "plan_to_watch"}
      initialScore={libraryEntry?.score ?? 0}
      hasEntry={!!libraryEntry}
      onClose={onClose}
      onSave={(data) => onSave(movie, { status: data.status as MovieLibraryStatus, score: data.score })}
      onRemove={() => libraryEntry && onRemove(libraryEntry.id)}
    />
  );
}
