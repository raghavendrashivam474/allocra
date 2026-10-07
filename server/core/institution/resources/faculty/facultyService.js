import Faculty from '../../../../data/models/Faculty.js';
import Department from '../../../../data/models/Department.js';
import Institution from '../../../../data/models/Institution.js';
import mongoose from 'mongoose';

export async function getFaculty() {
  const institution = await Institution.findOne().sort({ createdAt: -1 });
  if (!institution) {
    return [];
  }
  return await Faculty.find({ institutionId: institution._id })
    .populate('departmentId', 'name')
    .sort({ createdAt: 1 });
}

export async function createFaculty({ departmentId, name }) {
  if (!departmentId) {
    const error = new Error('Department is required');
    error.statusCode = 400;
    throw error;
  }

  if (!name || !name.trim()) {
    const error = new Error('Faculty name is required');
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

  const faculty = new Faculty({
    institutionId: department.institutionId,
    departmentId: department._id,
    name: name.trim()
  });

  const savedFaculty = await faculty.save();
  return await Faculty.findById(savedFaculty._id).populate('departmentId', 'name');
}
