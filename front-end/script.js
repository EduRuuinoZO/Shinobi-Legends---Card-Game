// ============================================
// SHINOBI LEGENDS - GAME ENGINE
// ============================================

const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3000'
  : '';

const USERNAME = 'EduardoNinja123';

const ELEMENT_ICONS = { Fire: '🔥', Wind: '🌪️', Lightning: '⚡', Earth: '🌍', Water: '💧' };
const RARITY_ORDER = { Common: 0, Rare: 1, Epic: 2, Legendary: 3, SSR: 4, UR: 5 };
const NINJA_EMOJIS = {
  'Naruto Uzumaki': '🦊', 'Sasuke Uchiha': '⚡', 'Kakashi Hatake': '📖',
  'Sakura Haruno': '🌸', 'Gaara': '🏜️', 'Rock Lee': '💪',
  'Hinata Hyuga': '👁️', 'Shikamaru Nara': '🦌', 'Itachi Uchiha': '🌙',
  'Minato Namikaze': '⚡'
};

const EQUIP_TYPE_ICONS = { Weapon: '⚔️', Armor: '🛡️', Helmet: '⛑️', Boots: '👢', Scroll: '📜', Ring: '💍' };

// ============================================
// STATE
// ============================================
const state = {
  gold: 0,
  inventory: [],
  squad: [],
  equipmentInventory: [],
  highestFloor: 1,
  pvpPoints: 0,
  pvpWins: 0,
  pvpLosses: 0,
  selectedSquad: [],
  currentScreen: 'home',
  selectedEquipmentId: null
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

function getBaseNinjaName(name) {
  return (name || '').replace('[AWAKENED] ', '');
}

function getNinjaEmoji(name) {
  const base = getBaseNinjaName(name);
  return NINJA_EMOJIS[base] || '🥷';
}

function getSellPrice(card) {
  const basePrices = { Common: 20, Rare: 50, Epic: 120, Legendary: 300, SSR: 600, UR: 1200 };
  let price = basePrices[card.rarity] || 20;
  price += card.level * 5;
  price += card.stars * 50;
  return price;
}

function getRankInfo(evolutionPoints) {
  const symbols = ['⭐', '🌙', '⬜', '💎', '🔥', '👑', '⚡', '🌀', '🏆', '🔮'];
  const idx = Math.min(Math.floor((evolutionPoints || 0) / 25), symbols.length - 1);
  const step = Math.min((evolutionPoints || 0) % 25, 4);
  return { symbol: symbols[idx], step, rankIndex: idx };
}

async function apiCall(url, method, body) {
  try {
    const opts = { method: method || 'GET', headers: { 'Content-Type': 'application/json' } };
    if (body) { opts.body = JSON.stringify(body); }
    const res = await fetch(API_BASE + url, opts);
    const data = await res.json();
    if (!res.ok) { throw new Error(data.error || 'Request failed'); }
    return data;
  } catch (err) {
    showToast(err.message, 'error');
    throw err;
  }
}

function showToast(message, type) {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast ' + (type || 'info');
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(function() { if (toast.parentNode) { toast.remove(); } }, 3000);
}

// ============================================
// CARD HTML RENDERER
// ============================================

function renderCardHTML(card, options) {
  if (card == null) return '';
  var opts = options || {};
  var emoji = getNinjaEmoji(card.name);
  var elementIcon = ELEMENT_ICONS[card.element] || '❓';
  var rankInfo = getRankInfo(card.evolutionPoints);
  var starsStr = card.stars > 0 ? '⭐'.repeat(Math.min(card.stars, 7)) : '';
  var selectedClass = opts.selected ? ' selected' : '';
  var clickAction = opts.onClick || '';
  var awakenedBadge = card.awakened ? '<div class="text-xs text-pink-400 font-bold mt-1">✨ AWAKENED</div>' : '';

  return '<div class="ninja-card rarity-' + card.rarity + selectedClass + '" onclick="' + clickAction + '" title="' + card.name + '">' +
    '<div class="card-level">Lv.' + card.level + '</div>' +
    '<div class="card-element">' + elementIcon + '</div>' +
    '<div class="card-image">' + emoji + '</div>' +
    '<div class="card-name">' + card.name + '</div>' +
    '<div class="card-rarity rarity-color-' + card.rarity + '">' + card.rarity + ' ' + rankInfo.symbol + '</div>' +
    awakenedBadge +
    '<div class="card-stats">⚔️ ' + card.atk + ' | ❤️ ' + card.hp + '/' + card.maxHp + '</div>' +
    (starsStr ? '<div class="card-stars">' + starsStr + '</div>' : '') +
    (opts.extra || '') +
    '</div>';
}

function renderEquipmentHTML(eq, options) {
  if (eq == null) return '';
  var opts = options || {};
  var icon = EQUIP_TYPE_ICONS[eq.type] || '📦';
  var clickAction = opts.onClick || '';

  return '<div class="equipment-card rarity-' + eq.rarity + '" onclick="' + clickAction + '">' +
    '<div class="flex items-center gap-2 mb-1">' +
      '<span class="text-xl">' + icon + '</span>' +
      '<span class="font-bold text-sm">' + eq.name + '</span>' +
    '</div>' +
    '<div class="text-xs rarity-color-' + eq.rarity + ' font-semibold">' + eq.rarity + ' ' + eq.type + '</div>' +
    '<div class="text-xs text-slate-400 mt-1">⚔️ +' + eq.atkBonus + ' | ❤️ +' + eq.hpBonus + '</div>' +
    (opts.extra || '') +
    '</div>';
}

// ============================================
// NAVIGATION
// ============================================

function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(function(s) { s.classList.remove('active'); });
  document.querySelectorAll('.nav-tab').forEach(function(t) { t.classList.remove('active'); });

  var screen = document.getElementById('screen-' + screenId);
  if (screen) { screen.classList.add('active'); }

  var tab = document.querySelector('.nav-tab[data-tab="' + screenId + '"]');
  if (tab) { tab.classList.add('active'); }

  state.currentScreen = screenId;

  // Refresh screen data
  if (screenId === 'inventory') { renderInventory(); }
  else if (screenId === 'squad') { renderSquadBuilder(); }
  else if (screenId === 'battle') { renderQuickBattle(); }
  else if (screenId === 'tower') { loadTowerStatus(); }
  else if (screenId === 'pvp') { updatePvpStats(); }
  else if (screenId === 'equipment') { renderEquipmentScreen(); }
  else if (screenId === 'market') { renderMarket(); }
  else if (screenId === 'ranking') { loadRanking('level'); }
}

