import * as THREE from 'three';

export const THEME_DEFINITIONS = [
  {
    id: 'tokyo_city',
    name: 'URBAN SUBWAY',
    desc: 'Vibrant daytime railway trench with colorful city facades, graffiti walls, and scaffolding.',
    price: 0,
    unlocked: true,
    skyColor: 0x5bb0ea,
    fogColor: 0xa0d4f7,
    groundColor: 0x5a524b,
    sleeperColor: 0x7c4328,
    wallColor: 0x6e7888,
    sunColor: 0xfffaed,
    sunIntensity: 2.0,
    ambientColor: 0xbde0fe,
    ambientGround: 0xd8c8b4,
    ambientIntensity: 1.1
  },
  {
    id: 'sunset_city',
    name: 'SUNSET METRO',
    desc: 'Warm golden hour sun rays bathing the railway in amber and rose hues.',
    price: 500,
    unlocked: false,
    skyColor: 0x4a1e4e,
    fogColor: 0xd97757,
    groundColor: 0x4a3b32,
    sleeperColor: 0x61301e,
    wallColor: 0x5a4a58,
    sunColor: 0xffaa55,
    sunIntensity: 2.2,
    ambientColor: 0xfda4af,
    ambientGround: 0x854d38,
    ambientIntensity: 1.0
  },
  {
    id: 'miami_beach',
    name: 'COASTAL TRANSIT',
    desc: 'Sunny tropical coastal line with pastel art-deco facades and teal skies.',
    price: 1000,
    unlocked: false,
    skyColor: 0x38bdf8,
    fogColor: 0xbae6fd,
    groundColor: 0xd6cbb8,
    sleeperColor: 0x854d0e,
    wallColor: 0x94a3b8,
    sunColor: 0xffffff,
    sunIntensity: 2.2,
    ambientColor: 0x7dd3fc,
    ambientGround: 0xfef08a,
    ambientIntensity: 1.2
  },
  {
    id: 'neon_city',
    name: 'NEON MIDNIGHT',
    desc: 'Classic rainy midnight Tokyo with glowing holographic billboards.',
    price: 1800,
    unlocked: false,
    skyColor: 0x0f172a,
    fogColor: 0x1e1b4b,
    groundColor: 0x1e293b,
    sleeperColor: 0x334155,
    wallColor: 0x1e293b,
    sunColor: 0x38bdf8,
    sunIntensity: 1.4,
    ambientColor: 0x818cf8,
    ambientGround: 0x0f172a,
    ambientIntensity: 0.9
  }
];

export class Environment {
  constructor(scene, themeId = 'tokyo_city') {
    this.scene = scene;
    this.currentThemeId = themeId;
    this.theme = THEME_DEFINITIONS.find(t => t.id === themeId) || THEME_DEFINITIONS[0];

    // Dummy helper for InstancedMesh transforms
    this.dummy = new THREE.Object3D();

    this.initSharedAssets();
    this.setupLighting();
  }

