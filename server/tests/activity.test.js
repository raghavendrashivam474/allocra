import request from 'supertest';
import app from '../app.js';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Institution from '../data/models/Institution.js';
import Department from '../data/models/Department.js';
import Program from '../data/models/Program.js';
import Term from '../data/models/Term.js';
import Group from '../data/models/Group.js';
import Activity from '../data/models/Activity.js';
import * as activityService from '../core/institution/academic-context/activityService.js';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Institution.deleteMany({});
  await Department.deleteMany({});
  await Program.deleteMany({});
  await Term.deleteMany({});
  await Group.deleteMany({});
  await Activity.deleteMany({});
});

async function setupAcademicContext() {
  const institution = await Institution.create({
    name: 'Tech University',
    academicYear: '2025-2026'
  });

  const department = await Department.create({
    institutionId: institution._id,
    name: 'Computer Science'
  });

  const program = await Program.create({
    institutionId: institution._id,
    departmentId: department._id,
    name: 'B.Tech CS'
  });

  const term = await Term.create({
    institutionId: institution._id,
    name: 'Fall 2025',
    academicYear: '2025-2026'
  });

  const group = await Group.create({
    institutionId: institution._id,
    programId: program._id,
    termId: term._id,
    name: 'CS-A'
  });

  return { institution, department, program, term, group };
}

describe('Activity Domain Logic (activityService)', () => {
  test('should return empty list when no activities exist', async () => {
    await setupAcademicContext();
    const list = await activityService.getActivities();
    expect(list).toEqual([]);
  });

  test('should create an activity under a valid group', async () => {
    const { group } = await setupAcademicContext();
    const activity = await activityService.createActivity({
      groupId: group._id,
      name: 'Data Structures'
    });

    expect(activity).toBeDefined();
    expect(activity.name).toBe('Data Structures');
    expect(activity.groupId._id.toString()).toBe(group._id.toString());
    expect(activity.groupId.name).toBe('CS-A');
  });

  test('should reject creation without group ID', async () => {
    await setupAcademicContext();
    await expect(activityService.createActivity({ name: 'Algorithms' }))
      .rejects.toThrow('Group is required');
  });

  test('should reject creation without activity name', async () => {
    const { group } = await setupAcademicContext();
    await expect(activityService.createActivity({ groupId: group._id, name: '' }))
      .rejects.toThrow('Activity name is required');
  });

  test('should reject invalid group ID format', async () => {
    await setupAcademicContext();
    await expect(activityService.createActivity({ groupId: 'invalid-id', name: 'Math' }))
      .rejects.toThrow('Invalid group ID');
  });

  test('should reject non-existent group', async () => {
    await setupAcademicContext();
    const fakeId = new mongoose.Types.ObjectId();
    await expect(activityService.createActivity({ groupId: fakeId, name: 'Physics' }))
      .rejects.toThrow('Group not found');
  });

  test('should reject group belonging to another institution (cross-institution protection)', async () => {
    const { group } = await setupAcademicContext();
    
    // Switch active institution by creating a newer one
    await Institution.create({
      name: 'Other University',
      academicYear: '2025-2026'
    });

    await expect(activityService.createActivity({
      groupId: group._id,
      name: 'Operating Systems'
    })).rejects.toThrow('Group does not belong to the current institution');
  });

  test('should reject duplicate activity name in the same group', async () => {
    const { group } = await setupAcademicContext();
    await activityService.createActivity({
      groupId: group._id,
      name: 'Database Systems'
    });

    await expect(activityService.createActivity({
      groupId: group._id,
      name: 'Database Systems'
    })).rejects.toThrow('An activity with this name already exists in this group');
  });
});

describe('Activity API Endpoints (/api/activities)', () => {
  test('GET /api/activities returns list of activities', async () => {
    const { group } = await setupAcademicContext();
    await activityService.createActivity({ groupId: group._id, name: 'Networks' });

    const res = await request(app).get('/api/activities');
    expect(res.status).toBe(200);
    expect(res.body.activities).toHaveLength(1);
    expect(res.body.activities[0].name).toBe('Networks');
  });

  test('POST /api/activities creates new activity successfully', async () => {
    const { group } = await setupAcademicContext();
    const res = await request(app)
      .post('/api/activities')
      .send({ groupId: group._id.toString(), name: 'Compiler Design' });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Activity created successfully');
    expect(res.body.activity.name).toBe('Compiler Design');
  });

  test('POST /api/activities returns 400 for validation errors', async () => {
    await setupAcademicContext();
    const res = await request(app)
      .post('/api/activities')
      .send({ name: 'No Group Given' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Group is required');
  });
});