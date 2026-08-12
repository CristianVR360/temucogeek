/**
 * ExpoGeek RPG - Dynamic Character Generator Logic
 * Progressive discovery onboarding flow, Universe-tagged Mottos Generator (1000+ combinations),
 * Custom free-text inputs for roles & traits, Dedicated Prompt Guidance Window with Selfie/Real Photo recommendation,
 * AI Photo Upload / Skip page, and Mobile Copy/Share integration.
 */

class CharacterGenerator {
  constructor() {
    this.currentStep = 0;
    this.mode = 'canon'; // 'canon' or 'oc'
    this.characterDb = [];
    this.mottosDb = null;
    this.promptLang = 'en'; // 'en' or 'es'
    this.imageAspectRatio = 1.0; // 1:1 Square

    // Character state
    this.characterData = {
      name: '',
      franchise: '',
      visualStyle: 'Fotorrealista',
      universe: 'Fantasía Epica',
      role: 'Espadachín Rúnico',
      distinctiveTrait: 'Ojos biónicos neón',
      motto: 'La victoria es el único camino.',
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
      'Fantasía Epica': ['Mago Elemental', 'Espadachín Rúnico', 'Arquero Elfo', 'Bardo de Taberna', 'Caballero Sagrado', 'Otro / Escribir mi propia clase...'],
      'Sci-Fi / Star Wars': ['Jedi Guardián', 'Cazarrecompensas Mandaloriano', 'Contrabandista Estelar', 'Sith Inquisidor', 'Piloto de Caza', 'Otro / Escribir mi propia clase...'],
      'Cyberpunk 2077': ['Netrunner Hack', 'Mercenario Solo', 'Techie Creador', 'Fixer de Callejón', 'Corpo Infiltrado', 'Otro / Escribir mi propia clase...'],
      'Steampunk': ['Alquimista de Vapor', 'Ingeniero Mecánico', 'Aviador Zepelín', 'Inventora Victoriana', 'Otro / Escribir mi propia clase...'],
      'Post-Apocalíptico': ['Nómada del Desierto', 'Chatarrero', 'Sobreviviente Mutante', 'Tirador de Élite', 'Otro / Escribir mi propia clase...'],
      'Genshin Impact / Anime World': ['Visionario Anemo', 'Guerrero Electro', 'Explorador Pyro', 'Sanador Hydro', 'Otro / Escribir mi propia clase...']
    };

    this.init();
  }

  async init() {
    await this.loadCharacterDatabase();
    await this.loadMottosDatabase();
    this.bindEvents();
    this.updatePassportUI();
    this.restoreFromLocalStorage();
  }

  async loadCharacterDatabase() {
    const paths = [
      './data/character-db.json',
      'data/character-db.json',
      '/the-quest/data/character-db.json',
      '/Temu-quest/data/character-db.json'
    ];
    for (const path of paths) {
      try {
        const response = await fetch(path);
        if (response.ok) {
          this.characterDb = await response.json();
          return;
        }
      } catch (e) {
        // Continue
      }
    }
    this.characterDb = [];
  }

  async loadMottosDatabase() {
    const paths = [
      './data/mottos-db.json',
      'data/mottos-db.json',
      '/the-quest/data/mottos-db.json',
      '/Temu-quest/data/mottos-db.json'
    ];
    for (const path of paths) {
      try {
        const response = await fetch(path);
        if (response.ok) {
          this.mottosDb = await response.json();
          return;
        }
      } catch (e) {
        // Continue
      }
    }
  }

