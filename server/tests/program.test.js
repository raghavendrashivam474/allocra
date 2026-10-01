import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app.js';
import * as institutionService from '../core/institution/institutionService.js';
import * as departmentService from '../core/institution/academic-structure/departmentService.js';
import * as programService from '../core/institution/academic-structure/programService.js';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri, { dbName: 'allocra-test-prog' });
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

describe('Program Domain Logic (programService)', () => {
  it('should create program under valid department', async () => {
    await institutionService.saveInstitution({ name: 'Prog College', academicYear: '2026-27' });
    const dept = await departmentService.createDepartment({ name: 'Computer Science' });

    const prog = await programService.createProgram({
      departmentId: dept._id.toString(),
      name: 'B.Tech CSE'
    });

    expect(prog._id).toBeDefined();
    expect(prog.name).toBe('B.Tech CSE');
    expect(prog.departmentId._id.toString()).toBe(dept._id.toString());
  });

  it('should trim program name', async () => {
    await institutionService.saveInstitution({ name: 'Prog College', academicYear: '2026-27' });
    const dept = await departmentService.createDepartment({ name: 'Computer Science' });

    const prog = await programService.createProgram({
      departmentId: dept._id.toString(),
      name: '   B.Tech CSE   '
    });

    expect(prog.name).toBe('B.Tech CSE');
  });

  it('should reject missing departmentId', async () => {
    await expect(
      programService.createProgram({ departmentId: '', name: 'B.Tech CSE' })
    ).rejects.toThrow('Department is required');
  });

  it('should reject invalid or nonexistent departmentId', async () => {
    await expect(
      programService.createProgram({ departmentId: 'invalid-id', name: 'B.Tech CSE' })
    ).rejects.toThrow('Invalid department ID');

    const fakeId = new mongoose.Types.ObjectId().toString();
    await expect(
      programService.createProgram({ departmentId: fakeId, name: 'B.Tech CSE' })
    ).rejects.toThrow('Department not found');
  });

  it('should reject missing program name', async () => {
    await institutionService.saveInstitution({ name: 'Prog College', academicYear: '2026-27' });
    const dept = await departmentService.createDepartment({ name: 'Computer Science' });

    await expect(
      programService.createProgram({ departmentId: dept._id.toString(), name: '   ' })
    ).rejects.toThrow('Program name is required');
  });

  it('should retrieve programs populated with department', async () => {
    await institutionService.saveInstitution({ name: 'Prog College', academicYear: '2026-27' });
    const dept = await departmentService.createDepartment({ name: 'Computer Science' });
    await programService.createProgram({ departmentId: dept._id.toString(), name: 'B.Tech CSE' });
    await programService.createProgram({ departmentId: dept._id.toString(), name: 'M.Tech CSE' });

    const list = await programService.getPrograms();
    expect(list.length).toBe(2);
    expect(list[0].name).toBe('B.Tech CSE');
    expect(list[0].departmentId.name).toBe('Computer Science');
    expect(list[1].name).toBe('M.Tech CSE');
  });
});

describe('Program API Routes', () => {
  it('GET /api/programs should return empty list initially', async () => {
    const res = await request(app).get('/api/programs');
    expect(res.status).toBe(200);
    expect(res.body.programs).toEqual([]);
  });

  it('POST /api/programs should create program and return 201', async () => {
    await institutionService.saveInstitution({ name: 'Prog College', academicYear: '2026-27' });
    const dept = await departmentService.createDepartment({ name: 'Mechanical' });

    const res = await request(app)
      .post('/api/programs')
      .send({
        departmentId: dept._id.toString(),
        name: 'B.Tech ME'
      });

    expect(res.status).toBe(201);
    expect(res.body.program.name).toBe('B.Tech ME');
  });

  it('POST /api/programs should return 404 for nonexistent department', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .post('/api/programs')
      .send({
        departmentId: fakeId,
        name: 'B.Tech ME'
      });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Department not found');
  });
});
