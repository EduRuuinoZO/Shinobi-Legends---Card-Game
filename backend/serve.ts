import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'path';
import User, { ICard, IEquipmentItem } from './User';
import {
  RARITY_MULTIPLIERS, getAscensionCost, getRankInfo, RANK_SYMBOLS,
  EQUIPMENT_POOL, TOWER_FLOORS, getRandomBackground, BATTLE_BACKGROUNDS
} from './cardDatabase';
import {
  openPack, generateCard, getEffectiveStats, calculateDamage,
  simulateBattle, prepareSquadFighters, awardXpToSquad, getSellPrice, BattleFighter
} from './gachaService';

const app = express();
app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../front-end')));

// ============================================
// MongoDB Connection
// ============================================
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/shinobi_legends';

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// ============================================
// Helper: Get or Create User
// ============================================
async function getOrCreateUser(username: string) {
  let user = await User.findOne({ username });
  if (!user) {
    user = new User({ username, gold: 1000, inventory: [], squad: [] });
    await user.save();
  }
  // Always filter nulls from inventory
  user.inventory = user.inventory.filter(c => c != null);
  return user;
}

// ============================================
// GET /status
// ============================================
app.get('/status', async (req, res) => {
  try {
    const username = (req.query.username as string) || 'EduardoNinja123';
    const user = await getOrCreateUser(username);
    res.json({
      username: user.username,
      gold: user.gold,
      cardCount: user.inventory.length,
      squadSize: user.squad.length,
      highestFloor: user.highestFloor,
      pvpPoints: user.pvpPoints,
      pvpWins: user.pvpWins,
      pvpLosses: user.pvpLosses
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// GET /inventory/:username
// ============================================
app.get('/inventory/:username', async (req, res) => {
  try {
    const user = await getOrCreateUser(req.params.username);
    res.json({
      username: user.username,
      gold: user.gold,
      inventory: user.inventory,
      squad: user.squad,
      equipmentInventory: user.equipmentInventory || []
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// POST /gacha/open
// ============================================
app.post('/gacha/open', async (req, res) => {
  try {
    const { username } = req.body;
    const user = await getOrCreateUser(username);

    if (user.gold < 100) {
      return res.status(400).json({ error: 'Not enough gold! Need 100G.' });
    }

    user.gold -= 100;
    const newCards = openPack();
    user.inventory.push(...newCards);
    await user.save();

    res.json({
      message: 'Pack opened!',
      cards: newCards,
      currentGold: user.gold
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// POST /mission/daily
// ============================================
app.post('/mission/daily', async (req, res) => {
  try {
    const { username } = req.body;
    const user = await getOrCreateUser(username);

    const now = new Date();
    if (user.lastDailyClaimAt) {
      const lastClaim = new Date(user.lastDailyClaimAt);
      const diffMs = now.getTime() - lastClaim.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      if (diffHours < 24) {
        const remainingMs = (24 * 60 * 60 * 1000) - diffMs;
        const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
        const remainingMinutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
        return res.status(400).json({
          error: `Daily mission already claimed! Come back in ${remainingHours}h ${remainingMinutes}m.`,
          nextClaimAt: new Date(lastClaim.getTime() + 24 * 60 * 60 * 1000),
          remainingMs
        });
      }
    }

    user.gold += 500;
    user.lastDailyClaimAt = now;
    await user.save();

    res.json({
      message: 'Daily mission completed! +500G',
      currentGold: user.gold,
      nextClaimAt: new Date(now.getTime() + 24 * 60 * 60 * 1000)
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// POST /squad/set
// ============================================
app.post('/squad/set', async (req, res) => {
  try {
    const { username, cardIds } = req.body;
    const user = await getOrCreateUser(username);

    if (!Array.isArray(cardIds) || cardIds.length === 0 || cardIds.length > 5) {
      return res.status(400).json({ error: 'Squad must have 1-5 cards.' });
    }

    // Validate all cards exist in inventory
    const validIds = cardIds.filter((id: string) =>
      user.inventory.some(c => c != null && c.id === id)
    );

    if (validIds.length === 0) {
      return res.status(400).json({ error: 'No valid cards found in inventory.' });
    }

    user.squad = validIds;
    await user.save();

    res.json({ message: `Squad set with ${validIds.length} cards.`, squad: validIds });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// POST /battle/choice (Single card battle)
// ============================================
app.post('/battle/choice', async (req, res) => {
  try {
    const { username, cardId } = req.body;
    const user = await getOrCreateUser(username);

    const card = user.inventory.find(c => c != null && c.id === cardId);
    if (!card) {
      return res.status(400).json({ error: 'Card not found in inventory.' });
    }

    // Generate random enemy
    const enemy = generateCard();
    enemy.level = Math.max(1, card.level - 1 + Math.floor(Math.random() * 3));

    const playerStats = getEffectiveStats(card);
    const bg = getRandomBackground();

    const playerFighter: BattleFighter = {
      id: card.id, name: card.name, element: card.element,
      atk: playerStats.atk, hp: playerStats.hp, maxHp: playerStats.maxHp,
      level: card.level, isPlayer: true
    };
    const enemyFighter: BattleFighter = {
      id: enemy.id, name: enemy.name, element: enemy.element,
      atk: enemy.atk, hp: enemy.hp, maxHp: enemy.maxHp,
      level: enemy.level, isPlayer: false
    };

    const result = simulateBattle([playerFighter], [enemyFighter]);

    // Award XP if won
    let xpGained = 0;
    let goldGained = 0;
    const levelUpMessages: string[] = [];

    if (result.winner === 'player') {
      xpGained = 30 + enemy.level * 5;
      goldGained = 20 + enemy.level * 3;
      card.xp += xpGained;
      user.gold += goldGained;

      const { applyLevelUp } = require('./cardDatabase');
      while (applyLevelUp(card)) {
        levelUpMessages.push(`${card.name} leveled up to Lv.${card.level}!`);
      }
    }

    user.battleHistory.push({
      type: 'choice',
      result: result.winner,
      date: new Date(),
      details: `vs ${enemy.name} (Lv.${enemy.level})`
    });

    await user.save();

    res.json({
      result: result.winner,
      log: result.log,
      xpGained,
      goldGained,
      levelUpMessages,
      background: bg,
      playerCard: { ...card.toObject ? card.toObject() : card, effectiveStats: playerStats },
      enemyCard: enemy
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// POST /battle/squad (Squad battle - Arcade)
// ============================================
app.post('/battle/squad', async (req, res) => {
  try {
    const { username } = req.body;
    const user = await getOrCreateUser(username);

    if (user.squad.length === 0) {
      return res.status(400).json({ error: 'No squad selected!' });
    }

    const playerCards = user.squad
      .map(id => user.inventory.find(c => c != null && c.id === id))
      .filter(c => c != null) as ICard[];

    if (playerCards.length === 0) {
      return res.status(400).json({ error: 'No valid cards in squad!' });
    }

    // Generate enemy squad
    const enemyCount = Math.min(playerCards.length + Math.floor(Math.random() * 2), 5);
    const enemyCards: ICard[] = [];
    for (let i = 0; i < enemyCount; i++) {
      const e = generateCard();
      e.level = Math.max(1, Math.floor(playerCards.reduce((s, c) => s + c.level, 0) / playerCards.length) + Math.floor(Math.random() * 3) - 1);
      enemyCards.push(e);
    }

    const playerFighters = prepareSquadFighters(playerCards, true);
    const enemyFighters = prepareSquadFighters(enemyCards, false);
    const bg = getRandomBackground();

    const result = simulateBattle(playerFighters, enemyFighters);

    let goldGained = 0;
    let xpGained = 0;
    let levelUpMessages: string[] = [];

    if (result.winner === 'player') {
      goldGained = 50 + enemyCards.length * 15;
      xpGained = 20 + enemyCards.length * 10;
      user.gold += goldGained;
      levelUpMessages = awardXpToSquad(user, xpGained);
    }

    user.battleHistory.push({
      type: 'squad',
      result: result.winner,
      date: new Date(),
      details: `Squad battle (${playerCards.length} vs ${enemyCards.length})`
    });

    await user.save();

    res.json({
      result: result.winner,
      log: result.log,
      goldGained,
      xpGained,
      levelUpMessages,
      background: bg,
      playerSquad: playerCards.map(c => ({ ...c.toObject ? c.toObject() : c, effectiveStats: getEffectiveStats(c) })),
      enemySquad: enemyCards
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// POST /battle/boss (Final Boss - Orochimaru)
// ============================================
app.post('/battle/boss', async (req, res) => {
  try {
    const { username } = req.body;
    const user = await getOrCreateUser(username);

    if (user.squad.length === 0) {
      return res.status(400).json({ error: 'No squad selected!' });
    }

    const playerCards = user.squad
      .map(id => user.inventory.find(c => c != null && c.id === id))
      .filter(c => c != null) as ICard[];

    if (playerCards.length === 0) {
      return res.status(400).json({ error: 'No valid cards in squad!' });
    }

    const boss: BattleFighter = {
      id: 'boss-orochimaru',
      name: 'Supreme Orochimaru',
      element: 'Earth',
      atk: 250,
      hp: 5000,
      maxHp: 5000,
      level: 50,
      isPlayer: false
    };

    const playerFighters = prepareSquadFighters(playerCards, true);
    const bg = { name: 'Akatsuki Hideout', url: BATTLE_BACKGROUNDS[2].url };

    const result = simulateBattle(playerFighters, [boss]);

    let goldGained = 0;
    let xpGained = 0;
    let levelUpMessages: string[] = [];

    if (result.winner === 'player') {
      goldGained = 500;
      xpGained = 100;
      user.gold += goldGained;
      levelUpMessages = awardXpToSquad(user, xpGained);
    }

    user.battleHistory.push({
      type: 'boss',
      result: result.winner,
      date: new Date(),
      details: 'vs Supreme Orochimaru'
    });

    await user.save();

    res.json({
      result: result.winner,
      log: result.log,
      goldGained,
      xpGained,
      levelUpMessages,
      background: bg,
      playerSquad: playerCards.map(c => ({ ...c.toObject ? c.toObject() : c, effectiveStats: getEffectiveStats(c) })),
      boss
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// POST /market/sell
// ============================================
app.post('/market/sell', async (req, res) => {
  try {
    const { username, cardId } = req.body;
    const user = await getOrCreateUser(username);

    const cardIndex = user.inventory.findIndex(c => c != null && c.id === cardId);
    if (cardIndex === -1) {
      return res.status(400).json({ error: 'Card not found.' });
    }

    const card = user.inventory[cardIndex];
    const price = getSellPrice(card);

    // Remove from squad if present
    user.squad = user.squad.filter(id => id !== cardId);
    // Remove from inventory
    user.inventory.splice(cardIndex, 1);
    user.gold += price;
    await user.save();

    res.json({
      message: `Sold ${card.name} for ${price}G!`,
      soldCard: card,
      goldEarned: price,
      currentGold: user.gold
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// POST /inventory/fuse (3 copies → AWAKENED)
// ============================================
app.post('/inventory/fuse', async (req, res) => {
  try {
    const { username, cardName } = req.body;
    const user = await getOrCreateUser(username);

    const copies = user.inventory.filter(c => c != null && c.name === cardName && !c.awakened);
    if (copies.length < 3) {
      return res.status(400).json({ error: `Need 3 copies of ${cardName}. Have ${copies.length}.` });
    }

    // Remove 3 copies
    let removed = 0;
    user.inventory = user.inventory.filter(c => {
      if (c != null && c.name === cardName && !c.awakened && removed < 3) {
        user.squad = user.squad.filter(id => id !== c.id);
        removed++;
        return false;
      }
      return true;
    });

    // Create awakened card
    const baseCard = copies[0];
    const awakenedCard: any = {
      id: `ninja-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `[AWAKENED] ${baseCard.name}`,
      element: baseCard.element,
      image: baseCard.image,
      rarity: baseCard.rarity,
      atk: Math.floor(baseCard.atk * 2.5),
      hp: Math.floor(baseCard.maxHp * 2.5),
      maxHp: Math.floor(baseCard.maxHp * 2.5),
      level: baseCard.level,
      xp: 0,
      stars: baseCard.stars,
      evolutionPoints: baseCard.evolutionPoints,
      awakened: true,
      equipment: { Weapon: null, Armor: null, Helmet: null, Boots: null, Scroll: null, Ring: null }
    };

    user.inventory.push(awakenedCard);
    await user.save();

    res.json({
      message: `Fusion complete! Created ${awakenedCard.name}!`,
      awakenedCard,
      currentGold: user.gold
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// POST /inventory/ascend (Star Ascension)
// ============================================
app.post('/inventory/ascend', async (req, res) => {
  try {
    const { username, cardId } = req.body;
    const user = await getOrCreateUser(username);

    const card = user.inventory.find(c => c != null && c.id === cardId);
    if (!card) {
      return res.status(400).json({ error: 'Card not found.' });
    }

    if (card.stars >= 7) {
      return res.status(400).json({ error: 'Card already at max stars (7)!' });
    }

    const cost = getAscensionCost(card.stars);

    if (user.gold < cost.gold) {
      return res.status(400).json({ error: `Not enough gold. Need ${cost.gold}G.` });
    }

    // Count copies (same name, different id)
    const copies = user.inventory.filter(c =>
      c != null && c.name === card.name && c.id !== card.id
    );

    if (copies.length < cost.copies) {
      return res.status(400).json({ error: `Need ${cost.copies} copies. Have ${copies.length}.` });
    }

    // Remove copies
    let removed = 0;
    user.inventory = user.inventory.filter(c => {
      if (c != null && c.name === card.name && c.id !== card.id && removed < cost.copies) {
        user.squad = user.squad.filter(sid => sid !== c.id);
        removed++;
        return false;
      }
      return true;
    });

    user.gold -= cost.gold;
    card.stars += 1;
    card.atk += 10;
    card.hp += 100;
    card.maxHp += 100;

    await user.save();

    res.json({
      message: `${card.name} ascended to ${card.stars} ⭐!`,
      card,
      currentGold: user.gold
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// POST /inventory/evolve-rank
// ============================================
app.post('/inventory/evolve-rank', async (req, res) => {
  try {
    const { username, cardId } = req.body;
    const user = await getOrCreateUser(username);

    const card = user.inventory.find(c => c != null && c.id === cardId);
    if (!card) {
      return res.status(400).json({ error: 'Card not found.' });
    }

    const goldCost = 200 + card.evolutionPoints * 50;
    if (user.gold < goldCost) {
      return res.status(400).json({ error: `Not enough gold. Need ${goldCost}G.` });
    }

    user.gold -= goldCost;
    card.evolutionPoints += 1;

    const rankInfo = getRankInfo(card.evolutionPoints);

    // Check if rank-up happened (every 25 points)
    const oldRankInfo = getRankInfo(card.evolutionPoints - 1);
    let rankUpMessage = '';
    if (rankInfo.rankIndex > oldRankInfo.rankIndex) {
      const rarityOrder = ['Common', 'Rare', 'Epic', 'Legendary', 'SSR', 'UR'];
      const currentRarityIdx = rarityOrder.indexOf(card.rarity);
      if (currentRarityIdx < rarityOrder.length - 1 && rankInfo.rankIndex % 2 === 0) {
        card.rarity = rarityOrder[currentRarityIdx + 1] as ICard['rarity'];
        const mult = RARITY_MULTIPLIERS[card.rarity] || 1;
        card.atk = Math.floor(card.atk * 1.1);
        card.hp = Math.floor(card.hp * 1.1);
        card.maxHp = Math.floor(card.maxHp * 1.1);
        rankUpMessage = ` Rarity upgraded to ${card.rarity}!`;
      }
    }

    await user.save();

    res.json({
      message: `Rank evolved! ${rankInfo.symbol} Step ${rankInfo.step + 1}/5${rankUpMessage}`,
      card,
      rankInfo,
      currentGold: user.gold
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// GET /ranking/level
// ============================================
app.get('/ranking/level', async (_req, res) => {
  try {
    const users = await User.find({});
    const rankings = users.map(u => {
      const inv = u.inventory.filter(c => c != null);
      const maxLevel = inv.length > 0 ? Math.max(...inv.map(c => c.level)) : 0;
      const totalPower = inv.reduce((sum, c) => sum + c.atk + c.hp, 0);
      return {
        username: u.username,
        maxLevel,
        totalPower,
        cardCount: inv.length
      };
    });

    rankings.sort((a, b) => b.maxLevel - a.maxLevel || b.totalPower - a.totalPower);
    res.json(rankings.slice(0, 10));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// POST /pvp/challenge
// ============================================
app.post('/pvp/challenge', async (req, res) => {
  try {
    const { attackerUsername, defenderUsername } = req.body;

    if (!attackerUsername || !defenderUsername) {
      return res.status(400).json({ error: 'Both attacker and defender usernames required.' });
    }

    if (attackerUsername === defenderUsername) {
      return res.status(400).json({ error: 'Cannot challenge yourself!' });
    }

    const attacker = await getOrCreateUser(attackerUsername);
    const defender = await getOrCreateUser(defenderUsername);

    if (attacker.squad.length === 0) {
      return res.status(400).json({ error: 'Attacker has no squad selected!' });
    }
    if (defender.squad.length === 0) {
      return res.status(400).json({ error: 'Defender has no squad selected!' });
    }

    const attackerCards = attacker.squad
      .map(id => attacker.inventory.find(c => c != null && c.id === id))
      .filter(c => c != null) as ICard[];

    const defenderCards = defender.squad
      .map(id => defender.inventory.find(c => c != null && c.id === id))
      .filter(c => c != null) as ICard[];

    if (attackerCards.length === 0) {
      return res.status(400).json({ error: 'Attacker has no valid cards in squad!' });
    }
    if (defenderCards.length === 0) {
      return res.status(400).json({ error: 'Defender has no valid cards in squad!' });
    }

    const attackerFighters = prepareSquadFighters(attackerCards, true);
    const defenderFighters = prepareSquadFighters(defenderCards, false);
    const bg = getRandomBackground();

    const result = simulateBattle(attackerFighters, defenderFighters);

    if (result.winner === 'player') {
      attacker.pvpPoints += 25;
      attacker.pvpWins += 1;
      defender.pvpPoints = Math.max(0, defender.pvpPoints - 10);
      defender.pvpLosses += 1;
      attacker.gold += 100;
    } else {
      defender.pvpPoints += 25;
      defender.pvpWins += 1;
      attacker.pvpPoints = Math.max(0, attacker.pvpPoints - 10);
      attacker.pvpLosses += 1;
    }

    attacker.battleHistory.push({
      type: 'pvp',
      result: result.winner === 'player' ? 'win' : 'loss',
      date: new Date(),
      details: `vs ${defenderUsername}`
    });
    defender.battleHistory.push({
      type: 'pvp',
      result: result.winner === 'player' ? 'loss' : 'win',
      date: new Date(),
      details: `vs ${attackerUsername}`
    });

    await attacker.save();
    await defender.save();

    res.json({
      result: result.winner === 'player' ? 'attacker_wins' : 'defender_wins',
      winner: result.winner === 'player' ? attackerUsername : defenderUsername,
      log: result.log,
      background: bg,
      attackerSquad: attackerCards.map(c => ({ ...c.toObject ? c.toObject() : c, effectiveStats: getEffectiveStats(c) })),
      defenderSquad: defenderCards.map(c => ({ ...c.toObject ? c.toObject() : c, effectiveStats: getEffectiveStats(c) })),
      pvpUpdate: {
        attacker: { pvpPoints: attacker.pvpPoints, pvpWins: attacker.pvpWins, pvpLosses: attacker.pvpLosses },
        defender: { pvpPoints: defender.pvpPoints, pvpWins: defender.pvpWins, pvpLosses: defender.pvpLosses }
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// GET /ranking/pvp
// ============================================
app.get('/ranking/pvp', async (_req, res) => {
  try {
    const users = await User.find({}).sort({ pvpPoints: -1 }).limit(20);
    const rankings = users.map(u => ({
      username: u.username,
      pvpPoints: u.pvpPoints,
      pvpWins: u.pvpWins,
      pvpLosses: u.pvpLosses,
      winRate: u.pvpWins + u.pvpLosses > 0
        ? Math.round((u.pvpWins / (u.pvpWins + u.pvpLosses)) * 100)
        : 0
    }));
    res.json(rankings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// POST /tower/fight
// ============================================
app.post('/tower/fight', async (req, res) => {
  try {
    const { username } = req.body;
    const user = await getOrCreateUser(username);

    if (user.squad.length === 0) {
      return res.status(400).json({ error: 'No squad selected!' });
    }

    const currentFloor = user.highestFloor;
    const floorData = TOWER_FLOORS.find(f => f.floor === currentFloor);
    if (!floorData) {
      return res.status(400).json({ error: 'Floor not found. You have conquered the tower!' });
    }

    const playerCards = user.squad
      .map(id => user.inventory.find(c => c != null && c.id === id))
      .filter(c => c != null) as ICard[];

    if (playerCards.length === 0) {
      return res.status(400).json({ error: 'No valid cards in squad!' });
    }

    const playerFighters = prepareSquadFighters(playerCards, true);
    const enemyFighters: BattleFighter[] = floorData.enemies.map((e, i) => ({
      id: `tower-enemy-${currentFloor}-${i}`,
      name: e.name,
      element: e.element,
      atk: e.atk,
      hp: e.hp,
      maxHp: e.maxHp,
      level: e.level,
      isPlayer: false
    }));

    const bg = getRandomBackground();
    const result = simulateBattle(playerFighters, enemyFighters);

    let goldGained = 0;
    let xpGained = 0;
    let levelUpMessages: string[] = [];
    let equipmentReward: any = null;

    if (result.winner === 'player') {
      goldGained = floorData.goldReward;
      xpGained = floorData.xpReward;
      user.gold += goldGained;
      levelUpMessages = awardXpToSquad(user, xpGained);
      user.highestFloor = currentFloor + 1;

      if (floorData.equipmentReward) {
        const eqTemplate = EQUIPMENT_POOL.find(e => e.name === floorData.equipmentReward);
        if (eqTemplate) {
          const newEquipment: IEquipmentItem = {
            id: `eq-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: eqTemplate.name,
            type: eqTemplate.type,
            rarity: eqTemplate.rarity,
            stars: eqTemplate.stars,
            rankSymbol: '⭐',
            atkBonus: eqTemplate.atkBonus,
            hpBonus: eqTemplate.hpBonus,
            level: 1,
            evolutionPoints: 0
          };
          user.equipmentInventory.push(newEquipment);
          equipmentReward = newEquipment;
        }
      }
    }

    user.battleHistory.push({
      type: 'tower',
      result: result.winner,
      date: new Date(),
      details: `Tower Floor ${currentFloor}`
    });

    await user.save();

    res.json({
      floor: currentFloor,
      result: result.winner,
      log: result.log,
      goldGained,
      xpGained,
      levelUpMessages,
      equipmentReward,
      nextFloor: result.winner === 'player' ? currentFloor + 1 : currentFloor,
      background: bg,
      playerSquad: playerCards.map(c => ({ ...c.toObject ? c.toObject() : c, effectiveStats: getEffectiveStats(c) })),
      enemySquad: floorData.enemies
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// POST /tower/reset
// ============================================
app.post('/tower/reset', async (req, res) => {
  try {
    const { username } = req.body;
    const user = await getOrCreateUser(username);

    const now = new Date();
    if (user.lastTowerReset) {
      const lastReset = new Date(user.lastTowerReset);
      const diffMs = now.getTime() - lastReset.getTime();
      if (diffMs < 24 * 60 * 60 * 1000) {
        const remainingMs = (24 * 60 * 60 * 1000) - diffMs;
        const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
        const remainingMinutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
        return res.status(400).json({
          error: `Tower already reset today! Come back in ${remainingHours}h ${remainingMinutes}m.`
        });
      }
    }

    user.highestFloor = 1;
    user.lastTowerReset = now;
    await user.save();

    res.json({ message: 'Tower reset! Starting from Floor 1.', highestFloor: 1 });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// GET /tower/status/:username
// ============================================
app.get('/tower/status/:username', async (req, res) => {
  try {
    const user = await getOrCreateUser(req.params.username);
    const currentFloor = user.highestFloor;
    const floorData = TOWER_FLOORS.find(f => f.floor === currentFloor);

    res.json({
      highestFloor: currentFloor,
      maxFloor: TOWER_FLOORS.length,
      currentFloorData: floorData || null,
      canReset: !user.lastTowerReset || (new Date().getTime() - new Date(user.lastTowerReset).getTime() >= 24 * 60 * 60 * 1000)
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// POST /equipment/equip
// ============================================
app.post('/equipment/equip', async (req, res) => {
  try {
    const { username, equipmentId, cardId } = req.body;
    const user = await getOrCreateUser(username);

    const eqIndex = user.equipmentInventory.findIndex(e => e != null && e.id === equipmentId);
    if (eqIndex === -1) {
      return res.status(400).json({ error: 'Equipment not found in your inventory.' });
    }

    const equipment = user.equipmentInventory[eqIndex];

    const card = user.inventory.find(c => c != null && c.id === cardId);
    if (!card) {
      return res.status(400).json({ error: 'Card not found in inventory.' });
    }

    for (const invCard of user.inventory) {
      if (invCard == null || invCard.id === cardId) continue;
      if (invCard.equipment) {
        const slots: Array<'Weapon' | 'Armor' | 'Helmet' | 'Boots' | 'Scroll' | 'Ring'> = ['Weapon', 'Armor', 'Helmet', 'Boots', 'Scroll', 'Ring'];
        for (const slot of slots) {
          const eq = invCard.equipment[slot];
          if (eq != null && eq.id === equipmentId) {
            return res.status(400).json({ error: `Equipment already equipped on ${invCard.name}. Unequip first.` });
          }
        }
      }
    }

    const slot = equipment.type as 'Weapon' | 'Armor' | 'Helmet' | 'Boots' | 'Scroll' | 'Ring';

    if (!card.equipment) {
      (card as any).equipment = { Weapon: null, Armor: null, Helmet: null, Boots: null, Scroll: null, Ring: null };
    }

    if (card.equipment[slot] != null) {
      return res.status(400).json({ error: `${slot} slot already occupied. Unequip first.` });
    }

    const slots: Array<'Weapon' | 'Armor' | 'Helmet' | 'Boots' | 'Scroll' | 'Ring'> = ['Weapon', 'Armor', 'Helmet', 'Boots', 'Scroll', 'Ring'];
    for (const s of slots) {
      const eq = card.equipment[s];
      if (eq != null && eq.id === equipmentId) {
        return res.status(400).json({ error: 'Equipment already equipped on this card.' });
      }
    }

    card.equipment[slot] = equipment;
    user.equipmentInventory.splice(eqIndex, 1);

    user.markModified('inventory');
    await user.save();

    res.json({
      message: `${equipment.name} equipped on ${card.name}!`,
      card,
      effectiveStats: getEffectiveStats(card)
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// POST /equipment/unequip
// ============================================
app.post('/equipment/unequip', async (req, res) => {
  try {
    const { username, cardId, slot } = req.body;
    const user = await getOrCreateUser(username);

    const card = user.inventory.find(c => c != null && c.id === cardId);
    if (!card) {
      return res.status(400).json({ error: 'Card not found.' });
    }

    const validSlots = ['Weapon', 'Armor', 'Helmet', 'Boots', 'Scroll', 'Ring'];
    if (!validSlots.includes(slot)) {
      return res.status(400).json({ error: 'Invalid slot.' });
    }

    const typedSlot = slot as 'Weapon' | 'Armor' | 'Helmet' | 'Boots' | 'Scroll' | 'Ring';
    const equipment = card.equipment ? card.equipment[typedSlot] : null;
    if (equipment == null) {
      return res.status(400).json({ error: `No equipment in ${slot} slot.` });
    }

    user.equipmentInventory.push(equipment);
    card.equipment[typedSlot] = null;

    user.markModified('inventory');
    await user.save();

    res.json({
      message: `${equipment.name} unequipped from ${card.name}!`,
      card,
      effectiveStats: getEffectiveStats(card)
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// GET /equipment/list/:username
// ============================================
app.get('/equipment/list/:username', async (req, res) => {
  try {
    const user = await getOrCreateUser(req.params.username);
    res.json({
      equipmentInventory: user.equipmentInventory || [],
      equippedOnCards: user.inventory.filter(c => c != null).map(c => ({
        cardId: c.id,
        cardName: c.name,
        equipment: c.equipment
      })).filter(c => {
        if (!c.equipment) return false;
        const slots = ['Weapon', 'Armor', 'Helmet', 'Boots', 'Scroll', 'Ring'] as const;
        return slots.some(s => c.equipment[s] != null);
      })
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// POST /admin/cleanInventory
// ============================================
app.post('/admin/cleanInventory', async (req, res) => {
  try {
    const { username } = req.body;
    const user = await getOrCreateUser(username);
    const before = user.inventory.length;
    user.inventory = user.inventory.filter(c => c != null);
    const after = user.inventory.length;
    await user.save();
    res.json({ message: `Cleaned inventory. Removed ${before - after} null entries.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// GET /backgrounds
// ============================================
app.get('/backgrounds', (_req, res) => {
  res.json(BATTLE_BACKGROUNDS);
});

// ============================================
// GET /card/detail/:username/:cardId
// ============================================
app.get('/card/detail/:username/:cardId', async (req, res) => {
  try {
    const user = await getOrCreateUser(req.params.username);
    const card = user.inventory.find(c => c != null && c.id === req.params.cardId);
    if (!card) {
      return res.status(404).json({ error: 'Card not found.' });
    }

    const effectiveStats = getEffectiveStats(card);
    const rankInfo = getRankInfo(card.evolutionPoints);
    const battleHistory = user.battleHistory
      .filter(b => b.details && b.details.includes(card.name))
      .slice(-10);

    res.json({
      card,
      effectiveStats,
      rankInfo,
      battleHistory
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
// ============================================
// POST /admin/addgold
// ============================================
app.post('/admin/addgold', async (req, res) => {
  try {
    const { username, amount } = req.body;

    if (!username || !amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Informe username e amount válidos.' });
    }

    const user = await getOrCreateUser(username);
    user.gold += Number(amount);
    await user.save();

    res.json({
      message: `+${amount}G adicionado com sucesso!`,
      username: user.username,
      currentGold: user.gold
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// Start Server
// ============================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🎮 Shinobi Legends server running on http://localhost:${PORT}`);
});
