import { AVAILABLE_MISSIONS } from '../game/MissionsManager.js';
import { audioManager } from '../game/AudioManager.js';

export class MissionsUI {
  constructor(game) {
    this.game = game;
    this.modal = document.getElementById('missions-modal');
    this.listContainer = document.getElementById('missions-list');
    this.closeBtn = document.getElementById('btn-missions-close');

    this.initListeners();
  }

  initListeners() {
    this.closeBtn.addEventListener('click', () => {
      audioManager.playClick();
      this.hide();
    });
  }

  open() {
    this.render();
    this.modal.classList.add('active');
  }

  hide() {
    this.modal.classList.remove('active');
    this.game.mainMenu.updateStats();
  }

  render() {
    const mgr = this.game.missionsManager;
    let html = '';

    AVAILABLE_MISSIONS.forEach(def => {
      const prog = mgr.progress[def.id] || { current: 0, completed: false, claimed: false };
      const pct = Math.min(100, Math.floor((prog.current / def.target) * 100));

      let actionHtml = '';
      if (prog.claimed) {
        actionHtml = '<span style="color: var(--text-muted); font-size: 0.8rem; font-weight: 700;">CLAIMED ✓</span>';
      } else if (prog.completed) {
        actionHtml = `<button class="btn btn-primary btn-claim-mission" data-id="${def.id}" style="padding: 6px 14px; font-size: 0.75rem;">CLAIM</button>`;
      } else {
        actionHtml = `<span class="mission-ratio">${prog.current} / ${def.target}</span>`;
      }

      html += `
        <div class="mission-row ${prog.completed ? 'completed' : ''}">
          <div class="mission-info">
            <div class="mission-desc">${def.title}: ${def.desc}</div>
            <div class="mission-progress-bar">
              <div class="mission-progress-fill" style="width: ${pct}%;"></div>
            </div>
          </div>
          <div class="mission-reward-side">
            <div class="mission-reward-val">+${def.reward} ⬡</div>
            ${actionHtml}
          </div>
        </div>
      `;
    });

    this.listContainer.innerHTML = html;

    // Attach Claim click handlers
    const claimBtns = this.listContainer.querySelectorAll('.btn-claim-mission');
    claimBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const rewarded = mgr.claimReward(id);
        if (rewarded > 0) {
          audioManager.playPowerUp();
          this.render();
          this.game.mainMenu.updateStats();
        }
      });
    });
  }
}

export class DailyUI {
  constructor(game) {
    this.game = game;
    this.modal = document.getElementById('daily-modal');
    this.grid = document.getElementById('daily-calendar-grid');
    this.closeBtn = document.getElementById('btn-daily-close');
    this.claimBtn = document.getElementById('btn-claim-daily');

    this.initListeners();
  }

  initListeners() {
    this.closeBtn.addEventListener('click', () => {
      audioManager.playClick();
      this.hide();
    });

    this.claimBtn.addEventListener('click', () => {
      const res = this.game.scoreManager.claimDailyReward();
      if (res) {
        audioManager.playPowerUp();
        this.render();
        this.game.mainMenu.updateStats();
      }
    });
  }

  open() {
    this.render();
    this.modal.classList.add('active');
  }

  hide() {
    this.modal.classList.remove('active');
    this.game.mainMenu.updateStats();
  }

  render() {
    const rewards = [100, 200, 350, 500, 750, 1000, 2000];
    const status = this.game.scoreManager.checkDailyStatus();
    let html = '';

    rewards.forEach((amt, idx) => {
      const isPastClaimed = idx < status.streak;
      const isCurrent = idx === status.streak;
      let cardClass = '';
      if (isPastClaimed || (!status.canClaim && isCurrent)) {
        cardClass = 'claimed';
      } else if (isCurrent && status.canClaim) {
        cardClass = 'current';
      }

      html += `
        <div class="daily-day-card ${cardClass}">
          <span class="day-number">DAY ${idx + 1}</span>
          <span class="day-reward-icon">${idx === 6 ? '👑' : '🎁'}</span>
          <span class="day-amount">${amt} ⬡</span>
        </div>
      `;
    });

    this.grid.innerHTML = html;

    if (status.canClaim) {
      this.claimBtn.disabled = false;
      this.claimBtn.textContent = `CLAIM DAY ${status.streak + 1} REWARD`;
      this.claimBtn.className = 'btn btn-primary pulse-glow';
    } else {
      this.claimBtn.disabled = true;
      this.claimBtn.textContent = 'ALREADY CLAIMED TODAY';
      this.claimBtn.className = 'btn btn-secondary';
    }
  }
}
