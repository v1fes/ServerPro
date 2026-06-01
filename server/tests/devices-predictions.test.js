const request = require('supertest');
const { app, setupTestDB, teardownTestDB, testUser, testAdmin } = require('./setup');

let adminToken;
let clientToken;
let deviceId;

beforeAll(async () => {
  await setupTestDB();

  const clientRes = await request(app)
    .post('/api/auth/register')
    .send(testUser);
  clientToken = clientRes.body.accessToken;

  const adminRes = await request(app)
    .post('/api/auth/login')
    .send({ email: testAdmin.email, password: testAdmin.password });
  adminToken = adminRes.body.accessToken;
});

afterAll(async () => {
  await teardownTestDB();
});

describe('POST /api/devices', () => {
  it('should create device as client', async () => {
    const res = await request(app)
      .post('/api/devices')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        deviceType: 'phone',
        brand: 'Samsung',
        model: 'Galaxy S24',
        serialNumber: 'SN-PHONE-001',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.device).toHaveProperty('brand', 'Samsung');
    deviceId = res.body.device.id;
  });

  it('should reject invalid device type', async () => {
    const res = await request(app)
      .post('/api/devices')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        deviceType: 'spaceship',
        brand: 'NASA',
        model: 'X1',
      });

    expect(res.statusCode).toBe(400);
  });

  it('should reject device without brand', async () => {
    const res = await request(app)
      .post('/api/devices')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        deviceType: 'phone',
        model: 'Test',
      });

    expect(res.statusCode).toBe(400);
  });
});

describe('GET /api/devices', () => {
  it('should list client devices', async () => {
    const res = await request(app)
      .get('/api/devices')
      .set('Authorization', `Bearer ${clientToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('devices');
    expect(res.body.devices.length).toBeGreaterThan(0);
  });
});

describe('GET /api/devices/:id', () => {
  it('should get device by id', async () => {
    const res = await request(app)
      .get(`/api/devices/${deviceId}`)
      .set('Authorization', `Bearer ${clientToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.device).toHaveProperty('id', deviceId);
  });

  it('should return 404 for non-existent device', async () => {
    const res = await request(app)
      .get('/api/devices/99999')
      .set('Authorization', `Bearer ${clientToken}`);

    expect(res.statusCode).toBe(404);
  });
});

describe('PUT /api/devices/:id', () => {
  it('should update device', async () => {
    const res = await request(app)
      .put(`/api/devices/${deviceId}`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ brand: 'Apple', model: 'iPhone 15' });

    expect(res.statusCode).toBe(200);
    expect(res.body.device.brand).toBe('Apple');
  });
});

describe('POST /api/predictions/ml/:deviceId', () => {
  it('should reject predictions for non-admin/master', async () => {
    const res = await request(app)
      .post(`/api/predictions/ml/${deviceId}`)
      .set('Authorization', `Bearer ${clientToken}`);

    expect(res.statusCode).toBe(403);
  });

  it('should return 404 for non-existent device', async () => {
    const res = await request(app)
      .post('/api/predictions/ml/99999')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(404);
  });
});

describe('GET /api/predictions/device/:deviceId', () => {
  it('should get predictions for device', async () => {
    const res = await request(app)
      .get(`/api/predictions/device/${deviceId}`)
      .set('Authorization', `Bearer ${clientToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('predictions');
  });
});

describe('GET /api/health', () => {
  it('should return health status', async () => {
    const res = await request(app).get('/api/health');

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('timestamp');
  });
});
