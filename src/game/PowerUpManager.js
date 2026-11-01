import * as THREE from 'three';
import { LANES } from './Player.js';
import { audioManager } from './AudioManager.js';

export const POWER_UP_TYPES = {
  MAGNET: {
    id: 'magnet',
    name: 'COIN MAGNET',
    duration: 12.0,
    color: 0xffe600,
    icon: '🧲'
  },
  JETPACK: {
    id: 'jetpack',
    name: 'JETPACK FLIGHT',
    duration: 10.0,
    color: 0xff0055,
    icon: '🚀'
  },
  MULTIPLIER: {
    id: 'multiplier',
    name: '2X MULTIPLIER',
    duration: 15.0,
    color: 0x9d00ff,
    icon: '⚡'
  },
  SUPER_JUMP: {
    id: 'superjump',
    name: 'SUPER JUMP',
    duration: 12.0,
    color: 0x00ff88,
    icon: '👟'
  },
  SHIELD: {
    id: 'shield',
    name: 'ENERGY SHIELD',
    duration: 20.0,
    color: 0x00f3ff,
    icon: '🛡️'
  }
};

export class PowerUpManager {
  constructor(scene, player, coinManager) {
    this.scene = scene;
    this.player = player;
    this.coinManager = coinManager;

    this.activePickups = [];
    this.activeEffects = {
      magnet: 0,
      jetpack: 0,
      multiplier: 0,
      superjump: 0,
      shield: false
    };

    this.initSharedAssets();
  }

  initSharedAssets() {
    this.materials = {
      ringGlow: new THREE.MeshBasicMaterial({ color: 0x00f3ff, wireframe: true }),
      magnetMat: new THREE.MeshStandardMaterial({ color: 0xff2244, metalness: 0.8, roughness: 0.2 }),
      jetpackMat: new THREE.MeshStandardMaterial({ color: 0xff5500, metalness: 0.7, roughness: 0.3 }),
      multiplierMat: new THREE.MeshStandardMaterial({ color: 0x9d00ff, metalness: 0.9, roughness: 0.1, emissive: 0x7700cc, emissiveIntensity: 0.5 }),
      superJumpMat: new THREE.MeshStandardMaterial({ color: 0x00ff88, metalness: 0.8, roughness: 0.2 }),
      shieldMat: new THREE.MeshStandardMaterial({ color: 0x00f3ff, metalness: 0.7, roughness: 0.1, transparent: true, opacity: 0.85 })
    };
  }

  createPickupMesh(typeKey) {
    const group = new THREE.Group();
    group.powerUpType = typeKey;

    // Glowing rotating halo ring
    const ringGeo = new THREE.TorusGeometry(0.7, 0.04, 8, 16);
    const ring = new THREE.Mesh(ringGeo, this.materials.ringGlow);
    group.add(ring);

    // Custom Icon Mesh based on Type
    switch (typeKey) {
      case 'MAGNET': {
        const uGeo = new THREE.TorusGeometry(0.35, 0.1, 8, 16, Math.PI);
        const uMesh = new THREE.Mesh(uGeo, this.materials.magnetMat);
        uMesh.rotation.z = Math.PI;
        group.add(uMesh);
        break;
      }
      case 'JETPACK': {
        const cGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.55, 8);
        [-0.15, 0.15].forEach(x => {
          const cy = new THREE.Mesh(cGeo, this.materials.jetpackMat);
          cy.position.x = x;
          group.add(cy);
        });
        break;
      }
      case 'MULTIPLIER': {
        const octGeo = new THREE.OctahedronGeometry(0.4);
        const oct = new THREE.Mesh(octGeo, this.materials.multiplierMat);
        group.add(oct);
        break;
      }
      case 'SUPER_JUMP': {
        const springGeo = new THREE.TorusGeometry(0.3, 0.08, 8, 16);
        const spring = new THREE.Mesh(springGeo, this.materials.superJumpMat);
        group.add(spring);
        break;
      }
      case 'SHIELD': {
        const sphereGeo = new THREE.IcosahedronGeometry(0.38, 1);
        const sphere = new THREE.Mesh(sphereGeo, this.materials.shieldMat);
        group.add(sphere);
        break;
      }
    }

