/**
 * Cloudflare Pages Function: POST /api/contact
 *
 * Sends the contact form to info@burntoutgames.com through Resend. Runs on
 * Cloudflare's edge, so no third-party script is embedded in the page and the
 * mail sends from your own verified domain.
 *
 * Required environment variables (Pages project → Settings → Variables):
 *   RESEND_API_KEY   secret, from resend.com
 *   CONTACT_TO       where mail lands, e.g. info@burntoutgames.com
 *   CONTACT_FROM     a verified sender, e.g. "BOG Site <site@burntoutgames.com>"
 */

const MAX = { name: 120, email: 200, topic: 60, message: 4000 };

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });

const clean = (v, limit) => String(v ?? '').trim().slice(0, limit);

export async function onRequestPost({ request, env }) {
  let data;
  try {
    const type = request.headers.get('content-type') || '';
    if (type.includes('application/json')) {
      data = await request.json();
    } else {
      data = Object.fromEntries(await request.formData());
    }
  } catch {
    return json(400, { ok: false, error: 'Could not read that form.' });
  }

  // Honeypot: a real person never fills a field they cannot see.
  if (clean(data.company, 50)) return json(200, { ok: true });

  const name = clean(data.name, MAX.name);
  const email = clean(data.email, MAX.email);
  const topic = clean(data.topic, MAX.topic) || 'Just saying hi';
  const message = clean(data.message, MAX.message);

  if (!name || !email || !message) {
    return json(400, { ok: false, error: 'Name, email and message are all needed.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return json(400, { ok: false, error: "That email address doesn't look right." });
  }

  if (!env.RESEND_API_KEY || !env.CONTACT_TO || !env.CONTACT_FROM) {
    return json(500, { ok: false, error: 'The form is not configured yet.' });
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${env.RESEND_API_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      from: env.CONTACT_FROM,
      to: [env.CONTACT_TO],
      reply_to: email,
      subject: `[${topic}] ${name}`,
      text: `From: ${name} <${email}>\nTopic: ${topic}\n\n${message}\n`,
    }),
  });

  if (!res.ok) {
    return json(502, { ok: false, error: 'Sending failed. Email us directly and we will get it.' });
  }
  return json(200, { ok: true });
}

/** Anything other than POST gets a clear answer rather than a stack trace. */
export const onRequestGet = () => json(405, { ok: false, error: 'POST only.' });
