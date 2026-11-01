import * as THREE from 'three';
import { LANES } from './Player.js';
import { audioManager } from './AudioManager.js';

export class ObstacleManager {
  constructor(scene) {
    this.scene = scene;
    this.activeObstacles = [];
    this.pool = {
      trains: [],
      lowBarriers: [],
      highBarriers: [],
      blockers: []
    };

    this.initSharedAssets();
  }

  initSharedAssets() {
    // 1. Train Materials
    this.materials = {
      // Red Freight Train
      redFreight: new THREE.MeshStandardMaterial({
        color: 0x991b1b, // Deep rich red
        roughness: 0.45,
        metalness: 0.4
      }),
      redFreightRoof: new THREE.MeshStandardMaterial({
        color: 0x7f1d1d,
        roughness: 0.6,
        metalness: 0.3
      }),
      hazardChevrons: new THREE.MeshBasicMaterial({
        color: 0xfef08a // Hazard yellow
      }),
      hazardRed: new THREE.MeshBasicMaterial({
        color: 0xdc2626
      }),
      // Silver Metro Subway Train
      silverMetro: new THREE.MeshStandardMaterial({
        color: 0xd8e2ed, // Metallic Silver
        roughness: 0.25,
        metalness: 0.85
      }),
      metroBlueStripe: new THREE.MeshStandardMaterial({
        color: 0x0284c7, // Subway blue stripe
        roughness: 0.3,
        metalness: 0.5
      }),
      subwayWindows: new THREE.MeshBasicMaterial({
        color: 0x1e293b // Dark tinted windows
      }),
      headlightOn: new THREE.MeshBasicMaterial({
        color: 0xffffff // White blazing headlights
      }),
      taillightRed: new THREE.MeshBasicMaterial({
        color: 0xef4444
      }),
      trainChassis: new THREE.MeshStandardMaterial({
        color: 0x18181b,
        roughness: 0.8,
        metalness: 0.8
      }),
      trainWheel: new THREE.MeshStandardMaterial({
        color: 0x3f3f46,
        roughness: 0.4,
        metalness: 0.9
      }),
      // Barriers
      barrierRedWhite: new THREE.MeshStandardMaterial({
        color: 0xdc2626,
        roughness: 0.5,
        metalness: 0.2
      }),
      whiteStripe: new THREE.MeshBasicMaterial({
        color: 0xffffff
      }),
      barrierPost: new THREE.MeshStandardMaterial({
        color: 0x475569,
        roughness: 0.5,
        metalness: 0.7
      }),
      warningLightAmber: new THREE.MeshBasicMaterial({
        color: 0xf59e0b
      })
    };

    // 2. Geometries
    this.geo = {
      trainBody: new THREE.BoxGeometry(2.35, 3.1, 20),
      trainCurvedRoof: new THREE.CylinderGeometry(1.18, 1.18, 20, 16, 1, false, 0, Math.PI),
      windowStrip: new THREE.BoxGeometry(2.38, 0.5, 17),
      headlight: new THREE.CylinderGeometry(0.22, 0.22, 0.1, 12),
      bumper: new THREE.BoxGeometry(2.36, 0.45, 0.2),
      wheel: new THREE.CylinderGeometry(0.35, 0.35, 0.2, 12),
      lowBar: new THREE.BoxGeometry(2.7, 0.5, 0.3),
      lowPost: new THREE.BoxGeometry(0.2, 1.0, 0.2),
      highBar: new THREE.BoxGeometry(2.7, 0.55, 0.35),
      highPost: new THREE.BoxGeometry(0.2, 2.5, 0.2),
      blockerBody: new THREE.BoxGeometry(2.4, 1.2, 0.8)
    };
  }

  // --- 3D Train Models ---

