/**
 * Servicio de Notificaciones por Correo vía Resend API y Supabase
 * Genera plantillas HTML profesionales con la línea gráfica de TemuGeek Expo 2026.
 */

// Helper para enviar correos vía Resend API si RESEND_API_KEY está presente
async function sendResendEmail({ to, subject, html }) {
    // 1. Intentar envío seguro vía Serverless Function (/api/send-email) en Vercel
    try {
        const apiRes = await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to, subject, html })
        });
        if (apiRes.ok) {
            const data = await apiRes.json();
            console.log("✅ Correo enviado exitosamente vía /api/send-email (Vercel Backend):", data);
            return { success: true, data };
        }
    } catch (e) {
        // En entorno de desarrollo sin API backend, continuar al fallback
    }

    if (typeof loadEnvConfig === 'function') {
        await loadEnvConfig();
    }
    const config = window.SUPABASE_CONFIG || {};
    const apiKey = config.RESEND_API_KEY;
    const primaryFrom = config.FROM_EMAIL || "TemuGeek Expo <hola@temugeek.cl>";
    const fallbackFrom = "TemuGeek Expo <onboarding@resend.dev>";
    
    if (!apiKey) {
        console.warn("⚠️ RESEND_API_KEY no configurada. Si estás en producción Vercel, agrégala en Environment Variables.");
        return { success: false, mode: 'missing_key' };
    }

    const sendRequest = async (fromSender) => {
        return fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                from: fromSender,
                to: Array.isArray(to) ? to : [to],
                subject: subject,
                html: html
            })
        });
    };

    try {
        console.log(`✉️ Intentando enviar correo a ${to} desde [${primaryFrom}]...`);
        let res = await sendRequest(primaryFrom);

        // Si el remitente principal falla (por dominio aún no verificado en Resend), reintentar con el sender oficial por defecto de Resend
        if (!res.ok) {
            console.warn(`⚠️ Intento con sender [${primaryFrom}] respondió status ${res.status}. Reintentando con sender de pruebas Resend [${fallbackFrom}]...`);
            res = await sendRequest(fallbackFrom);
        }

        if (res.ok) {
            const data = await res.json();
            console.log("✅ Correo enviado exitosamente vía Resend API:", data);
            return { success: true, data };
        } else {
            const errData = await res.json().catch(() => ({}));
            console.error("❌ Resend API devolvió error:", res.status, errData);
            return { success: false, error: errData };
        }
    } catch (err) {
        console.error("⚠️ Excepción al enviar correo vía Resend API:", err);
        return { success: false, error: err };
    }
}

function escapeEmailHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// -------------------------------------------------------------
// 1. PLANTILLAS DE EXPOSITORES / EMPRENDEDORES
// -------------------------------------------------------------

