// ============================================
// SHINOBI LEGENDS - GAME ENGINE
// ============================================

const API_BASE = window.location.origin;

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
  selectedEquipmentId: null,
  filterEquipType: '',
  battleSpeed: 1,
  skipBattle: false,
  forgeTab: 'upgrade',
  fusionSlot1: null,
  fusionSlot2: null
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
  var elementIcon = ELEMENT_ICONS[card.element] || '❓';
  var rankInfo = getRankInfo(card.evolutionPoints);
  var starsStr = card.stars > 0 ? '⭐'.repeat(Math.min(card.stars, 7)) : 'None';
  var selectedClass = opts.selected ? ' selected' : '';
  var clickAction = opts.onClick || '';
  var awakenedBadge = card.awakened 
   ? '<div class="text-xs text-pink-400 font-bold mt-1">✨ AWAKENED ✨</div>'
    : '';
  
  // Dōjutsu Shader Detector
  var dojutsuClass = '';
  var nameLower = (card.name || '').toLowerCase();
  if (nameLower.indexOf('sasuke') !== -1 || nameLower.indexOf('itachi') !== -1 || nameLower.indexOf('madara') !== -1) {
    dojutsuClass = ' dojutsu-sharingan';
  } else if (nameLower.indexOf('pain') !== -1 || nameLower.indexOf('nagato') !== -1) {
    dojutsuClass = ' dojutsu-rinnegan';
  } else if (nameLower.indexOf('hinata') !== -1 || nameLower.indexOf('neji') !== -1) {
    dojutsuClass = ' dojutsu-byakugan';
  }

  var cardImage = '';
  if (card.image) {
    cardImage = '<img src="' + card.image + '" alt="' + card.name + '" class="w-16 h-16 object-cover rounded-lg mx-auto' + dojutsuClass + '" onerror="this.style.display=\'none\'">';
  } else {
    var element = card.element || 'Fire';
    var gradients = {
      Fire: 'from-orange-600/30 to-red-900/40 border-red-500/50 text-orange-400',
      Wind: 'from-emerald-600/30 to-teal-900/40 border-emerald-500/50 text-emerald-400',
      Lightning: 'from-amber-500/30 to-indigo-900/40 border-purple-500/50 text-yellow-300',
      Earth: 'from-amber-800/30 to-stone-900/40 border-amber-700/50 text-amber-500',
      Water: 'from-blue-600/30 to-sky-950/40 border-blue-500/50 text-blue-400'
    };
    var gradientClass = gradients[element] || 'from-indigo-600/30 to-slate-900/40 border-indigo-500/50 text-slate-300';
    var emoji = getNinjaEmoji(card.name);
    cardImage = '<div class="ninja-avatar-pbr relative w-16 h-16 rounded-full mx-auto flex items-center justify-center border bg-gradient-to-b ' + gradientClass + ' ' + dojutsuClass + ' shadow-glow-inner">' +
                  '<span class="text-3xl filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">' + emoji + '</span>' +
                  '<div class="absolute inset-0 rounded-full bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none"></div>' +
                '</div>';
  }

  var eqCount = 0;
  if (card.equipment) {
    var slots = ['Weapon', 'Armor', 'Helmet', 'Boots', 'Scroll', 'Ring'];
    slots.forEach(function(s) { if (card.equipment[s] != null) eqCount++; });
  }
  var eqBadge = eqCount > 0 ? '<div class="card-equip-badge" title="' + eqCount + ' equipment slots equipped">🛡️ ' + eqCount + '/6</div>' : '';

  return '<div class="card-pbr-container card-pbr-specular inline-block w-full">' +
    '<div class="ninja-card rarity-' + card.rarity + selectedClass + '" onclick="' + clickAction + '" title="' + card.name + '">' +
      '<div class="card-level">Lv.' + card.level + '</div>' +
      '<div class="card-element">' + elementIcon + '</div>' +
      eqBadge +
      '<div class="card-image">' + cardImage + '</div>' +
      '<div class="card-name">' + card.name + '</div>' +
      '<div class="card-rarity rarity-color-' + card.rarity + '">' + card.rarity + ' ' + rankInfo.symbol + '</div>' +
      awakenedBadge + 
      '<div class="card-stats">⚔️ ' + card.atk + ' | ❤️ ' + card.maxHp + '/' + card.maxHp + '</div>' +
      (starsStr ? '<div class="card-stars">' + starsStr + '</div>' : '') + 
      (opts.extra || '') +
    '</div>' +
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
// SQUAD BUILDER SYSTEM
// ============================================

function getCardTotalPower(card) {
  if (!card) return 0;
  var totalAtk = card.atk || 0;
  var totalHp = card.hp || 0;
  if (card.equipment) {
    var slots = ['Weapon', 'Armor', 'Helmet', 'Boots', 'Scroll', 'Ring'];
    slots.forEach(function(s) {
      if (card.equipment[s]) {
        totalAtk += card.equipment[s].atkBonus || 0;
        totalHp += card.equipment[s].hpBonus || 0;
      }
    });
  }
  return totalAtk + Math.floor(totalHp / 5);
}