// ============================================
// LOAD PLAYER DATA
// ============================================

async function loadPlayerData() {
  try {
    var data = await apiCall('/inventory/' + USERNAME, 'GET');
    state.gold = data.gold || 0;
    state.inventory = (data.inventory || []).filter(function(c) { return c != null; });
    state.squad = data.squad || [];
    state.equipmentInventory = (data.equipmentInventory || []).filter(function(e) { return e != null; });
    state.selectedSquad = state.squad.slice();
    updateNavBar();
    return data;
  } catch (err) {
    console.error('Failed to load player data:', err);
  }
}

async function loadStatus() {
  try {
    var data = await apiCall('/status?username=' + USERNAME, 'GET');
    state.highestFloor = data.highestFloor || 1;
    state.pvpPoints = data.pvpPoints || 0;
    state.pvpWins = data.pvpWins || 0;
    state.pvpLosses = data.pvpLosses || 0;
    updateNavBar();
  } catch (err) {
    console.error('Failed to load status:', err);
  }
}

function updateNavBar() {
  var el;
  el = document.getElementById('navGold'); if (el) el.textContent = '💰 ' + state.gold + 'G';
  el = document.getElementById('navCards'); if (el) el.textContent = '🃏 ' + state.inventory.length + ' cards';
  el = document.getElementById('navFloor'); if (el) el.textContent = '🏯 Floor ' + state.highestFloor;
  el = document.getElementById('navPvp'); if (el) el.textContent = '⚔️ PVP: ' + state.pvpPoints;
  el = document.getElementById('homeGold'); if (el) el.textContent = state.gold;
  el = document.getElementById('homeCards'); if (el) el.textContent = state.inventory.length;
  el = document.getElementById('homeFloor'); if (el) el.textContent = state.highestFloor;
  el = document.getElementById('homePvp'); if (el) el.textContent = state.pvpPoints;
}

// ============================================
// DAILY MISSION
// ============================================

async function claimDaily() {
  try {
    var data = await apiCall('/mission/daily', 'POST', { username: USERNAME });
    state.gold = data.currentGold;
    updateNavBar();
    showToast(data.message, 'success');
    var timer = document.getElementById('dailyTimer');
    if (timer) { timer.classList.remove('hidden'); timer.textContent = 'Next claim available in 24 hours.'; }
  } catch (err) {
    // Error already shown by apiCall
  }
}

// ============================================
// GACHA
// ============================================

async function openPack() {
  try {
    var data = await apiCall('/gacha/open', 'POST', { username: USERNAME });
    state.gold = data.currentGold;
    var newCards = data.cards || [];
    state.inventory = state.inventory.concat(newCards);
    updateNavBar();
    showToast('Pack opened! Got ' + newCards.length + ' cards!', 'success');

    var container = document.getElementById('gachaResults');
    if (container) {
      container.innerHTML = newCards.map(function(card) {
        return '<div class="gacha-card">' + renderCardHTML(card, { onClick: "Game.showCardDetail('" + card.id + "')" }) + '</div>';
      }).join('');
    }
  } catch (err) {
    // Error shown by apiCall
  }
}

// ============================================
// INVENTORY
// ============================================

function renderInventory() {
  var searchEl = document.getElementById('searchInput');
  var rarityEl = document.getElementById('filterRarity');
  var elementEl = document.getElementById('filterElement');
  var sortEl = document.getElementById('sortBy');

  var search = searchEl ? searchEl.value.toLowerCase() : '';
  var filterRarity = rarityEl ? rarityEl.value : '';
  var filterElement = elementEl ? elementEl.value : '';
  var sortBy = sortEl ? sortEl.value : 'rarity';

  var cards = state.inventory.filter(function(c) {
    if (c == null) return false;
    if (search && c.name.toLowerCase().indexOf(search) === -1) return false;
    if (filterRarity && c.rarity !== filterRarity) return false;
    if (filterElement && c.element !== filterElement) return false;
    return true;
  });

  cards.sort(function(a, b) {
    if (sortBy === 'rarity') return (RARITY_ORDER[b.rarity] || 0) - (RARITY_ORDER[a.rarity] || 0);
    if (sortBy === 'atk') return b.atk - a.atk;
    if (sortBy === 'hp') return b.hp - a.hp;
    if (sortBy === 'level') return b.level - a.level;
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    return 0;
  });

  var grid = document.getElementById('inventoryGrid');
  if (grid) {
    grid.innerHTML = cards.map(function(card) {
      return renderCardHTML(card, { onClick: "Game.showCardDetail('" + card.id + "')" });
    }).join('');
  }
}

// ============================================
// CARD DETAIL MODAL
// ============================================

