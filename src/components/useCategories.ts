import { useState, useEffect } from "react";

export interface Category {
  id: string;
  name: string;
  color?: string;
}

const STORAGE_KEY = "time-tracker-categories";

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load categories from localStorage on mount
  useEffect(() => {
    const loadCategories = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        const parsed = stored ? JSON.parse(stored) : [];
        setCategories(parsed);
      } catch (error) {
        console.error("Error loading categories:", error);
        setCategories([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadCategories();
  }, []);

  // Save categories to localStorage whenever they change
  const saveCategories = (newCategories: Category[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newCategories));
      setCategories(newCategories);
    } catch (error) {
      console.error("Error saving categories:", error);
    }
  };

  const addCategory = (name: string, color?: string) => {
    const newCategory: Category = {
      id: crypto.randomUUID(),
      name,
      color,
    };
    saveCategories([...categories, newCategory]);
  };

  const removeCategory = (id: string) => {
    saveCategories(categories.filter((cat) => cat.id !== id));
  };

  const updateCategory = (
    id: string,
    updates: Partial<Omit<Category, "id">>,
  ) => {
    saveCategories(
      categories.map((cat) => (cat.id === id ? { ...cat, ...updates } : cat)),
    );
  };

  const updateCategories = (newCategories: Category[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newCategories));
      setCategories(newCategories);
    } catch (error) {
      console.error("Error saving categories:", error);
    }
  };

  return {
    categories,
    isLoading,
    addCategory,
    removeCategory,
    updateCategory,
    updateCategories,
  };
}