function renderSquadBuilder() {
  if (state.selectedSquad.length === 0 && state.squad && state.squad.length > 0) {
    state.selectedSquad = state.squad.slice();
  }

  // Calculate Total Squad Power
  var totalPower = 0;
  var squadCards = [];

  var slotsContainer = document.getElementById('squadSlots');
  if (slotsContainer) {
    var slotsHTML = '';
    for (var i = 0; i < 5; i++) {
      var cardId = state.selectedSquad[i];
      var card = cardId
        ? state.inventory.find(function(c) { return c != null && c.id === cardId; })
        : null;

      if (card) {
        squadCards.push(card);
        var power = getCardTotalPower(card);
        totalPower += power;

        var miniAvatar = '';
        if (card.image) {
          miniAvatar = '<img src="' + card.image + '" alt="' + card.name + '" class="w-12 h-12 object-cover rounded-full mx-auto border-2 border-indigo-500/50 mb-1">';
        } else {
          var element = card.element || 'Fire';
          var gradients = {
            Fire: 'from-orange-600/30 to-red-900/40 border-red-500/50 text-orange-400',
            Wind: 'from-emerald-600/30 to-teal-900/40 border-emerald-500/50 text-emerald-400',
            Lightning: 'from-amber-500/30 to-indigo-900/40 border-purple-500/50 text-yellow-300',
            Earth: 'from-amber-800/30 to-stone-900/40 border-amber-700/50 text-amber-500',
            Water: 'from-blue-600/30 to-sky-950/40 border-blue-500/50 text-blue-400'
          };
          var gradientClass = gradients[element] || 'from-indigo-600/30 to-slate-900/40 border-indigo-500/50 text-slate-300';
          miniAvatar = '<div class="ninja-avatar-pbr relative w-12 h-12 rounded-full mx-auto flex items-center justify-center border bg-gradient-to-b ' + gradientClass + ' shadow-glow-inner mb-1">' +
                         '<span class="text-2xl filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">' + getNinjaEmoji(card.name) + '</span>' +
                       '</div>';
        }

        slotsHTML += '<div class="squad-slot filled p-3 rounded-xl border border-indigo-500/60 bg-indigo-950/40 cursor-pointer hover:border-red-400 transition-all flex flex-col items-center justify-between" onclick="Game.removeFromSquad(' + i + ')">' +
          miniAvatar +
          '<div class="text-xs font-bold text-slate-100 text-center truncate w-full mb-1">' + card.name + '</div>' +
          '<div class="text-[10px] rarity-color-' + card.rarity + ' font-semibold">Lv.' + card.level + ' ' + card.rarity + '</div>' +
          '<div class="text-xs text-shinobi-gold font-bold font-mono my-1">⚡ ' + power + '</div>' +
          '<div class="text-[10px] text-red-400 font-semibold underline mt-1">Remover</div>' +
        '</div>';
      } else {
        slotsHTML += '<div class="squad-slot empty bg-shinobi-mid/40 border-2 border-dashed border-slate-700 rounded-xl p-4 flex flex-col items-center justify-center min-h-[120px]">' +
          '<div class="text-slate-500 text-xs font-bold text-center">Slot ' + (i + 1) + '<br><span class="text-[10px] font-normal opacity-60">+ Selecionar</span></div>' +
        '</div>';
      }
    }
    slotsContainer.innerHTML = slotsHTML;
  }

  // Update Squad Header Badges
  var powerBadge = document.getElementById('squadTotalPower');
  if (powerBadge) powerBadge.innerHTML = '<span>⚡ ' + totalPower + '</span>';

  var countBadge = document.getElementById('squadMemberCount');
  if (countBadge) countBadge.textContent = state.selectedSquad.length + ' / 5';

  // Filters & Sorting for Available Inventory Cards
  var searchVal = document.getElementById('squadSearchInput') ? document.getElementById('squadSearchInput').value.toLowerCase().trim() : '';
  var sortBy = document.getElementById('squadSortBy') ? document.getElementById('squadSortBy').value : 'power';
  var elemFilter = document.getElementById('squadFilterElement') ? document.getElementById('squadFilterElement').value : '';
  var rarityFilter = document.getElementById('squadFilterRarity') ? document.getElementById('squadFilterRarity').value : '';

  var available = state.inventory.filter(function(c) {
    if (c == null) return false;
    if (state.selectedSquad.indexOf(c.id) !== -1) return false;
    if (searchVal && c.name.toLowerCase().indexOf(searchVal) === -1) return false;
    if (elemFilter && c.element !== elemFilter) return false;
    if (rarityFilter && c.rarity !== rarityFilter) return false;
    return true;
  });

  // Sort Available Cards
  available.sort(function(a, b) {
    if (sortBy === 'power') return getCardTotalPower(b) - getCardTotalPower(a);
    if (sortBy === 'rarity') return (RARITY_ORDER[b.rarity] || 0) - (RARITY_ORDER[a.rarity] || 0);
    if (sortBy === 'atk') return b.atk - a.atk;
    if (sortBy === 'hp') return b.hp - a.hp;
    if (sortBy === 'level') return b.level - a.level;
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    return 0;
  });

  var countAvailableEl = document.getElementById('squadAvailableCount');
  if (countAvailableEl) countAvailableEl.textContent = available.length + ' Ninjas';

  var availContainer = document.getElementById('squadAvailable');
  if (availContainer) {
    if (available.length === 0) {
      availContainer.innerHTML = '<div class="text-slate-500 col-span-5 text-center py-8">Nenhum ninja encontrado com os filtros selecionados.</div>';
    } else {
      availContainer.innerHTML = available.map(function(card) {
        var pwr = getCardTotalPower(card);
        return renderCardHTML(card, {
          onClick: "Game.addToSquad(&quot;" + card.id + "&quot;)",
          extra: '<div class="mt-1 text-center"><span class="text-shinobi-gold font-bold text-xs">⚡ Poder: ' + pwr + '</span></div>'
        });
      }).join('');
    }
  }
}

function addToSquad(cardId) {
  if (state.selectedSquad.length >= 5) { showToast('Squad cheio (máximo 5 ninjas)!', 'error'); return; }
  if (state.selectedSquad.indexOf(cardId) !== -1) { showToast('Ninja já está no squad!', 'error'); return; }
  state.selectedSquad.push(cardId);
  renderSquadBuilder();
}

function removeFromSquad(index) {
  state.selectedSquad.splice(index, 1);
  renderSquadBuilder();
}

function autoSquadStrongest() {
  var validCards = state.inventory.filter(function(c) { return c != null; });
  if (validCards.length === 0) {
    showToast('Você não possui ninjas no inventário!', 'error');
    return;
  }

  validCards.sort(function(a, b) {
    return getCardTotalPower(b) - getCardTotalPower(a);
  });

  var top5 = validCards.slice(0, 5);
  state.selectedSquad = top5.map(function(c) { return c.id; });
  renderSquadBuilder();
  showToast('⚡ Squad automático mais forte montado com sucesso!', 'success');
}

function clearSquad() {
  state.selectedSquad = [];
  renderSquadBuilder();
  showToast('Squad limpo.', 'info');
}

async function saveSquad() {
  if (state.selectedSquad.length === 0) {
    showToast('Selecione pelo menos 1 card!', 'error');
    return;
  }
  try {
    var data = await apiCall('/squad/set', 'POST', {
      username: USERNAME,
      cardIds: state.selectedSquad
    });
    state.squad = state.selectedSquad.slice();
    showToast(data.message, 'success');
    renderSquadBuilder();
   } catch (err) { /* shown */ }
  }

// ============================================
// BATTLE VISUAL SYSTEM
// ============================================

function setBattleSpeed(speed) {
  state.battleSpeed = speed;
  var btn1 = document.getElementById('speed1xBtn');
  var btn2 = document.getElementById('speed2xBtn');
  if (btn1 && btn2) {
    if (speed === 1) {
      btn1.classList.add('btn-primary'); btn1.classList.remove('btn-secondary');
      btn2.classList.add('btn-secondary'); btn2.classList.remove('btn-primary');
    } else {
      btn2.classList.add('btn-primary'); btn2.classList.remove('btn-secondary');
      btn1.classList.add('btn-secondary'); btn1.classList.remove('btn-primary');
    }
  }
}

function skipBattleAnimation() {
  state.skipBattle = true;
}