function showCardDetail(cardId) {
  var card = state.inventory.find(function(c) { return c != null && c.id === cardId; });
  if (!card) { showToast('Card not found', 'error'); return; }

  var rankInfo = getRankInfo(card.evolutionPoints);
  var emoji = getNinjaEmoji(card.name);
  var elementIcon = ELEMENT_ICONS[card.element] || '❓';
  var starsStr = card.stars > 0 ? '⭐'.repeat(Math.min(card.stars, 7)) : 'None';

  // Equipment display
  var eqSlots = ['Weapon', 'Armor', 'Helmet', 'Boots', 'Scroll', 'Ring'];
  var eqHTML = eqSlots.map(function(slot) {
    var eq = card.equipment ? card.equipment[slot] : null;
    var icon = EQUIP_TYPE_ICONS[slot] || '📦';
    if (eq != null) {
      return '<div class="flex items-center justify-between bg-shinobi-dark rounded-lg p-2 mb-1">' +
        '<span>' + icon + ' ' + eq.name + ' <span class="rarity-color-' + eq.rarity + ' text-xs">(' + eq.rarity + ')</span></span>' +
        '<span class="text-xs text-slate-400">⚔️+' + eq.atkBonus + ' ❤️+' + eq.hpBonus + '</span>' +
        '</div>';
    }
    return '<div class="flex items-center bg-shinobi-dark rounded-lg p-2 mb-1 text-slate-600">' + icon + ' ' + slot + ' — Empty</div>';
  }).join('');

  // Calculate effective stats
  var totalAtk = card.atk;
  var totalHp = card.maxHp;
  if (card.equipment) {
    eqSlots.forEach(function(slot) {
      var eq = card.equipment[slot];
      if (eq != null) { totalAtk += eq.atkBonus; totalHp += eq.hpBonus; }
    });
  }

  var content = document.getElementById('cardDetailContent');
  if (content) {
    content.innerHTML =
      '<div class="text-center mb-4">' +
        '<div class="text-6xl mb-2">' + emoji + '</div>' +
        '<h3 class="text-2xl font-bold">' + card.name + '</h3>' +
        '<div class="rarity-color-' + card.rarity + ' font-bold text-lg">' + card.rarity + '</div>' +
        (card.awakened ? '<div class="text-pink-400 font-bold">✨ AWAKENED ✨</div>' : '') +
      '</div>' +
      '<div class="grid grid-cols-2 gap-3 mb-4">' +
        '<div class="bg-shinobi-dark rounded-lg p-3 text-center"><div class="text-slate-400 text-xs">Element</div><div class="text-lg">' + elementIcon + ' ' + card.element + '</div></div>' +
        '<div class="bg-shinobi-dark rounded-lg p-3 text-center"><div class="text-slate-400 text-xs">Level</div><div class="text-lg font-bold">' + card.level + '</div></div>' +
        '<div class="bg-shinobi-dark rounded-lg p-3 text-center"><div class="text-slate-400 text-xs">Base ATK</div><div class="text-lg font-bold text-red-400">' + card.atk + '</div></div>' +
        '<div class="bg-shinobi-dark rounded-lg p-3 text-center"><div class="text-slate-400 text-xs">Base HP</div><div class="text-lg font-bold text-green-400">' + card.maxHp + '</div></div>' +
        '<div class="bg-shinobi-dark rounded-lg p-3 text-center"><div class="text-slate-400 text-xs">Effective ATK</div><div class="text-lg font-bold text-orange-400">' + totalAtk + '</div></div>' +
        '<div class="bg-shinobi-dark rounded-lg p-3 text-center"><div class="text-slate-400 text-xs">Effective HP</div><div class="text-lg font-bold text-teal-400">' + totalHp + '</div></div>' +
        '<div class="bg-shinobi-dark rounded-lg p-3 text-center"><div class="text-slate-400 text-xs">Stars</div><div class="text-lg">' + starsStr + '</div></div>' +
        '<div class="bg-shinobi-dark rounded-lg p-3 text-center"><div class="text-slate-400 text-xs">Rank</div><div class="text-lg">' + rankInfo.symbol + ' Step ' + (rankInfo.step + 1) + '/5</div></div>' +
      '</div>' +
      '<div class="mb-4"><div class="text-sm font-bold text-slate-300 mb-2">XP Progress</div>' +
        '<div class="h-3 bg-shinobi-dark rounded-full overflow-hidden"><div class="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" style="width:' + Math.min(100, (card.xp / (100 + (card.level - 1) * 50)) * 100) + '%"></div></div>' +
        '<div class="text-xs text-slate-400 mt-1">' + card.xp + ' / ' + (100 + (card.level - 1) * 50) + ' XP</div>' +
      '</div>' +
      '<div class="mb-4"><div class="text-sm font-bold text-slate-300 mb-2">Equipment</div>' + eqHTML + '</div>' +
      '<div class="flex flex-wrap gap-2">' +
        '<button onclick="Game.fuseCard(\'' + card.name + '\')" class="btn-primary text-sm">🔥 Fuse (3 copies)</button>' +
        '<button onclick="Game.ascendCard(\'' + card.id + '\')" class="btn-secondary text-sm">⭐ Ascend Star</button>' +
        '<button onclick="Game.evolveRank(\'' + card.id + '\')" class="btn-secondary text-sm">' + rankInfo.symbol + ' Evolve Rank</button>' +
        '<button onclick="Game.sellCard(\'' + card.id + '\')" class="btn-danger text-sm">💰 Sell (' + getSellPrice(card) + 'G)</button>' +
      '</div>';
  }

  var modal = document.getElementById('cardDetailModal');
  if (modal) { modal.classList.remove('hidden'); }
}

function closeCardDetail() {
  var modal = document.getElementById('cardDetailModal');
  if (modal) { modal.classList.add('hidden'); }
}

// ============================================
// FUSION
// ============================================

async function fuseCard(cardName) {
  var baseName = getBaseNinjaName(cardName);
  try {
    var data = await apiCall('/inventory/fuse', 'POST', { username: USERNAME, cardName: baseName });
    showToast(data.message, 'success');
    closeCardDetail();
    await loadPlayerData();
    renderInventory();
  } catch (err) { /* shown */ }
}

// ============================================
// STAR ASCENSION
// ============================================

async function ascendCard(cardId) {
  try {
    var data = await apiCall('/inventory/ascend', 'POST', { username: USERNAME, cardId: cardId });
    showToast(data.message, 'success');
    state.gold = data.currentGold;
    updateNavBar();
    closeCardDetail();
    await loadPlayerData();
    renderInventory();
  } catch (err) { /* shown */ }
}

// ============================================
// RANK EVOLUTION
// ============================================