  initSharedAssets() {
    const { groundColor, sleeperColor, wallColor } = this.theme;

    // Rich Stylized Materials (Cached and Reused)
    this.materials = {
      ground: new THREE.MeshStandardMaterial({
        color: groundColor,
        roughness: 0.9,
        metalness: 0.05
      }),
      woodenSleeper: new THREE.MeshStandardMaterial({
        color: sleeperColor,
        roughness: 0.85,
        metalness: 0.1
      }),
      steelRail: new THREE.MeshStandardMaterial({
        color: 0xd1d5db, // Shiny silver steel
        roughness: 0.25,
        metalness: 0.9
      }),
      steelBase: new THREE.MeshStandardMaterial({
        color: 0x475569,
        roughness: 0.6,
        metalness: 0.8
      }),
      trenchWall: new THREE.MeshStandardMaterial({
        color: wallColor,
        roughness: 0.75,
        metalness: 0.15
      }),
      trenchCap: new THREE.MeshStandardMaterial({
        color: 0x334155,
        roughness: 0.6,
        metalness: 0.3
      }),
      waterCanal: new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        roughness: 0.15,
        metalness: 0.75
      }),
      treeFoliage: new THREE.MeshStandardMaterial({
        color: 0x65a30d,
        roughness: 0.7,
        metalness: 0.05
      }),
      treeTrunk: new THREE.MeshStandardMaterial({
        color: 0x78350f,
        roughness: 0.85,
        metalness: 0.1
      }),
      scaffoldYellow: new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        roughness: 0.4,
        metalness: 0.6
      }),
      woodPlank: new THREE.MeshStandardMaterial({
        color: 0xb45309,
        roughness: 0.8,
        metalness: 0.05
      }),
      metalGrate: new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        roughness: 0.3,
        metalness: 0.85
      }),
      // Colorful Building Facades
      buildingRed: new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.65 }),
      buildingYellow: new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.6 }),
      buildingBlue: new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.6 }),
      buildingOrange: new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.65 }),
      buildingTeal: new THREE.MeshStandardMaterial({ color: 0x14b8a6, roughness: 0.6 }),
      buildingCream: new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.7 }),
      windowFrame: new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 }),
      windowGlass: new THREE.MeshStandardMaterial({ color: 0x93c5fd, roughness: 0.1, metalness: 0.9 }),
      awningRed: new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.7 }),
      chineseSign: new THREE.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.5, emissive: 0x881337, emissiveIntensity: 0.3 })
    };

    // Shared Geometries
    this.geometries = {
      ground: new THREE.PlaneGeometry(36, 60),
      sleeper: new THREE.BoxGeometry(7.2, 0.16, 0.45),
      railTop: new THREE.BoxGeometry(0.12, 0.14, 60),
      railBase: new THREE.BoxGeometry(0.18, 0.08, 60),
      grate: new THREE.BoxGeometry(1.6, 0.04, 3.2),
      wall: new THREE.BoxGeometry(2.5, 9.5, 60),
      wallCap: new THREE.BoxGeometry(2.8, 0.4, 60),
      railingPost: new THREE.CylinderGeometry(0.04, 0.04, 1.2, 6),
      railingBar: new THREE.CylinderGeometry(0.03, 0.03, 60, 6),
      canalPlane: new THREE.PlaneGeometry(8, 60),
      treeCanopy: new THREE.SphereGeometry(0.85, 10, 10),
      treeTrunk: new THREE.CylinderGeometry(0.12, 0.16, 1.6, 8),
      scaffoldBeamH: new THREE.BoxGeometry(16.5, 0.45, 0.45),
      scaffoldPost: new THREE.BoxGeometry(0.45, 9.5, 0.45),
      signBoard: new THREE.BoxGeometry(0.1, 4.5, 1.2)
    };
  }

  setupLighting() {
    const { skyColor, fogColor, sunColor, sunIntensity, ambientColor, ambientGround, ambientIntensity } = this.theme;

    // Atmospheric Fog
    this.scene.fog = new THREE.FogExp2(fogColor, 0.0065);
    this.scene.background = new THREE.Color(skyColor);

    // Hemisphere Ambient Lighting
    this.hemiLight = new THREE.HemisphereLight(ambientColor, ambientGround, ambientIntensity);
    this.scene.add(this.hemiLight);

    // Warm Directional Sunlight with Shadows
    this.sunLight = new THREE.DirectionalLight(sunColor, sunIntensity);
    this.sunLight.position.set(24, 45, 20);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 140;
    this.sunLight.shadow.camera.left = -26;
    this.sunLight.shadow.camera.right = 26;
    this.sunLight.shadow.camera.top = 26;
    this.sunLight.shadow.camera.bottom = -26;
    this.sunLight.shadow.bias = -0.0008;
    this.scene.add(this.sunLight);

    this.sunLightTarget = new THREE.Object3D();
    this.scene.add(this.sunLightTarget);
    this.sunLight.target = this.sunLightTarget;
  }

  setTheme(themeId) {
    const newTheme = THEME_DEFINITIONS.find(t => t.id === themeId);
    if (!newTheme) return;

    this.currentThemeId = themeId;
    this.theme = newTheme;

    this.scene.fog.color.setHex(newTheme.fogColor);
    this.scene.background.setHex(newTheme.skyColor);

    this.hemiLight.color.setHex(newTheme.ambientColor);
    this.hemiLight.groundColor.setHex(newTheme.ambientGround);
    this.hemiLight.intensity = newTheme.ambientIntensity;

    this.sunLight.color.setHex(newTheme.sunColor);
    this.sunLight.intensity = newTheme.sunIntensity;

    this.materials.ground.color.setHex(newTheme.groundColor);
    this.materials.woodenSleeper.color.setHex(newTheme.sleeperColor);
    this.materials.trenchWall.color.setHex(newTheme.wallColor);
  }

  updateLightPosition(playerZ) {
    this.sunLight.position.set(24, 42, playerZ - 20);
    this.sunLightTarget.position.set(0, 0, playerZ - 28);
  }

  // Build a modular chunk of length 60 using InstancedMesh for performance
  createTrackChunk(chunkZ) {
    const chunkGroup = new THREE.Group();
    chunkGroup.position.z = chunkZ;

    // 1. Earthy Gravel Ballast Bed
    const ground = new THREE.Mesh(this.geometries.ground, this.materials.ground);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    chunkGroup.add(ground);

    // 2. High-Performance InstancedMesh for 25 Wooden Sleepers (1 draw call instead of 25)
    const sleeperCount = 25;
    const sleepers = new THREE.InstancedMesh(this.geometries.sleeper, this.materials.woodenSleeper, sleeperCount);
    let sIdx = 0;
    for (let z = -28.8; z <= 28.8; z += 2.4) {
      this.dummy.position.set(0, 0.08, z);
      this.dummy.rotation.set(0, 0, 0);
      this.dummy.scale.set(1, 1, 1);
      this.dummy.updateMatrix();
      sleepers.setMatrixAt(sIdx++, this.dummy.matrix);
    }
    sleepers.instanceMatrix.needsUpdate = true;
    sleepers.receiveShadow = true;
    chunkGroup.add(sleepers);

    // 3. Three Pairs of Steel Rails (-3.2, 0.0, +3.2)
    const lanes = [-3.2, 0.0, 3.2];
    lanes.forEach(laneX => {
      [-0.68, 0.68].forEach(railOffset => {
        const xPos = laneX + railOffset;

        const base = new THREE.Mesh(this.geometries.railBase, this.materials.steelBase);
        base.position.set(xPos, 0.12, 0);
        base.receiveShadow = true;
        chunkGroup.add(base);

        const rail = new THREE.Mesh(this.geometries.railTop, this.materials.steelRail);
        rail.position.set(xPos, 0.22, 0);
        rail.castShadow = true;
        rail.receiveShadow = true;
        chunkGroup.add(rail);
      });
    });

    // 4. Metal Drain Grates between tracks
    [-1.6, 1.6].forEach(gx => {
      const grate = new THREE.Mesh(this.geometries.grate, this.materials.metalGrate);
      grate.position.set(gx, 0.06, (Math.random() - 0.5) * 30);
      grate.receiveShadow = true;
      chunkGroup.add(grate);
    });

    // 5. Concrete Retaining Walls
    [-6.8, 6.8].forEach(wx => {
      const wall = new THREE.Mesh(this.geometries.wall, this.materials.trenchWall);
      wall.position.set(wx, 4.75, 0);
      wall.castShadow = true;
      wall.receiveShadow = true;
      chunkGroup.add(wall);

      const cap = new THREE.Mesh(this.geometries.wallCap, this.materials.trenchCap);
      cap.position.set(wx, 9.6, 0);
      cap.castShadow = true;
      chunkGroup.add(cap);

      const railBar = new THREE.Mesh(this.geometries.railingBar, this.materials.steelBase);
      railBar.rotation.x = Math.PI / 2;
      railBar.position.set(wx, 10.6, 0);
      chunkGroup.add(railBar);

      // Posts every 6 units
      for (let z = -27; z <= 27; z += 6) {
        const post = new THREE.Mesh(this.geometries.railingPost, this.materials.steelBase);
        post.position.set(wx, 10.1, z);
        chunkGroup.add(post);
      }

      this.addWallGraffiti(chunkGroup, wx);
    });

    // 6. Canal Promenade & Stylized Trees on Upper Trench Left
    const canal = new THREE.Mesh(this.geometries.canalPlane, this.materials.waterCanal);
    canal.rotation.x = -Math.PI / 2;
    canal.position.set(-11.5, 9.5, 0);
    chunkGroup.add(canal);

    // Trees along canal edge
    [-18, 18].forEach(tz => {
      const treeGroup = new THREE.Group();
      treeGroup.position.set(-9.2, 9.6, tz);

      const trunk = new THREE.Mesh(this.geometries.treeTrunk, this.materials.treeTrunk);
      trunk.position.y = 0.8;
      trunk.castShadow = true;
      treeGroup.add(trunk);

      const leaves = new THREE.Mesh(this.geometries.treeCanopy, this.materials.treeFoliage);
      leaves.position.y = 2.0;
      leaves.scale.set(1, 1.25, 1);
      leaves.castShadow = true;
      treeGroup.add(leaves);

      chunkGroup.add(treeGroup);
    });

    // 7. Overhead Construction Scaffolding / Yellow Steel Trusses
    this.addOverheadScaffolding(chunkGroup);

    // 8. Colorful City Skyline & Facades Sitting on Trench Top
    this.addColorfulCityFacades(chunkGroup);

    return chunkGroup;
  }

  addWallGraffiti(chunkGroup, wallX) {
    const graffitiColors = [0xec4899, 0x06b6d4, 0xfacc15, 0x10b981, 0xef4444, 0x8b5cf6];
    const zOffsets = [-20, 0, 20];

    zOffsets.forEach(z => {
      if (Math.random() > 0.3) {
        const color = graffitiColors[Math.floor(Math.random() * graffitiColors.length)];
        const width = 4.0 + Math.random() * 3.0;
        const height = 2.0 + Math.random() * 2.0;

        const grafMat = new THREE.MeshStandardMaterial({
          color,
          roughness: 0.5,
          emissive: color,
          emissiveIntensity: 0.2
        });

        const decalGeo = new THREE.PlaneGeometry(width, height);
        const decal = new THREE.Mesh(decalGeo, grafMat);

        const xPos = wallX > 0 ? wallX - 1.26 : wallX + 1.26;
        decal.position.set(xPos, 3.5 + Math.random() * 2.0, z);
        decal.rotation.y = wallX > 0 ? -Math.PI / 2 : Math.PI / 2;
        chunkGroup.add(decal);
      }
    });
  }

  addOverheadScaffolding(chunkGroup) {
    const scaffoldGroup = new THREE.Group();
    scaffoldGroup.position.z = 0;

    [-6.2, 6.2].forEach(tx => {
      const tower = new THREE.Mesh(this.geometries.scaffoldPost, this.materials.scaffoldYellow);
      tower.position.set(tx, 4.75, 0);
      tower.castShadow = true;
      scaffoldGroup.add(tower);

      const braceGeo = new THREE.BoxGeometry(0.2, 7.0, 0.2);
      const brace = new THREE.Mesh(braceGeo, this.materials.scaffoldYellow);
      brace.position.set(tx, 4.5, 0);
      brace.rotation.z = tx > 0 ? 0.35 : -0.35;
      scaffoldGroup.add(brace);
    });

    const topBeam = new THREE.Mesh(this.geometries.scaffoldBeamH, this.materials.scaffoldYellow);
    topBeam.position.set(0, 8.5, 0);
    topBeam.castShadow = true;
    scaffoldGroup.add(topBeam);

    const midBeam = new THREE.Mesh(this.geometries.scaffoldBeamH, this.materials.scaffoldYellow);
    midBeam.position.set(0, 9.4, 0);
    midBeam.castShadow = true;
    scaffoldGroup.add(midBeam);

    // Wooden Walkway Planks
    for (let x = -4; x <= 4; x += 1.8) {
      const plankGeo = new THREE.BoxGeometry(1.6, 0.15, 3.8);
      const plank = new THREE.Mesh(plankGeo, this.materials.woodPlank);
      plank.position.set(x, 8.7, 0);
      plank.castShadow = true;
      scaffoldGroup.add(plank);
    }

    // Hanging Construction Lantern / Hoist
    const cableGeo = new THREE.CylinderGeometry(0.03, 0.03, 3.0, 6);
    const cable = new THREE.Mesh(cableGeo, this.materials.steelBase);
    cable.position.set(-1.8, 7.0, 0);
    scaffoldGroup.add(cable);

    const lanternGeo = new THREE.BoxGeometry(0.6, 0.7, 0.6);
    const lanternMat = new THREE.MeshBasicMaterial({ color: 0xfffaed });
    const lantern = new THREE.Mesh(lanternGeo, lanternMat);
    lantern.position.set(-1.8, 5.3, 0);
    scaffoldGroup.add(lantern);

    const sign = new THREE.Mesh(this.geometries.signBoard, this.materials.chineseSign);
    sign.position.set(-5.5, 6.5, 0);
    sign.castShadow = true;
    scaffoldGroup.add(sign);

    chunkGroup.add(scaffoldGroup);
  }

  addColorfulCityFacades(chunkGroup) {
    const facadeMaterials = [
      this.materials.buildingRed,
      this.materials.buildingYellow,
      this.materials.buildingBlue,
      this.materials.buildingOrange,
      this.materials.buildingTeal,
      this.materials.buildingCream
    ];

    // Left Side City Buildings
    [-17, -25].forEach((bx, bIdx) => {
      [-18, 12].forEach((bz, zIdx) => {
        const mat = facadeMaterials[(bIdx * 2 + zIdx) % facadeMaterials.length];
        const width = 10 + Math.random() * 4;
        const height = 24 + Math.random() * 20;
        const depth = 22 + Math.random() * 6;

        const bGeo = new THREE.BoxGeometry(width, height, depth);
        const bMesh = new THREE.Mesh(bGeo, mat);
        bMesh.position.set(bx, 9.5 + height / 2, bz);
        bMesh.castShadow = true;
        bMesh.receiveShadow = true;
        chunkGroup.add(bMesh);

        this.addBuildingWindows(chunkGroup, bx + width / 2 + 0.1, 9.5 + height * 0.4, bz, depth, height);

        if (bIdx === 0 && Math.random() > 0.4) {
          const awningGeo = new THREE.BoxGeometry(1.6, 0.3, 7.0);
          awningGeo.rotateZ(0.2);
          const awning = new THREE.Mesh(awningGeo, this.materials.awningRed);
          awning.position.set(bx + width / 2 + 0.7, 12.5, bz);
          awning.castShadow = true;
          chunkGroup.add(awning);
        }
      });
    });

    // Right Side City Buildings
    [13, 20].forEach((bx, bIdx) => {
      [-12, 18].forEach((bz, zIdx) => {
        const mat = facadeMaterials[(bIdx * 3 + zIdx + 1) % facadeMaterials.length];
        const width = 10 + Math.random() * 4;
        const height = 26 + Math.random() * 20;
        const depth = 22 + Math.random() * 6;

        const bGeo = new THREE.BoxGeometry(width, height, depth);
        const bMesh = new THREE.Mesh(bGeo, mat);
        bMesh.position.set(bx, 9.5 + height / 2, bz);
        bMesh.castShadow = true;
        bMesh.receiveShadow = true;
        chunkGroup.add(bMesh);

        this.addBuildingWindows(chunkGroup, bx - width / 2 - 0.1, 9.5 + height * 0.4, bz, depth, height);

        if (bIdx === 0 && Math.random() > 0.4) {
          const sign = new THREE.Mesh(this.geometries.signBoard, this.materials.chineseSign);
          sign.position.set(bx - width / 2 - 0.8, 15.0, bz);
          sign.castShadow = true;
          chunkGroup.add(sign);
        }
      });
    });
  }

  addBuildingWindows(chunkGroup, faceX, centerY, centerZ, depth, height) {
    for (let y = centerY - 6; y <= centerY + 6; y += 3.2) {
      for (let z = centerZ - depth / 3; z <= centerZ + depth / 3; z += 3.5) {
        const winGeo = new THREE.BoxGeometry(0.12, 1.6, 1.4);
        const win = new THREE.Mesh(winGeo, this.materials.windowGlass);
        win.position.set(faceX, y, z);
        chunkGroup.add(win);

        const frameGeo = new THREE.BoxGeometry(0.16, 1.8, 1.6);
        const frame = new THREE.Mesh(frameGeo, this.materials.windowFrame);
        frame.position.set(faceX, y, z);
        chunkGroup.add(frame);
      }
    }
  }
}
