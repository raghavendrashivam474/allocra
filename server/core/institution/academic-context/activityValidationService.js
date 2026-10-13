import Activity from '../../../data/models/Activity.js';
import Faculty from '../../../data/models/Faculty.js';
import Room from '../../../data/models/Room.js';
import Group from '../../../data/models/Group.js';
import Institution from '../../../data/models/Institution.js';

/**
 * S2.5 — Activity & Resource Configuration Validation
 *
 * Read-only service. Evaluates the current academic configuration
 * against explicit rules and returns deterministic findings.
 * Never mutates domain records.
 */
export async function validateConfiguration() {
  // 1. Resolve institution (same convention as all other services)
  const institution = await Institution.findOne().sort({ createdAt: -1 });

  if (!institution) {
    return buildResult('not_configured', 0, 0, []);
  }

  const instId = institution._id;

  // 2. Load all activities for this institution (lean — we only need raw IDs)
  const activities = await Activity.find({ institutionId: instId })
    .sort({ createdAt: 1 })
    .lean();

  if (activities.length === 0) {
    return buildResult('no_activities', 0, 0, []);
  }

  // 3. Batch-load all referenced resources in three queries (no N+1)
  const allFacultyIds = [...new Set(activities.flatMap(a => a.facultyIds.map(String)))];
  const allRoomIds = [...new Set(activities.flatMap(a => a.roomIds.map(String)))];
  const allGroupIds = [...new Set(activities.map(a => String(a.groupId)))];

  const [existingFaculty, existingRooms, existingGroups] = await Promise.all([
    allFacultyIds.length > 0
      ? Faculty.find({ _id: { $in: allFacultyIds }, institutionId: instId })
          .select('_id')
          .lean()
      : Promise.resolve([]),
    allRoomIds.length > 0
      ? Room.find({ _id: { $in: allRoomIds }, institutionId: instId })
          .select('_id')
          .lean()
      : Promise.resolve([]),
    allGroupIds.length > 0
      ? Group.find({ _id: { $in: allGroupIds }, institutionId: instId })
          .select('_id')
          .lean()
      : Promise.resolve([])
  ]);

  const facultyIdSet = new Set(existingFaculty.map(f => String(f._id)));
  const roomIdSet = new Set(existingRooms.map(r => String(r._id)));
  const groupIdSet = new Set(existingGroups.map(g => String(g._id)));

  // 4. Evaluate rules per activity
  const findings = [];
  let validCount = 0;

  for (const activity of activities) {
    let activityValid = true;
    const actId = String(activity._id);
    const actName = activity.name;

    // Rule A — Missing eligible faculty
    if (!activity.facultyIds || activity.facultyIds.length === 0) {
      findings.push(makeFinding(
        'ACTIVITY_NO_ELIGIBLE_FACULTY', 'error',
        'activity', actId, actName,
        'No eligible faculty members are configured.',
        'configure_activity_resources'
      ));
      activityValid = false;
    }

    // Rule B — Missing eligible rooms
    if (!activity.roomIds || activity.roomIds.length === 0) {
      findings.push(makeFinding(
        'ACTIVITY_NO_ELIGIBLE_ROOMS', 'error',
        'activity', actId, actName,
        'No eligible rooms are configured.',
        'configure_activity_resources'
      ));
      activityValid = false;
    }

    // Rule C — Stale faculty reference
    const hasStaleFaculty = activity.facultyIds.some(
      fId => !facultyIdSet.has(String(fId))
    );
    if (hasStaleFaculty) {
      findings.push(makeFinding(
        'ACTIVITY_STALE_FACULTY_REFERENCE', 'error',
        'activity', actId, actName,
        'References a faculty member that no longer exists or is invalid.',
        'configure_activity_resources'
      ));
      activityValid = false;
    }

    // Rule D — Stale room reference
    const hasStaleRoom = activity.roomIds.some(
      rId => !roomIdSet.has(String(rId))
    );
    if (hasStaleRoom) {
      findings.push(makeFinding(
        'ACTIVITY_STALE_ROOM_REFERENCE', 'error',
        'activity', actId, actName,
        'References a room that no longer exists or is invalid.',
        'configure_activity_resources'
      ));
      activityValid = false;
    }

    // Rule E — Institution consistency (stale group)
    if (!groupIdSet.has(String(activity.groupId))) {
      findings.push(makeFinding(
        'ACTIVITY_INVALID_GROUP', 'error',
        'activity', actId, actName,
        'References an academic group that no longer exists or is invalid.',
        'configure_activity'
      ));
      activityValid = false;
    }

    if (activityValid) {
      validCount++;
    }
  }

  // 5. Deterministic sort: by entity name, then by finding code
  findings.sort((a, b) => {
    const nameCmp = a.entityName.localeCompare(b.entityName);
    if (nameCmp !== 0) return nameCmp;
    return a.code.localeCompare(b.code);
  });

  // 6. Determine overall status
  const errorCount = findings.filter(f => f.severity === 'error').length;
  const warningCount = findings.filter(f => f.severity === 'warning').length;
  const status = (errorCount === 0 && warningCount === 0) ? 'ready' : 'needs_attention';

  return buildResult(status, activities.length, validCount, findings);
}

// ── Helpers ──

function makeFinding(code, severity, entityType, entityId, entityName, message, actionType) {
  return {
    code,
    severity,
    entityType,
    entityId,
    entityName,
    message,
    action: { type: actionType }
  };
}

function buildResult(status, activityCount, validActivityCount, findings) {
  return {
    summary: {
      status,
      activityCount,
      validActivityCount,
      errorCount: findings.filter(f => f.severity === 'error').length,
      warningCount: findings.filter(f => f.severity === 'warning').length
    },
    findings
  };
}
