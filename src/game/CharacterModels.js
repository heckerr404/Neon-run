import * as THREE from 'three';

export const CHARACTER_DEFINITIONS = [
  {
    id: 'dash',
    name: 'DASH',
    title: 'Track Legend',
    desc: 'The iconic street runner in a signature red beanie, hoodie, and blue jeans.',
    price: 0,
    unlocked: true,
    colors: {
      skin: 0xffdfbe,
      hair: 0x5a3d28,
      hat: 0xdc2626, // Red Beanie
      hoodie: 0xf8fafc, // White hoodie
      jacketAccent: 0x0284c7, // Sky Blue trim
      pants: 0x1d4ed8, // Denim Blue jeans
      shoes: 0xdc2626, // Red/White kicks
      shoeSole: 0xffffff,
      backpack: 0xb45309 // Leather brown pack
    },
    stats: { speed: 'Fast', agility: 'Maximum' }
  },
  {
    id: 'maya',
    name: 'MAYA',
    title: 'Skate Rebel',
    desc: 'Energetic street skater with a pink beanie, sunny yellow hoodie and mint kicks.',
    price: 350,
    unlocked: false,
    colors: {
      skin: 0xfde2c8,
      hair: 0xfbbf24, // Blonde
      hat: 0xec4899, // Pink beanie
      hoodie: 0xfacc15, // Yellow hoodie
      jacketAccent: 0x10b981, // Emerald trim
      pants: 0x7c3aed, // Purple jeans
      shoes: 0x10b981,
      shoeSole: 0xffffff,
      backpack: 0xec4899
    },
    stats: { speed: 'High', agility: 'High' }
  },
  {
    id: 'fresh',
    name: 'FRESH',
    title: 'Boombox King',
    desc: 'Retro 90s street dancer with a turquoise varsity jacket and orange kicks.',
    price: 800,
    unlocked: false,
    colors: {
      skin: 0x8d5b4c, // Rich brown skin
      hair: 0x18181b, // Black fade
      hat: 0x06b6d4, // Cyan cap
      hoodie: 0x0d9488, // Turquoise jacket
      jacketAccent: 0xf97316, // Orange stripes
      pants: 0x334155, // Dark slate jeans
      shoes: 0xf97316,
      shoeSole: 0xffffff,
      backpack: 0x64748b
    },
    stats: { speed: 'Maximum', agility: 'High' }
  },
  {
    id: 'spike',
    name: 'SPIKE',
    title: 'Punk Rocker',
    desc: 'Spiky-haired rocker sporting a studded biker vest and distressed denim.',
    price: 1500,
    unlocked: false,
    colors: {
      skin: 0xffeedd,
      hair: 0xdc2626, // Crimson mohawk
      hat: 0x111827, // Bandana
      hoodie: 0x1e293b, // Dark denim vest
      jacketAccent: 0xe11d48, // Crimson collar
      pants: 0x0f172a, // Black jeans
      shoes: 0xe11d48,
      shoeSole: 0xffffff,
      backpack: 0x0f172a
    },
    stats: { speed: 'Very High', agility: 'Maximum' }
  },
  {
    id: 'lucy',
    name: 'LUCY',
    title: 'Neon Racer',
    desc: 'High-tech urban runner with aerodynamic visor and cyber windbreaker.',
    price: 2500,
    unlocked: false,
    colors: {
      skin: 0xfce7d2,
      hair: 0x06b6d4, // Cyan hair
      hat: 0x00f3ff, // Visor
      hoodie: 0x0f172a, // Dark cyber windbreaker
      jacketAccent: 0x00f3ff, // Cyan piping
      pants: 0x2563eb, // Cobalt track pants
      shoes: 0x00f3ff,
      shoeSole: 0xffffff,
      backpack: 0x00f3ff
    },
    stats: { speed: 'Ultra', agility: 'Maximum' }
  }
];