function generateApplicantEmailHTML(lead) {
    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <title>Postulación Recibida - TemuGeek Expo 2026</title>
</head>
<body style="margin:0; padding:0; background-color:#0f1015; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color:#d1d1d6;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#0f1015; padding:30px 10px;">
        <tr>
            <td align="center">
                <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color:#161822; border:1px solid #2a2d3d; border-radius:16px; overflow:hidden;">
                    <tr>
                        <td align="center" style="background-color:#141519; padding:30px; border-bottom:2px solid #e92652;">
                            <h1 style="color:#ffffff; margin:0; font-size:28px; letter-spacing:1px;">TEMUGEEK EXPO 2026</h1>
                            <div style="color:#ffe62e; font-size:13px; font-weight:bold; margin-top:5px; text-transform:uppercase; letter-spacing:2px;">Confirmación de Postulación Expositor</div>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:35px 30px;">
                            <h2 style="color:#ffffff; font-size:20px; margin-top:0;">¡Hola, ${escapeEmailHtml(lead.nombre_expositor || lead.nombre_completo)}! 👋</h2>
                            <p style="font-size:15px; line-height:1.6; color:#d1d1d6;">
                                Muchas gracias por postular con tu emprendimiento <strong style="color:#e92652;">"${escapeEmailHtml(lead.nombre_marca)}"</strong> a <strong>TemuGeek Expo 2026</strong>. Hemos recibido exitosamente tu formulario.
                            </p>
                            <div style="background-color:#141519; border:1px solid #2a2d3d; border-radius:12px; padding:20px; margin:25px 0;">
                                <h3 style="color:#ffe62e; font-size:16px; margin-top:0; margin-bottom:15px; border-bottom:1px solid #2a2d3d; padding-bottom:8px;">📋 Resumen de tu Postulación:</h3>
                                <table width="100%" border="0" cellspacing="0" cellpadding="6" style="font-size:14px; color:#d1d1d6;">
                                    <tr>
                                        <td width="40%" style="color:#8e95a5;">Expositor:</td>
                                        <td style="color:#ffffff; font-weight:bold;">${escapeEmailHtml(lead.nombre_expositor || lead.nombre_completo)}</td>
                                    </tr>
                                    <tr>
                                        <td style="color:#8e95a5;">Marca / Stand:</td>
                                        <td style="color:#e92652; font-weight:bold;">${escapeEmailHtml(lead.nombre_marca)}</td>
                                    </tr>
                                    <tr>
                                        <td style="color:#8e95a5;">Espacio Solicitado:</td>
                                        <td style="color:#ffe62e; font-weight:bold;">${escapeEmailHtml(lead.espacio_tipo)}</td>
                                    </tr>
                                    <tr>
                                        <td style="color:#8e95a5;">Categoría(s):</td>
                                        <td style="color:#ffffff;">${escapeEmailHtml(lead.categorias)}</td>
                                    </tr>
                                </table>
                            </div>
                            <p style="font-size:14px; line-height:1.6; color:#8e95a5;">
                                Te contactaremos por este medio o vía WhatsApp en un plazo máximo de <strong>48 a 72 horas hábiles</strong>.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="background-color:#141519; padding:20px; border-top:1px solid #2a2d3d; font-size:12px; color:#8e95a5;">
                            TemuGeek Expo 2026 • Recinto SOFO, Temuco
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;
}

function generateAdminEmailHTML(lead) {
    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <title>🚨 Nueva Postulación de Expositor - TemuGeek Expo 2026</title>
</head>
<body style="margin:0; padding:0; background-color:#0f1015; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color:#d1d1d6;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#0f1015; padding:30px 10px;">
        <tr>
            <td align="center">
                <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color:#161822; border:1px solid #e92652; border-radius:16px; overflow:hidden;">
                    <tr>
                        <td align="center" style="background-color:#141519; padding:25px; border-bottom:2px solid #e92652;">
                            <div style="background-color:#e92652; color:#ffffff; font-size:11px; font-weight:bold; padding:4px 12px; border-radius:20px; display:inline-block; text-transform:uppercase; margin-bottom:8px;">NUEVO LEAD RECIBIDO</div>
                            <h2 style="color:#ffffff; margin:0; font-size:24px;">Postulación: ${escapeEmailHtml(lead.nombre_marca || lead.nombre_completo)}</h2>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:30px;">
                            <table width="100%" border="0" cellspacing="0" cellpadding="8" style="background-color:#141519; border:1px solid #2a2d3d; border-radius:10px; font-size:14px; margin-bottom:20px;">
                                <tr>
                                    <td width="35%" style="color:#8e95a5;">Expositor:</td>
                                    <td style="color:#ffffff; font-weight:bold;">${escapeEmailHtml(lead.nombre_expositor || lead.nombre_completo)}</td>
                                </tr>
                                <tr>
                                    <td style="color:#8e95a5;">Marca:</td>
                                    <td style="color:#ffe62e; font-weight:bold;">${escapeEmailHtml(lead.nombre_marca)}</td>
                                </tr>
                                <tr>
                                    <td style="color:#8e95a5;">Contacto:</td>
                                    <td style="color:#00e676;">${escapeEmailHtml(lead.telefono)} / ${escapeEmailHtml(lead.email)}</td>
                                </tr>
                            </table>
                            <div align="center">
                                <a href="https://temugeek.cl/admin" style="background-color:#e92652; color:#ffffff; font-weight:bold; text-decoration:none; padding:14px 28px; border-radius:8px; display:inline-block; font-size:15px;">
                                    Abrir Panel Admin 🚀
                                </a>
                            </div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;
}

