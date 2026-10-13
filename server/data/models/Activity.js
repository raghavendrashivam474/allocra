import mongoose from 'mongoose';

const ActivitySchema = new mongoose.Schema({
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: [true, 'Institution reference is required']
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: [true, 'Group reference is required']
  },
  name: {
    type: String,
    required: [true, 'Activity name is required'],
    trim: true
  },
  facultyIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty'
  }],
  roomIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Activity', ActivitySchema);
