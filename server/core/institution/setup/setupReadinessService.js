import Institution from '../../../data/models/Institution.js';
import Department from '../../../data/models/Department.js';
import Program from '../../../data/models/Program.js';
import Term from '../../../data/models/Term.js';
import Group from '../../../data/models/Group.js';
import Calendar from '../../../data/models/Calendar.js';
import TimeModel from '../../../data/models/TimeModel.js';

function check(key, label, status, message) {
  return { key, label, status, message };
}

export async function getReadiness() {
  const checks = [];

  // 1. Institution
  const institution = await Institution.findOne().sort({ createdAt: -1 });
  if (!institution) {
    checks.push(check('institution', 'Institution', 'incomplete', 'No institution has been configured.'));
    // Without an institution, everything else is incomplete
    checks.push(check('academic-structure', 'Academic Structure', 'incomplete', 'Configure an institution first.'));
    checks.push(check('terms-groups', 'Terms & Groups', 'incomplete', 'Configure an institution first.'));
    checks.push(check('calendar', 'Calendar', 'incomplete', 'Configure an institution first.'));
    checks.push(check('time-model', 'Time Model', 'incomplete', 'Configure an institution first.'));
    return { ready: false, checks };
  }
  checks.push(check('institution', 'Institution', 'complete', 'Institution is configured.'));

  const instId = institution._id;

  // 2. Academic Structure
  const deptCount = await Department.countDocuments({ institutionId: instId });
  const progCount = await Program.countDocuments({ institutionId: instId });
  if (deptCount > 0 && progCount > 0) {
    checks.push(check('academic-structure', 'Academic Structure', 'complete',
      `${deptCount} department(s) and ${progCount} program(s) configured.`));
  } else {
    const missing = [];
    if (deptCount === 0) missing.push('department');
    if (progCount === 0) missing.push('program');
    checks.push(check('academic-structure', 'Academic Structure', 'incomplete',
      `No ${missing.join(' or ')} has been configured.`));
  }

  // 3. Terms & Groups
  const termCount = await Term.countDocuments({ institutionId: instId });
  const groupCount = await Group.countDocuments({ institutionId: instId });
  if (termCount > 0 && groupCount > 0) {
    checks.push(check('terms-groups', 'Terms & Groups', 'complete',
      `${termCount} term(s) and ${groupCount} group(s) configured.`));
  } else {
    const missing = [];
    if (termCount === 0) missing.push('academic term');
    if (groupCount === 0) missing.push('group');
    checks.push(check('terms-groups', 'Terms & Groups', 'incomplete',
      `No ${missing.join(' or ')} has been configured.`));
  }

  // 4. Calendar
  const calendar = await Calendar.findOne({ institutionId: instId });
  if (calendar && calendar.workingDays && calendar.workingDays.length > 0) {
    checks.push(check('calendar', 'Calendar', 'complete',
      `${calendar.workingDays.length} working day(s) configured.`));
  } else {
    checks.push(check('calendar', 'Calendar', 'incomplete',
      'No working days have been configured.'));
  }

  // 5. Time Model
  const timeModel = await TimeModel.findOne({ institutionId: instId });
  if (timeModel && timeModel.periods && timeModel.periods.length > 0) {
    const breakCount = timeModel.breaks ? timeModel.breaks.length : 0;
    checks.push(check('time-model', 'Time Model', 'complete',
      `${timeModel.periods.length} period(s) and ${breakCount} break(s) configured.`));
  } else {
    checks.push(check('time-model', 'Time Model', 'incomplete',
      'No time periods have been configured.'));
  }

  const ready = checks.every(c => c.status === 'complete');
  return { ready, checks };
}
