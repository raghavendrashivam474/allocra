import mongoose from 'mongoose';

/**
 * S3.1 — Allocation Domain Validation (Pure)
 *
 * Validates the shape and format of allocation input without
 * accessing the database. State-dependent checks (existence,
 * eligibility, institution ownership) are deferred to S3.2.
 *
 * Returns { valid: true } or { valid: false, errors: [...] }.
 * Never throws.
 */

// ── Error Codes ──

export const ALLOCATION_ERRORS = {
  MISSING_ACTIVITY_ID: 'ALLOCATION_MISSING_ACTIVITY_ID',
  MISSING_FACULTY_ID: 'ALLOCATION_MISSING_FACULTY_ID',
  MISSING_ROOM_ID: 'ALLOCATION_MISSING_ROOM_ID',
  INVALID_ACTIVITY_ID: 'ALLOCATION_INVALID_ACTIVITY_ID',
  INVALID_FACULTY_ID: 'ALLOCATION_INVALID_FACULTY_ID',
  INVALID_ROOM_ID: 'ALLOCATION_INVALID_ROOM_ID'
};

// ── Helpers ──

function makeError(code, field, message) {
  return { code, field, message };
}

function isValidObjectId(value) {
  return typeof value === 'string' && mongoose.Types.ObjectId.isValid(value);
}

// ── Pure Validator ──

export function validateAllocationInput(input) {
  const errors = [];

  if (!input || typeof input !== 'object') {
    return {
      valid: false,
      errors: [makeError(
        ALLOCATION_ERRORS.MISSING_ACTIVITY_ID,
        'activityId',
        'Allocation input must be an object with activityId, facultyId, and roomId.'
      )]
    };
  }

  const { activityId, facultyId, roomId } = input;

  // --- activityId ---
  if (activityId === undefined || activityId === null || activityId === '') {
    errors.push(makeError(
      ALLOCATION_ERRORS.MISSING_ACTIVITY_ID,
      'activityId',
      'Activity reference is required.'
    ));
  } else if (!isValidObjectId(activityId)) {
    errors.push(makeError(
      ALLOCATION_ERRORS.INVALID_ACTIVITY_ID,
      'activityId',
      'Activity ID must be a valid ObjectId.'
    ));
  }

  // --- facultyId ---
  if (facultyId === undefined || facultyId === null || facultyId === '') {
    errors.push(makeError(
      ALLOCATION_ERRORS.MISSING_FACULTY_ID,
      'facultyId',
      'Faculty reference is required.'
    ));
  } else if (!isValidObjectId(facultyId)) {
    errors.push(makeError(
      ALLOCATION_ERRORS.INVALID_FACULTY_ID,
      'facultyId',
      'Faculty ID must be a valid ObjectId.'
    ));
  }

  // --- roomId ---
  if (roomId === undefined || roomId === null || roomId === '') {
    errors.push(makeError(
      ALLOCATION_ERRORS.MISSING_ROOM_ID,
      'roomId',
      'Room reference is required.'
    ));
  } else if (!isValidObjectId(roomId)) {
    errors.push(makeError(
      ALLOCATION_ERRORS.INVALID_ROOM_ID,
      'roomId',
      'Room ID must be a valid ObjectId.'
    ));
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true };
}
