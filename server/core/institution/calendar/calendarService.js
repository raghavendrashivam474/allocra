import Calendar from '../../../data/models/Calendar.js';
import Institution from '../../../data/models/Institution.js';

const VALID_DAYS = [
  'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY',
  'FRIDAY', 'SATURDAY', 'SUNDAY'
];

export async function getCalendar() {
  const institution = await Institution.findOne().sort({ createdAt: -1 });
  if (!institution) {
    return null;
  }
  return await Calendar.findOne({ institutionId: institution._id });
}

export async function saveCalendar({ workingDays }) {
  if (!workingDays || !Array.isArray(workingDays)) {
    const error = new Error('workingDays must be an array');
    error.statusCode = 400;
    throw error;
  }

  const normalized = [...new Set(workingDays)];

  if (normalized.length === 0) {
    const error = new Error('At least one working day is required');
    error.statusCode = 400;
    throw error;
  }

  const invalidDays = normalized.filter(d => !VALID_DAYS.includes(d));
  if (invalidDays.length > 0) {
    const error = new Error('Invalid day(s): ' + invalidDays.join(', '));
    error.statusCode = 400;
    throw error;
  }

  const institution = await Institution.findOne().sort({ createdAt: -1 });
  if (!institution) {
    const error = new Error('Institution must be configured before setting calendar');
    error.statusCode = 400;
    throw error;
  }

  const calendar = await Calendar.findOneAndUpdate(
    { institutionId: institution._id },
    {
      institutionId: institution._id,
      workingDays: normalized,
      updatedAt: new Date()
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  return calendar;
}
