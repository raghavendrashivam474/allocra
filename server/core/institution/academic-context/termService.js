import Term from '../../../data/models/Term.js';
import Institution from '../../../data/models/Institution.js';

export async function getTerms() {
  const institution = await Institution.findOne().sort({ createdAt: -1 });
  if (!institution) {
    return [];
  }
  return await Term.find({ institutionId: institution._id }).sort({ createdAt: 1 });
}

export async function createTerm({ name }) {
  if (!name || !name.trim()) {
    const error = new Error('Term name is required');
    error.statusCode = 400;
    throw error;
  }

  const institution = await Institution.findOne().sort({ createdAt: -1 });
  if (!institution) {
    const error = new Error('Institution must be configured before adding terms');
    error.statusCode = 400;
    throw error;
  }

  const term = new Term({
    institutionId: institution._id,
    name: name.trim(),
    academicYear: institution.academicYear
  });

  return await term.save();
}
