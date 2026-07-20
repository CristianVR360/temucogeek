/**
 * Carga de Variables de Entorno y Configuración para Navegador
 * Incluye valores por defecto y lectura asíncrona de .env cuando está disponible.
 */

const SUPABASE_CONFIG = {
    // Credenciales públicas de Supabase (diseñadas para ser expuestas en frontend)
    URL: "https://ffhjyzdsfemmfcbdsxuc.supabase.co",
    ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmaGp5emRzZmVtbWZjYmRzeHVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2Mzg0MTUsImV4cCI6MjA5OTIxNDQxNX0.nhbLWs9dfSGWQ7eWoY0K2TxrPE_XcE0IP56oGZvj6LM",
    // Credenciales privadas - se cargan desde .env (NO hardcodear aquí)
    ADMIN_MASTER_PASS: "",
    RESEND_API_KEY: "",
    ADMIN_EMAIL: "",
    FROM_EMAIL: "",
    NVIDIA_API_KEY: "",
    isLoaded: false
};

// Intenta cargar desde el archivo .env sin generar errores 404 en consola
async function loadEnvConfig() {
    if (SUPABASE_CONFIG.isLoaded) return SUPABASE_CONFIG;
    SUPABASE_CONFIG.isLoaded = true;

    // Carga .env solo si estamos ejecutando en servidor local (localhost)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        try {
            const response = await fetch('./.env');
            if (response.ok) {
                const envText = await response.text();
                const lines = envText.split('\n');
                lines.forEach(line => {
                    const trimmed = line.trim();
                    if (trimmed && !trimmed.startsWith('#')) {
                        const [key, ...valueParts] = trimmed.split('=');
                        const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');

                        if ((key === 'SUPABASE_URL' || key === 'VITE_SUPABASE_URL') && value) {
                            SUPABASE_CONFIG.URL = value;
                        }
                        if ((key === 'SUPABASE_ANON_KEY' || key === 'VITE_SUPABASE_ANON_KEY') && value) {
                            SUPABASE_CONFIG.ANON_KEY = value;
                        }
                        if (key === 'ADMIN_MASTER_PASS' && value) {
                            SUPABASE_CONFIG.ADMIN_MASTER_PASS = value;
                        }
                        if (key === 'RESEND_API_KEY' && value) {
                            SUPABASE_CONFIG.RESEND_API_KEY = value;
                        }
                        if (key === 'ADMIN_EMAIL' && value) {
                            SUPABASE_CONFIG.ADMIN_EMAIL = value;
                        }
                        if (key === 'FROM_EMAIL' && value) {
                            SUPABASE_CONFIG.FROM_EMAIL = value;
                        }
                        if (key === 'NVIDIA_API_KEY' && value) {
                            SUPABASE_CONFIG.NVIDIA_API_KEY = value;
                        }
                    }
                });
            }
        } catch (err) {
            // Silencioso
        }
    }

    return SUPABASE_CONFIG;
}

// Inicializar cliente Supabase
async function getSupabaseClient() {
    await loadEnvConfig();

    if (SUPABASE_CONFIG.URL && SUPABASE_CONFIG.ANON_KEY && window.supabase && typeof window.supabase.createClient === 'function') {
        try {
            return window.supabase.createClient(SUPABASE_CONFIG.URL, SUPABASE_CONFIG.ANON_KEY);
        } catch (e) {
            console.error("Error al inicializar cliente Supabase:", e);
            return null;
        }
    }
    return null;
}

// Auto-iniciar la lectura
loadEnvConfig();

// Exportar globalmente en window para evitar ReferenceError
window.SUPABASE_CONFIG = SUPABASE_CONFIG;
window.loadEnvConfig = loadEnvConfig;
window.getSupabaseClient = getSupabaseClient;
