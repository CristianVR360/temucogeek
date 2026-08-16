/**
 * ExpoGeek RPG - Character Generator (Classic RPG Edition)
 * Simplified flow: Name + Race + Class + Gender → 4 AI Avatars → Credencial
 * Designed for fast usage at a live event with classic fantasy RPG archetypes.
 */

class CharacterGenerator {
  constructor() {
    this.currentStep = 0;
    this.mode = 'oc';
    this.characterDb = [];
    this.mottosDb = null;
    this.promptLang = 'en';
    this.imageAspectRatio = 1.0;
    this.avatarSeedSalt = 1;
    this.selectedAvatarIndex = 0;

    this.characterData = {
      name: 'Aventurero Geek',
      race: 'Humano',
      rpgClass: 'Guerrero',
      gender: 'H',
      motto: 'La victoria es el único camino.',
      avatarUrl: '',
      stats: { fuerza: 85, carisma: 78, agilidad: 90, sabiduria: 82 }
    };

    this.init();
  }

  async init() {
    await this.loadCharacterDatabase();
    await this.loadMottosDatabase();
    this.bindEvents();
    this.renderAvatarPicker();
    this.updatePassportUI();
    this.restoreFromLocalStorage();
  }

  async loadCharacterDatabase() {
    const paths = ['./data/character-db.json', 'data/character-db.json', '/the-quest/data/character-db.json', '/Temu-quest/data/character-db.json'];
    for (const path of paths) {
      try { const r = await fetch(path); if (r.ok) { this.characterDb = await r.json(); return; } } catch (e) {}
    }
    this.characterDb = [];
  }

  async loadMottosDatabase() {
    const paths = ['./data/mottos-db.json', 'data/mottos-db.json', '/the-quest/data/mottos-db.json', '/Temu-quest/data/mottos-db.json'];
    for (const path of paths) {
      try { const r = await fetch(path); if (r.ok) { this.mottosDb = await r.json(); return; } } catch (e) {}
    }
  }

  generateRandomMotto() {
    if (this.mottosDb) {
      const list = this.mottosDb.universeMottos?.['Fantasía Epica'] || [];
      const gen = this.mottosDb.generators;
      if (Math.random() > 0.5 && list.length > 0) {
        return list[Math.floor(Math.random() * list.length)];
      } else if (gen) {
        return `${gen.prefixes[Math.floor(Math.random() * gen.prefixes.length)]} ${gen.values[Math.floor(Math.random() * gen.values.length)]}, ${gen.suffixes[Math.floor(Math.random() * gen.suffixes.length)]}`;
      }
    }
    return 'Por el honor y la gloria, la victoria es el único camino.';
  }

