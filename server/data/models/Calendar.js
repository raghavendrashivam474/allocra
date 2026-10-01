import mongoose from 'mongoose';

const VALID_DAYS = [
  'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY',
  'FRIDAY', 'SATURDAY', 'SUNDAY'
];

const CalendarSchema = new mongoose.Schema({
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: [true, 'Institution reference is required']
  },
  workingDays: {
    type: [String],
    required: [true, 'Working days are required'],
    validate: {
      validator: function (days) {
        return days.length > 0 && days.every(d => VALID_DAYS.includes(d));
      },
      message: 'Working days must contain at least one valid day (MONDAY-SUNDAY)'
    }
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

CalendarSchema.index({ institutionId: 1 }, { unique: true });

export default mongoose.model('Calendar', CalendarSchema);
