'use strict';
const { nanoid } = require('nanoid');

const DEMO_GUESTS = [
  { name: 'Нино', plus_one_allowed: 1, rsvp_status: 'yes', rsvp_plus_one: 1 },
  { name: 'Георгий', plus_one_allowed: 0, rsvp_status: 'no', rsvp_plus_one: null },
  { name: 'Анна', plus_one_allowed: 1, rsvp_status: null, rsvp_plus_one: null },
  { name: 'Давид', plus_one_allowed: 0, rsvp_status: 'yes', rsvp_plus_one: 0 },
  { name: 'Тамара', plus_one_allowed: 1, rsvp_status: null, rsvp_plus_one: null }
];

const VIEW_DATA = [
  { ip: '91.208.138.1', country: 'GE', city: 'Tbilisi', ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' },
  { ip: '91.208.138.2', country: 'GE', city: 'Batumi', ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' },
  { ip: '77.88.55.88', country: 'RU', city: 'Moscow', ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' },
  { ip: '212.95.50.50', country: 'DE', city: 'Berlin', ua: 'Mozilla/5.0 (X11; Linux x86_64; rv:125.0) Gecko/20100101 Firefox/125.0' },
  { ip: '72.14.192.1', country: 'US', city: 'New York', ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' }
];

function seed(db) {
  const count = db.prepare('SELECT COUNT(*) as count FROM invitations').get().count;
  if (count > 0) return; // Already seeded

  console.log('[seed] Seeding demo data...');

  const now = Math.floor(Date.now() / 1000);
  const DAY = 86400;

  const insertInvitation = db.prepare(
    'INSERT INTO invitations (id, guest_name, plus_one_allowed, rsvp_status, rsvp_plus_one, rsvp_submitted_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );

  const insertView = db.prepare(
    'INSERT INTO views (invitation_id, viewed_at, ip_address, country, city, user_agent) VALUES (?, ?, ?, ?, ?, ?)'
  );

  const seedAll = db.transaction(() => {
    for (const guest of DEMO_GUESTS) {
      const id = nanoid(8);
      const createdAt = now - 14 * DAY;
      const rsvpAt = guest.rsvp_status ? now - Math.floor(Math.random() * 7 * DAY) : null;

      insertInvitation.run(
        id,
        guest.name,
        guest.plus_one_allowed,
        guest.rsvp_status,
        guest.rsvp_plus_one,
        rsvpAt,
        createdAt
      );

      // 2-8 view records over 14 days
      const viewCount = 2 + Math.floor(Math.random() * 7);
      for (let i = 0; i < viewCount; i++) {
        const viewData = VIEW_DATA[Math.floor(Math.random() * VIEW_DATA.length)];
        // Spread views across 14 days, preferring mornings/evenings
        const daysAgo = Math.floor(Math.random() * 14);
        const hourOffset = [8, 9, 12, 18, 19, 20, 21][Math.floor(Math.random() * 7)] * 3600;
        const viewedAt = now - daysAgo * DAY - hourOffset + Math.floor(Math.random() * 3600);

        insertView.run(id, viewedAt, viewData.ip, viewData.country, viewData.city, viewData.ua);
      }
    }
  });

  seedAll();
  console.log('[seed] Demo data seeded: 5 guests');
}

module.exports = { seed };
