import { useState, useRef, useEffect } from "react";
import styles from "./TabNav.module.css";

interface Tab {
  id: string;
  label: string;
}

interface TabNavProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function TabNav({ tabs, activeTab, onTabChange }: TabNavProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const activeLabel = tabs.find((t) => t.id === activeTab)?.label ?? "";

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleSelect = (id: string) => {
    onTabChange(id);
    setOpen(false);
  };

  return (
    <>
      {/* Desktop: linha de abas */}
      <div className={styles.tabNav}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ""}`}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Mobile: menu hamburger */}
      <div className={styles.mobileMenu} ref={menuRef}>
        <button
          className={styles.mobileTrigger}
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-haspopup="true"
        >
          <span className={styles.mobileTriggerLabel}>{activeLabel}</span>
          <span className={styles.hamburgerIcon} aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </button>

        {open && (
          <div className={styles.mobileDropdown}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`${styles.mobileDropdownItem} ${activeTab === tab.id ? styles.mobileDropdownItemActive : ""}`}
                onClick={() => handleSelect(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