async function evolveRank(cardId) {
  try {
    var data = await apiCall('/inventory/evolve-rank', 'POST', { username: USERNAME, cardId: cardId });
    showToast(data.message, 'success');
    state.gold = data.currentGold;
    updateNavBar();
    closeCardDetail();
    await loadPlayerData();
    renderInventory();
  } catch (err) { /* shown */ }
}

// ============================================
// SELL CARD
// ============================================

async function sellCard(cardId) {
  if (!confirm('Are you sure you want to sell this card?')) return;
  try {
    var data = await apiCall('/market/sell', 'POST', { username: USERNAME, cardId: cardId });
    showToast(data.message, 'success');
    state.gold = data.currentGold;
    state.inventory = state.inventory.filter(function(c) { return c != null && c.id !== cardId; });
    updateNavBar();
    closeCardDetail();
    renderInventory();
    renderMarket();
  } catch (err) { /* shown */ }
}

// ============================================
// SQUAD BUILDER
// ============================================

function renderSquadBuilder() {
  state.selectedSquad = state.squad.slice();

  // Render squad slots
  var slotsContainer = document.getElementById('squadSlots');
  if (slotsContainer) {
    var slotsHTML = '';
    for (var i = 0; i < 5; i++) {
      var cardId = state.selectedSquad[i];
      var card = cardId ? state.inventory.find(function(c) { return c != null && c.id === cardId; }) : null;
      if (card) {
        slotsHTML += '<div class="squad-slot filled" onclick="Game.removeFromSquad(' + i + ')">' +
          '<div class="text-center">' +
            '<div class="text-2xl">' + getNinjaEmoji(card.name) + '</div>' +
            '<div class="text-xs font-bold mt-1">' + card.name + '</div>' +
            '<div class="text-xs text-slate-400">Lv.' + card.level + ' ⚔️' + card.atk + '</div>' +
            '<div class="text-xs text-red-400 mt-1">Click to remove</div>' +
          '</div></div>';
      } else {
        slotsHTML += '<div class="squad-slot empty">Slot ' + (i + 1) + '</div>';
      }
    }
    slotsContainer.innerHTML = slotsHTML;
  }

  // Render available cards
  var available = state.inventory.filter(function(c) {
    return c != null && state.selectedSquad.indexOf(c.id) === -1;
  });

  var availContainer = document.getElementById('squadAvailable');
  if (availContainer) {
    availContainer.innerHTML = available.map(function(card) {
  return renderCardHTML(card, { onClick: "Game.addToSquad(&quot;" + card.id + "&quot;)" });
}).join('');
  }
}

function addToSquad(cardId) {
  if (state.selectedSquad.length >= 5) { showToast('Squad is full (max 5)!', 'error'); return; }
  if (state.selectedSquad.indexOf(cardId) !== -1) { showToast('Card already in squad!', 'error'); return; }
  state.selectedSquad.push(cardId);
  renderSquadBuilder();
}

function removeFromSquad(index) {
  state.selectedSquad.splice(index, 1);
  renderSquadBuilder();
}

async function saveSquad() {
  if (state.selectedSquad.length === 0) { showToast('Select at least 1 card!', 'error'); return; }
  try {
    var data = await apiCall('/squad/set', 'POST', { username: USERNAME, cardIds: state.selectedSquad });
    state.squad = state.selectedSquad.slice();
    showToast(data.message, 'success');
  } catch (err) { /* shown */ }
}

// ============================================
// BATTLE VISUAL SYSTEM
// ============================================

