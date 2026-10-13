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
import Faculty from '../data/models/Faculty.js';
import Room from '../data/models/Room.js';
import Activity from '../data/models/Activity.js';
import * as activityValidationService from '../core/institution/academic-context/activityValidationService.js';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri, { dbName: 'allocra-test-activity-validation' });
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
    Faculty.deleteMany({}),
    Room.deleteMany({}),
    Activity.deleteMany({})
  ]);
});

async function setupBaselineAcademicFixture() {
  const institution = await Institution.create({
    name: 'Allocra Institute of Technology',
    code: 'AIT',
    academicYear: '2025-2026'
  });
  const department = await Department.create({
    name: 'Computer Science',
    code: 'CSE',
    institutionId: institution._id
  });
  const program = await Program.create({
    name: 'B.Tech CSE',
    code: 'BCSE',
    departmentId: department._id,
    institutionId: institution._id
  });
  const term = await Term.create({
    name: 'Semester 1',
    academicYear: '2025-2026',
    institutionId: institution._id
  });
  const group = await Group.create({
    name: 'Batch A',
    capacity: 40,
    programId: program._id,
    termId: term._id,
    institutionId: institution._id
  });
  const faculty = await Faculty.create({
    name: 'Dr. Alan Turing',
    departmentId: department._id,
    institutionId: institution._id
  });
  const room = await Room.create({
    name: 'Lab 101',
    type: 'Laboratory',
    capacity: 40,
    institutionId: institution._id
  });

  return { institution, department, program, term, group, faculty, room };
}

