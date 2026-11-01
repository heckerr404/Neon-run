export class HUD {
  constructor(game) {
    this.game = game;
    this.container = document.getElementById('game-hud');
    this.scoreEl = document.getElementById('hud-score');
    this.coinsEl = document.getElementById('hud-coins');
    this.distanceEl = document.getElementById('hud-distance');
    this.multiplierEl = document.getElementById('hud-multiplier');
    this.powerupsContainer = document.getElementById('powerup-timers-container');
    this.pauseBtn = document.getElementById('btn-pause');

    // Hoverboard widget
    this.hoverboardCard = document.getElementById('hud-hoverboard-card');
    this.hoverboardMeter = document.getElementById('hoverboard-meter');
    this.hoverboardOverlay = document.getElementById('hoverboard-cooldown-overlay');
    this.hoverboardSec = document.getElementById('hoverboard-timer-sec');

    this.initListeners();
  }

  initListeners() {
    this.pauseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.game.pause();
    });

    // Hoverboard Card activation click
    if (this.hoverboardCard) {
      this.hoverboardCard.addEventListener('click', (e) => {
        e.stopPropagation();
        this.triggerHoverboard();
      });
    }

    // Double tap/click anywhere to activate hoverboard
    let lastTap = 0;
    window.addEventListener('touchend', (e) => {
      const now = performance.now();
      if (now - lastTap < 300) {
        this.triggerHoverboard();
      }
      lastTap = now;
    });

    window.addEventListener('dblclick', () => {
      this.triggerHoverboard();
    });
  }

  triggerHoverboard() {
    if (this.game.state === 'PLAYING' && !this.game.player.isHoverboarding) {
      this.game.player.activateHoverboard();
    }
  }

  show() {
    this.container.classList.add('active');
  }

  hide() {
    this.container.classList.remove('active');
  }

  update(score, coins, distance, hasMultiplier, activePowerUps) {
    if (this.scoreEl) {
      this.scoreEl.textContent = String(score).padStart(5, '0');
    }
    if (this.coinsEl) {
      this.coinsEl.textContent = coins.toLocaleString();
    }
    if (this.distanceEl) {
      this.distanceEl.textContent = Math.floor(distance).toLocaleString();
    }

    // Multiplier tag (x6 like in reference image)
    if (this.multiplierEl) {
      const baseMult = 6;
      const activeMult = hasMultiplier ? baseMult * 2 : baseMult;
      this.multiplierEl.textContent = `x${activeMult}`;
    }

    // Circular Power-up badges
    this.renderPowerUps(activePowerUps);

    // Hoverboard Status
    this.updateHoverboardStatus();
  }

  updateHoverboardStatus() {
    if (!this.hoverboardCard) return;

    const player = this.game.player;
    if (player.isHoverboarding) {
      this.hoverboardCard.classList.add('active');
      if (this.hoverboardOverlay) {
        this.hoverboardOverlay.classList.remove('hidden');
        this.hoverboardSec.textContent = `${Math.ceil(player.hoverboardTimer)}s`;
      }

      // Drain meter segments
      if (this.hoverboardMeter) {
        const pct = player.hoverboardTimer / player.hoverboardDuration;
        const segments = this.hoverboardMeter.querySelectorAll('.meter-segment');
        segments.forEach((seg, i) => {
          const threshold = i / segments.length;
          if (pct > threshold) {
            seg.classList.add('filled');
          } else {
            seg.classList.remove('filled');
          }
        });
      }
    } else {
      this.hoverboardCard.classList.remove('active');
      if (this.hoverboardOverlay) {
        this.hoverboardOverlay.classList.add('hidden');
      }
      if (this.hoverboardMeter) {
        const segments = this.hoverboardMeter.querySelectorAll('.meter-segment');
        segments.forEach(seg => seg.classList.add('filled'));
      }
    }
  }

  renderPowerUps(activePowerUps) {
    if (!this.powerupsContainer) return;

    if (!activePowerUps || activePowerUps.length === 0) {
      this.powerupsContainer.innerHTML = '';
      return;
    }

    // Circumference of r = 26 circle is 2 * pi * 26 = 163.36
    const circumference = 163.36;

    let html = '';
    activePowerUps.forEach(p => {
      const pct = Math.max(0, Math.min(100, (p.timeLeft / p.duration) * 100));
      const offset = circumference - (pct / 100) * circumference;

      html += `
        <div class="subway-powerup-circle ${p.id}" title="${p.name}">
          <svg class="subway-powerup-svg" viewBox="0 0 66 66">
            <circle cx="33" cy="33" r="26" stroke="rgba(255,255,255,0.15)" stroke-width="4" fill="none"/>
            <circle class="subway-powerup-timer-ring" cx="33" cy="33" r="26"
              style="stroke-dasharray: ${circumference}; stroke-dashoffset: ${offset}; stroke: ${p.id === 'shield' ? '#00f0ff' : p.id === 'magnet' ? '#ffe600' : p.id === 'jetpack' ? '#ff0055' : '#00ff88'};"/>
          </svg>
          <span class="subway-powerup-icon">${p.icon}</span>
        </div>
      `;
    });

    this.powerupsContainer.innerHTML = html;
  }
}
