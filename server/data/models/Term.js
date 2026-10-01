import mongoose from 'mongoose';

const TermSchema = new mongoose.Schema({
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: [true, 'Institution reference is required']
  },
  name: {
    type: String,
    required: [true, 'Term name is required'],
    trim: true
  },
  academicYear: {
    type: String,
    required: [true, 'Academic year is required'],
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Term', TermSchema);
