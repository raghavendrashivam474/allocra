import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app.js';
import * as institutionService from '../core/institution/institutionService.js';
import * as roomService from '../core/institution/resources/rooms/roomService.js';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri, { dbName: 'allocra-test-room' });
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

describe('Room Domain Logic (roomService)', () => {
  it('should create room under configured institution', async () => {
    const inst = await institutionService.saveInstitution({ name: 'Room Test Univ', academicYear: '2026-27' });

    const room = await roomService.createRoom({
      name: 'Hall 101',
      type: 'Classroom',
      capacity: 60
    });

    expect(room._id).toBeDefined();
    expect(room.name).toBe('Hall 101');
    expect(room.type).toBe('Classroom');
    expect(room.capacity).toBe(60);
    expect(room.institutionId.toString()).toBe(inst._id.toString());
  });

  it('should trim room name', async () => {
    await institutionService.saveInstitution({ name: 'Room Test Univ', academicYear: '2026-27' });

    const room = await roomService.createRoom({
      name: '   Lab 204   ',
      type: 'Laboratory',
      capacity: 35
    });

    expect(room.name).toBe('Lab 204');
  });

  it('should reject creation when institution is not configured', async () => {
    await expect(
      roomService.createRoom({ name: 'Hall 101', type: 'Classroom', capacity: 60 })
    ).rejects.toThrow('Institution must be configured before adding rooms');
  });

  it('should reject missing or empty room name', async () => {
    await institutionService.saveInstitution({ name: 'Room Test Univ', academicYear: '2026-27' });

    await expect(
      roomService.createRoom({ name: '   ', type: 'Classroom', capacity: 60 })
    ).rejects.toThrow('Room name is required');
  });

  it('should reject invalid room type', async () => {
    await institutionService.saveInstitution({ name: 'Room Test Univ', academicYear: '2026-27' });

    await expect(
      roomService.createRoom({ name: 'Hall 101', type: 'SwimmingPool', capacity: 60 })
    ).rejects.toThrow('Invalid room type');
  });

  it('should reject invalid capacity values', async () => {
    await institutionService.saveInstitution({ name: 'Room Test Univ', academicYear: '2026-27' });

    // Zero
    await expect(
      roomService.createRoom({ name: 'Hall 101', type: 'Classroom', capacity: 0 })
    ).rejects.toThrow('Capacity must be a positive integer');

    // Negative
    await expect(
      roomService.createRoom({ name: 'Hall 102', type: 'Classroom', capacity: -10 })
    ).rejects.toThrow('Capacity must be a positive integer');

    // Non-integer
    await expect(
      roomService.createRoom({ name: 'Hall 103', type: 'Classroom', capacity: 45.5 })
    ).rejects.toThrow('Capacity must be a positive integer');

    // Non-numeric
    await expect(
      roomService.createRoom({ name: 'Hall 104', type: 'Classroom', capacity: 'sixty' })
    ).rejects.toThrow('Capacity must be a positive integer');
  });

  it('should reject duplicate room names within the same institution', async () => {
    await institutionService.saveInstitution({ name: 'Room Test Univ', academicYear: '2026-27' });

    await roomService.createRoom({ name: 'Room 101', type: 'Classroom', capacity: 50 });

    await expect(
      roomService.createRoom({ name: 'room 101', type: 'Seminar Room', capacity: 30 })
    ).rejects.toThrow("Room 'room 101' already exists in this institution");
  });

  it('should retrieve list of rooms for active institution', async () => {
    await institutionService.saveInstitution({ name: 'Room Test Univ', academicYear: '2026-27' });

    await roomService.createRoom({ name: 'Hall A', type: 'Auditorium', capacity: 200 });
    await roomService.createRoom({ name: 'Lab B', type: 'Laboratory', capacity: 40 });

    const rooms = await roomService.getRooms();
    expect(rooms.length).toBe(2);
    expect(rooms[0].name).toBe('Hall A');
    expect(rooms[0].capacity).toBe(200);
    expect(rooms[1].name).toBe('Lab B');
  });
});

describe('Room API Routes', () => {
  it('GET /api/rooms should return empty list initially', async () => {
    const res = await request(app).get('/api/rooms');
    expect(res.status).toBe(200);
    expect(res.body.rooms).toEqual([]);
    expect(res.body.roomTypes).toBeDefined();
  });

  it('POST /api/rooms should create room and return 201', async () => {
    await institutionService.saveInstitution({ name: 'Room API Univ', academicYear: '2026-27' });

    const res = await request(app)
      .post('/api/rooms')
      .send({
        name: 'Seminar Hall 1',
        type: 'Seminar Room',
        capacity: 75
      });

    expect(res.status).toBe(201);
    expect(res.body.room.name).toBe('Seminar Hall 1');
    expect(res.body.room.type).toBe('Seminar Room');
    expect(res.body.room.capacity).toBe(75);
    expect(res.body.message).toBe('Room created successfully');
  });

  it('POST /api/rooms should return 400 for validation errors', async () => {
    await institutionService.saveInstitution({ name: 'Room API Univ', academicYear: '2026-27' });

    const res = await request(app)
      .post('/api/rooms')
      .send({
        name: '',
        type: 'Classroom',
        capacity: 50
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Room name is required');
  });
});
