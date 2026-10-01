import mongoose from 'mongoose';

const ProgramSchema = new mongoose.Schema({
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: [true, 'Institution reference is required']
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: [true, 'Department reference is required']
  },
  name: {
    type: String,
    required: [true, 'Program name is required'],
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Program', ProgramSchema);
