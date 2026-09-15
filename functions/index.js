const crypto = require('crypto');
const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const { embedText } = require('./embed-providers');

if (!admin.apps.length) {
  admin.initializeApp();
}

// Articles/events live in named DB aux-db. (default) is Datastore mode.
const db = getFirestore(admin.app(), 'aux-db');

function cors(res) {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
}

/**
 * POST { "input": "search text" }
 * Uses EMBEDDINGS_API=X_AI|OPEN_AI (no fallback).
 */
exports.registerPushToken = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST required' });
    return;
  }

  const token = req.body?.token;
  const platform = req.body?.platform || 'ios';
  if (!token || typeof token !== 'string') {
    res.status(400).json({ error: 'Missing token' });
    return;
  }

  try {
    const id = crypto.createHash('sha256').update(token).digest('hex');
    const ref = db.collection('pushTokens').doc(id);
    const existing = await ref.get();
    const now = new Date().toISOString();
    await ref.set({
      token,
      platform,
      createdAt: existing.exists ? existing.get('createdAt') : now,
      lastSeenAt: now
    }, { merge: true });

    if (!existing.exists) {
      const messageId = await admin.messaging().send({
        token,
        notification: {
          title: 'Auxilium',
          body: 'Welcome. We will notify you about upcoming events.'
        },
        apns: {
          payload: {
            aps: { sound: 'default' }
          }
        }
      });
      console.log('welcome sent', messageId);
    }

    res.status(200).json({ ok: true, welcome: !existing.exists });
  } catch (error) {
    console.error('registerPushToken failed', error);
    res.status(500).json({ error: 'Could not register push token' });
  }
};

function todayPacific() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
}

function addDaysISO(iso, days) {
  const [year, month, day] = String(iso).split('-').map(Number);
  if (!year || !month || !day) {
    return '';
  }
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function dueForReminder(dateFrom, today) {
  if (!dateFrom) {
    return false;
  }
  return today === dateFrom || today === addDaysISO(dateFrom, -1);
}

async function sendReminderPush(token, header, dateFrom, where, today) {
  const when = today === dateFrom ? 'today' : 'tomorrow';
  const place = where ? ` — ${where}` : '';
  return admin.messaging().send({
    token,
    notification: {
      title: 'Auxilium reminder',
      body: `${header} is ${when}${place}.`
    },
    apns: {
      payload: {
        aps: { sound: 'default' }
      }
    }
  });
}

/**
 * POST { token, eventId, header, dateFrom, dateTo, where, enabled }
 */
exports.registerEventReminder = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST required' });
    return;
  }

  const token = req.body?.token;
  const eventId = req.body?.eventId;
  const enabled = req.body?.enabled !== false;
  if (!token || typeof token !== 'string' || !eventId || typeof eventId !== 'string') {
    res.status(400).json({ error: 'Missing token or eventId' });
    return;
  }

  const id = crypto.createHash('sha256').update(`${token}:${eventId}`).digest('hex');
  const ref = db.collection('eventReminders').doc(id);

  try {
    if (!enabled) {
      await ref.delete();
      res.status(200).json({ ok: true, enabled: false });
      return;
    }

    const header = String(req.body.header || 'Event');
    const dateFrom = String(req.body.dateFrom || '');
    const dateTo = String(req.body.dateTo || dateFrom);
    const where = String(req.body.where || '');
    const now = new Date().toISOString();
    const existing = await ref.get();
    const payload = {
      token,
      eventId,
      header,
      dateFrom,
      dateTo,
      where,
      createdAt: existing.exists ? existing.get('createdAt') : now,
      updatedAt: now
    };
    if (existing.exists && existing.get('lastSentOn')) {
      payload.lastSentOn = existing.get('lastSentOn');
    }
    await ref.set(payload, { merge: true });

    const today = todayPacific();
    let sent = false;
    if (dueForReminder(dateFrom, today) && existing.get('lastSentOn') !== today) {
      try {
        await sendReminderPush(token, header, dateFrom, where, today);
        await ref.set({ lastSentOn: today }, { merge: true });
        sent = true;
      } catch (sendError) {
        console.error('immediate reminder send failed', sendError);
      }
    }

    res.status(200).json({ ok: true, enabled: true, sent });
  } catch (error) {
    console.error('registerEventReminder failed', error);
    res.status(500).json({ error: 'Could not save reminder' });
  }
};

exports.sendEventReminders = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.status(405).json({ error: 'GET or POST required' });
    return;
  }

  const today = todayPacific();
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  try {
    const snap = await db.collection('eventReminders').get();
    for (const doc of snap.docs) {
      const data = doc.data() || {};
      if (!dueForReminder(data.dateFrom, today) || data.lastSentOn === today) {
        skipped += 1;
        continue;
      }
      try {
        await sendReminderPush(
          data.token,
          data.header || 'Event',
          data.dateFrom,
          data.where || '',
          today
        );
        await doc.ref.set({ lastSentOn: today }, { merge: true });
        sent += 1;
      } catch (sendError) {
        failed += 1;
        console.error('sendEventReminders item failed', doc.id, sendError);
      }
    }
    res.status(200).json({ ok: true, today, sent, skipped, failed });
  } catch (error) {
    console.error('sendEventReminders failed', error);
    res.status(500).json({ error: 'Could not send reminders' });
  }
};

exports.generateEmbedding = async (req, res) => {
  cors(res);

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST required' });
    return;
  }

  const input = typeof req.body === 'string'
    ? req.body
    : (req.body && req.body.input);

  if (!input || typeof input !== 'string') {
    res.status(400).json({ error: 'Missing input' });
    return;
  }

  try {
    const result = await embedText(input, 'query');
    res.status(200).json({
      provider: result.provider,
      model: result.model,
      object: 'list',
      data: [
        {
          object: 'embedding',
          index: 0,
          embedding: result.embedding
        }
      ]
    });
  } catch (error) {
    console.error('generateEmbedding failed', error);
    res.status(503).json({ error: error.message || 'Embedding request failed' });
  }
};
