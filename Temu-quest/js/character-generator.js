/**
 * ExpoGeek RPG - Dynamic Character Generator Logic
 * Manages the branching wizard state (Canon vs OC), autocomplete, and prompt compilation.
 */

class CharacterGenerator {
  constructor() {
    this.currentStep = 1;
    this.mode = 'canon'; // 'canon' or 'oc'
    this.characterDb = [];

    // Character state
    this.characterData = {
      name: '',
      franchise: '',
      visualStyle: 'Fotorrealista',
      universe: 'Fantasía Epica',
      role: 'Espadachín',
      distinctiveTrait: 'Ojos biónicos neón',
      motto: 'La victoria es el único camino',
      avatarUrl: '',
      stats: {
        fuerza: 85,
        carisma: 78,
        agilidad: 90,
        sabiduria: 82
      }
    };

    // Preset Role mapping per Universe for OC mode
    this.rolePresets = {
      'Fantasía Epica': ['Mago Elemental', 'Espadachín Rúnico', 'Arquero Elfo', 'Bardo de Taberna', 'Caballero Sagrado'],
      'Sci-Fi / Star Wars': ['Jedi Guardián', 'Cazarrecompensas Mandaloriano', 'Contrabandista Estelar', 'Sith Inquisidor', 'Piloto de Caza'],
      'Cyberpunk 2077': ['Netrunner Hack', 'Mercenario Solo', 'Techie Creador', 'Fixer de Callejón', 'Corpo Infiltrado'],
      'Steampunk': ['Alquimista de Vapor', 'Ingeniero Mecánico', 'Aviador Zepelín', 'Inventora Victoriana'],
      'Post-Apocalíptico': ['Nómada del Desierto', 'Chatarrero', 'Sobreviviente Mutante', 'Tirador de Élite'],
      'Genshin Impact / Anime World': ['Visionario Anemo', 'Guerrero Electro', 'Explorador Pyro', 'Sanador Hydro']
    };

    this.init();
  }

  async init() {
    await this.loadCharacterDatabase();
    this.bindEvents();
    this.updatePassportUI();
    this.restoreFromLocalStorage();
  }

  async loadCharacterDatabase() {
    try {
      const response = await fetch('./data/character-db.json');
      if (response.ok) {
        this.characterDb = await response.json();
      }
    } catch (e) {
      console.warn('Could not load offline character DB, fallback to empty array', e);
      this.characterDb = [];
    }
  }

