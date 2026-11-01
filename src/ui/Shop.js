import * as THREE from 'three';
import { CHARACTER_DEFINITIONS, createCharacterModel } from '../game/CharacterModels.js';
import { THEME_DEFINITIONS } from '../game/Environment.js';
import { audioManager } from '../game/AudioManager.js';

export class Shop {
  constructor(game) {
    this.game = game;
    this.modal = document.getElementById('shop-modal');
    this.tabCharacters = document.getElementById('tab-shop-characters');
    this.tabThemes = document.getElementById('tab-shop-themes');
    this.coinBalanceEl = document.getElementById('shop-coin-balance');
    this.cardsGrid = document.getElementById('shop-cards-grid');
    this.closeBtn = document.getElementById('btn-shop-close');

    // Preview side elements
    this.previewCanvas = document.getElementById('shop-preview-canvas');
    this.previewNameEl = document.getElementById('preview-item-name');
    this.previewDescEl = document.getElementById('preview-item-desc');
    this.previewStatsEl = document.getElementById('preview-stats-bar');
    this.actionBtn = document.getElementById('btn-shop-action');

    this.currentTab = 'characters'; // 'characters' | 'themes'
    this.selectedItemId = 'dash';

    this.initPreviewScene();
    this.initListeners();
  }

  initPreviewScene() {
    this.previewScene = new THREE.Scene();
    this.previewCamera = new THREE.PerspectiveCamera(45, 1, 0.1, 50);
    this.previewCamera.position.set(0, 1.4, 3.8);
    this.previewCamera.lookAt(0, 1.1, 0);

    this.previewRenderer = new THREE.WebGLRenderer({
      canvas: this.previewCanvas,
      alpha: true,
      antialias: true
    });
    this.previewRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Pedestal & Lighting
    const hemi = new THREE.HemisphereLight(0xffffff, 0x111122, 1.2);
    this.previewScene.add(hemi);

    const dir = new THREE.DirectionalLight(0x00f3ff, 1.8);
    dir.position.set(2, 4, 3);
    this.previewScene.add(dir);

    const rim = new THREE.DirectionalLight(0xff0055, 1.5);
    rim.position.set(-2, 2, -2);
    this.previewScene.add(rim);

    // Glowing Pedestal Disc
    const pedGeo = new THREE.CylinderGeometry(1.2, 1.3, 0.15, 24);
    const pedMat = new THREE.MeshStandardMaterial({
      color: 0x141829,
      roughness: 0.3,
      metalness: 0.8
    });
    const pedestal = new THREE.Mesh(pedGeo, pedMat);
    pedestal.position.y = -0.08;
    this.previewScene.add(pedestal);

    // Pedestal neon ring
    const ringGeo = new THREE.TorusGeometry(1.22, 0.03, 8, 24);
    ringGeo.rotateX(Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.y = 0;
    this.previewScene.add(ring);

    this.previewModelGroup = new THREE.Group();
    this.previewScene.add(this.previewModelGroup);

    this.startPreviewAnimation();
  }

  startPreviewAnimation() {
    const animate = () => {
      if (this.modal.classList.contains('active')) {
        this.previewModelGroup.rotation.y += 0.015;

        // Resize check
        const rect = this.previewCanvas.getBoundingClientRect();
        if (this.previewCanvas.width !== rect.width || this.previewCanvas.height !== rect.height) {
          this.previewRenderer.setSize(rect.width, rect.height, false);
          this.previewCamera.aspect = rect.width / rect.height;
          this.previewCamera.updateProjectionMatrix();
        }

        this.previewRenderer.render(this.previewScene, this.previewCamera);
      }
      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }

  updatePreviewModel(characterId) {
    // Clear previous model
    while (this.previewModelGroup.children.length > 0) {
      this.previewModelGroup.remove(this.previewModelGroup.children[0]);
    }

    if (this.currentTab === 'characters') {
      const charRig = createCharacterModel(characterId);
      charRig.root.position.set(0, 0, 0);
      this.previewModelGroup.add(charRig.root);
    }
  }

  initListeners() {
    this.closeBtn.addEventListener('click', () => {
      audioManager.playClick();
      this.hide();
    });

    this.tabCharacters.addEventListener('click', () => {
      audioManager.playClick();
      this.switchTab('characters');
    });

    this.tabThemes.addEventListener('click', () => {
      audioManager.playClick();
      this.switchTab('themes');
    });

    this.actionBtn.addEventListener('click', () => {
      this.handleActionClick();
    });
  }

  open(tab = 'characters') {
    this.switchTab(tab);
    this.modal.classList.add('active');
  }

  hide() {
    this.modal.classList.remove('active');
    this.game.mainMenu.updateStats();
  }

  switchTab(tab) {
    this.currentTab = tab;
    if (tab === 'characters') {
      this.tabCharacters.classList.add('active');
      this.tabThemes.classList.remove('active');
      this.selectedItemId = this.game.scoreManager.data.equippedCharacter;
    } else {
      this.tabThemes.classList.add('active');
      this.tabCharacters.classList.remove('active');
      this.selectedItemId = this.game.scoreManager.data.equippedTheme;
    }
    this.render();
  }

  render() {
    const data = this.game.scoreManager.data;
    this.coinBalanceEl.textContent = data.totalCoins.toLocaleString();

    if (this.currentTab === 'characters') {
      this.renderCharacters();
    } else {
      this.renderThemes();
    }

    this.updatePreviewDetails();
  }

  renderCharacters() {
    const data = this.game.scoreManager.data;
    let html = '';

    CHARACTER_DEFINITIONS.forEach(char => {
      const isUnlocked = data.unlockedCharacters.includes(char.id);
      const isEquipped = data.equippedCharacter === char.id;
      const isSelected = this.selectedItemId === char.id;

      let badgeClass = 'locked';
      let badgeText = 'LOCKED';
      if (isEquipped) {
        badgeClass = 'equipped';
        badgeText = 'EQUIPPED';
      } else if (isUnlocked) {
        badgeClass = 'unlocked';
        badgeText = 'OWNED';
      }

      const colorVal = char.colors.hat || char.colors.jacketAccent || 0xdc2626;
      const hexColor = '#' + colorVal.toString(16).padStart(6, '0');

      html += `
        <div class="shop-card ${isSelected ? 'selected' : ''} ${isEquipped ? 'equipped' : ''}" data-id="${char.id}">
          <div class="card-title-row">
            <span class="card-name">${char.name}</span>
            <span class="card-status-badge ${badgeClass}">${badgeText}</span>
          </div>
          <div class="card-color-stripe" style="background: ${hexColor};"></div>
          <div class="card-price-row">
            ${isUnlocked ? '<span style="color: var(--text-muted); font-size: 0.8rem;">Ready</span>' : `<span class="coin-icon">⬡</span> <span>${char.price.toLocaleString()}</span>`}
          </div>
        </div>
      `;
    });

    this.cardsGrid.innerHTML = html;
    this.bindCardEvents();
  }

  renderThemes() {
    const data = this.game.scoreManager.data;
    let html = '';

    THEME_DEFINITIONS.forEach(theme => {
      const isUnlocked = data.unlockedThemes.includes(theme.id);
      const isEquipped = data.equippedTheme === theme.id;
      const isSelected = this.selectedItemId === theme.id;

      let badgeClass = 'locked';
      let badgeText = 'LOCKED';
      if (isEquipped) {
        badgeClass = 'equipped';
        badgeText = 'ACTIVE';
      } else if (isUnlocked) {
        badgeClass = 'unlocked';
        badgeText = 'OWNED';
      }

      const hexColor = '#' + (theme.skyColor || 0x5bb0ea).toString(16).padStart(6, '0');

      html += `
        <div class="shop-card ${isSelected ? 'selected' : ''} ${isEquipped ? 'equipped' : ''}" data-id="${theme.id}">
          <div class="card-title-row">
            <span class="card-name">${theme.name}</span>
            <span class="card-status-badge ${badgeClass}">${badgeText}</span>
          </div>
          <div class="card-color-stripe" style="background: ${hexColor};"></div>
          <div class="card-price-row">
            ${isUnlocked ? '<span style="color: var(--text-muted); font-size: 0.8rem;">Ready</span>' : `<span class="coin-icon">⬡</span> <span>${theme.price.toLocaleString()}</span>`}
          </div>
        </div>
      `;
    });

    this.cardsGrid.innerHTML = html;
    this.bindCardEvents();
  }

  bindCardEvents() {
    const cards = this.cardsGrid.querySelectorAll('.shop-card');
    cards.forEach(card => {
      card.addEventListener('click', () => {
        audioManager.playClick();
        this.selectedItemId = card.getAttribute('data-id');
        this.render();
      });
    });
  }

  updatePreviewDetails() {
    const data = this.game.scoreManager.data;

    if (this.currentTab === 'characters') {
      const char = CHARACTER_DEFINITIONS.find(c => c.id === this.selectedItemId) || CHARACTER_DEFINITIONS[0];
      this.previewNameEl.textContent = `${char.name} - ${char.title}`;
      this.previewDescEl.textContent = char.desc;
      this.previewStatsEl.innerHTML = `
        <div class="preview-stat-pill">Speed: <span class="stat-highlight">${char.stats.speed}</span></div>
        <div class="preview-stat-pill">${char.stats.agility ? `Agility: <span class="stat-highlight">${char.stats.agility}</span>` : `Armor: <span class="stat-highlight">${char.stats.armor}</span>`}</div>
      `;

      this.updatePreviewModel(char.id);

      const isUnlocked = data.unlockedCharacters.includes(char.id);
      const isEquipped = data.equippedCharacter === char.id;

      if (isEquipped) {
        this.actionBtn.textContent = 'EQUIPPED';
        this.actionBtn.className = 'btn btn-secondary btn-action';
        this.actionBtn.disabled = true;
      } else if (isUnlocked) {
        this.actionBtn.textContent = 'EQUIP CHARACTER';
        this.actionBtn.className = 'btn btn-primary btn-action';
        this.actionBtn.disabled = false;
      } else {
        const canAfford = data.totalCoins >= char.price;
        this.actionBtn.textContent = `UNLOCK FOR ${char.price.toLocaleString()} COINS`;
        this.actionBtn.className = `btn btn-primary btn-action ${canAfford ? 'pulse-glow' : ''}`;
        this.actionBtn.disabled = !canAfford;
      }
    } else {
      // Themes
      const theme = THEME_DEFINITIONS.find(t => t.id === this.selectedItemId) || THEME_DEFINITIONS[0];
      this.previewNameEl.textContent = theme.name;
      this.previewDescEl.textContent = theme.desc;
      this.previewStatsEl.innerHTML = `
        <div class="preview-stat-pill">Visual: <span class="stat-highlight">HD Atmospheric</span></div>
      `;

      const isUnlocked = data.unlockedThemes.includes(theme.id);
      const isEquipped = data.equippedTheme === theme.id;

      if (isEquipped) {
        this.actionBtn.textContent = 'ACTIVE ENVIRONMENT';
        this.actionBtn.className = 'btn btn-secondary btn-action';
        this.actionBtn.disabled = true;
      } else if (isUnlocked) {
        this.actionBtn.textContent = 'ACTIVATE ENVIRONMENT';
        this.actionBtn.className = 'btn btn-primary btn-action';
        this.actionBtn.disabled = false;
      } else {
        const canAfford = data.totalCoins >= theme.price;
        this.actionBtn.textContent = `UNLOCK FOR ${theme.price.toLocaleString()} COINS`;
        this.actionBtn.className = `btn btn-primary btn-action ${canAfford ? 'pulse-glow' : ''}`;
        this.actionBtn.disabled = !canAfford;
      }
    }
  }

  handleActionClick() {
    const data = this.game.scoreManager.data;

    if (this.currentTab === 'characters') {
      const char = CHARACTER_DEFINITIONS.find(c => c.id === this.selectedItemId);
      if (!char) return;

      const isUnlocked = data.unlockedCharacters.includes(char.id);
      if (isUnlocked) {
        this.game.scoreManager.equipCharacter(char.id);
        this.game.player.changeSkin(char.id);
        audioManager.playPowerUp();
        this.render();
      } else {
        if (this.game.scoreManager.unlockCharacter(char.id, char.price)) {
          this.game.player.changeSkin(char.id);
          audioManager.playPowerUp();
          this.render();
        }
      }
    } else {
      // Theme
      const theme = THEME_DEFINITIONS.find(t => t.id === this.selectedItemId);
      if (!theme) return;

      const isUnlocked = data.unlockedThemes.includes(theme.id);
      if (isUnlocked) {
        this.game.scoreManager.equipTheme(theme.id);
        this.game.world.setTheme(theme.id);
        audioManager.playPowerUp();
        this.render();
      } else {
        if (this.game.scoreManager.unlockTheme(theme.id, theme.price)) {
          this.game.world.setTheme(theme.id);
          audioManager.playPowerUp();
          this.render();
        }
      }
    }
  }
}
