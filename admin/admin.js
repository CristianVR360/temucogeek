        let supabaseClient = null;
        let allLeads = [];
        let filteredLeads = [];
        let selectedLeadId = null;

        let allNomina = [];
        let filteredNomina = [];
        let selectedNominaId = null;

        let allTorneos = [];
        let filteredTorneos = [];
        let selectedTorneoId = null;

        let currentMainTab = 'postulaciones';

        // COPY TO CLIPBOARD HELPER
        function copyToClipboard(text, label = 'Dato', event = null) {
            if (event) {
                event.preventDefault();
                event.stopPropagation();
            }
            if (!text) return;

            const cleanText = String(text)
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'")
                .trim();

            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(cleanText).then(() => {
                    showCopyToast(`¡${label} copiado!`, cleanText);
                }).catch(() => {
                    fallbackCopyTextToClipboard(cleanText, label);
                });
            } else {
                fallbackCopyTextToClipboard(cleanText, label);
            }
        }

        function fallbackCopyTextToClipboard(text, label) {
            const textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.position = "fixed";
            textArea.style.left = "-9999px";
            textArea.style.top = "-9999px";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                const successful = document.execCommand('copy');
                if (successful) {
                    showCopyToast(`¡${label} copiado!`, text);
                } else {
                    alert(`No se pudo copiar: ${text}`);
                }
            } catch (err) {
                console.error('Error al copiar:', err);
            }
            document.body.removeChild(textArea);
        }

        function showCopyToast(msg, val) {
            let toast = document.getElementById("toast-copy-notification");
            if (!toast) {
                toast = document.createElement("div");
                toast.id = "toast-copy-notification";
                toast.className = "toast-copied";
                document.body.appendChild(toast);
            }

            toast.innerHTML = `<i class="far fa-check-circle" style="color: #00e676; font-size: 16px;"></i> <span>${escapeHtml(msg)}</span> <code style="background: rgba(255,255,255,0.15); color: #fff; padding: 2px 8px; border-radius: 6px; font-size: 12px; font-family: monospace;">${escapeHtml(val)}</code>`;
            toast.classList.add("show");

            if (window.copyToastTimeout) clearTimeout(window.copyToastTimeout);
            window.copyToastTimeout = setTimeout(() => {
                toast.classList.remove("show");
            }, 2500);
        }

        document.addEventListener("DOMContentLoaded", function() {
            checkAuthSession();
        });

        // AUTHENTICATION LOGIC
        async function checkAuthSession() {
            const isAuth = sessionStorage.getItem("TG_ADMIN_AUTH") === "true";
            if (isAuth) {
                document.getElementById("login-screen").classList.add("d-none");
                document.getElementById("dashboard-app").classList.remove("d-none");
                await initSupabase();
                loadLeads();
                loadNominaData();
                loadTorneosData();
            } else {
                document.getElementById("login-screen").classList.remove("d-none");
                document.getElementById("dashboard-app").classList.add("d-none");
            }
        }

        function togglePasswordVisibility() {
            const passInput = document.getElementById("login-password");
            const passIcon = document.getElementById("toggle-password-icon");
            if (passInput.type === "password") {
                passInput.type = "text";
                passIcon.className = "far fa-eye-slash";
            } else {
                passInput.type = "password";
                passIcon.className = "far fa-eye";
            }
        }

        async function handleLoginSubmit(e) {
            e.preventDefault();
            const user = document.getElementById("login-user").value.trim();
            const pass = document.getElementById("login-password").value.trim();
            const errorMsg = document.getElementById("login-error-msg");

            errorMsg.classList.add("d-none");
            
            // Safe env load
            if (window.loadEnvConfig) {
                await window.loadEnvConfig();
            }

            // Check Supabase Auth if client is configured
            let loginSuccess = false;

            const sb = window.getSupabaseClient ? await window.getSupabaseClient() : null;
            if (sb) {
                try {
                    const { data, error } = await sb.auth.signInWithPassword({ email: user, password: pass });
                    if (!error && data.user) {
                        loginSuccess = true;
                    }
                } catch (err) {
                    console.warn("Supabase Auth error:", err);
                }
            }

            // Fallback Check using Master Config Pass from .env / default master pass
            const configObj = window.SUPABASE_CONFIG;
            const envMasterPass = configObj ? configObj.ADMIN_MASTER_PASS : "";
            if (!loginSuccess) {
                if ((envMasterPass && pass === envMasterPass) || pass === "temugeek2026admin" || pass === "temugeek2026") {
                    loginSuccess = true;
                }
            }

            if (loginSuccess) {
                sessionStorage.setItem("TG_ADMIN_AUTH", "true");
                await checkAuthSession();
            } else {
                errorMsg.classList.remove("d-none");
            }
        }

        function logoutAdmin() {
            sessionStorage.removeItem("TG_ADMIN_AUTH");
            if (supabaseClient) {
                try { supabaseClient.auth.signOut(); } catch(e){}
            }
            checkAuthSession();
        }

        // SUPABASE CLIENT INIT
        async function initSupabase() {
            supabaseClient = window.getSupabaseClient ? await window.getSupabaseClient() : null;
            const statusDot = document.getElementById("status-dot");
            const statusText = document.getElementById("status-text");

            if (supabaseClient) {
                statusDot.className = "status-dot online";
                statusText.textContent = "Supabase Conectado (.env)";
            } else {
                statusDot.className = "status-dot offline";
                statusText.textContent = "Modo Resiliencia (Local)";
            }
        }

        // LOAD LEADS DATA (100% Exclusivo Supabase)
        async function loadLeads() {
            allLeads = [];

            if (supabaseClient) {
                try {
                    // 1. Cargar postulaciones generales
                    const { data: expositores, error: err1 } = await supabaseClient
                        .from('postulaciones')
                        .select('*')
                        .order('created_at', { ascending: false });

                    if (!err1 && Array.isArray(expositores)) {
                        expositores.forEach(item => {
                            item.tipo_postulacion = item.personaje ? 'cosplay' : (item.tipo_postulacion || 'expositor');
                            allLeads.push(item);
                        });
                    }

                    // 2. Cargar postulaciones del concurso de cosplay si existe tabla postulaciones_cosplay
                    const { data: cosplays, error: err2 } = await supabaseClient
                        .from('postulaciones_cosplay')
                        .select('*')
                        .order('fecha_creacion', { ascending: false });

                    if (!err2 && Array.isArray(cosplays)) {
                        cosplays.forEach(item => {
                            item.tipo_postulacion = 'cosplay';
                            if (!item.created_at && item.fecha_creacion) item.created_at = item.fecha_creacion;
                            if (!allLeads.some(l => l.id === item.id)) {
                                allLeads.push(item);
                            }
                        });
                    }

                    console.log(`✅ Supabase: Se cargaron ${allLeads.length} postulaciones reales.`);
                } catch (err) {
                    console.error("❌ Excepción Supabase:", err);
                }
            } else {
                loadLocalLeads();
            }

            populateCategoryFilter();
            applyFilters();
        }

        function populateCategoryFilter() {
            const catSelect = document.getElementById("filter-categoria");
            if (!catSelect) return;

            const currentVal = catSelect.value;
            catSelect.innerHTML = '<option value="">Categoría: Todas</option>';

            const categoriesSet = new Set();
            allLeads.forEach(l => {
                if (l.categorias) {
                    const cats = String(l.categorias).split(',');
                    cats.forEach(c => {
                        const trimmed = c.trim();
                        if (trimmed) categoriesSet.add(trimmed);
                    });
                }
            });

            const sortedCats = Array.from(categoriesSet).sort();
            sortedCats.forEach(cat => {
                const opt = document.createElement("option");
                opt.value = cat;
                opt.textContent = cat;
                catSelect.appendChild(opt);
            });

            catSelect.value = currentVal;
        }

        function loadLocalLeads() {
            const localData = localStorage.getItem("TG_POSTULACIONES_LOCAL");
            allLeads = localData ? JSON.parse(localData) : [];
        }

        function saveLocalLeads() {
            localStorage.setItem("TG_POSTULACIONES_LOCAL", JSON.stringify(allLeads));
        }

        // RENDER DASHBOARD
        function renderDashboard() {
            const tbody = document.getElementById("leads-table-body");
            const emptyState = document.getElementById("empty-state");

            tbody.innerHTML = "";

            if (filteredLeads.length === 0) {
                emptyState.classList.remove("d-none");
            } else {
                emptyState.classList.add("d-none");

                filteredLeads.forEach(lead => {
                    const tr = document.createElement("tr");

                    const createdDate = new Date(lead.created_at || Date.now()).toLocaleDateString('es-CL', {
                        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                    });

                    const isCosplay = String(lead.tipo_postulacion || '').toLowerCase() === 'cosplay' || Boolean(lead.personaje);
                    const st = String(lead.estado || 'pendiente').toLowerCase();
                    const statusClass = `badge-${st}`;

                    const isCanje = isLeadCanje(lead);
                    const priceVal = getLeadPrice(lead);

                    const tipoBadge = isCosplay 
                        ? '<span class="badge" style="background: rgba(139, 92, 246, 0.2); color: #a78bfa; border: 1px solid #8b5cf6; font-size: 10px;"><i class="far fa-mask me-1"></i>COSPLAY</span>'
                        : '<span class="badge" style="background: rgba(233, 38, 82, 0.2); color: #ff4a75; border: 1px solid #e92652; font-size: 10px;"><i class="far fa-store me-1"></i>EXPOSITOR</span>';

                    const titleText = isCosplay ? `Personaje: ${escapeHtml(lead.personaje)}` : escapeHtml(lead.nombre_marca);
                    const subText = isCosplay ? `Cosplayer: ${escapeHtml(lead.nombre_completo)}` : escapeHtml(lead.nombre_expositor);
                    const ciudadBadge = `<span class="badge bg-dark border border-secondary text-muted ms-1" style="font-size:10px;">${escapeHtml(lead.ciudad || 'Temuco')}</span>`;

                    const catBadges = lead.categorias 
                        ? String(lead.categorias).split(',').map(c => `<span class="badge bg-dark border border-info text-info ms-1 mt-1 d-inline-block" style="font-size:10px;">${escapeHtml(c.trim())}</span>`).join(' ')
                        : '';

                    const detailText = isCosplay 
                        ? (lead.observaciones ? escapeHtml(lead.observaciones) : 'Sin observaciones') 
                        : `<div><span class="badge bg-dark border border-secondary text-white" style="font-size:12px;">${escapeHtml(lead.espacio_tipo || 'Stand')}</span></div>${catBadges ? '<div class="mt-1">' + catBadges + '</div>' : ''}`;

                    const modalidadBadge = isCosplay
                        ? '<span class="badge bg-secondary opacity-75" style="font-size: 11px;">Gratuito</span>'
                        : (isCanje 
                            ? `<button class="btn btn-sm btn-info font-weight-bold text-dark border-0 shadow-sm py-1 px-2" onclick="toggleLeadCanjeDirect('${lead.id}')" title="Haz clic para alternar a Tarifa Estándar"><i class="far fa-handshake me-1"></i>CANJE ($0)</button>`
                            : `<button class="btn btn-sm btn-outline-secondary font-weight-bold py-1 px-2" onclick="toggleLeadCanjeDirect('${lead.id}')" title="Haz clic para alternar a Canje / Costo Cero ($0)"><i class="far fa-credit-card me-1 text-success"></i>Estándar ($${priceVal.toLocaleString('es-CL')})</button>`
                        );

                    const statusCell = st === 'pagado'
                        ? `<span class="badge-status badge-pagado"><i class="far fa-check-circle me-1"></i>PAGADO</span> <button class="btn btn-sm text-muted p-0 ms-1 border-0" onclick="quickMarkPagado('${lead.id}')" title="Deshacer pago"><i class="far fa-undo small"></i></button>`
                        : `<div class="d-flex align-items-center gap-1"><span class="badge-status ${statusClass}">${st.toUpperCase()}</span> <button class="btn btn-sm btn-outline-success font-weight-bold py-0 px-2" style="font-size:11px; white-space:nowrap;" onclick="quickMarkPagado('${lead.id}')" title="Marcar como PAGADO en 1 clic"><i class="far fa-receipt me-1"></i>Marcar Pagado</button></div>`;

                    tr.innerHTML = `
                        <td style="white-space: nowrap;">
                            <div style="font-size: 12px; color: #ffffff; font-weight: bold;">${createdDate}</div>
                            <div class="mt-1">${tipoBadge}</div>
                        </td>
                        <td>
                            <div style="font-weight: bold; color: #ffffff; font-size: 14px;">
                                <span class="copyable" data-copy-text="${escapeHtml(lead.nombre_marca || lead.personaje)}" onclick="copyToClipboard(this.dataset.copyText, 'Marca / Personaje', event)" title="Haz clic para copiar">${titleText}</span>
                                ${ciudadBadge}
                            </div>
                            <div style="font-size: 12px; color: var(--text-muted);">
                                <span class="copyable" data-copy-text="${escapeHtml(lead.nombre_expositor || lead.nombre_completo)}" onclick="copyToClipboard(this.dataset.copyText, 'Nombre', event)" title="Haz clic para copiar el nombre">${subText}</span>
                            </div>
                            <div style="font-size: 12px; color: #cbd5e1;" class="mt-1">
                                <span class="copyable me-1" data-copy-text="${escapeHtml(lead.email)}" onclick="copyToClipboard(this.dataset.copyText, 'Correo', event)" title="Haz clic para copiar el correo">
                                    <i class="far fa-envelope text-secondary me-1"></i><span style="color:#cbd5e1;">${escapeHtml(lead.email)}</span>
                                </span>
                                <span class="mx-1 text-secondary">•</span>
                                <span class="copyable" data-copy-text="${escapeHtml(lead.telefono)}" onclick="copyToClipboard(this.dataset.copyText, 'Teléfono', event)" title="Haz clic para copiar el teléfono">
                                    <i class="fab fa-whatsapp text-success me-1"></i><span style="color:#00d264; font-weight:bold;">${escapeHtml(lead.telefono)}</span>
                                </span>
                            </div>
                        </td>
                        <td>${detailText}</td>
                        <td>${modalidadBadge}</td>
                        <td>${statusCell}</td>
                        <td class="text-end" style="white-space: nowrap;">
                            <button class="btn-whatsapp me-1" onclick="openWhatsApp('${escapeHtml(lead.telefono)}', '${escapeHtml(lead.nombre_completo || lead.nombre_expositor)}', '${escapeHtml(lead.personaje || lead.nombre_marca)}', ${isCosplay})" title="Contactar por WhatsApp">
                                <i class="fab fa-whatsapp"></i> WSP
                            </button>
                            <button class="btn btn-sm btn-outline-warning me-1" onclick="sendQuickApprovalEmail('${lead.id}')" title="Reenviar Correo de Aprobación Oficial">
                                <i class="far fa-paper-plane"></i>
                            </button>
                            <button class="btn-action me-1" onclick="viewLeadDetail('${lead.id}')" title="Ver detalle completo">
                                <i class="far fa-eye"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="deleteSingleLead('${lead.id}', '${escapeHtml(lead.personaje || lead.nombre_marca)}')" title="Eliminar postulación">
                                <i class="far fa-trash-alt"></i>
                            </button>
                        </td>
                    `;
                    tbody.appendChild(tr);
                });
            }

            updateKPIs();
        }

        function isLeadCanje(lead) {
            if (!lead) return false;
            if (lead.es_canje === true || lead.es_canje === 'true' || lead.es_canje === 1) return true;
            if (lead.espacio_tipo) {
                const text = String(lead.espacio_tipo).toLowerCase();
                if (text.includes('canje') || text.includes('costo cero') || text.includes('gratis') || text.includes('$0')) {
                    return true;
                }
            }
            if (lead.notas_internas) {
                const notes = String(lead.notas_internas).toLowerCase();
                if (notes.includes('canje') || notes.includes('costo cero')) {
                    return true;
                }
            }
            return false;
        }

        function getLeadPrice(lead) {
            if (!lead) return 0;

            // 1. Concurso Cosplay -> $0
            const isCosplay = String(lead.tipo_postulacion || '').toLowerCase() === 'cosplay' || Boolean(lead.personaje);
            if (isCosplay) return 0;

            // 2. Canje / Costo Cero -> $0
            if (isLeadCanje(lead)) return 0;

            // 3. Si existe monto/precio numérico explícito asignado
            if (lead.monto !== undefined && lead.monto !== null && !isNaN(Number(lead.monto)) && Number(lead.monto) >= 0) {
                return Number(lead.monto);
            }
            if (lead.precio !== undefined && lead.precio !== null && !isNaN(Number(lead.precio)) && Number(lead.precio) >= 0) {
                return Number(lead.precio);
            }

            // 4. Parsear texto de espacio_tipo para postulaciones antiguas y nuevas
            if (lead.espacio_tipo) {
                const text = String(lead.espacio_tipo).toLowerCase();
                if (text.includes('60.000') || text.includes('60000') || text.includes('food truck') || text.includes('foodtruck')) return 60000;
                if (text.includes('40.000') || text.includes('40000') || text.includes('3x3')) return 40000;
                if (text.includes('20.000') || text.includes('20000') || text.includes('2x2') || text.includes('stand')) return 20000;

                const match = text.match(/\$\s*(\d{1,3}(?:\.\d{3})*)/);
                if (match && match[1]) {
                    const parsed = parseInt(match[1].replace(/\./g, ''), 10);
                    if (!isNaN(parsed) && parsed > 0) return parsed;
                }
            }

            return 20000;
        }

        function updateKPIs() {
            document.getElementById("kpi-total").textContent = allLeads.length;

            const pendientes = allLeads.filter(l => String(l.estado || 'pendiente').toLowerCase() === 'pendiente').length;
            document.getElementById("kpi-pendientes").textContent = pendientes;

            const aprobados = allLeads.filter(l => String(l.estado || '').toLowerCase() === 'aprobado').length;
            document.getElementById("kpi-aprobados").textContent = aprobados;

            const pagados = allLeads.filter(l => String(l.estado || '').toLowerCase() === 'pagado').length;
            document.getElementById("kpi-pagados").textContent = pagados;

            let recaudacionReal = 0;
            let recaudacionEstimada = 0;

            allLeads.forEach(l => {
                const st = String(l.estado || '').toLowerCase();
                const price = getLeadPrice(l);

                if (st === 'pagado') {
                    recaudacionReal += price;
                    recaudacionEstimada += price;
                } else if (st === 'aprobado') {
                    recaudacionEstimada += price;
                }
            });

            document.getElementById("kpi-recaudacion-real").textContent = '$' + recaudacionReal.toLocaleString('es-CL');
            document.getElementById("kpi-recaudacion").textContent = '$' + recaudacionEstimada.toLocaleString('es-CL');
        }

        function applyFilters() {
            const search = document.getElementById("search-input").value.toLowerCase().trim();
            const tipo = document.getElementById("filter-tipo").value;
            const estado = document.getElementById("filter-estado").value;
            const espacio = document.getElementById("filter-espacio").value;
            const categoriaSelect = document.getElementById("filter-categoria");
            const categoria = categoriaSelect ? categoriaSelect.value.toLowerCase().trim() : "";

            filteredLeads = allLeads.filter(l => {
                const isCosplay = String(l.tipo_postulacion || '').toLowerCase() === 'cosplay' || Boolean(l.personaje);
                const leadTipo = isCosplay ? 'cosplay' : 'expositor';

                const matchTipo = !tipo || leadTipo === tipo;

                const matchSearch = !search ||
                    (l.nombre_expositor && l.nombre_expositor.toLowerCase().includes(search)) ||
                    (l.nombre_completo && l.nombre_completo.toLowerCase().includes(search)) ||
                    (l.nombre_marca && l.nombre_marca.toLowerCase().includes(search)) ||
                    (l.personaje && l.personaje.toLowerCase().includes(search)) ||
                    (l.origen && l.origen.toLowerCase().includes(search)) ||
                    (l.email && l.email.toLowerCase().includes(search)) ||
                    (l.ciudad && l.ciudad.toLowerCase().includes(search)) ||
                    (l.categorias && l.categorias.toLowerCase().includes(search));

                const matchEstado = !estado || String(l.estado || 'pendiente').toLowerCase() === estado.toLowerCase();
                const matchEspacio = !espacio || (l.espacio_tipo && l.espacio_tipo.includes(espacio));
                const matchCategoria = !categoria || (l.categorias && String(l.categorias).toLowerCase().includes(categoria));

                return matchTipo && matchSearch && matchEstado && matchEspacio && matchCategoria;
            });

            renderDashboard();
        }

        function resetFilters() {
            document.getElementById("search-input").value = "";
            document.getElementById("filter-tipo").value = "";
            document.getElementById("filter-estado").value = "";
            document.getElementById("filter-espacio").value = "";
            const catSelect = document.getElementById("filter-categoria");
            if (catSelect) catSelect.value = "";
            applyFilters();
        }

        // DELETE FUNCTIONS
        async function deleteSingleLead(id, nombre) {
            if (!confirm(`¿Estás seguro de que deseas eliminar la postulación de "${nombre}"?`)) {
                return;
            }

            if (supabaseClient) {
                try {
                    await supabaseClient.from('postulaciones_cosplay').delete().eq('id', id);
                    await supabaseClient.from('postulaciones').delete().eq('id', id);
                } catch (err) {
                    console.error("Excepción al eliminar registro:", err);
                }
            }

            allLeads = allLeads.filter(l => l.id != id);
            saveLocalLeads();
            applyFilters();
        }

        async function purgeDemoLeads() {
            if (!confirm("⚠️ ¿Deseas eliminar las postulaciones seleccionadas de la lista?")) {
                return;
            }
            allLeads = [];
            localStorage.removeItem("TG_POSTULACIONES_LOCAL");
            applyFilters();
        }

        function viewLeadDetail(id) {
            const lead = allLeads.find(l => l.id == id);
            if (!lead) return;

            selectedLeadId = id;
            const isCosplay = lead.tipo_postulacion === 'cosplay' || Boolean(lead.personaje);

            document.getElementById("modal-lead-title").textContent = isCosplay 
                ? `🎭 Concurso Cosplay: ${lead.personaje} (${lead.nombre_completo})` 
                : `${lead.nombre_marca} — Detalle Expositor`;

            const modalBody = document.getElementById("modal-lead-body");

            if (isCosplay) {
                const esMenor = lead.edad && parseInt(lead.edad, 10) < 18;
                modalBody.innerHTML = `
                    <div class="row g-3">
                        <div class="col-md-6">
                            <div class="p-3 bg-dark rounded border" style="border-color: #8b5cf6 !important;">
                                <h6 style="color: #8b5cf6; font-weight: bold;"><i class="far fa-mask me-1"></i> Datos del Cosplay</h6>
                                <div><strong>Personaje:</strong> <span style="color:#ffe62e; font-size:16px; font-weight:bold;">${escapeHtml(lead.personaje)}</span></div>
                                <div><strong>Serie / Origen:</strong> ${escapeHtml(lead.origen)}</div>
                                <div><strong>Imagen Referencia B1:</strong> <a href="${escapeHtml(lead.imagen_ref)}" target="_blank" style="color: #38bdf8; font-weight: bold;">Ver Foto Referencia 🔗</a></div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="p-3 bg-dark rounded border border-secondary">
                                <h6 style="color: #00d264; font-weight: bold;"><i class="far fa-user me-1"></i> Datos del Participante</h6>
                                <div><strong>Cosplayer:</strong> <span class="copyable" data-copy-text="${escapeHtml(lead.nombre_completo)}" onclick="copyToClipboard(this.dataset.copyText, 'Nombre', event)" title="Haz clic para copiar el nombre">${escapeHtml(lead.nombre_completo)}</span> (RUT: ${escapeHtml(lead.rut)})</div>
                                <div><strong>Edad:</strong> ${escapeHtml(lead.edad)} años ${esMenor ? '<span class="badge bg-danger">MENOR DE EDAD</span>' : ''}</div>
                                <div><strong>Correo:</strong> <span class="copyable" data-copy-text="${escapeHtml(lead.email)}" onclick="copyToClipboard(this.dataset.copyText, 'Correo', event)" title="Haz clic para copiar el correo">${escapeHtml(lead.email)}</span></div>
                                <div><strong>WhatsApp:</strong> <span class="copyable" data-copy-text="${escapeHtml(lead.telefono)}" onclick="copyToClipboard(this.dataset.copyText, 'Teléfono', event)" title="Haz clic para copiar el teléfono">${escapeHtml(lead.telefono)}</span></div>
                            </div>
                        </div>

                        ${esMenor ? `
                        <div class="col-md-12">
                            <div class="p-3 bg-dark rounded border border-warning">
                                <h6 style="color: #ffe62e; font-weight: bold;"><i class="far fa-user-shield me-1"></i> Adulto Responsable (Menor de 18 Años)</h6>
                                <div class="row">
                                    <div class="col-md-6"><strong>Nombre Apoderado:</strong> ${escapeHtml(lead.nombre_apoderado || '-')}</div>
                                    <div class="col-md-6"><strong>RUT Apoderado:</strong> ${escapeHtml(lead.rut_apoderado || '-')}</div>
                                </div>
                            </div>
                        </div>` : ''}

                        ${lead.observaciones ? `
                        <div class="col-md-12">
                            <div class="p-3 bg-dark rounded border border-secondary">
                                <h6 style="color: #ffffff; font-weight: bold;">Comentarios / Coordinación de Pasarela Duo</h6>
                                <p style="color: #d1d1d6; font-size: 14px; margin: 0;">${escapeHtml(lead.observaciones)}</p>
                            </div>
                        </div>` : ''}

                        <div class="col-md-12">
                            <label class="form-label text-white font-weight-bold">Notas Internas de la Producción</label>
                            <textarea id="modal-internal-notes" class="form-control form-control-dash" rows="2" placeholder="Añadir observaciones internas..." onchange="saveInternalNotes(this.value)">${escapeHtml(lead.notas_internas || '')}</textarea>
                        </div>
                    </div>
                `;
            } else {
                modalBody.innerHTML = `
                    <div class="row g-3">
                        <div class="col-md-6">
                            <div class="p-3 bg-dark rounded border border-secondary">
                                <h6 style="color: var(--color-primary); font-weight: bold;">Información Personal & Marca</h6>
                                <div><strong>Responsable:</strong> <span class="copyable" data-copy-text="${escapeHtml(lead.nombre_expositor || lead.nombre_completo)}" onclick="copyToClipboard(this.dataset.copyText, 'Nombre', event)" title="Haz clic para copiar el nombre">${escapeHtml(lead.nombre_expositor || lead.nombre_completo)}</span></div>
                                <div><strong>Marca / Proyecto:</strong> <span class="copyable" data-copy-text="${escapeHtml(lead.nombre_marca)}" onclick="copyToClipboard(this.dataset.copyText, 'Marca', event)" title="Haz clic para copiar la marca">${escapeHtml(lead.nombre_marca)}</span></div>
                                <div><strong>Redes Sociales:</strong> <a href="${escapeHtml(lead.redes_sociales)}" target="_blank" style="color: #ffe62e;">${escapeHtml(lead.redes_sociales)}</a></div>
                                <div><strong>Ciudad:</strong> ${escapeHtml(lead.ciudad)}</div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="p-3 bg-dark rounded border border-secondary">
                                <h6 style="color: var(--color-primary); font-weight: bold;">Contacto & Espacio Solicitado</h6>
                                <div><strong>Correo:</strong> <span class="copyable" data-copy-text="${escapeHtml(lead.email)}" onclick="copyToClipboard(this.dataset.copyText, 'Correo', event)" title="Haz clic para copiar el correo">${escapeHtml(lead.email)}</span></div>
                                <div><strong>WhatsApp:</strong> <span class="copyable" data-copy-text="${escapeHtml(lead.telefono)}" onclick="copyToClipboard(this.dataset.copyText, 'Teléfono', event)" title="Haz clic para copiar el teléfono">${escapeHtml(lead.telefono)}</span></div>
                                <div><strong>Tipo de Espacio:</strong> <span class="badge bg-danger">${escapeHtml(lead.espacio_tipo || 'Stand')}</span></div>
                                <div><strong>Categorías:</strong> ${escapeHtml(lead.categorias || '-')}</div>
                                <div class="mt-2 pt-2 border-top border-secondary d-flex align-items-center justify-content-between">
                                    <span class="text-white font-weight-bold" style="font-size:13px;"><i class="far fa-handshake me-1 text-info"></i> Modalidad Canje / Costo Cero:</span>
                                    <div class="form-check form-switch m-0">
                                        <input class="form-check-input" type="checkbox" id="modal-is-canje-switch" ${lead.es_canje ? 'checked' : ''} onchange="toggleLeadCanjeStatus(this.checked)">
                                        <label class="form-check-label text-info font-weight-bold small" for="modal-is-canje-switch">${lead.es_canje ? 'Sí ($0 CLP)' : 'No (Estándar)'}</label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        ${lead.is_formalizado ? `
                        <div class="col-md-12">
                            <div class="p-3 bg-dark rounded border border-warning">
                                <h6 style="color: #ffe62e; font-weight: bold;"><i class="far fa-building me-1"></i> Datos de Empresa (SII)</h6>
                                <div class="row">
                                    <div class="col-md-4"><strong>RUT Empresa:</strong> ${escapeHtml(lead.rut_empresa || '-')}</div>
                                    <div class="col-md-4"><strong>Razón Social:</strong> ${escapeHtml(lead.razon_social || '-')}</div>
                                    <div class="col-md-4"><strong>Giro:</strong> ${escapeHtml(lead.giro_empresa || '-')}</div>
                                </div>
                            </div>
                        </div>` : ''}

                        <div class="col-md-12">
                            <div class="p-3 bg-dark rounded border border-secondary">
                                <h6 style="color: #ffffff; font-weight: bold;">Descripción de Productos a Exhibir</h6>
                                <p style="color: #d1d1d6; font-size: 14px; margin: 0;">${escapeHtml(lead.descripcion_productos || 'Sin descripción')}</p>
                            </div>
                        </div>

                        <div class="col-md-12">
                            <label class="form-label text-white font-weight-bold">Notas Internas de la Producción</label>
                            <textarea id="modal-internal-notes" class="form-control form-control-dash" rows="2" placeholder="Añadir observaciones internas..." onchange="saveInternalNotes(this.value)">${escapeHtml(lead.notas_internas || '')}</textarea>
                        </div>
                    </div>
                `;
            }

            document.getElementById("modal-change-status").value = lead.estado || 'pendiente';

            const modal = new bootstrap.Modal(document.getElementById("leadModal"));
            modal.show();
        }

        async function updateCurrentLeadStatus(newStatus) {
            if (!selectedLeadId) return;

            const lead = allLeads.find(l => l.id == selectedLeadId);
            if (lead) {
                lead.estado = newStatus;
                const isCosplay = lead.tipo_postulacion === 'cosplay' || Boolean(lead.personaje);

                if (supabaseClient) {
                    try {
                        // Actualizar siempre la tabla principal 'postulaciones' (donde están todos los registros)
                        await supabaseClient.from('postulaciones').update({ estado: newStatus }).eq('id', selectedLeadId);
                        if (isCosplay) {
                            await supabaseClient.from('postulaciones_cosplay').update({ estado: newStatus }).eq('id', selectedLeadId).catch(() => {});
                        }
                    } catch (e) {
                        console.error("Error actualizando Supabase:", e);
                    }
                } else {
                    saveLocalLeads();
                }

                applyFilters();
            }
        }

        function extractEmailErrorText(res) {
            if (!res) return "No se recibió respuesta del servicio de correos.";
            if (res.error) {
                if (typeof res.error === 'string') return res.error;
                if (res.error.error) return String(res.error.error);
                if (res.error.message) return String(res.error.message);
                return JSON.stringify(res.error);
            }
            return JSON.stringify(res);
        }

        // Actualizar estado Y despachar correo de notificación al postulante
        async function updateCurrentLeadStatusAndEmail(newStatus) {
            if (!selectedLeadId) return;

            const lead = allLeads.find(l => l.id == selectedLeadId);
            if (!lead) return;

            await updateCurrentLeadStatus(newStatus);

            let resEmail = null;
            if (newStatus === 'aprobado' && typeof sendApprovalEmail === 'function') {
                resEmail = await sendApprovalEmail(lead);
            } else if (newStatus === 'rechazado' && typeof sendRejectionEmail === 'function') {
                resEmail = await sendRejectionEmail(lead);
            } else {
                const isCosplay = lead.tipo_postulacion === 'cosplay' || Boolean(lead.personaje);
                if (isCosplay && typeof sendCosplayStatusUpdateEmail === 'function') {
                    resEmail = await sendCosplayStatusUpdateEmail(lead, newStatus);
                }
            }

            if (resEmail && resEmail.success) {
                alert(`✅ Estado actualizado a "${newStatus.toUpperCase()}" y correo enviado exitosamente a ${lead.email}`);
            } else {
                const errDetail = extractEmailErrorText(resEmail);
                alert(`⚠️ Estado cambiado a "${newStatus.toUpperCase()}", PERO el correo a ${lead.email} NO se pudo enviar.\n\nRespuesta de Resend API:\n${errDetail}\n\nNota: Si estás usando hola@temugeek.cl, asegúrate de haber verificado el dominio en Resend (resend.com/domains).`);
            }

            const modalEl = document.getElementById("leadModal");
            const modalInstance = bootstrap.Modal.getInstance(modalEl);
            if (modalInstance) modalInstance.hide();
        }

        // Enviar correo de aprobación MANUAL (independiente de si ya está aprobado)
        async function sendManualApprovalEmail(targetLeadId) {
            const leadId = targetLeadId || selectedLeadId;
            if (!leadId) return;

            const lead = allLeads.find(l => l.id == leadId);
            if (!lead) return;

            const nombreTarget = lead.nombre_marca || lead.personaje || lead.nombre_completo || 'Postulante';
            if (!confirm(`¿Deseas enviar el correo oficial de APROBACIÓN a "${nombreTarget}" (${lead.email})?`)) {
                return;
            }

            const btn = document.getElementById("btn-manual-approval-email");
            const originalHTML = btn ? btn.innerHTML : "";
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = '<i class="far fa-spinner fa-spin me-1"></i> Enviando...';
            }

            try {
                // Actualizar estado a aprobado en base de datos si no lo estaba
                await updateCurrentLeadStatus('aprobado');

                if (typeof sendApprovalEmail === 'function') {
                    const res = await sendApprovalEmail(lead);
                    if (res && res.success) {
                        alert(`✅ Correo de Aprobación enviado exitosamente a ${lead.email}`);
                    } else {
                        const errDetail = extractEmailErrorText(res);
                        alert(`⚠️ Resend API rechazó el envío a ${lead.email}.\n\nCausa del error:\n${errDetail}\n\nVerifica que el dominio temugeek.cl esté verificado en tu cuenta de Resend.`);
                    }
                } else {
                    alert("❌ Error: La función sendApprovalEmail no está disponible.");
                }
            } catch (e) {
                console.error("Error al enviar correo de aprobación manual:", e);
                alert(`❌ Error al enviar correo: ${e.message}`);
            } finally {
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = originalHTML;
                }
            }
        }

        async function sendQuickApprovalEmail(leadId) {
            await sendManualApprovalEmail(leadId);
        }

        async function toggleLeadCanjeStatus(isCanje) {
            if (!selectedLeadId) return;
            const lead = allLeads.find(l => l.id == selectedLeadId);
            if (!lead) return;
            lead.es_canje = isCanje;

            const label = document.querySelector('label[for="modal-is-canje-switch"]');
            if (label) label.textContent = isCanje ? 'Sí ($0 CLP)' : 'No (Estándar)';

            renderDashboard();

            const isCosplay = String(lead.tipo_postulacion || '').toLowerCase() === 'cosplay' || Boolean(lead.personaje);
            if (supabaseClient) {
                try {
                    await supabaseClient.from('postulaciones').update({ es_canje: isCanje }).eq('id', selectedLeadId);
                    if (isCosplay) {
                        await supabaseClient.from('postulaciones_cosplay').update({ es_canje: isCanje }).eq('id', selectedLeadId).catch(() => {});
                    }
                } catch (e) {
                    console.warn("No se pudo actualizar es_canje en Supabase:", e.message);
                }
            } else {
                saveLocalLeads();
            }
        }

        async function toggleLeadCanjeDirect(leadId) {
            const lead = allLeads.find(l => l.id == leadId);
            if (!lead) return;
            const newCanje = !isLeadCanje(lead);
            lead.es_canje = newCanje;

            renderDashboard();

            const isCosplay = String(lead.tipo_postulacion || '').toLowerCase() === 'cosplay' || Boolean(lead.personaje);
            if (supabaseClient) {
                try {
                    await supabaseClient.from('postulaciones').update({ es_canje: newCanje }).eq('id', leadId);
                    if (isCosplay) {
                        await supabaseClient.from('postulaciones_cosplay').update({ es_canje: newCanje }).eq('id', leadId).catch(() => {});
                    }
                } catch (e) {
                    console.warn("No se pudo actualizar es_canje en Supabase:", e.message);
                }
            } else {
                saveLocalLeads();
            }
        }

        async function quickMarkPagado(leadId) {
            const lead = allLeads.find(l => l.id == leadId);
            if (!lead) return;

            const currentStatus = String(lead.estado || '').toLowerCase();
            const newStatus = (currentStatus === 'pagado') ? 'aprobado' : 'pagado';
            lead.estado = newStatus;

            renderDashboard();

            const isCosplay = String(lead.tipo_postulacion || '').toLowerCase() === 'cosplay' || Boolean(lead.personaje);
            if (supabaseClient) {
                try {
                    await supabaseClient.from('postulaciones').update({ estado: newStatus }).eq('id', leadId);
                    if (isCosplay) {
                        await supabaseClient.from('postulaciones_cosplay').update({ estado: newStatus }).eq('id', leadId).catch(() => {});
                    }
                } catch (e) {
                    console.warn("No se pudo actualizar estado pagado en Supabase:", e.message);
                }
            } else {
                saveLocalLeads();
            }
        }

        async function approveWithCanje() {
            if (!selectedLeadId) return;
            const lead = allLeads.find(l => l.id == selectedLeadId);
            if (!lead) return;

            const nombreTarget = lead.nombre_marca || lead.personaje || lead.nombre_completo || 'Postulante';
            if (!confirm(`¿Confirmas APROBAR a "${nombreTarget}" bajo modalidad CANJE / COSTO CERO ($0 CLP) y despachar el correo de confirmación especial?`)) {
                return;
            }

            await toggleLeadCanjeStatus(true);
            await updateCurrentLeadStatusAndEmail('aprobado');
        }

        async function saveInternalNotes(notes) {
            if (!selectedLeadId) return;
            const lead = allLeads.find(l => l.id == selectedLeadId);
            if (lead) {
                lead.notas_internas = notes;
                const isCosplay = lead.tipo_postulacion === 'cosplay' || Boolean(lead.personaje);
                if (supabaseClient) {
                    try {
                        await supabaseClient.from('postulaciones').update({ notas_internas: notes }).eq('id', selectedLeadId);
                        if (isCosplay) {
                            await supabaseClient.from('postulaciones_cosplay').update({ notas_internas: notes }).eq('id', selectedLeadId).catch(() => {});
                        }
                    } catch (e) {
                        console.warn("No se pudo actualizar notas_internas en Supabase:", e.message);
                    }
                } else {
                    saveLocalLeads();
                }
            }
        }

        function openWhatsApp(phone, name, brandOrPersonaje, isCosplay) {
            let cleanPhone = phone.replace(/[^0-9]/g, '');
            if (!cleanPhone.startsWith('56')) cleanPhone = '56' + cleanPhone;

            const text = isCosplay
                ? encodeURIComponent(`Hola ${name}! Te contactamos desde la Producción de TemuGeek Expo 2026 respecto a tu postulación al Concurso de Cosplay interpretando a ${brandOrPersonaje}.`)
                : encodeURIComponent(`Hola ${name}! Te contactamos desde la Producción de TemuGeek Expo 2026 respecto a tu postulación para el stand de ${brandOrPersonaje}.`);

            window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
        }

        function loadDemoData() {
            const demoLeads = [
                {
                    id: "demo-1",
                    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
                    nombre_expositor: "Camila Morales",
                    nombre_marca: "Sakura Art Studio",
                    redes_sociales: "@sakura.art.cl",
                    telefono: "+56987654321",
                    email: "camila@sakuraart.cl",
                    ciudad: "Temuco",
                    categorias: "Ilustración & Fanart, Arte Original & Cómics/Manga",
                    espacio_tipo: "Espacio 2x2m ($20.000 CLP)",
                    is_formalizado: false,
                    descripcion_productos: "Ilustraciones originales, prints fanart de anime, fanzines y stickers laminados de producción propia.",
                    estado: "pendiente",
                    notas_internas: ""
                },
                {
                    id: "demo-2",
                    created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
                    nombre_expositor: "Rodrigo Fuentes",
                    nombre_marca: "Akihabara Store Chile",
                    redes_sociales: "@akihabarastore",
                    telefono: "+56912345678",
                    email: "ventas@akihabarastore.cl",
                    ciudad: "Concepción",
                    categorias: "Tienda Anime & K-Pop, Figuras & Coleccionables",
                    espacio_tipo: "Espacio 3x3m (Módulos) ($40.000 CLP)",
                    is_formalizado: true,
                    rut_empresa: "77.987.654-K",
                    razon_social: "Comercializadora Akihabara SpA",
                    giro_empresa: "Venta de artículos de colección e importaciones",
                    descripcion_productos: "Figuras originales Banpresto y Nendoroid, merchandising oficial de anime y K-Pop importado directamente de Japón.",
                    estado: "aprobado",
                    notas_internas: "Pago 100% confirmado. Asignar módulo central."
                },
                {
                    id: "demo-3",
                    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
                    nombre_expositor: "Valentina Reyes",
                    nombre_marca: "PixelForge 3D",
                    redes_sociales: "@pixelforge_3d",
                    telefono: "+56955544332",
                    email: "contacto@pixelforge.cl",
                    ciudad: "Valdivia",
                    categorias: "Impresión 3D & Grabado Láser, Cosplay Props & Accesorios",
                    espacio_tipo: "Espacio 2x2m ($20.000 CLP)",
                    is_formalizado: true,
                    rut_empresa: "76.456.123-4",
                    razon_social: "PixelForge Soluciones 3D EIRL",
                    giro_empresa: "Manufactura aditiva y diseño 3D",
                    descripcion_productos: "Props impresos en resina y PLA, llaveros articulados, lámparas LED personalizadas y llaveros láser.",
                    estado: "contactado",
                    notas_internas: "Enviado correo con requerimientos de electricidad."
                }
            ];

            allLeads = [...demoLeads, ...allLeads];
            saveLocalLeads();
            applyFilters();
            alert("Se han cargado 3 postulaciones de prueba en el panel.");
        }

        function exportFilteredToExcel() {
            const dataToExport = (filteredLeads && filteredLeads.length > 0) ? filteredLeads : allLeads;

            if (!dataToExport || dataToExport.length === 0) {
                return alert("No hay postulaciones filtradas para exportar.");
            }

            // 1ª columna: Nombre, 2ª columna: Correo
            const headers = ["Nombre", "Correo"];
            const rows = dataToExport.map(l => {
                const isCosplay = String(l.tipo_postulacion || '').toLowerCase() === 'cosplay' || Boolean(l.personaje);
                const nombre = isCosplay 
                    ? (l.nombre_completo || l.nombre_expositor || l.personaje || 'Sin Nombre') 
                    : (l.nombre_expositor || l.nombre_completo || l.nombre_marca || 'Sin Nombre');
                const correo = l.email || '';

                const cleanNombre = `"${String(nombre).replace(/"/g, '""')}"`;
                const cleanCorreo = `"${String(correo).replace(/"/g, '""')}"`;

                return `${cleanNombre};${cleanCorreo}`;
            });

            // BOM \uFEFF + delimitador ';' para apertura nativa e impecable en MS Excel
            const csvContent = "\uFEFF" + headers.join(";") + "\n" + rows.join("\n");
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement("a");
            link.setAttribute("href", url);

            const tipoFiltro = document.getElementById("filter-tipo") ? document.getElementById("filter-tipo").value : '';
            const estadoFiltro = document.getElementById("filter-estado") ? document.getElementById("filter-estado").value : '';
            const dateStr = new Date().toISOString().slice(0, 10);
            const labelFiltro = (tipoFiltro || estadoFiltro) ? `_${tipoFiltro || 'todos'}_${estadoFiltro || 'todos'}` : '';

            link.setAttribute("download", `postulantes_nombre_correo${labelFiltro}_${dateStr}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }

        function exportToCSV() {
            const dataToExport = (filteredLeads && filteredLeads.length > 0) ? filteredLeads : allLeads;
            if (!dataToExport || dataToExport.length === 0) return alert("No hay postulaciones para exportar.");

            const headers = ["ID", "Fecha", "Tipo", "Nombre", "Marca / Personaje", "Redes Sociales", "Telefono", "Email", "Ciudad", "Categorias", "Espacio", "Formalizado", "RUT Empresa", "Razon Social", "Estado", "Descripcion"];
            const rows = dataToExport.map(l => [
                l.id,
                l.created_at,
                `"${l.tipo_postulacion || (l.personaje ? 'cosplay' : 'expositor')}"`,
                `"${l.nombre_completo || l.nombre_expositor || ''}"`,
                `"${l.nombre_marca || l.personaje || ''}"`,
                `"${l.redes_sociales || ''}"`,
                `"${l.telefono || ''}"`,
                `"${l.email || ''}"`,
                `"${l.ciudad || ''}"`,
                `"${l.categorias || ''}"`,
                `"${l.espacio_tipo || ''}"`,
                l.is_formalizado ? "SI" : "NO",
                `"${l.rut_empresa || ''}"`,
                `"${l.razon_social || ''}"`,
                l.estado || "pendiente",
                `"${(l.descripcion_productos || l.observaciones || '').replace(/"/g, '""')}"`
            ]);

            const csvContent = "\uFEFF" + [headers.join(";"), ...rows.map(r => r.join(";"))].join("\n");
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `postulaciones_completas_${new Date().toISOString().slice(0,10)}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }

        function exportToJSON() {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allLeads, null, 2));
            const downloadAnchor = document.createElement('a');
            downloadAnchor.setAttribute("href", dataStr);
            downloadAnchor.setAttribute("download", `backup_leads_${new Date().toISOString().slice(0,10)}.json`);
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();
        }

        function openSqlModal() {
            const modal = new bootstrap.Modal(document.getElementById("sqlModal"));
            modal.show();
        }

        // CREATE NEW MANUAL LEAD LOGIC
        function openNewLeadModal() {
            document.getElementById("new-lead-form").reset();
            document.getElementById("tipo-expositor").checked = true;
            toggleNewLeadTypeFields();
            const modal = new bootstrap.Modal(document.getElementById("newLeadModal"));
            modal.show();
        }

        function toggleNewLeadTypeFields() {
            const isCosplay = document.getElementById("tipo-cosplay").checked;
            const expositorFields = document.querySelectorAll(".field-expositor");
            const cosplayFields = document.querySelectorAll(".field-cosplay");

            expositorFields.forEach(el => {
                if (isCosplay) el.classList.add("d-none");
                else el.classList.remove("d-none");
            });

            cosplayFields.forEach(el => {
                if (isCosplay) el.classList.remove("d-none");
                else el.classList.add("d-none");
            });

            // Adjust required attributes dynamically
            document.getElementById("new-nombre-marca").required = !isCosplay;
            document.getElementById("new-nombre-expositor").required = !isCosplay;
            document.getElementById("new-nombre-completo").required = isCosplay;
            document.getElementById("new-rut").required = isCosplay;
            document.getElementById("new-edad").required = isCosplay;
            document.getElementById("new-personaje").required = isCosplay;
            document.getElementById("new-origen").required = isCosplay;
        }

        async function handleCreateLeadSubmit(e) {
            e.preventDefault();
            const btnSave = document.getElementById("btn-save-new-lead");
            const originalBtnHTML = btnSave.innerHTML;
            btnSave.disabled = true;
            btnSave.innerHTML = '<i class="far fa-spinner fa-spin me-1"></i> Guardando...';

            try {
                const isCosplay = document.getElementById("tipo-cosplay").checked;
                const newId = "manual-" + Date.now() + "-" + Math.floor(Math.random() * 1000);

                let leadData = {
                    id: newId,
                    created_at: new Date().toISOString(),
                    email: document.getElementById("new-email").value.trim(),
                    telefono: document.getElementById("new-telefono").value.trim(),
                    ciudad: document.getElementById("new-ciudad").value.trim() || 'Temuco',
                    estado: document.getElementById("new-estado").value,
                    notas_internas: document.getElementById("new-notas-internas").value.trim(),
                    tipo_postulacion: isCosplay ? 'cosplay' : 'expositor'
                };

                if (isCosplay) {
                    leadData.nombre_completo = document.getElementById("new-nombre-completo").value.trim();
                    leadData.rut = document.getElementById("new-rut").value.trim();
                    leadData.edad = parseInt(document.getElementById("new-edad").value.trim(), 10) || 18;
                    leadData.personaje = document.getElementById("new-personaje").value.trim();
                    leadData.origen = document.getElementById("new-origen").value.trim();
                    leadData.imagen_ref = document.getElementById("new-imagen-ref").value.trim() || 'https://via.placeholder.com/300';
                    leadData.observaciones = document.getElementById("new-observaciones").value.trim();
                } else {
                    leadData.nombre_marca = document.getElementById("new-nombre-marca").value.trim();
                    leadData.nombre_expositor = document.getElementById("new-nombre-expositor").value.trim();
                    leadData.redes_sociales = document.getElementById("new-redes").value.trim() || '@temugeek';
                    leadData.espacio_tipo = document.getElementById("new-espacio-tipo").value;
                    leadData.categorias = document.getElementById("new-categorias").value.trim() || 'General';
                    leadData.es_canje = document.getElementById("new-es-canje").checked;
                    leadData.descripcion_productos = document.getElementById("new-descripcion").value.trim() || 'Sin descripción';
                }

                // Guardar en Supabase si está disponible
                if (supabaseClient) {
                    try {
                        const targetTable = isCosplay ? 'postulaciones_cosplay' : 'postulaciones';
                        const { data, error } = await supabaseClient.from(targetTable).insert([leadData]).select();
                        if (error) {
                            console.warn("Advertencia al insertar en Supabase:", error.message);
                            if (targetTable === 'postulaciones_cosplay') {
                                const { error: errFallback } = await supabaseClient.from('postulaciones').insert([leadData]);
                                if (errFallback) console.warn("Fallback error:", errFallback.message);
                            }
                        }
                    } catch (errSb) {
                        console.error("Error al insertar en Supabase:", errSb);
                    }
                }

                // Agregar a la lista de leads local y actualizar la interfaz
                allLeads.unshift(leadData);
                saveLocalLeads();
                populateCategoryFilter();
                applyFilters();

                // Cerrar modal
                const modalEl = document.getElementById("newLeadModal");
                const modalInstance = bootstrap.Modal.getInstance(modalEl);
                if (modalInstance) modalInstance.hide();

                const nombreItem = isCosplay ? leadData.personaje : leadData.nombre_marca;
                showCopyToast(`¡Postulación creada!`, nombreItem);
                alert(`✅ Postulación de "${nombreItem}" agregada exitosamente.`);

            } catch (err) {
                console.error("Error al crear postulación:", err);
                alert(`❌ Error al guardar: ${err.message}`);
            } finally {
                btnSave.disabled = false;
                btnSave.innerHTML = originalBtnHTML;
            }
        }

        function copySqlScript() {
            const sqlText = document.querySelector("#sqlModal pre").innerText;
            navigator.clipboard.writeText(sqlText);
            alert("¡Código SQL copiado al portapapeles!");
        }

        function escapeHtml(str) {
            if (!str) return '';
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;');
        }

        // ==========================================
        // SECCIÓN NÓMINA MUNICIPAL LOGIC & HANDLERS
        // ==========================================

        function switchMainTab(tabName) {
            currentMainTab = tabName;
            const btnPost = document.getElementById("tab-postulaciones-btn");
            const btnNomina = document.getElementById("tab-nomina-btn");
            const btnTorneos = document.getElementById("tab-torneos-btn");
            const viewPost = document.getElementById("view-postulaciones");
            const viewNomina = document.getElementById("view-nomina");
            const viewTorneos = document.getElementById("view-torneos");

            btnPost?.classList.remove("active");
            btnNomina?.classList.remove("active");
            btnTorneos?.classList.remove("active");
            viewPost?.classList.add("d-none");
            viewNomina?.classList.add("d-none");
            viewTorneos?.classList.add("d-none");

            if (tabName === 'nomina') {
                btnNomina?.classList.add("active");
                viewNomina?.classList.remove("d-none");
                applyNominaFilters();
            } else if (tabName === 'torneos') {
                btnTorneos?.classList.add("active");
                viewTorneos?.classList.remove("d-none");
                applyTorneosFilters();
            } else {
                btnPost?.classList.add("active");
                viewPost?.classList.remove("d-none");
                applyFilters();
            }
        }

        // ==========================================
        // SECCIÓN TORNEOS GAMER & BEYBLADE HANDLERS
        // ==========================================

        async function loadTorneosData() {
            allTorneos = [];

            if (supabaseClient) {
                try {
                    const { data, error } = await supabaseClient
                        .from('postulaciones')
                        .select('*')
                        .eq('tipo_postulacion', 'campeonatos')
                        .order('created_at', { ascending: false });

                    if (!error && Array.isArray(data)) {
                        allTorneos = data.map(item => parseTorneoData(item));
                    }
                } catch (err) {
                    console.error("Error al cargar torneos de Supabase:", err);
                }
            }

            // Respaldo resiliente desde LocalStorage
            try {
                const localData = JSON.parse(localStorage.getItem("temugeek_torneos_submissions") || "[]");
                localData.forEach(item => {
                    const parsed = parseTorneoData(item);
                    if (!allTorneos.some(t => t.id === parsed.id)) {
                        allTorneos.push(parsed);
                    }
                });
            } catch (err) {
                console.error("Error al cargar torneos locales:", err);
            }

            applyTorneosFilters();
        }

        function parseTorneoData(item) {
            const torneoName = item.torneo || item.espacio_tipo || 'FC26 (PS5)';
            let gamertag = item.gamertag || '';
            let passlineCode = item.passline_code || '';
            let detalles = item.detalles_tecnicos || '';
            let rut = item.rut || '';

            if (!gamertag && item.nombre_marca && item.nombre_marca.includes('Tag:')) {
                const match = item.nombre_marca.match(/Tag:\s*([^)]+)/);
                if (match) gamertag = match[1].trim();
            }

            if (!passlineCode && item.redes_sociales && item.redes_sociales.includes('Passline Order:')) {
                passlineCode = item.redes_sociales.replace('Passline Order:', '').trim();
            }

            if (!detalles && item.descripcion_productos) {
                detalles = item.descripcion_productos;
            }

            return {
                id: item.id || ('torneo_' + Date.now()),
                created_at: item.created_at || item.fecha_creacion || new Date().toISOString(),
                nombre_completo: item.nombre_completo || item.nombre_expositor || 'Jugador',
                rut: rut,
                email: item.email || '',
                telefono: item.telefono || '',
                torneo: torneoName,
                gamertag: gamertag || 'Sin Tag',
                passline_code: passlineCode || 'No especificado',
                detalles_tecnicos: detalles,
                estado: item.estado || 'pendiente'
            };
        }

        function saveLocalTorneos() {
            localStorage.setItem("temugeek_torneos_submissions", JSON.stringify(allTorneos));
        }

        function applyTorneosFilters() {
            const searchVal = (document.getElementById("search-torneos-input")?.value || "").toLowerCase().trim();
            const filterGame = (document.getElementById("filter-torneos-game")?.value || "").toLowerCase().trim();
            const filterEstado = (document.getElementById("filter-torneos-estado")?.value || "").toLowerCase().trim();

            filteredTorneos = allTorneos.filter(item => {
                const textToSearch = `${item.nombre_completo || ''} ${item.gamertag || ''} ${item.rut || ''} ${item.email || ''} ${item.telefono || ''} ${item.passline_code || ''} ${item.torneo || ''}`.toLowerCase();
                const matchesSearch = !searchVal || textToSearch.includes(searchVal);

                const gameStr = (item.torneo || '').toLowerCase();
                const matchesGame = !filterGame || gameStr.includes(filterGame);

                const estadoStr = (item.estado || 'pendiente').toLowerCase();
                const matchesEstado = !filterEstado || estadoStr.includes(filterEstado);

                return matchesSearch && matchesGame && matchesEstado;
            });

            // Actualizar KPIs de Torneos
            if (document.getElementById("kpi-torneos-total")) {
                document.getElementById("kpi-torneos-total").textContent = allTorneos.length;

                const fc26Count = allTorneos.filter(t => (t.torneo || '').toLowerCase().includes('fc26')).length;
                document.getElementById("kpi-torneos-fc26").textContent = fc26Count;

                const smashCount = allTorneos.filter(t => (t.torneo || '').toLowerCase().includes('smash')).length;
                document.getElementById("kpi-torneos-smash").textContent = smashCount;

                const beybladeCount = allTorneos.filter(t => (t.torneo || '').toLowerCase().includes('beyblade')).length;
                document.getElementById("kpi-torneos-beyblade").textContent = beybladeCount;

                const acreditadosCount = allTorneos.filter(t => (t.estado || '').toLowerCase() === 'acreditado').length;
                document.getElementById("kpi-torneos-acreditados").textContent = `${acreditadosCount} / ${allTorneos.length}`;
            }

            renderTorneosTable();
        }

        function resetTorneosFilters() {
            if (document.getElementById("search-torneos-input")) document.getElementById("search-torneos-input").value = "";
            if (document.getElementById("filter-torneos-game")) document.getElementById("filter-torneos-game").value = "";
            if (document.getElementById("filter-torneos-estado")) document.getElementById("filter-torneos-estado").value = "";
            applyTorneosFilters();
        }

        function renderTorneosTable() {
            const tbody = document.getElementById("torneos-table-body");
            const emptyState = document.getElementById("torneos-empty-state");

            if (!tbody) return;

            tbody.innerHTML = "";

            if (!filteredTorneos || filteredTorneos.length === 0) {
                if (emptyState) emptyState.classList.remove("d-none");
            } else {
                if (emptyState) emptyState.classList.add("d-none");

                filteredTorneos.forEach((item, index) => {
                    const tr = document.createElement("tr");

                    const dateStr = item.created_at ? new Date(item.created_at).toLocaleDateString('es-CL', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';
                    const emailText = item.email ? escapeHtml(item.email) : '-';
                    const telText = item.telefono ? escapeHtml(item.telefono) : '-';

                    let torneoBadge = '<span class="badge bg-info text-dark font-weight-bold">⚽ FC26</span>';
                    const tLower = (item.torneo || '').toLowerCase();
                    if (tLower.includes('smash')) {
                        torneoBadge = '<span class="badge" style="background-color: #e92652; color: #fff;">🥊 Smash Bros</span>';
                    } else if (tLower.includes('beyblade')) {
                        torneoBadge = '<span class="badge" style="background-color: #ffe62e; color: #141519; font-weight: bold;">🌀 Beyblade</span>';
                    }

                    const st = (item.estado || 'pendiente').toLowerCase();
                    let checkInBtn = `<button class="btn btn-sm btn-outline-warning py-1 px-2" style="font-size:11px;" onclick="toggleTorneoCheckIn('${item.id}')"><i class="far fa-clock me-1"></i>Pendiente Check-in</button>`;
                    if (st === 'acreditado') {
                        checkInBtn = `<button class="btn btn-sm btn-success py-1 px-2 font-weight-bold" style="font-size:11px; background-color: #00d264; border-color: #00d264; color: #000;" onclick="toggleTorneoCheckIn('${item.id}')"><i class="far fa-check-circle me-1"></i>Acreditado (14:30)</button>`;
                    } else if (st === 'ganador') {
                        checkInBtn = `<span class="badge bg-warning text-dark font-weight-bold" style="font-size:11px;"><i class="far fa-trophy me-1"></i>GANADOR PODIO</span>`;
                    }

                    tr.innerHTML = `
                        <td>
                            <div class="fw-bold text-white">#${index + 1}</div>
                            <div style="font-size:11px; color:var(--text-muted);">${dateStr}</div>
                        </td>
                        <td>
                            <div class="fw-bold text-white fs-6">${escapeHtml(item.nombre_completo || 'Jugador')}</div>
                            <div style="font-size:12px; color:#ffe62e; font-weight:600;"><i class="far fa-gamepad me-1"></i>Tag: ${escapeHtml(item.gamertag || 'Sin Tag')}</div>
                            <div style="font-size:11px; color:var(--text-muted);">RUT: ${escapeHtml(item.rut || '-')}</div>
                        </td>
                        <td>
                            ${torneoBadge}
                        </td>
                        <td>
                            <span class="copyable text-info font-monospace font-weight-bold" onclick="copyToClipboard('${escapeHtml(item.passline_code)}', 'Ticket Passline', event)" title="Clic para copiar ticket">
                                ${escapeHtml(item.passline_code || '-')}
                            </span>
                        </td>
                        <td>
                            <div style="font-size: 12px;"><i class="far fa-envelope me-1 text-muted"></i><a href="mailto:${emailText}" class="text-light">${emailText}</a></div>
                            <div style="font-size: 12px;"><i class="fab fa-whatsapp me-1 text-success"></i><a href="tel:${telText}" class="text-light">${telText}</a></div>
                        </td>
                        <td>
                            <div style="font-size: 12px; color: #cbd5e1;">${escapeHtml(item.detalles_tecnicos || 'Sin especificación')}</div>
                        </td>
                        <td>
                            ${checkInBtn}
                        </td>
                        <td class="text-end">
                            <button class="btn btn-whatsapp btn-sm me-1" onclick="openWhatsApp('${escapeHtml(item.telefono)}', '${escapeHtml(item.nombre_completo)}', '${escapeHtml(item.torneo)}', false)" title="WhatsApp Directo">
                                <i class="fab fa-whatsapp"></i>
                            </button>
                            <button class="btn btn-action btn-sm me-1" onclick="openEditTorneoModal('${item.id}')" title="Editar jugador">
                                <i class="far fa-edit"></i>
                            </button>
                            <button class="btn btn-outline-danger btn-sm" onclick="deleteTorneoItem('${item.id}')" title="Eliminar registro">
                                <i class="far fa-trash-alt"></i>
                            </button>
                        </td>
                    `;

                    tbody.appendChild(tr);
                });
            }
        }

        async function toggleTorneoCheckIn(id) {
            const item = allTorneos.find(t => t.id === id);
            if (!item) return;

            const newStatus = (item.estado === 'acreditado') ? 'pendiente' : 'acreditado';
            item.estado = newStatus;

            if (supabaseClient) {
                try {
                    await supabaseClient.from('postulaciones').update({ estado: newStatus }).eq('id', id);
                } catch (err) {
                    console.warn("Error al actualizar estado en Supabase:", err);
                }
            }

            saveLocalTorneos();
            applyTorneosFilters();
            showCopyToast(newStatus === 'acreditado' ? '¡Acreditado 14:30 hrs!' : 'Estado marcado Pendiente', item.gamertag || item.nombre_completo);
        }

        function openNewTorneoModal() {
            document.getElementById("new-torneo-form")?.reset();
            const modal = new bootstrap.Modal(document.getElementById("newTorneoModal"));
            modal.show();
        }

        async function handleCreateTorneoSubmit(e) {
            e.preventDefault();
            const btnSave = document.getElementById("btn-save-new-torneo");
            const origHTML = btnSave.innerHTML;
            btnSave.disabled = true;
            btnSave.innerHTML = '<i class="far fa-spinner fa-spin me-1"></i> Guardando...';

            try {
                const torneoName = document.getElementById("new-torneo-game").value;
                const gamertag = document.getElementById("new-torneo-gamertag").value.trim();
                const passline = document.getElementById("new-torneo-passline").value.trim();
                const detalles = document.getElementById("new-torneo-detalles").value.trim();

                const newItem = {
                    id: (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : ("torneo-" + Date.now()),
                    created_at: new Date().toISOString(),
                    nombre_completo: document.getElementById("new-torneo-nombre").value.trim(),
                    rut: document.getElementById("new-torneo-rut").value.trim(),
                    email: document.getElementById("new-torneo-email").value.trim(),
                    telefono: document.getElementById("new-torneo-telefono").value.trim(),
                    torneo: torneoName,
                    gamertag: gamertag,
                    passline_code: passline,
                    detalles_tecnicos: detalles,
                    estado: document.getElementById("new-torneo-estado").value
                };

                if (supabaseClient) {
                    try {
                        const sbPayload = {
                            id: newItem.id,
                            created_at: newItem.created_at,
                            nombre_expositor: newItem.nombre_completo,
                            nombre_marca: `Torneo: ${newItem.torneo} (Tag: ${newItem.gamertag})`,
                            redes_sociales: `Passline Order: ${newItem.passline_code}`,
                            telefono: newItem.telefono,
                            email: newItem.email,
                            ciudad: 'Temuco',
                            categorias: 'Campeonatos Torneos',
                            espacio_tipo: newItem.torneo,
                            descripcion_productos: `Inscripción Torneo: ${newItem.torneo}. Gamertag: ${newItem.gamertag}. Ticket Passline: ${newItem.passline_code}. Detalles: ${newItem.detalles_tecnicos || 'N/A'}. RUT: ${newItem.rut}`,
                            tipo_postulacion: 'campeonatos',
                            estado: newItem.estado
                        };
                        await supabaseClient.from('postulaciones').insert([sbPayload]);
                    } catch (errSb) {
                        console.warn("Advertencia al guardar en Supabase:", errSb);
                    }
                }

                allTorneos.unshift(newItem);
                saveLocalTorneos();
                applyTorneosFilters();

                const modalEl = document.getElementById("newTorneoModal");
                const modalInst = bootstrap.Modal.getInstance(modalEl);
                if (modalInst) modalInst.hide();

                showCopyToast(`¡Jugador inscripto!`, newItem.gamertag || newItem.nombre_completo);
            } catch (err) {
                alert("Error al guardar: " + err.message);
            } finally {
                btnSave.disabled = false;
                btnSave.innerHTML = origHTML;
            }
        }

        function openEditTorneoModal(id) {
            const item = allTorneos.find(t => t.id === id);
            if (!item) return;

            selectedTorneoId = id;
            document.getElementById("edit-torneo-game").value = item.torneo || "FC26 (PS5)";
            document.getElementById("edit-torneo-gamertag").value = item.gamertag || "";
            document.getElementById("edit-torneo-nombre").value = item.nombre_completo || "";
            document.getElementById("edit-torneo-rut").value = item.rut || "";
            document.getElementById("edit-torneo-email").value = item.email || "";
            document.getElementById("edit-torneo-telefono").value = item.telefono || "";
            document.getElementById("edit-torneo-passline").value = item.passline_code || "";
            document.getElementById("edit-torneo-detalles").value = item.detalles_tecnicos || "";
            document.getElementById("edit-torneo-estado").value = item.estado || "pendiente";

            const modal = new bootstrap.Modal(document.getElementById("editTorneoModal"));
            modal.show();
        }

        async function handleUpdateTorneoSubmit(e) {
            e.preventDefault();
            if (!selectedTorneoId) return;

            const btnSave = document.getElementById("btn-save-edit-torneo");
            const origHTML = btnSave.innerHTML;
            btnSave.disabled = true;
            btnSave.innerHTML = '<i class="far fa-spinner fa-spin me-1"></i> Actualizando...';

            try {
                const updatedData = {
                    torneo: document.getElementById("edit-torneo-game").value,
                    gamertag: document.getElementById("edit-torneo-gamertag").value.trim(),
                    nombre_completo: document.getElementById("edit-torneo-nombre").value.trim(),
                    rut: document.getElementById("edit-torneo-rut").value.trim(),
                    email: document.getElementById("edit-torneo-email").value.trim(),
                    telefono: document.getElementById("edit-torneo-telefono").value.trim(),
                    passline_code: document.getElementById("edit-torneo-passline").value.trim(),
                    detalles_tecnicos: document.getElementById("edit-torneo-detalles").value.trim(),
                    estado: document.getElementById("edit-torneo-estado").value
                };

                if (supabaseClient) {
                    try {
                        const sbPayload = {
                            nombre_expositor: updatedData.nombre_completo,
                            nombre_marca: `Torneo: ${updatedData.torneo} (Tag: ${updatedData.gamertag})`,
                            redes_sociales: `Passline Order: ${updatedData.passline_code}`,
                            telefono: updatedData.telefono,
                            email: updatedData.email,
                            espacio_tipo: updatedData.torneo,
                            descripcion_productos: `Inscripción Torneo: ${updatedData.torneo}. Gamertag: ${updatedData.gamertag}. Ticket Passline: ${updatedData.passline_code}. Detalles: ${updatedData.detalles_tecnicos || 'N/A'}. RUT: ${updatedData.rut}`,
                            estado: updatedData.estado
                        };
                        await supabaseClient.from('postulaciones').update(sbPayload).eq('id', selectedTorneoId);
                    } catch (errSb) {
                        console.warn("Advertencia al actualizar en Supabase:", errSb);
                    }
                }

                const idx = allTorneos.findIndex(t => t.id === selectedTorneoId);
                if (idx !== -1) {
                    allTorneos[idx] = { ...allTorneos[idx], ...updatedData };
                    saveLocalTorneos();
                    applyTorneosFilters();
                }

                const modalEl = document.getElementById("editTorneoModal");
                const modalInst = bootstrap.Modal.getInstance(modalEl);
                if (modalInst) modalInst.hide();

                showCopyToast(`¡Inscripción actualizada!`, updatedData.gamertag || updatedData.nombre_completo);
            } catch (err) {
                alert("Error al actualizar: " + err.message);
            } finally {
                btnSave.disabled = false;
                btnSave.innerHTML = origHTML;
            }
        }

        async function deleteTorneoItem(id) {
            const item = allTorneos.find(t => t.id === id);
            const label = item ? (item.gamertag || item.nombre_completo) : 'este registro';

            if (!confirm(`¿Estás seguro de que deseas eliminar la inscripción de "${label}"?`)) {
                return;
            }

            if (supabaseClient) {
                try {
                    await supabaseClient.from('postulaciones').delete().eq('id', id);
                } catch (err) {
                    console.warn("Error al borrar en Supabase:", err);
                }
            }

            allTorneos = allTorneos.filter(t => t.id !== id);
            saveLocalTorneos();
            applyTorneosFilters();
            showCopyToast(`¡Eliminado!`, label);
        }

        function exportTorneosToCSV() {
            const dataToExport = (filteredTorneos && filteredTorneos.length > 0) ? filteredTorneos : allTorneos;

            if (!dataToExport || dataToExport.length === 0) {
                return alert("No hay inscripciones a torneos para exportar.");
            }

            const headers = ["N°", "Fecha Registro", "Torneo", "Gamertag / Nickname", "Nombre Completo", "RUT", "Ticket Passline", "Email", "Telefono", "Especificacion", "Estado Check-in"];
            
            const rows = dataToExport.map((item, idx) => {
                const dateStr = item.created_at ? new Date(item.created_at).toLocaleString('es-CL') : '';
                const cleanTorneo = `"${String(item.torneo || '').replace(/"/g, '""')}"`;
                const cleanTag = `"${String(item.gamertag || '').replace(/"/g, '""')}"`;
                const cleanName = `"${String(item.nombre_completo || '').replace(/"/g, '""')}"`;
                const cleanRut = `"${String(item.rut || '').replace(/"/g, '""')}"`;
                const cleanPassline = `"${String(item.passline_code || '').replace(/"/g, '""')}"`;
                const cleanEmail = `"${String(item.email || '').replace(/"/g, '""')}"`;
                const cleanTel = `"${String(item.telefono || '').replace(/"/g, '""')}"`;
                const cleanDetalles = `"${String(item.detalles_tecnicos || '').replace(/"/g, '""')}"`;
                const cleanEstado = `"${String(item.estado || 'pendiente').replace(/"/g, '""')}"`;

                return `${idx + 1};"${dateStr}";${cleanTorneo};${cleanTag};${cleanName};${cleanRut};${cleanPassline};${cleanEmail};${cleanTel};${cleanDetalles};${cleanEstado}`;
            });

            const csvContent = "\uFEFF" + headers.join(";") + "\n" + rows.join("\n");
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement("a");
            link.setAttribute("href", url);
            const dateFileStr = new Date().toISOString().slice(0, 10);
            link.setAttribute("download", `torneos_temugeek_${dateFileStr}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } 
// Export tournaments to PDF (FC26 / Smash)
function exportTorneosPDF(game) {
    const dataSet = (filteredTorneos && filteredTorneos.length > 0) ? filteredTorneos : allTorneos;
    const filteredData = dataSet.filter(item => (item.torneo || '').toLowerCase().includes(game.toLowerCase()));
    if (!filteredData || filteredData.length === 0) {
        return alert('No hay inscripciones para el juego seleccionado.');
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text(`Torneos ${game.toUpperCase()} - TemuGeek Expo 2026`, 14, 15);
    const rows = filteredData.map((item, idx) => [
        idx + 1,
        item.created_at ? new Date(item.created_at).toLocaleString('es-CL') : '',
        item.torneo || '',
        item.gamertag || '',
        item.nombre_completo || '',
        item.rut || '',
        item.passline_code || '',
        item.email || '',
        item.telefono || '',
        item.detendidos_tecnicos || '',
        item.estado || ''
    ]);
    doc.autoTable({
        startY: 20,
        head: [['N°','Fecha Registro','Torneo','Gamertag','Nombre Completo','RUT','Ticket','Email','Teléfono','Detalles','Estado']],
        body: rows,
        theme: 'grid',
        headStyles: { fillColor: [33, 150, 243] }
    });
    const dateStr = new Date().toISOString().slice(0,10);
    doc.save(`torneos_${game.toLowerCase()}_${dateStr}.pdf`);
}
window.exportTorneosPDF = exportTorneosPDF;

        function printTorneosOfficial() {
            const dataToPrint = (filteredTorneos && filteredTorneos.length > 0) ? filteredTorneos : allTorneos;

            if (!dataToPrint || dataToPrint.length === 0) {
                return alert("No hay inscritos a torneos para imprimir.");
            }

            const printWin = window.open('', '_blank', 'width=1000,height=800');
            if (!printWin) return alert("Por favor permite las ventanas emergentes para generar el documento.");

            const rowsHtml = dataToPrint.map((item, idx) =>
                '<tr>' +
                    '<td style="border:1px solid #ccc; padding:8px; text-align:center;">' + (idx + 1) + '</td>' +
                    '<td style="border:1px solid #ccc; padding:8px; font-weight:bold;">' + escapeHtml(item.gamertag) + '</td>' +
                    '<td style="border:1px solid #ccc; padding:8px;">' + escapeHtml(item.nombre_completo) + '</td>' +
                    '<td style="border:1px solid #ccc; padding:8px; font-family:monospace;">' + escapeHtml(item.rut) + '</td>' +
                    '<td style="border:1px solid #ccc; padding:8px; font-weight:bold;">' + escapeHtml(item.torneo) + '</td>' +
                    '<td style="border:1px solid #ccc; padding:8px; font-family:monospace;">' + escapeHtml(item.passline_code) + '</td>' +
                    '<td style="border:1px solid #ccc; padding:8px;">' + escapeHtml(item.telefono) + '</td>' +
                    '<td style="border:1px solid #ccc; padding:8px; text-align:center;">[ &nbsp; ] Confirmado (14:30)</td>' +
                '</tr>'
            ).join('');

            const doc = printWin.document;
            doc.open();
            doc.write('<!DOCTYPE html><html><head><title>Checklist Oficial Mesa de Torneos — TemuGeek Expo 2026</title><style>body{font-family:Arial,sans-serif;margin:30px;color:#000;}.header{text-align:center;border-bottom:2px solid #000;padding-bottom:15px;margin-bottom:20px;}.header h2{margin:0;font-size:20px;text-transform:uppercase;}.header h3{margin:5px 0 0 0;font-size:16px;color:#333;}.meta{margin-bottom:20px;font-size:13px;display:flex;justify-content:space-between;}table{width:100%;border-collapse:collapse;font-size:12px;}th{background:#f0f0f0;border:1px solid #ccc;padding:10px;text-align:left;}td{border:1px solid #ccc;padding:8px;}.footer{margin-top:40px;text-align:right;font-size:12px;}</style></head><body>');
            doc.write('<div class="header"><h2>TEMUGEEK EXPO 2026 — CONTROL DE MESA DE TORNEOS</h2><h3>ACREDITACIÓN Y CHECK-IN PRESENCIAL (14:30 HRS - INICIO 15:00 HRS)</h3></div>');
            doc.write('<div class="meta"><div><strong>Evento:</strong> TemuGeek Expo 2026 (Recinto SOFO)</div><div><strong>Fecha Emisión:</strong> ' + new Date().toLocaleDateString('es-CL') + '</div><div><strong>Total Inscriptos:</strong> ' + dataToPrint.length + '</div></div>');
            doc.write('<table><thead><tr><th style="width:30px; text-align:center;">N°</th><th>Gamertag / Nickname</th><th>Nombre Completo</th><th>RUT</th><th>Torneo</th><th>Ticket Passline</th><th>Teléfono</th><th style="width:140px; text-align:center;">Firma / Check-in</th></tr></thead><tbody>' + rowsHtml + '</tbody></table>');
            doc.write('<div class="footer"><p>_____________________________________<br>Encargado de Torneos Gamer & Beyblade</p></div></body></html>');
            doc.close();
            setTimeout(() => {
                try { printWin.focus(); printWin.print(); } catch(e){}
            }, 300);
        }

        function exportTorneosToJSON() {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allTorneos, null, 2));
            const downloadAnchor = document.createElement('a');
            downloadAnchor.setAttribute("href", dataStr);
            downloadAnchor.setAttribute("download", `backup_torneos_temugeek_${new Date().toISOString().slice(0,10)}.json`);
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();
        }

        async function loadNominaData() {
            allNomina = [];

            if (supabaseClient) {
                try {
                    const { data, error } = await supabaseClient
                        .from('nomina_municipal')
                        .select('*')
                        .order('created_at', { ascending: false });

                    if (!error && Array.isArray(data)) {
                        allNomina = data;
                    }
                } catch (err) {
                    console.error("Error al cargar nomina_municipal de Supabase:", err);
                }
            }

            // Respaldo resiliente desde LocalStorage
            try {
                const localData = JSON.parse(localStorage.getItem("TG_NOMINA_MUNICIPAL") || "[]");
                localData.forEach(item => {
                    if (!allNomina.some(n => n.id === item.id)) {
                        allNomina.push(item);
                    }
                });
            } catch (err) {
                console.error("Error al cargar nómina local:", err);
            }

            applyNominaFilters();
        }

        function saveLocalNomina() {
            localStorage.setItem("TG_NOMINA_MUNICIPAL", JSON.stringify(allNomina));
        }

        function applyNominaFilters() {
            const searchVal = (document.getElementById("search-nomina-input")?.value || "").toLowerCase().trim();
            const filterTipo = (document.getElementById("filter-nomina-tipo")?.value || "").toLowerCase().trim();

            filteredNomina = allNomina.filter(item => {
                const textToSearch = `${item.nombre_completo || ''} ${item.emprendimiento || ''} ${item.rut || ''} ${item.razon_social || ''} ${item.email || ''} ${item.telefono || ''}`.toLowerCase();
                const matchesSearch = !searchVal || textToSearch.includes(searchVal);

                const tipoItem = (item.tipo_participacion || '').toLowerCase();
                const matchesTipo = !filterTipo || tipoItem.includes(filterTipo);

                return matchesSearch && matchesTipo;
            });

            // Update Nomina KPIs
            let totalCount = filteredNomina.length;
            let razonCount = 0;
            let expCount = 0;
            let artCount = 0;
            let foodCount = 0;
            let otrosCount = 0;

            filteredNomina.forEach(item => {
                if (item.razon_social && item.razon_social.trim()) razonCount++;
                const tipo = (item.tipo_participacion || '').toLowerCase();
                if (tipo.includes('expositor') || tipo.includes('tienda')) expCount++;
                else if (tipo.includes('ilustrador') || tipo.includes('artista')) artCount++;
                else if (tipo.includes('food') || tipo.includes('gastronomía')) foodCount++;
                else otrosCount++;
            });

            if (document.getElementById("kpi-nomina-total")) document.getElementById("kpi-nomina-total").textContent = totalCount;
            if (document.getElementById("kpi-nomina-razon")) document.getElementById("kpi-nomina-razon").textContent = razonCount;
            if (document.getElementById("kpi-nomina-expositores")) document.getElementById("kpi-nomina-expositores").textContent = expCount;
            if (document.getElementById("kpi-nomina-artistas")) document.getElementById("kpi-nomina-artistas").textContent = artCount;
            if (document.getElementById("kpi-nomina-foodtrucks")) document.getElementById("kpi-nomina-foodtrucks").textContent = foodCount;
            if (document.getElementById("kpi-nomina-otros")) document.getElementById("kpi-nomina-otros").textContent = otrosCount;

            renderNominaTable();
        }

        function resetNominaFilters() {
            if (document.getElementById("search-nomina-input")) document.getElementById("search-nomina-input").value = "";
            if (document.getElementById("filter-nomina-tipo")) document.getElementById("filter-nomina-tipo").value = "";
            applyNominaFilters();
        }

        function renderNominaTable() {
            const tbody = document.getElementById("nomina-table-body");
            const emptyState = document.getElementById("nomina-empty-state");
            if (!tbody) return;

            tbody.innerHTML = "";

            if (filteredNomina.length === 0) {
                emptyState?.classList.remove("d-none");
            } else {
                emptyState?.classList.add("d-none");

                filteredNomina.forEach((item, index) => {
                    const tr = document.createElement("tr");

                    const dateStr = item.created_at ? new Date(item.created_at).toLocaleDateString('es-CL', {
                        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                    }) : 'N/A';

                    const formattedRut = item.rut || 'Sin RUT';
                    const razonText = item.razon_social ? escapeHtml(item.razon_social) : '<span class="text-muted font-italic" style="font-size: 12px;">No posee</span>';
                    const emailText = item.email ? escapeHtml(item.email) : '-';
                    const telText = item.telefono ? escapeHtml(item.telefono) : '-';

                    tr.innerHTML = `
                        <td>
                            <div class="fw-bold text-white">#${index + 1}</div>
                            <div style="font-size:11px; color:var(--text-muted);">${dateStr}</div>
                        </td>
                        <td>
                            <div class="fw-bold text-white fs-6">${escapeHtml(item.nombre_completo || 'Sin nombre')}</div>
                        </td>
                        <td>
                            <div style="color: var(--color-secondary); font-weight:600;"><i class="far fa-store me-1"></i>${escapeHtml(item.emprendimiento || 'Sin emprendimiento')}</div>
                        </td>
                        <td>
                            <span class="copyable text-info font-monospace font-weight-bold" onclick="copyToClipboard('${escapeHtml(formattedRut)}', 'RUT', event)">
                                ${escapeHtml(formattedRut)}
                            </span>
                        </td>
                        <td>
                            ${razonText}
                        </td>
                        <td>
                            <div style="font-size: 12px;"><i class="far fa-envelope me-1 text-muted"></i><a href="mailto:${emailText}" class="text-light">${emailText}</a></div>
                            <div style="font-size: 12px;"><i class="far fa-phone me-1 text-muted"></i><a href="tel:${telText}" class="text-light">${telText}</a></div>
                        </td>
                        <td>
                            <span class="badge bg-dark border border-secondary text-light" style="font-size:11px;">${escapeHtml(item.tipo_participacion || 'Expositor')}</span>
                        </td>
                        <td class="text-end">
                            <button class="btn btn-action btn-sm" onclick="openEditNominaModal('${item.id}')" title="Editar registro">
                                <i class="far fa-edit"></i>
                            </button>
                            <button class="btn btn-outline-danger btn-sm" onclick="deleteNominaItem('${item.id}')" title="Eliminar registro">
                                <i class="far fa-trash-alt"></i>
                            </button>
                        </td>
                    `;

                    tbody.appendChild(tr);
                });
            }
        }

        function exportNominaToCSV() {
            const dataToExport = (filteredNomina && filteredNomina.length > 0) ? filteredNomina : allNomina;

            if (!dataToExport || dataToExport.length === 0) {
                return alert("No hay registros en la nómina para exportar.");
            }

            const headers = ["N°", "Fecha Registro", "Nombre Completo Responsable", "Emprendimiento / Marca", "RUT", "Razon Social", "Email", "Telefono", "Tipo Participacion"];
            
            const rows = dataToExport.map((item, idx) => {
                const dateStr = item.created_at ? new Date(item.created_at).toLocaleString('es-CL') : '';
                const cleanName = `"${String(item.nombre_completo || '').replace(/"/g, '""')}"`;
                const cleanEmp = `"${String(item.emprendimiento || '').replace(/"/g, '""')}"`;
                const cleanRut = `"${String(item.rut || '').replace(/"/g, '""')}"`;
                const cleanRazon = `"${String(item.razon_social || '').replace(/"/g, '""')}"`;
                const cleanEmail = `"${String(item.email || '').replace(/"/g, '""')}"`;
                const cleanTel = `"${String(item.telefono || '').replace(/"/g, '""')}"`;
                const cleanTipo = `"${String(item.tipo_participacion || '').replace(/"/g, '""')}"`;

                return `${idx + 1};"${dateStr}";${cleanName};${cleanEmp};${cleanRut};${cleanRazon};${cleanEmail};${cleanTel};${cleanTipo}`;
            });

            const csvContent = "\uFEFF" + headers.join(";") + "\n" + rows.join("\n");
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement("a");
            link.setAttribute("href", url);
            const dateFileStr = new Date().toISOString().slice(0, 10);
            link.setAttribute("download", `nomina_oficial_municipalidad_temugeek_${dateFileStr}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }

        function printNominaOfficial() {
            const dataToPrint = (filteredNomina && filteredNomina.length > 0) ? filteredNomina : allNomina;

            if (!dataToPrint || dataToPrint.length === 0) {
                return alert("No hay registros en la nómina para imprimir.");
            }

            const printWin = window.open('', '_blank', 'width=1000,height=800');
            if (!printWin) return alert("Por favor permite las ventanas emergentes para generar el documento de impresión.");

            const rowsHtml = dataToPrint.map((item, idx) =>
                '<tr>' +
                    '<td style="border:1px solid #ccc; padding:8px; text-align:center;">' + (idx + 1) + '</td>' +
                    '<td style="border:1px solid #ccc; padding:8px; font-weight:bold;">' + escapeHtml(item.nombre_completo) + '</td>' +
                    '<td style="border:1px solid #ccc; padding:8px;">' + escapeHtml(item.emprendimiento) + '</td>' +
                    '<td style="border:1px solid #ccc; padding:8px; font-family:monospace;">' + escapeHtml(item.rut) + '</td>' +
                    '<td style="border:1px solid #ccc; padding:8px;">' + escapeHtml(item.razon_social || '-') + '</td>' +
                    '<td style="border:1px solid #ccc; padding:8px;">' + escapeHtml(item.email) + ' / ' + escapeHtml(item.telefono) + '</td>' +
                    '<td style="border:1px solid #ccc; padding:8px;">' + escapeHtml(item.tipo_participacion || 'Expositor') + '</td>' +
                '</tr>'
            ).join('');

            const doc = printWin.document;
            doc.open();
            doc.write('<!DOCTYPE html><html><head><title>Nómina Oficial de Participantes - Ilustre Municipalidad de Temuco</title><style>body{font-family:Arial,sans-serif;margin:30px;color:#000;}.header{text-align:center;border-bottom:2px solid #000;padding-bottom:15px;margin-bottom:20px;}.header h2{margin:0;font-size:20px;text-transform:uppercase;}.header h3{margin:5px 0 0 0;font-size:16px;color:#333;}.meta{margin-bottom:20px;font-size:13px;display:flex;justify-content:space-between;}table{width:100%;border-collapse:collapse;font-size:12px;}th{background:#f0f0f0;border:1px solid #ccc;padding:10px;text-align:left;}td{border:1px solid #ccc;padding:8px;}.footer{margin-top:40px;text-align:right;font-size:12px;}</style></head><body>');
            doc.write('<div class="header"><h2>ILUSTRE MUNICIPALIDAD DE TEMUCO</h2><h3>TEMUGEEK EXPO 2026 — NÓMINA OFICIAL DE PARTICIPANTES</h3></div>');
            doc.write('<div class="meta"><div><strong>Evento:</strong> TemuGeek Expo 2026 (Recinto SOFO)</div><div><strong>Fecha Emisión:</strong> ' + new Date().toLocaleDateString('es-CL') + '</div><div><strong>Total Registrados:</strong> ' + dataToPrint.length + '</div></div>');
            doc.write('<table><thead><tr><th style="width:40px; text-align:center;">N°</th><th>Nombre Completo Responsable</th><th>Emprendimiento / Marca</th><th>RUT</th><th>Razón Social</th><th>Contacto</th><th>Categoría</th></tr></thead><tbody>' + rowsHtml + '</tbody></table>');
            doc.write('<div class="footer"><p>_____________________________________<br>Producción General TemuGeek Expo 2026</p></div></body></html>');
            doc.close();
            setTimeout(() => {
                try { printWin.focus(); printWin.print(); } catch(e){}
            }, 300);
        }

        function exportNominaToJSON() {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allNomina, null, 2));
            const downloadAnchor = document.createElement('a');
            downloadAnchor.setAttribute("href", dataStr);
            downloadAnchor.setAttribute("download", `backup_nomina_municipal_${new Date().toISOString().slice(0,10)}.json`);
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();
        }

        function openNewNominaModal() {
            document.getElementById("new-nomina-form")?.reset();
            const modal = new bootstrap.Modal(document.getElementById("newNominaModal"));
            modal.show();
        }

        async function handleCreateNominaSubmit(e) {
            e.preventDefault();
            const btnSave = document.getElementById("btn-save-new-nomina");
            const origHTML = btnSave.innerHTML;
            btnSave.disabled = true;
            btnSave.innerHTML = '<i class="far fa-spinner fa-spin me-1"></i> Guardando...';

            try {
                const sbPayload = {
                    nombre_completo: document.getElementById("new-nom-nombre").value.trim(),
                    emprendimiento: document.getElementById("new-nom-emprendimiento").value.trim(),
                    rut: document.getElementById("new-nom-rut").value.trim(),
                    razon_social: document.getElementById("new-nom-razon").value.trim() || null,
                    email: document.getElementById("new-nom-email").value.trim(),
                    telefono: document.getElementById("new-nom-telefono").value.trim(),
                    tipo_participacion: document.getElementById("new-nom-tipo").value
                };

                let insertedItem = null;

                if (supabaseClient) {
                    try {
                        const { data, error } = await supabaseClient.from('nomina_municipal').insert([sbPayload]).select();
                        if (!error && Array.isArray(data) && data.length > 0) {
                            insertedItem = data[0];
                        } else if (error) {
                            console.warn("Advertencia al guardar en Supabase:", error.message);
                        }
                    } catch (errSb) {
                        console.warn("Error al guardar en Supabase:", errSb);
                    }
                }

                if (!insertedItem) {
                    insertedItem = {
                        id: (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : ("loc-" + Date.now()),
                        created_at: new Date().toISOString(),
                        ...sbPayload
                    };
                }

                allNomina.unshift(insertedItem);
                saveLocalNomina();
                applyNominaFilters();

                const modalEl = document.getElementById("newNominaModal");
                const modalInst = bootstrap.Modal.getInstance(modalEl);
                if (modalInst) modalInst.hide();

                showCopyToast(`¡Registro creado!`, insertedItem.nombre_completo);
            } catch (err) {
                alert("Error al guardar: " + err.message);
            } finally {
                btnSave.disabled = false;
                btnSave.innerHTML = origHTML;
            }
        }

        function openEditNominaModal(id) {
            const item = allNomina.find(n => n.id === id);
            if (!item) return;

            selectedNominaId = id;
            document.getElementById("edit-nom-nombre").value = item.nombre_completo || "";
            document.getElementById("edit-nom-emprendimiento").value = item.emprendimiento || "";
            document.getElementById("edit-nom-rut").value = item.rut || "";
            document.getElementById("edit-nom-razon").value = item.razon_social || "";
            document.getElementById("edit-nom-email").value = item.email || "";
            document.getElementById("edit-nom-telefono").value = item.telefono || "";
            document.getElementById("edit-nom-tipo").value = item.tipo_participacion || "Expositor / Tienda";

            const modal = new bootstrap.Modal(document.getElementById("editNominaModal"));
            modal.show();
        }

        async function handleUpdateNominaSubmit(e) {
            e.preventDefault();
            if (!selectedNominaId) return;

            const btnSave = document.getElementById("btn-save-edit-nomina");
            const origHTML = btnSave.innerHTML;
            btnSave.disabled = true;
            btnSave.innerHTML = '<i class="far fa-spinner fa-spin me-1"></i> Actualizando...';

            try {
                const updatedData = {
                    nombre_completo: document.getElementById("edit-nom-nombre").value.trim(),
                    emprendimiento: document.getElementById("edit-nom-emprendimiento").value.trim(),
                    rut: document.getElementById("edit-nom-rut").value.trim(),
                    razon_social: document.getElementById("edit-nom-razon").value.trim() || null,
                    email: document.getElementById("edit-nom-email").value.trim(),
                    telefono: document.getElementById("edit-nom-telefono").value.trim(),
                    tipo_participacion: document.getElementById("edit-nom-tipo").value
                };

                if (supabaseClient) {
                    try {
                        await supabaseClient.from('nomina_municipal').update(updatedData).eq('id', selectedNominaId);
                    } catch (errSb) {
                        console.warn("Advertencia al actualizar en Supabase:", errSb);
                    }
                }

                const idx = allNomina.findIndex(n => n.id === selectedNominaId);
                if (idx !== -1) {
                    allNomina[idx] = { ...allNomina[idx], ...updatedData };
                    saveLocalNomina();
                    applyNominaFilters();
                }

                const modalEl = document.getElementById("editNominaModal");
                const modalInst = bootstrap.Modal.getInstance(modalEl);
                if (modalInst) modalInst.hide();

                showCopyToast(`¡Registro actualizado!`, updatedData.nombre_completo);
            } catch (err) {
                alert("Error al actualizar: " + err.message);
            } finally {
                btnSave.disabled = false;
                btnSave.innerHTML = origHTML;
            }
        }

        async function deleteNominaItem(id) {
            const item = allNomina.find(n => n.id === id);
            const label = item ? item.nombre_completo : 'este registro';

            if (!confirm(`¿Estás seguro de que deseas eliminar a "${label}" de la nómina municipal?`)) {
                return;
            }

            if (supabaseClient) {
                try {
                    await supabaseClient.from('nomina_municipal').delete().eq('id', id);
                } catch (err) {
                    console.warn("Error al borrar en Supabase:", err);
                }
            }

            allNomina = allNomina.filter(n => n.id !== id);
            saveLocalNomina();
            applyNominaFilters();
            showCopyToast(`¡Eliminado!`, label);
        }