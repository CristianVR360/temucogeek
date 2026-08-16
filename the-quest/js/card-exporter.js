/**
 * ExpoGeek RPG - Mobile Optimized Canvas Card Exporter
 * Pre-renders high-res PNG credentials for instant mobile download & native sharing.
 */

class CardExporter {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 1080;
    this.canvas.height = 1920;
    this.ctx = this.canvas.getContext('2d');
    this.currentBlob = null;
    this.currentDataUrl = null;
    this.isRendering = false;
    this.bindEvents();
  }

  bindEvents() {
    document.body.addEventListener('click', async (e) => {
      const target = e.target.closest('button') || e.target;
      if (!target) return;

      if (target.id === 'btnDownloadPassportCard') {
        e.preventDefault();
        this.generateAndDownloadCard();
      } else if (target.id === 'btnCopyCardImage') {
        e.preventDefault();
        this.copyCardToClipboard();
      } else if (target.id === 'btnShareCardSocial') {
        e.preventDefault();
        this.shareCardToSocial();
      }
    });
  }

  async renderCanvasCard() {
    if (this.isRendering) return this.currentBlob;
    this.isRendering = true;

    try {
      const ctx = this.ctx;
      const gen = window.characterGenerator;
      if (!gen) return null;

      const data = gen.characterData;
      const name = data.name || 'Aventurero Geek';
      const role = `${data.rpgClass || data.role || 'Guerrero'} ${data.race || 'Humano'}`;
      const style = data.rpgClass || data.role || 'Guerrero';
      const motto = data.motto || 'La victoria es el único camino.';
      const trait = data.race || 'Humano';

      // 1. Background Gradient (Dark Cyber Fantasy)
      const bgGrad = ctx.createLinearGradient(0, 0, 1080, 1920);
      bgGrad.addColorStop(0, '#070914');
      bgGrad.addColorStop(0.3, '#12162e');
      bgGrad.addColorStop(0.7, '#191d38');
      bgGrad.addColorStop(1, '#070812');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 1080, 1920);

      // Decorative Outer Glow Borders
      ctx.strokeStyle = '#ffb700';
      ctx.lineWidth = 10;
      ctx.strokeRect(30, 30, 1020, 1860);

      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 4;
      ctx.strokeRect(42, 42, 996, 1836);

      // 2. Header Section
      ctx.font = 'bold 52px Rajdhani, sans-serif';
      ctx.fillStyle = '#00f0ff';
      ctx.fillText('EXPOGEEK 2026', 70, 130);

      ctx.font = 'bold 32px Rajdhani, sans-serif';
      ctx.fillStyle = '#ffb700';
      ctx.fillText('CREDENCIAL OFICIAL DE AVENTURERO', 70, 180);

      // Verified Seal Badge
      ctx.fillStyle = 'rgba(255, 183, 0, 0.15)';
      ctx.strokeStyle = '#ffb700';
      ctx.lineWidth = 2;
      ctx.fillRect(680, 85, 330, 75);
      ctx.strokeRect(680, 85, 330, 75);

      ctx.font = 'bold 24px Rajdhani, sans-serif';
      ctx.fillStyle = '#ffb700';
      ctx.fillText('🛡️ REGISTRADO // #EG-2026', 705, 130);

      // Divider Line
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)';
      ctx.beginPath();
      ctx.moveTo(70, 210);
      ctx.lineTo(1010, 210);
      ctx.stroke();

      // 3. Hero Photo Display
      const avatarX = 140;
      const avatarY = 250;
      const avatarWidth = 800;
      const avatarHeight = 800;

      ctx.fillStyle = '#0a0d1a';
      ctx.fillRect(avatarX, avatarY, avatarWidth, avatarHeight);
      
      ctx.strokeStyle = '#ffb700';
      ctx.lineWidth = 6;
      ctx.strokeRect(avatarX, avatarY, avatarWidth, avatarHeight);

      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 3;
      ctx.strokeRect(avatarX - 6, avatarY - 6, avatarWidth + 12, avatarHeight + 12);

      if (data.avatarUrl) {
        try {
          const img = await this.loadImage(data.avatarUrl);
          
          const imgRatio = img.naturalWidth / img.naturalHeight;
          const targetRatio = avatarWidth / avatarHeight;
          
          let sourceX = 0;
          let sourceY = 0;
          let sourceWidth = img.naturalWidth;
          let sourceHeight = img.naturalHeight;

          if (imgRatio > targetRatio) {
            sourceWidth = img.naturalHeight * targetRatio;
            sourceX = (img.naturalWidth - sourceWidth) / 2;
          } else {
            sourceHeight = img.naturalWidth / targetRatio;
            sourceY = (img.naturalHeight - sourceHeight) / 2;
          }

          ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, avatarX, avatarY, avatarWidth, avatarHeight);
        } catch (e) {
          this.drawAvatarFallback(ctx, avatarX, avatarY, avatarWidth, avatarHeight);
        }
      } else {
        this.drawAvatarFallback(ctx, avatarX, avatarY, avatarWidth, avatarHeight);
      }

      // 4. Character Title & Role
      ctx.textAlign = 'center';
      ctx.font = 'bold 64px Rajdhani, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(name.substring(0, 24), 540, 1120);

      ctx.font = 'bold 36px Rajdhani, sans-serif';
      ctx.fillStyle = '#ffb700';
      ctx.fillText(role.toUpperCase().substring(0, 38), 540, 1180);
      ctx.textAlign = 'left';

      // 5. Motto Quote Box
      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      ctx.fillRect(70, 1220, 940, 120);
      ctx.strokeStyle = '#ffb700';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(70, 1220);
      ctx.lineTo(70, 1340);
      ctx.stroke();

      ctx.font = 'italic 28px Outfit, sans-serif';
      ctx.fillStyle = '#e2e8f0';
      this.wrapText(ctx, `💬 "${motto}"`, 100, 1270, 880, 38);

      // 6. Specs Table Grid
      const specY = 1380;
      ctx.fillStyle = 'rgba(0, 240, 255, 0.05)';
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
      ctx.lineWidth = 2;
      
      ctx.fillRect(70, specY, 450, 110);
      ctx.strokeRect(70, specY, 450, 110);

      ctx.fillRect(560, specY, 450, 110);
      ctx.strokeRect(560, specY, 450, 110);

      ctx.font = 'bold 22px Rajdhani, sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('RAZA', 90, specY + 38);
      ctx.font = 'bold 32px Rajdhani, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(trait.substring(0, 18), 90, specY + 80);

      ctx.font = 'bold 22px Rajdhani, sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('CLASE', 580, specY + 38);
      ctx.font = 'bold 32px Rajdhani, sans-serif';
      ctx.fillStyle = '#00f0ff';
      ctx.fillText(style.substring(0, 18), 580, specY + 80);

      // 7. Footer Branding
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.beginPath();
      ctx.moveTo(70, 1720);
      ctx.lineTo(1010, 1720);
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.font = 'bold 28px Rajdhani, sans-serif';
      ctx.fillStyle = '#ff0055';
      ctx.fillText('EXPO GEEK TEMUCO 2026 // @TEMU.GEEK', 540, 1770);

      ctx.font = '22px Outfit, sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('🏆 ECOSISTEMA RPG EN VIVO - RECLAMA TU PIN EN EL RECINTO', 540, 1815);
      ctx.textAlign = 'left';

      this.currentDataUrl = this.canvas.toDataURL('image/png');
      this.currentBlob = await new Promise((resolve) => this.canvas.toBlob(resolve, 'image/png'));
      return this.currentBlob;
    } finally {
      this.isRendering = false;
    }
  }

  async generateAndDownloadCard() {
    window.questTracker?.showToast('⏳ Preparando descarga...');
    await this.renderCanvasCard();
    const gen = window.characterGenerator;
    const name = gen?.characterData?.name || 'Aventurero';
    const filename = `Credencial_ExpoGeek_${name.replace(/\s+/g, '_')}.png`;

    try {
      if (this.currentBlob) {
        const blobUrl = URL.createObjectURL(this.currentBlob);
        const link = document.createElement('a');
        link.download = filename;
        link.href = blobUrl;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(blobUrl);
        }, 1000);
        window.questTracker?.showToast('💾 ¡Credencial descargada!');
        gen?.playAudioEffect('success');
      } else {
        throw new Error('No blob available');
      }
    } catch (e) {
      const win = window.open(this.currentDataUrl, '_blank');
      if (win) {
        window.questTracker?.showToast('📸 Mantén presionada la imagen para guardarla');
      } else {
        window.location.href = this.currentDataUrl;
      }
    }
  }

  async copyCardToClipboard() {
    window.questTracker?.showToast('⏳ Copiando imagen...');
    await this.renderCanvasCard();
    const gen = window.characterGenerator;

    try {
      if (navigator.clipboard && window.ClipboardItem && this.currentBlob) {
        const item = new ClipboardItem({ 'image/png': this.currentBlob });
        await navigator.clipboard.write([item]);
        window.questTracker?.showToast('📋 ¡Imagen copiada! Lista para pegar.');
        gen?.playAudioEffect('success');
      } else {
        throw new Error('ClipboardItem unsupported');
      }
    } catch (e) {
      console.warn('Clipboard copy error:', e);
      window.questTracker?.showToast('📋 Usa el botón Descargar o Mantén presionada la tarjeta.');
    }
  }

  async shareCardToSocial() {
    window.questTracker?.showToast('⏳ Abriendo menú de compartir...');
    await this.renderCanvasCard();
    const gen = window.characterGenerator;
    const name = gen?.characterData?.name || 'Aventurero';

    try {
      if (this.currentBlob && navigator.share) {
        const file = new File([this.currentBlob], `Credencial_ExpoGeek_${name.replace(/\s+/g, '_')}.png`, { type: 'image/png' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `Mi Ficha de Aventurero ExpoGeek 2026`,
            text: `¡Soy ${name} en ExpoGeek 2026! 🎲✨ Mira mi Credencial Oficial.`,
            files: [file]
          });
          window.questTracker?.showToast('📲 ¡Compartido con éxito!');
          gen?.playAudioEffect('success');
          return;
        } else {
          await navigator.share({
            title: `Mi Ficha de Aventurero ExpoGeek 2026`,
            text: `¡Soy ${name} en ExpoGeek 2026! 🎲✨ Mira mi Credencial Oficial.`
          });
          window.questTracker?.showToast('📲 ¡Enlace compartido!');
          gen?.playAudioEffect('success');
          return;
        }
      }
      this.generateAndDownloadCard();
    } catch (e) {
      if (e.name !== 'AbortError') {
        console.warn('Share error:', e);
        this.generateAndDownloadCard();
      }
    }
  }

  drawAvatarFallback(ctx, x, y, w, h) {
    ctx.fillStyle = '#181d33';
    ctx.fillRect(x, y, w, h);
    ctx.font = '150px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🎲', x + w / 2, y + h / 2 + 50);
    ctx.textAlign = 'left';
  }

  wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let currentY = y;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line, x, currentY);
        line = words[n] + ' ';
        currentY += lineHeight;
        if (currentY > y + 70) break;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, currentY);
  }

  async loadImage(src) {
    if (!src) throw new Error('Empty image src');
    
    let finalSrc = src;
    if (src.startsWith('http') && (src.includes('dicebear.com') || src.includes('pollinations.ai'))) {
      try {
        const response = await fetch(src);
        if (response.ok) {
          const blob = await response.blob();
          finalSrc = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
          });
        }
      } catch (e) {
        console.warn('Fallback loading direct image URL:', e);
      }
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      if (!finalSrc.startsWith('data:')) {
        img.crossOrigin = 'anonymous';
      }
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = finalSrc;
    });
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.cardExporter = new CardExporter();
});
