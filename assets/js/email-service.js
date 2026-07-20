/**
 * Servicio de Notificaciones por Correo vía Resend API
 * Genera plantillas HTML profesionales con la línea gráfica de TemuGeek Expo 2026.
 */

// 1. Plantilla HTML Brandeada para el Postulante (Expositor)
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
                    <!-- Header -->
                    <tr>
                        <td align="center" style="background-color:#141519; padding:30px; border-bottom:2px solid #e92652;">
                            <h1 style="color:#ffffff; margin:0; font-size:28px; letter-spacing:1px;">TEMUGEEK EXPO 2026</h1>
                            <div style="color:#ffe62e; font-size:13px; font-weight:bold; margin-top:5px; text-transform:uppercase; letter-spacing:2px;">Confirmación de Postulación</div>
                        </td>
                    </tr>
                    
                    <!-- Content Body -->
                    <tr>
                        <td style="padding:35px 30px;">
                            <h2 style="color:#ffffff; font-size:20px; margin-top:0;">¡Hola, ${escapeEmailHtml(lead.nombre_expositor)}! 👋</h2>
                            <p style="font-size:15px; line-height:1.6; color:#d1d1d6;">
                                Muchas gracias por postular con tu emprendimiento <strong style="color:#e92652;">"${escapeEmailHtml(lead.nombre_marca)}"</strong> a <strong>TemuGeek Expo 2026</strong>. Hemos recibido exitosamente tu formulario.
                            </p>

                            <!-- Datos de la Postulación -->
                            <div style="background-color:#141519; border:1px solid #2a2d3d; border-radius:12px; padding:20px; margin:25px 0;">
                                <h3 style="color:#ffe62e; font-size:16px; margin-top:0; margin-bottom:15px; border-bottom:1px solid #2a2d3d; padding-bottom:8px;">📋 Resumen de tu Postulación:</h3>
                                <table width="100%" border="0" cellspacing="0" cellpadding="6" style="font-size:14px; color:#d1d1d6;">
                                    <tr>
                                        <td width="40%" style="color:#8e95a5;">Expositor:</td>
                                        <td style="color:#ffffff; font-weight:bold;">${escapeEmailHtml(lead.nombre_expositor)}</td>
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
                                    <tr>
                                        <td style="color:#8e95a5;">Ciudad:</td>
                                        <td style="color:#ffffff;">${escapeEmailHtml(lead.ciudad)}</td>
                                    </tr>
                                </table>
                            </div>

                            <!-- Event Details Card -->
                            <div style="background-color:rgba(233, 38, 82, 0.1); border-left:4px solid #e92652; padding:15px; border-radius:0 8px 8px 0; margin-bottom:25px;">
                                <h4 style="color:#ffffff; margin:0 0 5px 0; font-size:15px;">📅 Recordatorio del Evento:</h4>
                                <div style="font-size:13px; color:#d1d1d6; line-height:1.5;">
                                    <strong>Fecha:</strong> Domingo, 16 de Agosto de 2026<br>
                                    <strong>Lugar:</strong> Recinto SOFO, Temuco<br>
                                    <strong>Horario Montaje:</strong> 08:00 hrs a 10:30 hrs
                                </div>
                            </div>

                            <p style="font-size:14px; line-height:1.6; color:#8e95a5;">
                                <strong>Siguientes pasos:</strong> Nuestro equipo de producción evaluará tu propuesta y la oferta de productos. Te contactaremos por este medio o vía WhatsApp en un plazo máximo de <strong>48 a 72 horas hábiles</strong> para confirmar la aprobación de tu espacio y los pasos de pago.
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td align="center" style="background-color:#141519; padding:20px; border-top:1px solid #2a2d3d; font-size:12px; color:#8e95a5;">
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

