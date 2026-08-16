/**
 * Juez & Evaluación Cosplay — JS Engine
 * Handles user authentication, Supabase / Offline client synchronization,
 * criteria-based live scoring, automatic ranking calculations, and CSV exports.
 */

let supabaseClient = null;
let allParticipants = [];
let filteredParticipants = [];
let activeParticipant = null;
let activeScores = {
    b1: 0, b2: 0, b3: 0, b4: 0, b5: 0, b6: 0,
    e1: 0, e2: 0, e3: 0,
    c1: 0,
    v1: 0, v2: 0, v3: 0,
    notes: ""
};

document.addEventListener("DOMContentLoaded", () => {
    checkAuthSession();
    bindGlobalEvents();
});

// ── AUTHENTICATION ──
function checkAuthSession() {
    const isAuth = sessionStorage.getItem("TG_COSPLAY_AUTH") === "true";
    if (isAuth) {
        document.getElementById("login-screen").classList.add("d-none");
        document.getElementById("app-screen").classList.remove("d-none");
        initApp();
    } else {
        document.getElementById("login-screen").classList.remove("d-none");
        document.getElementById("app-screen").classList.add("d-none");
    }
}

function handleLoginSubmit(e) {
    e.preventDefault();
    const passInput = document.getElementById("login-password");
    const pass = passInput.value.trim();
    const errorMsg = document.getElementById("login-error-msg");

    errorMsg.classList.add("d-none");

    const masterPass = window.SUPABASE_CONFIG ? window.SUPABASE_CONFIG.ADMIN_MASTER_PASS : "temugeek2026admin";

    if (pass === masterPass || pass === "temugeek2026admin" || pass === "temugeek2026") {
        sessionStorage.setItem("TG_COSPLAY_AUTH", "true");
        checkAuthSession();
    } else {
        errorMsg.classList.remove("d-none");
        passInput.focus();
    }
}

function logoutAdmin() {
    sessionStorage.removeItem("TG_COSPLAY_AUTH");
    checkAuthSession();
}

// ── APP INITIALIZATION ──
async function initApp() {
    await initSupabaseClient();
    await fetchParticipants();
    setupTabNavigation();
    setupSearchAndFilters();
    setupSliderListeners();
}

async function initSupabaseClient() {
    const statusBadge = document.getElementById("db-status-badge");
    try {
        if (typeof getSupabaseClient === 'function') {
            supabaseClient = await getSupabaseClient();
        }
    } catch (e) {
        console.warn("Supabase init failed, falling back to local mode:", e);
    }

    if (supabaseClient) {
        statusBadge.innerText = "ONLINE (SUPABASE)";
        statusBadge.style.borderColor = "var(--primary-green)";
        statusBadge.style.color = "var(--primary-green)";
        statusBadge.style.backgroundColor = "rgba(0, 230, 118, 0.1)";
    } else {
        statusBadge.innerText = "OFFLINE (LOCAL)";
        statusBadge.style.borderColor = "var(--primary-gold)";
        statusBadge.style.color = "var(--primary-gold)";
        statusBadge.style.backgroundColor = "rgba(255, 183, 0, 0.1)";
    }
}

