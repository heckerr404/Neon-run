import { audioManager } from '../game/AudioManager.js';

export class GameOver {
  constructor(game) {
    this.game = game;
    this.modal = document.getElementById('game-over-modal');
    this.scoreEl = document.getElementById('go-score');
    this.highScoreEl = document.getElementById('go-high-score');
    this.coinsEl = document.getElementById('go-coins');
    this.distEl = document.getElementById('go-distance');
    this.newRecordBadge = document.getElementById('gameover-new-record');
    this.missionsBox = document.getElementById('go-missions-preview');

    this.initListeners();
  }

  initListeners() {
    document.getElementById('btn-gameover-restart').addEventListener('click', () => {
      audioManager.playClick();
      this.hide();
      this.game.startRun();
    });

    document.getElementById('btn-gameover-shop').addEventListener('click', () => {
      audioManager.playClick();
      this.hide();
      this.game.shop.open('characters');
    });

    document.getElementById('btn-gameover-menu').addEventListener('click', () => {
      audioManager.playClick();
      this.hide();
      this.game.showMainMenu();
    });
  }

  show(results) {
    const { finalScore, highScore, coinsGrabbed, distance, isNewHighScore } = results;

    this.scoreEl.textContent = finalScore.toLocaleString();
    this.highScoreEl.textContent = highScore.toLocaleString();
    this.coinsEl.textContent = `+${coinsGrabbed.toLocaleString()}`;
    this.distEl.textContent = `${distance.toLocaleString()} m`;

    if (isNewHighScore) {
      this.newRecordBadge.classList.remove('hidden');
    } else {
      this.newRecordBadge.classList.add('hidden');
    }

    // Quick missions status summary
    const unclaimed = this.game.missionsManager.getUnclaimedCount();
    if (unclaimed > 0) {
      this.missionsBox.innerHTML = `
        <div style="color: var(--neon-green); font-weight: 700;">
          🎯 ${unclaimed} MISSION REWARD(S) READY TO CLAIM IN MISSIONS TAB!
        </div>
      `;
      this.missionsBox.style.display = 'block';
    } else {
      this.missionsBox.style.display = 'none';
    }

    this.modal.classList.add('active');
  }

  hide() {
    this.modal.classList.remove('active');
  }
}
