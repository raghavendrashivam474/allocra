import mongoose from 'mongoose';

const DepartmentSchema = new mongoose.Schema({
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: [true, 'Institution reference is required']
  },
  name: {
    type: String,
    required: [true, 'Department name is required'],
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Department', DepartmentSchema);