async function openBattleModal(battleData) {
  state.skipBattle = false;
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
        var hp = c.effectiveStats ? c.effectiveStats.hp : c.hp;
        var maxHp = c.effectiveStats ? c.effectiveStats.maxHp : c.maxHp;
        var atk = c.effectiveStats ? c.effectiveStats.atk : c.atk;
        var idVal = c.id || ('p-' + i);
        return '<div class="battle-fighter relative" id="fighter-' + idVal + '" data-fighter-id="' + idVal + '">' +
          '<div class="flex items-center gap-2">' +
            '<span class="text-2xl">' + getNinjaEmoji(c.name) + '</span>' +
            '<div><div class="fighter-name">' + c.name + '</div>' +
            '<div class="text-xs text-slate-400">Lv.' + c.level + ' ' + (ELEMENT_ICONS[c.element] || '') + ' ⚔️' + atk + '</div></div>' +
          '</div>' +
          '<div class="hp-bar-container"><div class="hp-bar" id="hp-bar-' + idVal + '" style="width:100%"></div></div>' +
          '<div class="text-xs text-slate-400 mt-1" id="hp-text-' + idVal + '">' + hp + '/' + maxHp + '</div>' +
          '<div class="damage-overlay" id="dmg-overlay-' + idVal + '"></div>' +
        '</div>';
      }).join('');
  }

  if (enemySide) {
    enemySide.innerHTML = '<div class="text-center text-sm font-bold text-red-400 mb-2">ENEMY SQUAD</div>' +
      enemySquad.map(function(c, i) {
        var idVal = c.id || ('e-' + i);
        return '<div class="battle-fighter relative" id="fighter-' + idVal + '" data-fighter-id="' + idVal + '">' +
          '<div class="flex items-center gap-2">' +
            '<span class="text-2xl">' + getNinjaEmoji(c.name) + '</span>' +
            '<div><div class="fighter-name">' + c.name + '</div>' +
            '<div class="text-xs text-slate-400">Lv.' + c.level + ' ' + (ELEMENT_ICONS[c.element] || '') + ' ⚔️' + c.atk + '</div></div>' +
          '</div>' +
          '<div class="hp-bar-container"><div class="hp-bar" id="hp-bar-' + idVal + '" style="width:100%"></div></div>' +
          '<div class="text-xs text-slate-400 mt-1" id="hp-text-' + idVal + '">' + c.hp + '/' + c.maxHp + '</div>' +
          '<div class="damage-overlay" id="dmg-overlay-' + idVal + '"></div>' +
        '</div>';
      }).join('');
  }

  // Clear log and results
  var logEl = document.getElementById('battleLog');
  var resultEl = document.getElementById('battleResult');
  var closeBtn = document.getElementById('battleCloseBtn');
  if (logEl) { logEl.innerHTML = ''; }
  if (resultEl) { resultEl.classList.add('hidden'); }
  if (closeBtn) { closeBtn.classList.add('hidden'); }

  var turns = battleData.turns || [];

  if (turns.length > 0) {
    var arenaEl = document.getElementById('battleArena') || document.querySelector('.battle-teams');
    for (var idx = 0; idx < turns.length; idx++) {
      var turnObj = turns[idx];
      var attackerEl = document.querySelector('[data-fighter-id="' + turnObj.attackerId + '"]');
      var defenderEl = document.querySelector('[data-fighter-id="' + turnObj.defenderId + '"]');
      var hpBar = document.getElementById('hp-bar-' + turnObj.defenderId);
      var hpText = document.getElementById('hp-text-' + turnObj.defenderId);
      var dmgOverlay = document.getElementById('dmg-overlay-' + turnObj.defenderId);

      if (logEl) {
        var div = document.createElement('div');
        div.className = 'log-entry py-1.5 border-b border-slate-800/40 flex items-center justify-between gap-2 flex-wrap';
        
        var attackerColor = turnObj.isPlayerAttacking ? 'text-green-400' : 'text-red-400';
        var defenderColor = turnObj.isPlayerAttacking ? 'text-red-400' : 'text-green-400';
        
        var badgeHTML = '';
        if (turnObj.elementMultiplier > 1) {
          badgeHTML = ' <span class="bg-orange-500/20 text-orange-400 border border-orange-500/40 px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase animate-pulse">🔥 Vantagem</span>';
        } else if (turnObj.elementMultiplier < 1) {
          badgeHTML = ' <span class="bg-slate-800 text-slate-400 border border-slate-700 px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase">🛡️ Resistido</span>';
        }
        
        var damageText = '<span class="font-mono font-bold ' + (turnObj.elementMultiplier > 1 ? 'text-orange-400 text-sm' : 'text-red-400') + '">' + turnObj.damage + '</span>';
        
        div.innerHTML = '<div class="flex items-center gap-1.5">' +
                          '<span class="text-slate-500 text-xs">[' + turnObj.turn + ']</span>' +
                          '<span class="' + attackerColor + ' font-bold">' + turnObj.attackerName + '</span>' +
                          '<span class="text-slate-400 text-xs">ataca</span>' +
                          '<span class="' + defenderColor + ' font-bold">' + turnObj.defenderName + '</span>' +
                          '<span class="text-slate-400 text-xs">causando</span>' +
                          damageText +
                          '<span class="text-slate-400 text-xs">de dano</span>' +
                          badgeHTML +
                        '</div>' +
                        '<div class="text-[11px] text-slate-500 font-mono">(' + Math.max(0, turnObj.defenderHpRemaining) + '/' + turnObj.defenderMaxHp + ' HP)</div>';
        
        logEl.appendChild(div);
        logEl.scrollTop = logEl.scrollHeight;
      }

      if (!state.skipBattle) {
        // Progressive Hit Stop based on damage severity
        var hitStopMs = turnObj.damage > 150 ? 120 : (turnObj.elementMultiplier > 1 ? 80 : 40);
        await new Promise(function(resolve) { setTimeout(resolve, hitStopMs); });

        var isCritical = turnObj.damage > 80 || turnObj.elementMultiplier > 1;
        var shakeClass = turnObj.damage > 150 ? 'shake-ultimate' : isCritical ? 'shake-heavy' : 'shake-light';

        if (arenaEl) {
          arenaEl.classList.remove('shake-light', 'shake-heavy', 'shake-ultimate');
          void arenaEl.offsetWidth; // Trigger reflow
          arenaEl.classList.add(shakeClass);
        }

        // Impact Frame Flash on Critical Hits
        if (isCritical) {
          document.body.classList.remove('impact-frame-active');
          void document.body.offsetWidth;
          document.body.classList.add('impact-frame-active');
          setTimeout(function() { document.body.classList.remove('impact-frame-active'); }, 80);
        }

        // Elemental VFX Burst (Phase 5)
        var elemMap = { Fire: 'vfx-katon', Lightning: 'vfx-raiton', Water: 'vfx-suiton', Wind: 'vfx-fuuton', Earth: 'vfx-doton' };
        var vfxClass = elemMap[turnObj.attackerElement] || 'vfx-katon';
        if (defenderEl) {
          var vfxDiv = document.createElement('div');
          vfxDiv.className = 'vfx-element-overlay ' + vfxClass;
          defenderEl.appendChild(vfxDiv);
          setTimeout(function() { if (vfxDiv.parentNode) vfxDiv.parentNode.removeChild(vfxDiv); }, 600);
        }

        // Hand-Sign Casting & Chakra Charge (Phase 6)
        if (attackerEl) {
          attackerEl.classList.add('chakra-aura-active');
          var signDiv = document.createElement('div');
          signDiv.className = 'hand-sign-badge absolute -top-3 left-1/2 -translate-x-1/2 z-50';
          signDiv.innerHTML = '🖐️ Moldando Selos';
          attackerEl.appendChild(signDiv);
          setTimeout(function() { 
            attackerEl.classList.remove('chakra-aura-active');
            if (signDiv.parentNode) signDiv.parentNode.removeChild(signDiv);
          }, 700);
        }

        if (attackerEl) attackerEl.classList.add('animate-attack');
        if (defenderEl) defenderEl.classList.add('animate-damage');

        if (dmgOverlay) {
          var elemIcon = turnObj.elementMultiplier > 1 ? '🔥 CRITICAL ' : turnObj.elementMultiplier < 1 ? '💧 ' : '';
          var critClass = isCritical ? ' critical-damage-text' : '';
          dmgOverlay.innerHTML = '<span class="floating-damage-text' + critClass + '">-' + turnObj.damage + ' ' + elemIcon + '</span>';
          setTimeout(function() { if (dmgOverlay) dmgOverlay.innerHTML = ''; }, 600);
        }
      }

      if (hpBar && hpText) {
        var pct = Math.max(0, (turnObj.defenderHpRemaining / turnObj.defenderMaxHp) * 100);
        hpBar.style.width = pct + '%';
        if (pct < 30) { hpBar.className = 'hp-bar low'; }
        else if (pct < 60) { hpBar.className = 'hp-bar medium'; }
        hpText.textContent = turnObj.defenderHpRemaining + '/' + turnObj.defenderMaxHp;
      }

      if (turnObj.defenderDefeated && defenderEl) {
        defenderEl.classList.add('defeated');
        if (logEl) {
          var koDiv = document.createElement('div');
          koDiv.className = 'log-entry defeat';
          koDiv.textContent = '💀 ' + turnObj.defenderName + ' foi derrotado!';
          logEl.appendChild(koDiv);
          logEl.scrollTop = logEl.scrollHeight;
        }
      }

      var isFinalBlow = idx === turns.length - 1;
      if (!state.skipBattle) {
        var multiplier = isFinalBlow ? 3 : 1;
        var delayMs = (800 * multiplier) / (state.battleSpeed || 1);

        if (isFinalBlow && arenaEl) {
          arenaEl.classList.add('cinematic-slowmo');
          // Sub-bass slowmo finish sound effect
          try {
            var audioCtx = getAudioContext();
            if (audioCtx) {
              var osc = audioCtx.createOscillator();
              var gain = audioCtx.createGain();
              osc.connect(gain);
              gain.connect(audioCtx.destination);
              osc.type = 'sawtooth';
              osc.frequency.setValueAtTime(80, audioCtx.currentTime);
              osc.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + 1.2);
              gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.5);
              osc.start();
              osc.stop(audioCtx.currentTime + 1.5);
            }
          } catch(e){}
        }

        await new Promise(function(resolve) { setTimeout(resolve, delayMs); });

        if (isFinalBlow && arenaEl) {
          arenaEl.classList.remove('cinematic-slowmo');
        }

        if (attackerEl) attackerEl.classList.remove('animate-attack');
        if (defenderEl) defenderEl.classList.remove('animate-damage');
      }
    }
  } else {
    var log = battleData.log || [];
    for (var i = 0; i < log.length; i++) {
      if (logEl) {
        var div = document.createElement('div');
        div.className = 'log-entry';
        div.textContent = log[i];
        logEl.appendChild(div);
        logEl.scrollTop = logEl.scrollHeight;
      }
      if (!state.skipBattle) {
        var delayMs = 300 / (state.battleSpeed || 1);
        await new Promise(function(resolve) { setTimeout(resolve, delayMs); });
      }
    }
  }

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
      turns: data.turns,
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
      turns: data.turns,
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
      turns: data.turns,
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

    var floor = data.highestFloor;
    var floorEl = document.getElementById('towerFloor');
    if (floorEl) floorEl.textContent = floor;

    var progressEl = document.getElementById('towerProgressBar');
    if (progressEl) {
      var pct = Math.min(100, Math.max(2, Math.round((floor / 50) * 100)));
      progressEl.style.width = pct + '%';
    }

    var milestoneBadge = document.getElementById('towerMilestoneBadge');
    if (milestoneBadge) {
      if (floor % 5 === 0) {
        milestoneBadge.classList.remove('hidden');
      } else {
        milestoneBadge.classList.add('hidden');
      }
    }

    var diffEl = document.getElementById('towerDifficulty');
    if (diffEl) {
      var diff = 'Common/Rare';
      if (floor > 40) diff = 'Legendary/SSR/UR Bosses';
      else if (floor > 20) diff = 'Epic/Legendary Guardians';
      else if (floor > 10) diff = 'Rare/Epic Ninjas';
      diffEl.textContent = 'Difficulty: ' + diff;
    }

    if (data.currentFloorData) {
      var goldEl = document.getElementById('towerGoldReward');
      if (goldEl) goldEl.textContent = data.currentFloorData.goldReward + 'G';
      var xpEl = document.getElementById('towerXpReward');
      if (xpEl) xpEl.textContent = data.currentFloorData.xpReward + ' XP';
      var eqEl = document.getElementById('towerEqReward');
      if (eqEl) eqEl.textContent = data.currentFloorData.equipmentReward ? '🛡️ ' + data.currentFloorData.equipmentReward : 'None';

      var enemiesEl = document.getElementById('towerEnemies');
      if (enemiesEl && data.currentFloorData.enemies) {
        enemiesEl.innerHTML = data.currentFloorData.enemies.map(function(e) {
          var icon = ELEMENT_ICONS[e.element] || '❓';
          var img = e.image || '/images/naruto.jpg';
          var rarityColor = RARITY_COLORS[e.rarity] || '#94a3b8';

          return '<div class="bg-shinobi-dark border rounded-xl p-3 flex flex-col items-center text-center transition-all hover:scale-105" style="border-color: ' + rarityColor + '">' +
            '<div class="relative w-14 h-14 mb-2">' +
              '<img src="' + img + '" class="w-full h-full rounded-full object-cover border-2 shadow-md" style="border-color: ' + rarityColor + '">' +
              '<span class="absolute -bottom-1 -right-1 text-xs bg-slate-900 border border-slate-700 px-1 rounded-full">' + icon + '</span>' +
            '</div>' +
            '<div class="font-bold text-xs text-slate-100 truncate w-full mb-1">' + e.name + '</div>' +
            '<div class="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase mb-2" style="background-color: ' + rarityColor + '20; color: ' + rarityColor + '">' + e.rarity + '</div>' +
            '<div class="w-full text-[11px] flex justify-between px-1 text-slate-300">' +
              '<span>⚔️ ' + e.atk + '</span>' +
              '<span>❤️ ' + e.hp + '</span>' +
            '</div>' +
          '</div>';
        }).join('');
      }
    }

    var resetBtn = document.getElementById('towerResetBtn');
    if (resetBtn) {
      resetBtn.disabled = !data.canReset;
      resetBtn.style.opacity = data.canReset ? '1' : '0.5';
    }

    renderTowerRoadmap(floor);
  } catch (err) { /* shown */ }
}

