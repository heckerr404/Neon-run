import { Game } from './game/Game.js';

window.addEventListener('DOMContentLoaded', () => {
  const game = new Game();
  window.neonRushGame = game; // Expose for debugging if needed
});
