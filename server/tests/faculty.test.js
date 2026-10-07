import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app.js';
import * as institutionService from '../core/institution/institutionService.js';
import * as departmentService from '../core/institution/academic-structure/departmentService.js';
import * as facultyService from '../core/institution/resources/faculty/facultyService.js';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri, { dbName: 'allocra-test-faculty' });
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

describe('Faculty Domain Logic (facultyService)', () => {
  it('should create faculty under valid department', async () => {
    await institutionService.saveInstitution({ name: 'Faculty College', academicYear: '2026-27' });
    const dept = await departmentService.createDepartment({ name: 'Computer Science' });

    const faculty = await facultyService.createFaculty({
      departmentId: dept._id.toString(),
      name: 'Dr. Alan Turing'
    });

    expect(faculty._id).toBeDefined();
    expect(faculty.name).toBe('Dr. Alan Turing');
    expect(faculty.departmentId._id.toString()).toBe(dept._id.toString());
    expect(faculty.institutionId.toString()).toBe(dept.institutionId.toString());
  });

  it('should trim faculty name', async () => {
    await institutionService.saveInstitution({ name: 'Faculty College', academicYear: '2026-27' });
    const dept = await departmentService.createDepartment({ name: 'Computer Science' });

    const faculty = await facultyService.createFaculty({
      departmentId: dept._id.toString(),
      name: '   Dr. Alan Turing   '
    });

    expect(faculty.name).toBe('Dr. Alan Turing');
  });

  it('should reject missing departmentId', async () => {
    await expect(
      facultyService.createFaculty({ departmentId: '', name: 'Dr. Alan Turing' })
    ).rejects.toThrow('Department is required');
  });

  it('should reject invalid or nonexistent departmentId', async () => {
    await expect(
      facultyService.createFaculty({ departmentId: 'invalid-id', name: 'Dr. Alan Turing' })
    ).rejects.toThrow('Invalid department ID');

    const fakeId = new mongoose.Types.ObjectId().toString();
    await expect(
      facultyService.createFaculty({ departmentId: fakeId, name: 'Dr. Alan Turing' })
    ).rejects.toThrow('Department not found');
  });

  it('should reject missing faculty name', async () => {
    await institutionService.saveInstitution({ name: 'Faculty College', academicYear: '2026-27' });
    const dept = await departmentService.createDepartment({ name: 'Computer Science' });

    await expect(
      facultyService.createFaculty({ departmentId: dept._id.toString(), name: '   ' })
    ).rejects.toThrow('Faculty name is required');
  });

  it('should retrieve faculty populated with department', async () => {
    await institutionService.saveInstitution({ name: 'Faculty College', academicYear: '2026-27' });
    const dept = await departmentService.createDepartment({ name: 'Computer Science' });
    await facultyService.createFaculty({ departmentId: dept._id.toString(), name: 'Dr. Alan Turing' });
    await facultyService.createFaculty({ departmentId: dept._id.toString(), name: 'Prof. Grace Hopper' });

    const list = await facultyService.getFaculty();
    expect(list.length).toBe(2);
    expect(list[0].name).toBe('Dr. Alan Turing');
    expect(list[0].departmentId.name).toBe('Computer Science');
    expect(list[1].name).toBe('Prof. Grace Hopper');
  });
});

describe('Faculty API Routes', () => {
  it('GET /api/faculty should return empty list initially', async () => {
    const res = await request(app).get('/api/faculty');
    expect(res.status).toBe(200);
    expect(res.body.faculty).toEqual([]);
  });

  it('POST /api/faculty should create faculty and return 201', async () => {
    await institutionService.saveInstitution({ name: 'Faculty College', academicYear: '2026-27' });
    const dept = await departmentService.createDepartment({ name: 'Mechanical' });

    const res = await request(app)
      .post('/api/faculty')
      .send({
        departmentId: dept._id.toString(),
        name: 'Prof. Ada Lovelace'
      });

    expect(res.status).toBe(201);
    expect(res.body.faculty.name).toBe('Prof. Ada Lovelace');
    expect(res.body.message).toBe('Faculty member created successfully');
  });

  it('POST /api/faculty should return 404 for nonexistent department', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .post('/api/faculty')
      .send({
        departmentId: fakeId,
        name: 'Prof. Ada Lovelace'
      });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Department not found');
  });

  it('POST /api/faculty should return 400 for missing name', async () => {
    await institutionService.saveInstitution({ name: 'Faculty College', academicYear: '2026-27' });
    const dept = await departmentService.createDepartment({ name: 'Mechanical' });

    const res = await request(app)
      .post('/api/faculty')
      .send({
        departmentId: dept._id.toString(),
        name: ''
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Faculty name is required');
  });
});