function renderTowerRoadmap(currentFloor) {
  var listEl = document.getElementById('towerRoadmapList');
  if (!listEl) return;

  var html = '';
  for (var f = 1; f <= 50; f++) {
    var isCurrent = f === currentFloor;
    var isCleared = f < currentFloor;
    var isMilestone = f % 5 === 0;

    var bgClass = 'bg-slate-900/60 border-slate-800 text-slate-500';
    var icon = '🔒';

    if (isCurrent) {
      bgClass = 'bg-indigo-600/30 border-indigo-500 text-indigo-300 font-bold shadow-glow animate-pulse';
      icon = '📍';
    } else if (isCleared) {
      bgClass = 'bg-emerald-950/40 border-emerald-600/50 text-emerald-400';
      icon = '✅';
    } else if (isMilestone) {
      bgClass = 'bg-amber-950/30 border-amber-600/60 text-amber-400 font-semibold';
      icon = '👑';
    }

    html += '<div class="p-2 rounded-lg border text-center text-xs flex flex-col items-center justify-between gap-1 ' + bgClass + '">' +
      '<span class="text-base">' + icon + '</span>' +
      '<span>Floor ' + f + '</span>' +
      (isMilestone ? '<span class="text-[9px] bg-amber-500/20 text-amber-300 px-1 rounded font-bold">REWARD</span>' : '') +
    '</div>';
  }
  listEl.innerHTML = html;
}

