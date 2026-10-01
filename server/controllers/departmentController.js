import * as departmentService from '../core/institution/academic-structure/departmentService.js';

export async function getDepartments(req, res, next) {
  try {
    const departments = await departmentService.getDepartments();
    res.json({ departments });
  } catch (error) {
    next(error);
  }
}

export async function createDepartment(req, res, next) {
  try {
    const { name } = req.body;
    const department = await departmentService.createDepartment({ name });
    res.status(201).json({
      message: 'Department created successfully',
      department
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    next(error);
  }
}
