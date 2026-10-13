import * as activityService from '../core/institution/academic-context/activityService.js';

export async function getActivities(req, res, next) {
  try {
    const activities = await activityService.getActivities();
    res.json({ activities });
  } catch (error) {
    next(error);
  }
}

export async function createActivity(req, res, next) {
  try {
    const { groupId, name } = req.body;
    const activity = await activityService.createActivity({ groupId, name });
    res.status(201).json({
      message: 'Activity created successfully',
      activity
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    next(error);
  }
}

export async function updateActivityRelationships(req, res, next) {
  try {
    const { id } = req.params;
    const { facultyIds, roomIds } = req.body;
    const activity = await activityService.updateActivityRelationships(id, {
      facultyIds,
      roomIds
    });
    res.json({
      message: 'Activity relationships updated successfully',
      activity
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    next(error);
  }
}