// -------------------------------------------------------------
// 2. PLANTILLAS DEL CONCURSO DE COSPLAY
// -------------------------------------------------------------

// Confirmación para el postulante de Cosplay
function generateCosplayApplicantEmailHTML(lead) {
    const esMenor = lead.edad && parseInt(lead.edad, 10) < 18;
    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <title>Confirmación Concurso Cosplay — TemuGeek Expo 2026</title>
</head>
<body style="margin:0; padding:0; background-color:#0b0c10; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color:#e2e8f0;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#0b0c10; padding:30px 10px;">
        <tr>
            <td align="center">
                <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color:#121522; border:2px solid #e92652; border-radius:20px; overflow:hidden; box-shadow:0 0 30px rgba(233,38,82,0.3);">
                    <!-- Header -->
                    <tr>
                        <td align="center" style="background-color:#1a1e2e; padding:30px; border-bottom:2px solid #e92652;">
                            <h1 style="color:#ffffff; margin:0; font-size:26px; font-weight:bold; letter-spacing:1px;">🎭 TEMUGEEK EXPO 2026</h1>
                            <div style="color:#ffe62e; font-size:14px; font-weight:bold; margin-top:6px; text-transform:uppercase; letter-spacing:2px;">Concurso Oficial de Cosplay</div>
                        </td>
                    </tr>
                    
                    <!-- Content Body -->
                    <tr>
                        <td style="padding:35px 30px;">
                            <h2 style="color:#ffffff; font-size:22px; margin-top:0;">¡Hola, ${escapeEmailHtml(lead.nombre_completo)}! 👋✨</h2>
                            <p style="font-size:15px; line-height:1.65; color:#cbd5e1;">
                                Muchas gracias por inscribirte en el <strong style="color:#ffe62e;">Gran Concurso de Cosplay TemuGeek 2026</strong>. Hemos recibido tu postulación para interpretar al personaje:
                            </p>

                            <!-- Destacado del Personaje -->
                            <div style="background:linear-gradient(135deg, rgba(233,38,82,0.2), rgba(139,92,246,0.2)); border:1px solid #e92652; border-radius:14px; padding:20px; text-align:center; margin:20px 0;">
                                <div style="font-size:12px; color:#ffe62e; text-transform:uppercase; font-weight:bold; letter-spacing:1.5px;">Personaje Inscrito</div>
                                <div style="font-size:24px; color:#ffffff; font-weight:bold; margin:6px 0;">"${escapeEmailHtml(lead.personaje)}"</div>
                                <div style="font-size:14px; color:#94a3b8;">Serie / Origen: <strong style="color:#e2e8f0;">${escapeEmailHtml(lead.origen)}</strong></div>
                            </div>

                            <!-- Resumen de Datos -->
                            <div style="background-color:#1a1e2e; border:1px solid rgba(255,255,255,0.1); border-radius:12px; padding:20px; margin-bottom:25px;">
                                <h3 style="color:#ffe62e; font-size:15px; margin-top:0; margin-bottom:12px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:8px;">📋 Resumen de tu Inscripción:</h3>
                                <table width="100%" border="0" cellspacing="0" cellpadding="6" style="font-size:14px; color:#cbd5e1;">
                                    <tr>
                                        <td width="40%" style="color:#94a3b8;">Cosplayer:</td>
                                        <td style="color:#ffffff; font-weight:bold;">${escapeEmailHtml(lead.nombre_completo)}</td>
                                    </tr>
                                    <tr>
                                        <td style="color:#94a3b8;">RUT / DNI:</td>
                                        <td style="color:#ffffff;">${escapeEmailHtml(lead.rut)}</td>
                                    </tr>
                                    <tr>
                                        <td style="color:#94a3b8;">Edad:</td>
                                        <td style="color:#ffffff;">${escapeEmailHtml(lead.edad)} años</td>
                                    </tr>
                                    ${esMenor ? `
                                    <tr>
                                        <td style="color:#ffe62e;">Adulto Responsable:</td>
                                        <td style="color:#ffe62e; font-weight:bold;">${escapeEmailHtml(lead.nombre_apoderado)} (RUT: ${escapeEmailHtml(lead.rut_apoderado)})</td>
                                    </tr>
                                    ` : ''}
                                    <tr>
                                        <td style="color:#94a3b8;">Teléfono / WhatsApp:</td>
                                        <td style="color:#00d264; font-weight:bold;">${escapeEmailHtml(lead.telefono)}</td>
                                    </tr>
                                    <tr>
                                        <td style="color:#94a3b8;">Foto Referencia:</td>
                                        <td style="color:#38bdf8;"><a href="${escapeEmailHtml(lead.imagen_ref)}" target="_blank" style="color:#38bdf8;">Ver Imagen Enviada</a></td>
                                    </tr>
                                </table>
                            </div>

                            <!-- Recordatorio Datos Evento -->
                            <div style="background-color:rgba(255,230,46,0.1); border-left:4px solid #ffe62e; padding:16px; border-radius:0 8px 8px 0; margin-bottom:25px;">
                                <h4 style="color:#ffffff; margin:0 0 6px 0; font-size:15px;">📅 Recordatorio Importante:</h4>
                                <div style="font-size:13.5px; color:#e2e8f0; line-height:1.6;">
                                    <strong>• Fecha:</strong> Domingo, 16 de Agosto de 2026<br>
                                    <strong>• Lugar:</strong> Recinto SOFO, Temuco<br>
                                    <strong>• Acreditación el día del evento:</strong> Debes confirmar tu llegada con la encargada de cosplay (<strong style="color:#ffe62e;">Danii</strong>) antes de salir al escenario.
                                </div>
                            </div>

                            <p style="font-size:14px; line-height:1.6; color:#94a3b8;">
                                Nuestro equipo revisará tu postulación y te confirmará los detalles finales vía WhatsApp o correo electrónico dentro de las próximas <strong>48 horas</strong>.
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td align="center" style="background-color:#1a1e2e; padding:20px; border-top:1px solid rgba(255,255,255,0.1); font-size:12px; color:#94a3b8;">
                            TemuGeek Expo 2026 • Recinto SOFO, Temuco<br>
                            ¿Tienes dudas? Escríbenos a <a href="mailto:hola@temugeek.cl" style="color:#e92652; text-decoration:none;">hola@temugeek.cl</a>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;
}

