const express = require('express');
const router = express.Router();
const User = require('../models/User');

// POST /api/login: Authenticate or create user
router.post('/login', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    let user = await User.findOne({ email });
    
    if (user) {
      if (user.password !== password) {
        return res.status(401).json({ error: 'Invalid password' });
      }
      return res.json({ message: 'Login successful', user });
    } else {
      // Create new user if they don't exist
      user = new User({ email, password, name: name || email.split('@')[0] });
      await user.save();
      return res.status(201).json({ message: 'User created and logged in', user });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/profile: Update user profile
router.post('/profile', async (req, res) => {
  try {
    const { 
      email, 
      name, 
      education, 
      fieldOfStudy, 
      experience, 
      targetCareer, 
      timeline, 
      learningPref, 
      skills 
    } = req.body;
    
    const user = await User.findOneAndUpdate(
      { email }, 
      { 
        name, education, fieldOfStudy, experience, targetCareer, timeline, learningPref, skills 
      }, 
      { new: true }
    );
    
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'Profile updated', user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/unlock: Unlock a course
router.post('/unlock', async (req, res) => {
  try {
    const { email, courseId } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    user.unlockedCourses.set(courseId, true);
    await user.save();
    
    res.json({ message: 'Course unlocked', unlockedCourses: user.unlockedCourses });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