  createFreightTrainMesh(hasRamp = false) {
    const group = new THREE.Group();
    group.trainStyle = 'FREIGHT';
    group.hasRamp = hasRamp;

    // Main red boxcar body
    const body = new THREE.Mesh(this.geo.trainBody, this.materials.redFreight);
    body.position.y = 1.7;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Corrugated catwalk on roof (Walkable!)
    const roofCatwalk = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 19.8), this.materials.redFreightRoof);
    roofCatwalk.position.set(0, 3.28, 0);
    roofCatwalk.receiveShadow = true;
    group.add(roofCatwalk);

    // Optional Incline Ramp at Front (+Z)
    if (hasRamp) {
      const rampLength = 5.5;
      const rampGeo = new THREE.BoxGeometry(2.35, 0.16, rampLength);
      const ramp = new THREE.Mesh(rampGeo, this.materials.redFreightRoof);
      const angle = Math.atan2(3.2, rampLength);
      ramp.rotation.x = -angle;
      ramp.position.set(0, 1.6, 9.8 + (rampLength / 2) * Math.cos(angle));
      ramp.castShadow = true;
      ramp.receiveShadow = true;
      group.add(ramp);
    } else {
      // Front Bumper with Red/White Hazard Chevrons
      const bumper = new THREE.Mesh(this.geo.bumper, this.materials.hazardChevrons);
      bumper.position.set(0, 0.4, 10.05);
      group.add(bumper);

      const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.42, 0.22), this.materials.hazardRed);
      stripe.position.set(0, 0.4, 10.05);
      group.add(stripe);

      // Front Headlights
      [-0.7, 0.7].forEach(x => {
        const hl = new THREE.Mesh(this.geo.headlight, this.materials.headlightOn);
        hl.rotation.x = Math.PI / 2;
        hl.position.set(x, 1.0, 10.08);
        group.add(hl);
      });
    }

    // Wheels / Bogies underneath
    [-0.95, 0.95].forEach(x => {
      [-7, -5, 5, 7].forEach(z => {
        const w = new THREE.Mesh(this.geo.wheel, this.materials.trainWheel);
        w.rotation.z = Math.PI / 2;
        w.position.set(x, 0.35, z);
        group.add(w);
      });
    });

    group.hitbox = new THREE.Box3();
    group.obstacleType = 'TRAIN';
    group.isMoving = false;
    group.speed = 0;
    return group;
  }

  createMetroTrainMesh() {
    const group = new THREE.Group();
    group.trainStyle = 'METRO';

    // Shiny Silver Body
    const body = new THREE.Mesh(this.geo.trainBody, this.materials.silverMetro);
    body.position.y = 1.7;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Rounded Aerodynamic Roof
    const roof = new THREE.Mesh(this.geo.trainCurvedRoof, this.materials.silverMetro);
    roof.rotation.z = Math.PI / 2;
    roof.rotation.x = Math.PI / 2;
    roof.position.set(0, 3.25, 0);
    roof.castShadow = true;
    group.add(roof);

    // Blue Subway Accent Stripe along both sides
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.38, 0.25, 19.8), this.materials.metroBlueStripe);
    stripe.position.set(0, 1.3, 0);
    group.add(stripe);

    // Passenger Tinted Window Strip
    const windows = new THREE.Mesh(this.geo.windowStrip, this.materials.subwayWindows);
    windows.position.set(0, 2.2, 0);
    group.add(windows);

    // Front Windshield for Conductor
    const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.8, 0.1), this.materials.subwayWindows);
    windshield.position.set(0, 2.35, 10.02);
    group.add(windshield);

    // Twin Blazing Headlights
    [-0.65, 0.65].forEach(x => {
      const hl = new THREE.Mesh(this.geo.headlight, this.materials.headlightOn);
      hl.rotation.x = Math.PI / 2;
      hl.position.set(x, 0.9, 10.05);
      group.add(hl);
    });

    // Wheels / Bogies
    [-0.95, 0.95].forEach(x => {
      [-7, -5, 5, 7].forEach(z => {
        const w = new THREE.Mesh(this.geo.wheel, this.materials.trainWheel);
        w.rotation.z = Math.PI / 2;
        w.position.set(x, 0.35, z);
        group.add(w);
      });
    });

    group.hitbox = new THREE.Box3();
    group.obstacleType = 'TRAIN';
    group.isMoving = false;
    group.speed = 0;
    return group;
  }

  // --- 3D Barrier Models ---

  createLowBarrierMesh() {
    const group = new THREE.Group();

    // Red & White Striped Hurdle Crossbar (Jumpable)
    const bar = new THREE.Mesh(this.geo.lowBar, this.materials.barrierRedWhite);
    bar.position.y = 0.6;
    bar.castShadow = true;
    group.add(bar);

    // White Stripes
    [-0.7, 0.7].forEach(x => {
      const whitePart = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.52, 0.32), this.materials.whiteStripe);
      whitePart.position.set(x, 0.6, 0);
      group.add(whitePart);
    });

    // Dual Warning Amber Lights on top of posts (as in reference image!)
    [-1.2, 1.2].forEach(x => {
      const post = new THREE.Mesh(this.geo.lowPost, this.materials.barrierPost);
      post.position.set(x, 0.5, 0);
      post.castShadow = true;
      group.add(post);

      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), this.materials.warningLightAmber);
      lamp.position.set(x, 1.05, 0);
      group.add(lamp);
    });

    group.hitbox = new THREE.Box3();
    group.obstacleType = 'LOW_BARRIER';
    return group;
  }

  createHighBarrierMesh() {
    const group = new THREE.Group();

    // High Overhead Barrier (Slide Under!)
    const bar = new THREE.Mesh(this.geo.highBar, this.materials.hazardChevrons);
    bar.position.y = 2.15;
    bar.castShadow = true;
    group.add(bar);

    // Hazard Red Stripes
    [-0.7, 0.7].forEach(x => {
      const redPart = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.58, 0.38), this.materials.barrierRedWhite);
      redPart.position.set(x, 2.15, 0);
      group.add(redPart);
    });

    // Tall support posts
    [-1.3, 1.3].forEach(x => {
      const post = new THREE.Mesh(this.geo.highPost, this.materials.barrierPost);
      post.position.set(x, 1.25, 0);
      post.castShadow = true;
      group.add(post);
    });

    group.hitbox = new THREE.Box3();
    group.obstacleType = 'HIGH_BARRIER';
    return group;
  }

  createBlockerMesh() {
    const group = new THREE.Group();

    // Red/White Railway Track Buffer Stop
    const block = new THREE.Mesh(this.geo.blockerBody, this.materials.barrierRedWhite);
    block.position.y = 0.65;
    block.castShadow = true;
    group.add(block);

    const whitePart = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.22, 0.82), this.materials.whiteStripe);
    whitePart.position.set(0, 0.65, 0);
    group.add(whitePart);

    // Large Rubber Buffer Discs
    [-0.65, 0.65].forEach(x => {
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.15, 12), this.materials.trainChassis);
      disc.rotation.x = Math.PI / 2;
      disc.position.set(x, 0.7, 0.42);
      group.add(disc);
    });

    group.hitbox = new THREE.Box3();
    group.obstacleType = 'BLOCKER';
    return group;
  }

  // --- Spawning Logic ---

  spawnChunkObstacles(chunkCenterZ, currentSpeed, runTime = 10, runDistance = 500, playerZ = 0) {
    // 1. Strict 5-Second Grace Period Check
    // If run time is under 5 seconds or distance traveled is under 160m, NO dangerous obstacles!
    if (runTime < 5.0 || runDistance < 160) {
      return;
    }

    // 2. Safe distance ahead check: Never spawn an obstacle closer than 60m ahead of player
    if (chunkCenterZ > playerZ - 60) {
      return;
    }

    // 3. Spawn a single well-spaced fair pattern per chunk
    this.generateFairPattern(chunkCenterZ, currentSpeed, runDistance);
  }

  generateFairPattern(targetZ, currentSpeed, runDistance) {
    // STAGE 1: Easy Introduction (160m - 450m)
    // Only a SINGLE obstacle in ONE lane, leaving 2 entire lanes completely open!
    if (runDistance < 450) {
      const lane = Math.floor(Math.random() * 3);
      if (Math.random() > 0.5) {
        this.spawnLowBarrier(lane, targetZ);
      } else {
        this.spawnBlocker(lane, targetZ);
      }
      return;
    }

    // STAGE 2: Mild (450m - 850m)
    // Single stationary train with ramp in 1 lane, or single high barrier, or 1 hurdle
    if (runDistance < 850) {
      const mode = Math.floor(Math.random() * 3);
      const lane = Math.floor(Math.random() * 3);
      if (mode === 0) {
        this.spawnTrain(lane, targetZ, false, 'FREIGHT', 0, true); // Freight train WITH incline ramp!
      } else if (mode === 1) {
        this.spawnLowBarrier(lane, targetZ);
      } else {
        this.spawnHighBarrier(lane, targetZ);
      }
      return;
    }

    // STAGE 3: Medium (850m - 1400m)
    // 2-lane challenges guaranteed to have at least 1 open lane or jumpable hurdle
    if (runDistance < 1400) {
      const patternType = Math.floor(Math.random() * 4);
      const freeLane = Math.floor(Math.random() * 3);
      const laneA = (freeLane + 1) % 3;
      const laneB = (freeLane + 2) % 3;

      if (patternType === 0) {
        // Train in lane A with ramp, hurdle in lane B, freeLane open
        this.spawnTrain(laneA, targetZ, false, 'FREIGHT', 0, true);
        this.spawnLowBarrier(laneB, targetZ);
      } else if (patternType === 1) {
        // High barrier (slide) in lane A, low barrier (jump) in lane B, freeLane open
        this.spawnHighBarrier(laneA, targetZ);
        this.spawnLowBarrier(laneB, targetZ);
      } else if (patternType === 2) {
        // Metro train in lane A, lane B blocker, freeLane open
        this.spawnTrain(laneA, targetZ, false, 'METRO');
        this.spawnBlocker(laneB, targetZ);
      } else {
        // Moving train in lane A (far ahead), lane B and freeLane open
        this.spawnTrain(laneA, targetZ - 25, true, 'METRO', 20.0);
        this.spawnLowBarrier(laneB, targetZ);
      }
      return;
    }

    // STAGE 4: High Speed & Advanced (1400m+)
    // Guaranteed fair combinations
    const freeLane = Math.floor(Math.random() * 3);
    const laneA = (freeLane + 1) % 3;
    const laneB = (freeLane + 2) % 3;
    const pType = Math.floor(Math.random() * 4);

    if (pType === 0) {
      this.spawnTrain(laneA, targetZ, false, 'FREIGHT', 0, true);
      this.spawnTrain(laneB, targetZ, false, 'METRO');
    } else if (pType === 1) {
      this.spawnTrain(laneA, targetZ - 30, true, 'METRO', 22.0);
      this.spawnHighBarrier(laneB, targetZ);
    } else if (pType === 2) {
      this.spawnHighBarrier(laneA, targetZ);
      this.spawnLowBarrier(laneB, targetZ);
    } else {
      this.spawnTrain(laneA, targetZ, false, 'FREIGHT', 0, true);
      this.spawnBlocker(laneB, targetZ);
    }
  }

  spawnTrain(laneIndex, zPos, isMoving = false, style = 'FREIGHT', trainSpeed = 18.0, hasRamp = false) {
    let train;
    if (style === 'METRO') {
      train = this.pool.trains.pop() || this.createMetroTrainMesh();
    } else {
      const withRamp = !isMoving && (hasRamp || Math.random() > 0.4);
      train = this.createFreightTrainMesh(withRamp);
    }
    train.position.set(LANES[laneIndex], 0, zPos);
    train.isMoving = isMoving;
    train.speed = trainSpeed;
    train.lane = laneIndex;
    this.scene.add(train);
    this.activeObstacles.push(train);

    if (isMoving) {
      audioManager.playTrainHorn();
    }
    return train;
  }

  spawnLowBarrier(laneIndex, zPos) {
    let bar = this.pool.lowBarriers.pop();
    if (!bar) {
      bar = this.createLowBarrierMesh();
    }
    bar.position.set(LANES[laneIndex], 0, zPos);
    bar.lane = laneIndex;
    this.scene.add(bar);
    this.activeObstacles.push(bar);
  }

  spawnHighBarrier(laneIndex, zPos) {
    let bar = this.pool.highBarriers.pop();
    if (!bar) {
      bar = this.createHighBarrierMesh();
    }
    bar.position.set(LANES[laneIndex], 0, zPos);
    bar.lane = laneIndex;
    this.scene.add(bar);
    this.activeObstacles.push(bar);
  }

  spawnBlocker(laneIndex, zPos) {
    let blk = this.pool.blockers.pop();
    if (!blk) {
      blk = this.createBlockerMesh();
    }
    blk.position.set(LANES[laneIndex], 0, zPos);
    blk.lane = laneIndex;
    this.scene.add(blk);
    this.activeObstacles.push(blk);
  }

  update(delta, playerZ) {
    for (let i = this.activeObstacles.length - 1; i >= 0; i--) {
      const obs = this.activeObstacles[i];

      if (obs.isMoving) {
        obs.position.z += obs.speed * delta;
      }

      this.updateObstacleHitbox(obs);

      if (obs.position.z > playerZ + 40) {
        this.recycleObstacle(obs, i);
      }
    }
  }

  updateObstacleHitbox(obs) {
    const pos = obs.position;
    switch (obs.obstacleType) {
      case 'TRAIN':
        if (obs.hasRamp) {
          obs.hitbox.min.set(pos.x - 1.15, 0, pos.z - 9.8);
          obs.hitbox.max.set(pos.x + 1.15, 3.2, pos.z + 8.5);
        } else {
          obs.hitbox.min.set(pos.x - 1.15, 0, pos.z - 9.8);
          obs.hitbox.max.set(pos.x + 1.15, 3.2, pos.z + 9.8);
        }
        break;
      case 'LOW_BARRIER':
        obs.hitbox.min.set(pos.x - 1.35, 0, pos.z - 0.25);
        obs.hitbox.max.set(pos.x + 1.35, 0.95, pos.z + 0.25);
        break;
      case 'HIGH_BARRIER':
        obs.hitbox.min.set(pos.x - 1.35, 1.25, pos.z - 0.25);
        obs.hitbox.max.set(pos.x + 1.35, 2.4, pos.z + 0.25);
        break;
      case 'BLOCKER':
        obs.hitbox.min.set(pos.x - 1.2, 0, pos.z - 0.4);
        obs.hitbox.max.set(pos.x + 1.2, 1.3, pos.z + 0.4);
        break;
    }
  }

  recycleObstacle(obs, index) {
    this.scene.remove(obs);
    this.activeObstacles.splice(index, 1);

    switch (obs.obstacleType) {
      case 'TRAIN':
        obs.isMoving = false;
        this.pool.trains.push(obs);
        break;
      case 'LOW_BARRIER':
        this.pool.lowBarriers.push(obs);
        break;
      case 'HIGH_BARRIER':
        this.pool.highBarriers.push(obs);
        break;
      case 'BLOCKER':
        this.pool.blockers.push(obs);
        break;
    }
  }

  clear() {
    this.activeObstacles.forEach(obs => {
      this.scene.remove(obs);
    });
    this.activeObstacles = [];
  }
}
