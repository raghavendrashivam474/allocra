import * as institutionService from '../core/institution/institutionService.js';

export async function getInstitution(req, res, next) {
  try {
    const institution = await institutionService.getInstitution();
    res.json({ institution: institution || null });
  } catch (error) {
    next(error);
  }
}

export async function saveInstitution(req, res, next) {
  try {
    const { name, academicYear } = req.body;
    const institution = await institutionService.saveInstitution({ name, academicYear });
    res.status(201).json({
      message: 'Institution configured successfully',
      institution
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    next(error);
  }
}
