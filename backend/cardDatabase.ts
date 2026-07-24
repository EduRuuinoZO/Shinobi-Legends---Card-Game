// ============================================
// CARD DATABASE - 10 Base Ninjas
// ============================================

export interface BaseCard {
  name: string;
  element: 'Fire' | 'Wind' | 'Lightning' | 'Earth' | 'Water';
  image: string;
  baseAtk: number;
  baseHp: number;
}

export const BASE_NINJAS: BaseCard[] = [
  { name: 'Naruto Uzumaki', element: 'Wind', image: '/images/Naruto.jpg', baseAtk: 120, baseHp: 1200 },
  { name: 'Sasuke Uchiha', element: 'Fire', image: '/images/Naruto.jpg', baseAtk: 135, baseHp: 1100 },
  { name: 'Kakashi Hatake', element: 'Lightning', image: '/images/Naruto.jpg', baseAtk: 130, baseHp: 1150 },
  { name: 'Sakura Haruno', element: 'Earth', image: '/images/photo1771940742.jpg', baseAtk: 95, baseHp: 1400 },
  { name: 'Gaara', element: 'Earth', image: 'gaara.gif', baseAtk: 125, baseHp: 1300 },
  { name: 'Rock Lee', element: 'Earth', image: '/images/RockLee.jpg', baseAtk: 140, baseHp: 1000 },
  { name: 'Hinata Hyuga', element: 'Water', image: '/images/photo1771940743.jpg', baseAtk: 110, baseHp: 1250 },
  { name: 'Shikamaru Nara', element: 'Wind', image: '/images/photo1771940742.jpg', baseAtk: 100, baseHp: 1100 },
  { name: 'Itachi Uchiha', element: 'Fire', image: '/images/photo1771940742.jpg', baseAtk: 145, baseHp: 1050 },
  { name: 'Minato Namikaze', element: 'Lightning', image: '/images/Naruto.jpg', baseAtk: 150, baseHp: 1100 }
];

// ============================================
// RARITY MULTIPLIERS
// ============================================

export const RARITY_MULTIPLIERS: Record<string, number> = {
  'Common': 1.0,
  'Rare': 1.2,
  'Epic': 1.5,
  'Legendary': 2.0,
  'SSR': 2.5,
  'UR': 3.0
};

export const RARITY_WEIGHTS = [
  { rarity: 'Common', weight: 50 },
  { rarity: 'Rare', weight: 30 },
  { rarity: 'Epic', weight: 15 },
  { rarity: 'Legendary', weight: 5 }
];

// ============================================
// ELEMENT ADVANTAGE SYSTEM
// Fire > Wind > Lightning > Earth > Water > Fire
// ============================================

export const ELEMENT_ADVANTAGE: Record<string, string> = {
  'Fire': 'Wind',
  'Wind': 'Lightning',
  'Lightning': 'Earth',
  'Earth': 'Water',
  'Water': 'Fire'
};

export function getElementMultiplier(attackerElement: string, defenderElement: string): number {
  if (ELEMENT_ADVANTAGE[attackerElement] === defenderElement) {
    return 1.25; // 25% bonus
  }
  if (ELEMENT_ADVANTAGE[defenderElement] === attackerElement) {
    return 0.75; // 25% penalty
  }
  return 1.0; // neutral
}

// ============================================
// RANK EVOLUTION SYSTEM
// ============================================

export const RANK_SYMBOLS = ['⭐', '🌙', '⬜', '💎', '🔥', '👑', '⚡', '🌀', '🏆', '🔮'];

export function getRankInfo(evolutionPoints: number): { symbol: string; step: number; rankIndex: number } {
  const rankIndex = Math.min(Math.floor(evolutionPoints / 25), RANK_SYMBOLS.length - 1);
  const step = Math.min(evolutionPoints % 25, 4);
  return { symbol: RANK_SYMBOLS[rankIndex], step, rankIndex };
}

// ============================================
// STAR ASCENSION COSTS
// ============================================

