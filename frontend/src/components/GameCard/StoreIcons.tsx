import type { ComponentType } from "react";

interface IconProps {
  className?: string;
  title?: string;
}

function Icon({ className, title, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={title}
    >
      {title && <title>{title}</title>}
      {children}
    </svg>
  );
}

function SteamIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="15.5" cy="8.5" r="2.2" />
      <circle cx="8" cy="14.5" r="2.2" />
      <path d="m13.6 10.2-3.7 2.8" />
    </Icon>
  );
}

function EpicIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 3h12a1 1 0 0 1 1 1v12l-7 5-7-5V4a1 1 0 0 1 1-1Z" />
      <path d="M9.5 8h5M9.5 12h4M9.5 16h5" />
    </Icon>
  );
}

function GogIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="9" cy="11" r="0.6" fill="currentColor" />
      <circle cx="15" cy="11" r="0.6" fill="currentColor" />
      <path d="M9 15h6" />
    </Icon>
  );
}

function ItchIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 7.5 6 4h12l2 3.5v3a2.5 2.5 0 0 1-4.5 1.5A2.5 2.5 0 0 1 12 11a2.5 2.5 0 0 1-3.5 1A2.5 2.5 0 0 1 4 10.5Z" />
      <path d="M6 12v6a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-6" />
      <path d="M10 19v-3a2 2 0 0 1 4 0v3" />
    </Icon>
  );
}

function XboxIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M6 18.5c2-4 4-6 6-7.5M18 18.5c-2-4-4-6-6-7.5" />
      <path d="M8.5 4.5C10 4 11 4 12 4s2 0 3.5.5" />
    </Icon>
  );
}

function PlaystationIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9 4.5 14 6.2a2 2 0 0 1 1.4 1.9V18l-3-1V8.2a.8.8 0 0 0-1.6 0V20l-1.8-.6Z" />
      <path d="m16.5 13.5 3.5 1.2a1.5 1.5 0 0 1-.2 2.8L16.5 19M7 17l-2.5-.9a1.5 1.5 0 0 1 .1-2.8L9 12" />
    </Icon>
  );
}

function GenericStoreIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 6h18l-1.5 4.5a2 2 0 0 1-1.9 1.4H8.4a2 2 0 0 1-1.9-1.4L5 6" />
      <path d="M5 6 4 3H2" />
      <circle cx="9" cy="19" r="1.4" />
      <circle cx="17" cy="19" r="1.4" />
    </Icon>
  );
}

const STORE_ICONS: Record<string, ComponentType<IconProps>> = {
  steam: SteamIcon,
  epic: EpicIcon,
  gog: GogIcon,
  itch: ItchIcon,
  xbox: XboxIcon,
  playstation: PlaystationIcon,
};

const STORE_NAMES: Record<string, string> = {
  steam: "Steam",
  epic: "Epic Games",
  gog: "GOG",
  itch: "itch.io",
  xbox: "Xbox",
  playstation: "PlayStation",
};

interface StoreGlyphProps {
  slug: string;
  className?: string;
}

export function StoreGlyph({ slug, className }: StoreGlyphProps) {
  const Glyph = STORE_ICONS[slug] ?? GenericStoreIcon;
  return <Glyph className={className} title={STORE_NAMES[slug] ?? slug} />;
}