  playAudioEffect(type) {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      if (type === 'click') {
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
        osc.start(); osc.stop(ctx.currentTime + 0.08);
      } else if (type === 'success') {
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08);
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.16);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.start(); osc.stop(ctx.currentTime + 0.25);
      }
    } catch (err) {}
  }

  // ── Race to folder key mapping ──
  getRaceKey(race) {
    const map = {
      'Humano': 'humano',
      'Elfo': 'elfo',
      'Enano': 'enano',
      'Orco': 'orco',
      'Halfling': 'halfling',
      'No-Muerto': 'nomuerto'
    };
    return map[race] || 'humano';
  }

  getGenderKey(gender) {
    // H → h, M → m, Otro → h (default)
    return gender === 'M' ? 'm' : 'h';
  }

  getAvatarOptions() {
    const raceKey = this.getRaceKey(this.characterData.race);
    const genderKey = this.getGenderKey(this.characterData.gender);
    const basePath = '/assets/img/rpg-avatars';

    if (raceKey === 'orco') {
      return [
        { id: 1, label: `👹 Orco`, url: `${basePath}/orco_h_1.png` }
      ];
    }

    return [
      { id: 1, label: `⚔️ ${this.characterData.race} I`,  url: `${basePath}/${raceKey}_${genderKey}_1.png` },
      { id: 2, label: `🛡️ ${this.characterData.race} II`, url: `${basePath}/${raceKey}_${genderKey}_2.png` },
      { id: 3, label: `✨ ${this.characterData.race} III`, url: `${basePath}/${raceKey}_${genderKey === 'h' ? 'm' : 'h'}_1.png` },
      { id: 4, label: `🎨 ${this.characterData.race} IV`,  url: `${basePath}/${raceKey}_${genderKey === 'h' ? 'm' : 'h'}_2.png` }
    ];
  }

  renderAvatarPicker() {
    const container = document.getElementById('avatarPickerGrid');
    if (!container) return;

    const options = this.getAvatarOptions();
    if (this.selectedAvatarIndex >= options.length) {
      this.selectedAvatarIndex = 0;
    }
    this.characterData.avatarUrl = options[this.selectedAvatarIndex || 0].url;

    container.innerHTML = options.map((opt, idx) => {
      const isSelected = (idx === (this.selectedAvatarIndex || 0));
      return `
        <div class="avatar-card-option ${isSelected ? 'selected' : ''}" data-index="${idx}">
          <div class="selected-badge">✓</div>
          <img src="${opt.url}" alt="${opt.label}" loading="eager"
            style="width:100%;aspect-ratio:1/1;object-fit:cover;display:block;border-radius:var(--radius-sm);background:#0b0e1b;">
          <span class="avatar-label">${opt.label}</span>
        </div>
      `;
    }).join('');

    container.querySelectorAll('.avatar-card-option').forEach(card => {
      card.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.dataset.index, 10);
        this.selectedAvatarIndex = idx;
        this.characterData.avatarUrl = options[idx].url;
        container.querySelectorAll('.avatar-card-option').forEach(c => c.classList.remove('selected'));
        e.currentTarget.classList.add('selected');
        this.playAudioEffect('click');
        this.updatePassportUI();
      });
    });
  }

  bindEvents() {
    // ── Quick Form: Name ──
    document.getElementById('quickNameInput')?.addEventListener('input', (e) => {
      this.characterData.name = e.target.value.trim() || 'Aventurero Geek';
      this.updatePassportUI();
    });

    // ── Quick Form: Race ──
    document.getElementById('quickRaceSelect')?.addEventListener('change', (e) => {
      this.characterData.race = e.target.value;
      this.renderAvatarPicker();
      this.updatePassportUI();
    });

    // ── Quick Form: Class ──
    document.getElementById('quickClassSelect')?.addEventListener('change', (e) => {
      this.characterData.rpgClass = e.target.value;
      this.renderAvatarPicker();
      this.updatePassportUI();
    });

    // ── Quick Form: Gender ──
    document.querySelectorAll('.gender-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.gender-btn').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.characterData.gender = e.currentTarget.dataset.gender;
        this.playAudioEffect('click');
        this.renderAvatarPicker();
        this.updatePassportUI();
      });
    });

    // ── Refresh Avatars ──
    document.getElementById('btnRefreshAvatars')?.addEventListener('click', () => {
      this.avatarSeedSalt = (this.avatarSeedSalt || 1) + 1;
      this.playAudioEffect('click');
      this.renderAvatarPicker();
      this.updatePassportUI();
    });

    // ── Create Credential (Step 0 → Step 5) ──
    document.getElementById('btnCreateDirectCard')?.addEventListener('click', () => {
      const name = document.getElementById('quickNameInput')?.value;
      this.characterData.name = name?.trim() || 'Aventurero Geek';
      this.characterData.motto = this.generateRandomMotto();
      this.updatePassportUI();
      this.showDiscoveryStep(5);
      this.playAudioEffect('success');
      window.questTracker?.completeQuest('q_generator', 100);
    });

    // ── Edit from Card (Step 5 → Step 0) ──
    document.getElementById('btnEditCredential')?.addEventListener('click', () => {
      this.showDiscoveryStep(0);
    });

    // ── Legacy backward-compat buttons (steps 1-4 still in HTML) ──
    document.getElementById('btnStartAdventure')?.addEventListener('click', () => this.showDiscoveryStep(1));
    document.getElementById('btnGotoStep2')?.addEventListener('click', () => this.showDiscoveryStep(2));
    document.getElementById('btnBackToStep1')?.addEventListener('click', () => this.showDiscoveryStep(0));
    document.getElementById('btnConfirmDetailsPrompt')?.addEventListener('click', () => this.showDiscoveryStep(3));
    document.getElementById('btnBackToStep2')?.addEventListener('click', () => this.showDiscoveryStep(0));
    document.getElementById('btnGotoPhotoStep')?.addEventListener('click', () => this.showDiscoveryStep(4));
    document.getElementById('btnBackToStep3')?.addEventListener('click', () => this.showDiscoveryStep(3));
    document.getElementById('btnProceedToCard')?.addEventListener('click', () => { this.showDiscoveryStep(5); window.questTracker?.completeQuest('q_generator', 100); });
    document.getElementById('btnSkipPhotoToCard')?.addEventListener('click', () => { this.showDiscoveryStep(5); window.questTracker?.completeQuest('q_generator', 100); });

    // ── Motto Generator ──
    document.getElementById('btnGenerateRandomMotto')?.addEventListener('click', () => {
      const m = this.generateRandomMotto();
      this.characterData.motto = m;
      const input = document.getElementById('ocMottoInput');
      if (input) input.value = m;
      this.updatePassportUI();
      this.playAudioEffect('click');
      window.questTracker?.showToast('🎲 ¡Lema aleatorio generado!');
    });

    // ── Photo Upload (Step 4 legacy) ──
    document.getElementById('avatarFileInput')?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          this.characterData.avatarUrl = ev.target.result;
          const img = new Image();
          img.onload = () => {
            if (img.naturalWidth && img.naturalHeight) this.imageAspectRatio = img.naturalWidth / img.naturalHeight;
            this.updatePassportUI(); this.playAudioEffect('success');
          };
          img.src = ev.target.result;
        };
        reader.readAsDataURL(file);
      }
    });

    // ── Copy Prompt (Step 3 legacy) ──
    document.getElementById('btnCopyPrompt')?.addEventListener('click', () => {
      const text = document.getElementById('generatedPromptText')?.innerText;
      if (text) navigator.clipboard.writeText(text).then(() => {
        window.questTracker?.showToast('✨ ¡Prompt copiado!');
        this.playAudioEffect('success');
      });
    });
  }

  showDiscoveryStep(stepNum) {
    this.currentStep = stepNum;
    document.querySelectorAll('.discovery-section').forEach(s => s.style.display = 'none');
    const target = document.getElementById(`discoveryStep${stepNum}`);
    if (target) target.style.display = 'block';

    const tag = document.getElementById('progressiveStepTag');
    if (tag) {
      const titles = { 0: 'Selección Rápida ⚡', 5: 'Credencial Oficial ✨' };
      tag.innerText = titles[stepNum] || 'Aventura RPG';
    }

    this.updateNavbarProfile();
    this.playAudioEffect('click');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (stepNum === 5 && window.cardExporter) {
      setTimeout(() => window.cardExporter.renderCanvasCard(), 100);
    }
  }

  // Legacy compat stubs
  toggleModeFormFields() {}
  updateRoleOptionsForUniverse() {}

  updatePassportUI() {
    const d = this.characterData;
    const name = d.name || 'Aventurero Geek';
    const roleLabel = `${d.rpgClass} ${d.race}`;

    // Prompt (legacy Step 3)
    const promptDisplay = document.getElementById('generatedPromptText');
    if (promptDisplay) {
      promptDisplay.innerText = `Retrato de personaje RPG de fantasía épica: un/a ${d.rpgClass} ${d.race}. Ambientación medieval oscura, arte conceptual altamente detallado, iluminación dramática, 8k.`;
    }

    // Hero Card (Step 5)
    const heroAvatar = document.getElementById('heroAvatarDisplay');
    const heroName = document.getElementById('heroNameDisplay');
    const heroRole = document.getElementById('heroRoleDisplay');
    const heroMotto = document.getElementById('heroMottoText');
    const heroTrait = document.getElementById('heroTraitDisplay');
    const heroStyle = document.getElementById('heroStyleDisplay');

    if (heroAvatar && d.avatarUrl) heroAvatar.src = d.avatarUrl;
    if (heroName) heroName.innerText = name;
    if (heroRole) heroRole.innerText = roleLabel;
    if (heroMotto) heroMotto.innerText = `"${d.motto || 'La victoria es el único camino.'}"`;
    if (heroTrait) heroTrait.innerText = d.race;
    if (heroStyle) heroStyle.innerText = d.rpgClass;

    this.updateNavbarProfile();
    this.saveCharacterToSession();
  }

  updateNavbarProfile() {
    const el = document.getElementById('navCharProfile');
    if (!el) return;
    const name = this.characterData.name;
    if (!name || name.length < 1) { el.style.display = 'none'; return; }
    el.style.display = 'flex';
    const avatarEl = document.getElementById('navCharAvatar');
    const nameEl = document.getElementById('navCharName');
    const roleEl = document.getElementById('navCharRole');
    if (nameEl) nameEl.innerText = name;
    if (roleEl) roleEl.innerText = `${this.characterData.rpgClass} ${this.characterData.race}`;
    if (avatarEl && this.characterData.avatarUrl) avatarEl.src = this.characterData.avatarUrl;
  }

  saveCharacterToSession() {
    const payload = JSON.stringify({
      mode: 'oc',
      name: this.characterData.name,
      role: this.characterData.rpgClass,
      race: this.characterData.race,
      gender: this.characterData.gender,
      franchise: '',
      universe: `${this.characterData.race} ${this.characterData.rpgClass}`,
      avatarUrl: this.characterData.avatarUrl,
      motto: this.characterData.motto,
      distinctiveTrait: this.characterData.race
    });
    sessionStorage.setItem('expogeek_rpg_character', payload);
    localStorage.setItem('expogeek_rpg_character_flat', payload);
    this.saveToLocalStorage();
  }

  saveToLocalStorage() {
    localStorage.setItem('expogeek_rpg_character', JSON.stringify({
      mode: 'oc',
      characterData: this.characterData,
      imageAspectRatio: this.imageAspectRatio,
      selectedAvatarIndex: this.selectedAvatarIndex,
      avatarSeedSalt: this.avatarSeedSalt
    }));
  }

  restoreFromLocalStorage() {
    const saved = localStorage.getItem('expogeek_rpg_character');
    if (!saved) return;
    try {
      const p = JSON.parse(saved);
      this.characterData = { ...this.characterData, ...p.characterData };
      this.imageAspectRatio = p.imageAspectRatio || 1.0;
      this.selectedAvatarIndex = p.selectedAvatarIndex || 0;
      this.avatarSeedSalt = p.avatarSeedSalt || 1;

      const qn = document.getElementById('quickNameInput');
      if (qn && this.characterData.name) qn.value = this.characterData.name;

      const qr = document.getElementById('quickRaceSelect');
      if (qr && this.characterData.race) qr.value = this.characterData.race;

      const qc = document.getElementById('quickClassSelect');
      if (qc && this.characterData.rpgClass) qc.value = this.characterData.rpgClass;

      if (this.characterData.gender) {
        document.querySelectorAll('.gender-btn').forEach(btn => {
          btn.classList.toggle('active', btn.dataset.gender === this.characterData.gender);
        });
      }

      this.renderAvatarPicker();
      this.updatePassportUI();
    } catch (e) {}
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.characterGenerator = new CharacterGenerator();
});
