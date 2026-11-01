import { audioManager } from '../game/AudioManager.js';

export class MainMenu {
  constructor(game) {
    this.game = game;
    this.container = document.getElementById('main-menu');
    this.coinCountEl = document.getElementById('menu-coin-count');
    this.highScoreEl = document.getElementById('menu-high-score');
    this.soundToggleBtn = document.getElementById('btn-sound-toggle');
    this.missionBadgeEl = document.getElementById('mission-badge');
    this.dailyBadgeEl = document.getElementById('daily-badge');

    this.initListeners();
  }

  initListeners() {
    // Play button
    document.getElementById('btn-play').addEventListener('click', () => {
      audioManager.playClick();
      this.game.startRun();
    });

    // Sound toggle
    this.soundToggleBtn.addEventListener('click', () => {
      const isSoundOn = audioManager.toggleMute();
      this.soundToggleBtn.textContent = isSoundOn ? '🔊' : '🔇';
    });

    // Nav Cards
    document.getElementById('btn-shop-open').addEventListener('click', () => {
      audioManager.playClick();
      this.game.shop.open('characters');
    });

    document.getElementById('btn-themes-open').addEventListener('click', () => {
      audioManager.playClick();
      this.game.shop.open('themes');
    });

    document.getElementById('btn-missions-open').addEventListener('click', () => {
      audioManager.playClick();
      this.game.missionsUI.open();
    });

    document.getElementById('btn-daily-open').addEventListener('click', () => {
      audioManager.playClick();
      this.game.dailyUI.open();
    });

    document.getElementById('btn-settings-open').addEventListener('click', () => {
      audioManager.playClick();
      this.game.settingsUI.open();
    });
  }

  show() {
    this.updateStats();
    this.container.classList.add('active');
  }

  hide() {
    this.container.classList.remove('active');
  }

  updateStats() {
    const data = this.game.scoreManager.data;
    this.coinCountEl.textContent = data.totalCoins.toLocaleString();
    this.highScoreEl.textContent = data.highScore.toLocaleString();

    // Check unclaimed missions
    const unclaimed = this.game.missionsManager.getUnclaimedCount();
    if (unclaimed > 0) {
      this.missionBadgeEl.textContent = `${unclaimed} CLAIM`;
      this.missionBadgeEl.classList.add('alert');
    } else {
      this.missionBadgeEl.textContent = 'ACTIVE';
      this.missionBadgeEl.classList.remove('alert');
    }

    // Daily claim status
    const daily = this.game.scoreManager.checkDailyStatus();
    if (daily.canClaim) {
      this.dailyBadgeEl.textContent = 'READY';
      this.dailyBadgeEl.classList.add('reward');
    } else {
      this.dailyBadgeEl.textContent = 'CLAIMED';
      this.dailyBadgeEl.classList.remove('reward');
    }
  }
}
