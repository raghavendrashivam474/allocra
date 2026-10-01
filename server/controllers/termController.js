import * as termService from '../core/institution/academic-context/termService.js';

export async function getTerms(req, res, next) {
  try {
    const terms = await termService.getTerms();
    res.json({ terms });
  } catch (error) {
    next(error);
  }
}

export async function createTerm(req, res, next) {
  try {
    const { name } = req.body;
    const term = await termService.createTerm({ name });
    res.status(201).json({
      message: 'Term created successfully',
      term
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    next(error);
  }
}
