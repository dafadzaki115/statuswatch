// ============================================
// Service: Email Notification (Resend - Tahap 14 P2)
// ============================================

const RESEND_API_URL = 'https://api.resend.com/emails';

// Cache in-memory untuk membatasi notifikasi SSL maks 1x per monitor per 24 jam
const sslAlertCooldown = new Map<string, number>();

export interface EmailSendResult {
  sent: boolean;
  reason?: string;
  id?: string;
}

/**
 * Mengirim email notifikasi via Resend REST API:
 * - Jika RESEND_API_KEY tidak dikonfigurasi, dilewati diam-diam tanpa error (PRD FR-12).
 * - Desain template HTML responsif dengan branding StatusWatch.
 */
export async function sendEmailNotification(
  to: string,
  subject: string,
  htmlContent: string
): Promise<EmailSendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    return { sent: false, reason: 'RESEND_API_KEY_NOT_CONFIGURED' };
  }

  const from = process.env.EMAIL_FROM || 'StatusWatch <onboarding@resend.dev>';

  try {
    const res = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        html: htmlContent,
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.warn(`[StatusWatch Email] Resend API error (${res.status}):`, errText);
      return { sent: false, reason: `HTTP_${res.status}` };
    }

    const data = (await res.json().catch(() => ({}))) as { id?: string };
    return { sent: true, id: data.id };
  } catch (err: unknown) {
    console.warn('[StatusWatch Email] Failed to send email (non-fatal):', err);
    return { sent: false, reason: err instanceof Error ? err.message : 'NETWORK_ERROR' };
  }
}

/**
 * Mengirim notifikasi email saat monitor mengalami gangguan (Down).
 */
export async function sendMonitorDownAlert(
  to: string,
  monitorName: string,
  monitorUrl: string,
  lastError: string | null
): Promise<EmailSendResult> {
  const subject = `[GANGGUAN] Layanan ${monitorName} Tidak Dapat Diakses`;
  const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; padding: 24px; color: #1e293b;">
        <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          <div style="display: inline-block; background-color: #fef2f2; border: 1px solid #fee2e2; border-radius: 8px; padding: 6px 12px; font-size: 12px; font-weight: bold; color: #dc2626; margin-bottom: 16px;">
            GANGGUAN TERDETEKSI
          </div>
          <h2 style="font-size: 20px; font-weight: bold; margin-top: 0; color: #0f172a;">Layanan ${monitorName} Mengalami Gangguan</h2>
          <p style="font-size: 14px; line-height: 1.6; color: #475569;">
            Pengecekan berkala StatusWatch mendeteksi bahwa situs web/API target tidak merespons sesuai ekspektasi sebanyak 2 kali berturut-turut.
          </p>
          <div style="background-color: #f1f5f9; border-radius: 12px; padding: 16px; margin: 20px 0; font-size: 13px;">
            <p style="margin: 4px 0;"><strong>Target URL:</strong> <a href="${monitorUrl}" style="color: #059669; text-decoration: none;">${monitorUrl}</a></p>
            <p style="margin: 4px 0;"><strong>Penyebab/Error:</strong> <span style="font-family: monospace; color: #dc2626;">${lastError || 'TIMEOUT'}</span></p>
            <p style="margin: 4px 0;"><strong>Waktu Deteksi:</strong> ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB</p>
          </div>
          <p style="font-size: 13px; color: #64748b;">
            Insiden telah dibuka secara otomatis pada sistem pemantauan Anda. Kami akan mengirimkan notifikasi lanjutan saat layanan telah pulih kembali.
          </p>
          <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
          <p style="font-size: 11px; color: #94a3b8; text-align: center;">
            Dikirim otomatis oleh StatusWatch Uptime Monitor.
          </p>
        </div>
      </body>
    </html>
  `;

  return sendEmailNotification(to, subject, html);
}

/**
 * Mengirim notifikasi email saat monitor pulih (Up).
 */
export async function sendMonitorRecoveredAlert(
  to: string,
  monitorName: string,
  monitorUrl: string,
  durationText?: string
): Promise<EmailSendResult> {
  const subject = `[PULIH] Layanan ${monitorName} Telah Kembali Normal`;
  const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; padding: 24px; color: #1e293b;">
        <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          <div style="display: inline-block; background-color: #ecfdf5; border: 1px solid #d1fae5; border-radius: 8px; padding: 6px 12px; font-size: 12px; font-weight: bold; color: #059669; margin-bottom: 16px;">
            LAYANAN PULIH (RESOLVED)
          </div>
          <h2 style="font-size: 20px; font-weight: bold; margin-top: 0; color: #0f172a;">Layanan ${monitorName} Beroperasi Kembali</h2>
          <p style="font-size: 14px; line-height: 1.6; color: #475569;">
            Kabar baik! Pengecekan terbaru StatusWatch menunjukkan bahwa target telah merespons dengan status normal dan berhasil diakses kembali.
          </p>
          <div style="background-color: #f1f5f9; border-radius: 12px; padding: 16px; margin: 20px 0; font-size: 13px;">
            <p style="margin: 4px 0;"><strong>Target URL:</strong> <a href="${monitorUrl}" style="color: #059669; text-decoration: none;">${monitorUrl}</a></p>
            <p style="margin: 4px 0;"><strong>Durasi Gangguan:</strong> <strong>${durationText || '-'}</strong></p>
            <p style="margin: 4px 0;"><strong>Waktu Pemulihan:</strong> ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB</p>
          </div>
          <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
          <p style="font-size: 11px; color: #94a3b8; text-align: center;">
            Dikirim otomatis oleh StatusWatch Uptime Monitor.
          </p>
        </div>
      </body>
    </html>
  `;

  return sendEmailNotification(to, subject, html);
}