function openBattleModal(battleData) {
  var modal = document.getElementById('battleModal');
  if (!modal) return;
  modal.classList.remove('hidden');

  // Set background
  var bgEl = document.getElementById('battleBackground');
  if (bgEl && battleData.background) {
    bgEl.style.backgroundImage = 'url(' + battleData.background.url + ')';
  }

  var locEl = document.getElementById('battleLocationName');
  if (locEl && battleData.background) {
    locEl.textContent = '📍 ' + battleData.background.name;
  }

  // Render player side
  var playerSide = document.getElementById('battlePlayerSide');
  var enemySide = document.getElementById('battleEnemySide');
  var playerSquad = battleData.playerSquad || [];
  var enemySquad = battleData.enemySquad || [];

  if (playerSide) {
    playerSide.innerHTML = '<div class="text-center text-sm font-bold text-green-400 mb-2">YOUR SQUAD</div>' +
      playerSquad.map(function(c, i) {
        return '<div class="battle-fighter" id="player-fighter-' + i + '">' +
          '<div class="flex items-center gap-2">' +
            '<span class="text-xl">' + getNinjaEmoji(c.name) + '</span>' +
            '<div><div class="fighter-name">' + c.name + '</div>' +
            '<div class="text-xs text-slate-400">Lv.' + c.level + ' ' + (ELEMENT_ICONS[c.element] || '') + ' ⚔️' + (c.effectiveStats ? c.effectiveStats.atk : c.atk) + '</div></div>' +
          '</div>' +
          '<div class="hp-bar-container"><div class="hp-bar" id="player-hp-' + i + '" style="width:100%"></div></div>' +
          '<div class="text-xs text-slate-400 mt-1" id="player-hp-text-' + i + '">' + (c.effectiveStats ? c.effectiveStats.hp : c.hp) + '/' + (c.effectiveStats ? c.effectiveStats.maxHp : c.maxHp) + '</div>' +
        '</div>';
      }).join('');
  }

  if (enemySide) {
    enemySide.innerHTML = '<div class="text-center text-sm font-bold text-red-400 mb-2">ENEMY SQUAD</div>' +
      enemySquad.map(function(c, i) {
        return '<div class="battle-fighter" id="enemy-fighter-' + i + '">' +
          '<div class="flex items-center gap-2">' +
            '<span class="text-xl">' + getNinjaEmoji(c.name) + '</span>' +
            '<div><div class="fighter-name">' + c.name + '</div>' +
            '<div class="text-xs text-slate-400">Lv.' + c.level + ' ' + (ELEMENT_ICONS[c.element] || '') + ' ⚔️' + c.atk + '</div></div>' +
          '</div>' +
          '<div class="hp-bar-container"><div class="hp-bar" id="enemy-hp-' + i + '" style="width:100%"></div></div>' +
          '<div class="text-xs text-slate-400 mt-1" id="enemy-hp-text-' + i + '">' + c.hp + '/' + c.maxHp + '</div>' +
        '</div>';
      }).join('');
  }

  // Animate battle log
  var logEl = document.getElementById('battleLog');
  var resultEl = document.getElementById('battleResult');
  var closeBtn = document.getElementById('battleCloseBtn');
  if (logEl) { logEl.innerHTML = ''; }
  if (resultEl) { resultEl.classList.add('hidden'); }
  if (closeBtn) { closeBtn.classList.add('hidden'); }

  var log = battleData.log || [];
  var delay = 0;
  var interval = 150;

  log.forEach(function(entry, idx) {
    setTimeout(function() {
      if (!logEl) return;
      var cls = 'log-entry';
      if (entry.indexOf('VICTORY') !== -1) cls += ' victory';
      else if (entry.indexOf('DEFEAT') !== -1) cls += ' defeat';
      else if (entry.indexOf('🔄') !== -1 || entry.indexOf('⚔️') !== -1) cls += ' info';

      var div = document.createElement('div');
      div.className = cls;
      div.textContent = entry;
      logEl.appendChild(div);
      logEl.scrollTop = logEl.scrollHeight;

      // Show result on last entry
      if (idx === log.length - 1) {
        setTimeout(function() {
          if (resultEl) {
            var isVictory = battleData.result === 'player' || battleData.result === 'attacker_wins';
            resultEl.className = 'battle-result ' + (isVictory ? 'victory' : 'defeat');
            resultEl.innerHTML = isVictory ? '🏆 VICTORY!' : '💔 DEFEAT';

            if (battleData.goldGained) {
              resultEl.innerHTML += '<div class="text-lg text-shinobi-gold mt-2">+' + battleData.goldGained + 'G</div>';
            }
            if (battleData.xpGained) {
              resultEl.innerHTML += '<div class="text-sm text-indigo-400">+' + battleData.xpGained + ' XP</div>';
            }
            if (battleData.levelUpMessages && battleData.levelUpMessages.length > 0) {
              resultEl.innerHTML += '<div class="text-sm text-green-400 mt-1">' + battleData.levelUpMessages.join('<br>') + '</div>';
            }
            if (battleData.equipmentReward) {
              resultEl.innerHTML += '<div class="text-sm text-purple-400 mt-1">🛡️ Equipment: ' + battleData.equipmentReward.name + '</div>';
            }
            resultEl.classList.remove('hidden');
          }
          if (closeBtn) { closeBtn.classList.remove('hidden'); }
        }, 500);
      }
    }, delay);
    delay += interval;
  });
}

function closeBattle() {
  var modal = document.getElementById('battleModal');
  if (modal) { modal.classList.add('hidden'); }
  loadPlayerData();
  loadStatus();
}

// ============================================
// QUICK BATTLE (Single Card)
// ============================================

function renderQuickBattle() {
  var container = document.getElementById('quickBattleCards');
  if (!container) return;
  container.innerHTML = state.inventory.map(function(card) {
  return renderCardHTML(card, { onClick: "Game.quickBattle(&quot;" + card.id + "&quot;)" });
}).join('');
}

async function quickBattle(cardId) {
  try {
    var data = await apiCall('/battle/choice', 'POST', { username: USERNAME, cardId: cardId });
    var playerCard = data.playerCard;
    var enemyCard = data.enemyCard;

    openBattleModal({
      result: data.result,
      log: data.log,
      background: data.background,
      playerSquad: [playerCard],
      enemySquad: [enemyCard],
      goldGained: data.goldGained,
      xpGained: data.xpGained,
      levelUpMessages: data.levelUpMessages
    });
  } catch (err) { /* shown */ }
}

// ============================================
// SQUAD BATTLE (Arcade)
// ============================================

async function startSquadBattle() {
  if (state.squad.length === 0) { showToast('Set your squad first!', 'error'); return; }
  try {
    var data = await apiCall('/battle/squad', 'POST', { username: USERNAME });
    openBattleModal({
      result: data.result,
      log: data.log,
      background: data.background,
      playerSquad: data.playerSquad || [],
      enemySquad: data.enemySquad || [],
      goldGained: data.goldGained,
      xpGained: data.xpGained,
      levelUpMessages: data.levelUpMessages
    });
  } catch (err) { /* shown */ }
}

// ============================================
// BOSS BATTLE
// ============================================

async function startBossBattle() {
  if (state.squad.length === 0) { showToast('Set your squad first!', 'error'); return; }
  try {
    var data = await apiCall('/battle/boss', 'POST', { username: USERNAME });
    openBattleModal({
      result: data.result,
      log: data.log,
      background: data.background,
      playerSquad: data.playerSquad || [],
      enemySquad: data.boss ? [data.boss] : [],
      goldGained: data.goldGained,
      xpGained: data.xpGained,
      levelUpMessages: data.levelUpMessages
    });
  } catch (err) { /* shown */ }
}

// ============================================
// TOWER
// ============================================

