import mongoose from 'mongoose';

export const ROOM_TYPES = ['Classroom', 'Laboratory', 'Seminar Room', 'Auditorium', 'Other'];

const RoomSchema = new mongoose.Schema({
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: [true, 'Institution reference is required']
  },
  name: {
    type: String,
    required: [true, 'Room name is required'],
    trim: true
  },
  type: {
    type: String,
    enum: {
      values: ROOM_TYPES,
      message: '{VALUE} is not a supported room type'
    },
    default: 'Classroom',
    required: [true, 'Room type is required']
  },
  capacity: {
    type: Number,
    required: [true, 'Room capacity is required'],
    min: [1, 'Capacity must be at least 1']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Composite unique index for room name within institution
RoomSchema.index({ institutionId: 1, name: 1 }, { unique: true });

export default mongoose.model('Room', RoomSchema);
