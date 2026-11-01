import * as THREE from 'three';
import { LANES } from './Player.js';
import { audioManager } from './AudioManager.js';

export class CoinManager {
  constructor(scene) {
    this.scene = scene;
    this.activeCoins = [];
    this.coinPool = [];

    this.initSharedAssets();
  }

  initSharedAssets() {
    // Stylized Metallic Gold Materials
    this.coinRimMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24, // Warm bright gold
      roughness: 0.25,
      metalness: 0.9,
      emissive: 0xd97706,
      emissiveIntensity: 0.35
    });

    this.coinFaceMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b, // Amber gold face
      roughness: 0.3,
      metalness: 0.85
    });

    this.coinStarMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a, // Light gleaming yellow
      roughness: 0.2,
      metalness: 0.95,
      emissive: 0xfacc15,
      emissiveIntensity: 0.4
    });

    // Circular Coin Geometries
    this.rimGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.08, 16);
    this.rimGeo.rotateZ(Math.PI / 2);

    this.faceGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.09, 16);
    this.faceGeo.rotateZ(Math.PI / 2);

    // 5-Point Star Emblem Geometry
    const starShape = new THREE.Shape();
    const points = 5;
    const outerR = 0.2;
    const innerR = 0.09;
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      if (i === 0) starShape.moveTo(x, y);
      else starShape.lineTo(x, y);
    }
    starShape.closePath();

    this.starGeo = new THREE.ShapeGeometry(starShape);
  }

  createCoinMesh() {
    const group = new THREE.Group();

    // Outer Rim
    const rim = new THREE.Mesh(this.rimGeo, this.coinRimMat);
    rim.castShadow = true;
    group.add(rim);

    // Embossed Face
    const face = new THREE.Mesh(this.faceGeo, this.coinFaceMat);
    group.add(face);

    // Star Emblem on both sides (+X and -X since cylinder rotated 90 deg around Z)
    const starFront = new THREE.Mesh(this.starGeo, this.coinStarMat);
    starFront.position.x = 0.046;
    starFront.rotation.y = Math.PI / 2;
    group.add(starFront);

    const starBack = new THREE.Mesh(this.starGeo, this.coinStarMat);
    starBack.position.x = -0.046;
    starBack.rotation.y = -Math.PI / 2;
    group.add(starBack);

    group.hitRadius = 1.0;
    group.isCollected = false;
    group.baseY = 0.9;
    return group;
  }

  spawnCoin(x, y, z) {
    let coin = this.coinPool.pop();
    if (!coin) {
      coin = this.createCoinMesh();
    }
    coin.position.set(x, y, z);
    coin.baseY = y;
    coin.isCollected = false;
    coin.rotation.set(0, 0, 0);

    this.scene.add(coin);
    this.activeCoins.push(coin);
    return coin;
  }

  // --- Coin Patterns ---

  spawnStraightLine(laneIndex, startZ, count = 5, spacing = 2.4, y = 0.9) {
    const x = LANES[laneIndex];
    for (let i = 0; i < count; i++) {
      this.spawnCoin(x, y, startZ - i * spacing);
    }
  }

  spawnJumpArc(laneIndex, centerZ, count = 7, height = 3.2) {
    const x = LANES[laneIndex];
    const half = (count - 1) / 2;
    for (let i = 0; i < count; i++) {
      const t = (i - half) / half;
      const y = 0.9 + (1 - t * t) * height;
      this.spawnCoin(x, y, centerZ + (i - half) * 2.2);
    }
  }

  spawnSkyCoins(startZ, length = 60) {
    for (let z = startZ; z > startZ - length; z -= 2.8) {
      const lane = Math.floor(Math.random() * 3);
      this.spawnCoin(LANES[lane], 7.5, z);
    }
  }

  spawnChunkCoins(chunkCenterZ) {
    const pattern = Math.floor(Math.random() * 4);
    switch (pattern) {
      case 0:
        this.spawnStraightLine(0, chunkCenterZ + 15, 6);
        this.spawnStraightLine(2, chunkCenterZ - 10, 6);
        break;
      case 1:
        this.spawnJumpArc(1, chunkCenterZ, 7, 3.0);
        break;
      case 2:
        this.spawnStraightLine(1, chunkCenterZ + 20, 8, 2.4);
        break;
      case 3:
        this.spawnJumpArc(0, chunkCenterZ + 10, 5, 2.6);
        this.spawnJumpArc(2, chunkCenterZ - 12, 5, 2.6);
        break;
    }
  }

  update(delta, playerPos, hasMagnet, onCollect) {
    const magnetRadius = 15.0;
    const rotSpeed = delta * 4.0;

    for (let i = this.activeCoins.length - 1; i >= 0; i--) {
      const coin = this.activeCoins[i];

      // Smooth spin
      coin.rotation.y += rotSpeed;
      coin.position.y = coin.baseY + Math.sin(performance.now() * 0.005 + coin.position.z * 0.2) * 0.12;

      // Magnet attraction
      if (hasMagnet) {
        const distToPlayer = coin.position.distanceTo(playerPos);
        if (distToPlayer < magnetRadius) {
          coin.position.lerp(playerPos, delta * 14.0);
        }
      }

      // Check collection
      const dx = Math.abs(coin.position.x - playerPos.x);
      const dy = Math.abs(coin.position.y - (playerPos.y + 0.9));
      const dz = Math.abs(coin.position.z - playerPos.z);

      if (dx < 1.15 && dy < 1.4 && dz < 1.35) {
        audioManager.playCoin();
        if (onCollect) {
          onCollect(coin.position.clone());
        }
        this.recycleCoin(coin, i);
        continue;
      }

      if (coin.position.z > playerPos.z + 25) {
        this.recycleCoin(coin, i);
      }
    }
  }

  recycleCoin(coin, index) {
    this.scene.remove(coin);
    this.activeCoins.splice(index, 1);
    this.coinPool.push(coin);
  }

  clear() {
    this.activeCoins.forEach(coin => {
      this.scene.remove(coin);
    });
    this.activeCoins = [];
  }
}