    group.position.y = 1.2;
    return group;
  }

  spawnPickup(typeKey, laneIndex, zPos) {
    const pickup = this.createPickupMesh(typeKey);
    pickup.position.set(LANES[laneIndex], 1.2, zPos);
    this.scene.add(pickup);
    this.activePickups.push(pickup);
  }

  spawnRandomPickup(chunkCenterZ) {
    const types = ['MAGNET', 'JETPACK', 'MULTIPLIER', 'SUPER_JUMP', 'SHIELD'];
    const chosenType = types[Math.floor(Math.random() * types.length)];
    const lane = Math.floor(Math.random() * 3);
    this.spawnPickup(chosenType, lane, chunkCenterZ);
  }

  activatePowerUp(typeKey) {
    audioManager.playPowerUp();
    const config = POWER_UP_TYPES[typeKey];

    switch (typeKey) {
      case 'MAGNET':
        this.activeEffects.magnet = config.duration;
        this.player.setMagnet(true);
        break;
      case 'JETPACK':
        this.activeEffects.jetpack = config.duration;
        this.player.setJetpack(true);
        // Spawn sky coins ahead
        this.coinManager.spawnSkyCoins(this.player.position.z - 10, 160);
        break;
      case 'MULTIPLIER':
        this.activeEffects.multiplier = config.duration;
        break;
      case 'SUPER_JUMP':
        this.activeEffects.superjump = config.duration;
        this.player.setSuperJump(true);
        break;
      case 'SHIELD':
        this.activeEffects.shield = true;
        this.player.setShield(true);
        break;
    }
  }

  consumeShield() {
    if (this.activeEffects.shield) {
      this.activeEffects.shield = false;
      this.player.setShield(false);
      audioManager.playShieldHit();
      return true; // Collision successfully absorbed!
    }
    return false;
  }

  update(delta, playerPos, onCollectPowerUp) {
    // 1. Update Active Timers
    ['magnet', 'jetpack', 'multiplier', 'superjump'].forEach(key => {
      if (this.activeEffects[key] > 0) {
        this.activeEffects[key] -= delta;
        if (this.activeEffects[key] <= 0) {
          this.activeEffects[key] = 0;
          this.onPowerUpExpired(key);
        }
      }
    });

    // 2. Animate and check collection for active pickups in world
    for (let i = this.activePickups.length - 1; i >= 0; i--) {
      const pickup = this.activePickups[i];
      pickup.rotation.y += delta * 2.5;
      pickup.rotation.x = Math.sin(performance.now() * 0.003) * 0.3;
      pickup.position.y = 1.2 + Math.sin(performance.now() * 0.004) * 0.15;

      const dx = Math.abs(pickup.position.x - playerPos.x);
      const dy = Math.abs(pickup.position.y - (playerPos.y + 0.9));
      const dz = Math.abs(pickup.position.z - playerPos.z);

      if (dx < 1.3 && dy < 1.6 && dz < 1.5) {
        // Collected!
        const typeKey = pickup.powerUpType;
        this.activatePowerUp(typeKey);
        if (onCollectPowerUp) {
          onCollectPowerUp(typeKey, pickup.position.clone());
        }
        this.scene.remove(pickup);
        this.activePickups.splice(i, 1);
        continue;
      }

      // Recycle if passed
      if (pickup.position.z > playerPos.z + 25) {
        this.scene.remove(pickup);
        this.activePickups.splice(i, 1);
      }
    }
  }

  onPowerUpExpired(key) {
    audioManager.playPowerDown();
    if (key === 'magnet') {
      this.player.setMagnet(false);
    } else if (key === 'jetpack') {
      this.player.setJetpack(false);
    } else if (key === 'superjump') {
      this.player.setSuperJump(false);
    }
  }

  getActivePowerUps() {
    const list = [];
    if (this.activeEffects.magnet > 0) {
      list.push({ ...POWER_UP_TYPES.MAGNET, timeLeft: this.activeEffects.magnet });
    }
    if (this.activeEffects.jetpack > 0) {
      list.push({ ...POWER_UP_TYPES.JETPACK, timeLeft: this.activeEffects.jetpack });
    }
    if (this.activeEffects.multiplier > 0) {
      list.push({ ...POWER_UP_TYPES.MULTIPLIER, timeLeft: this.activeEffects.multiplier });
    }
    if (this.activeEffects.superjump > 0) {
      list.push({ ...POWER_UP_TYPES.SUPER_JUMP, timeLeft: this.activeEffects.superjump });
    }
    if (this.activeEffects.shield) {
      list.push({ ...POWER_UP_TYPES.SHIELD, timeLeft: 99 });
    }
    return list;
  }

  clear() {
    this.activePickups.forEach(p => this.scene.remove(p));
    this.activePickups = [];
    this.activeEffects = {
      magnet: 0,
      jetpack: 0,
      multiplier: 0,
      superjump: 0,
      shield: false
    };
    this.player.setJetpack(false);
    this.player.setSuperJump(false);
    this.player.setShield(false);
  }
}
