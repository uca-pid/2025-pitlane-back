const request = require('supertest');
const express = require('express');
const routes = require('../routes');

const app = express();
app.use(express.json());
app.use('/', routes);

describe('Users API', () => {
  it('GET /users should return an array', async () => {
    const res = await request(app).get('/users');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('POST /users should create a user', async () => {
    const res = await request(app)
      .post('/users')
      .send({
        name: 'Test User2',
        email: 'test2@example.com',
        password: 'testpass',
        preferences: [],
        dietaryRestrictions: []
      });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('userID');
    expect(res.body).toHaveProperty('name', 'Test User2');
    // Cleanup
    await request(app).delete(`/users/${res.body.userID}`);
  });

//   it('POST /users should return 409 if email already exists', async () => {
//     // First create
//     await request(app)
//       .post('/users')
//       .send({
//         name: 'Conflict User',
//         email: 'conflict@example.com',
//         password: 'testpass',
//         preferences: [],
//         dietaryRestrictions: []
//       });
//     // Try to create again
//     const res = await request(app)
//       .post('/users')
//       .send({
//         name: 'Conflict User',
//         email: 'conflict@example.com',
//         password: 'testpass',
//         preferences: [],
//         dietaryRestrictions: []
//       });
//     expect(res.statusCode).toBe(409);
//   });
});