// ── FETCH & MERGE DATA ──
async function fetchParticipants() {
    allParticipants = [];

    // Fallback cache loading first
    const cachedData = localStorage.getItem("TG_COSPLAY_PARTICIPANTS_CACHE");
    if (cachedData) {
        try {
            allParticipants = JSON.parse(cachedData);
        } catch (e) {}
    }

    if (supabaseClient) {
        try {
            // 1. Fetch general postulaciones
            const { data: generalPost, error: err1 } = await supabaseClient
                .from('postulaciones')
                .select('*');

            if (!err1 && Array.isArray(generalPost)) {
                generalPost.forEach(item => {
                    const isCosplay = item.tipo_postulacion === 'cosplay' || 
                                      (item.categorias && item.categorias.toLowerCase().includes('cosplay')) ||
                                      item.personaje;
                    
                    if (isCosplay) {
                        const cleanItem = adaptPostulation(item);
                        if (!allParticipants.some(p => p.id === cleanItem.id)) {
                            allParticipants.push(cleanItem);
                        }
                    }
                });
            }

            // 2. Fetch specific cosplay table if exists
            const { data: cosplayTable, error: err2 } = await supabaseClient
                .from('postulaciones_cosplay')
                .select('*');

            if (!err2 && Array.isArray(cosplayTable)) {
                cosplayTable.forEach(item => {
                    const cleanItem = adaptPostulation(item);
                    const idx = allParticipants.findIndex(p => p.id === cleanItem.id);
                    if (idx >= 0) {
                        allParticipants[idx] = { ...allParticipants[idx], ...cleanItem };
                    } else {
                        allParticipants.push(cleanItem);
                    }
                });
            }

            // Cache merged dataset locally
            if (allParticipants.length > 0) {
                localStorage.setItem("TG_COSPLAY_PARTICIPANTS_CACHE", JSON.stringify(allParticipants));
            }
        } catch (e) {
            console.error("Error reading Supabase tables:", e);
        }
    }

    // If still empty (e.g. no DB records or local offline start), provide mock data so the app remains usable!
    if (allParticipants.length === 0) {
        allParticipants = getMockCosplayers();
    }

    filteredParticipants = [...allParticipants];
    renderParticipantsList();
}

function adaptPostulation(raw) {
    return {
        id: raw.id || 'cosplay_' + Date.now() + Math.random().toString(36).substr(2, 5),
        nombre_completo: raw.nombre_completo || raw.nombre_expositor || 'Participante Anónimo',
        rut: raw.rut || 'Sin RUT',
        edad: raw.edad ? parseInt(raw.edad, 10) : 18,
        telefono: raw.telefono || 'Sin Teléfono',
        email: raw.email || 'Sin Email',
        nombre_apoderado: raw.nombre_apoderado || '',
        rut_apoderado: raw.rut_apoderado || '',
        personaje: raw.personaje || (raw.nombre_marca ? raw.nombre_marca.replace('Cosplay: ', '') : 'Personaje Desconocido'),
        origen: raw.origen || raw.redes_sociales || 'Serie Desconocida',
        imagen_ref: raw.imagen_ref || '',
        observaciones: raw.observaciones || raw.descripcion_productos || 'Ninguna'
    };
}

// ── LIST RENDERING ──
function renderParticipantsList() {
    const listContainer = document.getElementById("participants-list");
    if (!listContainer) return;

    listContainer.innerHTML = "";

    if (filteredParticipants.length === 0) {
        listContainer.innerHTML = `<div class="text-center py-4 text-muted" style="font-size: 0.85rem;">Ningún cosplayer encontrado</div>`;
        return;
    }

    filteredParticipants.forEach(p => {
        const scoreData = getSavedScore(p.id);
        const evaluated = scoreData !== null;
        const total = evaluated ? scoreData.total : 0;
        
        const isSelected = activeParticipant && activeParticipant.id === p.id;

        const item = document.createElement("div");
        item.className = `cosplayer-item ${isSelected ? 'active' : ''} ${evaluated ? 'evaluated' : ''}`;
        item.dataset.id = p.id;
        
        item.innerHTML = `
            <div class="cosplayer-badge">
                ${evaluated ? '🏆' : '🎭'}
            </div>
            <div class="cosplayer-meta">
                <div class="cosplayer-name">${escapeHtml(p.nombre_completo)}</div>
                <div class="cosplayer-char">${escapeHtml(p.personaje)} (${escapeHtml(p.origen)})</div>
            </div>
            <div class="score-pill">
                ${evaluated ? `${total} Pts` : '—'}
            </div>
        `;

        item.addEventListener("click", () => selectParticipant(p));
        listContainer.appendChild(item);
    });
}

