export interface BookGenre {
  value: string;
  label: string;
}

export const BOOK_GENRES: BookGenre[] = [
  { value: "Fiction", label: "Ficção" },
  { value: "Fantasy", label: "Fantasia" },
  { value: "Romance", label: "Romance" },
  { value: "Mystery", label: "Mistério" },
  { value: "Science Fiction", label: "Ficção Científica" },
  { value: "Horror", label: "Terror" },
  { value: "Biography & Autobiography", label: "Biografia" },
  { value: "History", label: "História" },
  { value: "Self-Help", label: "Autoajuda" },
  { value: "Business & Economics", label: "Negócios" },
  { value: "Comics & Graphic Novels", label: "Quadrinhos & Mangá" },
  { value: "Poetry", label: "Poesia" },
];
