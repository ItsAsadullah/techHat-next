import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { apiKey, fromEmail, storeName } = await req.json();

    if (!apiKey || !fromEmail) {
      return NextResponse.json({ success: false, error: 'API key and sender email are required' }, { status: 400 });
    }

    // Send a simple test email via Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: `${storeName || 'TechHat'} <${fromEmail}>`,
        to: [fromEmail], // Send to the sender address as a confirmation
        subject: `✅ Email Integration Test — ${storeName || 'TechHat'}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;">
            <div style="background:#1e3a5f;padding:20px;border-radius:12px;text-align:center;margin-bottom:24px;">
              <h1 style="color:white;margin:0;font-size:22px;">${storeName || 'TechHat'}</h1>
            </div>
            <h2 style="color:#111;margin-bottom:8px;">Email integration is working! 🎉</h2>
            <p style="color:#555;font-size:14px;">
              Your Resend API key is configured correctly.
              Order confirmation emails, shipping updates, and other notifications will now be sent to your customers automatically.
            </p>
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin-top:20px;">
              <p style="color:#166534;font-size:13px;margin:0;">
                ✅ Sent from: <strong>${fromEmail}</strong><br/>
                ✅ Store name: <strong>${storeName || 'TechHat'}</strong>
              </p>
            </div>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      let message = 'Resend API error';
      try {
        const errJson = JSON.parse(err);
        message = errJson.message || errJson.error || message;
      } catch { /* ignore */ }
      return NextResponse.json({ success: false, error: message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('test-email error:', err);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
