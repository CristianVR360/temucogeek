/**
 * ExpoGeek RPG - Canvas Card Exporter
 * Renders and exports high-resolution downloadable PNG RPG Adventurer Credentials with max photo protagonism.
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
    document.body.addEventListener('click', (e) => {
      if (e.target && e.target.id === 'btnDownloadPassportCard') {
        this.generateAndDownloadCard();
      }
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
    const motto = data.motto || 'La victoria es el único camino.';
    const trait = gen.mode === 'oc' ? data.distinctiveTrait : (data.franchise || 'Canon Original');

    // 1. Background Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 800, 1000);
    bgGrad.addColorStop(0, '#090b16');
    bgGrad.addColorStop(0.5, '#14182e');
    bgGrad.addColorStop(1, '#090b14');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 800, 1000);

    // Outer Glow Border (Gold & Cyan)
    ctx.strokeStyle = '#ffb700';
    ctx.lineWidth = 6;
    ctx.strokeRect(20, 20, 760, 960);

    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(28, 28, 744, 944);

    // 2. Header
    ctx.font = 'bold 36px Rajdhani, sans-serif';
    ctx.fillStyle = '#00f0ff';
    ctx.fillText('EXPOGEEK 2026', 50, 75);

    ctx.font = 'bold 22px Rajdhani, sans-serif';
    ctx.fillStyle = '#ffb700';
    ctx.fillText('CREDENCIAL OFICIAL DE AVENTURERO RPG', 50, 110);

    // Verified Seal Badge on top right
    ctx.fillStyle = 'rgba(255, 183, 0, 0.15)';
    ctx.strokeStyle = '#ffb700';
    ctx.lineWidth = 1;
    ctx.fillRect(520, 55, 230, 45);
    ctx.strokeRect(520, 55, 230, 45);

    ctx.font = 'bold 16px Rajdhani, sans-serif';
    ctx.fillStyle = '#ffb700';
    ctx.fillText('🛡️ REGISTRADO // #EG-2026', 535, 83);

    // Header divider
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)';
    ctx.beginPath();
    ctx.moveTo(50, 130);
    ctx.lineTo(750, 130);
    ctx.stroke();

    // 3. Hero Avatar Photo - MAXIMUM PROTAGONISM (Centered & Giant)
    const avatarX = 220;
    const avatarY = 155;
    const avatarWidth = 360;
    const avatarHeight = 360;

    ctx.fillStyle = '#090a10';
    ctx.fillRect(avatarX, avatarY, avatarWidth, avatarHeight);
    
    ctx.strokeStyle = '#ffb700';
    ctx.lineWidth = 4;
    ctx.strokeRect(avatarX, avatarY, avatarWidth, avatarHeight);

    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(avatarX - 4, avatarY - 4, avatarWidth + 8, avatarHeight + 8);

    if (data.avatarUrl) {
      try {
        const img = await this.loadImage(data.avatarUrl);
        ctx.drawImage(img, avatarX, avatarY, avatarWidth, avatarHeight);
      } catch (e) {
        this.drawAvatarFallback(ctx, avatarX, avatarY, avatarWidth, avatarHeight);
      }
    } else {
      this.drawAvatarFallback(ctx, avatarX, avatarY, avatarWidth, avatarHeight);
    }

    // 4. Character Title & Role
    ctx.textAlign = 'center';
    ctx.font = 'bold 44px Rajdhani, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(name.substring(0, 24), 400, 565);

    ctx.font = 'bold 24px Rajdhani, sans-serif';
    ctx.fillStyle = '#ffb700';
    ctx.fillText(role.toUpperCase().substring(0, 36), 400, 600);
    ctx.textAlign = 'left';

    // 5. Motto Quote Box
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(50, 625, 700, 65);
    ctx.strokeStyle = '#ffb700';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(50, 625);
    ctx.lineTo(50, 690);
    ctx.stroke();

    ctx.font = 'italic 18px Outfit, sans-serif';
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText(`💬 "${motto.substring(0, 75)}"`, 70, 663);

    // 6. Character Specs & Stat Meters
    ctx.font = 'bold 20px Rajdhani, sans-serif';
    ctx.fillStyle = '#00f0ff';
    ctx.fillText('DATOS CLAVE & ESTADÍSTICAS', 50, 725);

    ctx.font = 'bold 18px Rajdhani, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`RASGO: ${trait}`, 50, 760);
    ctx.fillText(`ESTILO VISUAL: ${style}`, 420, 760);

    this.drawStatBar(ctx, 'FUERZA', 85, 50, 785, 310);
    this.drawStatBar(ctx, 'AGILIDAD', 90, 420, 785, 310);
    this.drawStatBar(ctx, 'CARISMA', 78, 50, 840, 310);
    this.drawStatBar(ctx, 'SABIDURÍA GEEK', 95, 420, 840, 310);

    // 7. Footer
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.moveTo(50, 910);
    ctx.lineTo(750, 910);
    ctx.stroke();

    ctx.font = 'bold 18px Rajdhani, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('EXPO GEEK TEMUCO 2026 - ECOSISTEMA RPG VIVO', 50, 945);

    // Trigger download
    const link = document.createElement('a');
    link.download = `Credencial_ExpoGeek_${name.replace(/\s+/g, '_')}.png`;
    link.href = this.canvas.toDataURL('image/png');
    link.click();

    window.questTracker?.showToast('💾 ¡Credencial Oficial descargada en PNG!');
  }

  drawAvatarFallback(ctx, x, y, w, h) {
    ctx.fillStyle = '#181d33';
    ctx.fillRect(x, y, w, h);
    ctx.font = '100px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🎲', x + w / 2, y + h / 2 + 35);
    ctx.textAlign = 'left';
  }

  drawStatBar(ctx, label, val, x, y, width) {
    ctx.font = 'bold 16px Rajdhani, sans-serif';
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText(label, x, y + 14);

    const barX = x + 120;
    const barW = width - 120;
    const barH = 14;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(barX, y, barW, barH);

    const fillW = (val / 100) * barW;
    const grad = ctx.createLinearGradient(barX, y, barX + fillW, y);
    grad.addColorStop(0, '#00f0ff');
    grad.addColorStop(1, '#8b5cf6');
    ctx.fillStyle = grad;
    ctx.fillRect(barX, y, fillW, barH);
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
