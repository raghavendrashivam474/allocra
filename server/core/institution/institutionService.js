import Institution from '../../data/models/Institution.js';

export async function getInstitution() {
  return await Institution.findOne().sort({ createdAt: -1 });
}

export async function saveInstitution({ name, academicYear }) {
  if (!name || !name.trim()) {
    const error = new Error('Institution name is required');
    error.statusCode = 400;
    throw error;
  }
  if (!academicYear || !academicYear.trim()) {
    const error = new Error('Academic year is required');
    error.statusCode = 400;
    throw error;
  }

  let institution = await Institution.findOne().sort({ createdAt: -1 });
  if (institution) {
    institution.name = name.trim();
    institution.academicYear = academicYear.trim();
    return await institution.save();
  }

  institution = new Institution({
    name: name.trim(),
    academicYear: academicYear.trim()
  });

  return await institution.save();
}