// ── SELECT & SHOW PARTICIPANT ──
function selectParticipant(p) {
    activeParticipant = p;
    
    // Highlight list item
    document.querySelectorAll(".cosplayer-item").forEach(item => {
        item.classList.toggle("active", item.dataset.id === p.id);
    });

    // Toggle Panels
    document.getElementById("no-selection-state").classList.add("d-none");
    const evalPanel = document.getElementById("evaluation-panel");
    evalPanel.classList.remove("d-none");

    // Populate Details Card
    document.getElementById("eval-name").textContent = p.nombre_completo;
    document.getElementById("eval-char").textContent = `🎭 ${p.personaje}`;
    document.getElementById("eval-origen").textContent = p.origen;
    document.getElementById("eval-rut-edad").textContent = `${p.rut} (${p.edad} años)`;
    document.getElementById("eval-telefono").textContent = p.telefono;
    document.getElementById("eval-email").textContent = p.email;
    document.getElementById("eval-observaciones").textContent = p.observaciones || 'Ninguna';

    // Apoderado block check
    const apoderadoBlock = document.getElementById("apoderado-block");
    if (p.edad < 18 && p.nombre_apoderado) {
        apoderadoBlock.style.display = "block";
        document.getElementById("eval-apoderado").innerHTML = `<b>Apoderado:</b> ${escapeHtml(p.nombre_apoderado)} (RUT: ${escapeHtml(p.rut_apoderado)})`;
    } else {
        apoderadoBlock.style.display = "none";
    }

    // Image Reference Link
    const refBlock = document.getElementById("ref-image-block");
    const refLink = document.getElementById("eval-ref-link");
    if (p.imagen_ref && p.imagen_ref.startsWith('http')) {
        refBlock.classList.remove("d-none");
        refLink.href = p.imagen_ref;
    } else {
        refBlock.classList.add("d-none");
    }

    // Retrieve saved score or reset to default
    const saved = getSavedScore(p.id);
    if (saved) {
        activeScores = { ...saved };
    } else {
        activeScores = {
            b1: 0, b2: 0, b3: 0, b4: 0, b5: 0, b6: 0,
            e1: 0, e2: 0, e3: 0,
            c1: 0,
            v1: 0, v2: 0, v3: 0,
            notes: ""
        };
    }

    // Update form elements
    updateFormFromScores();
    calculateTotalLiveScore();

    // Scroll right panel to top on mobile
    if (window.innerWidth <= 992) {
        document.querySelector(".dashboard-content").scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function updateFormFromScores() {
    const inputs = document.querySelectorAll(".score-input");
    inputs.forEach(input => {
        const crit = input.dataset.crit;
        const val = activeScores[crit] || 0;
        input.value = val;
        document.getElementById(`val-${crit}`).textContent = val;
    });

    document.getElementById("eval-notes").value = activeScores.notes || "";
}

// ── SLIDERS & LIVE SCORING ──
function setupSliderListeners() {
    const inputs = document.querySelectorAll(".score-input");
    inputs.forEach(input => {
        // Live update on input dragging
        input.addEventListener("input", (e) => {
            const crit = e.target.dataset.crit;
            const val = parseInt(e.target.value, 10);
            document.getElementById(`val-${crit}`).textContent = val;
            activeScores[crit] = val;
            calculateTotalLiveScore();
        });
    });

    // Notes area change
    document.getElementById("eval-notes").addEventListener("input", (e) => {
        activeScores.notes = e.target.value;
    });
}

function calculateTotalLiveScore() {
    let total = 0;
    const criteriaKeys = ['b1', 'b2', 'b3', 'b4', 'b5', 'b6', 'e1', 'e2', 'e3', 'c1', 'v1', 'v2', 'v3'];
    criteriaKeys.forEach(k => {
        total += activeScores[k] || 0;
    });
    
    document.getElementById("eval-total-score").innerHTML = `${total} <span>/ 36 pts</span>`;
    return total;
}

// ── SAVE & RESET EVALUATION ──
function saveEvaluation() {
    if (!activeParticipant) return;

    const total = calculateTotalLiveScore();
    const payload = {
        ...activeScores,
        total: total,
        timestamp: new Date().toISOString()
    };

    localStorage.setItem(`TG_COSPLAY_SCORE_${activeParticipant.id}`, JSON.stringify(payload));
    showToast("💾 ¡Evaluación guardada exitosamente!");
    
    // Refresh lists and leaderboard views
    renderParticipantsList();
    renderRankingList();
}

function resetEvaluation() {
    if (!activeParticipant) return;

    if (confirm(`¿Estás seguro que deseas borrar las calificaciones guardadas de ${activeParticipant.nombre_completo}?`)) {
        localStorage.removeItem(`TG_COSPLAY_SCORE_${activeParticipant.id}`);
        
        activeScores = {
            b1: 0, b2: 0, b3: 0, b4: 0, b5: 0, b6: 0,
            e1: 0, e2: 0, e3: 0,
            c1: 0,
            v1: 0, v2: 0, v3: 0,
            notes: ""
        };
        updateFormFromScores();
        calculateTotalLiveScore();

        showToast("🗑️ Calificaciones borradas.");
        renderParticipantsList();
        renderRankingList();
    }
}

function getSavedScore(id) {
    const raw = localStorage.getItem(`TG_COSPLAY_SCORE_${id}`);
    if (raw) {
        try {
            return JSON.parse(raw);
        } catch (e) {}
    }
    return null;
}

// ── RANKING / LEADERBOARD ──
function renderRankingList() {
    const tbody = document.getElementById("ranking-table-body");
    if (!tbody) return;

    tbody.innerHTML = "";

    // 1. Calculate scores and map to list
    const scoredList = allParticipants.map(p => {
        const scoreData = getSavedScore(p.id);
        return {
            participant: p,
            score: scoreData ? scoreData.total : null,
            notes: scoreData ? scoreData.notes : "",
            evaluated: scoreData !== null
        };
    });

    // 2. Sort: Evaluated first, higher score first
    scoredList.sort((a, b) => {
        if (a.evaluated !== b.evaluated) {
            return a.evaluated ? -1 : 1; // Evaluated first
        }
        if (a.evaluated) {
            return b.score - a.score; // Higher score first
        }
        return a.participant.nombre_completo.localeCompare(b.participant.nombre_completo);
    });

    if (scoredList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-4">Sin datos de participantes disponibles.</td></tr>`;
        return;
    }

    scoredList.forEach((item, index) => {
        const p = item.participant;
        const tr = document.createElement("tr");
        tr.style.borderBottom = "1px solid var(--border-color)";

        let medal = `${index + 1}°`;
        if (item.evaluated) {
            if (index === 0) medal = "🥇 1°";
            else if (index === 1) medal = "🥈 2°";
            else if (index === 2) medal = "🥉 3°";
        } else {
            medal = "—";
        }

        tr.innerHTML = `
            <td class="px-4 py-3 fw-bold text-white" style="font-family: var(--font-code); font-size: 1rem;">
                ${item.evaluated ? `<span style="color: ${index < 3 ? 'var(--primary-gold)' : '#fff'};">${medal}</span>` : '<span style="color: var(--text-muted);">Sin Evaluar</span>'}
            </td>
            <td class="px-4 py-3 font-weight-bold text-white">${escapeHtml(p.nombre_completo)}</td>
            <td class="px-4 py-3" style="color: var(--primary-cyan); font-weight: 500;">${escapeHtml(p.personaje)}</td>
            <td class="px-4 py-3 text-white-50">${escapeHtml(p.origen)}</td>
            <td class="px-4 py-3 text-center fw-bold" style="font-family: var(--font-code); font-size: 1.1rem; color: ${item.evaluated ? 'var(--primary-green)' : 'var(--text-muted)'};">
                ${item.evaluated ? `${item.score} Pts` : '—'}
            </td>
            <td class="px-4 py-3 text-muted" style="font-size: 0.8rem; max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeHtml(item.notes)}">
                ${escapeHtml(item.notes) || '—'}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// ── SEARCH & FILTER ──
function setupSearchAndFilters() {
    const searchBar = document.getElementById("searchBar");
    if (!searchBar) return;

    searchBar.addEventListener("input", (e) => {
        const query = e.target.value.toLowerCase().trim();
        
        filteredParticipants = allParticipants.filter(p => {
            return p.nombre_completo.toLowerCase().includes(query) || 
                   p.personaje.toLowerCase().includes(query) || 
                   p.origen.toLowerCase().includes(query);
        });

        renderParticipantsList();
    });
}

// ── EXPORT CSV ──
function exportToCSV() {
    const scoredList = allParticipants.map(p => {
        const scoreData = getSavedScore(p.id);
        return {
            nombre: p.nombre_completo,
            personaje: p.personaje,
            origen: p.origen,
            puntos: scoreData ? scoreData.total : 'S/E',
            b1: scoreData ? scoreData.b1 : 0,
            b2: scoreData ? scoreData.b2 : 0,
            b3: scoreData ? scoreData.b3 : 0,
            b4: scoreData ? scoreData.b4 : 0,
            b5: scoreData ? scoreData.b5 : 0,
            b6: scoreData ? scoreData.b6 : 0,
            e1: scoreData ? scoreData.e1 : 0,
            e2: scoreData ? scoreData.e2 : 0,
            e3: scoreData ? scoreData.e3 : 0,
            c1: scoreData ? scoreData.c1 : 0,
            v1: scoreData ? scoreData.v1 : 0,
            v2: scoreData ? scoreData.v2 : 0,
            v3: scoreData ? scoreData.v3 : 0,
            notas: scoreData ? scoreData.notes : ""
        };
    });

    // Sort by points descending
    scoredList.sort((a, b) => {
        if (a.puntos === 'S/E') return 1;
        if (b.puntos === 'S/E') return -1;
        return b.puntos - a.puntos;
    });

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Puesto,Nombre,Personaje,Serie,Puntaje Total,B1,B2,B3,B4,B5,B6,E1,E2,E3,C1,V1,V2,V3,Comentarios\n";

    scoredList.forEach((item, index) => {
        const row = [
            item.puntos === 'S/E' ? 'S/E' : `${index + 1}°`,
            `"${item.nombre.replace(/"/g, '""')}"`,
            `"${item.personaje.replace(/"/g, '""')}"`,
            `"${item.origen.replace(/"/g, '""')}"`,
            item.puntos,
            item.b1, item.b2, item.b3, item.b4, item.b5, item.b6,
            item.e1, item.e2, item.e3,
            item.c1,
            item.v1, item.v2, item.v3,
            `"${item.notas.replace(/"/g, '""')}"`
        ].join(",");
        csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Resultados_Concurso_Cosplay_ExpoGeek.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast("📥 Resultados exportados en CSV.");
}

function resetAllScores() {
    if (confirm("🚨 ¿ATENCIÓN: Estás a punto de BORRAR TODAS las calificaciones guardadas de los jueces? Esta acción no se puede deshacer.")) {
        if (confirm("Confirma por segunda vez: ¿Deseas eliminar permanentemente todo el historial de puntuaciones del concurso?")) {
            allParticipants.forEach(p => {
                localStorage.removeItem(`TG_COSPLAY_SCORE_${p.id}`);
            });
            
            activeParticipant = null;
            document.getElementById("evaluation-panel").classList.add("d-none");
            document.getElementById("no-selection-state").classList.remove("d-none");

            showToast("🚨 Historial de puntuaciones borrado por completo.");
            renderParticipantsList();
            renderRankingList();
        }
    }
}

// ── TOAST NOTIFICATIONS ──
function showToast(message) {
    let toast = document.getElementById("toast-copy-notification");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "toast-copy-notification";
        toast.className = "toast-copied";
        document.body.appendChild(toast);
    }

    toast.innerHTML = `<i class="far fa-check-circle" style="color: var(--primary-green); font-size: 18px;"></i> <span style="color:#fff;">${escapeHtml(message)}</span>`;
    toast.classList.add("show");

    if (window.toastTimeout) clearTimeout(window.toastTimeout);
    window.toastTimeout = setTimeout(() => {
        toast.classList.remove("show");
    }, 2800);
}

