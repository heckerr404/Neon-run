import * as THREE from 'three';
import { Environment } from './Environment.js';

export const CHUNK_LENGTH = 60;
export const NUM_CHUNKS = 7;

export class World {
  constructor(scene, themeId = 'tokyo_city') {
    this.scene = scene;
    this.environment = new Environment(scene, themeId);

    // Chunks object pool
    this.chunks = [];
    this.furthestZ = 0;

    // Progression
    this.baseSpeed = 30.0;
    this.currentSpeed = 30.0;
    this.maxSpeed = 64.0;
    this.acceleration = 0.28; // Speed increase per second
    this.distanceTraveled = 0;

    this.initWorld();
  }

  initWorld() {
    this.clear();
    // Build initial chunks from Z = +30 down to -330
    for (let i = 0; i < NUM_CHUNKS; i++) {
      const chunkZ = 30 - i * CHUNK_LENGTH;
      const chunk = this.environment.createTrackChunk(chunkZ);
      this.scene.add(chunk);
      this.chunks.push(chunk);
      this.furthestZ = chunkZ;
    }
  }

  clear() {
    this.chunks.forEach(chunk => {
      this.scene.remove(chunk);
    });
    this.chunks = [];
    this.distanceTraveled = 0;
    this.currentSpeed = this.baseSpeed;
    this.furthestZ = 0;
  }

  reset() {
    this.clear();
    this.initWorld();
  }

  setTheme(themeId) {
    this.environment.setTheme(themeId);
  }

  update(delta, playerZ, onChunkSpawned) {
    // 1. Speed acceleration
    if (this.currentSpeed < this.maxSpeed) {
      this.currentSpeed += this.acceleration * delta;
    }

    // 2. Track light positioning following player
    this.environment.updateLightPosition(playerZ);

    // 3. Recycle chunks behind player
    // A chunk is safely behind player when player is more than 35 units ahead of chunk's center
    for (let i = 0; i < this.chunks.length; i++) {
      const chunk = this.chunks[i];
      if (playerZ < chunk.position.z - 45) {
        // Move this chunk ahead of the furthest chunk
        this.furthestZ -= CHUNK_LENGTH;
        chunk.position.z = this.furthestZ;

        // Callback for spawning obstacles/coins on newly repositioned chunk
        if (onChunkSpawned) {
          onChunkSpawned(chunk.position.z);
        }
      }
    }
  }
}
