import * as timeModelService from '../core/institution/time-model/timeModelService.js';

export async function getTimeModel(req, res, next) {
  try {
    const timeModel = await timeModelService.getTimeModel();
    res.json({ timeModel: timeModel || null });
  } catch (error) {
    next(error);
  }
}

export async function saveTimeModel(req, res, next) {
  try {
    const { periods, breaks } = req.body;
    const timeModel = await timeModelService.saveTimeModel({
      periods: periods || [],
      breaks: breaks || []
    });
    res.json({
      message: 'Time model saved successfully',
      timeModel
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    next(error);
  }
}
