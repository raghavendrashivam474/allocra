import * as groupService from '../core/institution/academic-context/groupService.js';

export async function getGroups(req, res, next) {
  try {
    const groups = await groupService.getGroups();
    res.json({ groups });
  } catch (error) {
    next(error);
  }
}

export async function createGroup(req, res, next) {
  try {
    const { programId, termId, name } = req.body;
    const group = await groupService.createGroup({ programId, termId, name });
    res.status(201).json({
      message: 'Group created successfully',
      group
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    next(error);
  }
}