function toggleTowerRoadmap() {
  var roadmap = document.getElementById('towerRoadmapContainer');
  if (roadmap) {
    roadmap.classList.toggle('hidden');
  }
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
      turns: data.turns,
      background: data.background,
      playerSquad: data.playerSquad || [],
      enemySquad: (data.enemySquad || []).map(function(e, i) {
        return { id: `tower-enemy-${data.floor}-${i}`, name: e.name, element: e.element, atk: e.atk, hp: e.hp, maxHp: e.maxHp || e.hp, level: e.level || 1 };
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

function getPvpTierInfo(points) {
  if (points >= 1000) return { name: 'Kage', icon: '👑', colorClass: 'text-amber-400' };
  if (points >= 600) return { name: 'ANBU', icon: '⚡', colorClass: 'text-purple-400' };
  if (points >= 300) return { name: 'Jonin', icon: '🥇', colorClass: 'text-indigo-400' };
  if (points >= 100) return { name: 'Chunin', icon: '🥈', colorClass: 'text-blue-400' };
  return { name: 'Genin', icon: '🥉', colorClass: 'text-slate-400' };
}

function updatePvpStats() {
  var el;
  el = document.getElementById('pvpPoints'); if (el) el.textContent = state.pvpPoints;
  el = document.getElementById('pvpWins'); if (el) el.textContent = state.pvpWins;
  el = document.getElementById('pvpLosses'); if (el) el.textContent = state.pvpLosses;

  var tierInfo = getPvpTierInfo(state.pvpPoints);
  var tierEl = document.getElementById('pvpTier');
  if (tierEl) {
    tierEl.textContent = tierInfo.name + ' ' + tierInfo.icon;
    tierEl.className = 'text-2xl font-bold ' + tierInfo.colorClass;
  }

  loadPvpOpponents();
}

async function loadPvpOpponents() {
  var container = document.getElementById('pvpOpponentsList');
  if (!container) return;

  try {
    var opponents = await apiCall('/pvp/opponents/' + USERNAME, 'GET');
    if (!opponents || opponents.length === 0) {
      container.innerHTML = '<div class="text-slate-500 col-span-3 text-center py-4">No rivals found in arena.</div>';
      return;
    }

    container.replaceChildren();
    opponents.forEach(function(op) {
      var tier = op.tier || getPvpTierInfo(op.pvpPoints);
      var card = document.createElement('div');
      card.className = 'bg-shinobi-dark border border-slate-700 rounded-xl p-4 flex flex-col justify-between hover:border-purple-500 transition-all';
      var header = document.createElement('div');
      header.className = 'flex items-center justify-between mb-2';
      var name = document.createElement('div');
      name.className = 'font-bold text-base text-slate-100 flex items-center gap-1.5';
      name.textContent = '👤 ' + op.username;
      var badge = document.createElement('span');
      badge.className = 'text-xs font-bold px-2 py-0.5 rounded bg-slate-800 ' + (tier.colorClass || 'text-purple-400');
      badge.textContent = (tier.icon || '🥉') + ' ' + (tier.name || 'Genin');
      header.append(name, badge);
      var power = document.createElement('div');
      power.className = 'text-xs text-slate-400 mb-1';
      power.textContent = '⚔️ Power: ' + (op.totalPower || 0);
      var record = document.createElement('div');
      record.className = 'text-xs text-slate-400 mb-3';
      record.textContent = 'PVP Points: ' + op.pvpPoints + ' (' + op.pvpWins + 'W / ' + op.pvpLosses + 'L)';
      var details = document.createElement('div');
      details.append(header, power, record);
      var button = document.createElement('button');
      button.className = 'btn-primary text-xs w-full py-2 flex items-center justify-center gap-1';
      button.textContent = '⚔️ Challenge ' + op.username;
      button.addEventListener('click', function() { challengePvp(op.username); });
      card.append(details, button);
      container.appendChild(card);
    });
  } catch (err) { /* shown */ }
}

async function challengePvp(targetUsername) {
  var target = targetUsername;
  if (!target) {
    var targetEl = document.getElementById('pvpTarget');
    target = targetEl ? targetEl.value.trim() : '';
  }
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
      turns: data.turns,
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
// EQUIPMENT & FORGE SYSTEM
// ============================================

function setForgeTab(tab) {
  state.forgeTab = tab;
  state.selectedEquipmentId = null;
  state.fusionSlot1 = null;
  state.fusionSlot2 = null;

  var tabs = ['upgrade', 'fusion', 'manage'];
  tabs.forEach(function(t) {
    var btn = document.getElementById('forgeTab' + t.charAt(0).toUpperCase() + t.slice(1));
    if (btn) {
      if (t === tab) {
        btn.className = 'px-6 py-3 font-bold border-b-2 border-indigo-500 text-indigo-400 flex items-center gap-2';
      } else {
        btn.className = 'px-6 py-3 font-bold text-slate-400 hover:text-slate-200 flex items-center gap-2';
      }
    }
  });

  var invSec = document.getElementById('equipmentInventorySection');
  var ninjaSec = document.getElementById('ninjaEquipSection');

  if (tab === 'manage') {
    if (invSec) invSec.classList.add('hidden');
    if (ninjaSec) ninjaSec.classList.remove('hidden');
  } else {
    if (invSec) invSec.classList.remove('hidden');
    if (ninjaSec) ninjaSec.classList.add('hidden');
  }

  renderEquipmentScreen();
}

function filterEquipmentType(type) {
  state.filterEquipType = type;
  document.querySelectorAll('.equip-filter-btn').forEach(function(btn) {
    if (btn.getAttribute('data-type') === type) {
      btn.classList.add('btn-primary', 'active');
      btn.classList.remove('btn-secondary');
    } else {
      btn.classList.add('btn-secondary');
      btn.classList.remove('btn-primary', 'active');
    }
  });
  renderEquipmentScreen();
}

function deselectEquipment() {
  state.selectedEquipmentId = null;
  state.fusionSlot1 = null;
  state.fusionSlot2 = null;
  renderEquipmentScreen();
}

function renderEquipmentScreen() {
  var listEl = document.getElementById('equipmentList');
  var noEqEl = document.getElementById('noEquipment');
  var countBadge = document.getElementById('equipmentCountBadge');

  if (countBadge) countBadge.textContent = state.equipmentInventory.length + ' Items';

  var filteredItems = state.equipmentInventory.filter(function(eq) {
    if (state.filterEquipType && eq.type !== state.filterEquipType) return false;
    return true;
  });

  var forgeWorkbench = document.getElementById('forgeWorkbench');
  var fusionWorkbench = document.getElementById('fusionWorkbench');

  // Handle Workbench visibility based on mode
  if (state.forgeTab === 'upgrade') {
    if (fusionWorkbench) fusionWorkbench.classList.add('hidden');

    if (state.selectedEquipmentId) {
      var selItem = state.equipmentInventory.find(function(e) { return e.id === state.selectedEquipmentId; });
      if (selItem && forgeWorkbench) {
        forgeWorkbench.classList.remove('hidden');
        renderForgeUpgradeWorkbench(selItem);
      } else if (forgeWorkbench) {
        forgeWorkbench.classList.add('hidden');
      }
    } else if (forgeWorkbench) {
      forgeWorkbench.classList.add('hidden');
    }
  } else if (state.forgeTab === 'fusion') {
    if (forgeWorkbench) forgeWorkbench.classList.add('hidden');
    if (fusionWorkbench) {
      fusionWorkbench.classList.remove('hidden');
      renderFusionWorkbench();
    }
  } else {
    if (forgeWorkbench) forgeWorkbench.classList.add('hidden');
    if (fusionWorkbench) fusionWorkbench.classList.add('hidden');
  }

  // Render Equipment Inventory Cards
  if (listEl) {
    if (filteredItems.length === 0) {
      listEl.innerHTML = '';
      if (noEqEl) noEqEl.classList.remove('hidden');
    } else {
      if (noEqEl) noEqEl.classList.add('hidden');
      listEl.innerHTML = filteredItems.map(function(eq) {
        var isSelected = state.selectedEquipmentId === eq.id || state.fusionSlot1 === eq.id || state.fusionSlot2 === eq.id;
        var selectedClass = isSelected ? ' ring-2 ring-indigo-400 bg-indigo-950/40' : '';
        var levelStr = eq.level ? 'Lv.' + eq.level : 'Lv.1';
        var upgradeCost = 150 * (eq.level || 1);
        var icon = EQUIP_TYPE_ICONS[eq.type] || '📦';

        var onClickAction = "Game.selectEquipment('" + eq.id + "')";

        return '<div class="equipment-card rarity-' + eq.rarity + selectedClass + ' p-4 rounded-xl border border-slate-700 bg-shinobi-mid hover:border-indigo-500 transition-all flex flex-col justify-between cursor-pointer">' +
          '<div onclick="' + onClickAction + '">' +
            '<div class="flex items-center justify-between mb-2">' +
              '<div class="flex items-center gap-2 font-bold text-sm text-slate-100">' +
                '<span class="text-xl">' + icon + '</span>' +
                '<span>' + eq.name + '</span>' +
              '</div>' +
              '<span class="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-900 rarity-color-' + eq.rarity + '">' + levelStr + '</span>' +
            '</div>' +
            '<div class="text-xs rarity-color-' + eq.rarity + ' font-semibold mb-2">' + eq.rarity + ' • ' + eq.type + '</div>' +
            '<div class="text-xs text-slate-300 font-mono bg-slate-900/60 p-2 rounded mb-2 flex justify-between">' +
              '<span>⚔️ +' + eq.atkBonus + '</span>' +
              '<span>❤️ +' + eq.hpBonus + '</span>' +
            '</div>' +
            (isSelected ? '<div class="text-xs text-indigo-400 font-bold text-center">✓ Selected</div>' : '') +
          '</div>' +
          (state.forgeTab === 'upgrade' ? '<button onclick="Game.upgradeEquipment(\'' + eq.id + '\')" class="btn-primary text-xs mt-2 w-full py-1.5 font-bold">⬆️ Forge Lv. (' + upgradeCost + 'G)</button>' : '') +
        '</div>';
      }).join('');
    }
  }

  var selectEl = document.getElementById('equipCardSelect');
  if (selectEl) {
    selectEl.innerHTML = '<option value="">Select a card to manage equipment...</option>' +
      state.inventory.map(function(c) {
        if (c == null) return '';
        return '<option value="' + c.id + '">' + c.name + ' (Lv.' + c.level + ' ' + c.rarity + ')</option>';
      }).join('');
    selectEl.onchange = function() { renderCardEquipSlots(selectEl.value); };
  }

  renderCardEquipSlots(selectEl ? selectEl.value : '');
}

function renderForgeUpgradeWorkbench(eq) {
  var detailsEl = document.getElementById('forgeDetailsContent');
  if (!detailsEl) return;

  var currentLv = eq.level || 1;
  var isMax = currentLv >= 10;
  var cost = 150 * currentLv;
  var nextAtk = Math.floor(eq.atkBonus * 1.25 + 5);
  var nextHp = Math.floor(eq.hpBonus * 1.25 + 20);
  var icon = EQUIP_TYPE_ICONS[eq.type] || '📦';

  detailsEl.innerHTML = '<div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">' +
    '<div>' +
      '<div class="flex items-center gap-3 mb-2">' +
        '<span class="text-4xl p-3 bg-slate-900 rounded-xl border border-indigo-500/40">' + icon + '</span>' +
        '<div>' +
          '<div class="text-xl font-bold text-slate-100">' + eq.name + '</div>' +
          '<div class="text-sm font-semibold rarity-color-' + eq.rarity + '">' + eq.rarity + ' ' + eq.type + ' • Level ' + currentLv + ' / 10</div>' +
        '</div>' +
      '</div>' +
      '<div class="w-full bg-slate-900 rounded-full h-2.5 my-3 border border-slate-700 overflow-hidden">' +
        '<div class="bg-gradient-to-r from-indigo-500 to-purple-500 h-full" style="width: ' + (currentLv * 10) + '%"></div>' +
      '</div>' +
    '</div>' +
    '<div class="bg-slate-900/80 p-4 rounded-xl border border-slate-700/80">' +
      '<div class="text-xs text-slate-400 uppercase font-bold mb-2">Stat Upgrade Preview:</div>' +
      '<div class="flex justify-between items-center text-sm mb-1">' +
        '<span class="text-slate-300">⚔️ Attack Power:</span>' +
        '<span class="font-mono font-bold text-slate-200">' + eq.atkBonus + ' <span class="text-green-400">➔ ' + (isMax ? 'MAX' : nextAtk) + '</span></span>' +
      '</div>' +
      '<div class="flex justify-between items-center text-sm mb-4">' +
        '<span class="text-slate-300">❤️ Health Points:</span>' +
        '<span class="font-mono font-bold text-slate-200">' + eq.hpBonus + ' <span class="text-green-400">➔ ' + (isMax ? 'MAX' : nextHp) + '</span></span>' +
      '</div>' +
      (isMax
        ? '<div class="text-amber-400 font-bold text-center py-2 bg-amber-950/30 rounded border border-amber-500/30">🌟 MAX LEVEL REACHED</div>'
        : '<button onclick="Game.upgradeEquipment(\'' + eq.id + '\')" class="btn-primary w-full py-2.5 font-bold shadow-lg flex items-center justify-center gap-2 text-base">' +
            '<span>🔨 Upgrade Item</span>' +
            '<span class="text-xs bg-slate-900/60 px-2 py-0.5 rounded text-shinobi-gold font-mono">💰 ' + cost + 'G</span>' +
          '</button>'
      ) +
    '</div>' +
  '</div>';
}

function renderFusionWorkbench() {
  var slot1El = document.getElementById('fusionSlot1');
  var slot2El = document.getElementById('fusionSlot2');
  var actionEl = document.getElementById('fusionActionArea');

  var item1 = state.fusionSlot1 ? state.equipmentInventory.find(function(e) { return e.id === state.fusionSlot1; }) : null;
  var item2 = state.fusionSlot2 ? state.equipmentInventory.find(function(e) { return e.id === state.fusionSlot2; }) : null;

  if (slot1El) {
    if (item1) {
      slot1El.innerHTML = '<div class="flex flex-col items-center gap-1 rarity-' + item1.rarity + ' p-2 rounded-lg w-full">' +
        '<span class="text-2xl">' + (EQUIP_TYPE_ICONS[item1.type] || '📦') + '</span>' +
        '<span class="font-bold text-xs text-slate-100">' + item1.name + '</span>' +
        '<span class="text-[10px] rarity-color-' + item1.rarity + '">' + item1.rarity + ' • Lv.' + (item1.level || 1) + '</span>' +
        '<button onclick="Game.selectEquipmentForFusion(\'' + item1.id + '\')" class="text-[10px] text-red-400 underline mt-1">Remove</button>' +
      '</div>';
    } else {
      slot1El.innerHTML = '<span class="text-slate-500 text-sm">Select Primary Item below</span>';
    }
  }

  if (slot2El) {
    if (item2) {
      slot2El.innerHTML = '<div class="flex flex-col items-center gap-1 rarity-' + item2.rarity + ' p-2 rounded-lg w-full">' +
        '<span class="text-2xl">' + (EQUIP_TYPE_ICONS[item2.type] || '📦') + '</span>' +
        '<span class="font-bold text-xs text-slate-100">' + item2.name + '</span>' +
        '<span class="text-[10px] rarity-color-' + item2.rarity + '">' + item2.rarity + ' • Lv.' + (item2.level || 1) + '</span>' +
        '<button onclick="Game.selectEquipmentForFusion(\'' + item2.id + '\')" class="text-[10px] text-red-400 underline mt-1">Remove</button>' +
      '</div>';
    } else {
      slot2El.innerHTML = '<span class="text-slate-500 text-sm">Select Duplicate Item below</span>';
    }
  }

  if (actionEl) {
    if (item1 && item2) {
      var costs = { Common: 200, Rare: 500, Epic: 1000, Legendary: 2500, SSR: 5000 };
      var cost = costs[item1.rarity] || 300;
      actionEl.innerHTML = '<div class="bg-purple-950/40 border border-purple-500/40 p-4 rounded-xl max-w-md mx-auto mb-2">' +
        '<div class="text-sm font-bold text-purple-300 mb-1">✨ Ready to Fuse!</div>' +
        '<div class="text-xs text-slate-300 mb-3">Fusion Cost: <span class="text-shinobi-gold font-bold">' + cost + 'G</span></div>' +
        '<button onclick="Game.fuseEquipment()" class="btn-primary w-full py-2.5 font-bold shadow-lg text-base">' +
          '✨ Perform Fusion & Evolve Rarity' +
        '</button>' +
      '</div>';
    } else {
      actionEl.innerHTML = '<div class="text-slate-500 text-xs">Select 2 items of the same slot type & rarity from your inventory below.</div>';
    }
  }
}

function selectEquipment(eqId) {
  if (state.forgeTab === 'fusion') {
    selectEquipmentForFusion(eqId);
  } else {
    state.selectedEquipmentId = state.selectedEquipmentId === eqId ? null : eqId;
    renderEquipmentScreen();
  }
}

function selectEquipmentForFusion(eqId) {
  if (state.fusionSlot1 === eqId) {
    state.fusionSlot1 = null;
  } else if (state.fusionSlot2 === eqId) {
    state.fusionSlot2 = null;
  } else if (!state.fusionSlot1) {
    state.fusionSlot1 = eqId;
  } else if (!state.fusionSlot2) {
    var item1 = state.equipmentInventory.find(function(e) { return e.id === state.fusionSlot1; });
    var item2 = state.equipmentInventory.find(function(e) { return e.id === eqId; });

    if (item1 && item2) {
      if (item1.rarity !== item2.rarity) {
        showToast('Both items must have the same rarity! (' + item1.rarity + ' vs ' + item2.rarity + ')', 'error');
        return;
      }
      if (item1.type !== item2.type) {
        showToast('Both items must have the same slot type! (' + item1.type + ' vs ' + item2.type + ')', 'error');
        return;
      }
    }
    state.fusionSlot2 = eqId;
  } else {
    showToast('Both fusion slots full. Remove one first!', 'error');
    return;
  }
  renderEquipmentScreen();
}

async function fuseEquipment() {
  if (!state.fusionSlot1 || !state.fusionSlot2) {
    showToast('Select two items to fuse!', 'error');
    return;
  }
  try {
    var data = await apiCall('/equipment/fuse', 'POST', {
      username: USERNAME,
      item1Id: state.fusionSlot1,
      item2Id: state.fusionSlot2
    });

    showToast(data.message, 'success');
    state.gold = data.currentGold;
    state.equipmentInventory = data.equipmentInventory || state.equipmentInventory;
    state.fusionSlot1 = null;
    state.fusionSlot2 = null;
    updateNavBar();
    await loadPlayerData();
    renderEquipmentScreen();
  } catch (err) { /* shown */ }
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
      var levelStr = eq.level ? 'Lv.' + eq.level : 'Lv.1';
      var upgradeCost = 150 * (eq.level || 1);
      return '<div class="bg-shinobi-mid border border-slate-600 rounded-xl p-4">' +
        '<div class="flex items-center justify-between gap-2 mb-2">' +
          '<div class="flex items-center gap-2">' +
            '<span class="text-2xl">' + icon + '</span>' +
            '<div><div class="font-bold text-sm text-slate-100">' + eq.name + '</div>' +
            '<div class="text-xs rarity-color-' + eq.rarity + '">' + eq.rarity + ' • ' + levelStr + '</div></div>' +
          '</div>' +
        '</div>' +
        '<div class="text-xs text-slate-400 mb-2 font-mono">⚔️ +' + eq.atkBonus + ' | ❤️ +' + eq.hpBonus + '</div>' +
        '<div class="flex gap-2">' +
          '<button onclick="Game.upgradeEquipment(\'' + eq.id + '\')" class="btn-primary text-xs flex-1 py-1 font-bold">⬆️ Upgrade (' + upgradeCost + 'G)</button>' +
          '<button onclick="Game.unequipItem(\'' + cardId + '\', \'' + slot + '\')" class="btn-danger text-xs py-1">Unequip</button>' +
        '</div>' +
      '</div>';
    }

    return '<div class="bg-shinobi-mid border border-dashed border-slate-600 rounded-xl p-4">' +
      '<div class="flex items-center gap-2 mb-2">' +
        '<span class="text-2xl opacity-40">' + icon + '</span>' +
        '<div class="text-slate-500 font-bold text-sm">' + slot + ' — Empty</div>' +
      '</div>' +
      (state.selectedEquipmentId ? '<button onclick="Game.equipItem(\'' + cardId + '\')" class="btn-success text-xs mt-2 w-full font-bold">Equip Selected</button>' : '<div class="text-xs text-slate-600">Select equipment to equip</div>') +
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

async function upgradeEquipment(equipmentId) {
  try {
    var data = await apiCall('/equipment/upgrade', 'POST', {
      username: USERNAME,
      equipmentId: equipmentId
    });
    showToast(data.message, 'success');
    state.gold = data.currentGold;
    updateNavBar();
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
          var tier = r.tier || getPvpTierInfo(r.pvpPoints);
          return '<div class="ranking-row">' +
            '<div class="rank ' + rankClass + '">' + medal + '</div>' +
            '<div class="font-bold flex items-center gap-1.5">' + r.username + ' <span class="text-xs px-1.5 py-0.5 bg-slate-800 rounded ' + (tier.colorClass || 'text-purple-400') + '">' + (tier.icon || '🥉') + ' ' + (tier.name || 'Genin') + '</span></div>' +
            '<div class="text-purple-400 font-bold">' + r.pvpPoints + '</div>' +
            '<div><span class="text-green-400">' + r.pvpWins + '</span>/<span class="text-red-400">' + r.pvpLosses + '</span></div>' +
            '<div>' + r.winRate + '%</div>' +
          '</div>';
        }).join('');
    }
  } catch (err) { /* shown */ }
}

function showRanking(type) {
  loadRanking(type);
}

// ============================================
// VOLUMETRIC WEATHER ENGINE (PHASE 3)
// ============================================

var currentWeatherMode = 'clear';
var weatherParticles = [];
var weatherAnimId = null;

function initWeatherEngine() {
  var canvas = document.getElementById('weatherCanvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  
  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  function spawnParticles() {
    weatherParticles = [];
    var count = currentWeatherMode === 'clear' ? 40 : (currentWeatherMode === 'snow' ? 70 : 120);
    for (var i = 0; i < count; i++) {
      weatherParticles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 3 + 1,
        speedY: currentWeatherMode === 'rain' || currentWeatherMode === 'storm' ? Math.random() * 12 + 10 : Math.random() * 1.5 + 0.5,
        speedX: currentWeatherMode === 'snow' ? Math.sin(Math.random() * Math.PI) * 1 : (currentWeatherMode === 'clear' ? Math.random() * 1.5 - 0.5 : Math.random() * 2 - 1),
        opacity: Math.random() * 0.7 + 0.3,
        rotation: Math.random() * Math.PI * 2
      });
    }
  }

  spawnParticles();

  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Random Lightning Flash for Storm mode
    if (currentWeatherMode === 'storm' && Math.random() < 0.015) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    weatherParticles.forEach(function(p) {
      p.y += p.speedY;
      p.x += p.speedX;

      if (p.y > canvas.height) { p.y = -10; p.x = Math.random() * canvas.width; }
      if (p.x > canvas.width) p.x = 0;
      if (p.x < 0) p.x = canvas.width;

      ctx.save();
      ctx.globalAlpha = p.opacity;

      if (currentWeatherMode === 'clear') {
        // Sakura Petal
        ctx.fillStyle = '#f472b6';
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.size * 2, p.size, p.rotation, 0, Math.PI * 2);
        ctx.fill();
      } else if (currentWeatherMode === 'rain' || currentWeatherMode === 'storm') {
        // Rain Streak
        ctx.strokeStyle = currentWeatherMode === 'storm' ? '#93c5fd' : '#bfdbfe';
        ctx.lineWidth = p.size * 0.8;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + p.speedX * 2, p.y + p.speedY * 1.5);
        ctx.stroke();
      } else if (currentWeatherMode === 'snow') {
        // Snow Flake
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });

    weatherAnimId = requestAnimationFrame(loop);
  }

  if (weatherAnimId) cancelAnimationFrame(weatherAnimId);
  loop();
}

