/**
 * ============================================================================
 * FLAPPY GEEK — MOTOR DE MINIJUEGO CANVAS HTML5
 * ============================================================================
 * Desarrollado en Vanilla JS sin motores de terceros.
 * 
 * GUÍA DE ASSETS DE SPRITES:
 * Las imágenes deben ubicarse en 'assets/img/game-sprites/' con las siguientes rutas:
 *  - Salto / Volar: ../../assets/img/game-sprites/jump-up01.png
 *  - Planeo Normal: ../../assets/img/game-sprites/fast-dash-forward01.png
 *  - Caída Libe:    ../../assets/img/game-sprites/fall-down01.png
 *  - Derrota:       ../../assets/img/game-sprites/defeat01.png
 *  - Partículas:    ../../assets/img/game-sprites/glare-star01.png
 * ============================================================================
 */

(function () {
    'use strict';

    // -------------------------------------------------------------------------
    // 1. CONFIGURACIÓN DEL CANVAS Y VARIABLES GLOBALES
    // -------------------------------------------------------------------------
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');

    // Dimensiones lógicas del juego
    const GAME_WIDTH = 480;
    const GAME_HEIGHT = 640;

    // Estados del Juego
    const STATE_START = 'START_SCREEN';
    const STATE_PLAYING = 'PLAYING';
    const STATE_GAMEOVER = 'GAME_OVER';

    let gameState = STATE_START;
    let score = 0;
    let highScore = localStorage.getItem('cyber_runner_highscore') || 0;
    let isSavingScore = false;
    let scoreSaveStatus = '';

    // -------------------------------------------------------------------------
    // 2. CARGA Y GESTIÓN DE SPRITES CON FALLBACK AUTOMÁTICO
    // -------------------------------------------------------------------------
    const sprites = {
        jump: new Image(),
        dash: new Image(),
        fall: new Image(),
        defeat: new Image(),
        star: new Image()
    };

    let spritesLoadedCount = 0;
    const totalSprites = 5;

    function onLoadSprite() {
        spritesLoadedCount++;
    }

    sprites.jump.onload = onLoadSprite;
    sprites.dash.onload = onLoadSprite;
    sprites.fall.onload = onLoadSprite;
    sprites.defeat.onload = onLoadSprite;
    sprites.star.onload = onLoadSprite;

    // Rutas de archivos de sprites
    sprites.jump.src = '../../assets/img/game-sprites/jump-up01.png';
    sprites.dash.src = '../../assets/img/game-sprites/fast-dash-forward01.png';
    sprites.fall.src = '../../assets/img/game-sprites/fall-down01.png';
    sprites.defeat.src = '../../assets/img/game-sprites/defeat01.png';
    sprites.star.src = '../../assets/img/game-sprites/glare-star01.png';

    // -------------------------------------------------------------------------
    // 3. FÍSICAS Y ENTIDAD DEL JUGADOR
    // -------------------------------------------------------------------------
    const player = {
        x: 100,
        y: 280,
        width: 44,
        height: 44,
        velocity: 0,
        gravity: 0.38,
        jumpPower: -7.2,
        maxFallSpeed: 9.0,
        rotation: 0,

        reset: function () {
            this.x = 100;
            this.y = 280;
            this.velocity = 0;
            this.rotation = 0;
        },

        flap: function () {
            this.velocity = this.jumpPower;
            createJumpParticles(this.x, this.y + this.height / 2);
        },

        update: function () {
            this.velocity += this.gravity;
            if (this.velocity > this.maxFallSpeed) {
                this.velocity = this.maxFallSpeed;
            }

            this.y += this.velocity;

            // Calcular rotación fluida según la velocidad vertical
            this.rotation = Math.min(Math.max((this.velocity / 10) * 45, -30), 70);
        },

        draw: function () {
            ctx.save();
            ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
            ctx.rotate((this.rotation * Math.PI) / 180);

            // Seleccionar el sprite adecuado según el estado físico
            let activeSprite = sprites.dash;
            if (gameState === STATE_GAMEOVER) {
                activeSprite = sprites.defeat;
            } else if (this.velocity < -2) {
                activeSprite = sprites.jump;
            } else if (this.velocity > 3) {
                activeSprite = sprites.fall;
            }

            // Si la imagen cargó con éxito se renderiza el sprite, de lo contrario fallback procedural
            if (activeSprite.complete && activeSprite.naturalWidth !== 0) {
                ctx.drawImage(
                    activeSprite,
                    -this.width / 2 - 4,
                    -this.height / 2 - 4,
                    this.width + 8,
                    this.height + 8
                );
            } else {
                // Fallback Procedural Cyber Jetpack Runner
                ctx.fillStyle = '#06b6d4';
                ctx.beginPath();
                ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#8b5cf6';
                ctx.fillRect(-this.width / 4, -this.height / 4, this.width / 2, this.height / 2);

                // Ojo Neón
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(4, -4, 8, 8);
            }

            ctx.restore();
        }
    };

    // -------------------------------------------------------------------------
    // 4. OBSTÁCULOS (PILAS DE ENERGÍA NEÓN REUTILIZABLES)
    // -------------------------------------------------------------------------
    const obstacles = [];
    const obstacleConfig = {
        width: 64,
        gapHeight: 155,
        speed: 2.8,
        spawnInterval: 120, // frames entre spawns
        timer: 0
    };

    function spawnObstacle() {
        const minTop = 60;
        const maxTop = GAME_HEIGHT - 120 - obstacleConfig.gapHeight - minTop;
        const topHeight = Math.floor(Math.random() * maxTop) + minTop;

        obstacles.push({
            x: GAME_WIDTH,
            topHeight: topHeight,
            bottomY: topHeight + obstacleConfig.gapHeight,
            bottomHeight: GAME_HEIGHT - 60 - (topHeight + obstacleConfig.gapHeight),
            passed: false
        });
    }

    function updateObstacles() {
        obstacleConfig.timer++;
        if (obstacleConfig.timer >= obstacleConfig.spawnInterval) {
            spawnObstacle();
            obstacleConfig.timer = 0;
        }

        for (let i = obstacles.length - 1; i >= 0; i--) {
            const obs = obstacles[i];
            obs.x -= obstacleConfig.speed;

            // Incrementar puntaje al cruzar
            if (!obs.passed && obs.x + obstacleConfig.width < player.x) {
                obs.passed = true;
                score++;
                createScoreParticles(player.x + 20, player.y);
            }

            // Reciclar obstáculos fuera de pantalla (Optimización de memoria)
            if (obs.x + obstacleConfig.width < 0) {
                obstacles.splice(i, 1);
            }
        }
    }

    function drawObstacles() {
        obstacles.forEach((obs) => {
            // Pilar Superior (Gradiente Cian/Púrpura Neón)
            const topGrad = ctx.createLinearGradient(obs.x, 0, obs.x + obstacleConfig.width, 0);
            topGrad.addColorStop(0, '#7c3aed');
            topGrad.addColorStop(0.5, '#06b6d4');
            topGrad.addColorStop(1, '#4c1d95');

            ctx.fillStyle = topGrad;
            ctx.fillRect(obs.x, 0, obstacleConfig.width, obs.topHeight);

            // Borde brillante e interior del pilar superior
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 2;
            ctx.strokeRect(obs.x, 0, obstacleConfig.width, obs.topHeight);
            
            // Tapa del Pilar Superior
            ctx.fillStyle = '#38bdf8';
            ctx.fillRect(obs.x - 3, obs.topHeight - 12, obstacleConfig.width + 6, 12);

            // Pilar Inferior
            const botGrad = ctx.createLinearGradient(obs.x, obs.bottomY, obs.x + obstacleConfig.width, obs.bottomY);
            botGrad.addColorStop(0, '#7c3aed');
            botGrad.addColorStop(0.5, '#06b6d4');
            botGrad.addColorStop(1, '#4c1d95');

            ctx.fillStyle = botGrad;
            ctx.fillRect(obs.x, obs.bottomY, obstacleConfig.width, obs.bottomHeight);

            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 2;
            ctx.strokeRect(obs.x, obs.bottomY, obstacleConfig.width, obs.bottomHeight);

            // Tapa del Pilar Inferior
            ctx.fillStyle = '#38bdf8';
            ctx.fillRect(obs.x - 3, obs.bottomY, obstacleConfig.width + 6, 12);
        });
    }

    // -------------------------------------------------------------------------
    // 5. SISTEMA DE DETECCIÓN DE COLISIONES (AABB)
    // -------------------------------------------------------------------------
    function checkCollisions() {
        const pLeft = player.x + 6;
        const pRight = player.x + player.width - 6;
        const pTop = player.y + 6;
        const pBottom = player.y + player.height - 6;

        const groundY = GAME_HEIGHT - 60;

        // Colisión con Techo o Suelo
        if (pTop <= 0 || pBottom >= groundY) {
            triggerGameOver();
            return;
        }

        // Colisión AABB con Pilares
        for (let i = 0; i < obstacles.length; i++) {
            const obs = obstacles[i];
            const obsLeft = obs.x;
            const obsRight = obs.x + obstacleConfig.width;

            // Verificar si está alineado horizontalmente
            if (pRight > obsLeft && pLeft < obsRight) {
                // Verificar si choca con la parte superior o inferior
                if (pTop < obs.topHeight || pBottom > obs.bottomY) {
                    triggerGameOver();
                    return;
                }
            }
        }
    }

    // -------------------------------------------------------------------------
    // 6. SISTEMA DE PARTÍCULAS Y EFECTOS VISUALES
    // -------------------------------------------------------------------------
    const particles = [];

    function createJumpParticles(x, y) {
        for (let i = 0; i < 6; i++) {
            particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 3 - 2,
                vy: Math.random() * 2 + 1,
                size: Math.random() * 4 + 2,
                color: Math.random() > 0.5 ? '#06b6d4' : '#a78bfa',
                life: 1.0
            });
        }
    }

    function createScoreParticles(x, y) {
        for (let i = 0; i < 10; i++) {
            particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                size: Math.random() * 5 + 3,
                color: '#f472b6',
                life: 1.0
            });
        }
    }

    function updateAndDrawParticles() {
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.04;

            if (p.life <= 0) {
                particles.splice(i, 1);
                continue;
            }

            ctx.save();
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    // Escenario Parallax
    let bgOffset = 0;
    function drawCyberBackground() {
        // Cielo Neón Oscuro
        const skyGrad = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
        skyGrad.addColorStop(0, '#090d16');
        skyGrad.addColorStop(0.7, '#131b2e');
        skyGrad.addColorStop(1, '#1e1b4b');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Estrellas / Puntos de Luz de Fondo
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        for (let i = 0; i < 30; i++) {
            const x = (i * 37 + bgOffset * 0.2) % GAME_WIDTH;
            const y = (i * 97) % (GAME_HEIGHT - 120);
            ctx.fillRect(x, y, (i % 3) + 1, (i % 3) + 1);
        }

        // Suelo Neón
        bgOffset += (gameState === STATE_PLAYING ? 2 : 0.5);
        const groundY = GAME_HEIGHT - 60;
        
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, groundY, GAME_WIDTH, 60);

        ctx.strokeStyle = '#ec4899';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, groundY);
        ctx.lineTo(GAME_WIDTH, groundY);
        ctx.stroke();

        // Rejilla Neón Animada en el Suelo
        ctx.strokeStyle = 'rgba(236, 72, 153, 0.3)';
        ctx.lineWidth = 1;
        const gridStep = 24;
        const shift = bgOffset % gridStep;

        for (let x = -gridStep; x < GAME_WIDTH + gridStep; x += gridStep) {
            ctx.beginPath();
            ctx.moveTo(x - shift, groundY);
            ctx.lineTo(x - shift - 15, GAME_HEIGHT);
            ctx.stroke();
        }
    }

    // -------------------------------------------------------------------------
    // 7. GESTIÓN DE ESTADOS Y TRANSICIONES
    // -------------------------------------------------------------------------
    async function triggerGameOver() {
        if (gameState === STATE_GAMEOVER) return;

        gameState = STATE_GAMEOVER;
        window.puntajeFinal = score; // Almacenar en variable global expuesta

        // Actualizar High Score local
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('cyber_runner_highscore', highScore);
        }

        // Invocar la función externa de guardado en Supabase
        if (typeof window.guardarPuntaje === 'function') {
            isSavingScore = true;
            scoreSaveStatus = 'Guardando en Supabase...';
            
            try {
                const res = await window.guardarPuntaje('cyber-runner', score);
                if (res && res.success) {
                    scoreSaveStatus = '✓ Puntaje guardado en Supabase!';
                } else {
                    scoreSaveStatus = 'Puntaje local (Sin Auth)';
                }
            } catch (err) {
                console.error("Error guardando puntaje:", err);
                scoreSaveStatus = 'Guardado localmente';
            } finally {
                isSavingScore = false;
            }
        }
    }

    function resetGame() {
        score = 0;
        obstacles.length = 0;
        particles.length = 0;
        obstacleConfig.timer = 0;
        player.reset();
        gameState = STATE_PLAYING;
    }

    // -------------------------------------------------------------------------
    // 8. INTERFAZ DE USUARIO RENDERIZADA EN CANVAS
    // -------------------------------------------------------------------------
    function drawUI() {
        ctx.save();

        if (gameState === STATE_START) {
            // Pantalla de Inicio
            ctx.fillStyle = 'rgba(9, 13, 22, 0.65)';
            ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

            ctx.textAlign = 'center';
            ctx.font = '900 32px "Space Grotesk", sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = '#8b5cf6';
            ctx.shadowBlur = 15;
            ctx.fillText('FLAPPY GEEK', GAME_WIDTH / 2, 220);

            ctx.shadowBlur = 0;
            ctx.font = '600 16px "Outfit", sans-serif';
            ctx.fillStyle = '#38bdf8';
            ctx.fillText('Haz Tap, Clic o Espacio para Volar', GAME_WIDTH / 2, 270);

            ctx.font = '400 14px "Outfit", sans-serif';
            ctx.fillStyle = '#9ca3af';
            ctx.fillText(`Récord Personal: ${highScore} pts`, GAME_WIDTH / 2, 310);

            // Botón Pulsante
            const pulseScale = 1 + Math.sin(Date.now() * 0.005) * 0.05;
            ctx.save();
            ctx.translate(GAME_WIDTH / 2, 380);
            ctx.scale(pulseScale, pulseScale);
            
            ctx.fillStyle = 'linear-gradient(135deg, #8b5cf6, #06b6d4)';
            ctx.fillStyle = '#8b5cf6';
            ctx.beginPath();
            ctx.roundRect(-80, -22, 160, 44, 12);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.font = '700 16px "Outfit", sans-serif';
            ctx.fillText('¡JUGAR AHORA!', 0, 6);
            ctx.restore();

        } else if (gameState === STATE_PLAYING) {
            // Contador de Puntaje en Juego
            ctx.textAlign = 'center';
            ctx.font = '900 48px "Space Grotesk", sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = '#06b6d4';
            ctx.shadowBlur = 12;
            ctx.fillText(score, GAME_WIDTH / 2, 90);

        } else if (gameState === STATE_GAMEOVER) {
            // Pantalla de Game Over
            ctx.fillStyle = 'rgba(9, 13, 22, 0.85)';
            ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

            ctx.textAlign = 'center';
            ctx.font = '900 36px "Space Grotesk", sans-serif';
            ctx.fillStyle = '#f87171';
            ctx.shadowColor = '#ef4444';
            ctx.shadowBlur = 15;
            ctx.fillText('¡FIN DEL JUEGO!', GAME_WIDTH / 2, 210);

            ctx.shadowBlur = 0;
            ctx.font = '700 22px "Outfit", sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(`Puntaje Obtenido: ${score}`, GAME_WIDTH / 2, 270);

            ctx.font = '600 16px "Outfit", sans-serif';
            ctx.fillStyle = '#c4b5fd';
            ctx.fillText(`Mejor Récord: ${highScore}`, GAME_WIDTH / 2, 310);

            // Estado de Guardado en Supabase
            if (scoreSaveStatus) {
                ctx.font = '500 14px "Outfit", sans-serif';
                ctx.fillStyle = isSavingScore ? '#facc15' : '#10b981';
                ctx.fillText(scoreSaveStatus, GAME_WIDTH / 2, 355);
            }

            // Indicador de Reintento
            ctx.font = '600 16px "Outfit", sans-serif';
            ctx.fillStyle = '#38bdf8';
            ctx.fillText('Toca o presiona Espacio para Reiniciar', GAME_WIDTH / 2, 420);
        }

        ctx.restore();
    }

    // -------------------------------------------------------------------------
    // 9. BUCLE PRINCIPAL DE RENDERIZADO (GAME LOOP)
    // -------------------------------------------------------------------------
    function gameLoop() {
        // Limpiar canvas
        ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Renderizar escena
        drawCyberBackground();

        if (gameState === STATE_PLAYING) {
            player.update();
            updateObstacles();
            checkCollisions();
        } else if (gameState === STATE_START) {
            // Animación suave del personaje en pantalla de inicio
            player.y = 280 + Math.sin(Date.now() * 0.004) * 10;
        }

        drawObstacles();
        player.draw();
        updateAndDrawParticles();
        drawUI();

        requestAnimationFrame(gameLoop);
    }

    // -------------------------------------------------------------------------
    // 10. CONTROLES "ONE-TOUCH" (TOUCHSTART, MOUSEDOWN Y KEYBOARD)
    // -------------------------------------------------------------------------
    function handleInput(e) {
        if (e.type === 'keydown' && e.code !== 'Space' && e.code !== 'ArrowUp') {
            return; // Ignorar otras teclas
        }

        // Prevenir scroll o zoom nativo en móviles
        if (e.cancelable && e.type !== 'keydown') {
            e.preventDefault();
        }

        if (gameState === STATE_START) {
            resetGame();
        } else if (gameState === STATE_PLAYING) {
            player.flap();
        } else if (gameState === STATE_GAMEOVER) {
            resetGame();
        }
    }

    // Registrar listeners unificados
    window.addEventListener('touchstart', handleInput, { passive: false });
    window.addEventListener('mousedown', handleInput);
    window.addEventListener('keydown', handleInput);

    // Iniciar Bucle de Juego
    requestAnimationFrame(gameLoop);

})();
