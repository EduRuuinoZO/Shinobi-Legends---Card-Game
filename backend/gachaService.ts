import { BASE_NINJAS, RARITY_MULTIPLIERS, RARITY_WEIGHTS, getElementMultiplier, applyLevelUp, getXpToNextLevel } from './cardDatabase';
import { ICard, IUser } from './User';

// ============================================
// GACHA SERVICE
// ============================================

function rollRarity(): string {
  const totalWeight = RARITY_WEIGHTS.reduce((sum, r) => sum + r.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const r of RARITY_WEIGHTS) {
    roll -= r.weight;
    if (roll <= 0) return r.rarity;
  }
  return 'Common';
}

export function generateCard(): ICard {
  const base = BASE_NINJAS[Math.floor(Math.random() * BASE_NINJAS.length)];
  const rarity = rollRarity();
  const mult = RARITY_MULTIPLIERS[rarity] || 1;
  const atk = Math.floor(base.baseAtk * mult);
  const hp = Math.floor(base.baseHp * mult);

  return {
    id: `ninja-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: base.name,
    element: base.element,
    image: base.image,
    rarity: rarity as ICard['rarity'],
    atk,
    hp,
    maxHp: hp,
    level: 1,
    xp: 0,
    stars: 0,
    evolutionPoints: 0,
    awakened: false,
    equipment: {
      Weapon: null,
      Armor: null,
      Helmet: null,
      Boots: null,
      Scroll: null,
      Ring: null
    }
  } as ICard;
}

export function openPack(): ICard[] {
  const cards: ICard[] = [];
  for (let i = 0; i < 5; i++) {
    cards.push(generateCard());
  }
  return cards;
}

// ============================================
// CALCULATE EFFECTIVE STATS (base + equipment)
// ============================================

export function getEffectiveStats(card: ICard): { atk: number; hp: number; maxHp: number } {
  let totalAtk = card.atk;
  let totalHp = card.hp;
  let totalMaxHp = card.maxHp;

  if (card.equipment) {
    const slots: Array<'Weapon' | 'Armor' | 'Helmet' | 'Boots' | 'Scroll' | 'Ring'> = ['Weapon', 'Armor', 'Helmet', 'Boots', 'Scroll', 'Ring'];
    for (const slot of slots) {
      const eq = card.equipment[slot];
      if (eq != null) {
        totalAtk += eq.atkBonus;
        totalHp += eq.hpBonus;
        totalMaxHp += eq.hpBonus;
      }
    }
  }

  return { atk: totalAtk, hp: totalHp, maxHp: totalMaxHp };
}

// ============================================
// UNIFIED DAMAGE CALCULATION
// ============================================

export function calculateDamage(
  attackerAtk: number,
  attackerElement: string,
  defenderElement: string,
  defenderLevel: number
): number {
  // Step 1: Base ATK
  let damage = attackerAtk;
  // Step 2: Element advantage
  const elementMult = getElementMultiplier(attackerElement, defenderElement);
  damage = Math.floor(damage * elementMult);
  // Step 3: Subtract defender level scaling
  damage -= defenderLevel * 2;
  // Step 4: Minimum damage = 5
  return Math.max(damage, 5);
}

// ============================================
// BATTLE SIMULATION (Turn-based)
// ============================================

export interface BattleFighter {
  id: string;
  name: string;
  element: string;
  atk: number;
  hp: number;
  maxHp: number;
  level: number;
  isPlayer: boolean;
}

export interface BattleResult {
  winner: 'player' | 'enemy';
  log: string[];
  playerSurvivors: number;
  enemySurvivors: number;
}

export function simulateBattle(
  playerSquad: BattleFighter[],
  enemySquad: BattleFighter[]
): BattleResult {
  const log: string[] = [];
  let pIdx = 0;
  let eIdx = 0;

  log.push(`⚔️ Battle begins! ${playerSquad.length} vs ${enemySquad.length} ninjas!`);

  let turn = 0;
  const maxTurns = 200;

  while (pIdx < playerSquad.length && eIdx < enemySquad.length && turn < maxTurns) {
    turn++;
    const attacker = playerSquad[pIdx];
    const defender = enemySquad[eIdx];

    // Player attacks
    const pDmg = calculateDamage(attacker.atk, attacker.element, defender.element, defender.level);
    defender.hp -= pDmg;
    const elementNote = getElementMultiplier(attacker.element, defender.element) > 1 ? ' 🔥 Element advantage!' :
                        getElementMultiplier(attacker.element, defender.element) < 1 ? ' 💧 Element disadvantage!' : '';
    log.push(`Turn ${turn}: ${attacker.name} deals ${pDmg} damage to ${defender.name}${elementNote} (HP: ${Math.max(0, defender.hp)}/${defender.maxHp})`);

    if (defender.hp <= 0) {
      log.push(`💀 ${defender.name} is defeated!`);
      eIdx++;
      if (eIdx >= enemySquad.length) break;
      log.push(`🔄 Next enemy: ${enemySquad[eIdx].name}`);
      continue;
    }

    // Enemy attacks
    const eDmg = calculateDamage(defender.atk, defender.element, attacker.element, attacker.level);
    attacker.hp -= eDmg;
    const eElementNote = getElementMultiplier(defender.element, attacker.element) > 1 ? ' 🔥 Element advantage!' :
                         getElementMultiplier(defender.element, attacker.element) < 1 ? ' 💧 Element disadvantage!' : '';
    log.push(`Turn ${turn}: ${defender.name} deals ${eDmg} damage to ${attacker.name}${eElementNote} (HP: ${Math.max(0, attacker.hp)}/${attacker.maxHp})`);

    if (attacker.hp <= 0) {
      log.push(`💀 ${attacker.name} is defeated!`);
      pIdx++;
      if (pIdx >= playerSquad.length) break;
      log.push(`🔄 Next ally: ${playerSquad[pIdx].name}`);
    }
  }

  const playerWon = eIdx >= enemySquad.length;
  const winner = playerWon ? 'player' : 'enemy';
  const playerSurvivors = playerSquad.length - pIdx;
  const enemySurvivors = enemySquad.length - eIdx;

  log.push(playerWon ? '🏆 VICTORY! Your squad wins!' : '💔 DEFEAT! The enemy prevails...');

  return { winner, log, playerSurvivors, enemySurvivors };
}

// ============================================
// PREPARE SQUAD FOR BATTLE
// ============================================

export function prepareSquadFighters(cards: ICard[], isPlayer: boolean): BattleFighter[] {
  return cards.filter((c: ICard | null): c is ICard => c != null).map(card => {
    const stats = getEffectiveStats(card);
    return {
      id: card.id,
      name: card.name,
      element: card.element,
      atk: stats.atk,
      hp: stats.hp,
      maxHp: stats.maxHp,
      level: card.level,
      isPlayer
    };
  });
}

// ============================================
// AWARD XP TO SQUAD
// ============================================

export function awardXpToSquad(user: IUser, xpAmount: number): string[] {
  const messages: string[] = [];
  // FIXED: type predicate narrows array to ICard[], eliminates implicit 'any' on findIndex callback
  const inventory = user.inventory.filter((c: ICard | null): c is ICard => c != null);
  
  for (const squadCardId of user.squad) {
    const cardIndex = inventory.findIndex((c: ICard) => c.id === squadCardId);
    if (cardIndex === -1) continue;
    
    const card = inventory[cardIndex];
    card.xp += xpAmount;
    
    let leveled = false;
    while (applyLevelUp(card)) {
      leveled = true;
    }
    
    if (leveled) {
      messages.push(`${card.name} leveled up to Lv.${card.level}! (ATK: ${card.atk}, HP: ${card.maxHp})`);
    }
  }
  
  return messages;
}

// ============================================
// SELL PRICE CALCULATION
// ============================================

export function getSellPrice(card: ICard): number {
  const basePrices: Record<string, number> = {
    'Common': 20,
    'Rare': 50,
    'Epic': 120,
    'Legendary': 300,
    'SSR': 600,
    'UR': 1200
  };
  let price = basePrices[card.rarity] || 20;
  price += card.level * 5;
  price += card.stars * 50;
  return price;
}