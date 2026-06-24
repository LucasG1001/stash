import type { BookCard } from "../../types/book";
import type { BookLibraryEntry, BookLibraryStatus } from "../../types/bookLibrary";
import { BOOK_LIBRARY_STATUS_LABELS } from "../../types/bookLibrary";
import { LibraryModalBase } from "../LibraryModalBase/LibraryModalBase";

interface BookLibraryModalProps {
  book: BookCard;
  libraryEntry: BookLibraryEntry | undefined;
  onClose: () => void;
  onSave: (book: BookCard, data: { status: BookLibraryStatus; score: number }) => void;
  onRemove: (id: string) => void;
  onSetCover: (id: string) => void;
  canSetCover: boolean;
}

export function BookLibraryModal({ book, libraryEntry, onClose, onSave, onRemove, onSetCover, canSetCover }: BookLibraryModalProps) {
  return (
    <LibraryModalBase
      title={book.title}
      coverImage={book.coverImage}
      placeholder="📚"
      statusLabels={BOOK_LIBRARY_STATUS_LABELS}
      initialStatus={libraryEntry?.status ?? "plan_to_read"}
      initialScore={libraryEntry?.score ?? 0}
      hasEntry={!!libraryEntry}
      canSetCover={canSetCover}
      isCover={libraryEntry?.isCover ?? false}
      onSetCover={() => libraryEntry && onSetCover(libraryEntry.id)}
      onClose={onClose}
      onSave={(data) => onSave(book, { status: data.status as BookLibraryStatus, score: data.score })}
      onRemove={() => libraryEntry && onRemove(libraryEntry.id)}
    />
  );
}
