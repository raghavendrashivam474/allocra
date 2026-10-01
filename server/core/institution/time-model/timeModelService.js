import TimeModel from '../../../data/models/TimeModel.js';
import Institution from '../../../data/models/Institution.js';

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

function parseTime(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function validateTimeFormat(t, label) {
  if (!TIME_REGEX.test(t)) {
    const error = new Error(`Invalid time format for ${label}: "${t}". Expected HH:mm`);
    error.statusCode = 400;
    throw error;
  }
}

function validateTimeRange(entry, label) {
  validateTimeFormat(entry.startTime, `${label} startTime`);
  validateTimeFormat(entry.endTime, `${label} endTime`);

  const start = parseTime(entry.startTime);
  const end = parseTime(entry.endTime);

  if (start >= end) {
    const error = new Error(`${label} "${entry.name}": startTime must be strictly before endTime`);
    error.statusCode = 400;
    throw error;
  }
}

function validateNoOverlaps(periods, breaks) {
  const allSlots = [
    ...periods.map(p => ({ ...p, type: 'Period' })),
    ...breaks.map(b => ({ ...b, type: 'Break' }))
  ];

  allSlots.sort((a, b) => parseTime(a.startTime) - parseTime(b.startTime));

  for (let i = 1; i < allSlots.length; i++) {
    const prev = allSlots[i - 1];
    const curr = allSlots[i];
    const prevEnd = parseTime(prev.endTime);
    const currStart = parseTime(curr.startTime);

    if (currStart < prevEnd) {
      const error = new Error(
        `${curr.type} "${curr.name}" overlaps with ${prev.type} "${prev.name}"`
      );
      error.statusCode = 400;
      throw error;
    }
  }
}

function sortEntries(entries) {
  return [...entries].sort((a, b) => parseTime(a.startTime) - parseTime(b.startTime));
}

export async function getTimeModel() {
  const institution = await Institution.findOne().sort({ createdAt: -1 });
  if (!institution) {
    return null;
  }
  return await TimeModel.findOne({ institutionId: institution._id });
}

export async function saveTimeModel({ periods, breaks }) {
  if (!Array.isArray(periods)) {
    const error = new Error('periods must be an array');
    error.statusCode = 400;
    throw error;
  }
  if (!Array.isArray(breaks)) {
    const error = new Error('breaks must be an array');
    error.statusCode = 400;
    throw error;
  }

  for (const p of periods) {
    if (!p.name || !p.startTime || !p.endTime) {
      const error = new Error('Each period must have name, startTime, and endTime');
      error.statusCode = 400;
      throw error;
    }
    validateTimeRange(p, 'Period');
  }

  for (const b of breaks) {
    if (!b.name || !b.startTime || !b.endTime) {
      const error = new Error('Each break must have name, startTime, and endTime');
      error.statusCode = 400;
      throw error;
    }
    validateTimeRange(b, 'Break');
  }

  validateNoOverlaps(periods, breaks);

  const institution = await Institution.findOne().sort({ createdAt: -1 });
  if (!institution) {
    const error = new Error('Institution must be configured before setting time model');
    error.statusCode = 400;
    throw error;
  }

  const sortedPeriods = sortEntries(periods);
  const sortedBreaks = sortEntries(breaks);

  const timeModel = await TimeModel.findOneAndUpdate(
    { institutionId: institution._id },
    {
      institutionId: institution._id,
      periods: sortedPeriods,
      breaks: sortedBreaks,
      updatedAt: new Date()
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  return timeModel;
}
