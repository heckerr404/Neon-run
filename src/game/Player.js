import * as THREE from 'three';
import { createCharacterModel, CHARACTER_DEFINITIONS } from './CharacterModels.js';
import { audioManager } from './AudioManager.js';

export const LANES = [-3.2, 0.0, 3.2];

export class Player {
  constructor(scene, characterId = 'dash') {
    this.scene = scene;
    this.currentSkinId = characterId;

    // Movement state
    this.currentLane = 1; // 0 = Left, 1 = Center, 2 = Right
    this.targetLane = 1;
    this.position = new THREE.Vector3(0, 0, 0);

    // Physics
    this.verticalVelocity = 0;
    this.gravity = -34;
    this.jumpForce = 12.2;
    this.superJumpForce = 18.0;
    this.isGrounded = true;
    this.groundY = 0; // Can be 0 or elevated (train roof)

    // Actions & Timers
    this.isSliding = false;
    this.slideTimer = 0;
    this.slideDuration = 0.8;

    this.isJumping = false;
    this.isJetpacking = false;
    this.jetpackHeight = 7.5;
    this.hasSuperJump = false;
    this.hasShield = false;

    // Hoverboard system
    this.isHoverboarding = false;
    this.hoverboardTimer = 0;
    this.hoverboardDuration = 25.0;

    // Animation variables
    this.runAnimTime = 0;
    this.rollAngle = 0; // Lateral banking
    this.landingSquash = 1.0;

    // Hitbox for collision system
    this.hitbox = new THREE.Box3();
    this.hitboxSize = new THREE.Vector3(0.9, 1.8, 0.9);

    // Build 3D mesh
    this.buildCharacter(this.currentSkinId);
    this.buildHoverboard();
    this.buildHandMagnet();
  }

