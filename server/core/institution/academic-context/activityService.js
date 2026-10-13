import Activity from '../../../data/models/Activity.js';
import Group from '../../../data/models/Group.js';
import Institution from '../../../data/models/Institution.js';
import Faculty from '../../../data/models/Faculty.js';
import Room from '../../../data/models/Room.js';
import mongoose from 'mongoose';

export async function getActivities() {
  const institution = await Institution.findOne().sort({ createdAt: -1 });
  if (!institution) {
    return [];
  }
  return await Activity.find({ institutionId: institution._id })
    .populate('groupId', 'name')
    .populate('facultyIds', 'name')
    .populate('roomIds', 'name')
    .sort({ createdAt: 1 });
}

export async function createActivity({ groupId, name }) {
  if (!groupId) {
    const error = new Error('Group is required');
    error.statusCode = 400;
    throw error;
  }

  if (!name || !name.trim()) {
    const error = new Error('Activity name is required');
    error.statusCode = 400;
    throw error;
  }

  if (!mongoose.Types.ObjectId.isValid(groupId)) {
    const error = new Error('Invalid group ID');
    error.statusCode = 400;
    throw error;
  }

  const group = await Group.findById(groupId);
  if (!group) {
    const error = new Error('Group not found');
    error.statusCode = 404;
    throw error;
  }

  const institution = await Institution.findOne().sort({ createdAt: -1 });
  if (!institution) {
    const error = new Error('Institution not configured');
    error.statusCode = 400;
    throw error;
  }

  if (group.institutionId.toString() !== institution._id.toString()) {
    const error = new Error('Group does not belong to the current institution');
    error.statusCode = 400;
    throw error;
  }

  const existing = await Activity.findOne({
    institutionId: institution._id,
    groupId: group._id,
    name: name.trim()
  });
  if (existing) {
    const error = new Error('An activity with this name already exists in this group');
    error.statusCode = 409;
    throw error;
  }

  const activity = new Activity({
    institutionId: institution._id,
    groupId: group._id,
    name: name.trim()
  });

  const saved = await activity.save();
  return await Activity.findById(saved._id)
    .populate('groupId', 'name')
    .populate('facultyIds', 'name')
    .populate('roomIds', 'name');
}

export async function updateActivityRelationships(activityId, { facultyIds, roomIds }) {
  if (!mongoose.Types.ObjectId.isValid(activityId)) {
    const error = new Error('Invalid activity ID');
    error.statusCode = 400;
    throw error;
  }

  const institution = await Institution.findOne().sort({ createdAt: -1 });
  if (!institution) {
    const error = new Error('Institution not configured');
    error.statusCode = 400;
    throw error;
  }

  const activity = await Activity.findById(activityId);
  if (!activity) {
    const error = new Error('Activity not found');
    error.statusCode = 404;
    throw error;
  }

  if (activity.institutionId.toString() !== institution._id.toString()) {
    const error = new Error('Activity does not belong to the current institution');
    error.statusCode = 400;
    throw error;
  }

  const update = {};

  // --- Validate facultyIds if provided ---
  if (facultyIds !== undefined) {
    if (!Array.isArray(facultyIds)) {
      const error = new Error('facultyIds must be an array');
      error.statusCode = 400;
      throw error;
    }

    for (const id of facultyIds) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        const error = new Error('Invalid faculty ID format');
        error.statusCode = 400;
        throw error;
      }
    }

    const uniqueFaculty = [...new Set(facultyIds.map(String))];
    if (uniqueFaculty.length !== facultyIds.length) {
      const error = new Error('Duplicate faculty IDs are not allowed');
      error.statusCode = 400;
      throw error;
    }

    if (facultyIds.length > 0) {
      const found = await Faculty.find({
        _id: { $in: facultyIds },
        institutionId: institution._id
      });
      if (found.length !== facultyIds.length) {
        const error = new Error('One or more faculty members not found or do not belong to this institution');
        error.statusCode = 400;
        throw error;
      }
    }

    update.facultyIds = facultyIds;
  }

  // --- Validate roomIds if provided ---
  if (roomIds !== undefined) {
    if (!Array.isArray(roomIds)) {
      const error = new Error('roomIds must be an array');
      error.statusCode = 400;
      throw error;
    }

    for (const id of roomIds) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        const error = new Error('Invalid room ID format');
        error.statusCode = 400;
        throw error;
      }
    }

    const uniqueRooms = [...new Set(roomIds.map(String))];
    if (uniqueRooms.length !== roomIds.length) {
      const error = new Error('Duplicate room IDs are not allowed');
      error.statusCode = 400;
      throw error;
    }

    if (roomIds.length > 0) {
      const found = await Room.find({
        _id: { $in: roomIds },
        institutionId: institution._id
      });
      if (found.length !== roomIds.length) {
        const error = new Error('One or more rooms not found or do not belong to this institution');
        error.statusCode = 400;
        throw error;
      }
    }

    update.roomIds = roomIds;
  }

  if (Object.keys(update).length === 0) {
    const error = new Error('No relationship fields provided for update');
    error.statusCode = 400;
    throw error;
  }

  const updated = await Activity.findByIdAndUpdate(
    activityId,
    { $set: update },
    { new: true }
  )
    .populate('groupId', 'name')
    .populate('facultyIds', 'name')
    .populate('roomIds', 'name');

  return updated;
}
