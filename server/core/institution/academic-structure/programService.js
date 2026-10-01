import Program from '../../../data/models/Program.js';
import Department from '../../../data/models/Department.js';
import Institution from '../../../data/models/Institution.js';
import mongoose from 'mongoose';

export async function getPrograms() {
  const institution = await Institution.findOne().sort({ createdAt: -1 });
  if (!institution) {
    return [];
  }
  return await Program.find({ institutionId: institution._id })
    .populate('departmentId', 'name')
    .sort({ createdAt: 1 });
}

export async function createProgram({ departmentId, name }) {
  if (!departmentId) {
    const error = new Error('Department is required');
    error.statusCode = 400;
    throw error;
  }

  if (!name || !name.trim()) {
    const error = new Error('Program name is required');
    error.statusCode = 400;
    throw error;
  }

  if (!mongoose.Types.ObjectId.isValid(departmentId)) {
    const error = new Error('Invalid department ID');
    error.statusCode = 400;
    throw error;
  }

  const department = await Department.findById(departmentId);
  if (!department) {
    const error = new Error('Department not found');
    error.statusCode = 404;
    throw error;
  }

  const program = new Program({
    institutionId: department.institutionId,
    departmentId: department._id,
    name: name.trim()
  });

  const savedProgram = await program.save();
  return await Program.findById(savedProgram._id).populate('departmentId', 'name');
}