export function getAscensionCost(currentStars: number): { gold: number; copies: number } {
  const costs = [
    { gold: 100, copies: 1 },
    { gold: 200, copies: 1 },
    { gold: 400, copies: 2 },
    { gold: 800, copies: 2 },
    { gold: 1500, copies: 3 },
    { gold: 3000, copies: 3 },
    { gold: 5000, copies: 4 }
  ];
  if (currentStars >= 7) return { gold: 99999, copies: 99 };
  return costs[currentStars];
}

// ============================================
// XP / LEVEL SYSTEM
// ============================================

export function getXpToNextLevel(level: number): number {
  return 100 + (level - 1) * 50;
}

export function applyLevelUp(card: any): boolean {
  const xpNeeded = getXpToNextLevel(card.level);
  if (card.xp >= xpNeeded) {
    card.xp -= xpNeeded;
    card.level += 1;
    card.atk += 5;
    card.hp += 50;
    card.maxHp += 50;
    return true;
  }
  return false;
}

// ============================================
// EQUIPMENT DATABASE
// ============================================

export interface BaseEquipment {
  name: string;
  type: 'Weapon' | 'Armor' | 'Helmet' | 'Boots' | 'Scroll' | 'Ring';
  rarity: 'Rare' | 'Epic' | 'Legendary' | 'SSR' | 'UR';
  stars: number;
  atkBonus: number;
  hpBonus: number;
}

export const EQUIPMENT_POOL: BaseEquipment[] = [
  // Weapons
  { name: 'Kunai of Shadows', type: 'Weapon', rarity: 'Rare', stars: 1, atkBonus: 15, hpBonus: 0 },
  { name: 'Raijin Blade', type: 'Weapon', rarity: 'Epic', stars: 2, atkBonus: 30, hpBonus: 0 },
  { name: 'Kusanagi Sword', type: 'Weapon', rarity: 'Legendary', stars: 3, atkBonus: 50, hpBonus: 10 },
  { name: 'Samehada', type: 'Weapon', rarity: 'SSR', stars: 4, atkBonus: 75, hpBonus: 20 },
  { name: 'Sage Staff', type: 'Weapon', rarity: 'UR', stars: 5, atkBonus: 100, hpBonus: 30 },
  // Armor
  { name: 'Chunin Vest', type: 'Armor', rarity: 'Rare', stars: 1, atkBonus: 0, hpBonus: 100 },
  { name: 'ANBU Armor', type: 'Armor', rarity: 'Epic', stars: 2, atkBonus: 5, hpBonus: 200 },
  { name: 'Akatsuki Cloak', type: 'Armor', rarity: 'Legendary', stars: 3, atkBonus: 10, hpBonus: 350 },
  { name: 'Sage Mode Cloak', type: 'Armor', rarity: 'SSR', stars: 4, atkBonus: 20, hpBonus: 500 },
  { name: 'Rikudo Armor', type: 'Armor', rarity: 'UR', stars: 5, atkBonus: 30, hpBonus: 700 },
  // Helmets
  { name: 'Leaf Headband', type: 'Helmet', rarity: 'Rare', stars: 1, atkBonus: 5, hpBonus: 50 },
  { name: 'Sand Headband', type: 'Helmet', rarity: 'Epic', stars: 2, atkBonus: 10, hpBonus: 100 },
  { name: 'Akatsuki Headband', type: 'Helmet', rarity: 'Legendary', stars: 3, atkBonus: 20, hpBonus: 150 },
  { name: 'Kage Hat', type: 'Helmet', rarity: 'SSR', stars: 4, atkBonus: 30, hpBonus: 200 },
  { name: 'Rikudo Headpiece', type: 'Helmet', rarity: 'UR', stars: 5, atkBonus: 40, hpBonus: 300 },
  // Boots
  { name: 'Ninja Sandals', type: 'Boots', rarity: 'Rare', stars: 1, atkBonus: 5, hpBonus: 30 },
  { name: 'Swift Boots', type: 'Boots', rarity: 'Epic', stars: 2, atkBonus: 10, hpBonus: 80 },
  { name: 'Lightning Treads', type: 'Boots', rarity: 'Legendary', stars: 3, atkBonus: 15, hpBonus: 120 },
  { name: 'Sage Boots', type: 'Boots', rarity: 'SSR', stars: 4, atkBonus: 25, hpBonus: 180 },
  { name: 'Rikudo Greaves', type: 'Boots', rarity: 'UR', stars: 5, atkBonus: 35, hpBonus: 250 },
  // Scrolls
  { name: 'Fire Scroll', type: 'Scroll', rarity: 'Rare', stars: 1, atkBonus: 10, hpBonus: 20 },
  { name: 'Forbidden Scroll', type: 'Scroll', rarity: 'Epic', stars: 2, atkBonus: 20, hpBonus: 50 },
  { name: 'Sage Scroll', type: 'Scroll', rarity: 'Legendary', stars: 3, atkBonus: 35, hpBonus: 80 },
  { name: 'Rikudo Scroll', type: 'Scroll', rarity: 'SSR', stars: 4, atkBonus: 50, hpBonus: 120 },
  { name: 'Divine Scroll', type: 'Scroll', rarity: 'UR', stars: 5, atkBonus: 70, hpBonus: 180 },
  // Rings
  { name: 'Chakra Ring', type: 'Ring', rarity: 'Rare', stars: 1, atkBonus: 8, hpBonus: 40 },
  { name: 'Sharingan Ring', type: 'Ring', rarity: 'Epic', stars: 2, atkBonus: 15, hpBonus: 80 },
  { name: 'Rinnegan Ring', type: 'Ring', rarity: 'Legendary', stars: 3, atkBonus: 25, hpBonus: 130 },
  { name: 'Bijuu Ring', type: 'Ring', rarity: 'SSR', stars: 4, atkBonus: 40, hpBonus: 200 },
  { name: 'Rikudo Ring', type: 'Ring', rarity: 'UR', stars: 5, atkBonus: 55, hpBonus: 280 }
];

