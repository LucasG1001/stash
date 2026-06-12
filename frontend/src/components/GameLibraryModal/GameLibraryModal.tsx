import type { GameCard } from "../../types/game";
import type { GameLibraryEntry, GameLibraryStatus } from "../../types/gameLibrary";
import { GAME_LIBRARY_STATUS_LABELS } from "../../types/gameLibrary";
import { LibraryModalBase } from "../LibraryModalBase/LibraryModalBase";

interface GameLibraryModalProps {
  game: GameCard;
  libraryEntry: GameLibraryEntry | undefined;
  onClose: () => void;
  onSave: (game: GameCard, data: { status: GameLibraryStatus; score: number }) => void;
  onRemove: (id: string) => void;
}

export function GameLibraryModal({ game, libraryEntry, onClose, onSave, onRemove }: GameLibraryModalProps) {
  return (
    <LibraryModalBase
      title={game.title}
      coverImage={game.backgroundImage}
      placeholder="🎮"
      statusLabels={GAME_LIBRARY_STATUS_LABELS}
      initialStatus={libraryEntry?.status ?? "plan_to_play"}
      initialScore={libraryEntry?.score ?? 0}
      hasEntry={!!libraryEntry}
      onClose={onClose}
      onSave={(data) => onSave(game, { status: data.status as GameLibraryStatus, score: data.score })}
      onRemove={() => libraryEntry && onRemove(libraryEntry.id)}
    />
  );
}
