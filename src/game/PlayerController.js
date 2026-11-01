export class PlayerController {
  constructor(player, game) {
    this.player = player;
    this.game = game;

    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchStartTime = 0;
    this.minSwipeDistance = 25; // Pixels
    this.maxSwipeTime = 500; // ms

    this.onKeyDown = this.handleKeyDown.bind(this);
    this.onTouchStart = this.handleTouchStart.bind(this);
    this.onTouchEnd = this.handleTouchEnd.bind(this);

    this.initListeners();
  }

  initListeners() {
    window.addEventListener('keydown', this.onKeyDown);

    // Touch listeners on window with passive: false to prevent rubber-band scrolling
    window.addEventListener('touchstart', this.onTouchStart, { passive: false });
    window.addEventListener('touchend', this.onTouchEnd, { passive: false });
  }

  destroy() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('touchstart', this.onTouchStart);
    window.removeEventListener('touchend', this.onTouchEnd);
  }

  handleKeyDown(e) {
    if (this.game.state !== 'PLAYING') {
      if (e.key === 'Escape' && this.game.state === 'PAUSED') {
        this.game.resume();
      }
      return;
    }

    switch (e.code) {
      case 'ArrowLeft':
      case 'KeyA':
        this.player.moveLeft();
        e.preventDefault();
        break;
      case 'ArrowRight':
      case 'KeyD':
        this.player.moveRight();
        e.preventDefault();
        break;
      case 'ArrowUp':
      case 'KeyW':
      case 'Space':
        this.player.jump();
        e.preventDefault();
        break;
      case 'ArrowDown':
      case 'KeyS':
        this.player.slide();
        e.preventDefault();
        break;
      case 'KeyE':
      case 'KeyH':
        if (!this.player.isHoverboarding) {
          this.player.activateHoverboard();
        }
        e.preventDefault();
        break;
      case 'Escape':
      case 'KeyP':
        this.game.pause();
        e.preventDefault();
        break;
    }
  }

  handleTouchStart(e) {
    if (e.touches.length > 0) {
      this.touchStartX = e.touches[0].clientX;
      this.touchStartY = e.touches[0].clientY;
      this.touchStartTime = performance.now();
    }
  }

  handleTouchEnd(e) {
    if (this.game.state !== 'PLAYING') return;

    if (e.changedTouches.length > 0) {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const deltaTime = performance.now() - this.touchStartTime;

      if (deltaTime > this.maxSwipeTime) return;

      const diffX = touchEndX - this.touchStartX;
      const diffY = touchEndY - this.touchStartY;
      const absDiffX = Math.abs(diffX);
      const absDiffY = Math.abs(diffY);

      if (Math.max(absDiffX, absDiffY) < this.minSwipeDistance) {
        // Tap/click - trigger jump if tapped on upper half
        if (touchEndY < window.innerHeight * 0.5) {
          this.player.jump();
        }
        return;
      }

      if (absDiffX > absDiffY) {
        // Horizontal Swipe
        if (diffX > 0) {
          this.player.moveRight();
        } else {
          this.player.moveLeft();
        }
      } else {
        // Vertical Swipe
        if (diffY > 0) {
          this.player.slide();
        } else {
          this.player.jump();
        }
      }

      e.preventDefault();
    }
  }
}
