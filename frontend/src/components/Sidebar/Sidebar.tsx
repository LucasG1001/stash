import type { ComponentType } from "react";
import { NavLink } from "react-router-dom";
import styles from "./Sidebar.module.css";
import {
  AnimeIcon,
  BookIcon,
  ChevronIcon,
  GameIcon,
  LogoIcon,
  MovieIcon,
  SeriesIcon,
} from "./Sidebar.icons";

interface NavItem {
  path: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { path: "/anime", label: "Anime", icon: AnimeIcon },
  { path: "/filmes", label: "Filmes", icon: MovieIcon },
  { path: "/series", label: "Séries", icon: SeriesIcon },
  { path: "/livros", label: "Livros", icon: BookIcon },
  { path: "/jogos", label: "Jogos", icon: GameIcon },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""}`}>
      <div className={styles.logo}>
        <div className={styles.logoIcon}>
          <LogoIcon className={styles.logoMark} />
        </div>
        <span className={styles.logoText}>Media Tracker</span>
        <button
          type="button"
          className={styles.toggle}
          onClick={onToggle}
          title={collapsed ? "Expandir menu" : "Recolher menu"}
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
        >
          <ChevronIcon className={styles.toggleIcon} />
        </button>
      </div>

      <nav className={styles.nav}>
        <span className={styles.navSection}>Biblioteca</span>
        {NAV_ITEMS.map((item) => {
          const ItemIcon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              title={item.label}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.navItemActive : ""}`
              }
            >
              <ItemIcon className={styles.navIcon} />
              <span className={styles.navLabel}>{item.label}</span>
              {item.badge && <span className={styles.navBadge}>{item.badge}</span>}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
