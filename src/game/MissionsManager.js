export const AVAILABLE_MISSIONS = [
  {
    id: 'dist_500',
    title: 'Speed Demon',
    desc: 'Sprint 500 meters down the railway.',
    type: 'distance',
    target: 500,
    reward: 150
  },
  {
    id: 'coins_100',
    title: 'Credit Heist',
    desc: 'Collect 100 cyber energy coins.',
    type: 'coins',
    target: 100,
    reward: 200
  },
  {
    id: 'jumps_20',
    title: 'High Clearance',
    desc: 'Perform 20 acrobatic jumps over obstacles.',
    type: 'jumps',
    target: 20,
    reward: 120
  },
  {
    id: 'slides_15',
    title: 'Low Profile',
    desc: 'Slide under 15 overhead security gantries.',
    type: 'slides',
    target: 15,
    reward: 120
  },
  {
    id: 'powerups_3',
    title: 'Overclocked',
    desc: 'Collect 3 power-up modules.',
    type: 'powerups',
    target: 3,
    reward: 250
  },
  {
    id: 'score_8000',
    title: 'Neon Legend',
    desc: 'Reach a run score of 8,000 points.',
    type: 'score',
    target: 8000,
    reward: 350
  }
];

export class MissionsManager {
  constructor(scoreManager) {
    this.scoreManager = scoreManager;
    this.storageKey = 'neon_rush_missions_v1';
    this.progress = this.loadMissions();

    // Run stats
    this.runJumps = 0;
    this.runSlides = 0;
    this.runPowerUps = 0;
  }

  loadMissions() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Failed to load mission progress', e);
    }

    const init = {};
    AVAILABLE_MISSIONS.forEach(m => {
      init[m.id] = { current: 0, completed: false, claimed: false };
    });
    return init;
  }

  saveMissions() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.progress));
    } catch (e) {
      console.warn('Failed to save missions', e);
    }
  }

  startRun() {
    this.runJumps = 0;
    this.runSlides = 0;
    this.runPowerUps = 0;
  }

  recordJump() {
    this.runJumps++;
    this.incrementMission('jumps_20', 1);
  }

  recordSlide() {
    this.runSlides++;
    this.incrementMission('slides_15', 1);
  }

  recordPowerUp() {
    this.runPowerUps++;
    this.incrementMission('powerups_3', 1);
  }

  recordCoins(amount) {
    this.incrementMission('coins_100', amount);
  }

  updateRunEnd(distance, score) {
    this.incrementMission('dist_500', Math.floor(distance));
    if (score >= 8000) {
      this.incrementMission('score_8000', 8000);
    }
  }

  incrementMission(id, amount) {
    const m = this.progress[id];
    const def = AVAILABLE_MISSIONS.find(d => d.id === id);
    if (!m || !def || m.completed) return;

    m.current = Math.min(def.target, m.current + amount);
    if (m.current >= def.target) {
      m.completed = true;
    }
    this.saveMissions();
  }

  claimReward(id) {
    const m = this.progress[id];
    const def = AVAILABLE_MISSIONS.find(d => d.id === id);
    if (m && def && m.completed && !m.claimed) {
      m.claimed = true;
      this.scoreManager.data.totalCoins += def.reward;
      this.scoreManager.saveData();
      this.saveMissions();
      return def.reward;
    }
    return 0;
  }

  getUnclaimedCount() {
    let count = 0;
    Object.values(this.progress).forEach(m => {
      if (m.completed && !m.claimed) count++;
    });
    return count;
  }
}
