import request from 'supertest';
import app from '../app.js';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Institution from '../data/models/Institution.js';
import Department from '../data/models/Department.js';
import Program from '../data/models/Program.js';
import Term from '../data/models/Term.js';
import Group from '../data/models/Group.js';
import Faculty from '../data/models/Faculty.js';
import Room from '../data/models/Room.js';
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
  await Faculty.deleteMany({});
  await Room.deleteMany({});
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

  const faculty1 = await Faculty.create({
    institutionId: institution._id,
    departmentId: department._id,
    name: 'Dr. Alan Turing'
  });

  const faculty2 = await Faculty.create({
    institutionId: institution._id,
    departmentId: department._id,
    name: 'Dr. Grace Hopper'
  });

  const room1 = await Room.create({
    institutionId: institution._id,
    name: 'Lab 101',
    type: 'Laboratory',
    capacity: 30
  });

  const room2 = await Room.create({
    institutionId: institution._id,
    name: 'LH 201',
    type: 'Classroom',
    capacity: 60
  });

  return { institution, department, program, term, group, faculty1, faculty2, room1, room2 };
}

describe('Activity Domain Logic — S2.3 Baseline (activityService)', () => {
  test('should return empty list when no activities exist', async () => {
    await setupAcademicContext();
    const list = await activityService.getActivities();
    expect(list).toEqual([]);
  });

  test('should create an activity under a valid group with empty relationships', async () => {
    const { group } = await setupAcademicContext();
    const activity = await activityService.createActivity({
      groupId: group._id,
      name: 'Data Structures'
    });

    expect(activity).toBeDefined();
    expect(activity.name).toBe('Data Structures');
    expect(activity.groupId._id.toString()).toBe(group._id.toString());
    expect(activity.groupId.name).toBe('CS-A');
    expect(activity.facultyIds).toEqual([]);
    expect(activity.roomIds).toEqual([]);
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

describe('Activity Domain Logic — S2.4 Relationships (activityService)', () => {
  test('should associate valid faculty references to an activity', async () => {
    const ctx = await setupAcademicContext();
    const activity = await activityService.createActivity({
      groupId: ctx.group._id,
      name: 'Algorithms'
    });

    const updated = await activityService.updateActivityRelationships(activity._id, {
      facultyIds: [ctx.faculty1._id, ctx.faculty2._id]
    });

    expect(updated.facultyIds).toHaveLength(2);
    expect(updated.facultyIds.map(f => f.name)).toContain('Dr. Alan Turing');
    expect(updated.facultyIds.map(f => f.name)).toContain('Dr. Grace Hopper');
    expect(updated.roomIds).toHaveLength(0);
  });

  test('should associate valid room references to an activity', async () => {
    const ctx = await setupAcademicContext();
    const activity = await activityService.createActivity({
      groupId: ctx.group._id,
      name: 'Algorithms'
    });

    const updated = await activityService.updateActivityRelationships(activity._id, {
      roomIds: [ctx.room1._id, ctx.room2._id]
    });

    expect(updated.roomIds).toHaveLength(2);
    expect(updated.roomIds.map(r => r.name)).toContain('Lab 101');
    expect(updated.roomIds.map(r => r.name)).toContain('LH 201');
    expect(updated.facultyIds).toHaveLength(0);
  });

  test('should independently manage faculty and room relationships', async () => {
    const ctx = await setupAcademicContext();
    const activity = await activityService.createActivity({
      groupId: ctx.group._id,
      name: 'Discrete Math'
    });

    // Step 1: Assign faculty
    const afterFaculty = await activityService.updateActivityRelationships(activity._id, {
      facultyIds: [ctx.faculty1._id]
    });
    expect(afterFaculty.facultyIds).toHaveLength(1);
    expect(afterFaculty.roomIds).toHaveLength(0);

    // Step 2: Assign rooms — faculty must be preserved
    const afterRooms = await activityService.updateActivityRelationships(activity._id, {
      roomIds: [ctx.room1._id]
    });
    expect(afterRooms.facultyIds).toHaveLength(1);
    expect(afterRooms.facultyIds[0].name).toBe('Dr. Alan Turing');
    expect(afterRooms.roomIds).toHaveLength(1);
    expect(afterRooms.roomIds[0].name).toBe('Lab 101');

    // Step 3: Update only faculty — rooms must be preserved
    const afterFacultyChange = await activityService.updateActivityRelationships(activity._id, {
      facultyIds: [ctx.faculty2._id]
    });
    expect(afterFacultyChange.facultyIds).toHaveLength(1);
    expect(afterFacultyChange.facultyIds[0].name).toBe('Dr. Grace Hopper');
    expect(afterFacultyChange.roomIds).toHaveLength(1);
    expect(afterFacultyChange.roomIds[0].name).toBe('Lab 101');
  });

  test('should clear faculty list intentionally with empty array without clearing rooms', async () => {
    const ctx = await setupAcademicContext();
    const activity = await activityService.createActivity({
      groupId: ctx.group._id,
      name: 'Calculus'
    });

    await activityService.updateActivityRelationships(activity._id, {
      facultyIds: [ctx.faculty1._id],
      roomIds: [ctx.room1._id]
    });

    const cleared = await activityService.updateActivityRelationships(activity._id, {
      facultyIds: []
    });

    expect(cleared.facultyIds).toEqual([]);
    expect(cleared.roomIds).toHaveLength(1);
    expect(cleared.roomIds[0].name).toBe('Lab 101');
  });

  test('should clear room list intentionally with empty array without clearing faculty', async () => {
    const ctx = await setupAcademicContext();
    const activity = await activityService.createActivity({
      groupId: ctx.group._id,
      name: 'Calculus'
    });

    await activityService.updateActivityRelationships(activity._id, {
      facultyIds: [ctx.faculty1._id],
      roomIds: [ctx.room1._id]
    });

    const cleared = await activityService.updateActivityRelationships(activity._id, {
      roomIds: []
    });

    expect(cleared.roomIds).toEqual([]);
    expect(cleared.facultyIds).toHaveLength(1);
    expect(cleared.facultyIds[0].name).toBe('Dr. Alan Turing');
  });

  test('should reject malformed activity ID', async () => {
    await setupAcademicContext();
    await expect(activityService.updateActivityRelationships('invalid-id', { facultyIds: [] }))
      .rejects.toThrow('Invalid activity ID');
  });

  test('should return 404 for non-existent activity', async () => {
    await setupAcademicContext();
    const fakeId = new mongoose.Types.ObjectId();
    await expect(activityService.updateActivityRelationships(fakeId, { facultyIds: [] }))
      .rejects.toThrow('Activity not found');
  });

  test('should reject activity belonging to another institution', async () => {
    const ctx = await setupAcademicContext();
    const activity = await activityService.createActivity({
      groupId: ctx.group._id,
      name: 'Security'
    });

    // Switch active institution
    await Institution.create({
      name: 'Other University',
      academicYear: '2025-2026'
    });

    await expect(activityService.updateActivityRelationships(activity._id, {
      facultyIds: [ctx.faculty1._id]
    })).rejects.toThrow('Activity does not belong to the current institution');
  });

  test('should reject malformed faculty ID in array', async () => {
    const ctx = await setupAcademicContext();
    const activity = await activityService.createActivity({
      groupId: ctx.group._id,
      name: 'AI'
    });

    await expect(activityService.updateActivityRelationships(activity._id, {
      facultyIds: ['not-a-real-id']
    })).rejects.toThrow('Invalid faculty ID format');
  });

  test('should reject malformed room ID in array', async () => {
    const ctx = await setupAcademicContext();
    const activity = await activityService.createActivity({
      groupId: ctx.group._id,
      name: 'AI'
    });

    await expect(activityService.updateActivityRelationships(activity._id, {
      roomIds: ['not-a-real-id']
    })).rejects.toThrow('Invalid room ID format');
  });

  test('should reject non-array facultyIds', async () => {
    const ctx = await setupAcademicContext();
    const activity = await activityService.createActivity({
      groupId: ctx.group._id,
      name: 'AI'
    });

    await expect(activityService.updateActivityRelationships(activity._id, {
      facultyIds: 'string-not-array'
    })).rejects.toThrow('facultyIds must be an array');
  });

  test('should reject non-array roomIds', async () => {
    const ctx = await setupAcademicContext();
    const activity = await activityService.createActivity({
      groupId: ctx.group._id,
      name: 'AI'
    });

    await expect(activityService.updateActivityRelationships(activity._id, {
      roomIds: 123
    })).rejects.toThrow('roomIds must be an array');
  });

  test('should reject non-existent faculty ID', async () => {
    const ctx = await setupAcademicContext();
    const activity = await activityService.createActivity({
      groupId: ctx.group._id,
      name: 'AI'
    });

    const fakeFacultyId = new mongoose.Types.ObjectId();
    await expect(activityService.updateActivityRelationships(activity._id, {
      facultyIds: [fakeFacultyId]
    })).rejects.toThrow('One or more faculty members not found or do not belong to this institution');
  });

  test('should reject non-existent room ID', async () => {
    const ctx = await setupAcademicContext();
    const activity = await activityService.createActivity({
      groupId: ctx.group._id,
      name: 'AI'
    });

    const fakeRoomId = new mongoose.Types.ObjectId();
    await expect(activityService.updateActivityRelationships(activity._id, {
      roomIds: [fakeRoomId]
    })).rejects.toThrow('One or more rooms not found or do not belong to this institution');
  });

  test('should reject cross-institution faculty reference', async () => {
    const ctx = await setupAcademicContext();
    const activity = await activityService.createActivity({
      groupId: ctx.group._id,
      name: 'Cloud Computing'
    });

    // Create another institution with its own faculty
    const otherInst = await Institution.create({
      name: 'Other University',
      academicYear: '2025-2026'
    });
    const otherDept = await Department.create({
      institutionId: otherInst._id,
      name: 'Other Dept'
    });
    const otherFaculty = await Faculty.create({
      institutionId: otherInst._id,
      departmentId: otherDept._id,
      name: 'Foreign Prof'
    });

    // Switch active back to original institution
    const originalInst = await Institution.findById(ctx.institution._id);
    originalInst.createdAt = new Date(Date.now() + 1000);
    await originalInst.save();

    await expect(activityService.updateActivityRelationships(activity._id, {
      facultyIds: [otherFaculty._id]
    })).rejects.toThrow('One or more faculty members not found or do not belong to this institution');
  });

  test('should reject cross-institution room reference', async () => {
    const ctx = await setupAcademicContext();
    const activity = await activityService.createActivity({
      groupId: ctx.group._id,
      name: 'Cloud Computing'
    });

    const otherInst = await Institution.create({
      name: 'Other University',
      academicYear: '2025-2026'
    });
    const otherRoom = await Room.create({
      institutionId: otherInst._id,
      name: 'Other Lab',
      type: 'Laboratory',
      capacity: 20
    });

    const originalInst = await Institution.findById(ctx.institution._id);
    originalInst.createdAt = new Date(Date.now() + 1000);
    await originalInst.save();

    await expect(activityService.updateActivityRelationships(activity._id, {
      roomIds: [otherRoom._id]
    })).rejects.toThrow('One or more rooms not found or do not belong to this institution');
  });

  test('should reject duplicate faculty IDs in submission', async () => {
    const ctx = await setupAcademicContext();
    const activity = await activityService.createActivity({
      groupId: ctx.group._id,
      name: 'Robotics'
    });

    await expect(activityService.updateActivityRelationships(activity._id, {
      facultyIds: [ctx.faculty1._id, ctx.faculty1._id]
    })).rejects.toThrow('Duplicate faculty IDs are not allowed');
  });

  test('should reject duplicate room IDs in submission', async () => {
    const ctx = await setupAcademicContext();
    const activity = await activityService.createActivity({
      groupId: ctx.group._id,
      name: 'Robotics'
    });

    await expect(activityService.updateActivityRelationships(activity._id, {
      roomIds: [ctx.room1._id, ctx.room1._id]
    })).rejects.toThrow('Duplicate room IDs are not allowed');
  });

  test('should not partially persist when one resource is valid and another is invalid', async () => {
    const ctx = await setupAcademicContext();
    const activity = await activityService.createActivity({
      groupId: ctx.group._id,
      name: 'Quantum'
    });

    const fakeFacultyId = new mongoose.Types.ObjectId();

    await expect(activityService.updateActivityRelationships(activity._id, {
      facultyIds: [ctx.faculty1._id, fakeFacultyId]
    })).rejects.toThrow();

    // Verify activity was NOT partially updated
    const fresh = await Activity.findById(activity._id);
    expect(fresh.facultyIds).toEqual([]);
  });

  test('should reject when no relationship fields are provided', async () => {
    const ctx = await setupAcademicContext();
    const activity = await activityService.createActivity({
      groupId: ctx.group._id,
      name: 'Ethics'
    });

    await expect(activityService.updateActivityRelationships(activity._id, {}))
      .rejects.toThrow('No relationship fields provided for update');
  });
});

describe('Activity API Endpoints (/api/activities)', () => {
  test('GET /api/activities returns activities with populated relationships', async () => {
    const ctx = await setupAcademicContext();
    const activity = await activityService.createActivity({
      groupId: ctx.group._id,
      name: 'Networks'
    });
    await activityService.updateActivityRelationships(activity._id, {
      facultyIds: [ctx.faculty1._id],
      roomIds: [ctx.room1._id]
    });

    const res = await request(app).get('/api/activities');
    expect(res.status).toBe(200);
    expect(res.body.activities).toHaveLength(1);
    expect(res.body.activities[0].name).toBe('Networks');
    expect(res.body.activities[0].facultyIds[0].name).toBe('Dr. Alan Turing');
    expect(res.body.activities[0].roomIds[0].name).toBe('Lab 101');
  });

  test('POST /api/activities creates new activity successfully', async () => {
    const ctx = await setupAcademicContext();
    const res = await request(app)
      .post('/api/activities')
      .send({ groupId: ctx.group._id.toString(), name: 'Compiler Design' });

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

  test('PUT /api/activities/:id/relationships updates relationships successfully', async () => {
    const ctx = await setupAcademicContext();
    const activity = await activityService.createActivity({
      groupId: ctx.group._id,
      name: 'Software Eng'
    });

    const res = await request(app)
      .put(`/api/activities/${activity._id}/relationships`)
      .send({
        facultyIds: [ctx.faculty1._id.toString()],
        roomIds: [ctx.room1._id.toString()]
      });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Activity relationships updated successfully');
    expect(res.body.activity.facultyIds).toHaveLength(1);
    expect(res.body.activity.facultyIds[0].name).toBe('Dr. Alan Turing');
    expect(res.body.activity.roomIds).toHaveLength(1);
    expect(res.body.activity.roomIds[0].name).toBe('Lab 101');
  });

  test('PUT /api/activities/:id/relationships returns 400 for invalid ID', async () => {
    await setupAcademicContext();
    const res = await request(app)
      .put('/api/activities/bad-id/relationships')
      .send({ facultyIds: [] });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid activity ID');
  });

  test('PUT /api/activities/:id/relationships returns 404 for non-existent activity', async () => {
    await setupAcademicContext();
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .put(`/api/activities/${fakeId}/relationships`)
      .send({ facultyIds: [] });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Activity not found');
  });

  test('PUT /api/activities/:id/relationships returns 400 for bad faculty ID', async () => {
    const ctx = await setupAcademicContext();
    const activity = await activityService.createActivity({
      groupId: ctx.group._id,
      name: 'Security'
    });

    const res = await request(app)
      .put(`/api/activities/${activity._id}/relationships`)
      .send({ facultyIds: ['not-an-id'] });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid faculty ID format');
  });
});
