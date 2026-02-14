
export type Suit = 'Hearts' | 'Diamonds' | 'Clubs' | 'Spades';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  suit: Suit;
  rank: Rank;
  value: number;
}

export enum GameMode {
  VS_COMPUTER = 'VS_COMPUTER',
  TWO_PLAYERS = 'TWO_PLAYERS'
}

export enum Theme {
  LIGHT = 'LIGHT',
  DARK = 'DARK',
  COLORFUL_DARK = 'COLORFUL_DARK'
}

export enum GameStatus {
  IDLE = 'IDLE',
  PLAYING = 'PLAYING',
  WAR = 'WAR',
  FINISHED = 'FINISHED'
}

export interface RoundHistory {
  p1Card: Card;
  p2Card: Card;
  result: string;
  isWar: boolean;
}

export interface GameState {
  player1Deck: Card[];
  player2Deck: Card[];
  player1InPlay: Card[];
  player2InPlay: Card[];
  lastResult: string;
  status: GameStatus;
  winner: string | null;
  mode: GameMode;
  commentary: string;
  history: RoundHistory[];
  isPaused: boolean;
  isMuted: boolean;
}
