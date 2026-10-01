import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app.js';
import * as institutionService from '../core/institution/institutionService.js';
import Institution from '../data/models/Institution.js';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri, { dbName: 'allocra-test' });
}, 120000);

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
});

beforeEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

describe('Institution Domain Logic (institutionService)', () => {
  it('should successfully save a valid institution configuration', async () => {
    const saved = await institutionService.saveInstitution({
      name: 'ABC Engineering College',
      academicYear: '2026–27'
    });

    expect(saved._id).toBeDefined();
    expect(saved.name).toBe('ABC Engineering College');
    expect(saved.academicYear).toBe('2026–27');
  });

  it('should trim whitespace from institution inputs', async () => {
    const saved = await institutionService.saveInstitution({
      name: '   ABC College   ',
      academicYear: '   2026–27   '
    });

    expect(saved.name).toBe('ABC College');
    expect(saved.academicYear).toBe('2026–27');
  });

  it('should fail validation if name is missing or empty', async () => {
    await expect(
      institutionService.saveInstitution({ name: '', academicYear: '2026–27' })
    ).rejects.toThrow('Institution name is required');

    await expect(
      institutionService.saveInstitution({ name: '   ', academicYear: '2026–27' })
    ).rejects.toThrow('Institution name is required');
  });

  it('should fail validation if academic year is missing or empty', async () => {
    await expect(
      institutionService.saveInstitution({ name: 'ABC College', academicYear: '' })
    ).rejects.toThrow('Academic year is required');
  });

  it('should return null when no institution has been configured', async () => {
    const result = await institutionService.getInstitution();
    expect(result).toBeNull();
  });

  it('should return the configured institution', async () => {
    await institutionService.saveInstitution({
      name: 'ABC College',
      academicYear: '2026–27'
    });

    const result = await institutionService.getInstitution();
    expect(result).not.toBeNull();
    expect(result.name).toBe('ABC College');
  });

  it('should update the single existing configuration instead of adding a new one', async () => {
    await institutionService.saveInstitution({
      name: 'Old College',
      academicYear: '2025-26'
    });

    await institutionService.saveInstitution({
      name: 'New College',
      academicYear: '2026-27'
    });

    const count = await Institution.countDocuments();
    expect(count).toBe(1);

    const active = await institutionService.getInstitution();
    expect(active.name).toBe('New College');
  });
});

describe('Institution API Route Connection', () => {
  it('GET /api/institution should return null when unconfigured', async () => {
    const res = await request(app).get('/api/institution');
    expect(res.status).toBe(200);
    expect(res.body.institution).toBeNull();
  });

  it('POST /api/institution should create configuration and return 201', async () => {
    const payload = { name: 'XYZ University', academicYear: '2026–27' };
    const res = await request(app)
      .post('/api/institution')
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Institution configured successfully');
    expect(res.body.institution.name).toBe('XYZ University');
    expect(res.body.institution.academicYear).toBe('2026–27');
  });

  it('POST /api/institution should return 400 when validation fails', async () => {
    const res = await request(app)
      .post('/api/institution')
      .send({ name: '', academicYear: '2026–27' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Institution name is required');
  });
});
