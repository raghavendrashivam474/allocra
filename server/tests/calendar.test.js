import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app.js';
import * as institutionService from '../core/institution/institutionService.js';
import * as calendarService from '../core/institution/calendar/calendarService.js';
import Calendar from '../data/models/Calendar.js';
import Institution from '../data/models/Institution.js';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri, { dbName: 'allocra-test-calendar' });
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
  await Institution.deleteMany({});
  await Calendar.deleteMany({});
});

describe('Calendar Domain Service & API', () => {
  describe('Service Layer', () => {
    it('returns null when no institution exists', async () => {
      const calendar = await calendarService.getCalendar();
      expect(calendar).toBeNull();
    });

    it('returns null when institution exists but no calendar configured', async () => {
      await institutionService.saveInstitution({
        name: 'Test University',
        academicYear: '2026-27'
      });
      const calendar = await calendarService.getCalendar();
      expect(calendar).toBeNull();
    });

    it('fails to save calendar when institution is missing', async () => {
      await expect(
        calendarService.saveCalendar({ workingDays: ['MONDAY', 'TUESDAY'] })
      ).rejects.toThrow('Institution must be configured before setting calendar');
    });

    it('validates workingDays input types and correctness', async () => {
      await institutionService.saveInstitution({
        name: 'Test University',
        academicYear: '2026-27'
      });

      // Type checks
      await expect(
        calendarService.saveCalendar({ workingDays: 'MONDAY' })
      ).rejects.toThrow('workingDays must be an array');

      // Empty checks
      await expect(
        calendarService.saveCalendar({ workingDays: [] })
      ).rejects.toThrow('At least one working day is required');

      // Invalid day strings
      await expect(
        calendarService.saveCalendar({ workingDays: ['MONDAY', 'FUNDAY'] })
      ).rejects.toThrow('Invalid day(s): FUNDAY');
    });

    it('saves valid working days and ignores/deduplicates duplicates', async () => {
      await institutionService.saveInstitution({
        name: 'Test University',
        academicYear: '2026-27'
      });

      const saved = await calendarService.saveCalendar({
        workingDays: ['MONDAY', 'TUESDAY', 'MONDAY', 'WEDNESDAY']
      });

      expect(saved.workingDays).toEqual(['MONDAY', 'TUESDAY', 'WEDNESDAY']);

      const retrieved = await calendarService.getCalendar();
      expect(retrieved.workingDays).toEqual(['MONDAY', 'TUESDAY', 'WEDNESDAY']);
    });

    it('updates existing calendar on consecutive saves rather than duplicating', async () => {
      await institutionService.saveInstitution({
        name: 'Test University',
        academicYear: '2026-27'
      });

      await calendarService.saveCalendar({ workingDays: ['MONDAY', 'TUESDAY'] });
      await calendarService.saveCalendar({ workingDays: ['WEDNESDAY', 'THURSDAY', 'FRIDAY'] });

      const count = await Calendar.countDocuments();
      expect(count).toBe(1);

      const finalCal = await calendarService.getCalendar();
      expect(finalCal.workingDays).toEqual(['WEDNESDAY', 'THURSDAY', 'FRIDAY']);
    });
  });

  describe('API Endpoints (HTTP Layer)', () => {
    it('GET /api/calendar - returns null envelope when unconfigured', async () => {
      const res = await request(app)
        .get('/api/calendar')
        .expect(200);

      expect(res.body).toEqual({ calendar: null });
    });

    it('PUT /api/calendar - creates new configuration when valid', async () => {
      await institutionService.saveInstitution({
        name: 'Test University',
        academicYear: '2026-27'
      });

      const res = await request(app)
        .put('/api/calendar')
        .send({ workingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'] })
        .expect(200);

      expect(res.body.message).toBe('Calendar saved successfully');
      expect(res.body.calendar.workingDays).toEqual([
        'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'
      ]);
    });

    it('PUT /api/calendar - returns 400 when body is malformed/invalid', async () => {
      await institutionService.saveInstitution({
        name: 'Test University',
        academicYear: '2026-27'
      });

      const res = await request(app)
        .put('/api/calendar')
        .send({ workingDays: ['NOTADAY'] })
        .expect(400);

      expect(res.body.error).toMatch(/Invalid day\(s\)/);
    });
  });
});
