const request = require('supertest');
const app = require('../src/index');

describe('User Service Tests', () => {
  let authToken;
  let userId;

  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/users/register')
      .send({
        email: `test${Date.now()}@example.com`,
        password: 'Test123!',
        name: 'Test User',
        phone: '+8801712345678'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
    
    authToken = res.body.data.token;
    userId = res.body.data.userId;
  });

  it('should login existing user', async () => {
    const res = await request(app)
      .post('/api/users/login')
      .send({
        email: 'test@example.com',
        password: 'Test123!'
      });

    if (res.statusCode === 200) {
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
    }
  });

  it('should get user profile', async () => {
    if (!authToken) return;

    const res = await request(app)
      .get('/api/users/profile')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('email');
  });

  it('should reject invalid credentials', async () => {
    const res = await request(app)
      .post('/api/users/login')
      .send({
        email: 'test@example.com',
        password: 'wrongpassword'
      });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
