import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app.js';

import Institution from '../data/models/Institution.js';
import Department from '../data/models/Department.js';
import Program from '../data/models/Program.js';
import Term from '../data/models/Term.js';
import Group from '../data/models/Group.js';
import Calendar from '../data/models/Calendar.js';
import TimeModel from '../data/models/TimeModel.js';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri, { dbName: 'allocra-test-setup-readiness' });
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
  await Promise.all([
    Institution.deleteMany({}),
    Department.deleteMany({}),
    Program.deleteMany({}),
    Term.deleteMany({}),
    Group.deleteMany({}),
    Calendar.deleteMany({}),
    TimeModel.deleteMany({})
  ]);
});

describe('Setup Readiness API and Service', () => {
  it('GET /api/setup/readiness returns incomplete when no institution exists', async () => {
    const res = await request(app).get('/api/setup/readiness');

    expect(res.status).toBe(200);
    expect(res.body.ready).toBe(false);
    expect(res.body.checks).toHaveLength(5);
    
    const institutionCheck = res.body.checks.find(c => c.key === 'institution');
    expect(institutionCheck).toBeDefined();
    expect(institutionCheck.status).toBe('incomplete');

    // All checks should be incomplete
    res.body.checks.forEach(c => {
      expect(c.status).toBe('incomplete');
    });
  });

  it('detects incomplete academic structure (missing departments or programs)', async () => {
    // 1. Create institution only
    const institution = await Institution.create({
      name: 'Engineering College',
      code: 'EC01',
      academicYear: '2025-2026'
    });

    let res = await request(app).get('/api/setup/readiness');
    expect(res.status).toBe(200);
    expect(res.body.ready).toBe(false);

    let structCheck = res.body.checks.find(c => c.key === 'academic-structure');
    expect(structCheck.status).toBe('incomplete');
    expect(structCheck.message).toContain('department');

    // 2. Create only department
    const dept = await Department.create({
      name: 'Computer Science',
      code: 'CSE',
      institutionId: institution._id
    });

    res = await request(app).get('/api/setup/readiness');
    structCheck = res.body.checks.find(c => c.key === 'academic-structure');
    expect(structCheck.status).toBe('incomplete');
    expect(structCheck.message).toContain('program');

    // 3. Create program
    await Program.create({
      name: 'B.Tech CSE',
      code: 'BCSE',
      departmentId: dept._id,
      institutionId: institution._id
    });

    res = await request(app).get('/api/setup/readiness');
    structCheck = res.body.checks.find(c => c.key === 'academic-structure');
    expect(structCheck.status).toBe('complete');
    expect(structCheck.message).toContain('1 department(s) and 1 program(s)');
  });

  it('detects incomplete terms & groups', async () => {
    const institution = await Institution.create({
      name: 'Science College',
      code: 'SC01',
      academicYear: '2025-2026'
    });
    const dept = await Department.create({
      name: 'Physics',
      code: 'PHY',
      institutionId: institution._id
    });
    const program = await Program.create({
      name: 'B.Sc Physics',
      code: 'BPHY',
      departmentId: dept._id,
      institutionId: institution._id
    });

    // Without term or group
    let res = await request(app).get('/api/setup/readiness');
    let tgCheck = res.body.checks.find(c => c.key === 'terms-groups');
    expect(tgCheck.status).toBe('incomplete');

    // Create term only
    const term = await Term.create({
      name: 'Fall 2025',
      academicYear: '2025-2026',
      institutionId: institution._id
    });

    res = await request(app).get('/api/setup/readiness');
    tgCheck = res.body.checks.find(c => c.key === 'terms-groups');
    expect(tgCheck.status).toBe('incomplete');
    expect(tgCheck.message).toContain('group');

    // Create group
    await Group.create({
      name: 'Section A',
      capacity: 60,
      programId: program._id,
      termId: term._id,
      institutionId: institution._id
    });

    res = await request(app).get('/api/setup/readiness');
    tgCheck = res.body.checks.find(c => c.key === 'terms-groups');
    expect(tgCheck.status).toBe('complete');
  });

  it('detects incomplete calendar and time model', async () => {
    const institution = await Institution.create({
      name: 'Arts College',
      code: 'AC01',
      academicYear: '2025-2026'
    });

    let res = await request(app).get('/api/setup/readiness');
    let calCheck = res.body.checks.find(c => c.key === 'calendar');
    let tmCheck = res.body.checks.find(c => c.key === 'time-model');

    expect(calCheck.status).toBe('incomplete');
    expect(tmCheck.status).toBe('incomplete');

    // Configure Calendar
    await Calendar.create({
      institutionId: institution._id,
      workingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']
    });

    res = await request(app).get('/api/setup/readiness');
    calCheck = res.body.checks.find(c => c.key === 'calendar');
    expect(calCheck.status).toBe('complete');
    expect(calCheck.message).toContain('5 working day(s)');

    // Configure TimeModel
    await TimeModel.create({
      institutionId: institution._id,
      periods: [
        { name: 'P1', startTime: '09:00', endTime: '10:00' },
        { name: 'P2', startTime: '10:00', endTime: '11:00' }
      ],
      breaks: [
        { name: 'Short Break', startTime: '11:00', endTime: '11:15' }
      ]
    });

    res = await request(app).get('/api/setup/readiness');
    tmCheck = res.body.checks.find(c => c.key === 'time-model');
    expect(tmCheck.status).toBe('complete');
    expect(tmCheck.message).toContain('2 period(s) and 1 break(s)');
  });

  it('returns ready: true when fully configured', async () => {
    // 1. Institution
    const institution = await Institution.create({
      name: 'Allocra Institute of Technology',
      code: 'AIT',
      academicYear: '2025-2026'
    });

    // 2. Academic Structure
    const dept = await Department.create({
      name: 'Computer Science',
      code: 'CSE',
      institutionId: institution._id
    });
    const prog = await Program.create({
      name: 'B.Tech CSE',
      code: 'BCSE',
      departmentId: dept._id,
      institutionId: institution._id
    });

    // 3. Terms & Groups
    const term = await Term.create({
      name: 'Semester 1',
      academicYear: '2025-2026',
      institutionId: institution._id
    });
    await Group.create({
      name: 'Batch A',
      capacity: 40,
      programId: prog._id,
      termId: term._id,
      institutionId: institution._id
    });

    // 4. Calendar
    await Calendar.create({
      institutionId: institution._id,
      workingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']
    });

    // 5. Time Model
    await TimeModel.create({
      institutionId: institution._id,
      periods: [
        { name: 'Period 1', startTime: '09:00', endTime: '10:00' }
      ],
      breaks: []
    });

    const res = await request(app).get('/api/setup/readiness');
    expect(res.status).toBe(200);
    expect(res.body.ready).toBe(true);
    expect(res.body.checks).toHaveLength(5);
    res.body.checks.forEach(c => {
      expect(c.status).toBe('complete');
    });
  });
});