function setWeatherMode(mode) {
  var valid = ['clear', 'rain', 'storm', 'snow'];
  if (valid.indexOf(mode) !== -1) {
    currentWeatherMode = mode;
    initWeatherEngine();
    var labels = {
      'clear': '🌸 Clima: Céu Limpo & Pétalas de Sakura',
      'rain': '🌧️ Clima: Chuva com Poças D\'água PBR',
      'storm': '⚡ Clima: Tempestade Elétrica com Raios',
      'snow': '❄️ Clima: Neve de Inverno Shinobi'
    };
    showToast(labels[mode] || 'Clima alterado.', 'info');
  }
}

// ============================================
// INITIALIZE
// ============================================

async function init() {
  await loadPlayerData();
  await loadStatus();
  initWeatherEngine();
  showScreen('home');
}

function setAtmosphereMode(mode) {
  var validModes = ['time-dawn', 'time-noon', 'time-sunset', 'time-midnight'];
  validModes.forEach(function(m) { document.body.classList.remove(m); });
  if (validModes.indexOf(mode) !== -1) {
    document.body.classList.add(mode);
    var labels = {
      'time-dawn': '🌅 Atmosfera: Alvorada Shinobi (3200K / Luz Âmbar)',
      'time-noon': '☀️ Atmosfera: Meio-Dia Direct (6500K / Sol Pleno)',
      'time-sunset': '🌇 Atmosfera: Pôr do Sol Dramático (2400K / Tom Rubi)',
      'time-midnight': '🌕 Atmosfera: Lua Sangrenta (10000K / Místico)'
    };
    showToast(labels[mode] || 'Atmosfera alterada.', 'info');
  }
}

