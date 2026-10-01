import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app.js';
import * as institutionService from '../core/institution/institutionService.js';
import * as departmentService from '../core/institution/academic-structure/departmentService.js';
import * as programService from '../core/institution/academic-structure/programService.js';
import * as termService from '../core/institution/academic-context/termService.js';
import * as groupService from '../core/institution/academic-context/groupService.js';
import Institution from '../data/models/Institution.js';
import Department from '../data/models/Department.js';
import Program from '../data/models/Program.js';
import Term from '../data/models/Term.js';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri, { dbName: 'allocra-test-group' });
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

describe('Group Domain Logic (groupService)', () => {
  it('should create group under valid program and term', async () => {
    await institutionService.saveInstitution({ name: 'Group College', academicYear: '2026-27' });
    const dept = await departmentService.createDepartment({ name: 'CSE Dept' });
    const prog = await programService.createProgram({ departmentId: dept._id.toString(), name: 'B.Tech CSE' });
    const term = await termService.createTerm({ name: 'Semester 1' });

    const group = await groupService.createGroup({
      programId: prog._id.toString(),
      termId: term._id.toString(),
      name: 'CSE-A'
    });

    expect(group._id).toBeDefined();
    expect(group.name).toBe('CSE-A');
    expect(group.programId._id.toString()).toBe(prog._id.toString());
    expect(group.termId._id.toString()).toBe(term._id.toString());
  });

  it('should trim whitespace from group name', async () => {
    await institutionService.saveInstitution({ name: 'Group College', academicYear: '2026-27' });
    const dept = await departmentService.createDepartment({ name: 'CSE Dept' });
    const prog = await programService.createProgram({ departmentId: dept._id.toString(), name: 'B.Tech CSE' });
    const term = await termService.createTerm({ name: 'Semester 1' });

    const group = await groupService.createGroup({
      programId: prog._id.toString(),
      termId: term._id.toString(),
      name: '   CSE-B   '
    });

    expect(group.name).toBe('CSE-B');
  });

  it('should reject missing programId', async () => {
    await expect(
      groupService.createGroup({ programId: '', termId: new mongoose.Types.ObjectId().toString(), name: 'CSE-A' })
    ).rejects.toThrow('Program is required');
  });

  it('should reject missing termId', async () => {
    await expect(
      groupService.createGroup({ programId: new mongoose.Types.ObjectId().toString(), termId: '', name: 'CSE-A' })
    ).rejects.toThrow('Term is required');
  });

  it('should reject missing group name', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    await expect(
      groupService.createGroup({ programId: fakeId, termId: fakeId, name: '   ' })
    ).rejects.toThrow('Group name is required');
  });

  it('should reject invalid programId and termId format', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    await expect(
      groupService.createGroup({ programId: 'not-an-objectid', termId: fakeId, name: 'CSE-A' })
    ).rejects.toThrow('Invalid program ID');

    await expect(
      groupService.createGroup({ programId: fakeId, termId: 'not-an-objectid', name: 'CSE-A' })
    ).rejects.toThrow('Invalid term ID');
  });

  it('should reject nonexistent program or term', async () => {
    await institutionService.saveInstitution({ name: 'Group College', academicYear: '2026-27' });
    const dept = await departmentService.createDepartment({ name: 'CSE Dept' });
    const prog = await programService.createProgram({ departmentId: dept._id.toString(), name: 'B.Tech CSE' });
    const term = await termService.createTerm({ name: 'Semester 1' });

    const fakeId = new mongoose.Types.ObjectId().toString();

    await expect(
      groupService.createGroup({ programId: fakeId, termId: term._id.toString(), name: 'CSE-A' })
    ).rejects.toThrow('Program not found');

    await expect(
      groupService.createGroup({ programId: prog._id.toString(), termId: fakeId, name: 'CSE-A' })
    ).rejects.toThrow('Term not found');
  });

  it('should reject cross-institution program and term', async () => {
    // Institution 1 with its own Program
    const inst1 = await Institution.create({ name: 'College A', academicYear: '2026-27' });
    const dept1 = await Department.create({ institutionId: inst1._id, name: 'Dept A' });
    const prog1 = await Program.create({ institutionId: inst1._id, departmentId: dept1._id, name: 'Prog A' });

    // Institution 2 with its own Term
    const inst2 = await Institution.create({ name: 'College B', academicYear: '2026-27' });
    const term2 = await Term.create({ institutionId: inst2._id, name: 'Semester B', academicYear: '2026-27' });

    // Attempt to link prog1 (inst1) with term2 (inst2)
    await expect(
      groupService.createGroup({
        programId: prog1._id.toString(),
        termId: term2._id.toString(),
        name: 'Group Cross'
      })
    ).rejects.toThrow('Program and Term must belong to the same institution');
  });

  it('should retrieve groups populated with program and term', async () => {
    await institutionService.saveInstitution({ name: 'Group College', academicYear: '2026-27' });
    const dept = await departmentService.createDepartment({ name: 'CSE Dept' });
    const prog = await programService.createProgram({ departmentId: dept._id.toString(), name: 'B.Tech CSE' });
    const term = await termService.createTerm({ name: 'Semester 1' });

    await groupService.createGroup({
      programId: prog._id.toString(),
      termId: term._id.toString(),
      name: 'CSE-A'
    });

    const list = await groupService.getGroups();
    expect(list.length).toBe(1);
    expect(list[0].name).toBe('CSE-A');
    expect(list[0].programId.name).toBe('B.Tech CSE');
    expect(list[0].termId.name).toBe('Semester 1');
  });
});

describe('Group API Routes', () => {
  it('GET /api/groups should return empty list initially', async () => {
    const res = await request(app).get('/api/groups');
    expect(res.status).toBe(200);
    expect(res.body.groups).toEqual([]);
  });

  it('POST /api/groups should create group and return 201', async () => {
    await institutionService.saveInstitution({ name: 'Group College', academicYear: '2026-27' });
    const dept = await departmentService.createDepartment({ name: 'CSE Dept' });
    const prog = await programService.createProgram({ departmentId: dept._id.toString(), name: 'B.Tech CSE' });
    const term = await termService.createTerm({ name: 'Semester 1' });

    const res = await request(app)
      .post('/api/groups')
      .send({
        programId: prog._id.toString(),
        termId: term._id.toString(),
        name: 'CSE-A'
      });

    expect(res.status).toBe(201);
    expect(res.body.group.name).toBe('CSE-A');
  });

  it('POST /api/groups should return 404 for nonexistent program or term', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .post('/api/groups')
      .send({
        programId: fakeId,
        termId: fakeId,
        name: 'CSE-A'
      });

    expect(res.status).toBe(404);
  });
});
