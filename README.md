# 🏃 NEON RUSH — AAA 3D Endless Runner Game

[![Three.js](https://img.shields.io/badge/Three.js-r187-black?logo=three.js)](https://threejs.org/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?logo=vite)](https://vitejs.dev/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?logo=javascript)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**NEON RUSH** is a fast-paced, polished 3D endless runner built entirely from scratch with **Three.js**, **modern JavaScript (ES6+)**, and **Vite**. Inspired by classic urban runners like *Subway Surfers*, players sprint through vibrant railway corridors and colorful cityscape trenches, dodging oncoming freight trains, jumping low hurdle barriers, sliding beneath security gantries, surfing on hoverboards, and climbing incline ramps to run atop train car roofs.

---

## 🎮 Controls

### Desktop
| Action | Key / Input |
| :--- | :--- |
| **Move Left / Right** | <kbd>A</kbd> / <kbd>D</kbd> or <kbd>◀</kbd> / <kbd>▶</kbd> |
| **Jump** | <kbd>W</kbd>, <kbd>▲</kbd>, or <kbd>Space</kbd> |
| **Slide / Duck** | <kbd>S</kbd> or <kbd>▼</kbd> |
| **Activate Hoverboard** | <kbd>Space</kbd> (Double Tap) |
| **Pause Game** | <kbd>Esc</kbd> or <kbd>P</kbd> |

### Mobile / Touch
| Action | Gesture |
| :--- | :--- |
| **Switch Lanes** | Swipe **Left** / **Right** |
| **Jump** | Swipe **Up** |
| **Slide** | Swipe **Down** |
| **Hoverboard** | Double Tap Screen |
| **Pause** | Tap Top-Left Pause Button (⏸) |

---

## ✨ Features & Gameplay Mechanics

### 1. Stylized 3D Graphics & Urban Environment
- **Procedural 3D World**: Endless track generation using recycled chunk pooling.
- **Urban Subway Trench**: Colorful city facades, graffiti walls, canal waterways, white stone embankments, overhead scaffolding, and track sleepers rendered with `InstancedMesh` for peak performance.
- **Dynamic Lighting & Atmospheric Fog**: Warm directional sunlight with PCF soft shadow maps, ambient hemisphere illumination, and distance fog.
- **Performance Quality Modes**:
  - **Low**: 1.0 DPR, shadows disabled, 80 max particles (for mobile & lower-end hardware).
  - **Medium**: Up to 1.5 DPR, balanced lighting, 180 max particles.
  - **High**: Up to 2.0 DPR, 2048x2048 shadow maps, 300 max particles.

### 2. Fair Gameplay & 5-Second Safe Grace Period
- **Starting Grace Period**: The first 5 seconds of every run are 100% free of dangerous obstacles, roadblocks, or oncoming trains, allowing players to orient themselves and collect coins freely.
- **Smart Difficulty Progression**:
  - **Stage 1 (160m – 450m)**: Gentle introduction with single obstacles and 2 completely open lanes.
  - **Stage 2 (450m – 850m)**: Stationary freight trains with climbable ramps, jump hurdles, and high barriers.
  - **Stage 3 (850m – 1400m)**: Coordinated two-lane patterns with guaranteed open lanes or ramp paths.
  - **Stage 4 (1400m+)**: High-speed dynamic patterns and oncoming trains with ample warning distance.
- **Rooftop Running**: Freight trains feature wooden incline ramps allowing players to run along train car roofs at $Y = 3.28\text{m}$.

### 3. Original 3D Characters & Customization
- **Dash (Default)**: Stylized humanoid runner with backwards red baseball cap, hair fringe, teal hoodie, baggy denim jeans, and running sneakers.
- **Kael, Nyx, Titan, Zephyr, and Vex**: Unlockable skins with distinct silhouettes and color schemes.
- **Interactive 3D Shop**: Real-time rotating character showcase with purchase and equip logic.

### 4. Collectibles & Power-Ups
- **Embossed 3D Gold Coins**: Circular coins with 5-point stars and dynamic magnet attraction physics.
- **Coin Magnet (🧲)**: Draws nearby coins toward the player with a 3D handheld magnet model.
- **Super Sneakers (👟)**: Grants super-jump height for clearing high trains and obstacles.
- **Jetpack Flight (🚀)**: Takes the player into the sky for aerial coin trails.
- **2X Multiplier (⚡)**: Doubles score progression.
- **Hoverboard Protection (🛹)**: Grants crash immunity that absorbs 1 fatal hit.

### 5. Procedural Web Audio Engine
- Built-in sound synthesis via Web Audio API with zero external audio assets.
- Synthwave background soundtrack with driving kick, hi-hats, bassline, and lead arpeggios.
- Sound effects for lane dashing, jumping, landing, coin pickups (pitch-scaling combos), power-up alerts, train horns, and crash explosions.

### 6. Progression & Persistence
- LocalStorage saving for high score, coins, unlocked characters, mission progress, and settings.
- 7-Day Daily Login reward calendar.
- Active Mission tracking system with coin rewards.

---

## 📁 Project Architecture

```
neo-run/
├── index.html                  # HTML structure & HUD / UI modal overlays
├── package.json                # Dependencies and run scripts
├── vite.config.js              # Vite bundler configuration (port 5190)
├── src/
│   ├── main.js                 # Application entry point
│   ├── styles/
│   │   └── main.css            # Urban arcade styling and glassmorphic HUD
│   ├── game/
│   │   ├── AudioManager.js     # Procedural Web Audio API sound & synthwave BGM
│   │   ├── CameraController.js # Dynamic follow camera with FOV expansion & shake
│   │   ├── CharacterModels.js  # Procedural 3D humanoid runner & character meshes
│   │   ├── CoinManager.js      # 3D star-embossed coins & magnet pull physics
│   │   ├── CollisionSystem.js  # AABB & rooftop elevation collision detection
│   │   ├── Environment.js      # Urban subway themes, lighting & instanced meshes
│   │   ├── Game.js             # Central game loop, state machine & grace period
│   │   ├── MissionsManager.js  # Quest tracking & milestone rewards
│   │   ├── ObstacleManager.js  # Trains, ramps, hurdles & progressive spawning
│   │   ├── ParticleSystem.js   # Slide sparks, jetpack fire, coin bursts & crashes
│   │   ├── Player.js           # 3-lane physics, jump/slide mechanics & hoverboard
│   │   ├── PlayerController.js # Desktop keyboard & mobile touch swipe listeners
│   │   ├── PowerUpManager.js   # Active power-up buffs, timers & visuals
│   │   ├── ScoreManager.js     # Score calculation & LocalStorage persistence
│   │   └── World.js            # Endless chunk recycling system
│   └── ui/
│       ├── HUD.js              # Real-time score multiplier, coins & power-up meters
│       ├── MainMenu.js         # Start screen & navigation
│       ├── PauseMenu.js        # Pause overlay with resume & quit options
│       ├── GameOver.js         # Game-over screen with stats & restart
│       ├── Shop.js             # 3D character preview & skin purchasing
│       ├── Missions.js         # Daily streak calendar & quests UI
│       └── Settings.js         # Volume sliders & graphics quality selector
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18 or higher recommended)
- `npm`

### Installation
```bash
git clone https://github.com/heckerr404/Neon-run.git
cd Neon-run
npm install
```

### Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:5190/`.

### Production Build
```bash
npm run build
```
Generates an optimized bundle in the `dist/` directory.

### Preview Production Build
```bash
npm run preview
```

---

## 📄 License
This project is licensed under the MIT License.
