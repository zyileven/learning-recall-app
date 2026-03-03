import { create } from 'zustand';
import type { KnowledgeCard } from '../types';
import * as storage from '../lib/storage';
import { generateId } from '../lib/utils';
import { createInitialSRData } from '../lib/sm2';

interface CardsState {
  cards: KnowledgeCard[];
  categories: string[];
  // Actions
  loadCards: () => void;
  addCard: (data: Omit<KnowledgeCard, 'id' | 'createdAt' | 'updatedAt' | 'srData'>) => KnowledgeCard;
  updateCard: (id: string, data: Partial<Omit<KnowledgeCard, 'id' | 'createdAt'>>) => void;
  deleteCard: (id: string) => void;
  getCard: (id: string) => KnowledgeCard | undefined;
  // Derived helpers
  getDueCards: () => KnowledgeCard[];
  getCardsByCategory: (category: string) => KnowledgeCard[];
  searchCards: (query: string) => KnowledgeCard[];
}

export const useCardsStore = create<CardsState>((set, get) => ({
  cards: [],
  categories: [],

  loadCards: () => {
    set({
      cards: storage.getCards(),
      categories: storage.getCategories(),
    });
  },

  addCard: (data) => {
    const now = new Date().toISOString();
    const card: KnowledgeCard = {
      ...data,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
      srData: createInitialSRData(),
    };
    storage.saveCard(card);
    set({
      cards: storage.getCards(),
      categories: storage.getCategories(),
    });
    return card;
  },

  updateCard: (id, data) => {
    const card = get().cards.find((c) => c.id === id);
    if (!card) return;
    const updated: KnowledgeCard = {
      ...card,
      ...data,
      id,
      createdAt: card.createdAt,
      updatedAt: new Date().toISOString(),
    };
    storage.saveCard(updated);
    set({
      cards: storage.getCards(),
      categories: storage.getCategories(),
    });
  },

  deleteCard: (id) => {
    storage.deleteCard(id);
    set({ cards: storage.getCards() });
  },

  getCard: (id) => {
    return get().cards.find((c) => c.id === id);
  },

  getDueCards: () => {
    const now = new Date();
    return get().cards.filter(
      (c) => new Date(c.srData.nextReviewDate) <= now
    );
  },

  getCardsByCategory: (category) => {
    if (!category || category === 'all') return get().cards;
    return get().cards.filter((c) => c.category === category);
  },

  searchCards: (query) => {
    if (!query.trim()) return get().cards;
    const q = query.toLowerCase();
    return get().cards.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.content.toLowerCase().includes(q) ||
        c.tags.some((t) => t.toLowerCase().includes(q)) ||
        c.category.toLowerCase().includes(q)
    );
  },
}));
