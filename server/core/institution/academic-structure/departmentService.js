import Department from '../../../data/models/Department.js';
import Institution from '../../../data/models/Institution.js';

export async function getDepartments() {
  const institution = await Institution.findOne().sort({ createdAt: -1 });
  if (!institution) {
    return [];
  }
  return await Department.find({ institutionId: institution._id }).sort({ createdAt: 1 });
}

export async function createDepartment({ name }) {
  if (!name || !name.trim()) {
    const error = new Error('Department name is required');
    error.statusCode = 400;
    throw error;
  }

  const institution = await Institution.findOne().sort({ createdAt: -1 });
  if (!institution) {
    const error = new Error('Institution must be configured before adding departments');
    error.statusCode = 400;
    throw error;
  }

  const department = new Department({
    institutionId: institution._id,
    name: name.trim()
  });

  return await department.save();
}
