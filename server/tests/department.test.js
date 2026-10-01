import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app.js';
import * as institutionService from '../core/institution/institutionService.js';
import * as departmentService from '../core/institution/academic-structure/departmentService.js';
import Department from '../data/models/Department.js';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri, { dbName: 'allocra-test-dept' });
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

describe('Department Domain Logic (departmentService)', () => {
  it('should reject creation if institution is not configured', async () => {
    await expect(
      departmentService.createDepartment({ name: 'Computer Science' })
    ).rejects.toThrow('Institution must be configured before adding departments');
  });

  it('should create a department when institution exists', async () => {
    await institutionService.saveInstitution({ name: 'Test College', academicYear: '2026-27' });

    const dept = await departmentService.createDepartment({ name: 'Computer Science & Engineering' });
    expect(dept._id).toBeDefined();
    expect(dept.name).toBe('Computer Science & Engineering');
    expect(dept.institutionId).toBeDefined();
  });

  it('should trim whitespace from department name', async () => {
    await institutionService.saveInstitution({ name: 'Test College', academicYear: '2026-27' });

    const dept = await departmentService.createDepartment({ name: '   Mechanical Engineering   ' });
    expect(dept.name).toBe('Mechanical Engineering');
  });

  it('should reject missing or empty department name', async () => {
    await institutionService.saveInstitution({ name: 'Test College', academicYear: '2026-27' });

    await expect(departmentService.createDepartment({ name: '' })).rejects.toThrow('Department name is required');
    await expect(departmentService.createDepartment({ name: '   ' })).rejects.toThrow('Department name is required');
  });

  it('should return empty list when no departments exist', async () => {
    const list = await departmentService.getDepartments();
    expect(list).toEqual([]);
  });

  it('should return list of departments', async () => {
    await institutionService.saveInstitution({ name: 'Test College', academicYear: '2026-27' });
    await departmentService.createDepartment({ name: 'CSE' });
    await departmentService.createDepartment({ name: 'ECE' });

    const list = await departmentService.getDepartments();
    expect(list.length).toBe(2);
    expect(list[0].name).toBe('CSE');
    expect(list[1].name).toBe('ECE');
  });
});

describe('Department API Routes', () => {
  it('GET /api/departments should return empty list initially', async () => {
    const res = await request(app).get('/api/departments');
    expect(res.status).toBe(200);
    expect(res.body.departments).toEqual([]);
  });

  it('POST /api/departments should create department and return 201', async () => {
    await institutionService.saveInstitution({ name: 'API College', academicYear: '2026-27' });

    const res = await request(app)
      .post('/api/departments')
      .send({ name: 'Information Technology' });

    expect(res.status).toBe(201);
    expect(res.body.department.name).toBe('Information Technology');
  });

  it('POST /api/departments should return 400 when validation fails', async () => {
    const res = await request(app)
      .post('/api/departments')
      .send({ name: '  ' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Department name is required');
  });
});
