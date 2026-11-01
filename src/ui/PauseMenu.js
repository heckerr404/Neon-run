import { audioManager } from '../game/AudioManager.js';

export class PauseMenu {
  constructor(game) {
    this.game = game;
    this.modal = document.getElementById('pause-modal');
    this.scoreEl = document.getElementById('pause-score');
    this.coinsEl = document.getElementById('pause-coins');
    this.distEl = document.getElementById('pause-distance');

    this.initListeners();
  }

  initListeners() {
    document.getElementById('btn-pause-resume').addEventListener('click', () => {
      audioManager.playClick();
      this.game.resume();
    });

    document.getElementById('btn-pause-restart').addEventListener('click', () => {
      audioManager.playClick();
      this.hide();
      this.game.startRun();
    });

    document.getElementById('btn-pause-settings').addEventListener('click', () => {
      audioManager.playClick();
      this.game.settingsUI.open();
    });

    document.getElementById('btn-pause-menu').addEventListener('click', () => {
      audioManager.playClick();
      this.hide();
      this.game.showMainMenu();
    });
  }

  show(score, coins, distance) {
    this.scoreEl.textContent = score.toLocaleString();
    this.coinsEl.textContent = coins.toLocaleString();
    this.distEl.textContent = `${Math.floor(distance).toLocaleString()} m`;
    this.modal.classList.add('active');
  }

  hide() {
    this.modal.classList.remove('active');
  }
}
