import Activity from '../../../data/models/Activity.js';
import Group from '../../../data/models/Group.js';
import Institution from '../../../data/models/Institution.js';
import mongoose from 'mongoose';

export async function getActivities() {
  const institution = await Institution.findOne().sort({ createdAt: -1 });
  if (!institution) {
    return [];
  }
  return await Activity.find({ institutionId: institution._id })
    .populate('groupId', 'name')
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
  return await Activity.findById(saved._id).populate('groupId', 'name');
}