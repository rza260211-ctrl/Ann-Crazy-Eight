import { Card, Rank, RANKS, Suit, SUITS } from './types';

export const createDeck = (): Card[] => {
  const deck: Card[] = [];
  SUITS.forEach((suit) => {
    RANKS.forEach((rank) => {
      deck.push({
        id: `${rank}-${suit}`,
        suit,
        rank,
      });
    });
  });
  return deck;
};

export const shuffleDeck = (deck: Card[]): Card[] => {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const isValidMove = (card: Card, topCard: Card, currentSuit: Suit): boolean => {
  // 8 is always valid
  if (card.rank === '8') return true;
  
  // Match suit or rank
  return card.suit === currentSuit || card.rank === topCard.rank;
};

export const getAIAction = (hand: Card[], topCard: Card, currentSuit: Suit): { type: 'play', card: Card } | { type: 'draw' } => {
  // 1. Try to play a non-8 card that matches
  const matchingCards = hand.filter(c => c.rank !== '8' && (c.suit === currentSuit || c.rank === topCard.rank));
  if (matchingCards.length > 0) {
    // Pick a random matching card
    return { type: 'play', card: matchingCards[Math.floor(Math.random() * matchingCards.length)] };
  }

  // 2. Try to play an 8
  const eight = hand.find(c => c.rank === '8');
  if (eight) {
    return { type: 'play', card: eight };
  }

  // 3. Must draw
  return { type: 'draw' };
};

export const getBestSuitForAI = (hand: Card[]): Suit => {
  const counts: Record<Suit, number> = { hearts: 0, diamonds: 0, clubs: 0, spades: 0 };
  hand.forEach(c => {
    if (c.rank !== '8') {
      counts[c.suit]++;
    }
  });
  
  let bestSuit: Suit = 'hearts';
  let maxCount = -1;
  
  (Object.keys(counts) as Suit[]).forEach(suit => {
    if (counts[suit] > maxCount) {
      maxCount = counts[suit];
      bestSuit = suit;
    }
  });
  
  return bestSuit;
};