// ============================================
// TOWER FLOOR DEFINITIONS
// ============================================

export interface TowerFloor {
  floor: number;
  enemies: Array<{ name: string; element: string; atk: number; hp: number; maxHp: number; rarity: string; level: number }>;
  goldReward: number;
  xpReward: number;
  equipmentReward?: string; // equipment name from pool
}

function generateTowerFloors(): TowerFloor[] {
  const floors: TowerFloor[] = [];
  
  const enemyNames = [
    'Shadow Clone', 'Rogue Ninja', 'Sound Ninja', 'Sand Assassin', 'Mist Hunter',
    'Akatsuki Scout', 'Curse Mark Warrior', 'Puppet Master', 'Genjutsu User', 'Taijutsu Expert',
    'Anbu Captain', 'Kage Guard', 'Bijuu Host', 'Sage Warrior', 'Rikudo Phantom'
  ];
  const elements: Array<'Fire' | 'Wind' | 'Lightning' | 'Earth' | 'Water'> = ['Fire', 'Wind', 'Lightning', 'Earth', 'Water'];
  
  for (let i = 1; i <= 50; i++) {
    let rarity = 'Common';
    let baseAtk = 50;
    let baseHp = 500;
    let enemyCount = 1;
    
    if (i <= 10) {
      rarity = Math.random() > 0.5 ? 'Common' : 'Rare';
      baseAtk = 50 + i * 5;
      baseHp = 500 + i * 50;
      enemyCount = Math.min(i, 3);
    } else if (i <= 20) {
      rarity = Math.random() > 0.5 ? 'Rare' : 'Epic';
      baseAtk = 80 + i * 8;
      baseHp = 800 + i * 80;
      enemyCount = Math.min(Math.ceil(i / 5), 4);
    } else if (i <= 40) {
      rarity = Math.random() > 0.5 ? 'Epic' : 'Legendary';
      baseAtk = 120 + i * 10;
      baseHp = 1200 + i * 100;
      enemyCount = Math.min(Math.ceil(i / 8), 5);
    } else {
      const roll = Math.random();
      rarity = roll > 0.5 ? 'SSR' : roll > 0.2 ? 'Legendary' : 'UR';
      baseAtk = 200 + i * 12;
      baseHp = 2000 + i * 120;
      enemyCount = 5;
    }
    
    const enemies = [];
    for (let e = 0; e < enemyCount; e++) {
      const nameIdx = Math.min(Math.floor((i - 1) / 4) + e, enemyNames.length - 1);
      enemies.push({
        name: enemyNames[nameIdx],
        element: elements[(i + e) % 5],
        atk: baseAtk + Math.floor(Math.random() * 20),
        hp: baseHp + Math.floor(Math.random() * 100),
        maxHp: baseHp + Math.floor(Math.random() * 100),
        rarity: rarity,
        level: Math.max(1, Math.floor(i / 2))
      });
    }
    
    const goldReward = 50 + i * 25;
    const xpReward = 20 + i * 10;
    
    let equipmentReward: string | undefined;
    if (i % 5 === 0) {
      const eqIdx = Math.min(Math.floor(i / 5) - 1, EQUIPMENT_POOL.length - 1);
      equipmentReward = EQUIPMENT_POOL[eqIdx].name;
    }
    
    floors.push({ floor: i, enemies, goldReward, xpReward, equipmentReward });
  }
  
  return floors;
}

