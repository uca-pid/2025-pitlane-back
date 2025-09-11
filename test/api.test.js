const request = require('supertest');
const express = require('express');
const routes = require('../routes');

const app = express();
app.use(express.json());
app.use('/', routes);

describe('API Endpoints', () => {
  it('GET /users should return an array', async () => {
    const res = await request(app).get('/users');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /foods should return an array', async () => {
    const res = await request(app).get('/foods');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('POST /foods/by-preference-and-restriction with body should return an array', async () => {
    const res = await request(app)
      .post('/foods/by-preference-and-restriction')
      .send({ preferenceId: 1, restrictionId: 1 });
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /foods/recommended/1 should return an array or 404', async () => {
    const res = await request(app).get('/foods/recommended/1');
    expect([200, 404]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(Array.isArray(res.body)).toBe(true);
    }
  });
});
