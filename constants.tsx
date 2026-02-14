
import React from 'react';
import { Suit, Rank, Card, Theme } from './types';

export const SUITS: Suit[] = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
export const RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

export const RANK_VALUES: Record<Rank, number> = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
  'J': 11, 'Q': 12, 'K': 13, 'A': 14
};

export const SUIT_SYMBOLS: Record<Suit, string> = {
  'Hearts': '♥',
  'Diamonds': '♦',
  'Clubs': '♣',
  'Spades': '♠'
};

export const THEME_CONFIG = {
  [Theme.LIGHT]: {
    bg: 'bg-stone-50',
    card: 'bg-white',
    text: 'text-stone-900',
    accent: 'bg-indigo-600',
    accentHover: 'hover:bg-indigo-700',
    secondary: 'bg-stone-200',
    board: 'bg-stone-100'
  },
  [Theme.DARK]: {
    bg: 'bg-gray-900',
    card: 'bg-gray-800',
    text: 'text-gray-100',
    accent: 'bg-blue-600',
    accentHover: 'hover:bg-blue-700',
    secondary: 'bg-gray-700',
    board: 'bg-gray-950'
  },
  [Theme.COLORFUL_DARK]: {
    bg: 'bg-[#0f172a]',
    card: 'bg-[#1e293b]',
    text: 'text-slate-100',
    accent: 'bg-fuchsia-600',
    accentHover: 'hover:bg-fuchsia-700',
    secondary: 'bg-slate-700',
    board: 'bg-[#020617]'
  }
};