async function loadTowerStatus() {
  try {
    var data = await apiCall('/tower/status/' + USERNAME, 'GET');
    state.highestFloor = data.highestFloor || 1;
    updateNavBar();

    var floorEl = document.getElementById('towerFloor');
    if (floorEl) floorEl.textContent = data.highestFloor;

    var diffEl = document.getElementById('towerDifficulty');
    if (diffEl) {
      var floor = data.highestFloor;
      var diff = 'Common/Rare';
      if (floor > 40) diff = 'Legendary/SSR/UR';
      else if (floor > 20) diff = 'Epic/Legendary';
      else if (floor > 10) diff = 'Rare/Epic';
      diffEl.textContent = 'Difficulty: ' + diff;
    }

    if (data.currentFloorData) {
      var goldEl = document.getElementById('towerGoldReward');
      if (goldEl) goldEl.textContent = 'Reward: ' + data.currentFloorData.goldReward + 'G';
      var xpEl = document.getElementById('towerXpReward');
      if (xpEl) xpEl.textContent = 'XP: ' + data.currentFloorData.xpReward;
      var eqEl = document.getElementById('towerEqReward');
      if (eqEl) eqEl.textContent = data.currentFloorData.equipmentReward ? '🛡️ ' + data.currentFloorData.equipmentReward : '';

      var enemiesEl = document.getElementById('towerEnemies');
      if (enemiesEl && data.currentFloorData.enemies) {
        enemiesEl.innerHTML = '<div class="text-sm font-bold text-slate-300 mb-2">Enemies:</div>' +
          '<div class="flex flex-wrap gap-2">' +
          data.currentFloorData.enemies.map(function(e) {
            return '<div class="bg-shinobi-dark rounded-lg px-3 py-2 text-xs">' +
              '<span class="font-bold">' + e.name + '</span> ' +
              (ELEMENT_ICONS[e.element] || '') + ' Lv.' + e.level +
              ' <span class="text-red-400">⚔️' + e.atk + '</span>' +
              ' <span class="text-green-400">❤️' + e.hp + '</span>' +
            '</div>';
          }).join('') + '</div>';
      }
    }

    var resetBtn = document.getElementById('towerResetBtn');
    if (resetBtn) {
      resetBtn.disabled = !data.canReset;
      resetBtn.style.opacity = data.canReset ? '1' : '0.5';
    }
  } catch (err) { /* shown */ }
}

async function fightTower() {
  if (state.squad.length === 0) { showToast('Set your squad first!', 'error'); return; }
  try {
    var data = await apiCall('/tower/fight', 'POST', { username: USERNAME });
    state.highestFloor = data.nextFloor;
    updateNavBar();

    openBattleModal({
      result: data.result,
      log: data.log,
      background: data.background,
      playerSquad: data.playerSquad || [],
      enemySquad: (data.enemySquad || []).map(function(e) {
        return { name: e.name, element: e.element, atk: e.atk, hp: e.hp, maxHp: e.maxHp || e.hp, level: e.level || 1 };
      }),
      goldGained: data.goldGained,
      xpGained: data.xpGained,
      levelUpMessages: data.levelUpMessages,
      equipmentReward: data.equipmentReward
    });
  } catch (err) { /* shown */ }
}

async function resetTower() {
  if (!confirm('Reset tower to Floor 1?')) return;
  try {
    var data = await apiCall('/tower/reset', 'POST', { username: USERNAME });
    showToast(data.message, 'success');
    state.highestFloor = 1;
    updateNavBar();
    loadTowerStatus();
  } catch (err) { /* shown */ }
}

// ============================================
// PVP
// ============================================

function updatePvpStats() {
  var el;
  el = document.getElementById('pvpPoints'); if (el) el.textContent = state.pvpPoints;
  el = document.getElementById('pvpWins'); if (el) el.textContent = state.pvpWins;
  el = document.getElementById('pvpLosses'); if (el) el.textContent = state.pvpLosses;
}

async function challengePvp() {
  var targetEl = document.getElementById('pvpTarget');
  var target = targetEl ? targetEl.value.trim() : '';
  if (!target) { showToast('Enter opponent username!', 'error'); return; }
  if (target === USERNAME) { showToast('Cannot challenge yourself!', 'error'); return; }
  if (state.squad.length === 0) { showToast('Set your squad first!', 'error'); return; }

  try {
    var data = await apiCall('/pvp/challenge', 'POST', {
      attackerUsername: USERNAME,
      defenderUsername: target
    });

    if (data.pvpUpdate) {
      state.pvpPoints = data.pvpUpdate.attacker.pvpPoints;
      state.pvpWins = data.pvpUpdate.attacker.pvpWins;
      state.pvpLosses = data.pvpUpdate.attacker.pvpLosses;
      updatePvpStats();
      updateNavBar();
    }

    openBattleModal({
      result: data.result,
      log: data.log,
      background: data.background,
      playerSquad: data.attackerSquad || [],
      enemySquad: data.defenderSquad || [],
      goldGained: data.result === 'attacker_wins' ? 100 : 0,
      xpGained: 0,
      levelUpMessages: []
    });
  } catch (err) { /* shown */ }
}

// ============================================
// EQUIPMENT
// ============================================

function renderEquipmentScreen() {
  // Unequipped items
  var listEl = document.getElementById('equipmentList');
  var noEqEl = document.getElementById('noEquipment');

  if (listEl) {
    if (state.equipmentInventory.length === 0) {
      listEl.innerHTML = '';
      if (noEqEl) noEqEl.classList.remove('hidden');
    } else {
      if (noEqEl) noEqEl.classList.add('hidden');
      listEl.innerHTML = state.equipmentInventory.map(function(eq) {
        var selectedClass = state.selectedEquipmentId === eq.id ? ' border-green-400' : '';
        return '<div class="equipment-card rarity-' + eq.rarity + selectedClass + '" onclick="Game.selectEquipment(\'' + eq.id + '\')">' +
          '<div class="flex items-center gap-2 mb-1">' +
            '<span class="text-xl">' + (EQUIP_TYPE_ICONS[eq.type] || '📦') + '</span>' +
            '<span class="font-bold text-sm">' + eq.name + '</span>' +
          '</div>' +
          '<div class="text-xs rarity-color-' + eq.rarity + ' font-semibold">' + eq.rarity + ' ' + eq.type + '</div>' +
          '<div class="text-xs text-slate-400 mt-1">⚔️ +' + eq.atkBonus + ' | ❤️ +' + eq.hpBonus + '</div>' +
          (state.selectedEquipmentId === eq.id ? '<div class="text-xs text-green-400 mt-1 font-bold">✓ Selected</div>' : '') +
        '</div>';
      }).join('');
    }
  }

  // Card select dropdown
  var selectEl = document.getElementById('equipCardSelect');
  if (selectEl) {
    selectEl.innerHTML = '<option value="">Select a card to equip...</option>' +
      state.inventory.map(function(c) {
        if (c == null) return '';
        return '<option value="' + c.id + '">' + c.name + ' (Lv.' + c.level + ' ' + c.rarity + ')</option>';
      }).join('');
    selectEl.onchange = function() { renderCardEquipSlots(selectEl.value); };
  }

  renderCardEquipSlots(selectEl ? selectEl.value : '');
}

