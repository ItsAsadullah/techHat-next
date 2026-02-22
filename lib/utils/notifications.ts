/**
 * Notification system — triggered on order lifecycle events.
 * API keys are read from the DB settings (Admin → Settings → Notifications → Email & SMS Setup).
 * Falls back to environment variables if not set in DB.
 *
 * This module is called server-side only (never import in client components).
 */

import { getSetting } from '@/lib/actions/settings-actions';

/** Load a setting from DB; fallback to env var; fallback to hardcoded default */
async function cfg(dbKey: string, envVar: string, fallback = ''): Promise<string> {
  const fromDb = await getSetting(`integration_${dbKey}`);
  if (fromDb && fromDb.trim()) return fromDb.trim();
  return process.env[envVar] ?? fallback;
}

export type NotificationTrigger =
  | 'ORDER_CREATED'
  | 'PAYMENT_CONFIRMED'
  | 'ORDER_CONFIRMED'
  | 'ORDER_PROCESSING'
  | 'ORDER_PACKED'
  | 'ORDER_SHIPPED'
  | 'ORDER_OUT_FOR_DELIVERY'
  | 'ORDER_DELIVERED'
  | 'ORDER_CANCELLED'
  | 'REFUND_REQUESTED'
  | 'ORDER_REFUNDED';

export interface OrderNotificationPayload {
  trigger: NotificationTrigger;
  orderNumber: string;
  trackingToken?: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  grandTotal: number;
  paymentMethod?: string;
  estimatedDelivery?: Date;
  cancelReason?: string;
  refundAmount?: number;
  storeName?: string;
}

// These are loaded per-call from DB → env fallback (see cfg() above)

// ─── EMAIL ────────────────────────────────────────────────────────────────────

function buildEmailSubject(payload: OrderNotificationPayload): string {
  const subjects: Record<NotificationTrigger, string> = {
    ORDER_CREATED:           `✅ Order Confirmed — ${payload.orderNumber}`,
    PAYMENT_CONFIRMED:       `💳 Payment Received — ${payload.orderNumber}`,
    ORDER_CONFIRMED:         `📦 Order Confirmed — ${payload.orderNumber}`,
    ORDER_PROCESSING:        `⚙️ Order Being Processed — ${payload.orderNumber}`,
    ORDER_PACKED:            `📫 Order Packed — ${payload.orderNumber}`,
    ORDER_SHIPPED:           `🚚 Your Order Has Shipped — ${payload.orderNumber}`,
    ORDER_OUT_FOR_DELIVERY:  `🛵 Out for Delivery — ${payload.orderNumber}`,
    ORDER_DELIVERED:         `🎉 Order Delivered — ${payload.orderNumber}`,
    ORDER_CANCELLED:         `❌ Order Cancelled — ${payload.orderNumber}`,
    REFUND_REQUESTED:        `🔄 Refund Requested — ${payload.orderNumber}`,
    ORDER_REFUNDED:          `💸 Refund Processed — ${payload.orderNumber}`,
  };
  return subjects[payload.trigger] ?? `Order Update — ${payload.orderNumber}`;
}

function buildEmailBody(payload: OrderNotificationPayload, storeName: string, _storeEmail: string, baseUrl: string): string {
  const trackingUrl = payload.trackingToken
    ? `${baseUrl}/track/${payload.trackingToken}`
    : `${baseUrl}/track-order`;

  const deliveryNote = payload.estimatedDelivery
    ? `<p>Estimated delivery: <strong>${new Date(payload.estimatedDelivery).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong></p>`
    : '';

  const messages: Record<NotificationTrigger, string> = {
    ORDER_CREATED: `
      <p>Thank you for your order, <strong>${payload.customerName}</strong>!</p>
      <p>Your order <strong>${payload.orderNumber}</strong> has been received and is being reviewed.</p>
      <p><strong>Total: ৳${payload.grandTotal.toLocaleString()}</strong></p>
      ${deliveryNote}
      <p><a href="${trackingUrl}" style="background:#2563EB;color:white;padding:10px 24px;border-radius:6px;text-decoration:none;">Track Your Order</a></p>
    `,
    PAYMENT_CONFIRMED: `<p>Your payment of <strong>৳${payload.grandTotal.toLocaleString()}</strong> for order <strong>${payload.orderNumber}</strong> has been confirmed.</p><p><a href="${trackingUrl}">Track Order</a></p>`,
    ORDER_CONFIRMED: `<p>Great news! Your order <strong>${payload.orderNumber}</strong> has been confirmed. We will begin processing it shortly.</p>${deliveryNote}<p><a href="${trackingUrl}">Track Order</a></p>`,
    ORDER_PROCESSING: `<p>Your order <strong>${payload.orderNumber}</strong> is currently being processed by our team.</p><p><a href="${trackingUrl}">Track Order</a></p>`,
    ORDER_PACKED: `<p>Your order <strong>${payload.orderNumber}</strong> has been packed and is ready for shipping!</p><p><a href="${trackingUrl}">Track Order</a></p>`,
    ORDER_SHIPPED: `<p>Your order <strong>${payload.orderNumber}</strong> has been shipped! It is on its way to you.</p>${deliveryNote}<p><a href="${trackingUrl}">Track Shipment</a></p>`,
    ORDER_OUT_FOR_DELIVERY: `<p>Your order <strong>${payload.orderNumber}</strong> is out for delivery today! Please be available to receive it.</p><p><a href="${trackingUrl}">Track Order</a></p>`,
    ORDER_DELIVERED: `<p>Your order <strong>${payload.orderNumber}</strong> has been delivered! We hope you love your purchase.</p><p>If you have any issues, please contact us.</p>`,
    ORDER_CANCELLED: `<p>Your order <strong>${payload.orderNumber}</strong> has been cancelled.${payload.cancelReason ? ` Reason: ${payload.cancelReason}` : ''}</p><p>If you have any questions, please contact our support team.</p>`,
    REFUND_REQUESTED: `<p>Your refund request for order <strong>${payload.orderNumber}</strong> has been received. Our team will review it within 2–3 business days.</p>`,
    ORDER_REFUNDED: `<p>Your refund of <strong>৳${(payload.refundAmount ?? payload.grandTotal).toLocaleString()}</strong> for order <strong>${payload.orderNumber}</strong> has been processed. It may take 3–7 business days to reflect in your account.</p>`,
  };

  const body = messages[payload.trigger] ?? `<p>Your order <strong>${payload.orderNumber}</strong> has been updated.</p>`;

  return `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <div style="background: #1e3a5f; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">${storeName}</h1>
      </div>
      <div style="padding: 24px;">
        ${body}
        <hr style="border: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #999; font-size: 12px;">
          This email was sent by ${storeName}. Please do not reply to this email.
        </p>
      </div>
    </body>
    </html>
  `;
}