// Notificación para el Administrador sobre nuevo Cosplayer
function generateCosplayAdminEmailHTML(lead) {
    const esMenor = lead.edad && parseInt(lead.edad, 10) < 18;
    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <title>🚨 Nueva Postulación Cosplay - TemuGeek 2026</title>
</head>
<body style="margin:0; padding:0; background-color:#0b0c10; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color:#e2e8f0;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#0b0c10; padding:30px 10px;">
        <tr>
            <td align="center">
                <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color:#121522; border:2px solid #8b5cf6; border-radius:20px; overflow:hidden;">
                    <tr>
                        <td align="center" style="background-color:#1a1e2e; padding:25px; border-bottom:2px solid #8b5cf6;">
                            <div style="background-color:#8b5cf6; color:#ffffff; font-size:11px; font-weight:bold; padding:4px 12px; border-radius:20px; display:inline-block; text-transform:uppercase; margin-bottom:8px;">NUEVA INSCRIPCIÓN COSPLAY</div>
                            <h2 style="color:#ffffff; margin:0; font-size:24px;">Personaje: ${escapeEmailHtml(lead.personaje)}</h2>
                            <div style="color:#ffe62e; font-size:14px; margin-top:4px;">Cosplayer: ${escapeEmailHtml(lead.nombre_completo)} (${lead.edad} años)</div>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:30px;">
                            <table width="100%" border="0" cellspacing="0" cellpadding="8" style="background-color:#1a1e2e; border:1px solid rgba(255,255,255,0.1); border-radius:10px; font-size:14px; margin-bottom:20px;">
                                <tr>
                                    <td width="35%" style="color:#94a3b8;">Personaje:</td>
                                    <td style="color:#ffe62e; font-weight:bold; font-size:16px;">${escapeEmailHtml(lead.personaje)}</td>
                                </tr>
                                <tr>
                                    <td style="color:#94a3b8;">Origen / Serie:</td>
                                    <td style="color:#ffffff; font-weight:bold;">${escapeEmailHtml(lead.origen)}</td>
                                </tr>
                                <tr>
                                    <td style="color:#94a3b8;">Cosplayer:</td>
                                    <td style="color:#ffffff;">${escapeEmailHtml(lead.nombre_completo)} (RUT: ${escapeEmailHtml(lead.rut)})</td>
                                </tr>
                                <tr>
                                    <td style="color:#94a3b8;">Edad:</td>
                                    <td style="color:#ffffff;">${escapeEmailHtml(lead.edad)} años ${esMenor ? '<span style="color:#e92652; font-weight:bold;">(MENOR DE EDAD)</span>' : ''}</td>
                                </tr>
                                ${esMenor ? `
                                <tr>
                                    <td style="color:#ffe62e;">Apoderado:</td>
                                    <td style="color:#ffe62e;">${escapeEmailHtml(lead.nombre_apoderado)} (RUT: ${escapeEmailHtml(lead.rut_apoderado)})</td>
                                </tr>
                                ` : ''}
                                <tr>
                                    <td style="color:#94a3b8;">Teléfono (WSP):</td>
                                    <td style="color:#00d264; font-weight:bold;">${escapeEmailHtml(lead.telefono)}</td>
                                </tr>
                                <tr>
                                    <td style="color:#94a3b8;">Correo:</td>
                                    <td style="color:#ffffff;">${escapeEmailHtml(lead.email)}</td>
                                </tr>
                                <tr>
                                    <td style="color:#94a3b8;">Foto Referencia:</td>
                                    <td style="color:#38bdf8;"><a href="${escapeEmailHtml(lead.imagen_ref)}" target="_blank" style="color:#38bdf8;">Abrir Imagen de Referencia</a></td>
                                </tr>
                            </table>

                            ${lead.observaciones ? `
                            <div style="background-color:#1a1e2e; border:1px solid rgba(255,255,255,0.1); border-radius:10px; padding:15px; margin-bottom:20px;">
                                <div style="font-size:12px; color:#94a3b8; text-transform:uppercase; font-weight:bold; margin-bottom:6px;">Observaciones / Consultas Pasarela:</div>
                                <div style="font-size:14px; color:#e2e8f0;">${escapeEmailHtml(lead.observaciones)}</div>
                            </div>
                            ` : ''}

                            <div align="center" style="margin-top:25px;">
                                <a href="https://temugeek.cl/admin" style="background-color:#8b5cf6; color:#ffffff; font-weight:bold; text-decoration:none; padding:14px 28px; border-radius:8px; display:inline-block; font-size:15px;">
                                    Gestionar en Panel Admin 🚀
                                </a>
                            </div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;
}

