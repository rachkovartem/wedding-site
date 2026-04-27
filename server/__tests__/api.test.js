import { describe, it, expect, beforeAll } from 'vitest';
import supertest from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import { createDb } from '../db.js';
import { initAdminPassword } from '../auth.js';
import { createInvitation } from '../dao.js';
import publicRoutes from '../routes/public.js';
import authRoutes from '../routes/authRoutes.js';
import adminRoutes from '../routes/admin.js';
import statsRoutes from '../routes/stats.js';

// Create a test app with in-memory DB.
// Each call creates a fresh DB and express app, so rate limiter state is isolated.
function createTestApp() {
  const db = createDb(':memory:');
  process.env.ADMIN_PASSWORD = 'testpass';
  initAdminPassword(db);

  const app = express();
  app.set('trust proxy', 1);
  app.use(express.json());
  app.use(cookieParser());
  app.use((req, res, next) => { req.db = db; next(); });
  app.use('/api/invitations', publicRoutes);
  app.use('/api/auth', authRoutes);
  // Stats before admin to avoid prefix shadowing
  app.use('/api/admin/stats', statsRoutes);
  app.use('/api/admin', adminRoutes);

  return { app, db };
}

// Helper: login and return cookie string
async function loginAndGetCookie(request) {
  const res = await request.post('/api/auth').send({ password: 'testpass' });
  return res.headers['set-cookie'][0].split(';')[0];
}

describe('Public API', () => {
  let request, db, testInvitationId;

  beforeAll(() => {
    const setup = createTestApp();
    request = supertest(setup.app);
    db = setup.db;
    const inv = createInvitation(db, 'Test Guest', 1);
    testInvitationId = inv.id;
  });

  it('GET /api/invitations/:id returns 200 for valid id', async () => {
    const res = await request.get(`/api/invitations/${testInvitationId}`);
    expect(res.status).toBe(200);
    expect(res.body.guest_name).toBe('Test Guest');
    expect(res.body.plus_one_allowed).toBe(1);
  });

  it('GET /api/invitations/:id returns 404 for invalid id', async () => {
    const res = await request.get('/api/invitations/notexist');
    expect(res.status).toBe(404);
  });

  it('GET /api/invitations/:id does not expose internal fields', async () => {
    const res = await request.get(`/api/invitations/${testInvitationId}`);
    expect(res.status).toBe(200);
    // created_at should not be in public response
    expect(res.body.created_at).toBeUndefined();
  });

  it('POST /api/invitations/:id/view returns 201', async () => {
    const res = await request
      .post(`/api/invitations/${testInvitationId}/view`)
      .set('User-Agent', 'TestBrowser');
    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);
  });

  it('POST /api/invitations/:id/view returns 404 for unknown id', async () => {
    const res = await request.post('/api/invitations/unknown1/view');
    expect(res.status).toBe(404);
  });

  it('POST /api/invitations/:id/rsvp with yes returns 200', async () => {
    const res = await request
      .post(`/api/invitations/${testInvitationId}/rsvp`)
      .send({ status: 'yes', plus_one: 1 });
    expect(res.status).toBe(200);
    expect(res.body.rsvp_status).toBe('yes');
    expect(res.body.rsvp_plus_one).toBe(1);
  });

  it('POST /api/invitations/:id/rsvp rejects invalid status', async () => {
    const res = await request
      .post(`/api/invitations/${testInvitationId}/rsvp`)
      .send({ status: 'maybe' });
    expect(res.status).toBe(400);
  });

  it('POST /api/invitations/:id/rsvp returns 404 for non-existent', async () => {
    const res = await request
      .post('/api/invitations/nope1234/rsvp')
      .send({ status: 'yes' });
    expect(res.status).toBe(404);
  });

  it('POST /api/invitations/:id/rsvp does not save plus_one when not allowed', async () => {
    // Fresh app to avoid sharing state
    const setup = createTestApp();
    const localRequest = supertest(setup.app);
    const inv = createInvitation(setup.db, 'No Plus One Guest', 0);

    const res = await localRequest
      .post(`/api/invitations/${inv.id}/rsvp`)
      .send({ status: 'yes', plus_one: 1 });

    expect(res.status).toBe(200);
    expect(res.body.rsvp_plus_one).toBeNull();
  });
});