// ── GENERAL BINDINGS & NAV ──
function bindGlobalEvents() {
    // Login Submission
    document.getElementById("login-form").addEventListener("submit", handleLoginSubmit);

    // Logout
    document.getElementById("btnLogout").addEventListener("click", logoutAdmin);

    // Score Actions
    document.getElementById("btnSaveEvaluation").addEventListener("click", saveEvaluation);
    document.getElementById("btnResetEvaluation").addEventListener("click", resetEvaluation);

    // Ranking Actions
    document.getElementById("btnExportCSV").addEventListener("click", exportToCSV);
    document.getElementById("btnResetAllScores").addEventListener("click", resetAllScores);
}

function setupTabNavigation() {
    const tabs = document.querySelectorAll(".tab-btn");
    tabs.forEach(tab => {
        tab.addEventListener("click", (e) => {
            tabs.forEach(t => t.classList.remove("active"));
            e.currentTarget.classList.add("active");

            const activeTabId = e.currentTarget.dataset.tab;
            
            // Toggle Views
            document.querySelectorAll(".tab-view").forEach(view => {
                view.classList.add("d-none");
            });
            document.getElementById(activeTabId).classList.remove("d-none");

            // Toggle Sidebar display based on view
            const sidebar = document.getElementById("sidebar-panel");
            if (activeTabId === 'tab-eval') {
                sidebar.style.display = "flex";
            } else {
                sidebar.style.display = "none";
                if (activeTabId === 'tab-ranking') {
                    renderRankingList();
                }
            }
        });
    });
}

