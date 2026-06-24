const STORE_ICON_URL: Record<string, string> = {
  steam: "https://cdn.simpleicons.org/steam",
  epic: "https://cdn.simpleicons.org/epicgames",
  gog: "https://cdn.simpleicons.org/gogdotcom",
  itch: "https://cdn.simpleicons.org/itchdotio",
  playstation: "https://api.iconify.design/mdi/sony-playstation.svg",
  xbox: "https://api.iconify.design/mdi/microsoft-xbox.svg",
};

const STORE_NAMES: Record<string, string> = {
  steam: "Steam",
  epic: "Epic Games",
  gog: "GOG",
  itch: "itch.io",
  playstation: "PlayStation",
  xbox: "Xbox",
};

interface StoreGlyphProps {
  slug: string;
  className?: string;
}

export function StoreGlyph({ slug, className }: StoreGlyphProps) {
  const url = STORE_ICON_URL[slug];
  if (!url) return null;
  const name = STORE_NAMES[slug] ?? slug;
  return (
    <span
      className={className}
      title={name}
      role="img"
      aria-label={name}
      style={{ maskImage: `url(${url})`, WebkitMaskImage: `url(${url})` }}
    />
  );
}