  playAudioEffect(type) {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === 'click') {
        osc.frequency.setValueAtTime(440, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.08);
      } else if (type === 'success') {
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.08); // E5
        osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.16); // G5
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.25);
      }
    } catch (err) {
      // Ignore if browser blocks AudioContext prior to user interaction
    }
  }

  bindEvents() {
    // Mode selection (Bifurcation)
    document.querySelectorAll('.bifurcation-card').forEach(card => {
      card.addEventListener('click', (e) => {
        document.querySelectorAll('.bifurcation-card').forEach(c => c.classList.remove('selected'));
        const target = e.currentTarget;
        target.classList.add('selected');
        this.mode = target.dataset.mode;
        this.playAudioEffect('click');
        this.toggleModeFormFields();
      });
    });

    // Step Navigation
    document.getElementById('btnWizardNext')?.addEventListener('click', () => this.nextStep());
    document.getElementById('btnWizardPrev')?.addEventListener('click', () => this.prevStep());

    // Search input autocompletion (Canon mode)
    const canonInput = document.getElementById('canonCharInput');
    const dropdown = document.getElementById('charSuggestions');

    if (canonInput && dropdown) {
      canonInput.addEventListener('input', (e) => {
        const query = e.target.value.trim().toLowerCase();
        this.characterData.name = e.target.value;
        this.updatePassportUI();

        if (query.length < 2) {
          dropdown.classList.remove('active');
          return;
        }

        const matches = this.characterDb.filter(c => 
          c.name.toLowerCase().includes(query) || 
          c.franchise.toLowerCase().includes(query) ||
          c.tags.some(t => t.toLowerCase().includes(query))
        ).slice(0, 5);

        if (matches.length > 0) {
          dropdown.innerHTML = matches.map(m => `
            <div class="suggestion-item" data-name="${m.name}" data-franchise="${m.franchise}">
              <span class="suggestion-name">${m.name}</span>
              <span class="suggestion-tag">${m.franchise}</span>
            </div>
          `).join('');
          dropdown.classList.add('active');

          dropdown.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', (ev) => {
              const name = item.dataset.name;
              const franchise = item.dataset.franchise;
              canonInput.value = name;
              this.characterData.name = name;
              this.characterData.franchise = franchise;
              dropdown.classList.remove('active');
              this.playAudioEffect('click');
              this.updatePassportUI();
            });
          });
        } else {
          dropdown.classList.remove('active');
        }
      });
    }

    // Visual Style Pills
    document.querySelectorAll('.pill-option').forEach(pill => {
      pill.addEventListener('click', (e) => {
        document.querySelectorAll('.pill-option').forEach(p => p.classList.remove('selected'));
        e.currentTarget.classList.add('selected');
        this.characterData.visualStyle = e.currentTarget.dataset.style;
        this.playAudioEffect('click');
        this.updatePassportUI();
      });
    });

    // OC Universe Select Change -> Updates conditional roles dropdown
    const ocUniverseSelect = document.getElementById('ocUniverseSelect');
    if (ocUniverseSelect) {
      ocUniverseSelect.addEventListener('change', (e) => {
        this.characterData.universe = e.target.value;
        this.updateRoleOptionsForUniverse(e.target.value);
        this.updatePassportUI();
      });
    }

    // OC Role Select Change
    const ocRoleSelect = document.getElementById('ocRoleSelect');
    if (ocRoleSelect) {
      ocRoleSelect.addEventListener('change', (e) => {
        this.characterData.role = e.target.value;
        this.updatePassportUI();
      });
    }

    // OC Trait & Motto Change
    document.getElementById('ocTraitSelect')?.addEventListener('change', (e) => {
      this.characterData.distinctiveTrait = e.target.value;
      this.updatePassportUI();
    });

    document.getElementById('ocMottoInput')?.addEventListener('input', (e) => {
      this.characterData.motto = e.target.value;
      this.updatePassportUI();
    });

    document.getElementById('ocNameInput')?.addEventListener('input', (e) => {
      this.characterData.name = e.target.value;
      this.updatePassportUI();
    });

    // Avatar Photo Upload
    const avatarInput = document.getElementById('avatarFileInput');
    if (avatarInput) {
      avatarInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            this.characterData.avatarUrl = event.target.result;
            this.updatePassportUI();
            this.playAudioEffect('success');
          };
          reader.readAsDataURL(file);
        }
      });
    }

    // Copy Prompt Button
    document.getElementById('btnCopyPrompt')?.addEventListener('click', () => {
      const promptText = document.getElementById('generatedPromptText').innerText;
      navigator.clipboard.writeText(promptText).then(() => {
        window.questTracker?.showToast('✨ ¡Prompt copiado al portapapeles!');
        this.playAudioEffect('success');
      });
    });
  }

  toggleModeFormFields() {
    const canonStepContent = document.getElementById('stepContentCanon');
    const ocStepContent = document.getElementById('stepContentOC');

    if (this.mode === 'canon') {
      if (canonStepContent) canonStepContent.style.display = 'block';
      if (ocStepContent) ocStepContent.style.display = 'none';
    } else {
      if (canonStepContent) canonStepContent.style.display = 'none';
      if (ocStepContent) ocStepContent.style.display = 'block';
      this.updateRoleOptionsForUniverse(this.characterData.universe);
    }
  }

  updateRoleOptionsForUniverse(universe) {
    const roleSelect = document.getElementById('ocRoleSelect');
    if (!roleSelect) return;

    const roles = this.rolePresets[universe] || this.rolePresets['Fantasía Epica'];
    roleSelect.innerHTML = roles.map(r => `<option value="${r}">${r}</option>`).join('');
    this.characterData.role = roles[0];
  }

  nextStep() {
    if (this.currentStep < 3) {
      this.currentStep++;
      this.updateStepUI();
      this.playAudioEffect('click');
    } else {
      // Step 3 finished -> Save & Award Quest 1
      this.saveToLocalStorage();
      window.questTracker?.completeQuest('q_generator');
      window.questTracker?.showToast('🎉 ¡Misión "Crear Aventurero" Completada (+100 XP)!');
      this.playAudioEffect('success');
    }
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.updateStepUI();
      this.playAudioEffect('click');
    }
  }

  updateStepUI() {
    document.querySelectorAll('.step-node').forEach((node, idx) => {
      const stepNum = idx + 1;
      node.classList.remove('active', 'completed');
      if (stepNum === this.currentStep) {
        node.classList.add('active');
      } else if (stepNum < this.currentStep) {
        node.classList.add('completed');
      }
    });

    // Hide/Show Wizard Panels
    document.querySelectorAll('.wizard-panel').forEach(p => p.style.display = 'none');
    const activePanel = document.getElementById(`wizardStep${this.currentStep}`);
    if (activePanel) activePanel.style.display = 'block';

    // Update buttons text
    const btnNext = document.getElementById('btnWizardNext');
    if (btnNext) {
      btnNext.innerHTML = this.currentStep === 3 ? 'Finalizar Ficha ✨' : 'Siguiente ➔';
    }
  }

  compilePrompt() {
    const photoRef = this.characterData.avatarUrl ? '[[USER_PHOTO_URL]]' : '[[USER_REFERENCE]]';
    
    if (this.mode === 'canon') {
      const charName = this.characterData.name || 'Denji';
      const franchise = this.characterData.franchise ? `from ${this.characterData.franchise}` : '';
      const style = this.characterData.visualStyle || 'Fotorrealista';

      return `A highly detailed cosplay portrait of ${photoRef} as ${charName} ${franchise}. Keep the exact iconic outfit, colors, and props of the character, but adapt the facial features to match the reference photo. Style: ${style}. 8k resolution, cinematic lighting, masterpiece.`;
    } else {
      const charName = this.characterData.name || 'Aventurero Desconocido';
      const role = this.characterData.role || 'Espadachín Rúnico';
      const universe = this.characterData.universe || 'Fantasía Epica';
      const trait = this.characterData.distinctiveTrait || 'Ojos biónicos neón';
      const motto = this.characterData.motto || 'La victoria es el único camino';

      return `A detailed concept art character design inspired by the facial structure of ${photoRef}. The character is an original ${role} named ${charName} existing in the universe of ${universe}. Distinctive feature: ${trait}. Wearing lore-accurate armor and clothing. Facial expression reflects the motto: '${motto}'. 8k resolution, volumetric lighting, epic framing.`;
    }
  }

  updatePassportUI() {
    const displayName = document.getElementById('passportNameDisplay');
    const displayRole = document.getElementById('passportRoleDisplay');
    const promptDisplay = document.getElementById('generatedPromptText');
    const avatarImg = document.getElementById('passportAvatarImg');

    const name = this.characterData.name || (this.mode === 'canon' ? 'Personaje Canon' : 'Nuevo Aventurero');
    const role = this.mode === 'canon' ? `Cosplay: ${this.characterData.name || 'Canon'}` : `${this.characterData.role} (${this.characterData.universe})`;

    if (displayName) displayName.innerText = name;
    if (displayRole) displayRole.innerText = role;

    if (avatarImg && this.characterData.avatarUrl) {
      avatarImg.src = this.characterData.avatarUrl;
    }

    const compiledPrompt = this.compilePrompt();
    if (promptDisplay) promptDisplay.innerText = compiledPrompt;

    // Randomize stat bars slightly based on character name length for fun RPG feel
    const seed = (name.length * 7) % 30;
    const strBar = document.getElementById('statStrFill');
    const agiBar = document.getElementById('statAgiFill');
    const intBar = document.getElementById('statIntFill');

    if (strBar) strBar.style.width = `${Math.min(100, 70 + seed)}%`;
    if (agiBar) agiBar.style.width = `${Math.min(100, 65 + (seed * 2) % 35)}%`;
    if (intBar) intBar.style.width = `${Math.min(100, 75 + (seed * 3) % 25)}%`;
  }

  saveToLocalStorage() {
    localStorage.setItem('expogeek_rpg_character', JSON.stringify({
      mode: this.mode,
      characterData: this.characterData
    }));
  }

  restoreFromLocalStorage() {
    const saved = localStorage.getItem('expogeek_rpg_character');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.mode = parsed.mode || 'canon';
        this.characterData = { ...this.characterData, ...parsed.characterData };
        this.updatePassportUI();
        this.toggleModeFormFields();
      } catch (e) {
        console.warn('Could not restore character from LocalStorage', e);
      }
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.characterGenerator = new CharacterGenerator();
});
