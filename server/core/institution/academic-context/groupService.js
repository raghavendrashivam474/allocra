import Group from '../../../data/models/Group.js';
import Program from '../../../data/models/Program.js';
import Term from '../../../data/models/Term.js';
import Institution from '../../../data/models/Institution.js';
import mongoose from 'mongoose';

export async function getGroups() {
  const institution = await Institution.findOne().sort({ createdAt: -1 });
  if (!institution) {
    return [];
  }
  return await Group.find({ institutionId: institution._id })
    .populate('programId', 'name departmentId')
    .populate('termId', 'name academicYear')
    .sort({ createdAt: 1 });
}

export async function createGroup({ programId, termId, name }) {
  if (!programId) {
    const error = new Error('Program is required');
    error.statusCode = 400;
    throw error;
  }

  if (!termId) {
    const error = new Error('Term is required');
    error.statusCode = 400;
    throw error;
  }

  if (!name || !name.trim()) {
    const error = new Error('Group name is required');
    error.statusCode = 400;
    throw error;
  }

  if (!mongoose.Types.ObjectId.isValid(programId)) {
    const error = new Error('Invalid program ID');
    error.statusCode = 400;
    throw error;
  }

  if (!mongoose.Types.ObjectId.isValid(termId)) {
    const error = new Error('Invalid term ID');
    error.statusCode = 400;
    throw error;
  }

  const program = await Program.findById(programId);
  if (!program) {
    const error = new Error('Program not found');
    error.statusCode = 404;
    throw error;
  }

  const term = await Term.findById(termId);
  if (!term) {
    const error = new Error('Term not found');
    error.statusCode = 404;
    throw error;
  }

  if (program.institutionId.toString() !== term.institutionId.toString()) {
    const error = new Error('Program and Term must belong to the same institution');
    error.statusCode = 400;
    throw error;
  }

  const group = new Group({
    institutionId: program.institutionId,
    programId: program._id,
    termId: term._id,
    name: name.trim()
  });

  const savedGroup = await group.save();
  return await Group.findById(savedGroup._id)
    .populate('programId', 'name departmentId')
    .populate('termId', 'name academicYear');
}
