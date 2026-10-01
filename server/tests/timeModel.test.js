import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app.js';
import * as institutionService from '../core/institution/institutionService.js';
import * as timeModelService from '../core/institution/time-model/timeModelService.js';
import TimeModel from '../data/models/TimeModel.js';
import Institution from '../data/models/Institution.js';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri, { dbName: 'allocra-test-timemodel' });
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
  await TimeModel.deleteMany({});
});

describe('Time Model Domain Service & API', () => {
  describe('Service Layer — Retrieval', () => {
    it('returns null when no institution exists', async () => {
      const result = await timeModelService.getTimeModel();
      expect(result).toBeNull();
    });

    it('returns null when institution exists but no time model configured', async () => {
      await institutionService.saveInstitution({
        name: 'Test University',
        academicYear: '2026-27'
      });
      const result = await timeModelService.getTimeModel();
      expect(result).toBeNull();
    });
  });

  describe('Service Layer — Validation & Errors', () => {
    it('fails to save time model when institution is missing', async () => {
      await expect(
        timeModelService.saveTimeModel({
          periods: [{ name: 'Period 1', startTime: '09:00', endTime: '09:50' }],
          breaks: []
        })
      ).rejects.toThrow('Institution must be configured before setting time model');
    });

    it('validates input array types', async () => {
      await institutionService.saveInstitution({
        name: 'Test University',
        academicYear: '2026-27'
      });

      await expect(
        timeModelService.saveTimeModel({ periods: 'not an array', breaks: [] })
      ).rejects.toThrow('periods must be an array');

      await expect(
        timeModelService.saveTimeModel({ periods: [], breaks: 'not an array' })
      ).rejects.toThrow('breaks must be an array');
    });

    it('validates required fields on periods and breaks', async () => {
      await institutionService.saveInstitution({
        name: 'Test University',
        academicYear: '2026-27'
      });

      await expect(
        timeModelService.saveTimeModel({
          periods: [{ name: '', startTime: '09:00', endTime: '09:50' }],
          breaks: []
        })
      ).rejects.toThrow('Each period must have name, startTime, and endTime');

      await expect(
        timeModelService.saveTimeModel({
          periods: [],
          breaks: [{ name: 'Break', startTime: '10:40', endTime: '' }]
        })
      ).rejects.toThrow('Each break must have name, startTime, and endTime');
    });

    it('validates time format (HH:mm 24-hour)', async () => {
      await institutionService.saveInstitution({
        name: 'Test University',
        academicYear: '2026-27'
      });

      await expect(
        timeModelService.saveTimeModel({
          periods: [{ name: 'Period 1', startTime: '9:00', endTime: '09:50' }],
          breaks: []
        })
      ).rejects.toThrow(/Invalid time format/);

      await expect(
        timeModelService.saveTimeModel({
          periods: [{ name: 'Period 1', startTime: '25:00', endTime: '26:00' }],
          breaks: []
        })
      ).rejects.toThrow(/Invalid time format/);
    });

    it('rejects start time equal to end time', async () => {
      await institutionService.saveInstitution({
        name: 'Test University',
        academicYear: '2026-27'
      });

      await expect(
        timeModelService.saveTimeModel({
          periods: [{ name: 'Period 1', startTime: '09:00', endTime: '09:00' }],
          breaks: []
        })
      ).rejects.toThrow(/startTime must be strictly before endTime/);
    });

    it('rejects start time after end time', async () => {
      await institutionService.saveInstitution({
        name: 'Test University',
        academicYear: '2026-27'
      });

      await expect(
        timeModelService.saveTimeModel({
          periods: [{ name: 'Period 1', startTime: '10:00', endTime: '09:00' }],
          breaks: []
        })
      ).rejects.toThrow(/startTime must be strictly before endTime/);
    });

    it('rejects overlapping periods', async () => {
      await institutionService.saveInstitution({
        name: 'Test University',
        academicYear: '2026-27'
      });

      await expect(
        timeModelService.saveTimeModel({
          periods: [
            { name: 'Period 1', startTime: '09:00', endTime: '10:00' },
            { name: 'Period 2', startTime: '09:30', endTime: '10:30' }
          ],
          breaks: []
        })
      ).rejects.toThrow(/overlaps with Period "Period 1"/);
    });

    it('rejects overlapping breaks', async () => {
      await institutionService.saveInstitution({
        name: 'Test University',
        academicYear: '2026-27'
      });

      await expect(
        timeModelService.saveTimeModel({
          periods: [],
          breaks: [
            { name: 'Tea Break', startTime: '10:00', endTime: '10:30' },
            { name: 'Snack Break', startTime: '10:15', endTime: '10:45' }
          ]
        })
      ).rejects.toThrow(/overlaps with Break "Tea Break"/);
    });

    it('rejects period and break overlap', async () => {
      await institutionService.saveInstitution({
        name: 'Test University',
        academicYear: '2026-27'
      });

      await expect(
        timeModelService.saveTimeModel({
          periods: [
            { name: 'Period 1', startTime: '09:00', endTime: '10:00' }
          ],
          breaks: [
            { name: 'Morning Break', startTime: '09:30', endTime: '09:45' }
          ]
        })
      ).rejects.toThrow(/overlaps with/);
    });
  });

  describe('Service Layer — Creation, Ordering & Deduplication', () => {
    it('accepts touching intervals (consecutive periods and breaks)', async () => {
      await institutionService.saveInstitution({
        name: 'Test University',
        academicYear: '2026-27'
      });

      const saved = await timeModelService.saveTimeModel({
        periods: [
          { name: 'Period 1', startTime: '09:00', endTime: '09:50' },
          { name: 'Period 2', startTime: '09:50', endTime: '10:40' }
        ],
        breaks: [
          { name: 'Short Break', startTime: '10:40', endTime: '11:00' }
        ]
      });

      expect(saved.periods).toHaveLength(2);
      expect(saved.breaks).toHaveLength(1);
      expect(saved.periods[0].name).toBe('Period 1');
      expect(saved.periods[1].name).toBe('Period 2');
      expect(saved.breaks[0].name).toBe('Short Break');
    });

    it('ensures deterministic chronological ordering by startTime', async () => {
      await institutionService.saveInstitution({
        name: 'Test University',
        academicYear: '2026-27'
      });

      // Submit periods in reverse order
      const saved = await timeModelService.saveTimeModel({
        periods: [
          { name: 'Period 3', startTime: '11:00', endTime: '11:50' },
          { name: 'Period 1', startTime: '09:00', endTime: '09:50' },
          { name: 'Period 2', startTime: '09:50', endTime: '10:40' }
        ],
        breaks: []
      });

      expect(saved.periods[0].name).toBe('Period 1');
      expect(saved.periods[1].name).toBe('Period 2');
      expect(saved.periods[2].name).toBe('Period 3');

      const retrieved = await timeModelService.getTimeModel();
      expect(retrieved.periods[0].name).toBe('Period 1');
      expect(retrieved.periods[1].name).toBe('Period 2');
      expect(retrieved.periods[2].name).toBe('Period 3');
    });

    it('updates existing time model on consecutive saves without creating duplicates', async () => {
      await institutionService.saveInstitution({
        name: 'Test University',
        academicYear: '2026-27'
      });

      await timeModelService.saveTimeModel({
        periods: [{ name: 'Period 1', startTime: '09:00', endTime: '09:50' }],
        breaks: []
      });

      await timeModelService.saveTimeModel({
        periods: [
          { name: 'Period 1', startTime: '08:30', endTime: '09:20' },
          { name: 'Period 2', startTime: '09:20', endTime: '10:10' }
        ],
        breaks: [
          { name: 'Breakfast', startTime: '10:10', endTime: '10:30' }
        ]
      });

      const count = await TimeModel.countDocuments();
      expect(count).toBe(1);

      const finalModel = await timeModelService.getTimeModel();
      expect(finalModel.periods).toHaveLength(2);
      expect(finalModel.breaks).toHaveLength(1);
      expect(finalModel.periods[0].startTime).toBe('08:30');
    });
  });

  describe('API Endpoints (HTTP Layer)', () => {
    it('GET /api/time-model - returns null envelope when unconfigured', async () => {
      const res = await request(app)
        .get('/api/time-model')
        .expect(200);

      expect(res.body).toEqual({ timeModel: null });
    });

    it('PUT /api/time-model - saves valid configuration', async () => {
      await institutionService.saveInstitution({
        name: 'Test University',
        academicYear: '2026-27'
      });

      const res = await request(app)
        .put('/api/time-model')
        .send({
          periods: [
            { name: 'Period 1', startTime: '09:00', endTime: '09:50' },
            { name: 'Period 2', startTime: '09:50', endTime: '10:40' }
          ],
          breaks: [
            { name: 'Morning Break', startTime: '10:40', endTime: '11:00' }
          ]
        })
        .expect(200);

      expect(res.body.message).toBe('Time model saved successfully');
      expect(res.body.timeModel.periods).toHaveLength(2);
      expect(res.body.timeModel.breaks).toHaveLength(1);
    });

    it('PUT /api/time-model - returns 400 on overlap error', async () => {
      await institutionService.saveInstitution({
        name: 'Test University',
        academicYear: '2026-27'
      });

      const res = await request(app)
        .put('/api/time-model')
        .send({
          periods: [
            { name: 'Period 1', startTime: '09:00', endTime: '10:00' },
            { name: 'Period 2', startTime: '09:30', endTime: '10:30' }
          ],
          breaks: []
        })
        .expect(400);

      expect(res.body.error).toMatch(/overlaps with/);
    });

    it('GET /api/time-model - returns saved configuration', async () => {
      await institutionService.saveInstitution({
        name: 'Test University',
        academicYear: '2026-27'
      });

      await request(app)
        .put('/api/time-model')
        .send({
          periods: [
            { name: 'Period 1', startTime: '09:00', endTime: '09:50' }
          ],
          breaks: []
        })
        .expect(200);

      const res = await request(app)
        .get('/api/time-model')
        .expect(200);

      expect(res.body.timeModel).not.toBeNull();
      expect(res.body.timeModel.periods).toHaveLength(1);
      expect(res.body.timeModel.periods[0].name).toBe('Period 1');
    });
  });
});
