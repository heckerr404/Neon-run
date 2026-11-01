import { audioManager } from '../game/AudioManager.js';

export class SettingsUI {
  constructor(game) {
    this.game = game;
    this.modal = document.getElementById('settings-modal');
    this.closeBtn = document.getElementById('btn-settings-close');

    this.bgmSlider = document.getElementById('slider-bgm-volume');
    this.bgmVal = document.getElementById('val-bgm-volume');

    this.sfxSlider = document.getElementById('slider-sfx-volume');
    this.sfxVal = document.getElementById('val-sfx-volume');

    this.graphicsSelect = document.getElementById('select-graphics');
    this.resetBtn = document.getElementById('btn-reset-data');

    this.initListeners();
  }

  initListeners() {
    this.closeBtn.addEventListener('click', () => {
      audioManager.playClick();
      this.hide();
    });

    this.bgmSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      this.bgmVal.textContent = `${val}%`;
      audioManager.setBgmVolume(val / 100);
      this.game.scoreManager.data.settings.bgmVolume = val / 100;
      this.game.scoreManager.saveData();
    });

    this.sfxSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      this.sfxVal.textContent = `${val}%`;
      audioManager.setSfxVolume(val / 100);
      this.game.scoreManager.data.settings.sfxVolume = val / 100;
      this.game.scoreManager.saveData();
    });

    this.graphicsSelect.addEventListener('change', (e) => {
      const quality = e.target.value;
      this.game.scoreManager.data.settings.graphics = quality;
      this.game.scoreManager.saveData();
      this.game.applyGraphicsQuality(quality);
    });

    this.resetBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to reset all progress, high scores and unlocked characters?')) {
        this.game.scoreManager.resetProgress();
        this.game.player.changeSkin('dash');
        this.game.world.setTheme('tokyo_city');
        alert('All progress has been reset.');
        this.hide();
        this.game.mainMenu.updateStats();
      }
    });
  }

  open() {
    const s = this.game.scoreManager.data.settings;
    this.bgmSlider.value = Math.round(s.bgmVolume * 100);
    this.bgmVal.textContent = `${this.bgmSlider.value}%`;

    this.sfxSlider.value = Math.round(s.sfxVolume * 100);
    this.sfxVal.textContent = `${this.sfxSlider.value}%`;

    this.graphicsSelect.value = s.graphics || 'high';

    this.modal.classList.add('active');
  }

  hide() {
    this.modal.classList.remove('active');
  }
}
