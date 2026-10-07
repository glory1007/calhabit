import { CategoryFolder } from '../types';

export const PRESET_EMOJIS = [
  '👤', '💼', '🏖️', '🏃', '💡', '📚', '☕', '✈️',
  '🎵', '🎯', '🛒', '🏠', '💊', '🚗', '⭐️', '❤️',
  '🔥', '🎨', '💻', '🎮', '🍎', '🐶', '📝', '⏰',
];

export const getCategoryEmoji = (category?: Partial<CategoryFolder> | null): string => {
  if (!category) return '🏷️';
  if (category.emoji && category.emoji.trim()) return category.emoji.trim();
  const name = category.name || '';
  if (name.includes('개인')) return '👤';
  if (name.includes('업무')) return '💼';
  if (name.includes('공휴일')) return '🏖️';
  if (name.includes('건강')) return '🏃';
  if (name.includes('프로젝트')) return '💡';
  // If name itself starts with an emoji, return it
  const match = name.match(/\p{Extended_Pictographic}/u);
  if (match) return match[0];
  return '🏷️';
};
