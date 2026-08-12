/**
 * ExpoGeek RPG - Canvas Card Exporter
 * Renders high-resolution vertical PNG RPG Credentials (Stories/Feed 9:16 & 4:5 compatible),
 * with Copy to Clipboard and Native Web Share API integration for Mobile devices.
 */

class CardExporter {
  constructor() {
    this.canvas = document.createElement('canvas');
    // Vertical Stories/Feed format: 1080x1920 (9:16 aspect ratio)
    this.canvas.width = 1080;
    this.canvas.height = 1920;
    this.ctx = this.canvas.getContext('2d');
    this.currentBlob = null;
    this.bindEvents();
  }

  bindEvents() {
    document.body.addEventListener('click', async (e) => {
      const target = e.target.closest('button') || e.target;
      if (!target) return;

      if (target.id === 'btnDownloadPassportCard') {
        this.generateAndDownloadCard();
      } else if (target.id === 'btnCopyCardImage') {
        this.copyCardToClipboard();
      } else if (target.id === 'btnShareCardSocial') {
        this.shareCardToSocial();
      }
    });
  }

  async renderCanvasCard() {
    const ctx = this.ctx;
    const gen = window.characterGenerator;
    if (!gen) return;

    const data = gen.characterData;
    const name = data.name || (gen.mode === 'canon' ? 'Aventurero Canon' : 'Leyenda OC');
    const role = gen.mode === 'canon' ? `Cosplay: ${data.name || 'Canon'}` : `${data.role} (${data.universe})`;
    const style = data.visualStyle || 'Fotorrealista';
    const motto = data.motto || 'La victoria es el único camino.';
    const trait = gen.mode === 'oc' ? data.distinctiveTrait : (data.franchise || 'Canon Original');

    // 1. Background Gradient (Dark Cyber Fantasy)
    const bgGrad = ctx.createLinearGradient(0, 0, 1080, 1920);
    bgGrad.addColorStop(0, '#070914');
    bgGrad.addColorStop(0.3, '#12162e');
    bgGrad.addColorStop(0.7, '#191d38');
    bgGrad.addColorStop(1, '#070812');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1080, 1920);

    // Decorative Outer Glow Borders (Gold & Cyan)
    ctx.strokeStyle = '#ffb700';
    ctx.lineWidth = 10;
    ctx.strokeRect(30, 30, 1020, 1860);

    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 4;
    ctx.strokeRect(42, 42, 996, 1836);

    // 2. Header Title Section
    ctx.font = 'bold 52px Rajdhani, sans-serif';
    ctx.fillStyle = '#00f0ff';
    ctx.fillText('EXPOGEEK 2026', 70, 130);

    ctx.font = 'bold 32px Rajdhani, sans-serif';
    ctx.fillStyle = '#ffb700';
    ctx.fillText('CREDENCIAL OFICIAL DE AVENTURERO', 70, 180);

    // Verified Seal Badge on Top Right
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

    // 3. Giant Hero Photo Display (Aspect-Ratio Preserved - Zero Distortion)
    const avatarX = 140;
    const avatarY = 250;
    const avatarWidth = 800;
    const avatarHeight = 800; // Large 1:1 Square Frame for Stories & Feed

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
        
        // Aspect ratio cropping math (Canvas object-fit: cover)
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

    // 6. Character Key Specs & Stat Meters
    ctx.font = 'bold 32px Rajdhani, sans-serif';
    ctx.fillStyle = '#00f0ff';
    ctx.fillText('DATOS CLAVE & ESTADÍSTICAS DEL REINO', 70, 1400);

    ctx.font = 'bold 26px Rajdhani, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`RASGO: ${trait}`, 70, 1450);
    ctx.fillText(`ESTILO VISUAL: ${style}`, 560, 1450);

    this.drawStatBar(ctx, 'FUERZA', 85, 70, 1500, 440);
    this.drawStatBar(ctx, 'AGILIDAD', 90, 560, 1500, 440);
    this.drawStatBar(ctx, 'CARISMA', 78, 70, 1580, 440);
    this.drawStatBar(ctx, 'SABIDURÍA GEEK', 95, 560, 1580, 440);

    // 7. Footer Banner for Instagram Stories / Feed
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

    return new Promise((resolve) => {
      this.canvas.toBlob((blob) => {
        this.currentBlob = blob;
        resolve(blob);
      }, 'image/png');
    });
  }

  async generateAndDownloadCard() {
    await this.renderCanvasCard();
    const gen = window.characterGenerator;
    const name = gen?.characterData?.name || 'Aventurero';

    const link = document.createElement('a');
    link.download = `Credencial_ExpoGeek_${name.replace(/\s+/g, '_')}.png`;
    link.href = this.canvas.toDataURL('image/png');
    link.click();

    window.questTracker?.showToast('💾 ¡Credencial descargada en PNG!');
  }

  /**
   * Copies the image blob directly to clipboard (Mobile / Desktop)
   */
  async copyCardToClipboard() {
    await this.renderCanvasCard();
    try {
      if (navigator.clipboard && window.ClipboardItem) {
        const item = new ClipboardItem({ 'image/png': this.currentBlob });
        await navigator.clipboard.write([item]);
        window.questTracker?.showToast('📋 ¡Imagen copiada al portapapeles! Lista para pegar.');
        gen?.playAudioEffect('success');
      } else {
        window.questTracker?.showToast('⚠️ Tu navegador no soporta copiar imágenes directamente. Usa Descargar o Compartir.');
      }
    } catch (e) {
      console.warn('Clipboard copy image error:', e);
      window.questTracker?.showToast('📋 Imagen lista: Mantén presionada la tarjeta para copiar.');
    }
  }

  /**
   * Triggers native Web Share API for Mobile devices to share directly to Instagram Stories / WhatsApp
   */
  async shareCardToSocial() {
    await this.renderCanvasCard();
    const gen = window.characterGenerator;
    const name = gen?.characterData?.name || 'Aventurero';

    try {
      const file = new File([this.currentBlob], `Credencial_ExpoGeek_${name}.png`, { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `Mi Ficha de Aventurero ExpoGeek 2026`,
          text: `¡Soy ${name} en ExpoGeek 2026! 🎲✨ Mira mi Ficha de Aventurero oficial.`,
          files: [file]
        });
        window.questTracker?.showToast('📲 ¡Compartido con éxito!');
      } else if (navigator.share) {
        await navigator.share({
          title: `Mi Ficha de Aventurero ExpoGeek 2026`,
          text: `¡Soy ${name} en ExpoGeek 2026! 🎲✨ Mira mi Ficha de Aventurero oficial.`
        });
        window.questTracker?.showToast('📲 ¡Enlace compartido!');
      } else {
        this.generateAndDownloadCard();
      }
    } catch (e) {
      console.warn('Share error or user cancelled:', e);
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

  drawStatBar(ctx, label, val, x, y, width) {
    ctx.font = 'bold 24px Rajdhani, sans-serif';
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText(label, x, y + 20);

    const barX = x + 180;
    const barW = width - 180;
    const barH = 20;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(barX, y, barW, barH);

    const fillW = (val / 100) * barW;
    const grad = ctx.createLinearGradient(barX, y, barX + fillW, y);
    grad.addColorStop(0, '#00f0ff');
    grad.addColorStop(1, '#8b5cf6');
    ctx.fillStyle = grad;
    ctx.fillRect(barX, y, fillW, barH);
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

  loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.cardExporter = new CardExporter();
});