export function createCharacterModel(characterId = 'dash') {
  let config = CHARACTER_DEFINITIONS.find(c => c.id === characterId);
  if (!config) {
    config = CHARACTER_DEFINITIONS[0];
  }
  const { colors } = config;

  // High-Quality Stylized PBR Materials
  const skinMat = new THREE.MeshStandardMaterial({
    color: colors.skin,
    roughness: 0.5,
    metalness: 0.05
  });

  const hairMat = new THREE.MeshStandardMaterial({
    color: colors.hair,
    roughness: 0.65,
    metalness: 0.1
  });

  const hatMat = new THREE.MeshStandardMaterial({
    color: colors.hat,
    roughness: 0.55,
    metalness: 0.1
  });

  const hoodieMat = new THREE.MeshStandardMaterial({
    color: colors.hoodie,
    roughness: 0.5,
    metalness: 0.1
  });

  const accentMat = new THREE.MeshStandardMaterial({
    color: colors.jacketAccent,
    roughness: 0.45,
    metalness: 0.2
  });

  const pantsMat = new THREE.MeshStandardMaterial({
    color: colors.pants,
    roughness: 0.65,
    metalness: 0.05
  });

  const shoeMat = new THREE.MeshStandardMaterial({
    color: colors.shoes,
    roughness: 0.4,
    metalness: 0.15
  });

  const soleMat = new THREE.MeshStandardMaterial({
    color: colors.shoeSole,
    roughness: 0.35,
    metalness: 0.1
  });

  const backpackMat = new THREE.MeshStandardMaterial({
    color: colors.backpack,
    roughness: 0.6,
    metalness: 0.2
  });

  const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const eyePupilMat = new THREE.MeshBasicMaterial({ color: 0x111827 });

  // Hierarchy Root
  const characterRoot = new THREE.Group();
  characterRoot.name = `character-${config.id}`;

  const bodyRoot = new THREE.Group();
  bodyRoot.position.y = 1.0;
  characterRoot.add(bodyRoot);

  // --- Pelvis & Torso (Curved Humanoid Shape) ---
  const pelvisGeo = new THREE.CylinderGeometry(0.24, 0.22, 0.26, 12);
  const pelvis = new THREE.Mesh(pelvisGeo, pantsMat);
  pelvis.castShadow = true;
  bodyRoot.add(pelvis);

  // Upper Torso / Hoodie Jacket (Tapered & Rounded)
  const torsoGeo = new THREE.CylinderGeometry(0.28, 0.25, 0.64, 14);
  const torso = new THREE.Mesh(torsoGeo, hoodieMat);
  torso.position.y = 0.42;
  torso.castShadow = true;
  pelvis.add(torso);

  // Hoodie Front Pouch
  const pouchGeo = new THREE.BoxGeometry(0.36, 0.18, 0.12);
  const pouch = new THREE.Mesh(pouchGeo, accentMat);
  pouch.position.set(0, -0.14, 0.17);
  torso.add(pouch);

  // Backpack Slung Across Back with Sleeping Roll & Straps
  const packGeo = new THREE.BoxGeometry(0.38, 0.44, 0.22);
  const backpack = new THREE.Mesh(packGeo, backpackMat);
  backpack.position.set(0, 0.06, -0.22);
  backpack.castShadow = true;
  torso.add(backpack);

  // Top rolled sleeping bag / mat
  const matRollGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.44, 10);
  matRollGeo.rotateZ(Math.PI / 2);
  const matRoll = new THREE.Mesh(matRollGeo, accentMat);
  matRoll.position.set(0, 0.32, -0.22);
  torso.add(matRoll);

  // Front straps
  [-0.14, 0.14].forEach(x => {
    const strapGeo = new THREE.BoxGeometry(0.06, 0.6, 0.04);
    const strap = new THREE.Mesh(strapGeo, backpackMat);
    strap.position.set(x, 0.02, 0.18);
    torso.add(strap);
  });

  // --- Neck & Stylized Head ---
  const neckGeo = new THREE.CylinderGeometry(0.1, 0.12, 0.12, 10);
  const neck = new THREE.Mesh(neckGeo, skinMat);
  neck.position.y = 0.38;
  torso.add(neck);

  const headGroup = new THREE.Group();
  headGroup.position.y = 0.22;
  neck.add(headGroup);

  // Rounded Stylized Head
  const headGeo = new THREE.SphereGeometry(0.25, 16, 16);
  const head = new THREE.Mesh(headGeo, skinMat);
  head.scale.set(1, 1.1, 1);
  head.castShadow = true;
  headGroup.add(head);

  // Stylized Big Expressive Eyes
  [-0.09, 0.09].forEach(x => {
    const eyeWhiteGeo = new THREE.SphereGeometry(0.065, 10, 10);
    const eyeWhite = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
    eyeWhite.position.set(x, 0.04, 0.21);
    eyeWhite.scale.set(1, 1.2, 0.5);
    headGroup.add(eyeWhite);

    const pupilGeo = new THREE.SphereGeometry(0.038, 8, 8);
    const pupil = new THREE.Mesh(pupilGeo, eyePupilMat);
    pupil.position.set(x, 0.04, 0.235);
    pupil.scale.set(1, 1.1, 0.4);
    headGroup.add(pupil);
  });

  // Hair Fringe
  const hairGeo = new THREE.SphereGeometry(0.26, 14, 14, 0, Math.PI * 2, 0, Math.PI * 0.4);
  const hair = new THREE.Mesh(hairGeo, hairMat);
  hair.position.set(0, 0.08, 0);
  headGroup.add(hair);

  // Signature Stylized Beanie Cap (Slanted backwards street style)
  const capDomeGeo = new THREE.SphereGeometry(0.25, 16, 14, 0, Math.PI * 2, 0, Math.PI * 0.65);
  const capDome = new THREE.Mesh(capDomeGeo, hatMat);
  capDome.position.set(0, 0.16, -0.05);
  capDome.rotation.x = -0.22;
  capDome.castShadow = true;
  headGroup.add(capDome);

  // Beanie Folded Rim
  const capRimGeo = new THREE.TorusGeometry(0.24, 0.045, 10, 20);
  capRimGeo.rotateX(Math.PI / 2);
  const capRim = new THREE.Mesh(capRimGeo, hatMat);
  capRim.position.set(0, 0.15, -0.05);
  capRim.rotation.x = -0.22;
  headGroup.add(capRim);

  // --- Smooth Articulated Arms (Cylinders + Elbow Joints) ---
  const upperArmGeo = new THREE.CylinderGeometry(0.08, 0.075, 0.32, 10);
  const forearmGeo = new THREE.CylinderGeometry(0.07, 0.065, 0.28, 10);
  const jointGeo = new THREE.SphereGeometry(0.078, 8, 8);
  const handGeo = new THREE.SphereGeometry(0.075, 8, 8);

  // Left Arm
  const leftArmGroup = new THREE.Group();
  leftArmGroup.position.set(-0.35, 0.24, 0);
  torso.add(leftArmGroup);

  const leftUpperArm = new THREE.Mesh(upperArmGeo, accentMat);
  leftUpperArm.position.y = -0.16;
  leftUpperArm.castShadow = true;
  leftArmGroup.add(leftUpperArm);

  const leftElbow = new THREE.Mesh(jointGeo, accentMat);
  leftElbow.position.y = -0.32;
  leftArmGroup.add(leftElbow);

  const leftForearmGroup = new THREE.Group();
  leftForearmGroup.position.y = -0.32;
  leftArmGroup.add(leftForearmGroup);

  const leftForearm = new THREE.Mesh(forearmGeo, skinMat);
  leftForearm.position.y = -0.14;
  leftForearm.castShadow = true;
  leftForearmGroup.add(leftForearm);

  const leftHand = new THREE.Mesh(handGeo, skinMat);
  leftHand.position.y = -0.3;
  leftHand.scale.set(1, 1.2, 0.8);
  leftForearmGroup.add(leftHand);

  // Right Arm
  const rightArmGroup = new THREE.Group();
  rightArmGroup.position.set(0.35, 0.24, 0);
  torso.add(rightArmGroup);

  const rightUpperArm = new THREE.Mesh(upperArmGeo, accentMat);
  rightUpperArm.position.y = -0.16;
  rightUpperArm.castShadow = true;
  rightArmGroup.add(rightUpperArm);

  const rightElbow = new THREE.Mesh(jointGeo, accentMat);
  rightElbow.position.y = -0.32;
  rightArmGroup.add(rightElbow);

  const rightForearmGroup = new THREE.Group();
  rightForearmGroup.position.y = -0.32;
  rightArmGroup.add(rightForearmGroup);

  const rightForearm = new THREE.Mesh(forearmGeo, skinMat);
  rightForearm.position.y = -0.14;
  rightForearm.castShadow = true;
  rightForearmGroup.add(rightForearm);

  const rightHand = new THREE.Mesh(handGeo, skinMat);
  rightHand.position.y = -0.3;
  rightHand.scale.set(1, 1.2, 0.8);
  rightForearmGroup.add(rightHand);

  // --- Smooth Articulated Legs (Denim Cylinders + Chunky Skate Shoes) ---
  const thighGeo = new THREE.CylinderGeometry(0.12, 0.1, 0.38, 10);
  const calfGeo = new THREE.CylinderGeometry(0.1, 0.09, 0.36, 10);
  const kneeJointGeo = new THREE.SphereGeometry(0.1, 8, 8);
  const sneakerGeo = new THREE.BoxGeometry(0.2, 0.15, 0.36);
  const soleGeo = new THREE.BoxGeometry(0.22, 0.06, 0.38);

  // Left Leg
  const leftLegGroup = new THREE.Group();
  leftLegGroup.position.set(-0.16, -0.12, 0);
  pelvis.add(leftLegGroup);

  const leftThigh = new THREE.Mesh(thighGeo, pantsMat);
  leftThigh.position.y = -0.19;
  leftThigh.castShadow = true;
  leftLegGroup.add(leftThigh);

  const leftKneeJoint = new THREE.Mesh(kneeJointGeo, pantsMat);
  leftKneeJoint.position.y = -0.38;
  leftLegGroup.add(leftKneeJoint);

  const leftKneeGroup = new THREE.Group();
  leftKneeGroup.position.y = -0.38;
  leftLegGroup.add(leftKneeGroup);

  const leftCalf = new THREE.Mesh(calfGeo, pantsMat);
  leftCalf.position.y = -0.18;
  leftCalf.castShadow = true;
  leftKneeGroup.add(leftCalf);

  // Folded cuff
  const cuffGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.06, 10);
  const leftCuff = new THREE.Mesh(cuffGeo, hoodieMat);
  leftCuff.position.y = -0.35;
  leftKneeGroup.add(leftCuff);

  // Chunky Sneaker with Rubber Toe Cap
  const leftShoe = new THREE.Mesh(sneakerGeo, shoeMat);
  leftShoe.position.set(0, -0.45, 0.05);
  leftShoe.castShadow = true;
  leftKneeGroup.add(leftShoe);

  const leftSole = new THREE.Mesh(soleGeo, soleMat);
  leftSole.position.set(0, -0.52, 0.05);
  leftKneeGroup.add(leftSole);

  // Right Leg
  const rightLegGroup = new THREE.Group();
  rightLegGroup.position.set(0.16, -0.12, 0);
  pelvis.add(rightLegGroup);

  const rightThigh = new THREE.Mesh(thighGeo, pantsMat);
  rightThigh.position.y = -0.19;
  rightThigh.castShadow = true;
  rightLegGroup.add(rightThigh);

  const rightKneeJoint = new THREE.Mesh(kneeJointGeo, pantsMat);
  rightKneeJoint.position.y = -0.38;
  rightLegGroup.add(rightKneeJoint);

  const rightKneeGroup = new THREE.Group();
  rightKneeGroup.position.y = -0.38;
  rightLegGroup.add(rightKneeGroup);

  const rightCalf = new THREE.Mesh(calfGeo, pantsMat);
  rightCalf.position.y = -0.18;
  rightCalf.castShadow = true;
  rightKneeGroup.add(rightCalf);

  const rightCuff = new THREE.Mesh(cuffGeo, hoodieMat);
  rightCuff.position.y = -0.35;
  rightKneeGroup.add(rightCuff);

  const rightShoe = new THREE.Mesh(sneakerGeo, shoeMat);
  rightShoe.position.set(0, -0.45, 0.05);
  rightShoe.castShadow = true;
  rightKneeGroup.add(rightShoe);

  const rightSole = new THREE.Mesh(soleGeo, soleMat);
  rightSole.position.set(0, -0.52, 0.05);
  rightKneeGroup.add(rightSole);

  // Energy Shield
  const shieldGeo = new THREE.SphereGeometry(1.2, 16, 16);
  const shieldMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0,
    wireframe: true
  });
  const shield = new THREE.Mesh(shieldGeo, shieldMat);
  shield.name = 'player-shield-bubble';
  shield.position.y = 0.5;
  bodyRoot.add(shield);

  return {
    root: characterRoot,
    bodyRoot,
    pelvis,
    torso,
    headGroup,
    leftArmGroup,
    rightArmGroup,
    leftForearmGroup,
    rightForearmGroup,
    leftLegGroup,
    rightLegGroup,
    leftKneeGroup,
    rightKneeGroup,
    shield,
    id: config.id,
    config
  };
}
