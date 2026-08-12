/**
 * ExpoGeek RPG - Quest Tracker & Live Event Engine
 * Handles main quest secret code verification, side quest checklists, world events timers, and XP rank system.
 */

class QuestTracker {
  constructor() {
    this.xp = 0;
    this.completedQuests = new Set();

    // Main Quest Riddle Answers (Case-insensitive verification)
    this.mainQuestSecrets = {
      step1: 'NORTE', // Riddle 1 code word
      step2: 'JEDI', // Riddle 2 code word (buscar Cosplayer)
      step3: 'ALFA-OMEGA-GEEK' // Final code to tell Jedi Cristian / Esteban
    };

    this.init();
  }

  init() {
    this.restoreProgress();
    this.bindEvents();
    this.startWorldEventTimers();
    this.updateRankUI();
  }

  bindEvents() {
    // Main Quest Step 1 secret code verification
    document.getElementById('btnVerifyMQ1')?.addEventListener('click', () => {
      const input = document.getElementById('inputMQ1')?.value.trim().toUpperCase();
      if (input === this.mainQuestSecrets.step1 || input.includes('NORTE')) {
        this.completeQuest('mq_step1');
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
      if (input === this.mainQuestSecrets.step3 || input.includes('ALFA-OMEGA')) {
        this.completeQuest('mq_final');
        document.getElementById('mqFinalContent').innerHTML = `
          <div style="color: var(--primary-gold); font-weight: bold; padding: 12px; background: rgba(255,183,0,0.15); border: 1px solid var(--primary-gold); border-radius: 8px;">
            🏆 ¡MAIN QUEST COMPLETADA! Muestra este código en el escenario principal para reclamar tu Pin de Honor y Ticket de Sorteo.
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
  }

  completeQuest(questId, xpReward = 100) {
    if (!this.completedQuests.has(questId)) {
      this.completedQuests.add(questId);
      this.xp += xpReward;

      const item = document.getElementById(`quest_item_${questId}`);
      if (item) item.classList.add('completed');

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
    if (this.xp >= 1000) return { title: 'Leyenda Geek de Temuco 👑', color: 'var(--primary-gold)', nextXp: 1000 };
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
    }, 3000);
  }

  saveProgress() {
    localStorage.setItem('expogeek_rpg_quests', JSON.stringify({
      xp: this.xp,
      completedQuests: Array.from(this.completedQuests)
    }));
  }

  restoreProgress() {
    const saved = localStorage.getItem('expogeek_rpg_quests');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.xp = parsed.xp || 0;
        this.completedQuests = new Set(parsed.completedQuests || []);

        this.completedQuests.forEach(id => {
          const item = document.getElementById(`quest_item_${id}`);
          if (item) item.classList.add('completed');
          const cb = document.querySelector(`.side-quest-checkbox[data-quest-id="${id}"]`);
          if (cb) cb.checked = true;
        });
      } catch (e) {
        console.warn('Could not restore quest progress', e);
      }
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.questTracker = new QuestTracker();
});
