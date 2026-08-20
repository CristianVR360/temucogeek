/**
 * Servicio de Notificaciones por Correo vía Resend API y Supabase
 * Genera plantillas HTML profesionales con la línea gráfica de TemuGeek Expo 2026.
 */

// Helper para enviar correos vía Serverless Function Vercel (/api/send-email)
async function sendResendEmail({ to, subject, html }) {
    const isLocal = typeof window !== 'undefined' && window.location && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:');
    
    // Si se prueba localmente en Live Server (donde /api no existe), conectar al backend de producción con WWW
    const apiUrl = isLocal ? 'https://www.temugeek.cl/api/send-email' : '/api/send-email';

    try {
        console.log(`✉️ Despachando correo a ${to} vía Serverless API (${apiUrl})...`);
        let apiRes = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to, subject, html })
        });

        // Si el endpoint relativo falló en servidor, intentar URL canónica de Vercel
        if (!apiRes.ok && !isLocal) {
            console.warn(`⚠️ Endpoint relativo /api/send-email respondió status ${apiRes.status}. Reintentando con https://www.temugeek.cl/api/send-email...`);
            apiRes = await fetch('https://www.temugeek.cl/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ to, subject, html })
            });
        }

        if (apiRes.ok) {
            const data = await apiRes.json();
            console.log("✅ Correo entregado exitosamente vía /api/send-email:", data);
            return { success: true, data };
        } else {
            const errData = await apiRes.json().catch(() => ({}));
            console.error("❌ /api/send-email respondió con error:", apiRes.status, errData);
            return { success: false, error: errData };
        }
    } catch (e) {
        console.error("❌ Error de conexión al enviar correo vía /api/send-email:", e);
        return { success: false, error: e.message || String(e) };
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

// Plantilla oficial de Aprobación (Expositores y Cosplay) con datos bancarios y recursos de marca
function generateApprovalEmailHTML(lead) {
    const isCosplay = lead.tipo_postulacion === 'cosplay' || Boolean(lead.personaje);
    const isCanje = Boolean(lead.es_canje) || (lead.espacio_tipo && (lead.espacio_tipo.toLowerCase().includes('canje') || lead.espacio_tipo.toLowerCase().includes('costo cero')));
    const nombre = escapeEmailHtml(lead.nombre_expositor || lead.nombre_completo);
    const itemNombre = isCosplay 
        ? `personaje <strong style="color:#ffe62e;">"${escapeEmailHtml(lead.personaje)}"</strong>` 
        : `marca / emprendimiento <strong style="color:#e92652;">"${escapeEmailHtml(lead.nombre_marca)}"</strong>`;

    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <title>¡Postulación Aprobada! 🎉 — TemuGeek Expo 2026</title>
</head>
<body style="margin:0; padding:0; background-color:#0b0c10; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color:#e2e8f0;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#0b0c10; padding:30px 10px;">
        <tr>
            <td align="center">
                <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color:#121522; border:2px solid #00d264; border-radius:20px; overflow:hidden; box-shadow:0 0 35px rgba(0,210,100,0.25);">
                    <!-- Header -->
                    <tr>
                        <td align="center" style="background-color:#1a1e2e; padding:30px; border-bottom:2px solid #00d264;">
                            <div style="background-color:#00d264; color:#0b0c10; font-size:11px; font-weight:bold; padding:4px 14px; border-radius:20px; display:inline-block; text-transform:uppercase; letter-spacing:1px; margin-bottom:10px;">
                                ${isCanje ? 'APROBADO POR CANJE / COSTO CERO' : 'CONFIRMACIÓN OFICIAL'}
                            </div>
                            <h1 style="color:#ffffff; margin:0; font-size:26px; font-weight:bold; letter-spacing:1px;">🎉 ¡TU POSTULACIÓN HA SIDO APROBADA!</h1>
                            <div style="color:#ffe62e; font-size:14px; font-weight:bold; margin-top:6px; text-transform:uppercase; letter-spacing:2px;">TemuGeek Expo 2026 • Recinto SOFO</div>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="padding:35px 30px;">
                            <h2 style="color:#ffffff; font-size:20px; margin-top:0;">¡Hola, ${nombre}! 👋✨</h2>
                            <p style="font-size:15.5px; line-height:1.65; color:#cbd5e1;">
                                Nos complace informarte que tu postulación para participar en <strong>TemuGeek Expo 2026</strong> con tu ${itemNombre} ha sido <strong style="color:#00d264;">OFICIALMENTE APROBADA</strong>.
                            </p>

                            <!-- Resumen del Espacio / Stand Postulado -->
                            <div style="background-color:#141724; border:1px solid #2a2d3d; border-radius:12px; padding:18px 20px; margin:20px 0;">
                                <h3 style="color:#ffe62e; font-size:15px; margin-top:0; margin-bottom:10px; border-bottom:1px solid #2a2d3d; padding-bottom:6px;">
                                    📋 Detalle del Espacio Aprobado:
                                </h3>
                                <table width="100%" border="0" cellspacing="0" cellpadding="5" style="font-size:14px; color:#cbd5e1;">
                                    <tr>
                                        <td width="40%" style="color:#94a3b8;">${isCosplay ? 'Cosplayer:' : 'Expositor / Responsable:'}</td>
                                        <td style="color:#ffffff; font-weight:bold;">${escapeEmailHtml(lead.nombre_expositor || lead.nombre_completo)}</td>
                                    </tr>
                                    <tr>
                                        <td style="color:#94a3b8;">${isCosplay ? 'Personaje:' : 'Marca / Proyecto:'}</td>
                                        <td style="color:#e92652; font-weight:bold;">${escapeEmailHtml(lead.nombre_marca || lead.personaje)}</td>
                                    </tr>
                                    <tr>
                                        <td style="color:#94a3b8;">Tipo de Espacio / Stand:</td>
                                        <td style="color:#ffe62e; font-weight:bold;">${escapeEmailHtml(lead.espacio_tipo || (isCosplay ? 'Concurso Cosplay' : 'Stand Expositor'))}</td>
                                    </tr>
                                    <tr>
                                        <td style="color:#94a3b8;">Costo de Participación:</td>
                                        <td style="color:${isCanje ? '#00d264' : '#38bdf8'}; font-weight:bold;">
                                            ${isCanje ? '$0 CLP (Aprobado por Canje / Acuerdo Especial)' : 'Según espacio seleccionado'}
                                        </td>
                                    </tr>
                                    ${lead.categorias ? `
                                    <tr>
                                        <td style="color:#94a3b8;">Categoría(s):</td>
                                        <td style="color:#ffffff;">${escapeEmailHtml(lead.categorias)}</td>
                                    </tr>
                                    ` : ''}
                                </table>
                            </div>

                            ${lead.notas_internas ? `
                            <!-- Notas de la Producción -->
                            <div style="background-color:#1a1e2e; border:1px solid #ffe62e; border-radius:12px; padding:18px 20px; margin:20px 0;">
                                <strong style="color:#ffe62e; font-size:14px; display:block; margin-bottom:6px;">📌 Nota Especial de la Producción:</strong>
                                <p style="color:#e2e8f0; font-size:14.5px; line-height:1.6; margin:0;">${escapeEmailHtml(lead.notas_internas)}</p>
                            </div>
                            ` : ''}

                            ${isCanje ? `
                            <!-- Caja Aprobado por Canje / Costo Cero -->
                            <div style="background-color:#141724; border:2px dashed #00d264; border-radius:14px; padding:22px; margin:25px 0;">
                                <h3 style="color:#00d264; font-size:17px; margin-top:0; margin-bottom:14px; border-bottom:1px solid rgba(0,210,100,0.2); padding-bottom:8px;">
                                    🤝 Modalidad Aprobada: Canje / Participación Especial ($0 CLP)
                                </h3>
                                <p style="font-size:14px; color:#cbd5e1; margin-bottom:12px; line-height:1.6;">
                                    Tu participación ha sido <strong style="color:#00d264;">Aprobada a Costo Cero ($0 CLP)</strong> bajo el acuerdo de canje o colaboración especial negociado con la Producción de TemuGeek Expo 2026. No requieres realizar transferencias bancarias.
                                </p>
                                <div style="margin-top:14px; background-color:rgba(0,210,100,0.1); border-radius:8px; padding:12px 16px; font-size:13.5px; color:#00d264; line-height:1.6;">
                                    📌 <strong>Coordinación:</strong> Para cualquier consulta o coordinación de material de canje y difusión, envíanos un correo a <a href="mailto:hola@temugeek.cl" style="color:#ffe62e; font-weight:bold; text-decoration:underline;">hola@temugeek.cl</a> o contáctate directamente con nuestro administrador al WhatsApp <a href="https://wa.me/56984305751" target="_blank" style="color:#ffffff; font-weight:bold; text-decoration:underline;">+56 9 8430 5751</a>.
                                </div>
                            </div>
                            ` : `
                            <!-- Datos de Transferencia -->
                            <div style="background-color:#141724; border:2px dashed #ffe62e; border-radius:14px; padding:22px; margin:25px 0;">
                                <h3 style="color:#ffe62e; font-size:17px; margin-top:0; margin-bottom:14px; border-bottom:1px solid rgba(255,230,46,0.2); padding-bottom:8px;">
                                    💳 Datos Oficiales para Transferencia Bancaria
                                </h3>
                                <p style="font-size:13.5px; color:#cbd5e1; margin-bottom:14px; line-height:1.5;">
                                    Para confirmar y asegurar tu cupo / espacio en el evento, por favor realiza la transferencia a la siguiente cuenta oficial:
                                </p>
                                <table width="100%" border="0" cellspacing="0" cellpadding="6" style="font-size:14.5px; color:#ffffff;">
                                    <tr>
                                        <td width="42%" style="color:#94a3b8;">Razón Social:</td>
                                        <td style="color:#ffe62e; font-weight:bold;">VINTAGE SPA</td>
                                    </tr>
                                    <tr>
                                        <td style="color:#94a3b8;">RUT Empresa:</td>
                                        <td style="font-weight:bold;">78.345.355-K</td>
                                    </tr>
                                    <tr>
                                        <td style="color:#94a3b8;">Banco:</td>
                                        <td style="font-weight:bold;">Banco Estado</td>
                                    </tr>
                                    <tr>
                                        <td style="color:#94a3b8;">Tipo de Cuenta:</td>
                                        <td style="color:#00d264; font-weight:bold;">Chequera Electrónica</td>
                                    </tr>
                                    <tr>
                                        <td style="color:#94a3b8;">N° de Cuenta:</td>
                                        <td style="color:#38bdf8; font-weight:bold; font-size:16px;">91270041863</td>
                                    </tr>
                                    <tr>
                                        <td style="color:#94a3b8;">Correo de Pago:</td>
                                        <td style="color:#ffffff;">hola@temugeek.cl</td>
                                    </tr>
                                </table>
                                <div style="margin-top:14px; background-color:rgba(255,230,46,0.1); border-radius:8px; padding:12px 16px; font-size:13.5px; color:#ffe62e; line-height:1.6;">
                                    📌 <strong>Importante:</strong> Envía tu comprobante a <a href="mailto:hola@temugeek.cl" style="color:#ffe62e; font-weight:bold; text-decoration:underline;">hola@temugeek.cl</a> o contáctate directamente con nuestro administrador al WhatsApp <a href="https://wa.me/56984305751" target="_blank" style="color:#00d264; font-weight:bold; text-decoration:underline;">+56 9 8430 5751</a> indicando el nombre de tu marca/postulación.
                                </div>
                            </div>
                            `}

                            <!-- Linktree & Manual de Marca -->
                            <div style="background:linear-gradient(135deg, rgba(233,38,82,0.15), rgba(139,92,246,0.15)); border:1px solid #e92652; border-radius:14px; padding:22px; margin-bottom:25px;">
                                <h3 style="color:#ffffff; font-size:16px; margin-top:0; margin-bottom:10px;">
                                    🔗 Bases Oficiales, Redes Sociales y Manual de Marca
                                </h3>
                                <p style="font-size:14px; color:#cbd5e1; line-height:1.6; margin-bottom:16px;">
                                    En nuestro hub oficial de enlaces encontrarás las <strong>Bases de participación</strong>, nuestras redes sociales oficiales y el <strong>Manual de Marca</strong> (con logos editables en alta resolución, paleta de colores y plantillas para creadores de contenido o republicación):
                                </p>
                                <table width="100%" border="0" cellspacing="0" cellpadding="4">
                                    <tr>
                                        <td align="center">
                                            <a href="https://temugeek.cl/links" target="_blank" style="background-color:#e92652; color:#ffffff; font-weight:bold; text-decoration:none; padding:12px 20px; border-radius:30px; display:inline-block; font-size:13.5px; margin:4px;">
                                                🌐 Ver Links Oficiales (Linktree)
                                            </a>
                                            <a href="https://temugeek.cl/manual-marca" target="_blank" style="background-color:#ffe62e; color:#0b0c10; font-weight:bold; text-decoration:none; padding:12px 20px; border-radius:30px; display:inline-block; font-size:13.5px; margin:4px;">
                                                🎨 Descargar Logos y Manual de Marca
                                            </a>
                                        </td>
                                    </tr>
                                </table>
                            </div>

                            <p style="font-size:14px; line-height:1.6; color:#94a3b8; margin-bottom:0;">
                                Nos vemos este <strong>Domingo 16 de Agosto de 2026</strong> en el Recinto SOFO de Temuco. Si tienes cualquier consulta, escríbenos a <a href="mailto:hola@temugeek.cl" style="color:#ffe62e; text-decoration:none;">hola@temugeek.cl</a> o a nuestro WhatsApp oficial.
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td align="center" style="background-color:#1a1e2e; padding:20px; border-top:1px solid rgba(255,255,255,0.1); font-size:12px; color:#94a3b8;">
                            TemuGeek Expo 2026 • Recinto SOFO, Temuco<br>
                            <a href="https://temugeek.cl" style="color:#ffe62e; text-decoration:none;">www.temugeek.cl</a> • <a href="mailto:hola@temugeek.cl" style="color:#e92652; text-decoration:none;">hola@temugeek.cl</a>
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
function generateCosplayApprovalEmailHTML(lead) {
    const nombre = escapeEmailHtml(lead.nombre_completo || lead.nombre_expositor);
    const personaje = escapeEmailHtml(lead.personaje || 'tu personaje');
    const origen = escapeEmailHtml(lead.origen || 'Serie / Origen');

    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <title>¡Postulación Cosplay Aprobada! 🎉 — TemuGeek Expo 2026</title>
</head>
<body style="margin:0; padding:0; background-color:#0b0c10; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color:#e2e8f0;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#0b0c10; padding:30px 10px;">
        <tr>
            <td align="center">
                <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color:#121522; border:2px solid #8b5cf6; border-radius:20px; overflow:hidden; box-shadow:0 0 35px rgba(139,92,246,0.3);">
                    <!-- Header -->
                    <tr>
                        <td align="center" style="background-color:#1a1e2e; padding:30px; border-bottom:2px solid #8b5cf6;">
                            <div style="background-color:#8b5cf6; color:#ffffff; font-size:11px; font-weight:bold; padding:4px 14px; border-radius:20px; display:inline-block; text-transform:uppercase; letter-spacing:1px; margin-bottom:10px;">
                                🎭 SELECCIÓN OFICIAL COSPLAY 2026
                            </div>
                            <h1 style="color:#ffffff; margin:0; font-size:26px; font-weight:bold; letter-spacing:1px;">🎉 ¡TU POSTULACIÓN HA SIDO APROBADA!</h1>
                            <div style="color:#ffe62e; font-size:14px; font-weight:bold; margin-top:6px; text-transform:uppercase; letter-spacing:2px;">TemuGeek Expo 2026 • Recinto SOFO</div>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="padding:35px 30px;">
                            <h2 style="color:#ffffff; font-size:20px; margin-top:0;">¡Hola, ${nombre}! 👋✨</h2>
                            <p style="font-size:15.5px; line-height:1.65; color:#cbd5e1;">
                                ¡Muchas felicidades! Hemos revisado minuciosamente las postulaciones recibidas y nos alegra informarte que tu propuesta para interpretar al personaje <strong style="color:#ffe62e;">"${personaje}"</strong> (${origen}) en el <strong>Gran Concurso de Cosplay TemuGeek Expo 2026</strong> ha sido <strong style="color:#00d264;">OFICIALMENTE APROBADA</strong>.
                            </p>

                            <!-- Resumen del Personaje Aprobado -->
                            <div style="background-color:#141724; border:1px solid #2a2d3d; border-radius:12px; padding:18px 20px; margin:22px 0;">
                                <h3 style="color:#ffe62e; font-size:15px; margin-top:0; margin-bottom:10px; border-bottom:1px solid #2a2d3d; padding-bottom:6px;">
                                    📋 Resumen de tu Participación:
                                </h3>
                                <table width="100%" border="0" cellspacing="0" cellpadding="5" style="font-size:14px; color:#cbd5e1;">
                                    <tr>
                                        <td width="40%" style="color:#94a3b8;">Cosplayer:</td>
                                        <td style="color:#ffffff; font-weight:bold;">${nombre}</td>
                                    </tr>
                                    <tr>
                                        <td style="color:#94a3b8;">Personaje Inscrito:</td>
                                        <td style="color:#e92652; font-weight:bold; font-size:15px;">"${personaje}"</td>
                                    </tr>
                                    <tr>
                                        <td style="color:#94a3b8;">Serie / Origen:</td>
                                        <td style="color:#ffffff;">${origen}</td>
                                    </tr>
                                    <tr>
                                        <td style="color:#94a3b8;">Costo de Inscripción:</td>
                                        <td style="color:#00d264; font-weight:bold;">$0 CLP (Participación Gratuita)</td>
                                    </tr>
                                </table>
                            </div>

                            <!-- Invitación a sumar puntos en RRSS -->
                            <div style="background:linear-gradient(135deg, rgba(139,92,246,0.2), rgba(233,38,82,0.2)); border:2px dashed #8b5cf6; border-radius:16px; padding:22px; margin:25px 0;">
                                <h3 style="color:#ffe62e; font-size:17px; margin-top:0; margin-bottom:12px;">
                                    🎬 ¡SUMA PUNTOS EXTRAS EN REDES SOCIALES! ⭐
                                </h3>
                                <p style="font-size:14px; color:#e2e8f0; line-height:1.65; margin-bottom:14px;">
                                    ¡Queremos ver tu talento y preparación! Puedes <strong>sumar puntos adicionales en la evaluación previa</strong> creando y compartiendo un video en tus redes sociales (Instagram Reels o TikTok) mostrando:
                                </p>
                                <ul style="font-size:13.5px; color:#cbd5e1; margin:0 0 14px 0; padding-left:20px; line-height:1.7;">
                                    <li>🧵 Tu proceso de confección, armado de props o utilería.</li>
                                    <li>💄 Tu prueba de maquillaje, estilizado de peluca o caracterización.</li>
                                    <li>✨ Un ensayo de pose, actuación o el resultado final de tu cosplay.</li>
                                </ul>
                                <p style="font-size:13px; color:#ffe62e; line-height:1.5; margin:0 0 14px 0;">
                                    📝 <strong>Nota:</strong> Esta bonificación de puntaje extra y sus criterios de asignación están claramente detallados en la pauta de evaluación oficial del concurso (<a href="https://temugeek.cl/bases-cosplay" target="_blank" style="color:#ffffff; font-weight:bold; text-decoration:underline;">ver pauta en Bases Oficiales</a>).
                                </p>
                                <div style="background-color:rgba(139,92,246,0.15); border-radius:10px; padding:12px 16px; font-size:13.5px; color:#ffffff; line-height:1.6;">
                                    📌 <strong>Para validar tus puntos:</strong> Etiquétanos en tu publicación como <a href="https://instagram.com/temugeek.cl" target="_blank" style="color:#ffe62e; font-weight:bold; text-decoration:underline;">@temugeek.cl</a> y utiliza los hashtags <strong style="color:#00d264;">#TemuGeekCosplay #TemuGeek2026</strong>. ¡El jurado y la producción estarán muy atentos!
                                </div>
                            </div>

                            <!-- Enlace a las Bases Oficiales de Cosplay -->
                            <div style="background-color:#141724; border:1px solid #2a2d3d; border-radius:14px; padding:20px; margin-bottom:25px; text-align:center;">
                                <h3 style="color:#ffffff; font-size:16px; margin-top:0; margin-bottom:10px;">
                                    📜 Bases Oficiales y Reglamento del Concurso
                                </h3>
                                <p style="font-size:14px; color:#94a3b8; line-height:1.6; margin-bottom:16px;">
                                    Revisa detalladamente el reglamento, tiempos en pasarela, criterios de evaluación y requerimientos para el día del evento en nuestro sitio oficial:
                                </p>
                                <a href="https://temugeek.cl/bases-cosplay" target="_blank" style="background-color:#e92652; color:#ffffff; font-weight:bold; text-decoration:none; padding:13px 24px; border-radius:30px; display:inline-block; font-size:14px; margin:4px;">
                                    📜 Ver Bases Oficiales Cosplay
                                </a>
                                <a href="https://temugeek.cl/links" target="_blank" style="background-color:#ffe62e; color:#0b0c10; font-weight:bold; text-decoration:none; padding:13px 24px; border-radius:30px; display:inline-block; font-size:14px; margin:4px;">
                                    🌐 Hub Oficial de Links
                                </a>
                            </div>

                            ${lead.notas_internas ? `
                            <div style="background-color:#1a1e2e; border:1px solid #ffe62e; border-radius:12px; padding:16px 20px; margin-bottom:25px;">
                                <strong style="color:#ffe62e; font-size:14px; display:block; margin-bottom:6px;">📌 Mensaje de la Producción:</strong>
                                <p style="color:#e2e8f0; font-size:14px; line-height:1.6; margin:0;">${escapeEmailHtml(lead.notas_internas)}</p>
                            </div>
                            ` : ''}

                            <p style="font-size:14px; line-height:1.6; color:#94a3b8; margin-bottom:0;">
                                Nos vemos este <strong>Domingo 16 de Agosto de 2026</strong> en el Recinto SOFO de Temuco. Recuerda acreditarte con la encargada de cosplay (<strong>Danii</strong>) apenas llegues al evento. Si tienes cualquier consulta, escríbenos a <a href="mailto:hola@temugeek.cl" style="color:#ffe62e; text-decoration:none;">hola@temugeek.cl</a>.
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td align="center" style="background-color:#1a1e2e; padding:20px; border-top:1px solid rgba(255,255,255,0.1); font-size:12px; color:#94a3b8;">
                            TemuGeek Expo 2026 • Recinto SOFO, Temuco<br>
                            <a href="https://temugeek.cl" style="color:#ffe62e; text-decoration:none;">www.temugeek.cl</a> • <a href="mailto:hola@temugeek.cl" style="color:#e92652; text-decoration:none;">hola@temugeek.cl</a>
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

// Plantilla de Rechazo Suave y Motivadora (Expositores y Cosplay)
function generateRejectionEmailHTML(lead) {
    const isCosplay = lead.tipo_postulacion === 'cosplay' || Boolean(lead.personaje);
    const nombre = escapeEmailHtml(lead.nombre_completo || lead.nombre_expositor);
    const itemNombre = isCosplay 
        ? `personaje "${escapeEmailHtml(lead.personaje)}"` 
        : `emprendimiento "${escapeEmailHtml(lead.nombre_marca)}"`;

    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <title>Información sobre tu postulación — TemuGeek Expo 2026</title>
</head>
<body style="margin:0; padding:0; background-color:#0b0c10; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color:#e2e8f0;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#0b0c10; padding:30px 10px;">
        <tr>
            <td align="center">
                <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color:#121522; border:2px solid #e92652; border-radius:20px; overflow:hidden;">
                    <!-- Header -->
                    <tr>
                        <td align="center" style="background-color:#1a1e2e; padding:30px; border-bottom:2px solid #e92652;">
                            <h1 style="color:#ffffff; margin:0; font-size:24px; font-weight:bold; letter-spacing:1px;">TEMUGEEK EXPO 2026</h1>
                            <div style="color:#e92652; font-size:14px; font-weight:bold; margin-top:6px; text-transform:uppercase; letter-spacing:1.5px;">Actualización de Postulación</div>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="padding:35px 30px;">
                            <h2 style="color:#ffffff; font-size:20px; margin-top:0;">Hola, ${nombre} 👋</h2>
                            
                            <p style="font-size:15px; line-height:1.65; color:#cbd5e1;">
                                Queremos agradecerte sinceramente por tu tiempo, entusiasmo e interés en ser parte de <strong>TemuGeek Expo 2026</strong> con tu propuesta de <strong style="color:#e92652;">${itemNombre}</strong>.
                            </p>
                            <p style="font-size:15px; line-height:1.65; color:#cbd5e1;">
                                Tras una cuidadosa evaluación por parte del equipo organizador, queremos informarte que en esta oportunidad <strong>los cupos disponibles para tu categoría se han completado en su totalidad</strong>, por lo que no pudimos asignar un espacio en esta edición.
                            </p>
                            <p style="font-size:15px; line-height:1.65; color:#cbd5e1;">
                                Queremos transmitirte que valoramos enormemente tu trabajo y pasión por la cultura geek. Esta decisión fue muy difícil debido a la gran cantidad de excelentes postulaciones recibidas.
                            </p>

                            <!-- Sección de Ánimo y Redes Sociales -->
                            <div style="background-color:#141724; border:1px solid #ffe62e; border-radius:14px; padding:22px; margin:25px 0;">
                                <h3 style="color:#ffe62e; font-size:16px; margin-top:0; margin-bottom:10px;">
                                    🌟 ¡Mantén la energía y sigamos conectados!
                                </h3>
                                <p style="font-size:14px; color:#cbd5e1; line-height:1.6; margin-bottom:12px;">
                                    Te invitamos a estar muy atento(a) a nuestras redes sociales oficiales en Instagram (<a href="https://instagram.com/temugeek.cl" target="_blank" style="color:#ffe62e; font-weight:bold; text-decoration:underline;">@temugeek.cl</a>), donde anunciaremos oportunamente próximas convocatorias, eventos pop-up y nuevas fechas de TemuGeek Expo.
                                </p>
                                <p style="font-size:14px; color:#ffffff; line-height:1.6; margin:0;">
                                    Además, <strong>¡te esperamos como visitante este Domingo 16 de Agosto en el Recinto SOFO!</strong> Nos encantaría contar con tu presencia para disfrutar juntos de los torneos, espectáculos y toda la comunidad geek de Temuco.
                                </p>
                            </div>

                            ${lead.notas_internas ? `
                            <div style="background-color:#1a1e2e; border:1px solid rgba(255,255,255,0.1); border-radius:10px; padding:15px; margin-bottom:20px;">
                                <strong style="color:#ffe62e; font-size:13px;">Mensaje de la Producción:</strong>
                                <p style="color:#e2e8f0; font-size:14px; margin:5px 0 0 0;">${escapeEmailHtml(lead.notas_internas)}</p>
                            </div>
                            ` : ''}
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td align="center" style="background-color:#1a1e2e; padding:20px; border-top:1px solid rgba(255,255,255,0.1); font-size:12px; color:#94a3b8;">
                            TemuGeek Expo 2026 • Recinto SOFO, Temuco<br>
                            <a href="https://temugeek.cl" style="color:#ffe62e; text-decoration:none;">www.temugeek.cl</a> • <a href="mailto:hola@temugeek.cl" style="color:#e92652; text-decoration:none;">hola@temugeek.cl</a>
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

function generateCosplayStatusEmailHTML(lead, newStatus) {
    if (newStatus === 'aprobado') {
        return generateCosplayApprovalEmailHTML(lead);
    }
    return generateRejectionEmailHTML(lead);
}

// -------------------------------------------------------------
// 3. FUNCIONES DE ENVÍO DE CORREOS
// -------------------------------------------------------------

// Enviar correo oficial de aprobación (distingue entre Expositores y Cosplay)
async function sendApprovalEmail(lead) {
    if (typeof loadEnvConfig === 'function') {
        await loadEnvConfig();
    }
    const isCosplay = lead.tipo_postulacion === 'cosplay' || Boolean(lead.personaje);
    const html = isCosplay ? generateCosplayApprovalEmailHTML(lead) : generateApprovalEmailHTML(lead);
    const item = isCosplay ? `Cosplay: ${lead.personaje}` : (lead.nombre_marca || 'Postulación');
    const subject = isCosplay
        ? `✨ ¡Tu postulación al Concurso de Cosplay ha sido APROBADA! — ${lead.personaje}`
        : `🎉 ¡Tu postulación a TemuGeek Expo 2026 ha sido APROBADA! — ${item}`;

    console.log("✉️ Despachando correo oficial de aprobación a:", lead.email);
    return await sendResendEmail({
        to: lead.email,
        subject: subject,
        html: html
    });
}

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

// Enviar correo cuando el Administrador cambia estado (Aprobado / Rechazado) desde el Dashboard
async function sendCosplayStatusUpdateEmail(lead, newStatus) {
    if (typeof loadEnvConfig === 'function') {
        await loadEnvConfig();
    }

    if (newStatus === 'aprobado') {
        return await sendApprovalEmail(lead);
    }

    const html = generateRejectionEmailHTML(lead);
    const subject = `Información sobre tu postulación a TemuGeek Expo 2026`;

    return await sendResendEmail({
        to: lead.email,
        subject: subject,
        html: html
    });
}

// Enviar correo de rechazo explícito
async function sendRejectionEmail(lead) {
    if (typeof loadEnvConfig === 'function') {
        await loadEnvConfig();
    }

    const html = generateRejectionEmailHTML(lead);
    const subject = `Información sobre tu postulación a TemuGeek Expo 2026`;

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

// -------------------------------------------------------------
// PLANTILLAS DE AGRADECIMIENTO E INVITACIÓN A ENCUESTAS
// -------------------------------------------------------------

function generateExhibitorSurveyEmailHTML(lead) {
    const leadName = escapeEmailHtml(lead.nombre_contacto || lead.nombre_expositor || lead.nombre_completo || 'Expositor');
    const brandName = escapeEmailHtml(lead.nombre_marca || lead.nombre_stand || 'tu emprendimiento');
    const surveyUrl = 'https://www.temugeek.cl/encuesta-expositores/index.html';

    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <title>¡Gracias por ser parte de TemuGeek Expo 2026!</title>
</head>
<body style="margin:0; padding:0; background-color:#0f1015; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color:#d1d1d6;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#0f1015; padding:30px 10px;">
        <tr>
            <td align="center">
                <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color:#161822; border:1px solid #2a2d3d; border-radius:16px; overflow:hidden;">
                    <tr>
                        <td align="center" style="background-color:#141519; padding:30px; border-bottom:2px solid #00b0ff;">
                            <h1 style="color:#ffffff; margin:0; font-size:26px; letter-spacing:1px;">TEMUGEEK EXPO 2026</h1>
                            <div style="color:#00b0ff; font-size:13px; font-weight:bold; margin-top:5px; text-transform:uppercase; letter-spacing:2px;">
                                🏪 Agradecimiento a Expositores & Tiendas
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:35px 30px;">
                            <h2 style="color:#ffffff; font-size:22px; margin-top:0;">
                                ¡Muchas gracias por una jornada inolvidable, ${leadName}! 🙌
                            </h2>
                            <p style="font-size:15px; line-height:1.7; color:#d1d1d6;">
                                Queremos expresar nuestro más sincero agradecimiento a ti y a todo el equipo de <strong style="color:#00b0ff;">"${brandName}"</strong> por haber formado parte de <strong>TemuGeek Expo 2026</strong>. Fue una jornada increíble llena de energía, gran afluencia de público y pasión geek, nada de lo cual habría sido posible sin el compromiso, la calidad de sus productos y la confianza que depositaron en nuestra organización.
                            </p>
                            <p style="font-size:15px; line-height:1.7; color:#d1d1d6;">
                                Para nosotros, la experiencia de nuestros expositores, ilustradores y tiendas es el pilar fundamental para seguir creciendo. Por eso, nos gustaría conocer tu opinión sincera sobre la logística, el flujo de público y la organización.
                            </p>
                            
                            <!-- CALL TO ACTION BUTTON -->
                            <div style="text-align:center; margin:35px 0;">
                                <a href="${surveyUrl}" target="_blank" style="background:linear-gradient(135deg, #00b0ff 0%, #0077b6 100%); color:#ffffff; text-decoration:none; padding:16px 32px; border-radius:12px; font-weight:bold; font-size:16px; display:inline-block; box-shadow:0 8px 20px rgba(0, 176, 255, 0.4);">
                                    📋 Responder Encuesta de Expositores (3 min)
                                </a>
                            </div>

                            <p style="font-size:14px; line-height:1.6; color:#8e95a5; background:#141519; border:1px solid #2a2d3d; border-radius:10px; padding:16px;">
                                💡 <strong>Tu feedback cuenta:</strong> Usaremos tus comentarios para definir mejoras en logística, difusión y espacios para la próxima edición <strong>TemuGeek 2027</strong>, donde contarás con prioridad de reserva.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="background-color:#141519; padding:20px; border-top:1px solid #2a2d3d; font-size:12px; color:#8e95a5;">
                            Con enorme gratitud, <strong>Equipo de Producción TemuGeek Expo</strong><br>
                            hola@temugeek.cl • Temuco, Chile
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

function generateCosplaySurveyEmailHTML(lead) {
    const leadName = escapeEmailHtml(lead.nombre_completo || lead.nombre_contacto || 'Cosplayer');
    const characterName = escapeEmailHtml(lead.personaje ? `con tu interpretación de "${lead.personaje}"` : 'con tu increíble cosplay');
    const surveyUrl = 'https://www.temugeek.cl/encuesta-cosplay/index.html';

    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <title>¡Gracias por llenar de magia y arte TemuGeek Expo 2026!</title>
</head>
<body style="margin:0; padding:0; background-color:#0f1015; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color:#d1d1d6;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#0f1015; padding:30px 10px;">
        <tr>
            <td align="center">
                <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color:#161822; border:1px solid #2a2d3d; border-radius:16px; overflow:hidden;">
                    <tr>
                        <td align="center" style="background-color:#141519; padding:30px; border-bottom:2px solid #e92652;">
                            <h1 style="color:#ffffff; margin:0; font-size:26px; letter-spacing:1px;">TEMUGEEK EXPO 2026</h1>
                            <div style="color:#e92652; font-size:13px; font-weight:bold; margin-top:5px; text-transform:uppercase; letter-spacing:2px;">
                                🎭 Agradecimiento Especial Comunidad Cosplay
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:35px 30px;">
                            <h2 style="color:#ffffff; font-size:22px; margin-top:0;">
                                ¡Eres increíble, ${leadName}! ✨🎭
                            </h2>
                            <p style="font-size:15px; line-height:1.7; color:#d1d1d6;">
                                Todo el equipo de producción de <strong>TemuGeek Expo 2026</strong> quiere hacerte llegar un enorme y sentido agradecimiento por llenar de arte, color, pasión y vida cada rincón de nuestro evento ${characterName}. Ver tu talento y dedicación en el escenario y en el recinto fue verdaderamente espectacular.
                            </p>
                            <p style="font-size:15px; line-height:1.7; color:#d1d1d6;">
                                Valoramos inmensamente la confianza que depositaste en nuestra organización y en el concurso de Cosplay. Para nosotros, la comunidad cosplayer es el corazón latente de la convención, y nuestro compromiso es ofrecerte siempre camerinos, logística y juzgamiento de primer nivel.
                            </p>
                            
                            <!-- CALL TO ACTION BUTTON -->
                            <div style="text-align:center; margin:35px 0;">
                                <a href="${surveyUrl}" target="_blank" style="background:linear-gradient(135deg, #e92652 0%, #c2183f 100%); color:#ffffff; text-decoration:none; padding:16px 32px; border-radius:12px; font-weight:bold; font-size:16px; display:inline-block; box-shadow:0 8px 20px rgba(233, 38, 82, 0.4);">
                                    🎭 Responder Encuesta Cosplay (100% Anónima)
                                </a>
                            </div>

                            <p style="font-size:14px; line-height:1.6; color:#8e95a5; background:#141519; border:1px solid #2a2d3d; border-radius:10px; padding:16px;">
                                🔒 <strong>100% Anónima & Confidencial:</strong> Esta encuesta no solicitará tu nombre ni datos personales. Queremos tu evaluación franca sobre camerinos, tiempos y juzgamiento para perfeccionar nuestras bases en <strong>TemuGeek 2027</strong>.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="background-color:#141519; padding:20px; border-top:1px solid #2a2d3d; font-size:12px; color:#8e95a5;">
                            Con profunda admiración y gratitud, <strong>Equipo de Producción TemuGeek Expo</strong><br>
                            hola@temugeek.cl • Temuco, Chile
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

async function sendExhibitorSurveyEmail(lead) {
    if (!lead || !lead.email) return { success: false, error: 'Sin email' };
    const html = generateExhibitorSurveyEmailHTML(lead);
    const subject = `¡Gracias por ser parte de TemuGeek Expo 2026! 🏬 Tu feedback nos ayuda a mejorar`;
    return await sendResendEmail({ to: lead.email, subject, html });
}

async function sendCosplaySurveyEmail(lead) {
    if (!lead || !lead.email) return { success: false, error: 'Sin email' };
    const html = generateCosplaySurveyEmailHTML(lead);
    const subject = `¡Gracias por llenar de magia TemuGeek Expo 2026! 🎭 Encuesta de Satisfacción Cosplay`;
    return await sendResendEmail({ to: lead.email, subject, html });
}

// -------------------------------------------------------------
// 4. PLANTILLA DE CORREO DE FELICITACIONES AL GANADOR DE COSPLAY
// -------------------------------------------------------------

function generateCosplayWinnerEmailHTML(winner) {
    const nombre = escapeEmailHtml(winner.nombre || winner.nombre_completo || 'Yenifer Liset Valdivia Mora');
    const personaje = escapeEmailHtml(winner.personaje || 'Alice');
    const lugar = escapeEmailHtml(winner.lugar || winner.categoria || '3er Lugar');
    const email = escapeEmailHtml(winner.email || 'y.chan2515@gmail.com');
    const telefono = escapeEmailHtml(winner.telefono || '+56 9 3906 7878');

    let badgeIcon = '🥉';
    let borderColor = '#cd7f32';
    if (lugar.toLowerCase().includes('1') || lugar.toLowerCase().includes('primer')) {
        badgeIcon = '🏆';
        borderColor = '#ffe62e';
    } else if (lugar.toLowerCase().includes('2') || lugar.toLowerCase().includes('segundo')) {
        badgeIcon = '🥈';
        borderColor = '#cbd5e1';
    }

    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${badgeIcon} ¡${lugar} Concurso Cosplay! — TemuGeek</title>
</head>
<body style="margin:0; padding:0; background-color:#0b0c10; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color:#e2e8f0; -webkit-font-smoothing:antialiased;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#0b0c10; padding:30px 10px; width:100%;">
        <tr>
            <td align="center">
                <table width="600" border="0" cellspacing="0" cellpadding="0" style="max-width:600px; width:100%; background-color:#121522; border:2px solid ${borderColor}; border-radius:20px; overflow:hidden; box-shadow:0 0 35px rgba(205,127,50,0.25);">
                    <tr>
                        <td align="center" style="background:linear-gradient(180deg, #1c2033 0%, #121522 100%); padding:32px 25px 22px 25px; border-bottom:3px solid #e92652; text-align:center;">
                            <div style="background-color:#e92652; color:#ffffff; font-size:11px; font-weight:800; padding:5px 16px; border-radius:20px; display:inline-block; text-transform:uppercase; letter-spacing:2px; margin-bottom:10px;">
                                ${badgeIcon} CONCURSO COSPLAY 2026
                            </div>
                            <h1 style="color:#ffffff; margin:6px 0 0 0; font-size:28px; font-weight:900; letter-spacing:2px; text-transform:uppercase;">
                                TEMUGEEK
                            </h1>
                            <div style="color:#ffe62e; font-size:13px; font-weight:bold; margin-top:5px; text-transform:uppercase; letter-spacing:2px;">
                                Recinto SOFO • Temuco, Chile
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="background:radial-gradient(circle at center, rgba(205,127,50,0.18) 0%, rgba(18,21,34,0) 70%); padding:30px 25px 15px 25px; text-align:center;">
                            <div style="font-size:56px; line-height:1; margin-bottom:12px;">
                                ${badgeIcon}
                            </div>
                            <h2 style="color:${borderColor}; margin:0 0 8px 0; font-size:24px; font-weight:800; text-transform:uppercase; letter-spacing:1px;">
                                ¡FELICITACIONES POR EL ${lugar.toUpperCase()}!
                            </h2>
                            <p style="color:#cbd5e1; font-size:14.5px; margin:0; line-height:1.5;">
                                Reconocimiento oficial en el Concurso de Cosplay TemuGeek 2026.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:15px 30px 30px 30px;">
                            <p style="font-size:16px; line-height:1.6; color:#ffffff; margin-top:0;">
                                ¡Hola, <strong>${nombre}</strong>! 👋✨
                            </p>
                            <p style="font-size:14.5px; line-height:1.65; color:#cbd5e1;">
                                De parte de todo el equipo organizador y jurado evaluador de <strong>TemuGeek</strong>, queremos felicitarte sinceramente por haber obtenido el <strong style="color:${borderColor};">${lugar}</strong> en nuestro Concurso Oficial de Cosplay con tu increíble interpretación de <strong style="color:#e92652;">"${personaje}"</strong>.
                            </p>
                            <div style="background-color:#161a2b; border:1px solid ${borderColor}; border-radius:14px; padding:20px; margin:22px 0;">
                                <div style="text-align:center; border-bottom:1px solid rgba(205,127,50,0.25); padding-bottom:10px; margin-bottom:14px;">
                                    <span style="color:${borderColor}; font-size:12px; font-weight:800; text-transform:uppercase; letter-spacing:1.5px;">
                                        📋 FICHA OFICIAL DEL GANADOR
                                    </span>
                                </div>
                                <table width="100%" border="0" cellspacing="0" cellpadding="6" style="font-size:14px; color:#cbd5e1;">
                                    <tr>
                                        <td width="35%" style="color:#94a3b8; font-weight:600;">${badgeIcon} Lugar:</td>
                                        <td style="color:${borderColor}; font-weight:bold; font-size:16px;">${lugar}</td>
                                    </tr>
                                    <tr>
                                        <td style="color:#94a3b8; font-weight:600;">👤 Cosplayer:</td>
                                        <td style="color:#ffffff; font-weight:bold;">${nombre}</td>
                                    </tr>
                                    <tr>
                                        <td style="color:#94a3b8; font-weight:600;">🎭 Personaje:</td>
                                        <td style="color:#e92652; font-weight:bold; font-size:15px;">${personaje}</td>
                                    </tr>
                                    <tr>
                                        <td style="color:#94a3b8; font-weight:600;">✉️ Correo:</td>
                                        <td style="color:#ffffff;">${email}</td>
                                    </tr>
                                    <tr>
                                        <td style="color:#94a3b8; font-weight:600;">📱 Teléfono:</td>
                                        <td style="color:#00d264; font-weight:bold;">${telefono}</td>
                                    </tr>
                                </table>
                            </div>
                            <div style="background-color:#1a1e2e; border:1px solid #2a2d3d; border-radius:12px; padding:18px; margin-bottom:24px;">
                                <h4 style="color:#ffe62e; font-size:15px; margin:0 0 10px 0; text-transform:uppercase; letter-spacing:1px;">
                                    📌 Entrega y Coordinación del Premio
                                </h4>
                                <p style="font-size:14px; color:#cbd5e1; line-height:1.6; margin:0;">
                                    Para la entrega del premio monetario o certificado de premiación, por favor responde directamente a este correo confirmando tus datos de cuenta bancaria (RUT, Banco y Número de Cuenta) o contáctanos por WhatsApp al <strong style="color:#00d264;">+56 9 8430 5751</strong>.
                                </p>
                            </div>
                            <div style="text-align:center; margin:25px 0 10px 0;">
                                <a href="https://wa.me/56984305751?text=Hola,%20soy%20${encodeURIComponent(nombre)}%20(Ganador%20Cosplay%20${encodeURIComponent(personaje)})" target="_blank" style="background:linear-gradient(135deg, #00d264 0%, #00a850 100%); color:#ffffff; font-weight:bold; text-decoration:none; padding:14px 28px; border-radius:28px; display:inline-block; font-size:15px; box-shadow:0 4px 15px rgba(0,210,100,0.3);">
                                    💬 Contactar a Producción por WhatsApp
                                </a>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="background-color:#161926; padding:20px 25px; border-top:1px solid #2a2d3d; font-size:12px; color:#8e95a5; text-align:center;">
                            <strong style="color:#ffffff;">TemuGeek</strong> • Recinto SOFO, Temuco<br>
                            Consultas: <a href="mailto:hola@temugeek.cl" style="color:#e92652; text-decoration:none;">hola@temugeek.cl</a>
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

async function sendCosplayWinnerEmail(winner) {
    if (!winner || !winner.email) return { success: false, error: 'Falta el correo electrónico del ganador' };
    const html = generateCosplayWinnerEmailHTML(winner);
    const lugar = winner.lugar || winner.categoria || '3er Lugar';
    const subject = `🥉 ¡FELICITACIONES! ${lugar} Concurso Cosplay TemuGeek — ${winner.personaje || 'Alice'}`;
    return await sendResendEmail({ to: winner.email, subject, html });
}

// Exportar funciones globalmente en window
window.generateApplicantEmailHTML = generateApplicantEmailHTML;
window.generateAdminEmailHTML = generateAdminEmailHTML;
window.generateCosplayApplicantEmailHTML = generateCosplayApplicantEmailHTML;
window.generateCosplayAdminEmailHTML = generateCosplayAdminEmailHTML;
window.generateCosplayApprovalEmailHTML = generateCosplayApprovalEmailHTML;
window.generateRejectionEmailHTML = generateRejectionEmailHTML;
window.generateCosplayStatusEmailHTML = generateCosplayStatusEmailHTML;
window.generateApprovalEmailHTML = generateApprovalEmailHTML;
window.generateExhibitorSurveyEmailHTML = generateExhibitorSurveyEmailHTML;
window.generateCosplaySurveyEmailHTML = generateCosplaySurveyEmailHTML;
window.generateCosplayWinnerEmailHTML = generateCosplayWinnerEmailHTML;
window.sendApprovalEmail = sendApprovalEmail;
window.sendRejectionEmail = sendRejectionEmail;
window.sendPostulacionEmails = sendPostulacionEmails;
window.sendCosplayPostulacionEmails = sendCosplayPostulacionEmails;
window.sendCosplayStatusUpdateEmail = sendCosplayStatusUpdateEmail;
window.sendExhibitorSurveyEmail = sendExhibitorSurveyEmail;
window.sendCosplaySurveyEmail = sendCosplaySurveyEmail;
window.sendCosplayWinnerEmail = sendCosplayWinnerEmail;