// Correo de Aprobación / Rechazo enviado desde el Dashboard de Admin
function generateCosplayStatusEmailHTML(lead, newStatus) {
    const isApproved = newStatus === 'aprobado';
    const statusTitle = isApproved ? "¡Postulación Aprobada! 🎉" : "Actualización de Postulación";
    const accentColor = isApproved ? "#00d264" : "#e92652";

    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <title>${statusTitle} — Concurso Cosplay TemuGeek 2026</title>
</head>
<body style="margin:0; padding:0; background-color:#0b0c10; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color:#e2e8f0;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#0b0c10; padding:30px 10px;">
        <tr>
            <td align="center">
                <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color:#121522; border:2px solid ${accentColor}; border-radius:20px; overflow:hidden;">
                    <tr>
                        <td align="center" style="background-color:#1a1e2e; padding:30px; border-bottom:2px solid ${accentColor};">
                            <h1 style="color:#ffffff; margin:0; font-size:24px; font-weight:bold;">TEMUGEEK EXPO 2026</h1>
                            <div style="color:${accentColor}; font-size:16px; font-weight:bold; margin-top:6px; text-transform:uppercase;">${statusTitle}</div>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:35px 30px;">
                            <h2 style="color:#ffffff; font-size:20px; margin-top:0;">Hola, ${escapeEmailHtml(lead.nombre_completo || lead.nombre_expositor)} 👋</h2>
                            
                            ${isApproved ? `
                            <p style="font-size:15.5px; line-height:1.65; color:#e2e8f0;">
                                Nos complace informarte que tu postulación para interpretar a <strong style="color:#ffe62e;">"${escapeEmailHtml(lead.personaje || lead.nombre_marca)}"</strong> en el Concurso de Cosplay TemuGeek 2026 ha sido <strong style="color:#00d264;">OFICIALMENTE APROBADA</strong>.
                            </p>
                            <div style="background-color:rgba(0,210,100,0.1); border-left:4px solid #00d264; padding:18px; border-radius:0 10px 10px 0; margin:20px 0;">
                                <h4 style="color:#00d264; margin:0 0 8px 0; font-size:16px;">📌 Indicaciones para el día del Evento:</h4>
                                <div style="font-size:14px; color:#e2e8f0; line-height:1.6;">
                                    <strong>1. Fecha & Lugar:</strong> Domingo 16 de Agosto de 2026 en Recinto SOFO, Temuco.<br>
                                    <strong>2. Acreditación:</strong> Acércate al escenario con la encargada de Cosplay (<strong style="color:#ffe62e;">Danii</strong>) a tu llegada para confirmar tu turno de pasarela.<br>
                                    <strong>3. Poses:</strong> Prepara entre 3 y 4 poses representativas del personaje (duración 5-7 segundos por pose).
                                </div>
                            </div>
                            ` : `
                            <p style="font-size:15px; line-height:1.65; color:#cbd5e1;">
                                Queremos agradecer tu interés en participar del Concurso de Cosplay TemuGeek 2026 con tu propuesta de <strong style="color:#e92652;">"${escapeEmailHtml(lead.personaje || lead.nombre_marca)}"</strong>.
                                <br><br>
                                Lamentablemente, en esta oportunidad el cupo o la categoría ha sido completada. Te invitamos a acompañarnos este Domingo 16 de Agosto en SOFO y disfrutar de todas las actividades del evento.
                            </p>
                            `}

                            ${lead.notas_internas ? `
                            <div style="background-color:#1a1e2e; border:1px solid rgba(255,255,255,0.1); border-radius:10px; padding:15px; margin-top:20px;">
                                <strong style="color:#ffe62e; font-size:13px;">Mensaje de la Producción:</strong>
                                <p style="color:#e2e8f0; font-size:14px; margin:5px 0 0 0;">${escapeEmailHtml(lead.notas_internas)}</p>
                            </div>
                            ` : ''}
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="background-color:#1a1e2e; padding:20px; border-top:1px solid rgba(255,255,255,0.1); font-size:12px; color:#94a3b8;">
                            TemuGeek Expo 2026 • Recinto SOFO, Temuco
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;
}