describe('Activity & Resource Validation Service & API', () => {

  // ── 1. Empty & Context Handling ──

  it('returns not_configured status when no institution exists', async () => {
    const result = await activityValidationService.validateConfiguration();
    expect(result.summary.status).toBe('not_configured');
    expect(result.summary.activityCount).toBe(0);
    expect(result.summary.validActivityCount).toBe(0);
    expect(result.summary.errorCount).toBe(0);
    expect(result.findings).toEqual([]);

    const res = await request(app).get('/api/activities/validation');
    expect(res.status).toBe(200);
    expect(res.body.summary.status).toBe('not_configured');
  });

  it('returns no_activities status when institution exists but has zero activities', async () => {
    await setupBaselineAcademicFixture();
    const result = await activityValidationService.validateConfiguration();
    expect(result.summary.status).toBe('no_activities');
    expect(result.summary.activityCount).toBe(0);
    expect(result.summary.validActivityCount).toBe(0);
    expect(result.summary.errorCount).toBe(0);
    expect(result.findings).toHaveLength(0);

    const res = await request(app).get('/api/activities/validation');
    expect(res.status).toBe(200);
    expect(res.body.summary.status).toBe('no_activities');
  });

  // ── 2. Fully Valid Configuration ──

  it('returns ready status when all activities have eligible faculty and rooms', async () => {
    const { institution, group, faculty, room } = await setupBaselineAcademicFixture();

    await Activity.create({
      institutionId: institution._id,
      groupId: group._id,
      name: 'Algorithms',
      facultyIds: [faculty._id],
      roomIds: [room._id]
    });

    const res = await request(app).get('/api/activities/validation');
    expect(res.status).toBe(200);
    expect(res.body.summary.status).toBe('ready');
    expect(res.body.summary.activityCount).toBe(1);
    expect(res.body.summary.validActivityCount).toBe(1);
    expect(res.body.summary.errorCount).toBe(0);
    expect(res.body.summary.warningCount).toBe(0);
    expect(res.body.findings).toHaveLength(0);
  });

  // ── 3. Rule A: Missing Eligible Faculty ──

  it('detects ACTIVITY_NO_ELIGIBLE_FACULTY when facultyIds is empty', async () => {
    const { institution, group, room } = await setupBaselineAcademicFixture();

    await Activity.create({
      institutionId: institution._id,
      groupId: group._id,
      name: 'Algorithms',
      facultyIds: [],
      roomIds: [room._id]
    });

    const res = await request(app).get('/api/activities/validation');
    expect(res.status).toBe(200);
    expect(res.body.summary.status).toBe('needs_attention');
    expect(res.body.summary.activityCount).toBe(1);
    expect(res.body.summary.validActivityCount).toBe(0);
    expect(res.body.summary.errorCount).toBe(1);

    const finding = res.body.findings.find(f => f.code === 'ACTIVITY_NO_ELIGIBLE_FACULTY');
    expect(finding).toBeDefined();
    expect(finding.severity).toBe('error');
    expect(finding.entityType).toBe('activity');
    expect(finding.entityName).toBe('Algorithms');
    expect(finding.action.type).toBe('configure_activity_resources');
  });

  // ── 4. Rule B: Missing Eligible Rooms ──

  it('detects ACTIVITY_NO_ELIGIBLE_ROOMS when roomIds is empty', async () => {
    const { institution, group, faculty } = await setupBaselineAcademicFixture();

    await Activity.create({
      institutionId: institution._id,
      groupId: group._id,
      name: 'Data Structures',
      facultyIds: [faculty._id],
      roomIds: []
    });

    const res = await request(app).get('/api/activities/validation');
    expect(res.status).toBe(200);
    expect(res.body.summary.status).toBe('needs_attention');
    expect(res.body.summary.errorCount).toBe(1);

    const finding = res.body.findings.find(f => f.code === 'ACTIVITY_NO_ELIGIBLE_ROOMS');
    expect(finding).toBeDefined();
    expect(finding.severity).toBe('error');
    expect(finding.entityName).toBe('Data Structures');
  });

  // ── 5. Multiple Deficiencies on One Activity ──

  it('flags both missing faculty and missing rooms on an unconfigured activity', async () => {
    const { institution, group } = await setupBaselineAcademicFixture();

    await Activity.create({
      institutionId: institution._id,
      groupId: group._id,
      name: 'Physics Lab',
      facultyIds: [],
      roomIds: []
    });

    const res = await request(app).get('/api/activities/validation');
    expect(res.status).toBe(200);
    expect(res.body.summary.status).toBe('needs_attention');
    expect(res.body.summary.activityCount).toBe(1);
    expect(res.body.summary.validActivityCount).toBe(0);
    expect(res.body.summary.errorCount).toBe(2);

    const codes = res.body.findings.map(f => f.code);
    expect(codes).toContain('ACTIVITY_NO_ELIGIBLE_FACULTY');
    expect(codes).toContain('ACTIVITY_NO_ELIGIBLE_ROOMS');
  });

  // ── 6. Rule C: Stale Faculty Reference ──

  it('detects ACTIVITY_STALE_FACULTY_REFERENCE when referenced faculty no longer exists', async () => {
    const { institution, group, room } = await setupBaselineAcademicFixture();
    const ghostFacultyId = new mongoose.Types.ObjectId();

    await Activity.create({
      institutionId: institution._id,
      groupId: group._id,
      name: 'Operating Systems',
      facultyIds: [ghostFacultyId],
      roomIds: [room._id]
    });

    const res = await request(app).get('/api/activities/validation');
    expect(res.status).toBe(200);
    expect(res.body.summary.status).toBe('needs_attention');

    const finding = res.body.findings.find(f => f.code === 'ACTIVITY_STALE_FACULTY_REFERENCE');
    expect(finding).toBeDefined();
    expect(finding.severity).toBe('error');
    expect(finding.entityName).toBe('Operating Systems');
  });

  // ── 7. Rule D: Stale Room Reference ──

  it('detects ACTIVITY_STALE_ROOM_REFERENCE when referenced room no longer exists', async () => {
    const { institution, group, faculty } = await setupBaselineAcademicFixture();
    const ghostRoomId = new mongoose.Types.ObjectId();

    await Activity.create({
      institutionId: institution._id,
      groupId: group._id,
      name: 'Database Systems',
      facultyIds: [faculty._id],
      roomIds: [ghostRoomId]
    });

    const res = await request(app).get('/api/activities/validation');
    expect(res.status).toBe(200);
    expect(res.body.summary.status).toBe('needs_attention');

    const finding = res.body.findings.find(f => f.code === 'ACTIVITY_STALE_ROOM_REFERENCE');
    expect(finding).toBeDefined();
    expect(finding.severity).toBe('error');
    expect(finding.entityName).toBe('Database Systems');
  });

  // ── 8. Rule E: Stale Group Reference ──

  it('detects ACTIVITY_INVALID_GROUP when referenced group no longer exists', async () => {
    const { institution, faculty, room } = await setupBaselineAcademicFixture();
    const ghostGroupId = new mongoose.Types.ObjectId();

    await Activity.create({
      institutionId: institution._id,
      groupId: ghostGroupId,
      name: 'Computer Networks',
      facultyIds: [faculty._id],
      roomIds: [room._id]
    });

    const res = await request(app).get('/api/activities/validation');
    expect(res.status).toBe(200);
    expect(res.body.summary.status).toBe('needs_attention');

    const finding = res.body.findings.find(f => f.code === 'ACTIVITY_INVALID_GROUP');
    expect(finding).toBeDefined();
    expect(finding.severity).toBe('error');
    expect(finding.entityName).toBe('Computer Networks');
  });

  // ── 9. Multi-Activity Aggregate Summary ──

  it('computes correct aggregate counts across multiple activities', async () => {
    const { institution, group, faculty, room } = await setupBaselineAcademicFixture();

    // Valid activity
    await Activity.create({
      institutionId: institution._id,
      groupId: group._id,
      name: 'Alpha Course',
      facultyIds: [faculty._id],
      roomIds: [room._id]
    });

    // Invalid: missing faculty
    await Activity.create({
      institutionId: institution._id,
      groupId: group._id,
      name: 'Beta Course',
      facultyIds: [],
      roomIds: [room._id]
    });

    // Invalid: missing rooms
    await Activity.create({
      institutionId: institution._id,
      groupId: group._id,
      name: 'Gamma Course',
      facultyIds: [faculty._id],
      roomIds: []
    });

    const res = await request(app).get('/api/activities/validation');
    expect(res.status).toBe(200);
    expect(res.body.summary.status).toBe('needs_attention');
    expect(res.body.summary.activityCount).toBe(3);
    expect(res.body.summary.validActivityCount).toBe(1);
    expect(res.body.summary.errorCount).toBe(2);
    expect(res.body.findings).toHaveLength(2);
  });

  // ── 10. Deterministic Findings Ordering ──

  it('sorts findings deterministically by entityName then finding code', async () => {
    const { institution, group } = await setupBaselineAcademicFixture();

    await Activity.create({
      institutionId: institution._id,
      groupId: group._id,
      name: 'Zeta',
      facultyIds: [],
      roomIds: []
    });

    await Activity.create({
      institutionId: institution._id,
      groupId: group._id,
      name: 'Alpha',
      facultyIds: [],
      roomIds: []
    });

    const res = await request(app).get('/api/activities/validation');
    expect(res.status).toBe(200);
    expect(res.body.findings).toHaveLength(4);
    expect(res.body.findings[0].entityName).toBe('Alpha');
    expect(res.body.findings[1].entityName).toBe('Alpha');
    expect(res.body.findings[2].entityName).toBe('Zeta');
    expect(res.body.findings[3].entityName).toBe('Zeta');
  });

  // ── 11. Read-Only Guarantee: No Mutations ──

  it('does not mutate or alter any domain records during validation', async () => {
    const { institution, group } = await setupBaselineAcademicFixture();
    const ghostFacultyId = new mongoose.Types.ObjectId();

    const created = await Activity.create({
      institutionId: institution._id,
      groupId: group._id,
      name: 'Untouched Activity',
      facultyIds: [ghostFacultyId],
      roomIds: []
    });

    await request(app).get('/api/activities/validation');

    const after = await Activity.findById(created._id);
    expect(after.name).toBe('Untouched Activity');
    expect(after.facultyIds).toHaveLength(1);
    expect(after.facultyIds[0].toString()).toBe(ghostFacultyId.toString());
    expect(after.roomIds).toHaveLength(0);
  });

  // ── 12. Institution Isolation ──

  it('ignores resources and activities from other institutions', async () => {
    const instA = await Institution.create({ name: 'Inst A', code: 'IA', academicYear: '2025' });
    const instB = await Institution.create({ name: 'Inst B', code: 'IB', academicYear: '2025' });

    const deptB = await Department.create({ name: 'Dept B', code: 'DB', institutionId: instB._id });
    const progB = await Program.create({ name: 'Prog B', code: 'PB', departmentId: deptB._id, institutionId: instB._id });
    const termB = await Term.create({ name: 'Term B', academicYear: '2025', institutionId: instB._id });
    const groupB = await Group.create({ name: 'Grp B', capacity: 30, programId: progB._id, termId: termB._id, institutionId: instB._id });

    // Activity in active institution (instB, latest created) referencing Faculty from instA
    const facultyA = await Faculty.create({ name: 'Faculty A', departmentId: deptB._id, institutionId: instA._id });

    await Activity.create({
      institutionId: instB._id,
      groupId: groupB._id,
      name: 'Cross-Institution Activity',
      facultyIds: [facultyA._id],
      roomIds: []
    });

    const res = await request(app).get('/api/activities/validation');
    expect(res.status).toBe(200);
    // Faculty from instA should be treated as non-existent in instB -> STALE reference
    const staleFaculty = res.body.findings.find(f => f.code === 'ACTIVITY_STALE_FACULTY_REFERENCE');
    expect(staleFaculty).toBeDefined();
  });
});
