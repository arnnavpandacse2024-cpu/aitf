const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, default: '' },
  education: { type: String, default: '' },
  fieldOfStudy: { type: String, default: '' },
  experience: { type: String, default: '' },
  targetCareer: { type: String, default: '' },
  timeline: { type: String, default: '6 months' },
  learningPref: { type: String, default: 'online' },
  skills: { type: [String], default: [] },
  unlockedCourses: { type: Map, of: Boolean, default: {} },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