// -------------------------------------------------------------
// 3. FUNCIONES DE ENVÍO DE CORREOS
// -------------------------------------------------------------

// Enviar correos al registrar nueva postulación de Cosplay
async function sendCosplayPostulacionEmails(lead) {
    if (typeof loadEnvConfig === 'function') {
        await loadEnvConfig();
    }
    const config = window.SUPABASE_CONFIG || {};
    const adminEmail = config.ADMIN_EMAIL || "hola@temugeek.cl";

    const applicantHtml = generateCosplayApplicantEmailHTML(lead);
    const adminHtml = generateCosplayAdminEmailHTML(lead);

    console.log("✉️ Despachando correos para postulación de Cosplay:", lead.nombre_completo, "personaje:", lead.personaje);

    // 1. Correo al Postulante
    const resApplicant = await sendResendEmail({
        to: lead.email,
        subject: `✨ Confirmación Concurso Cosplay TemuGeek 2026 — ${lead.personaje}`,
        html: applicantHtml
    });

    // 2. Correo al Administrador del Sistema
    const resAdmin = await sendResendEmail({
        to: adminEmail,
        subject: `🎭 Nueva Postulación Cosplay: ${lead.personaje} (${lead.nombre_completo})`,
        html: adminHtml
    });

    return { applicantSent: resApplicant.success, adminSent: resAdmin.success };
}