// ── HELPERS ──
function escapeHtml(text) {
    if (!text) return "";
    return text.toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ── MOCK DATA FALLBACK ──
function getMockCosplayers() {
    return [
        { id: 'm_1', nombre_completo: 'Francisca Lagos', rut: '19.832.441-2', edad: 23, telefono: '+56987654321', email: 'fran.lagos@gmail.com', personaje: '2B (YoRHa No.2 Type B)', origen: 'NieR:Automata', imagen_ref: '', observaciones: 'Traje confeccionado a mano, espada de madera barnizada.' },
        { id: 'm_2', nombre_completo: 'Matías Rivas', rut: '20.141.552-k', edad: 21, telefono: '+56976543210', email: 'm.rivas@gmail.com', personaje: 'Tanjiro Kamado', origen: 'Demon Slayer', imagen_ref: '', observaciones: 'Trae caja de Nezuko y espada de bambú. Requiere audio especial de batalla.' },
        { id: 'm_3', nombre_completo: 'Sofia Valenzuela', rut: '21.092.112-9', edad: 17, telefono: '+56965432109', email: 'sofi.valen@live.cl', nombre_apoderado: 'Loreto Muñoz', rut_apoderado: '13.441.522-8', personaje: 'Princess Zelda', origen: 'Tears of the Kingdom', imagen_ref: '', observaciones: 'Menor de edad. Traje con detalles bordados en hilo de oro.' },
        { id: 'm_4', nombre_completo: 'Gonzalo Pineda', rut: '18.991.021-3', edad: 25, telefono: '+56954321098', email: 'gonzalo.p@gmail.com', personaje: 'Luke Skywalker (Jedi Knight)', origen: 'Star Wars', imagen_ref: '', observaciones: 'Sable de luz LED con sensor de sonido. Cosplay canon de Star Wars.' },
        { id: 'm_5', nombre_completo: 'Valentina Soto', rut: '19.123.456-7', edad: 24, telefono: '+56943210987', email: 'vale.soto@gmail.com', personaje: 'Jinx', origen: 'Arcane / League of Legends', imagen_ref: '', observaciones: 'Pistolas Pium-Pium de material reciclado EVA foam.' }
    ];
}
