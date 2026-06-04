export type ThemeId = 'ocean' | 'space' | 'fantasy';

export interface Theme {
  id: ThemeId;
  label: string;
  characterLabel: string;
  currency: {
    name: string;
    pluralName: string;
    emoji: string;
  };
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    accent: string;
    text: string;
  };
  questNameSuggestions: string[];
  rewardNameSuggestions: string[];
}

export const themes: Record<ThemeId, Theme> = {
  ocean: {
    id: 'ocean',
    label: 'Ocean Adventure',
    characterLabel: 'Diver',
    currency: { name: 'Pearl', pluralName: 'Pearls', emoji: '🫧' },
    colors: {
      primary: '#0077B6',
      secondary: '#00B4D8',
      background: '#CAF0F8',
      surface: '#FFFFFF',
      accent: '#FFD166',
      text: '#03045E',
    },
    questNameSuggestions: [
      'Treasure Hunt',
      'Coral Cleanup',
      'Pearl Diving',
      'Seaweed Sorting',
      'Shell Collecting',
    ],
    rewardNameSuggestions: [
      'Mermaid Crown',
      'Pirate Map',
      'Underwater Adventure',
      'Sea Star Sticker',
    ],
  },
  space: {
    id: 'space',
    label: 'Space Mission',
    characterLabel: 'Astronaut',
    currency: { name: 'Stardust', pluralName: 'Stardust', emoji: '✨' },
    colors: {
      primary: '#3A0CA3',
      secondary: '#7209B7',
      background: '#10002B',
      surface: '#240046',
      accent: '#F72585',
      text: '#FFFFFF',
    },
    questNameSuggestions: [
      'Planet Patrol',
      'Asteroid Sweep',
      'Star Mapping',
      'Galaxy Cleanup',
      'Mission Briefing',
    ],
    rewardNameSuggestions: [
      'Rocket Ship Ride',
      'Alien Friend',
      'Cosmic Treat',
      'Space Helmet',
    ],
  },
  fantasy: {
    id: 'fantasy',
    label: 'Enchanted Quest',
    characterLabel: 'Hero',
    currency: { name: 'Gem', pluralName: 'Gems', emoji: '💎' },
    colors: {
      primary: '#6A0572',
      secondary: '#AB83A1',
      background: '#FFE5D9',
      surface: '#FFFFFF',
      accent: '#FFB703',
      text: '#3A0CA3',
    },
    questNameSuggestions: [
      'Dragon Taming',
      'Castle Cleanup',
      'Magic Potion',
      'Royal Errand',
      'Enchanted Forest Walk',
    ],
    rewardNameSuggestions: [
      'Magic Wand',
      'Crown of Wonder',
      'Storytime with Wizard',
      'Fairy Wings',
    ],
  },
};

export const themeList = Object.values(themes);