// Enviar correo cuando el Administrador aprueba o cambia estado desde el Dashboard
async function sendCosplayStatusUpdateEmail(lead, newStatus) {
    if (typeof loadEnvConfig === 'function') {
        await loadEnvConfig();
    }

    const html = generateCosplayStatusEmailHTML(lead, newStatus);
    const isApproved = newStatus === 'aprobado';
    const subject = isApproved 
        ? `🎉 ¡Tu postulación al Concurso de Cosplay TemuGeek 2026 ha sido APROBADA!`
        : `Información sobre tu postulación al Concurso de Cosplay TemuGeek 2026`;

    return await sendResendEmail({
        to: lead.email,
        subject: subject,
        html: html
    });
}

// Enviar correos al registrar Expositor
async function sendPostulacionEmails(lead) {
    if (typeof loadEnvConfig === 'function') {
        await loadEnvConfig();
    }
    const config = window.SUPABASE_CONFIG || {};
    const adminEmail = config.ADMIN_EMAIL || "hola@temugeek.cl";

    const applicantHtml = generateApplicantEmailHTML(lead);
    const adminHtml = generateAdminEmailHTML(lead);

    const resApplicant = await sendResendEmail({
        to: lead.email,
        subject: `Confirmación de Postulación Expositor — TemuGeek Expo 2026`,
        html: applicantHtml
    });

    const resAdmin = await sendResendEmail({
        to: adminEmail,
        subject: `🚨 Nueva Postulación Expositor: ${lead.nombre_marca}`,
        html: adminHtml
    });

    return { applicantSent: resApplicant.success, adminSent: resAdmin.success };
}

// Exportar funciones globalmente en window
window.generateApplicantEmailHTML = generateApplicantEmailHTML;
window.generateAdminEmailHTML = generateAdminEmailHTML;
window.generateCosplayApplicantEmailHTML = generateCosplayApplicantEmailHTML;
window.generateCosplayAdminEmailHTML = generateCosplayAdminEmailHTML;
window.generateCosplayStatusEmailHTML = generateCosplayStatusEmailHTML;
window.sendPostulacionEmails = sendPostulacionEmails;
window.sendCosplayPostulacionEmails = sendCosplayPostulacionEmails;
window.sendCosplayStatusUpdateEmail = sendCosplayStatusUpdateEmail;
