import styles from "./TrailerEmbed.module.css";

interface TrailerEmbedProps {
  youtubeId: string;
}

export function TrailerEmbed({ youtubeId }: TrailerEmbedProps) {
  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <iframe
          className={styles.iframe}
          src={`https://www.youtube-nocookie.com/embed/${youtubeId}`}
          title="Trailer"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
      <a
        className={styles.fallback}
        href={`https://www.youtube.com/watch?v=${youtubeId}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        Assistir no YouTube ↗
      </a>
    </div>
  );
}