export const TOWER_FLOORS = generateTowerFloors();

// ============================================
// BATTLE BACKGROUNDS
// ============================================

export const BATTLE_BACKGROUNDS = [
  { name: 'Hidden Leaf Village', url: 'https://mgx-backend-cdn.metadl.com/generate/images/986451/2026-02-24/9cf3e5b0-ad23-44ca-8c70-9a6065d0383a.png' },
  { name: 'Forest of Death', url: 'https://mgx-backend-cdn.metadl.com/generate/images/986451/2026-02-24/1616bf6e-4933-4b84-9966-214e591a707e.png' },
  { name: 'Akatsuki Hideout', url: 'https://mgx-backend-cdn.metadl.com/generate/images/986451/2026-02-24/0f3f58c5-0094-41d6-8550-e135eda35031.png' },
  { name: 'Chunin Exam Arena', url: 'https://mgx-backend-cdn.metadl.com/generate/images/986451/2026-02-24/858eefbb-1c2f-4ed0-a203-92fb748ee6d0.png' },
  { name: 'Hokage Monument', url: 'https://mgx-backend-cdn.metadl.com/generate/images/986451/2026-02-24/c00c205f-4993-4b86-8bd3-39346ef8de9e.png' }
];

export const NINJA_IMAGES: Record<string, string> = {
  'Naruto Uzumaki':  'https://i.imgur.com/YourNarutoImg.png',
  'Sasuke Uchiha':   'https://i.imgur.com/YourSasukeImg.png',
  'Kakashi Hatake':  'https://i.imgur.com/YourKakashiImg.png',
  'Sakura Haruno':   'https://i.imgur.com/YourSakuraImg.png',
  'Gaara':           'https://i.imgur.com/YourGaaraImg.png',
  'Rock Lee':        'https://i.imgur.com/YourRockLeeImg.png',
  'Hinata Hyuga':    'https://i.imgur.com/YourHinataImg.png',
  'Shikamaru Nara':  'https://i.imgur.com/YourShikaImg.png',
  'Itachi Uchiha':   'https://i.imgur.com/YourItachiImg.png',
  'Minato Namikaze': 'https://i.imgur.com/YourMinatoImg.png',
};

export function getRandomBackground() {
  return BATTLE_BACKGROUNDS[Math.floor(Math.random() * BATTLE_BACKGROUNDS.length)];
}