// ============================================
// UI AUDIO SYNTHESIZER ENGINE (PHASE 7)
// ============================================

var audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    var AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) audioCtx = new AudioContext();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playUISound(type) {
  try {
    var ctx = getAudioContext();
    if (!ctx) return;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    var now = ctx.currentTime;

    if (type === 'hover') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.02);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      osc.start(now);
      osc.stop(now + 0.03);
    } else if (type === 'click') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(700, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.04);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'modal') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(750, now + 0.08);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc.start(now);
      osc.stop(now + 0.09);
    } else if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.06); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.12); // G5
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    }
  } catch (err) { /* silent audio fallback */ }
}

function attachUIAudioListeners() {
  document.addEventListener('click', function(event) {
    if (event.target.closest('button, .nav-tab, select')) playUISound('click');
  });
  document.addEventListener('mouseover', function(event) {
    var target = event.target.closest('button, .nav-tab, select');
    if (target && (!event.relatedTarget || !target.contains(event.relatedTarget))) playUISound('hover');
  });
}

// Auto-attach audio listeners on DOM content loaded & screen transitions
document.addEventListener('click', function() { getAudioContext(); }, { once: true });

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
  renderSquadBuilder: renderSquadBuilder,
  autoSquadStrongest: autoSquadStrongest,
  clearSquad: clearSquad,
  saveSquad: saveSquad,
  quickBattle: quickBattle,
  startSquadBattle: startSquadBattle,
  startBossBattle: startBossBattle,
  fightTower: fightTower,
  resetTower: resetTower,
  toggleTowerRoadmap: toggleTowerRoadmap,
  challengePvp: challengePvp,
  selectEquipment: selectEquipment,
  filterEquipmentType: filterEquipmentType,
  setForgeTab: setForgeTab,
  deselectEquipment: deselectEquipment,
  selectEquipmentForFusion: selectEquipmentForFusion,
  fuseEquipment: fuseEquipment,
  equipItem: equipItem,
  unequipItem: unequipItem,
  upgradeEquipment: upgradeEquipment,
  setBattleSpeed: setBattleSpeed,
  skipBattleAnimation: skipBattleAnimation,
  showRanking: showRanking,
  closeBattle: closeBattle,
  setAtmosphereMode: setAtmosphereMode,
  setWeatherMode: setWeatherMode,
  playUISound: playUISound,
  loadPlayerData: loadPlayerData,
  init: init
};

// Auto-init on load
document.addEventListener('DOMContentLoaded', function() {
  init();
  attachUIAudioListeners();
});
