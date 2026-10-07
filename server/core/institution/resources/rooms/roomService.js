import Room, { ROOM_TYPES } from '../../../../data/models/Room.js';
import Institution from '../../../../data/models/Institution.js';

export { ROOM_TYPES };

export async function getRooms() {
  const institution = await Institution.findOne().sort({ createdAt: -1 });
  if (!institution) {
    return [];
  }
  return await Room.find({ institutionId: institution._id }).sort({ createdAt: 1 });
}

export async function createRoom({ name, type, capacity }) {
  if (!name || !name.trim()) {
    const error = new Error('Room name is required');
    error.statusCode = 400;
    throw error;
  }

  const trimmedName = name.trim();

  if (!type || !ROOM_TYPES.includes(type)) {
    const error = new Error(`Invalid room type. Must be one of: ${ROOM_TYPES.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }

  const parsedCapacity = Number(capacity);
  if (!capacity || isNaN(parsedCapacity) || !Number.isInteger(parsedCapacity) || parsedCapacity <= 0) {
    const error = new Error('Capacity must be a positive integer');
    error.statusCode = 400;
    throw error;
  }

  const institution = await Institution.findOne().sort({ createdAt: -1 });
  if (!institution) {
    const error = new Error('Institution must be configured before adding rooms');
    error.statusCode = 400;
    throw error;
  }

  // Check duplicate room name within institution
  const existing = await Room.findOne({
    institutionId: institution._id,
    name: { $regex: new RegExp(`^${trimmedName}$`, 'i') }
  });

  if (existing) {
    const error = new Error(`Room '${trimmedName}' already exists in this institution`);
    error.statusCode = 400;
    throw error;
  }

  const room = new Room({
    institutionId: institution._id,
    name: trimmedName,
    type,
    capacity: parsedCapacity
  });

  return await room.save();
}