/**
 * Mengirim notifikasi email saat masa berlaku sertifikat SSL mendekati batas (< 14 hari).
 * Dibatasi maksimal 1x kirim per monitor per 24 jam (PRD FR-12).
 */
export async function sendSslExpiryAlert(
  to: string,
  monitorId: string,
  monitorName: string,
  monitorUrl: string,
  daysRemaining: number
): Promise<EmailSendResult> {
  const now = Date.now();
  const lastSent = sslAlertCooldown.get(monitorId);

  // Jika sudah pernah dikirim dalam 24 jam terakhir, lewati
  if (lastSent && now - lastSent < 24 * 60 * 60 * 1000) {
    return { sent: false, reason: 'SSL_ALERT_COOLDOWN' };
  }

  const subject = `[PERINGATAN SSL] Sertifikat ${monitorName} Kedaluwarsa dalam ${daysRemaining} Hari`;
  const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; padding: 24px; color: #1e293b;">
        <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          <div style="display: inline-block; background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; padding: 6px 12px; font-size: 12px; font-weight: bold; color: #d97706; margin-bottom: 16px;">
            PERINGATAN SSL SEGERA HABIS
          </div>
          <h2 style="font-size: 20px; font-weight: bold; margin-top: 0; color: #0f172a;">Sertifikat SSL ${monitorName} Segera Habis</h2>
          <p style="font-size: 14px; line-height: 1.6; color: #475569;">
            Sertifikat SSL/TLS untuk situs web Anda akan kedaluwarsa dalam <strong>${daysRemaining} hari</strong>. Segera lakukan perpanjangan sertifikat untuk mencegah browser memblokir akses pengunjung.
          </p>
          <div style="background-color: #f1f5f9; border-radius: 12px; padding: 16px; margin: 20px 0; font-size: 13px;">
            <p style="margin: 4px 0;"><strong>Target URL:</strong> <a href="${monitorUrl}" style="color: #059669; text-decoration: none;">${monitorUrl}</a></p>
            <p style="margin: 4px 0;"><strong>Sisa Waktu:</strong> <span style="color: #d97706; font-weight: bold;">${daysRemaining} hari</span></p>
          </div>
          <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
          <p style="font-size: 11px; color: #94a3b8; text-align: center;">
            Dikirim otomatis oleh StatusWatch Uptime Monitor.
          </p>
        </div>
      </body>
    </html>
  `;

  const result = await sendEmailNotification(to, subject, html);
  if (result.sent) {
    sslAlertCooldown.set(monitorId, now);
  }
  return result;
}
