# Shinobi Legends - Development Plan

## Design Guidelines

### Design References
- **Naruto Shippuden** dark aesthetic
- **Gacha game UIs** (Genshin Impact, Naruto Blazing)
- **Style**: Dark Shinobi Theme with glowing accents

### Color Palette
- Primary BG: #0f172a (Slate 900)
- Secondary BG: #1e293b (Slate 800)
- Card BG: #334155 (Slate 700)
- Accent: #6366f1 (Indigo 500)
- Accent Glow: #818cf8 (Indigo 400)
- Gold: #f59e0b (Amber 500)
- Danger: #ef4444 (Red 500)
- Success: #22c55e (Green 500)
- Text Primary: #f1f5f9 (Slate 100)
- Text Secondary: #94a3b8 (Slate 400)
- Rarity Colors: Common=#94a3b8, Rare=#3b82f6, Epic=#a855f7, Legendary=#f59e0b, SSR=#ef4444, UR=#ec4899

### Typography
- Font: 'Rajdhani', sans-serif (ninja/tech feel)
- Headings: Bold, uppercase, letter-spacing
- Body: Regular weight

### Images to Generate
1. **battle-bg-hidden-leaf.jpg** — Hidden Leaf Village at dusk, traditional Japanese buildings, Hokage mountain in background, warm sunset lighting, anime style
2. **battle-bg-forest-of-death.jpg** — Dark dense forest with massive twisted trees, eerie green fog, dangerous atmosphere, anime style
3. **battle-bg-akatsuki-hideout.jpg** — Dark cave interior with red clouds symbol on walls, dim red lighting, mysterious atmosphere, anime style
4. **battle-bg-chunin-arena.jpg** — Large circular combat arena with spectator stands, bright daylight, tournament setting, anime style
5. **battle-bg-hokage-monument.jpg** — Night view of Hokage Monument with carved faces lit by moonlight, village below, anime style

## File Structure (8 files max)

### Frontend (3 files)
1. **index.html** — Main game interface with all screens/modals, Tailwind CDN
2. **style.css** — Custom animations, battle effects, card styles
3. **script.js** — Full game engine (window.Game object) with all systems

### Backend (5 files) 
4. **backend/package.json** — Dependencies
5. **backend/serve.ts** — Express server with ALL routes (gacha, battle, pvp, tower, equipment, etc.)
6. **backend/User.ts** — MongoDB User model with all fields
7. **backend/cardDatabase.ts** — Card database + equipment database + tower floor definitions
8. **backend/gachaService.ts** — Gacha service + battle logic + damage calculation

## Features to Implement

### Task 1: Full Existing Codebase
- All 10 base ninjas with elements
- Gacha system (5 cards per pack, 100G)
- Inventory with search/filter/sort
- Squad selection (up to 5)
- Squad Battle (Tower + Arcade)
- Final Boss (Orochimaru ATK 250)
- Daily Mission (+500G, 24h cooldown)
- Fusion (3 copies → AWAKENED x2.5 ATK)
- Star Ascension (7 stars)
- Rank Evolution (10 symbols, 5 steps each)
- Market (sell cards)
- Leaderboard (top 10 by level)
- Element system in battles (25% bonus/penalty)
- XP/Level system for cards
- Card detail modal

### Task 2: PVP System
- POST /pvp/challenge (attacker vs defender by username)
- Load both users, validate squads
- Apply equipment bonuses + element advantage
- Auto turn-based combat with battle log
- PVP points: +25 win, -10 loss (min 0)
- GET /ranking/pvp (Top 20)

### Task 3: Visual Battle Screen
- Full-width combat arena
- Player squad left, enemy right
- Scrollable battle log center
- Animated HP bars with CSS transitions
- Attack: scale animation
- Damage: red flash
- Dark shinobi theme

### Task 4: Equipment System
- 6 slots: Weapon, Armor, Helmet, Boots, Scroll, Ring
- Equipment with id, name, type, rarity, stars, rank, atkBonus, hpBonus
- POST /equipment/equip, /equipment/unequip
- GET /equipment/list/:username
- Battle stats = base + equipment bonuses

### Task 5: Advanced Tower System
- Structured floors with predefined enemies
- Gold, XP, equipment rewards
- Unlock next floor after winning
- 24h reset cooldown
- Difficulty scaling by floor range

### Task 6: Battle Backgrounds & Damage Formula
- 5 rotating backgrounds randomly per battle
- Damage = ATK → element bonus → minus defender level×2 → min 5
- Applied in PVP, Tower, Boss, Squad