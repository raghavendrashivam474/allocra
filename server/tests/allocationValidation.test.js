import { describe, it, expect } from 'vitest';
import {
  validateAllocationInput,
  ALLOCATION_ERRORS
} from '../core/institution/academic-context/allocationValidationService.js';
import mongoose from 'mongoose';

// ── Helpers ──

function validId() {
  return new mongoose.Types.ObjectId().toHexString();
}

function validInput() {
  return {
    activityId: validId(),
    facultyId: validId(),
    roomId: validId()
  };
}

// ── Tests ──

describe('Allocation Domain Validation (Pure)', () => {

  // --- Valid input ---

  it('accepts valid input with three well-formed ObjectIds', () => {
    const result = validateAllocationInput(validInput());
    expect(result.valid).toBe(true);
    expect(result.errors).toBeUndefined();
  });

  // --- Missing fields ---

  it('rejects when activityId is missing', () => {
    const input = validInput();
    delete input.activityId;
    const result = validateAllocationInput(input);
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].code).toBe(ALLOCATION_ERRORS.MISSING_ACTIVITY_ID);
    expect(result.errors[0].field).toBe('activityId');
  });

  it('rejects when facultyId is missing', () => {
    const input = validInput();
    delete input.facultyId;
    const result = validateAllocationInput(input);
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].code).toBe(ALLOCATION_ERRORS.MISSING_FACULTY_ID);
    expect(result.errors[0].field).toBe('facultyId');
  });

  it('rejects when roomId is missing', () => {
    const input = validInput();
    delete input.roomId;
    const result = validateAllocationInput(input);
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].code).toBe(ALLOCATION_ERRORS.MISSING_ROOM_ID);
    expect(result.errors[0].field).toBe('roomId');
  });

  it('reports all three missing fields simultaneously', () => {
    const result = validateAllocationInput({});
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(3);
    const codes = result.errors.map(e => e.code);
    expect(codes).toContain(ALLOCATION_ERRORS.MISSING_ACTIVITY_ID);
    expect(codes).toContain(ALLOCATION_ERRORS.MISSING_FACULTY_ID);
    expect(codes).toContain(ALLOCATION_ERRORS.MISSING_ROOM_ID);
  });

  // --- Null and empty values ---

  it('rejects null activityId as missing', () => {
    const input = validInput();
    input.activityId = null;
    const result = validateAllocationInput(input);
    expect(result.valid).toBe(false);
    expect(result.errors[0].code).toBe(ALLOCATION_ERRORS.MISSING_ACTIVITY_ID);
  });

  it('rejects empty string facultyId as missing', () => {
    const input = validInput();
    input.facultyId = '';
    const result = validateAllocationInput(input);
    expect(result.valid).toBe(false);
    expect(result.errors[0].code).toBe(ALLOCATION_ERRORS.MISSING_FACULTY_ID);
  });

  // --- Invalid ObjectId format ---

  it('rejects malformed activityId', () => {
    const input = validInput();
    input.activityId = 'not-an-object-id';
    const result = validateAllocationInput(input);
    expect(result.valid).toBe(false);
    expect(result.errors[0].code).toBe(ALLOCATION_ERRORS.INVALID_ACTIVITY_ID);
  });

  it('rejects malformed facultyId', () => {
    const input = validInput();
    input.facultyId = '12345';
    const result = validateAllocationInput(input);
    expect(result.valid).toBe(false);
    expect(result.errors[0].code).toBe(ALLOCATION_ERRORS.INVALID_FACULTY_ID);
  });

  it('rejects malformed roomId', () => {
    const input = validInput();
    input.roomId = 'zzzzzzzzzzzzzzzzzzzzzzzz';
    const result = validateAllocationInput(input);
    expect(result.valid).toBe(false);
    expect(result.errors[0].code).toBe(ALLOCATION_ERRORS.INVALID_ROOM_ID);
  });

  // --- Mixed errors ---

  it('reports missing and invalid errors together', () => {
    const result = validateAllocationInput({
      activityId: 'bad-id',
      roomId: validId()
      // facultyId missing entirely
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(2);
    const codes = result.errors.map(e => e.code);
    expect(codes).toContain(ALLOCATION_ERRORS.INVALID_ACTIVITY_ID);
    expect(codes).toContain(ALLOCATION_ERRORS.MISSING_FACULTY_ID);
  });

  // --- Non-object input ---

  it('rejects null input', () => {
    const result = validateAllocationInput(null);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('rejects undefined input', () => {
    const result = validateAllocationInput(undefined);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  // --- Determinism ---

  it('produces deterministic error codes for the same input', () => {
    const input = { activityId: 'x', facultyId: 'y', roomId: 'z' };
    const r1 = validateAllocationInput(input);
    const r2 = validateAllocationInput(input);
    expect(r1.errors.map(e => e.code)).toEqual(r2.errors.map(e => e.code));
  });

  // --- Error structure ---

  it('each error has code, field, and message', () => {
    const result = validateAllocationInput({});
    for (const err of result.errors) {
      expect(err).toHaveProperty('code');
      expect(err).toHaveProperty('field');
      expect(err).toHaveProperty('message');
      expect(typeof err.code).toBe('string');
      expect(typeof err.field).toBe('string');
      expect(typeof err.message).toBe('string');
      expect(err.message.length).toBeGreaterThan(0);
    }
  });
});