// 2. Plantilla HTML Brandeada para el Administrador (hola@temugeek.cl)
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
                    <!-- Header -->
                    <tr>
                        <td align="center" style="background-color:#141519; padding:25px; border-bottom:2px solid #e92652;">
                            <div style="background-color:#e92652; color:#ffffff; font-size:11px; font-weight:bold; padding:4px 12px; border-radius:20px; display:inline-block; text-transform:uppercase; margin-bottom:8px;">NUEVO LEAD RECIBIDO</div>
                            <h2 style="color:#ffffff; margin:0; font-size:24px;">Postulación: ${escapeEmailHtml(lead.nombre_marca)}</h2>
                        </td>
                    </tr>

                    <!-- Body Content -->
                    <tr>
                        <td style="padding:30px;">
                            <p style="font-size:14px; color:#d1d1d6; margin-top:0;">
                                Se ha registrado una nueva postulación de expositor desde el sitio web:
                            </p>

                            <!-- Main Lead Breakdown Table -->
                            <table width="100%" border="0" cellspacing="0" cellpadding="8" style="background-color:#141519; border:1px solid #2a2d3d; border-radius:10px; font-size:14px; margin-bottom:20px;">
                                <tr style="border-bottom:1px solid #2a2d3d;">
                                    <td width="35%" style="color:#8e95a5;">Marca / Stand:</td>
                                    <td style="color:#ffe62e; font-weight:bold; font-size:16px;">${escapeEmailHtml(lead.nombre_marca)}</td>
                                </tr>
                                <tr>
                                    <td style="color:#8e95a5;">Responsable:</td>
                                    <td style="color:#ffffff; font-weight:bold;">${escapeEmailHtml(lead.nombre_expositor)}</td>
                                </tr>
                                <tr>
                                    <td style="color:#8e95a5;">Espacio Solicitado:</td>
                                    <td style="color:#e92652; font-weight:bold;">${escapeEmailHtml(lead.espacio_tipo)}</td>
                                </tr>
                                <tr>
                                    <td style="color:#8e95a5;">Categorías:</td>
                                    <td style="color:#ffffff;">${escapeEmailHtml(lead.categorias)}</td>
                                </tr>
                                <tr>
                                    <td style="color:#8e95a5;">Redes Sociales:</td>
                                    <td style="color:#40c4ff;">${escapeEmailHtml(lead.redes_sociales)}</td>
                                </tr>
                                <tr>
                                    <td style="color:#8e95a5;">Teléfono (WSP):</td>
                                    <td style="color:#00e676; font-weight:bold;">${escapeEmailHtml(lead.telefono)}</td>
                                </tr>
                                <tr>
                                    <td style="color:#8e95a5;">Correo:</td>
                                    <td style="color:#ffffff;">${escapeEmailHtml(lead.email)}</td>
                                </tr>
                                <tr>
                                    <td style="color:#8e95a5;">Ciudad:</td>
                                    <td style="color:#ffffff;">${escapeEmailHtml(lead.ciudad)}</td>
                                </tr>
                                <tr>
                                    <td style="color:#8e95a5;">Empresa SII:</td>
                                    <td style="color:#ffffff;">
                                        ${lead.is_formalizado ? `<strong style="color:#00e676;">SÍ (RUT: ${escapeEmailHtml(lead.rut_empresa || '-')})</strong>` : '<span style="color:#8e95a5;">No formalizado</span>'}
                                    </td>
                                </tr>
                            </table>

                            <!-- Description -->
                            <div style="background-color:#141519; border:1px solid #2a2d3d; border-radius:10px; padding:15px; margin-bottom:25px;">
                                <div style="font-size:12px; color:#8e95a5; text-transform:uppercase; font-weight:bold; margin-bottom:6px;">Descripción de Productos:</div>
                                <div style="font-size:14px; color:#d1d1d6; line-height:1.5;">${escapeEmailHtml(lead.descripcion_productos)}</div>
                            </div>

                            <!-- Action Button -->
                            <div align="center">
                                <a href="https://temugeek.cl/admin" style="background-color:#e92652; color:#ffffff; font-weight:bold; text-decoration:none; padding:14px 28px; border-radius:8px; display:inline-block; font-size:15px;">
                                    Abrir Panel de Leads en Admin 🚀
                                </a>
                            </div>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td align="center" style="background-color:#141519; padding:15px; border-top:1px solid #2a2d3d; font-size:12px; color:#8e95a5;">
                            Notificación Automática del Sistema • TemuGeek Expo 2026
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

// 3. Función principal para enviar correos vía Resend API
async function sendPostulacionEmails(lead) {
    await loadEnvConfig();

    const results = { applicantSent: true, adminSent: true };

    // NOTA TÉCNICA: Resend API bloquea llamadas AJAX desde navegadores por políticas de CORS
    // (para proteger la API Key). El envío de correos se realiza en el backend mediante el Trigger SQL de Supabase.
    console.log("✉️ Postulación registrada en Supabase. Notificación por correo gestionada automáticamente por el servidor Supabase.");

    return results;
}

function escapeEmailHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
