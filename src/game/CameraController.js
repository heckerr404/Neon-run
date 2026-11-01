import * as THREE from 'three';

export class CameraController {
  constructor(camera) {
    this.camera = camera;

    // Camera follow parameters tuned to match the reference composition:
    // Player is framed in the lower-middle portion of the screen (around 30-35% from bottom),
    // looking down the three tracks with deep horizon perspective.
    this.offset = new THREE.Vector3(0, 3.35, 5.2);
    this.lookOffset = new THREE.Vector3(0, 1.4, -14.0);

    // Damping vectors
    this.currentPosition = new THREE.Vector3(0, 3.35, 5.2);
    this.targetPosition = new THREE.Vector3();
    this.currentLookAt = new THREE.Vector3();

    // Camera Shake
    this.shakeIntensity = 0;
    this.shakeDecay = 4.5;

    // FOV management
    this.baseFov = 62;
  }

  reset(playerPos) {
    const pZ = playerPos ? playerPos.z : 0;
    const pX = playerPos ? playerPos.x : 0;
    this.currentPosition.set(pX * 0.45, 3.35, pZ + 5.2);
    this.currentLookAt.set(0, 1.4, pZ - 14.0);
    this.camera.position.copy(this.currentPosition);
    this.camera.lookAt(this.currentLookAt);
    this.shakeIntensity = 0;
    this.camera.fov = this.baseFov;
    this.camera.updateProjectionMatrix();
  }

  addShake(intensity = 0.5) {
    this.shakeIntensity = Math.min(1.4, this.shakeIntensity + intensity);
  }

  update(delta, playerPos, isJetpacking, gameSpeed) {
    // 1. Calculate Target Camera Position
    // Damp lateral X slightly so camera glides gracefully behind lane changes
    const targetX = playerPos.x * 0.45;
    // Follow jump smoothly, lift for jetpack
    const targetY = (isJetpacking ? 9.8 : Math.max(playerPos.y * 0.7, 0)) + this.offset.y;
    const targetZ = playerPos.z + this.offset.z;

    this.targetPosition.set(targetX, targetY, targetZ);

    // Lerp camera position
    const lerpRate = Math.min(1.0, delta * 12.0);
    this.currentPosition.lerp(this.targetPosition, lerpRate);

    // 2. Shake calculation
    let shakeX = 0;
    let shakeY = 0;
    if (this.shakeIntensity > 0) {
      shakeX = (Math.random() - 0.5) * this.shakeIntensity;
      shakeY = (Math.random() - 0.5) * this.shakeIntensity;
      this.shakeIntensity = Math.max(0, this.shakeIntensity - this.shakeDecay * delta);
    }

    this.camera.position.set(
      this.currentPosition.x + shakeX,
      this.currentPosition.y + shakeY,
      this.currentPosition.z
    );

    // 3. Look-At Target (focused ahead down the tracks)
    const lookTarget = new THREE.Vector3(
      playerPos.x * 0.3,
      (isJetpacking ? 6.5 : Math.max(playerPos.y * 0.5, 0)) + this.lookOffset.y,
      playerPos.z + this.lookOffset.z
    );
    this.currentLookAt.lerp(lookTarget, lerpRate);
    this.camera.lookAt(this.currentLookAt);

    // 4. Dynamic FOV based on speed and jetpack
    const speedRatio = Math.max(0, (gameSpeed - 30) / 34);
    const targetFov = this.baseFov + (isJetpacking ? 8 : speedRatio * 6);
    if (Math.abs(this.camera.fov - targetFov) > 0.1) {
      this.camera.fov += (targetFov - this.camera.fov) * Math.min(1.0, delta * 3.5);
      this.camera.updateProjectionMatrix();
    }
  }
}
