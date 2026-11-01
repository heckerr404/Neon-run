import * as THREE from 'three';

export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
    this.pool = [];
    this.maxParticles = 300;

    // Shared geometry and materials
    this.boxGeo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
    this.materials = {
      gold: new THREE.MeshBasicMaterial({ color: 0xffe600 }),
      cyan: new THREE.MeshBasicMaterial({ color: 0x00f3ff }),
      pink: new THREE.MeshBasicMaterial({ color: 0xff0055 }),
      fire: new THREE.MeshBasicMaterial({ color: 0xff5500 }),
      white: new THREE.MeshBasicMaterial({ color: 0xffffff })
    };
  }

  getParticle(mat) {
    let p = this.pool.pop();
    if (!p) {
      p = new THREE.Mesh(this.boxGeo, mat);
    } else {
      p.material = mat;
    }
    p.visible = true;
    p.scale.set(1, 1, 1);
    this.scene.add(p);
    return p;
  }

  recycleParticle(p, index) {
    this.scene.remove(p);
    this.particles.splice(index, 1);
    this.pool.push(p);
  }

  spawnCoinBurst(position) {
    const count = 12;
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;
      const p = this.getParticle(this.materials.gold);
      p.position.copy(position);

      const angle = (i / count) * Math.PI * 2;
      const speed = 3.0 + Math.random() * 4.0;
      p.velocity = new THREE.Vector3(
        Math.cos(angle) * speed,
        Math.sin(angle) * speed + 2.0,
        (Math.random() - 0.5) * 4.0
      );
      p.life = 0.5;
      p.maxLife = 0.5;
      this.particles.push(p);
    }
  }

  spawnJumpSparks(position) {
    const count = 8;
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;
      const p = this.getParticle(this.materials.cyan);
      p.position.set(
        position.x + (Math.random() - 0.5) * 0.4,
        position.y + 0.1,
        position.z + (Math.random() - 0.5) * 0.4
      );

      p.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 4.0,
        Math.random() * 2.5 + 1.0,
        (Math.random() - 0.5) * 4.0
      );
      p.life = 0.35;
      p.maxLife = 0.35;
      this.particles.push(p);
    }
  }

  spawnSlideSparks(position) {
    const count = 3;
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;
      const p = this.getParticle(this.materials.fire);
      p.position.set(
        position.x + (Math.random() - 0.5) * 0.6,
        position.y + 0.05,
        position.z + 0.5 + Math.random() * 0.4
      );

      p.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 2.0,
        Math.random() * 2.0,
        Math.random() * 4.0 + 2.0
      );
      p.life = 0.25;
      p.maxLife = 0.25;
      this.particles.push(p);
    }
  }

  spawnJetpackExhaust(position) {
    const count = 4;
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;
      const mat = Math.random() > 0.4 ? this.materials.fire : this.materials.white;
      const p = this.getParticle(mat);
      p.position.set(
        position.x + (Math.random() - 0.5) * 0.4,
        position.y + 0.5,
        position.z + 0.6
      );

      p.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 1.5,
        -Math.random() * 3.0 - 2.0,
        Math.random() * 5.0 + 8.0
      );
      p.life = 0.3;
      p.maxLife = 0.3;
      this.particles.push(p);
    }
  }

  spawnShieldShatter(position) {
    const count = 24;
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;
      const p = this.getParticle(this.materials.cyan);
      p.position.set(position.x, position.y + 0.9, position.z);

      const phi = Math.random() * Math.PI * 2;
      const costheta = Math.random() * 2 - 1;
      const u = Math.random();
      const theta = Math.acos(costheta);
      const r = 5.0 + Math.random() * 5.0;

      p.velocity = new THREE.Vector3(
        r * Math.sin(theta) * Math.cos(phi),
        r * Math.sin(theta) * Math.sin(phi),
        r * Math.cos(theta)
      );
      p.life = 0.6;
      p.maxLife = 0.6;
      this.particles.push(p);
    }
  }

  spawnCrashExplosion(position) {
    const count = 40;
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;
      const mat = i % 2 === 0 ? this.materials.pink : this.materials.fire;
      const p = this.getParticle(mat);
      p.position.set(position.x, position.y + 1.0, position.z);

      p.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 12.0,
        Math.random() * 10.0 + 2.0,
        (Math.random() - 0.5) * 12.0
      );
      p.life = 0.8;
      p.maxLife = 0.8;
      this.particles.push(p);
    }
  }

  update(delta) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= delta;

      if (p.life <= 0) {
        this.recycleParticle(p, i);
        continue;
      }

      // Physics update
      p.position.addScaledVector(p.velocity, delta);
      p.velocity.y -= 9.8 * delta; // Gravity on particles

      // Scale down over life
      const ratio = p.life / p.maxLife;
      p.scale.set(ratio, ratio, ratio);
    }
  }

  clear() {
    this.particles.forEach(p => this.scene.remove(p));
    this.particles = [];
  }
}