  generateRandomMotto(universe = this.characterData.universe) {
    if (this.mottosDb) {
      const list = this.mottosDb.universeMottos[universe] || this.mottosDb.universeMottos['Fantasía Epica'];
      const gen = this.mottosDb.generators;

      if (Math.random() > 0.5 && list && list.length > 0) {
        return list[Math.floor(Math.random() * list.length)];
      } else if (gen) {
        const prefix = gen.prefixes[Math.floor(Math.random() * gen.prefixes.length)];
        const value = gen.values[Math.floor(Math.random() * gen.values.length)];
        const suffix = gen.suffixes[Math.floor(Math.random() * gen.suffixes.length)];
        return `${prefix} ${value}, ${suffix}`;
      }
    }
    return "Por el honor y la gloria, la victoria es el único camino.";
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
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime);
        osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.08);
        osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.16);
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.25);
      }
    } catch (err) {
      // Audio fallback
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

    // Progressive Onboarding Navigation Handlers
    document.getElementById('btnStartAdventure')?.addEventListener('click', () => {
      this.showDiscoveryStep(1);
    });

    document.getElementById('btnGotoStep2')?.addEventListener('click', () => {
      this.showDiscoveryStep(2);
    });

    document.getElementById('btnBackToStep1')?.addEventListener('click', () => {
      this.showDiscoveryStep(1);
    });

    // Step 2 -> Step 3 (Dedicated Prompt Result Window)
    document.getElementById('btnConfirmDetailsPrompt')?.addEventListener('click', () => {
      this.showDiscoveryStep(3);
    });

    document.getElementById('btnBackToStep2')?.addEventListener('click', () => {
      this.showDiscoveryStep(2);
    });

    // Step 3 -> Step 4 (AI Photo Upload / Skip Page)
    document.getElementById('btnGotoPhotoStep')?.addEventListener('click', () => {
      this.showDiscoveryStep(4);
    });

    document.getElementById('btnBackToStep3')?.addEventListener('click', () => {
      this.showDiscoveryStep(3);
    });

    // Step 4 -> Step 5 (Confirm & Show Final Hero Card)
    document.getElementById('btnProceedToCard')?.addEventListener('click', () => {
      this.showDiscoveryStep(5);
      if (window.questTracker) {
        window.questTracker.completeQuest('q_generator', 100);
      }
    });

    document.getElementById('btnSkipPhotoToCard')?.addEventListener('click', () => {
      this.showDiscoveryStep(5);
      if (window.questTracker) {
        window.questTracker.completeQuest('q_generator', 100);
      }
    });

    // Return from Step 5 (Hero Card) to Step 2 (Edit)
    document.getElementById('btnEditCredential')?.addEventListener('click', () => {
      this.showDiscoveryStep(2);
    });

    // Motto Generator Button
    document.getElementById('btnGenerateRandomMotto')?.addEventListener('click', () => {
      const randomMotto = this.generateRandomMotto(this.characterData.universe);
      this.characterData.motto = randomMotto;
      const input = document.getElementById('ocMottoInput');
      if (input) input.value = randomMotto;
      this.updatePassportUI();
      this.playAudioEffect('click');
      window.questTracker?.showToast('🎲 ¡Lema aleatorio generado!');
    });

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
              <span style="font-weight: 600; color: #fff;">${m.name}</span>
              <span style="font-size: 0.75rem; color: var(--primary-cyan); background: rgba(0,240,255,0.1); padding: 2px 8px; border-radius: 10px;">${m.franchise}</span>
            </div>
          `).join('');
          dropdown.classList.add('active');

          dropdown.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
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

    // Custom Visual Style Input
    document.getElementById('customStyleInput')?.addEventListener('input', (e) => {
      if (e.target.value.trim().length > 0) {
        this.characterData.visualStyle = e.target.value.trim();
        this.updatePassportUI();
      }
    });

    // OC Universe Select Change
    const ocUniverseSelect = document.getElementById('ocUniverseSelect');
    if (ocUniverseSelect) {
      ocUniverseSelect.addEventListener('change', (e) => {
        this.characterData.universe = e.target.value;
        this.updateRoleOptionsForUniverse(e.target.value);
        this.updatePassportUI();
      });
    }

    // OC Role Select & Custom Free-text Input Handler
    const ocRoleSelect = document.getElementById('ocRoleSelect');
    const customRoleGroup = document.getElementById('customRoleGroup');
    if (ocRoleSelect) {
      ocRoleSelect.addEventListener('change', (e) => {
        if (e.target.value.includes('Otro')) {
          if (customRoleGroup) customRoleGroup.style.display = 'block';
        } else {
          if (customRoleGroup) customRoleGroup.style.display = 'none';
          this.characterData.role = e.target.value;
          this.updatePassportUI();
        }
      });
    }

    document.getElementById('customRoleInput')?.addEventListener('input', (e) => {
      this.characterData.role = e.target.value.trim() || 'Aventurero';
      this.updatePassportUI();
    });

    // OC Trait Select & Custom Free-text Input Handler
    const ocTraitSelect = document.getElementById('ocTraitSelect');
    const customTraitGroup = document.getElementById('customTraitGroup');
    if (ocTraitSelect) {
      ocTraitSelect.addEventListener('change', (e) => {
        if (e.target.value.includes('Otro')) {
          if (customTraitGroup) customTraitGroup.style.display = 'block';
        } else {
          if (customTraitGroup) customTraitGroup.style.display = 'none';
          this.characterData.distinctiveTrait = e.target.value;
          this.updatePassportUI();
        }
      });
    }

    document.getElementById('customTraitInput')?.addEventListener('input', (e) => {
      this.characterData.distinctiveTrait = e.target.value.trim() || 'Aura Mística';
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

    // Avatar Photo Upload (In Step 4)
    const avatarInput = document.getElementById('avatarFileInput');
    if (avatarInput) {
      avatarInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            this.characterData.avatarUrl = event.target.result;

            const img = new Image();
            img.onload = () => {
              if (img.naturalWidth && img.naturalHeight) {
                this.imageAspectRatio = img.naturalWidth / img.naturalHeight;
              }
              this.updatePassportUI();
              this.playAudioEffect('success');
            };
            img.src = event.target.result;
          };
          reader.readAsDataURL(file);
        }
      });
    }

    // Copy Prompt Button
    document.getElementById('btnCopyPrompt')?.addEventListener('click', () => {
      const promptText = document.getElementById('generatedPromptText').innerText;
      navigator.clipboard.writeText(promptText).then(() => {
        window.questTracker?.showToast('✨ ¡Prompt copiado! Pégalo en ChatGPT, Gemini o Midjourney');
        this.playAudioEffect('success');
      });
    });

    // Translate Prompt Toggle Button
    document.getElementById('btnTranslatePrompt')?.addEventListener('click', () => {
      this.promptLang = this.promptLang === 'en' ? 'es' : 'en';
      const btn = document.getElementById('btnTranslatePrompt');
      if (btn) {
        btn.innerHTML = this.promptLang === 'en' ? '🌐 Traducir a Español' : '🇬🇧 Ver en Inglés';
      }
      this.updatePassportUI();
      this.playAudioEffect('click');
    });
  }

  showDiscoveryStep(stepNum) {
    this.currentStep = stepNum;
    document.querySelectorAll('.discovery-section').forEach(s => s.style.display = 'none');
    const target = document.getElementById(`discoveryStep${stepNum}`);
    if (target) target.style.display = 'block';

    const tag = document.getElementById('progressiveStepTag');
    if (tag) {
      const titles = {
        0: 'El Despertar 🔰',
        1: 'Paso 1: Origen ⚔️',
        2: 'Paso 2: Detalles 🎨',
        3: 'Paso 3: Prompt Resultante 🤖',
        4: 'Paso 4: Foto IA 📸',
        5: 'Paso 5: Credencial Oficial ✨'
      };
      tag.innerText = titles[stepNum] || 'Aventura RPG';
    }

    // Show navbar mini-profile once we have character data
    this.updateNavbarProfile();

    this.playAudioEffect('click');
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  /**
   * Compiles the AI prompt with explicit selfie/real reference photo instruction requested by user:
   * "En caso de haber una imagen de referencia o selfie adjunta, úsala para personificar a mi personaje..."
   */
  compilePrompt(lang = this.promptLang) {
    const selfieInstructionEs = "En caso de haber una imagen de referencia o selfie adjunta, úsala para personificar a mi personaje adaptando sus rasgos de rostro.";
    const selfieInstructionEn = "If a reference photo or selfie is attached, use it to personify my character by adapting facial features and expression.";
    const arTag = '--ar 1:1';
    
    if (lang === 'es') {
      if (this.mode === 'canon') {
        const charName = this.characterData.name || 'Denji';
        const franchise = this.characterData.franchise ? `de ${this.characterData.franchise}` : '';
        const style = this.characterData.visualStyle || 'Fotorrealista';

        return `Un retrato de cosplay de alta calidad de ${charName} ${franchise}. ${selfieInstructionEs} Mantiene el atuendo, colores y accesorios icónicos del personaje. Estilo visual: ${style}. Formato cuadrado 1:1, resolución 8k, iluminación cinematográfica ${arTag}`;
      } else {
        const charName = this.characterData.name || 'Aventurero Desconocido';
        const role = this.characterData.role || 'Espadachín Rúnico';
        const universe = this.characterData.universe || 'Fantasía Epica';
        const trait = this.characterData.distinctiveTrait || 'Ojos biónicos neón';
        const motto = this.characterData.motto || 'La victoria es el único camino';

        return `Un diseño de personaje de arte conceptual altamente detallado en formato cuadrado 1:1. El personaje es un/a ${role} original llamado/a ${charName} en el universo de ${universe}. ${selfieInstructionEs} Rasgo distintivo: ${trait}. Expresión basada en el lema: '${motto}'. Estilo visual: ${this.characterData.visualStyle || 'Fotorrealista'}. Resolución 8k, iluminación volumétrica ${arTag}`;
      }
    } else {
      if (this.mode === 'canon') {
        const charName = this.characterData.name || 'Denji';
        const franchise = this.characterData.franchise ? `from ${this.characterData.franchise}` : '';
        const style = this.characterData.visualStyle || 'Fotorrealista';

        return `A high quality cosplay portrait of ${charName} ${franchise}. ${selfieInstructionEn} Keep the iconic outfit, colors, and props of the character. Visual style: ${style}. 1:1 square ratio, 8k resolution, cinematic lighting ${arTag}`;
      } else {
        const charName = this.characterData.name || 'Aventurero Desconocido';
        const role = this.characterData.role || 'Espadachín Rúnico';
        const universe = this.characterData.universe || 'Fantasía Epica';
        const trait = this.characterData.distinctiveTrait || 'Ojos biónicos neón';
        const motto = this.characterData.motto || 'La victoria es el único camino';

        return `A detailed concept art character design in 1:1 square format. The character is an original ${role} named ${charName} existing in the universe of ${universe}. ${selfieInstructionEn} Distinctive feature: ${trait}. Facial expression reflects motto: '${motto}'. Visual style: ${this.characterData.visualStyle || 'Fotorrealista'}. 8k resolution, volumetric lighting ${arTag}`;
      }
    }
  }

  updatePassportUI() {
    const promptDisplay = document.getElementById('generatedPromptText');

    const name = this.characterData.name || (this.mode === 'canon' ? 'Personaje Canon' : 'Nuevo Aventurero');
    const role = this.mode === 'canon' ? `Cosplay: ${this.characterData.name || 'Canon'}` : `${this.characterData.role} (${this.characterData.universe})`;

    const compiledPrompt = this.compilePrompt();
    if (promptDisplay) promptDisplay.innerText = compiledPrompt;

    // Update Hero Credential Card elements (Step 5)
    const heroAvatar = document.getElementById('heroAvatarDisplay');
    const heroName = document.getElementById('heroNameDisplay');
    const heroRole = document.getElementById('heroRoleDisplay');
    const heroMotto = document.getElementById('heroMottoText');
    const heroTrait = document.getElementById('heroTraitDisplay');
    const heroStyle = document.getElementById('heroStyleDisplay');

    if (heroAvatar && this.characterData.avatarUrl) {
      heroAvatar.src = this.characterData.avatarUrl;
    }
    if (heroName) heroName.innerText = name;
    if (heroRole) heroRole.innerText = role;
    if (heroMotto) heroMotto.innerText = `"${this.characterData.motto || 'La victoria es el único camino.'}"`;
    if (heroTrait) heroTrait.innerText = this.mode === 'oc' ? this.characterData.distinctiveTrait : (this.characterData.franchise || 'Canon');
    if (heroStyle) heroStyle.innerText = this.characterData.visualStyle || 'Fotorrealista';

    // Also update navbar mini-profile and persist to session
    this.updateNavbarProfile();
    this.saveCharacterToSession();
  }

  /** Updates the compact navbar mini-profile with character name, role, and avatar */
  updateNavbarProfile() {
    const profileEl = document.getElementById('navCharProfile');
    if (!profileEl) return;

    const name = this.characterData.name;
    if (!name || name.length < 1) {
      profileEl.style.display = 'none';
      return;
    }

    profileEl.style.display = 'flex';
    const avatarEl = document.getElementById('navCharAvatar');
    const nameEl = document.getElementById('navCharName');
    const roleEl = document.getElementById('navCharRole');

    if (nameEl) nameEl.innerText = name;
    if (roleEl) {
      roleEl.innerText = this.mode === 'canon'
        ? (this.characterData.franchise || 'Canon')
        : (this.characterData.role || 'Aventurero');
    }
    if (avatarEl && this.characterData.avatarUrl) {
      avatarEl.src = this.characterData.avatarUrl;
    }
  }

  /** Saves character data to both sessionStorage and localStorage for seamless cross-page QR hydration */
  saveCharacterToSession() {
    const payload = JSON.stringify({
      mode: this.mode,
      name: this.characterData.name,
      role: this.characterData.role,
      franchise: this.characterData.franchise,
      universe: this.characterData.universe,
      visualStyle: this.characterData.visualStyle,
      avatarUrl: this.characterData.avatarUrl,
      motto: this.characterData.motto,
      distinctiveTrait: this.characterData.distinctiveTrait
    });
    sessionStorage.setItem('expogeek_rpg_character', payload);
    localStorage.setItem('expogeek_rpg_character_flat', payload);
    this.saveToLocalStorage();
  }

  saveToLocalStorage() {
    localStorage.setItem('expogeek_rpg_character', JSON.stringify({
      mode: this.mode,
      characterData: this.characterData,
      imageAspectRatio: this.imageAspectRatio
    }));
  }

  restoreFromLocalStorage() {
    const saved = localStorage.getItem('expogeek_rpg_character');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.mode = parsed.mode || 'canon';
        this.characterData = { ...this.characterData, ...parsed.characterData };
        this.imageAspectRatio = parsed.imageAspectRatio || 1.0;
        this.updatePassportUI();
        this.toggleModeFormFields();
      } catch (e) {
        // Fallback
      }
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.characterGenerator = new CharacterGenerator();
});
