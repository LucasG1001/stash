import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Sidebar } from "./components/Sidebar/Sidebar";
import { AnimePage } from "./pages/AnimePage/AnimePage";
import { MoviesPage } from "./pages/MoviesPage/MoviesPage";
import { SeriesPage } from "./pages/SeriesPage/SeriesPage";
import { BooksPage } from "./pages/BooksPage/BooksPage";
import { GamesPage } from "./pages/GamesPage/GamesPage";
import styles from "./App.module.css";

function App() {
  return (
    <BrowserRouter>
      <div className={styles.layout}>
        <Sidebar />
        <main className={styles.content}>
          <Routes>
            <Route path="/" element={<Navigate to="/anime" replace />} />
            <Route path="/anime" element={<AnimePage />} />
            <Route path="/filmes" element={<MoviesPage />} />
            <Route path="/series" element={<SeriesPage />} />
            <Route path="/livros" element={<BooksPage />} />
            <Route path="/jogos" element={<GamesPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
