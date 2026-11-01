import * as THREE from 'three';
import { Player } from './Player.js';
import { PlayerController } from './PlayerController.js';
import { World } from './World.js';
import { ObstacleManager } from './ObstacleManager.js';
import { CoinManager } from './CoinManager.js';
import { PowerUpManager } from './PowerUpManager.js';
import { CollisionSystem } from './CollisionSystem.js';
import { CameraController } from './CameraController.js';
import { ParticleSystem } from './ParticleSystem.js';
import { ScoreManager } from './ScoreManager.js';
import { MissionsManager } from './MissionsManager.js';
import { audioManager } from './AudioManager.js';

import { MainMenu } from '../ui/MainMenu.js';
import { HUD } from '../ui/HUD.js';
import { PauseMenu } from '../ui/PauseMenu.js';
import { GameOver } from '../ui/GameOver.js';
import { Shop } from '../ui/Shop.js';
import { MissionsUI, DailyUI } from '../ui/Missions.js';
import { SettingsUI } from '../ui/Settings.js';

export class Game {
  constructor() {
    this.canvas = document.getElementById('webgl-canvas');
    this.state = 'LOADING'; // LOADING | MAIN_MENU | PLAYING | PAUSED | GAME_OVER
    this.lastTime = performance.now();
    this.runTime = 0; // Game time accumulated during PLAYING state

    // 1. Core Three.js setup
    this.initThree();

    // 2. Data & Managers
    this.scoreManager = new ScoreManager();
    this.missionsManager = new MissionsManager(this.scoreManager);

    // 3. Gameplay Systems
    this.initGameplaySystems();

    // 4. UI Systems
    this.initUI();

    // 5. Apply saved settings
    this.applySavedSettings();

    // 6. Bind window resize
    window.addEventListener('resize', this.onWindowResize.bind(this));

    // 7. Start Game Loop
    this.animate = this.loop.bind(this);
    requestAnimationFrame(this.animate);
  }

