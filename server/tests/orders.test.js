const request = require('supertest');
const { app, setupTestDB, teardownTestDB, testUser, testAdmin } = require('./setup');

let adminToken;
let clientToken;
let deviceId;
let orderId;

beforeAll(async () => {
  await setupTestDB();

  // Register client
  const clientRes = await request(app)
    .post('/api/auth/register')
    .send(testUser);
  clientToken = clientRes.body.accessToken;

  // Login admin
  const adminRes = await request(app)
    .post('/api/auth/login')
    .send({ email: testAdmin.email, password: testAdmin.password });
  adminToken = adminRes.body.accessToken;

  // Create device for client
  const clientId = clientRes.body.user.id;
  const deviceRes = await request(app)
    .post('/api/devices')
    .set('Authorization', `Bearer ${clientToken}`)
    .send({
      deviceType: 'laptop',
      brand: 'Dell',
      model: 'XPS 15',
      serialNumber: 'SN123456',
    });
  deviceId = deviceRes.body.device.id;
});

afterAll(async () => {
  await teardownTestDB();
});

describe('POST /api/orders', () => {
  it('should create order as client', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        deviceId,
        description: 'Екран не працює',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.order).toHaveProperty('orderNumber');
    expect(res.body.order.status).toBe('new');
    orderId = res.body.order.id;
  });

  it('should reject order without auth', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({ deviceId, description: 'test' });

    expect(res.statusCode).toBe(401);
  });

  it('should reject order with invalid deviceId', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ deviceId: 99999, description: 'test' });

    expect(res.statusCode).toBe(404);
  });

  it('should reject order without description', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ deviceId });

    expect(res.statusCode).toBe(400);
  });
});

describe('GET /api/orders', () => {
  it('should list orders for client', async () => {
    const res = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${clientToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('orders');
    expect(res.body.orders.length).toBeGreaterThan(0);
  });

  it('should list all orders for admin', async () => {
    const res = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('orders');
  });
});

describe('GET /api/orders/:id', () => {
  it('should get order by id', async () => {
    const res = await request(app)
      .get(`/api/orders/${orderId}`)
      .set('Authorization', `Bearer ${clientToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.order).toHaveProperty('id', orderId);
  });

  it('should return 404 for non-existent order', async () => {
    const res = await request(app)
      .get('/api/orders/99999')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(404);
  });
});

describe('PUT /api/orders/:id/status', () => {
  it('should update order status as admin', async () => {
    const res = await request(app)
      .put(`/api/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'diagnostics', comment: 'Приймаємо в роботу' });

    expect(res.statusCode).toBe(200);
    expect(res.body.order.status).toBe('diagnostics');
  });

  it('should reject invalid status', async () => {
    const res = await request(app)
      .put(`/api/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'invalid_status' });

    expect(res.statusCode).toBe(400);
  });

  it('should reject status update by client', async () => {
    const res = await request(app)
      .put(`/api/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ status: 'ready' });

    expect(res.statusCode).toBe(403);
  });
});

describe('GET /api/orders/:id/timeline', () => {
  it('should get order timeline', async () => {
    const res = await request(app)
      .get(`/api/orders/${orderId}/timeline`)
      .set('Authorization', `Bearer ${clientToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('timeline');
    expect(res.body.timeline.length).toBeGreaterThan(0);
  });
});

describe('GET /api/orders/track/:orderNumber', () => {
  let orderNumber;

  beforeAll(async () => {
    const res = await request(app)
      .get(`/api/orders/${orderId}`)
      .set('Authorization', `Bearer ${clientToken}`);
    orderNumber = res.body.order.orderNumber;
  });

  it('should track order by number without auth', async () => {
    const res = await request(app)
      .get(`/api/orders/track/${orderNumber}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.order).toHaveProperty('orderNumber', orderNumber);
  });

  it('should return 404 for non-existent order number', async () => {
    const res = await request(app)
      .get('/api/orders/track/NONEXISTENT');

    expect(res.statusCode).toBe(404);
  });
});
