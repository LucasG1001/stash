import styles from "./TabNav.module.css";

interface Tab {
  id: string;
  label: string;
}

interface TabNavProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  plain?: boolean;
}

export function TabNav({ tabs, activeTab, onTabChange, plain = false }: TabNavProps) {
  return (
    <>
      <div className={`${styles.tabNav} ${plain ? styles.tabNavPlain : ""}`}>
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

      <select
        className={styles.mobileSelect}
        value={activeTab}
        onChange={(e) => onTabChange(e.target.value)}
      >
        {tabs.map((tab) => (
          <option key={tab.id} value={tab.id}>
            {tab.label}
          </option>
        ))}
      </select>
    </>
  );
}