describe('Auth API — login & cookie', () => {
  // Each test that needs to login gets its own app to avoid hitting the rate limiter
  it('POST /api/auth with correct password sets HttpOnly cookie', async () => {
    const { app } = createTestApp();
    const request = supertest(app);
    const res = await request.post('/api/auth').send({ password: 'testpass' });
    expect(res.status).toBe(200);
    expect(res.headers['set-cookie']).toBeDefined();
    expect(res.headers['set-cookie'][0]).toContain('admin_token=');
    expect(res.headers['set-cookie'][0]).toContain('HttpOnly');
  });

  it('POST /api/auth with wrong password returns 401', async () => {
    const { app } = createTestApp();
    const request = supertest(app);
    const res = await request.post('/api/auth').send({ password: 'wrongpass' });
    expect(res.status).toBe(401);
    expect(res.headers['set-cookie']).toBeUndefined();
  });

  it('POST /api/auth without password returns 400', async () => {
    const { app } = createTestApp();
    const request = supertest(app);
    const res = await request.post('/api/auth').send({});
    expect(res.status).toBe(400);
  });
});

describe('Auth API — protected routes', () => {
  let request, cookie;

  beforeAll(async () => {
    const setup = createTestApp();
    request = supertest(setup.app);
    // Login once at the start of this block
    cookie = await loginAndGetCookie(request);
  });

  it('GET /api/admin/invitations without cookie returns 401', async () => {
    const res = await request.get('/api/admin/invitations');
    expect(res.status).toBe(401);
  });

  it('GET /api/admin/invitations with valid cookie returns 200', async () => {
    const res = await request.get('/api/admin/invitations').set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/admin/invitations with invalid token returns 401', async () => {
    const res = await request
      .get('/api/admin/invitations')
      .set('Cookie', 'admin_token=totally-invalid-jwt');
    expect(res.status).toBe(401);
  });

  it('POST /api/admin/invitations creates invitation', async () => {
    const res = await request
      .post('/api/admin/invitations')
      .set('Cookie', cookie)
      .send({ guest_name: 'New Guest', plus_one_allowed: 1 });

    expect(res.status).toBe(201);
    expect(res.body.guest_name).toBe('New Guest');
    expect(res.body.id).toHaveLength(8);
  });

  it('POST /api/admin/invitations stores provided salutation', async () => {
    const res = await request
      .post('/api/admin/invitations')
      .set('Cookie', cookie)
      .send({ guest_name: 'Ira', plus_one_allowed: 0, salutation: 'Дорогая' });

    expect(res.status).toBe(201);
    expect(res.body.salutation).toBe('Дорогая');
  });

  it('POST /api/admin/invitations defaults salutation to Дорогой when omitted', async () => {
    const res = await request
      .post('/api/admin/invitations')
      .set('Cookie', cookie)
      .send({ guest_name: 'Some Guest', plus_one_allowed: 0 });

    expect(res.status).toBe(201);
    expect(res.body.salutation).toBe('Дорогой');
  });

  it('POST /api/admin/invitations rejects empty guest_name', async () => {
    const res = await request
      .post('/api/admin/invitations')
      .set('Cookie', cookie)
      .send({ guest_name: '', plus_one_allowed: 0 });

    expect(res.status).toBe(400);
  });

  it('POST /api/admin/invitations rejects whitespace-only guest_name', async () => {
    const res = await request
      .post('/api/admin/invitations')
      .set('Cookie', cookie)
      .send({ guest_name: '   ', plus_one_allowed: 0 });

    expect(res.status).toBe(400);
  });

  it('DELETE /api/admin/invitations/:id removes invitation', async () => {
    // Create one to delete
    const createRes = await request
      .post('/api/admin/invitations')
      .set('Cookie', cookie)
      .send({ guest_name: 'To Delete', plus_one_allowed: 0 });

    const deleteRes = await request
      .delete(`/api/admin/invitations/${createRes.body.id}`)
      .set('Cookie', cookie);
    expect(deleteRes.status).toBe(204);

    // Verify gone via public endpoint
    const getRes = await request.get(`/api/invitations/${createRes.body.id}`);
    expect(getRes.status).toBe(404);
  });

  it('DELETE /api/admin/invitations/:id returns 404 for non-existent', async () => {
    const res = await request
      .delete('/api/admin/invitations/nope1234')
      .set('Cookie', cookie);
    expect(res.status).toBe(404);
  });

  it('GET /api/admin/stats returns stats object', async () => {
    const res = await request.get('/api/admin/stats').set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('total_invitations');
    expect(res.body).toHaveProperty('total_views');
    expect(res.body).toHaveProperty('rsvp_breakdown');
    expect(res.body).toHaveProperty('confirmed_guests');
    expect(res.body).toHaveProperty('views_per_day');
    expect(res.body).toHaveProperty('guests');
  });

  it('GET /api/admin/stats without cookie returns 401', async () => {
    const res = await request.get('/api/admin/stats');
    expect(res.status).toBe(401);
  });
});
