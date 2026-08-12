/**
 * ExpoGeek RPG - Quest Tracker & Live Event Engine
 * Manages screen navigation, QR code unlocks via URL parameters (?qr=sector_name), global vs specific quests,
 * and XP rank progression for active attendee sessions.
 */

class QuestTracker {
  constructor() {
    this.xp = 0;
    this.completedQuests = new Set();
    this.unlockedSectors = new Set();

    // Main Quest Riddle Answers
    this.mainQuestSecrets = {
      step1: 'NORTE',
      step2: 'JEDI',
      step3: 'ALFA-OMEGA-GEEK'
    };

    this.init();
  }

  init() {
    this.restoreProgress();
    this.checkUrlForQrUnlocks();
    this.bindEvents();
    this.startWorldEventTimers();
    this.updateRankUI();
  }

  /**
   * Scans URL parameters (e.g. ?qr=norte or ?qr=mercaderes) to unlock specific sector quests
   */
  checkUrlForQrUnlocks() {
    const urlParams = new URLSearchParams(window.location.search);
    const scannedQr = urlParams.get('qr') || window.location.hash.replace('#qr-', '');

    if (scannedQr) {
      const cleanQr = scannedQr.toLowerCase().trim();
      if (!this.unlockedSectors.has(cleanQr)) {
        this.unlockedSectors.add(cleanQr);
        this.saveProgress();
        setTimeout(() => {
          this.showToast(`📱 ¡QR Escaneado! Sector '${cleanQr.toUpperCase()}' desbloqueado (+50 XP)!`);
          this.xp += 50;
          this.updateRankUI();
        }, 500);
      }
    }
  }

