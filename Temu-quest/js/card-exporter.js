/**
 * ExpoGeek RPG - Canvas Card Exporter
 * Renders and exports high-resolution downloadable PNG RPG Adventurer Passports.
 */

class CardExporter {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 800;
    this.canvas.height = 1000;
    this.ctx = this.canvas.getContext('2d');
    this.bindEvents();
  }

  bindEvents() {
    document.getElementById('btnDownloadPassportCard')?.addEventListener('click', () => {
      this.generateAndDownloadCard();
    });
  }

  async generateAndDownloadCard() {
    const ctx = this.ctx;
    const gen = window.characterGenerator;
    if (!gen) return;

    const data = gen.characterData;
    const name = data.name || (gen.mode === 'canon' ? 'Aventurero Canon' : 'Leyenda OC');
    const role = gen.mode === 'canon' ? `Cosplay: ${data.name || 'Canon'}` : `${data.role} (${data.universe})`;
    const style = data.visualStyle || 'Fotorrealista';

    // 1. Background Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 800, 1000);
    bgGrad.addColorStop(0, '#090a14');
    bgGrad.addColorStop(0.5, '#12162a');
    bgGrad.addColorStop(1, '#080a11');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 800, 1000);

    // Outer Glow Border
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 6;
    ctx.strokeRect(20, 20, 760, 960);

    ctx.strokeStyle = '#ff0055';
    ctx.lineWidth = 2;
    ctx.strokeRect(28, 28, 744, 944);

    // 2. Header
    ctx.font = 'bold 36px Rajdhani, sans-serif';
    ctx.fillStyle = '#00f0ff';
    ctx.fillText('EXPOGEEK 2026', 60, 80);

    ctx.font = 'bold 24px Rajdhani, sans-serif';
    ctx.fillStyle = '#ffb700';
    ctx.fillText('PASAPORTE DE AVENTURERO RPG', 60, 120);

    // Header divider
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)';
    ctx.beginPath();
    ctx.moveTo(60, 140);
    ctx.lineTo(740, 140);
    ctx.stroke();

    // 3. Avatar Box
    const avatarX = 60;
    const avatarY = 170;
    const avatarSize = 220;

    ctx.fillStyle = '#0a0d18';
    ctx.fillRect(avatarX, avatarY, avatarSize, avatarSize);
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 4;
    ctx.strokeRect(avatarX, avatarY, avatarSize, avatarSize);

    if (data.avatarUrl) {
      try {
        const img = await this.loadImage(data.avatarUrl);
        ctx.drawImage(img, avatarX, avatarY, avatarSize, avatarSize);
      } catch (e) {
        this.drawAvatarFallback(ctx, avatarX, avatarY, avatarSize);
      }
    } else {
      this.drawAvatarFallback(ctx, avatarX, avatarY, avatarSize);
    }

    // 4. Character Details (Right Column)
    const textX = 310;
    ctx.font = 'bold 42px Rajdhani, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(name.substring(0, 22), textX, 210);

    ctx.font = 'bold 24px Rajdhani, sans-serif';
    ctx.fillStyle = '#ffb700';
    ctx.fillText(`CLASE: ${role.substring(0, 30)}`, textX, 255);

    ctx.font = 'bold 20px Rajdhani, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`ESTILO: ${style}`, textX, 290);

    if (gen.mode === 'oc') {
      ctx.fillText(`RASGO: ${data.distinctiveTrait}`, textX, 325);
    } else {
      ctx.fillText(`FRANQUICIA: ${data.franchise || 'Canon Original'}`, textX, 325);
    }

    // 5. Stat Bars
    ctx.font = 'bold 22px Rajdhani, sans-serif';
    ctx.fillStyle = '#00f0ff';
    ctx.fillText('ESTADÍSTICAS DEL AVENTURERO', 60, 440);

    this.drawStatBar(ctx, 'FUERZA', 85, 60, 470);
    this.drawStatBar(ctx, 'AGILIDAD', 90, 60, 520);
    this.drawStatBar(ctx, 'CARISMA', 78, 60, 570);
    this.drawStatBar(ctx, 'SABIDURÍA GEEK', 95, 60, 620);

    // 6. Prompt Box
    ctx.font = 'bold 22px Rajdhani, sans-serif';
    ctx.fillStyle = '#ff0055';
    ctx.fillText('PROMPT DE GENERACIÓN IA', 60, 690);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(60, 710, 680, 160);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.strokeRect(60, 710, 680, 160);

    const compiledPrompt = gen.compilePrompt();
    ctx.font = '16px "Fira Code", monospace';
    ctx.fillStyle = '#00f0ff';
    this.wrapText(ctx, compiledPrompt, 75, 740, 650, 24);

    // 7. Footer
    ctx.font = 'bold 18px Rajdhani, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('EXPO GEEK TEMUCO 2026 - SISTEMA HÍBRIDO RPG VIVO', 60, 930);

    // Trigger download
    const link = document.createElement('a');
    link.download = `ExpoGeek_Aventurero_${name.replace(/\s+/g, '_')}.png`;
    link.href = this.canvas.toDataURL('image/png');
    link.click();

    window.questTracker?.showToast('💾 ¡Ficha de Aventurero descargada en PNG!');
  }

  drawAvatarFallback(ctx, x, y, size) {
    ctx.fillStyle = '#1e2338';
    ctx.fillRect(x, y, size, size);
    ctx.font = '60px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🎲', x + size / 2, y + size / 2 + 20);
    ctx.textAlign = 'left';
  }

  drawStatBar(ctx, label, val, x, y) {
    ctx.font = 'bold 18px Rajdhani, sans-serif';
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText(label, x, y + 16);

    const barX = x + 180;
    const barW = 480;
    const barH = 16;

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
        if (currentY > y + 130) break; // Clamp overflow
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
