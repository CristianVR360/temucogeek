/**
 * Carga de Variables de Entorno y Configuración para Navegador
 * Incluye valores por defecto y lectura asíncrona de .env cuando está disponible.
 */

const SUPABASE_CONFIG = {
    // Credenciales públicas de Supabase (diseñadas para ser expuestas en frontend)
    URL: "https://ffhjyzdsfemmfcbdsxuc.supabase.co",
    ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmaGp5emRzZmVtbWZjYmRzeHVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2Mzg0MTUsImV4cCI6MjA5OTIxNDQxNX0.nhbLWs9dfSGWQ7eWoY0K2TxrPE_XcE0IP56oGZvj6LM",
    ADMIN_MASTER_PASS: "temugeek2026admin",
    RESEND_API_KEY: "",
    ADMIN_EMAIL: "hola@temugeek.cl",
    FROM_EMAIL: "TemuGeek Expo <hola@temugeek.cl>",
    NVIDIA_API_KEY: "",
    isLoaded: false
};

// Intenta cargar desde el archivo .env en cualquier entorno/subdirectorio
async function loadEnvConfig() {
    if (SUPABASE_CONFIG.isLoaded) return SUPABASE_CONFIG;

    const pathsToTry = ['./.env', '../.env', '/.env', '../../.env'];

    for (const envPath of pathsToTry) {
        try {
            const response = await fetch(envPath);
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
                break; // Detener si se cargó exitosamente
            }
        } catch (err) {
            // Continuar con el siguiente path
        }
    }

    SUPABASE_CONFIG.isLoaded = true;
    return SUPABASE_CONFIG;
}

// Inicializar cliente de Supabase
async function getSupabaseClient() {
    await loadEnvConfig();
    if (window.supabase && typeof window.supabase.createClient === 'function') {
        return window.supabase.createClient(SUPABASE_CONFIG.URL, SUPABASE_CONFIG.ANON_KEY);
    }
    return null;
}

// Exportación Global
window.SUPABASE_CONFIG = SUPABASE_CONFIG;
window.loadEnvConfig = loadEnvConfig;
window.getSupabaseClient = getSupabaseClient;