  initThree() {
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      350
    );

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }

  initGameplaySystems() {
    const equippedSkin = this.scoreManager.data.equippedCharacter || 'dash';
    const equippedTheme = this.scoreManager.data.equippedTheme || 'tokyo_city';

    this.world = new World(this.scene, equippedTheme);
    this.player = new Player(this.scene, equippedSkin);
    this.cameraController = new CameraController(this.camera);
    this.particleSystem = new ParticleSystem(this.scene);

    this.obstacleManager = new ObstacleManager(this.scene);
    this.coinManager = new CoinManager(this.scene);
    this.powerUpManager = new PowerUpManager(this.scene, this.player, this.coinManager);

    this.collisionSystem = new CollisionSystem(
      this.player,
      this.obstacleManager,
      this.powerUpManager,
      this.particleSystem,
      this.cameraController
    );

    this.controller = new PlayerController(this.player, this);
  }

  initUI() {
    this.hud = new HUD(this);
    this.mainMenu = new MainMenu(this);
    this.pauseMenu = new PauseMenu(this);
    this.gameOverMenu = new GameOver(this);
    this.shop = new Shop(this);
    this.missionsUI = new MissionsUI(this);
    this.dailyUI = new DailyUI(this);
    this.settingsUI = new SettingsUI(this);

    // Initial loading simulation
    const loadingScreen = document.getElementById('loading-screen');
    const loadingBar = document.getElementById('loading-bar');
    const loadingStatus = document.getElementById('loading-status');

    let loadProgress = 0;
    const loadInterval = setInterval(() => {
      loadProgress += 20;
      loadingBar.style.width = `${loadProgress}%`;
      if (loadProgress === 60) {
        loadingStatus.textContent = 'GENERATING ENDLESS RAIL CHUNKS...';
      } else if (loadProgress >= 100) {
        clearInterval(loadInterval);
        loadingStatus.textContent = 'READY TO RUN!';
        setTimeout(() => {
          loadingScreen.classList.remove('active');
          this.showMainMenu();
        }, 300);
      }
    }, 120);
  }

  applySavedSettings() {
    const s = this.scoreManager.data.settings;
    audioManager.setBgmVolume(s.bgmVolume);
    audioManager.setSfxVolume(s.sfxVolume);
    this.applyGraphicsQuality(s.graphics);
  }

  applyGraphicsQuality(quality) {
    if (quality === 'low') {
      this.renderer.shadowMap.enabled = false;
      this.renderer.setPixelRatio(1.0);
      this.particleSystem.maxParticles = 80;
      if (this.world?.env?.sunLight) {
        this.world.env.sunLight.castShadow = false;
      }
    } else if (quality === 'medium') {
      this.renderer.shadowMap.enabled = false;
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      this.particleSystem.maxParticles = 180;
      if (this.world?.env?.sunLight) {
        this.world.env.sunLight.castShadow = false;
      }
    } else {
      // high
      this.renderer.shadowMap.enabled = true;
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));
      this.particleSystem.maxParticles = 300;
      if (this.world?.env?.sunLight) {
        this.world.env.sunLight.castShadow = true;
      }
    }
    this.renderer.shadowMap.needsUpdate = true;
  }

  showMainMenu() {
    this.state = 'MAIN_MENU';
    audioManager.stopBGM();

    // Reset world and player for idle view
    this.world.reset();
    this.player.reset();
    this.obstacleManager.clear();
    this.coinManager.clear();
    this.powerUpManager.clear();
    this.particleSystem.clear();
    this.cameraController.reset(this.player.position);

    this.hud.hide();
    this.pauseMenu.hide();
    this.gameOverMenu.hide();
    this.mainMenu.show();
  }

  startRun() {
    this.state = 'PLAYING';
    this.runTime = 0; // Reset 5-second safe grace period
    audioManager.ensureContext();
    audioManager.startBGM();

    this.scoreManager.startRun();
    this.missionsManager.startRun();

    this.world.reset();
    this.player.reset();
    this.obstacleManager.clear();
    this.coinManager.clear();
    this.powerUpManager.clear();
    this.particleSystem.clear();
    this.collisionSystem.reset();
    this.cameraController.reset(this.player.position);

    // Initial chunk coins ahead (first 5 seconds completely safe from obstacles!)
    this.spawnInitialTracks();

    this.mainMenu.hide();
    this.pauseMenu.hide();
    this.gameOverMenu.hide();
    this.hud.show();
  }

  spawnInitialTracks() {
    // Starting tracks: 100% obstacle-free! Only coins and power-ups for the initial tracks.
    // Obstacles will begin spawning naturally via recycled chunks once the 5s grace period passes.
    for (let i = 1; i < this.world.chunks.length; i++) {
      const z = this.world.chunks[i].position.z;
      this.coinManager.spawnChunkCoins(z);
      if (Math.random() > 0.45) {
        this.powerUpManager.spawnRandomPickup(z);
      }
    }
  }

  pause() {
    if (this.state !== 'PLAYING') return;
    this.state = 'PAUSED';
    audioManager.stopBGM();
    this.pauseMenu.show(
      this.scoreManager.score,
      this.scoreManager.coins,
      this.scoreManager.distance
    );
  }

  resume() {
    if (this.state !== 'PAUSED') return;
    this.state = 'PLAYING';
    this.lastTime = performance.now();
    audioManager.startBGM();
    this.pauseMenu.hide();
  }

  onGameOver() {
    this.state = 'GAME_OVER';
    audioManager.stopBGM();
    audioManager.playCrash();

    // Crash explosion VFX & camera shake
    this.particleSystem.spawnCrashExplosion(this.player.position);
    this.cameraController.addShake(1.2);

    // Finalize score & missions
    const results = this.scoreManager.endRun();
    this.missionsManager.updateRunEnd(results.distance, results.finalScore);

    // Transition to game over UI after short dramatic impact
    setTimeout(() => {
      this.hud.hide();
      this.gameOverMenu.show(results);
    }, 700);
  }

  loop(currentTime) {
    requestAnimationFrame(this.animate);

    const delta = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;

    if (this.state === 'PLAYING') {
      this.updatePlaying(delta);
    } else if (this.state === 'MAIN_MENU') {
      this.updateMainMenu(delta);
    }

    // Render 3D Scene
    this.renderer.render(this.scene, this.camera);
  }

  updateMainMenu(delta) {
    // Idle world rotation or subtle camera movement
    this.player.update(delta, 15);
    this.cameraController.update(delta, this.player.position, false, 25);
  }

  updatePlaying(delta) {
    const speed = this.world.currentSpeed;

    // 1. Advance Player Forward along -Z
    this.runTime += delta;
    const forwardStep = speed * delta;
    this.player.position.z -= forwardStep;

    // 2. Distance and Score Tracking
    const hasMultiplier = this.powerUpManager.activeEffects.multiplier > 0;
    this.scoreManager.addDistance(forwardStep, hasMultiplier);

    // Dynamic ground elevation (Incline ramps & train roof running)
    this.checkPlayerGroundElevation();

    // 3. Update Player Mechanics & Animations
    this.player.update(delta, speed);

    // Particle sparks when jumping / sliding / jetpack
    if (this.player.isSliding) {
      this.particleSystem.spawnSlideSparks(this.player.position);
      this.missionsManager.recordSlide();
    }
    if (this.player.isJetpacking) {
      this.particleSystem.spawnJetpackExhaust(this.player.position);
    }
    if (this.player.isHoverboarding) {
      this.particleSystem.spawnSlideSparks(this.player.position);
    }

    // 4. Update World Chunks Recycling
    this.world.update(delta, this.player.position.z, (newChunkZ) => {
      // Spawn new obstacles & collectibles on incoming recycled chunk
      this.obstacleManager.spawnChunkObstacles(
        newChunkZ,
        speed,
        this.runTime,
        this.scoreManager.distance,
        this.player.position.z
      );
      this.coinManager.spawnChunkCoins(newChunkZ);
      if (Math.random() > 0.4) {
        this.powerUpManager.spawnRandomPickup(newChunkZ);
      }
    });

    // 5. Update Obstacles
    this.obstacleManager.update(delta, this.player.position.z);

    // 6. Update Coins (with Magnet pull)
    const hasMagnet = this.powerUpManager.activeEffects.magnet > 0;
    this.coinManager.update(delta, this.player.position, hasMagnet, (coinPos) => {
      this.scoreManager.addCoins(1);
      this.missionsManager.recordCoins(1);
      this.particleSystem.spawnCoinBurst(coinPos);
    });

    // 7. Update Power-Ups
    this.powerUpManager.update(delta, this.player.position, (typeKey, pickupPos) => {
      this.missionsManager.recordPowerUp();
      this.particleSystem.spawnShieldShatter(pickupPos);
    });

    // 8. Collision Check
    this.collisionSystem.update(delta);
    const hitResult = this.collisionSystem.checkCollisions();
    if (hitResult) {
      if (!hitResult.absorbed) {
        // Fatal Crash
        this.onGameOver();
        return;
      }
    }

    // 9. Particles Update
    this.particleSystem.update(delta);

    // 10. Camera Following
    this.cameraController.update(delta, this.player.position, this.player.isJetpacking, speed);

    // 11. HUD Update
    this.hud.update(
      this.scoreManager.score,
      this.scoreManager.coins,
      this.scoreManager.distance,
      hasMultiplier,
      this.powerUpManager.getActivePowerUps()
    );
  }

  checkPlayerGroundElevation() {
    let targetGroundY = 0;
    const p = this.player;
    const obstacles = this.obstacleManager.activeObstacles;

    for (let i = 0; i < obstacles.length; i++) {
      const obs = obstacles[i];
      if (obs.obstacleType === 'TRAIN') {
        const dx = Math.abs(p.position.x - obs.position.x);
        const dz = p.position.z - obs.position.z;

        if (dx < 1.25) {
          if (obs.hasRamp && dz <= 15.5 && dz >= 9.5) {
            // Climbing the incline train ramp!
            const progress = (15.5 - dz) / 6.0;
            targetGroundY = Math.max(targetGroundY, Math.min(3.28, progress * 3.28));
          } else if (dz < 9.5 && dz > -10.0) {
            // Running on train catwalk roof
            if (p.position.y >= 2.4 || targetGroundY > 0) {
              targetGroundY = Math.max(targetGroundY, 3.28);
            }
          }
        }
      }
    }
    p.groundY = targetGroundY;
  }

  onWindowResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
}