async function sendEmail(
  to: string, subject: string, html: string,
  apiKey: string, storeName: string, storeEmail: string
): Promise<void> {
  if (!apiKey) { console.warn('Resend API key not configured — email not sent'); return; }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ from: `${storeName} <${storeEmail}>`, to: [to], subject, html }),
    });
    if (!res.ok) { const err = await res.text(); console.error('Resend email failed:', err); }
  } catch (err) { console.error('sendEmail error:', err); }
}

// ─── SMS ─────────────────────────────────────────────────────────────────────

function buildSmsText(payload: OrderNotificationPayload, storeName: string, baseUrl: string): string {
  const smsTexts: Partial<Record<NotificationTrigger, string>> = {
    ORDER_CREATED:           `${storeName}: Your order ${payload.orderNumber} is confirmed! Total: ৳${payload.grandTotal.toLocaleString()}. Track: ${baseUrl}/track/${payload.trackingToken}`,
    ORDER_SHIPPED:           `${storeName}: Order ${payload.orderNumber} has been shipped! Track: ${baseUrl}/track/${payload.trackingToken}`,
    ORDER_OUT_FOR_DELIVERY:  `${storeName}: Order ${payload.orderNumber} is out for delivery today!`,
    ORDER_DELIVERED:         `${storeName}: Order ${payload.orderNumber} delivered! Thank you for shopping with us.`,
    ORDER_CANCELLED:         `${storeName}: Order ${payload.orderNumber} has been cancelled. Contact us if you have questions.`,
    ORDER_REFUNDED:          `${storeName}: Refund of ৳${(payload.refundAmount ?? payload.grandTotal).toLocaleString()} for order ${payload.orderNumber} has been processed.`,
  };
  return smsTexts[payload.trigger] ?? `${storeName}: Your order ${payload.orderNumber} has been updated.`;
}

async function sendSms(phone: string, text: string, apiKey: string, smsUrl: string): Promise<void> {
  if (!apiKey || !smsUrl) { console.warn('SMS API key/URL not configured — SMS not sent'); return; }
  try {
    await fetch(smsUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ to: phone, message: text }),
    });
  } catch (err) { console.error('sendSms error:', err); }
}

// ─── MAIN TRIGGER ─────────────────────────────────────────────────────────────

/**
 * Trigger notifications for an order event.
 * Call this server-side after order creation or status changes.
 * Never awaited from critical path — fire and forget with error handling.
 */
export async function triggerOrderNotification(payload: OrderNotificationPayload): Promise<void> {
  // Load all config from DB (falls back to env vars)
  const [storeName, storeEmail, baseUrl, resendKey, smsKey, smsUrl] = await Promise.all([
    cfg('store_name',    'STORE_NAME',            'TechHat'),
    cfg('store_email',   'STORE_EMAIL',           'noreply@techhat.com.bd'),
    cfg('app_url',       'NEXT_PUBLIC_APP_URL',   'https://techhat.com.bd'),
    cfg('resend_api_key','RESEND_API_KEY',         ''),
    cfg('sms_api_key',   'SMS_API_KEY',            ''),
    cfg('sms_api_url',   'SMS_API_URL',            ''),
  ]);

  const promises: Promise<void>[] = [];

  // Email notification
  if (payload.customerEmail) {
    const subject = buildEmailSubject(payload);
    const html = buildEmailBody(payload, storeName, storeEmail, baseUrl);
    promises.push(sendEmail(payload.customerEmail, subject, html, resendKey, storeName, storeEmail));
  }

  // SMS notification (for key lifecycle events only)
  const smsEvents: NotificationTrigger[] = [
    'ORDER_CREATED', 'ORDER_SHIPPED', 'ORDER_OUT_FOR_DELIVERY',
    'ORDER_DELIVERED', 'ORDER_CANCELLED', 'ORDER_REFUNDED',
  ];
  if (payload.customerPhone && smsEvents.includes(payload.trigger)) {
    const smsText = buildSmsText(payload, storeName, baseUrl);
    promises.push(sendSms(payload.customerPhone, smsText, smsKey, smsUrl));
  }

  await Promise.allSettled(promises);
}
