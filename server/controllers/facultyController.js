import * as facultyService from '../core/institution/resources/faculty/facultyService.js';

export async function getFaculty(req, res, next) {
  try {
    const faculty = await facultyService.getFaculty();
    res.json({ faculty });
  } catch (error) {
    next(error);
  }
}

export async function createFaculty(req, res, next) {
  try {
    const { departmentId, name } = req.body;
    const member = await facultyService.createFaculty({ departmentId, name });
    res.status(201).json({
      message: 'Faculty member created successfully',
      faculty: member
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    next(error);
  }
}
