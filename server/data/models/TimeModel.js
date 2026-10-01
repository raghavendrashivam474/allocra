import mongoose from 'mongoose';

const timeSlotEntry = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  startTime: {
    type: String,
    required: [true, 'Start time is required']
  },
  endTime: {
    type: String,
    required: [true, 'End time is required']
  }
}, { _id: false });

const TimeModelSchema = new mongoose.Schema({
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: [true, 'Institution reference is required']
  },
  periods: {
    type: [timeSlotEntry],
    default: []
  },
  breaks: {
    type: [timeSlotEntry],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

TimeModelSchema.index({ institutionId: 1 }, { unique: true });

export default mongoose.model('TimeModel', TimeModelSchema);