function selectEquipment(eqId) {
  state.selectedEquipmentId = state.selectedEquipmentId === eqId ? null : eqId;
  renderEquipmentScreen();
}

function renderCardEquipSlots(cardId) {
  var container = document.getElementById('equipCardSlots');
  if (!container) return;

  if (!cardId) {
    container.innerHTML = '<div class="text-slate-500 col-span-3 text-center py-4">Select a card above to manage equipment slots.</div>';
    return;
  }

  var card = state.inventory.find(function(c) { return c != null && c.id === cardId; });
  if (!card) { container.innerHTML = ''; return; }

  var slots = ['Weapon', 'Armor', 'Helmet', 'Boots', 'Scroll', 'Ring'];
  container.innerHTML = slots.map(function(slot) {
    var eq = card.equipment ? card.equipment[slot] : null;
    var icon = EQUIP_TYPE_ICONS[slot] || '📦';

    if (eq != null) {
      return '<div class="bg-shinobi-mid border border-slate-600 rounded-xl p-4">' +
        '<div class="flex items-center gap-2 mb-2">' +
          '<span class="text-2xl">' + icon + '</span>' +
          '<div><div class="font-bold">' + eq.name + '</div>' +
          '<div class="text-xs rarity-color-' + eq.rarity + '">' + eq.rarity + '</div></div>' +
        '</div>' +
        '<div class="text-sm text-slate-400">⚔️ +' + eq.atkBonus + ' | ❤️ +' + eq.hpBonus + '</div>' +
        '<button onclick="Game.unequipItem(\'' + cardId + '\', \'' + slot + '\')" class="btn-danger text-xs mt-2 w-full">Unequip</button>' +
      '</div>';
    }

    return '<div class="bg-shinobi-mid border border-dashed border-slate-600 rounded-xl p-4">' +
      '<div class="flex items-center gap-2 mb-2">' +
        '<span class="text-2xl opacity-40">' + icon + '</span>' +
        '<div class="text-slate-500 font-bold">' + slot + ' — Empty</div>' +
      '</div>' +
      (state.selectedEquipmentId ? '<button onclick="Game.equipItem(\'' + cardId + '\')" class="btn-success text-xs mt-2 w-full">Equip Selected</button>' : '<div class="text-xs text-slate-600">Select equipment above</div>') +
    '</div>';
  }).join('');
}

async function equipItem(cardId) {
  if (!state.selectedEquipmentId) { showToast('Select equipment first!', 'error'); return; }
  try {
    var data = await apiCall('/equipment/equip', 'POST', {
      username: USERNAME,
      equipmentId: state.selectedEquipmentId,
      cardId: cardId
    });
    showToast(data.message, 'success');
    state.selectedEquipmentId = null;
    await loadPlayerData();
    renderEquipmentScreen();
  } catch (err) { /* shown */ }
}

async function unequipItem(cardId, slot) {
  try {
    var data = await apiCall('/equipment/unequip', 'POST', {
      username: USERNAME,
      cardId: cardId,
      slot: slot
    });
    showToast(data.message, 'success');
    await loadPlayerData();
    renderEquipmentScreen();
  } catch (err) { /* shown */ }
}

// ============================================
// MARKET
// ============================================

function renderMarket() {
  var container = document.getElementById('marketGrid');
  if (!container) return;

  container.innerHTML = state.inventory.map(function(card) {
    if (card == null) return '';
    var price = getSellPrice(card);
    return renderCardHTML(card, {
      onClick: "Game.sellCard('" + card.id + "')",
      extra: '<div class="mt-2 text-center"><span class="text-shinobi-gold font-bold text-sm">💰 ' + price + 'G</span></div>'
    });
  }).join('');
}

// ============================================
// RANKING
// ============================================

async function loadRanking(type) {
  // Update tab styles
  document.querySelectorAll('.ranking-tab').forEach(function(t) {
    t.classList.remove('btn-primary');
    t.classList.add('btn-secondary');
    t.classList.remove('active');
  });
  var activeTab = document.querySelector('.ranking-tab[data-ranking="' + type + '"]');
  if (activeTab) {
    activeTab.classList.add('btn-primary', 'active');
    activeTab.classList.remove('btn-secondary');
  }

  var container = document.getElementById('rankingTable');
  if (!container) return;

  try {
    if (type === 'level') {
      var data = await apiCall('/ranking/level', 'GET');
      container.innerHTML =
        '<div class="ranking-row header"><div>Rank</div><div>Player</div><div>Max Lv</div><div>Power</div><div>Cards</div></div>' +
        (data || []).map(function(r, i) {
          var rankClass = i === 0 ? 'rank-1' : i === 1 ? 'rank-2' : i === 2 ? 'rank-3' : '';
          var medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '#' + (i + 1);
          return '<div class="ranking-row"><div class="rank ' + rankClass + '">' + medal + '</div><div class="font-bold">' + r.username + '</div><div>' + r.maxLevel + '</div><div class="text-shinobi-gold">' + r.totalPower + '</div><div>' + r.cardCount + '</div></div>';
        }).join('');
    } else {
      var pvpData = await apiCall('/ranking/pvp', 'GET');
      container.innerHTML =
        '<div class="ranking-row header"><div>Rank</div><div>Player</div><div>Points</div><div>W/L</div><div>Win%</div></div>' +
        (pvpData || []).map(function(r, i) {
          var rankClass = i === 0 ? 'rank-1' : i === 1 ? 'rank-2' : i === 2 ? 'rank-3' : '';
          var medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '#' + (i + 1);
          return '<div class="ranking-row"><div class="rank ' + rankClass + '">' + medal + '</div><div class="font-bold">' + r.username + '</div><div class="text-purple-400">' + r.pvpPoints + '</div><div><span class="text-green-400">' + r.pvpWins + '</span>/<span class="text-red-400">' + r.pvpLosses + '</span></div><div>' + r.winRate + '%</div></div>';
        }).join('');
    }
  } catch (err) { /* shown */ }
}

