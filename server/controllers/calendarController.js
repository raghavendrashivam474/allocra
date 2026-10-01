import * as calendarService from '../core/institution/calendar/calendarService.js';

export async function getCalendar(req, res, next) {
  try {
    const calendar = await calendarService.getCalendar();
    res.json({ calendar: calendar || null });
  } catch (error) {
    next(error);
  }
}

export async function saveCalendar(req, res, next) {
  try {
    const { workingDays } = req.body;
    const calendar = await calendarService.saveCalendar({ workingDays });
    res.json({
      message: 'Calendar saved successfully',
      calendar
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    next(error);
  }
}
