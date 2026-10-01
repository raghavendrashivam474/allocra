import * as programService from '../core/institution/academic-structure/programService.js';

export async function getPrograms(req, res, next) {
  try {
    const programs = await programService.getPrograms();
    res.json({ programs });
  } catch (error) {
    next(error);
  }
}

export async function createProgram(req, res, next) {
  try {
    const { departmentId, name } = req.body;
    const program = await programService.createProgram({ departmentId, name });
    res.status(201).json({
      message: 'Program created successfully',
      program
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    next(error);
  }
}
