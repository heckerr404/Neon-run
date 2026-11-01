export class ScoreManager {
  constructor() {
    this.storageKey = 'neon_rush_save_data_v1';

    // In-game session stats
    this.score = 0;
    this.coins = 0;
    this.distance = 0;
    this.multiplier = 1;

    // Load persisted profile
    this.data = this.loadData();
  }

  getDefaultData() {
    return {
      highScore: 0,
      totalCoins: 0,
      totalRuns: 0,
      totalDistance: 0,
      equippedCharacter: 'dash',
      unlockedCharacters: ['dash'],
      equippedTheme: 'tokyo_city',
      unlockedThemes: ['tokyo_city'],
      dailyStreak: 0,
      lastDailyClaimDate: '',
      settings: {
        bgmVolume: 0.7,
        sfxVolume: 0.85,
        graphics: 'high'
      }
    };
  }

  loadData() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        const data = { ...this.getDefaultData(), ...parsed };
        // Migrate legacy IDs if present
        if (data.equippedCharacter === 'kael') data.equippedCharacter = 'dash';
        if (!data.unlockedCharacters.includes('dash')) data.unlockedCharacters.push('dash');
        if (data.equippedTheme === 'neon_city') data.equippedTheme = 'tokyo_city';
        if (!data.unlockedThemes.includes('tokyo_city')) data.unlockedThemes.push('tokyo_city');
        return data;
      }
    } catch (e) {
      console.warn('Could not read from localStorage, using defaults', e);
    }
    return this.getDefaultData();
  }

  saveData() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    } catch (e) {
      console.warn('Could not save to localStorage', e);
    }
  }

  resetProgress() {
    this.data = this.getDefaultData();
    this.saveData();
  }

  startRun() {
    this.score = 0;
    this.coins = 0;
    this.distance = 0;
    this.multiplier = 1;
    this.data.totalRuns++;
    this.saveData();
  }

  addDistance(meters, hasMultiplier = false) {
    this.distance += meters;
    // Score increments based on distance and active score multiplier
    const mult = (hasMultiplier ? 2 : 1) * this.multiplier;
    this.score += Math.floor(meters * mult);
  }

  addCoins(amount = 1) {
    this.coins += amount;
    this.data.totalCoins += amount;
    this.score += amount * 25; // Each coin provides bonus points
  }

  endRun() {
    const isNewHighScore = this.score > this.data.highScore;
    if (isNewHighScore) {
      this.data.highScore = this.score;
    }
    this.data.totalDistance += Math.floor(this.distance);
    this.saveData();

    return {
      finalScore: this.score,
      highScore: this.data.highScore,
      coinsGrabbed: this.coins,
      distance: Math.floor(this.distance),
      isNewHighScore
    };
  }

  // Purchasing & Unlocks
  canAfford(cost) {
    return this.data.totalCoins >= cost;
  }

  spendCoins(amount) {
    if (this.canAfford(amount)) {
      this.data.totalCoins -= amount;
      this.saveData();
      return true;
    }
    return false;
  }

  unlockCharacter(id, cost) {
    if (this.spendCoins(cost)) {
      if (!this.data.unlockedCharacters.includes(id)) {
        this.data.unlockedCharacters.push(id);
      }
      this.data.equippedCharacter = id;
      this.saveData();
      return true;
    }
    return false;
  }

  equipCharacter(id) {
    if (this.data.unlockedCharacters.includes(id)) {
      this.data.equippedCharacter = id;
      this.saveData();
      return true;
    }
    return false;
  }

  unlockTheme(id, cost) {
    if (this.spendCoins(cost)) {
      if (!this.data.unlockedThemes.includes(id)) {
        this.data.unlockedThemes.push(id);
      }
      this.data.equippedTheme = id;
      this.saveData();
      return true;
    }
    return false;
  }

  equipTheme(id) {
    if (this.data.unlockedThemes.includes(id)) {
      this.data.equippedTheme = id;
      this.saveData();
      return true;
    }
    return false;
  }

  // Daily Streak Claim
  checkDailyStatus() {
    const today = new Date().toISOString().slice(0, 10);
    const canClaim = this.data.lastDailyClaimDate !== today;
    return {
      canClaim,
      streak: this.data.dailyStreak % 7,
      today
    };
  }

  claimDailyReward() {
    const { canClaim, streak, today } = this.checkDailyStatus();
    if (!canClaim) return null;

    const rewardCoins = [100, 200, 350, 500, 750, 1000, 2000][streak];
    this.data.totalCoins += rewardCoins;
    this.data.dailyStreak++;
    this.data.lastDailyClaimDate = today;
    this.saveData();

    return {
      day: streak + 1,
      rewardCoins,
      newTotal: this.data.totalCoins
    };
  }
}
