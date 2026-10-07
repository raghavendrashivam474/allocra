import * as roomService from '../core/institution/resources/rooms/roomService.js';

export async function getRooms(req, res, next) {
  try {
    const rooms = await roomService.getRooms();
    res.json({ rooms, roomTypes: roomService.ROOM_TYPES });
  } catch (error) {
    next(error);
  }
}

export async function createRoom(req, res, next) {
  try {
    const { name, type, capacity } = req.body;
    const room = await roomService.createRoom({ name, type, capacity });
    res.status(201).json({
      message: 'Room created successfully',
      room
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    next(error);
  }
}
