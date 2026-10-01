import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app.js';
import * as institutionService from '../core/institution/institutionService.js';
import * as termService from '../core/institution/academic-context/termService.js';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri, { dbName: 'allocra-test-term' });
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

describe('Term Domain Logic (termService)', () => {
  it('should reject creation if institution is not configured', async () => {
    await expect(
      termService.createTerm({ name: 'Semester 1' })
    ).rejects.toThrow('Institution must be configured before adding terms');
  });

  it('should create a term inheriting the institution academic year', async () => {
    await institutionService.saveInstitution({ name: 'Test College', academicYear: '2026-27' });

    const term = await termService.createTerm({ name: 'Semester 1' });
    expect(term._id).toBeDefined();
    expect(term.name).toBe('Semester 1');
    expect(term.academicYear).toBe('2026-27');
    expect(term.institutionId).toBeDefined();
  });

  it('should trim whitespace from term name', async () => {
    await institutionService.saveInstitution({ name: 'Test College', academicYear: '2026-27' });

    const term = await termService.createTerm({ name: '   Semester 2   ' });
    expect(term.name).toBe('Semester 2');
  });

  it('should reject missing or empty term name', async () => {
    await institutionService.saveInstitution({ name: 'Test College', academicYear: '2026-27' });

    await expect(termService.createTerm({ name: '' })).rejects.toThrow('Term name is required');
    await expect(termService.createTerm({ name: '   ' })).rejects.toThrow('Term name is required');
  });

  it('should return empty list when no terms exist', async () => {
    const list = await termService.getTerms();
    expect(list).toEqual([]);
  });

  it('should return list of terms', async () => {
    await institutionService.saveInstitution({ name: 'Test College', academicYear: '2026-27' });
    await termService.createTerm({ name: 'Semester 1' });
    await termService.createTerm({ name: 'Semester 2' });

    const list = await termService.getTerms();
    expect(list.length).toBe(2);
    expect(list[0].name).toBe('Semester 1');
    expect(list[1].name).toBe('Semester 2');
  });
});

describe('Term API Routes', () => {
  it('GET /api/terms should return empty list initially', async () => {
    const res = await request(app).get('/api/terms');
    expect(res.status).toBe(200);
    expect(res.body.terms).toEqual([]);
  });

  it('POST /api/terms should create term and return 201', async () => {
    await institutionService.saveInstitution({ name: 'API College', academicYear: '2026-27' });

    const res = await request(app)
      .post('/api/terms')
      .send({ name: 'Semester 1' });

    expect(res.status).toBe(201);
    expect(res.body.term.name).toBe('Semester 1');
    expect(res.body.term.academicYear).toBe('2026-27');
  });

  it('POST /api/terms should return 400 when validation fails', async () => {
    const res = await request(app)
      .post('/api/terms')
      .send({ name: '  ' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Term name is required');
  });
});