  bindEvents() {
    // Navigation Screen Switcher Buttons
    document.querySelectorAll('.btn-goto-generator').forEach(btn => {
      btn.addEventListener('click', () => {
        this.showScreen('screenGenerator');
      });
    });

    document.querySelectorAll('.btn-goto-hub').forEach(btn => {
      btn.addEventListener('click', () => {
        this.showScreen('screenHub');
      });
    });

    // Main Quest Step 1 secret code verification
    document.getElementById('btnVerifyMQ1')?.addEventListener('click', () => {
      const input = document.getElementById('inputMQ1')?.value.trim().toUpperCase();
      if (input === this.mainQuestSecrets.step1 || input?.includes('NORTE')) {
        this.completeQuest('mq_step1', 150);
        document.getElementById('mqStep1Content').innerHTML = `
          <div style="color: var(--primary-green); font-weight: bold; padding: 10px; background: rgba(16,185,129,0.1); border-radius: 8px;">
            ✅ ¡Frase secreta correcta! Pista obtenida: "El Caballero Jedi (Cristian) y Esteban custodian el tomo en la Zona Cosplay Central".
          </div>
        `;
        this.showToast('🗝️ ¡Pista 1 Desbloqueada (+150 XP)!');
      } else {
        this.showToast('❌ Frase incorrecta. Busca el QR en la Zona Norte.');
      }
    });

    // Main Quest Final Code verification
    document.getElementById('btnVerifyMQFinal')?.addEventListener('click', () => {
      const input = document.getElementById('inputMQFinal')?.value.trim().toUpperCase();
      if (input === this.mainQuestSecrets.step3 || input?.includes('ALFA-OMEGA')) {
        this.completeQuest('mq_final', 500);
        document.getElementById('mqFinalContent').innerHTML = `
          <div style="color: var(--primary-gold); font-weight: bold; padding: 12px; background: rgba(255,183,0,0.15); border: 1px solid var(--primary-gold); border-radius: 8px;">
            🏆 ¡MAIN QUEST COMPLETADA! Muestra este código en el escenario principal para reclamar tu Pin de Honor.
          </div>
        `;
        this.showToast('🏆 ¡HAS RECLAMADO EL MISTERIO DEL RECINTO (+500 XP)!');
      } else {
        this.showToast('❌ Código Alfa-Omega no válido. Encuentra a Cristian o Esteban.');
      }
    });

    // Side Quests Checkboxes
    document.querySelectorAll('.side-quest-checkbox').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const questId = e.target.dataset.questId;
        const xpReward = parseInt(e.target.dataset.xp || '50', 10);

        if (e.target.checked) {
          this.completeQuest(questId, xpReward);
          this.showToast(`✨ Misión completada (+${xpReward} XP)!`);
        } else {
          this.uncompleteQuest(questId, xpReward);
        }
      });
    });

    // QR Simulator Buttons (for easy mobile phone testing)
    document.querySelectorAll('.btn-sim-qr').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const qrSector = e.currentTarget.dataset.qr;
        window.history.pushState({}, '', `?qr=${qrSector}`);
        this.checkUrlForQrUnlocks();
        this.updateUnlockedQuestsUI();
      });
    });
  }

  showScreen(screenId) {
    document.querySelectorAll('.app-screen').forEach(s => s.style.display = 'none');
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) targetScreen.style.display = 'block';

    const btnBackNav = document.getElementById('btnNavBackToHub');
    if (btnBackNav) {
      btnBackNav.style.display = screenId === 'screenHub' ? 'none' : 'flex';
    }

    if (window.characterGenerator) {
      window.characterGenerator.playAudioEffect('click');
    }
  }

  completeQuest(questId, xpReward = 100) {
    if (!this.completedQuests.has(questId)) {
      this.completedQuests.add(questId);
      this.xp += xpReward;

      const item = document.getElementById(`quest_item_${questId}`);
      if (item) item.classList.add('completed');

      const statusTag = document.getElementById(`quest_tag_${questId}`);
      if (statusTag) {
        statusTag.className = 'quest-status-tag tag-completed';
        statusTag.innerText = '✅ COMPLETADA';
      }

      this.saveProgress();
      this.updateRankUI();
    }
  }

  uncompleteQuest(questId, xpReward = 100) {
    if (this.completedQuests.has(questId)) {
      this.completedQuests.delete(questId);
      this.xp = Math.max(0, this.xp - xpReward);

      const item = document.getElementById(`quest_item_${questId}`);
      if (item) item.classList.remove('completed');

      this.saveProgress();
      this.updateRankUI();
    }
  }

  calculateRank() {
    if (this.xp >= 1000) return { title: 'Leyenda Geek 👑', color: 'var(--primary-gold)', nextXp: 1000 };
    if (this.xp >= 600) return { title: 'Héroe del Recinto 🗡️', color: 'var(--primary-magenta)', nextXp: 1000 };
    if (this.xp >= 250) return { title: 'Aventurero del Gremio 🛡️', color: 'var(--primary-cyan)', nextXp: 600 };
    return { title: 'Novato Escudero 🔰', color: 'var(--text-muted)', nextXp: 250 };
  }

  updateRankUI() {
    const rankInfo = this.calculateRank();
    const xpText = document.getElementById('userXpDisplay');
    const rankTitle = document.getElementById('userRankDisplay');
    const progressBar = document.getElementById('userXpProgressBar');

    if (xpText) xpText.innerText = `${this.xp} XP`;
    if (rankTitle) {
      rankTitle.innerText = rankInfo.title;
      rankTitle.style.color = rankInfo.color;
    }

    if (progressBar) {
      const pct = Math.min(100, Math.round((this.xp / rankInfo.nextXp) * 100));
      progressBar.style.width = `${pct}%`;
    }

    this.updateUnlockedQuestsUI();
  }

  updateUnlockedQuestsUI() {
    this.unlockedSectors.forEach(sector => {
      const sectorElement = document.getElementById(`qr_sector_${sector}`);
      if (sectorElement) {
        sectorElement.style.display = 'block';
      }
    });
  }

  startWorldEventTimers() {
    const updateTimers = () => {
      document.querySelectorAll('.timer-display').forEach(el => {
        const targetTimeStr = el.dataset.targetTime;
        if (!targetTimeStr) return;

        const target = new Date(targetTimeStr).getTime();
        const now = new Date().getTime();
        const diff = target - now;

        if (diff <= 0) {
          el.innerText = '🔥 EN VIVO AHORA EN ESCENARIO';
          el.style.color = 'var(--primary-magenta)';
        } else {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const secs = Math.floor((diff % (1000 * 60)) / 1000);
          el.innerText = `⏳ Empieza en ${hours}h ${mins}m ${secs}s`;
        }
      });
    };

    updateTimers();
    setInterval(updateTimers, 1000);
  }

  showToast(message) {
    let toast = document.getElementById('rpgToastNotification');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'rpgToastNotification';
      toast.className = 'rpg-toast';
      document.body.appendChild(toast);
    }
    toast.innerText = message;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3200);
  }

  saveProgress() {
    sessionStorage.setItem('expogeek_rpg_quests', JSON.stringify({
      xp: this.xp,
      completedQuests: Array.from(this.completedQuests),
      unlockedSectors: Array.from(this.unlockedSectors)
    }));
  }

  restoreProgress() {
    const saved = sessionStorage.getItem('expogeek_rpg_quests');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.xp = parsed.xp || 0;
        this.completedQuests = new Set(parsed.completedQuests || []);
        this.unlockedSectors = new Set(parsed.unlockedSectors || []);

        this.completedQuests.forEach(id => {
          const item = document.getElementById(`quest_item_${id}`);
          if (item) item.classList.add('completed');
          const cb = document.querySelector(`.side-quest-checkbox[data-quest-id="${id}"]`);
          if (cb) cb.checked = true;

          const statusTag = document.getElementById(`quest_tag_${id}`);
          if (statusTag) {
            statusTag.className = 'quest-status-tag tag-completed';
            statusTag.innerText = '✅ COMPLETADA';
          }
        });
      } catch (e) {
        // Fallback
      }
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.questTracker = new QuestTracker();
});
