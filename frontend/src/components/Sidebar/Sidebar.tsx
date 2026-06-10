import { NavLink } from "react-router-dom";
import styles from "./Sidebar.module.css";

interface NavItem {
  path: string;
  label: string;
  icon: string;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { path: "/anime", label: "Anime", icon: "🎬" },
  { path: "/filmes", label: "Filmes", icon: "🎥", badge: "Em breve" },
  { path: "/series", label: "Séries", icon: "📺", badge: "Em breve" },
  { path: "/livros", label: "Livros", icon: "📚", badge: "Em breve" },
  { path: "/jogos", label: "Jogos", icon: "🎮", badge: "Em breve" },
];

export function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <div className={styles.logoIcon}>📡</div>
        <span className={styles.logoText}>Media Tracker</span>
      </div>

      <nav className={styles.nav}>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.navItemActive : ""}`
            }
          >
            <span className={styles.navIcon}>{item.icon}</span>
            <span className={styles.navLabel}>{item.label}</span>
            {item.badge && <span className={styles.navBadge}>{item.badge}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
