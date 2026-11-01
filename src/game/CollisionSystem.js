import * as THREE from 'three';

export class CollisionSystem {
  constructor(player, obstacleManager, powerUpManager, particleSystem, cameraController) {
    this.player = player;
    this.obstacleManager = obstacleManager;
    this.powerUpManager = powerUpManager;
    this.particleSystem = particleSystem;
    this.cameraController = cameraController;

    this.invulnerableTimer = 0;
  }

  reset() {
    this.invulnerableTimer = 0;
  }

  update(delta) {
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= delta;
    }
  }

  checkCollisions() {
    // If player is flying high on jetpack, ignore ground obstacles
    if (this.player.isJetpacking) {
      return null;
    }

    if (this.invulnerableTimer > 0) {
      return null;
    }

    const playerBox = this.player.hitbox;
    const obstacles = this.obstacleManager.activeObstacles;

    for (let i = 0; i < obstacles.length; i++) {
      const obs = obstacles[i];
      if (!obs.hitbox) continue;

      if (playerBox.intersectsBox(obs.hitbox)) {
        // Safe if running on top of train roof
        if (obs.obstacleType === 'TRAIN' && this.player.position.y >= 3.0) {
          continue;
        }

        // Collision detected! Check if Shield or Hoverboard is active
        if (this.powerUpManager.consumeShield() || this.player.consumeHoverboard()) {
          // Shield/Hoverboard absorbed hit!
          this.particleSystem.spawnShieldShatter(this.player.position);
          this.particleSystem.spawnCrashExplosion(this.player.position);
          this.cameraController.addShake(0.7);
          this.invulnerableTimer = 1.4;

          // Push obstacle away or recycle it so player doesn't get stuck
          obs.position.z += 100;
          return { absorbed: true, obstacle: obs };
        }

        // Fatal Crash!
        return { absorbed: false, obstacle: obs };
      }
    }

    return null;
  }
}