  buildHandMagnet() {
    this.handMagnet = new THREE.Group();

    // Red Horseshoe Curve
    const curveGeo = new THREE.TorusGeometry(0.24, 0.065, 8, 16, Math.PI);
    const redMat = new THREE.MeshStandardMaterial({
      color: 0xdc2626,
      roughness: 0.3,
      metalness: 0.7
    });
    const horseshoe = new THREE.Mesh(curveGeo, redMat);
    horseshoe.rotation.z = Math.PI;
    this.handMagnet.add(horseshoe);

    // Golden Tips
    const tipGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.12, 10);
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      roughness: 0.2,
      metalness: 0.9,
      emissive: 0xd97706,
      emissiveIntensity: 0.4
    });

    [-0.24, 0.24].forEach(x => {
      const tip = new THREE.Mesh(tipGeo, goldMat);
      tip.position.set(x, 0.06, 0);
      this.handMagnet.add(tip);
    });

    // Position in front of the runner, held with hands
    this.handMagnet.position.set(0.22, 0.45, 0.42);
    this.handMagnet.rotation.set(-0.35, 0.2, -0.15);
    this.handMagnet.visible = false;
    this.rig.bodyRoot.add(this.handMagnet);
  }

  setMagnet(active) {
    this.hasMagnet = active;
    if (this.handMagnet) {
      this.handMagnet.visible = active;
    }
  }

  buildHoverboard() {
    this.hoverboardMesh = new THREE.Group();

    // Deck
    const deckGeo = new THREE.BoxGeometry(0.6, 0.08, 1.6);
    const deckMat = new THREE.MeshStandardMaterial({
      color: 0xdd1133,
      roughness: 0.25,
      metalness: 0.75
    });
    const deck = new THREE.Mesh(deckGeo, deckMat);
    deck.castShadow = true;
    this.hoverboardMesh.add(deck);

    // Glowing rim
    const rimGeo = new THREE.BoxGeometry(0.64, 0.04, 1.64);
    const rimMat = new THREE.MeshBasicMaterial({ color: 0xffea00 });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    this.hoverboardMesh.add(rim);

    // Twin thrusters
    [-0.18, 0.18].forEach(x => {
      const cyGeo = new THREE.CylinderGeometry(0.08, 0.1, 0.16, 8);
      const cyMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8 });
      const cy = new THREE.Mesh(cyGeo, cyMat);
      cy.position.set(x, -0.08, -0.55);
      this.hoverboardMesh.add(cy);

      const flameGeo = new THREE.ConeGeometry(0.1, 0.35, 8);
      flameGeo.rotateX(Math.PI);
      const flameMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff });
      const flame = new THREE.Mesh(flameGeo, flameMat);
      flame.position.set(x, -0.22, -0.65);
      flame.name = `board-flame-${x > 0 ? 'r' : 'l'}`;
      this.hoverboardMesh.add(flame);
    });

    this.hoverboardMesh.position.y = 0.06;
    this.hoverboardMesh.visible = false;
    this.rig.root.add(this.hoverboardMesh);
  }

  activateHoverboard() {
    this.isHoverboarding = true;
    this.hoverboardTimer = this.hoverboardDuration;
    if (this.hoverboardMesh) {
      this.hoverboardMesh.visible = true;
    }
    audioManager.playPowerUp();
  }

  consumeHoverboard() {
    if (this.isHoverboarding) {
      this.isHoverboarding = false;
      this.hoverboardTimer = 0;
      if (this.hoverboardMesh) {
        this.hoverboardMesh.visible = false;
      }
      audioManager.playShieldHit();
      return true;
    }
    return false;
  }

  buildCharacter(skinId) {
    if (this.rig && this.rig.root) {
      this.scene.remove(this.rig.root);
    }
    this.currentSkinId = skinId;
    this.rig = createCharacterModel(skinId);
    this.scene.add(this.rig.root);
    this.buildHoverboard();
    this.buildHandMagnet();
    this.updateHitbox();
  }

  changeSkin(skinId) {
    this.buildCharacter(skinId);
  }

  reset() {
    this.currentLane = 1;
    this.targetLane = 1;
    this.position.set(0, 0, 0);
    this.verticalVelocity = 0;
    this.isGrounded = true;
    this.groundY = 0;
    this.isSliding = false;
    this.slideTimer = 0;
    this.isJumping = false;
    this.isJetpacking = false;
    this.hasSuperJump = false;
    this.hasShield = false;
    this.isHoverboarding = false;
    this.hoverboardTimer = 0;
    this.setMagnet(false);
    this.runAnimTime = 0;
    this.rollAngle = 0;
    this.landingSquash = 1.0;

    if (this.hoverboardMesh) {
      this.hoverboardMesh.visible = false;
    }

    if (this.rig && this.rig.root) {
      this.rig.root.position.set(0, 0, 0);
      this.rig.root.rotation.set(0, 0, 0);
      this.rig.bodyRoot.position.set(0, 1.0, 0);
      this.rig.bodyRoot.rotation.set(0, 0, 0);
      if (this.rig.shield) {
        this.rig.shield.material.opacity = 0;
      }
    }
    this.updateHitbox();
  }

  moveLeft() {
    if (this.targetLane > 0) {
      this.targetLane--;
      audioManager.playSlide();
    }
  }

  moveRight() {
    if (this.targetLane < 2) {
      this.targetLane++;
      audioManager.playSlide();
    }
  }

  jump() {
    if (this.isJetpacking) return;

    if (this.isGrounded) {
      // Cancel slide if jumping
      this.isSliding = false;
      this.slideTimer = 0;

      const force = this.hasSuperJump ? this.superJumpForce : this.jumpForce;
      this.verticalVelocity = force;
      this.isGrounded = false;
      this.isJumping = true;

      if (this.hasSuperJump) {
        audioManager.playSuperJump();
      } else {
        audioManager.playJump();
      }
    }
  }

  slide() {
    if (this.isJetpacking) return;

    if (!this.isGrounded) {
      // Fast fall / dive mechanic
      this.verticalVelocity = -22;
      this.isSliding = true;
      this.slideTimer = this.slideDuration;
      audioManager.playSlide();
      return;
    }

    if (!this.isSliding) {
      this.isSliding = true;
      this.slideTimer = this.slideDuration;
      audioManager.playSlide();
    }
  }

  setShield(active) {
    this.hasShield = active;
    if (this.rig && this.rig.shield) {
      this.rig.shield.material.opacity = active ? 0.75 : 0;
    }
  }

  setSuperJump(active) {
    this.hasSuperJump = active;
  }

  setJetpack(active) {
    this.isJetpacking = active;
    if (!active) {
      this.verticalVelocity = 0;
    }
  }

  update(delta, gameSpeed) {
    // 1. Horizontal Lane Transition
    const targetX = LANES[this.targetLane];
    const prevX = this.position.x;
    this.position.x += (targetX - this.position.x) * Math.min(1.0, delta * 15);

    // Lateral banking tilt
    const xVel = (this.position.x - prevX) / Math.max(0.001, delta);
    const targetRoll = -xVel * 0.04;
    this.rollAngle += (targetRoll - this.rollAngle) * Math.min(1.0, delta * 10);

    // 2. Vertical Physics (Jumping / Jetpack / Gravity)
    if (this.isJetpacking) {
      // Smoothly hover up to jetpack altitude
      this.position.y += (this.jetpackHeight - this.position.y) * Math.min(1.0, delta * 4);
      this.isGrounded = false;
      this.isJumping = false;
      this.isSliding = false;
    } else {
      // Normal Gravity
      this.verticalVelocity += this.gravity * delta;
      this.position.y += this.verticalVelocity * delta;

      if (this.position.y <= this.groundY) {
        if (!this.isGrounded && this.verticalVelocity < -2) {
          audioManager.playLand();
          this.landingSquash = 0.85; // Compression squash
        }
        this.position.y = this.groundY;
        this.verticalVelocity = 0;
        this.isGrounded = true;
        this.isJumping = false;
      } else {
        this.isGrounded = false;
      }
    }

    // Landing squash recovery
    if (this.landingSquash < 1.0) {
      this.landingSquash += delta * 2.5;
      if (this.landingSquash > 1.0) this.landingSquash = 1.0;
    }

    // 3. Slide Timer
    if (this.isSliding) {
      this.slideTimer -= delta;
      if (this.slideTimer <= 0) {
        this.isSliding = false;
      }
    }

    // Hoverboard Timer
    if (this.isHoverboarding) {
      this.hoverboardTimer -= delta;
      if (this.hoverboardTimer <= 0) {
        this.consumeHoverboard();
      }
    }

    // 4. Update 3D Transformations
    this.rig.root.position.set(this.position.x, this.position.y, this.position.z);
    this.rig.root.rotation.z = this.rollAngle;

    // 5. Procedural Articulated Animation
    this.animateRigs(delta, gameSpeed);

    // 6. Shield pulsation
    if (this.hasShield && this.rig.shield) {
      const pulse = 0.65 + Math.sin(performance.now() * 0.008) * 0.15;
      this.rig.shield.material.opacity = pulse;
      this.rig.shield.rotation.y += delta * 1.5;
    }

    // 7. Hitbox Update
    this.updateHitbox();
  }

  animateRigs(delta, gameSpeed) {
    const {
      bodyRoot,
      torso,
      leftArmGroup,
      rightArmGroup,
      leftForearmGroup,
      rightForearmGroup,
      leftLegGroup,
      rightLegGroup,
      leftKneeGroup,
      rightKneeGroup
    } = this.rig;

    if (this.isJetpacking) {
      // Flight Pose: Body tilted forward 45 deg, legs back, arms trailing
      bodyRoot.position.y = 1.0;
      bodyRoot.rotation.x = 0.8;
      bodyRoot.scale.set(1, 1, 1);

      leftLegGroup.rotation.x = -0.3;
      rightLegGroup.rotation.x = -0.3;
      leftKneeGroup.rotation.x = 0.2;
      rightKneeGroup.rotation.x = 0.2;

      leftArmGroup.rotation.x = -0.6;
      rightArmGroup.rotation.x = -0.6;
      leftForearmGroup.rotation.x = -0.3;
      rightForearmGroup.rotation.x = -0.3;

      // Thruster flame scales
      const flameL = this.rig.root.getObjectByName('thruster-flame-l');
      const flameR = this.rig.root.getObjectByName('thruster-flame-r');
      const flameScale = 1.0 + Math.sin(performance.now() * 0.03) * 0.3;
      if (flameL) flameL.scale.set(1.2, flameScale * 2.2, 1.2);
      if (flameR) flameR.scale.set(1.2, flameScale * 2.2, 1.2);
      return;
    }

    // Reset thruster flames if not jetpacking
    const flameL = this.rig.root.getObjectByName('thruster-flame-l');
    const flameR = this.rig.root.getObjectByName('thruster-flame-r');
    if (flameL) flameL.scale.set(0.1, 0.1, 0.1);
    if (flameR) flameR.scale.set(0.1, 0.1, 0.1);

    if (this.isSliding) {
      // Slide Pose: Lower torso down, lean back, slide legs forward
      bodyRoot.position.y = 0.45;
      bodyRoot.rotation.x = -0.6;
      bodyRoot.scale.set(1, 0.7, 1);

      leftLegGroup.rotation.x = -1.2;
      rightLegGroup.rotation.x = -1.0;
      leftKneeGroup.rotation.x = 0.2;
      rightKneeGroup.rotation.x = 0.3;

      leftArmGroup.rotation.x = 0.6;
      rightArmGroup.rotation.x = 0.6;
      leftForearmGroup.rotation.x = 0.4;
      rightForearmGroup.rotation.x = 0.4;
      return;
    }

    if (this.isJumping) {
      // Jump Pose: Aerodynamic tuck
      bodyRoot.position.y = 1.0;
      bodyRoot.rotation.x = 0.2;
      bodyRoot.scale.set(1, 1, 1);

      leftLegGroup.rotation.x = 0.9;
      rightLegGroup.rotation.x = 0.7;
      leftKneeGroup.rotation.x = 0.8;
      rightKneeGroup.rotation.x = 0.9;

      leftArmGroup.rotation.x = -0.8;
      rightArmGroup.rotation.x = -0.8;
      leftForearmGroup.rotation.x = -0.4;
      rightForearmGroup.rotation.x = -0.4;
      return;
    }

    if (this.isHoverboarding) {
      // Surfing Pose on Hoverboard
      bodyRoot.position.y = 1.08;
      bodyRoot.rotation.x = 0.05;
      bodyRoot.rotation.y = 0.42; // Surfer side-angle
      bodyRoot.scale.set(1, 1, 1);

      leftLegGroup.rotation.x = -0.35;
      rightLegGroup.rotation.x = 0.35;
      leftKneeGroup.rotation.x = 0.45;
      rightKneeGroup.rotation.x = 0.4;

      leftArmGroup.rotation.x = 0.6;
      leftArmGroup.rotation.z = -0.3;
      rightArmGroup.rotation.x = -0.5;
      rightArmGroup.rotation.z = 0.3;

      const boardFlameL = this.rig.root.getObjectByName('board-flame-l');
      const boardFlameR = this.rig.root.getObjectByName('board-flame-r');
      const fScale = 1.0 + Math.sin(performance.now() * 0.02) * 0.25;
      if (boardFlameL) boardFlameL.scale.set(1, fScale, 1);
      if (boardFlameR) boardFlameR.scale.set(1, fScale, 1);
      return;
    }

    // Reset bodyRoot Y rotation if not hoverboarding
    bodyRoot.rotation.y = 0;

    // Running Cycle
    const runFreq = Math.max(9.0, gameSpeed * 0.45);
    this.runAnimTime += delta * runFreq;

    const armSwing = Math.sin(this.runAnimTime) * 0.8;
    const legSwing = Math.sin(this.runAnimTime) * 0.9;
    const verticalBounce = Math.abs(Math.sin(this.runAnimTime * 2)) * 0.12;

    bodyRoot.position.y = 1.0 + verticalBounce;
    bodyRoot.rotation.x = 0.15; // Forward athletic lean
    bodyRoot.scale.set(1, this.landingSquash, 1);

    // Alternate arms
    leftArmGroup.rotation.x = armSwing;
    rightArmGroup.rotation.x = -armSwing;
    leftForearmGroup.rotation.x = 0.5 + Math.max(0, -armSwing * 0.4);
    rightForearmGroup.rotation.x = 0.5 + Math.max(0, armSwing * 0.4);

    // Alternate legs with knee bending
    leftLegGroup.rotation.x = -legSwing;
    rightLegGroup.rotation.x = legSwing;

    leftKneeGroup.rotation.x = Math.max(0, legSwing * 1.1);
    rightKneeGroup.rotation.x = Math.max(0, -legSwing * 1.1);
  }

  updateHitbox() {
    if (this.isSliding) {
      // Low profile hitbox for sliding under overhead obstacles
      this.hitboxSize.set(0.85, 0.65, 1.4);
      const center = new THREE.Vector3(this.position.x, this.position.y + 0.35, this.position.z);
      this.hitbox.setFromCenterAndSize(center, this.hitboxSize);
    } else {
      // Normal standing/jumping hitbox
      this.hitboxSize.set(0.8, 1.8, 0.8);
      const center = new THREE.Vector3(this.position.x, this.position.y + 0.95, this.position.z);
      this.hitbox.setFromCenterAndSize(center, this.hitboxSize);
    }
  }
}