function showRanking(type) {
  loadRanking(type);
}
// Configurações de animação e delay
const BATTLE_DELAY = 1000; 

async function startSquadBattle(enemySquad, battleTitle = "Combate Shinobi") {
    const modal = document.getElementById('battleModal');
    const logContainer = document.getElementById('battleLog');
    const playerSide = document.getElementById('battlePlayerSide');
    const enemySide = document.getElementById('battleEnemySide');
    
    // Preparar Arena
    modal.classList.remove('hidden');
    logContainer.innerHTML = `<div class="text-indigo-400 font-bold">Iniciando: ${battleTitle}</div>`;
    document.getElementById('battleLocationName').innerText = battleTitle;
    
    // Clonar o squad para não resetar o HP original do estado do jogo
    let playerTeam = state.squad.map(c => ({ ...c, currentHp: c.hp }));
    let enemyTeam = enemySquad.map(e => ({ ...e, currentHp: e.hp }));

    renderBattleTeams(playerTeam, enemyTeam);

    // Loop de Batalha Simples (1 vs 1 do Squad ou em massa)
    let turn = 0;
    while (playerTeam.some(c => c.currentHp > 0) && enemyTeam.some(e => e.currentHp > 0)) {
        const attacker = turn % 2 === 0 ? playerTeam[0] : enemyTeam[0];
        const defender = turn % 2 === 0 ? enemyTeam[0] : playerTeam[0];

        await performAttack(attacker, defender, turn % 2 === 0);
        
        // Remover mortos
        if (defender.currentHp <= 0) {
            logContainer.innerHTML += `<div class="text-red-500">${defender.name} foi derrotado!</div>`;
            if (turn % 2 === 0) enemyTeam.shift(); else playerTeam.shift();
        }

        turn++;
        await new Promise(r => setTimeout(r, BATTLE_DELAY));
        logContainer.scrollTop = logContainer.scrollHeight;
    }

    // Resultado Final
    showBattleResult(playerTeam.length > 0);
}

async function performAttack(attacker, defender, isPlayerAttacking) {
    const log = document.getElementById('battleLog');
    const damage = Math.max(10, attacker.atk - (defender.def || 0) / 2);
    
    defender.currentHp -= damage;

    // Animação Visual
    const attackerEl = document.querySelector(`[data-id="${attacker.id}"]`);
    const defenderEl = document.querySelector(`[data-id="${defender.id}"]`);

    if (attackerEl) attackerEl.classList.add('animate-attack');
    if (defenderEl) {
        defenderEl.classList.add('animate-damage');
        updateHPBar(defender);
    }

    log.innerHTML += `<div>${attacker.name} causou <span class="text-yellow-400">${Math.floor(damage)}</span> de dano em ${defender.name}</div>`;

    await new Promise(r => setTimeout(r, 600));
    if (attackerEl) attackerEl.classList.remove('animate-attack');
    if (defenderEl) defenderEl.classList.remove('animate-damage');
}

function updateHPBar(char) {
    const bar = document.querySelector(`[data-hp-id="${char.id}"]`);
    if (bar) {
        const percent = Math.max(0, (char.currentHp / char.hp) * 100);
        bar.style.width = `${percent}%`;
    }
}
function renderBattleTeams(playerTeam, enemyTeam) {
    const pSide = document.getElementById('battlePlayerSide');
    const eSide = document.getElementById('battleEnemySide');

    const cardHTML = (char) => `
        <div class="flex flex-col items-center p-2 bg-slate-800 rounded-lg border border-slate-600 transition-all duration-300" data-id="${char.id}">
            <img src="${char.image}" class="w-16 h-16 rounded-full border-2 border-indigo-500 shadow-glow mb-2 object-cover">
            <div class="text-xs font-bold uppercase">${char.name}</div>
            <div class="hp-bar-container">
                <div class="hp-bar-fill" data-hp-id="${char.id}" style="width: 100%"></div>
            </div>
            <div class="text-[10px] text-slate-400 mt-1">ATK: ${char.atk}</div>
        </div>
    `;

    pSide.innerHTML = playerTeam.map(cardHTML).join('');
    eSide.innerHTML = enemyTeam.map(cardHTML).join('');
}
// ============================================
// INITIALIZE
// ============================================

async function init() {
  await loadPlayerData();
  await loadStatus();
  showScreen('home');
}

// ============================================
// GLOBAL GAME OBJECT
// ============================================

window.Game = {
  showScreen: showScreen,
  claimDaily: claimDaily,
  openPack: openPack,
  renderInventory: renderInventory,
  showCardDetail: showCardDetail,
  closeCardDetail: closeCardDetail,
  fuseCard: fuseCard,
  ascendCard: ascendCard,
  evolveRank: evolveRank,
  sellCard: sellCard,
  addToSquad: addToSquad,
  removeFromSquad: removeFromSquad,
  saveSquad: saveSquad,
  quickBattle: quickBattle,
  startSquadBattle: startSquadBattle,
  startBossBattle: startBossBattle,
  fightTower: fightTower,
  resetTower: resetTower,
  challengePvp: challengePvp,
  selectEquipment: selectEquipment,
  equipItem: equipItem,
  unequipItem: unequipItem,
  showRanking: showRanking,
  closeBattle: closeBattle,
  loadPlayerData: loadPlayerData,
  init: init
};

// Auto-init on load
document.addEventListener('DOMContentLoaded', init);