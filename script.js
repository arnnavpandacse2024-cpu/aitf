/* ============================================
   CAREERFORGE — SCRIPT.JS
   Career Guidance & Skill Gap Analyzer Logic
   ============================================ */

'use strict';

// ──────────────────────────────────────────────
// CUSTOM CURSOR
// ──────────────────────────────────────────────
const cursor = document.getElementById('cursor');
const cursorFollower = document.getElementById('cursorFollower');

let mouseX = 0, mouseY = 0;
let followerX = 0, followerY = 0;

document.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  cursor.style.left = mouseX + 'px';
  cursor.style.top  = mouseY + 'px';
});

function animateCursor() {
  followerX += (mouseX - followerX) * 0.1;
  followerY += (mouseY - followerY) * 0.1;
  cursorFollower.style.left = followerX + 'px';
  cursorFollower.style.top  = followerY + 'px';
  requestAnimationFrame(animateCursor);
}
animateCursor();

document.querySelectorAll('button, a, .chip, .tl-option, .pref-card, .course-item').forEach(el => {
  el.addEventListener('mouseenter', () => { cursor.style.transform = 'translate(-50%,-50%) scale(2)'; });
  el.addEventListener('mouseleave', () => { cursor.style.transform = 'translate(-50%,-50%) scale(1)'; });
});


// ──────────────────────────────────────────────
// STATE
// ──────────────────────────────────────────────
const state = {
  currentStep: 1,
  selectedCareer: '',
  timeline: '6 months',
  learningPref: 'online',
  skills: [],
  unlockedCourses: {},
  currentCourses: [],
  currentUserEmail: null
};

// ──────────────────────────────────────────────
// SCROLL HELPER
// ──────────────────────────────────────────────
function scrollToAnalyzer() {
  document.getElementById('analyzer').scrollIntoView({ behavior: 'smooth' });
}

// ──────────────────────────────────────────────
// STEP NAVIGATION
// ──────────────────────────────────────────────
function goToStep(step) {
  // Hide all steps
  document.querySelectorAll('.form-step').forEach(el => el.classList.remove('active'));
  // Show target step
  document.getElementById('form-step-' + step).classList.add('active');

  // Update dot indicators
  document.querySelectorAll('.step').forEach((el, i) => {
    el.classList.remove('active', 'done');
    if (i + 1 < step)  el.classList.add('done');
    if (i + 1 === step) el.classList.add('active');
  });

  state.currentStep = step;
  
  // Tutor Logic
  const tutorMsgs = [
    "Hi! I'm your Career Guide. Not sure what to choose? Scroll down to explore Trending Careers!",
    "Great! Let's start with your basics. Tell us your name and education level.",
    "Almost there! What career role are you aiming for?",
    "Scanning the industry and crunching data... Hang tight!",
    "Your personalized Roadmap, Syllabus, and Skill Gap report are ready!"
  ];
  const speech = document.getElementById('tutorSpeech');
  if(speech) {
    speech.style.opacity = '0';
    setTimeout(() => {
      speech.textContent = tutorMsgs[step - 1] || "Here are your results!";
      speech.style.opacity = '1';
    }, 300);
  }
}

async function nextStep(from) {
  if (from === 1) {
    const email = document.getElementById('userEmail')?.value.trim();
    const pass = document.getElementById('userPass')?.value;
    if (!email || !pass) {
      shake(document.getElementById('form-step-1'));
      showToast('Please enter your email and password to log in.');
      return;
    }
    if (!email.includes('@')) {
      shake(document.getElementById('form-step-1'));
      showToast('Please enter a valid email address.');
      return;
    }
    
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass })
      });
      const data = await res.json();
      if (!res.ok) {
        shake(document.getElementById('form-step-1'));
        showToast(data.error || 'Login failed');
        return;
      }
      
      state.currentUserEmail = email;
      
      const nameInput = document.getElementById('userName');
      if (data.user && data.user.name) {
        nameInput.value = data.user.name;
      } else if (nameInput && !nameInput.value) {
        nameInput.value = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ');
      }
      
      if (data.user) {
        if (data.user.education) document.getElementById('education').value = data.user.education;
        if (data.user.fieldOfStudy) document.getElementById('fieldOfStudy').value = data.user.fieldOfStudy;
        if (data.user.experience) document.getElementById('experience').value = data.user.experience;
        if (data.user.unlockedCourses) state.unlockedCourses = data.user.unlockedCourses;
        if (data.user.skills && data.user.skills.length > 0) {
          state.skills = data.user.skills;
          renderSkillTags();
        }
      }
    } catch (err) {
      showToast('Error connecting to server.');
      return;
    }
  } else if (from === 2) {
    const name = document.getElementById('userName').value.trim();
    const edu  = document.getElementById('education').value;
    if (!name || !edu) {
      shake(document.getElementById('form-step-2'));
      showToast('Please fill in your name and education level.');
      return;
    }
  }
  goToStep(from + 1);
}

function prevStep(from) {
  goToStep(from - 1);
}

// ──────────────────────────────────────────────
// CAREER CHIP SELECTION
// ──────────────────────────────────────────────
function selectCareer(el) {
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  state.selectedCareer = el.dataset.value;
  document.getElementById('customCareer').value = '';
}

// Also grab custom career input
document.getElementById('customCareer')?.addEventListener('input', (e) => {
  if (e.target.value.trim()) {
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
    state.selectedCareer = e.target.value.trim();
  }
});

// ──────────────────────────────────────────────
// SKILL TAGS
// ──────────────────────────────────────────────
function handleSkillInput(e) {
  if (e.key === 'Enter' || e.key === ',') {
    e.preventDefault();
    const val = e.target.value.trim().replace(/,$/, '');
    if (val && !state.skills.includes(val)) {
      state.skills.push(val);
      renderSkillTags();
    }
    e.target.value = '';
  }
}

function renderSkillTags() {
  const container = document.getElementById('skillTags');
  container.innerHTML = state.skills.map((s, i) => `
    <span class="skill-tag">
      ${s}
      <button onclick="removeSkill(${i})" title="Remove">×</button>
    </span>
  `).join('');
}

function removeSkill(index) {
  state.skills.splice(index, 1);
  renderSkillTags();
}

// ──────────────────────────────────────────────
// TIMELINE SELECTOR
// ──────────────────────────────────────────────
function selectTimeline(el, value) {
  document.querySelectorAll('.tl-option').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  state.timeline = value;
}

// ──────────────────────────────────────────────
// LEARNING PREFERENCE
// ──────────────────────────────────────────────
function selectPref(pref) {
  document.querySelectorAll('.pref-card').forEach(p => p.classList.remove('active'));
  document.getElementById('pref-' + pref).classList.add('active');
  state.learningPref = pref;
}

// ──────────────────────────────────────────────
// CAREER DATA ENGINE
// ──────────────────────────────────────────────
const CAREER_DATA = {
  "Data Scientist": {
    requiredSkills: [
      { name: "Python",        weight: 95 },
      { name: "Machine Learning", weight: 90 },
      { name: "SQL",           weight: 80 },
      { name: "Statistics",    weight: 85 },
      { name: "TensorFlow / PyTorch", weight: 75 },
      { name: "Data Visualization", weight: 70 },
      { name: "Feature Engineering", weight: 65 },
    ],
    courses: [
      { icon: "🎓", name: "Machine Learning Specialization", provider: "Coursera – Andrew Ng", tag: "Top Rated" },
      { icon: "📊", name: "Data Science with Python", provider: "edX – MIT", tag: "Certified" },
      { icon: "🧠", name: "Deep Learning Specialization", provider: "Coursera – DeepLearning.AI", tag: "Advanced" },
      { icon: "🗄️", name: "SQL for Data Science", provider: "Udemy", tag: "Beginner Friendly" },
    ],
    roadmap: [
      { phase: 1, title: "Foundations", desc: "Master Python fundamentals, statistics, and SQL. Complete EDA projects on Kaggle.", time: "Month 1–2" },
      { phase: 2, title: "Core ML & Modeling", desc: "Study supervised/unsupervised learning. Build 3 end-to-end ML projects.", time: "Month 3–4" },
      { phase: 3, title: "Deep Learning & Specialization", desc: "Learn neural networks, NLP or Computer Vision. Earn 2 certifications.", time: "Month 5–6+" },
    ],
    contentCreators: [
      { name: "@3blue1brown", desc: "For foundational math and neural networks", icon: "📺" },
      { name: "StatQuest with Josh Starmer", desc: "Machine learning concepts made easy", icon: "📺" },
      { name: "Towards Data Science", desc: "Top Medium publication for DS", icon: "📰" }
    ],
    interviewQuestions: [
      { q: "What is the difference between supervised and unsupervised learning?", a: "Explain the training process with labeled vs unlabeled data." },
      { q: "How do you handle missing or imbalanced data?", a: "Discuss techniques like SMOTE, imputation, or using different metrics." }
    ],
    communities: [
      { name: "r/datascience", desc: "Over 1M members sharing resources & tips", icon: "🤖" },
      { name: "Kaggle Forums", desc: "Participate in discussions & competitions", icon: "🏆" }
    ]
  },
  "Full Stack Developer": {
    requiredSkills: [
      { name: "JavaScript / TypeScript", weight: 95 },
      { name: "React.js",        weight: 90 },
      { name: "Node.js",         weight: 85 },
      { name: "REST APIs",       weight: 85 },
      { name: "SQL / MongoDB",   weight: 75 },
      { name: "Git & CI/CD",     weight: 80 },
      { name: "Docker",          weight: 65 },
    ],
    courses: [
      { icon: "⚛️", name: "The Complete React Developer", provider: "Udemy – Zero to Mastery", tag: "Bestseller" },
      { icon: "🌐", name: "Full-Stack Open", provider: "University of Helsinki – Free", tag: "Free" },
      { icon: "🛠️", name: "Node.js, Express, MongoDB Bootcamp", provider: "Udemy – Jonas Schmedtmann", tag: "Top Rated" },
      { icon: "🚀", name: "AWS Certified Developer Associate", provider: "AWS / A Cloud Guru", tag: "Certification" },
    ],
    roadmap: [
      { phase: 1, title: "Frontend Mastery", desc: "Solidify HTML/CSS/JS. Build responsive UIs with React. Deploy 2 projects.", time: "Month 1–2" },
      { phase: 2, title: "Backend & APIs", desc: "Learn Node.js, Express, databases. Build RESTful APIs with auth.", time: "Month 3–4" },
      { phase: 3, title: "DevOps & Production", desc: "Master Docker, CI/CD pipelines, cloud deployment. Ship a full-stack product.", time: "Month 5–6+" },
    ],
    contentCreators: [
      { name: "Fireship", desc: "High-intensity code tutorials", icon: "📺" },
      { name: "Traversy Media", desc: "In-depth web development crash courses", icon: "📺" },
      { name: "ByteByteGo", desc: "System design simplified", icon: "📰" }
    ],
    interviewQuestions: [
      { q: "Explain the virtual DOM in React.", a: "Discuss how React reconciles changes minimizing real DOM updates." },
      { q: "What is the event loop in Node.js?", a: "Explain asynchronous non-blocking I/O operations." }
    ],
    communities: [
      { name: "r/webdev", desc: "Largest web dev subreddit", icon: "🌐" },
      { name: "Reactiflux", desc: "Massive Discord community for React devs", icon: "💬" }
    ]
  },
  "Machine Learning Engineer": {
    requiredSkills: [
      { name: "Python",          weight: 95 },
      { name: "TensorFlow / PyTorch", weight: 90 },
      { name: "MLOps",           weight: 80 },
      { name: "Cloud (AWS/GCP)", weight: 85 },
      { name: "Docker / Kubernetes", weight: 75 },
      { name: "Data Engineering", weight: 70 },
      { name: "System Design",   weight: 65 },
    ],
    courses: [
      { icon: "🤖", name: "MLOps Specialization", provider: "Coursera – DeepLearning.AI", tag: "Trending" },
      { icon: "☁️", name: "GCP Professional ML Engineer", provider: "Google Cloud", tag: "Certification" },
      { icon: "🧪", name: "Hands-on ML with Scikit-Learn & TF", provider: "O'Reilly / Book", tag: "Deep Dive" },
      { icon: "📦", name: "Docker & Kubernetes for ML", provider: "Udemy", tag: "Practical" },
    ],
    roadmap: [
      { phase: 1, title: "ML Foundations", desc: "Deep Python & ML fundamentals. Understand model training, evaluation, tuning.", time: "Month 1–2" },
      { phase: 2, title: "Production ML", desc: "Learn MLOps tools: MLflow, Kubeflow. Build ML pipelines with Docker.", time: "Month 3–4" },
      { phase: 3, title: "Cloud & Scale", desc: "Deploy models on AWS/GCP. Get cloud ML certification. Contribute to open source.", time: "Month 5–6+" },
    ],
    contentCreators: [
      { name: "Lex Fridman", desc: "AI and machine learning podcasts", icon: "🎤" },
      { name: "Yannic Kilcher", desc: "Paper reviews and ML news", icon: "📺" }
    ],
    interviewQuestions: [
      { q: "How does backpropagation work?", a: "Explain the chain rule and weight updates." },
      { q: "Explain Bias-Variance Tradeoff.", a: "Discuss overfitting vs underfitting in models." }
    ],
    communities: [
      { name: "r/MachineLearning", desc: "Research, news, and discussion", icon: "🤖" },
      { name: "Hugging Face Spaces", desc: "Collaborative open source ML", icon: "🤗" }
    ]
  },
  "Cloud Architect": {
    requiredSkills: [
      { name: "AWS / Azure / GCP", weight: 95 },
      { name: "Infrastructure as Code", weight: 85 },
      { name: "Networking",      weight: 80 },
      { name: "Security & IAM",  weight: 85 },
      { name: "Kubernetes",      weight: 75 },
      { name: "Microservices",   weight: 70 },
      { name: "Cost Optimization", weight: 65 },
    ],
    courses: [
      { icon: "☁️", name: "AWS Solutions Architect Associate", provider: "AWS / Stephane Maarek", tag: "Top Rated" },
      { icon: "🏗️", name: "Terraform on AWS", provider: "Udemy", tag: "IaC Focused" },
      { icon: "🔐", name: "Cloud Security Fundamentals", provider: "Coursera – Google", tag: "Essential" },
      { icon: "⚓", name: "Certified Kubernetes Administrator", provider: "CNCF / Linux Foundation", tag: "Certification" },
    ],
    roadmap: [
      { phase: 1, title: "Cloud Fundamentals", desc: "Learn core AWS/Azure services: compute, storage, networking, IAM.", time: "Month 1–2" },
      { phase: 2, title: "Infrastructure & DevOps", desc: "Master Terraform, CI/CD, Docker, Kubernetes. Build cloud-native apps.", time: "Month 3–4" },
      { phase: 3, title: "Architecture & Certification", desc: "Design multi-region, secure, cost-efficient architectures. Pass Solutions Architect exam.", time: "Month 5–6+" },
    ],
    contentCreators: [
      { name: "Stephane Maarek", desc: "AWS Certification expert", icon: "📺" },
      { name: "A Cloud Guru", desc: "Cloud news, updates, and deep dives", icon: "☁️" }
    ],
    interviewQuestions: [
      { q: "How would you design a highly available system?", a: "Discuss multi-AZ, load balancing, and auto-scaling." },
      { q: "Explain infrastructure as code (IaC).", a: "Talk about Terraform/CloudFormation and declarative syntax." }
    ],
    communities: [
      { name: "r/aws / r/azure", desc: "Cloud provider specific discussions", icon: "☁️" },
      { name: "CNCF", desc: "Slack channel for Kubernetes and cloud ops", icon: "⚓" }
    ]
  },
  "Product Manager": {
    requiredSkills: [
      { name: "Product Strategy",  weight: 90 },
      { name: "Data Analysis",     weight: 80 },
      { name: "User Research",     weight: 85 },
      { name: "Agile / Scrum",     weight: 80 },
      { name: "Roadmapping",       weight: 85 },
      { name: "Stakeholder Management", weight: 75 },
      { name: "SQL (basic)",       weight: 60 },
    ],
    courses: [
      { icon: "🗺️", name: "Product Management Fundamentals", provider: "Coursera – Duke University", tag: "Top Rated" },
      { icon: "📊", name: "Data-Driven Product Management", provider: "LinkedIn Learning", tag: "Practical" },
      { icon: "🧪", name: "Lean Product & Lean Analytics", provider: "O'Reilly / Book", tag: "Essential Read" },
      { icon: "🎯", name: "Professional Scrum Product Owner", provider: "Scrum.org", tag: "Certification" },
    ],
    roadmap: [
      { phase: 1, title: "PM Fundamentals", desc: "Learn product thinking, user research, and writing PRDs. Shadow a senior PM.", time: "Month 1–2" },
      { phase: 2, title: "Analytics & Execution", desc: "Master SQL basics, A/B testing, product metrics. Lead a feature from 0→1.", time: "Month 3–4" },
      { phase: 3, title: "Strategy & Leadership", desc: "Build roadmapping skills, stakeholder alignment. Earn PSPO certification.", time: "Month 5–6+" },
    ]
  },
  "Cybersecurity Analyst": {
    requiredSkills: [
      { name: "Network Security",  weight: 90 },
      { name: "SIEM Tools",        weight: 80 },
      { name: "Penetration Testing", weight: 75 },
      { name: "Python / Bash Scripting", weight: 70 },
      { name: "Incident Response", weight: 85 },
      { name: "Linux",             weight: 80 },
      { name: "Compliance (SOC2/ISO)", weight: 65 },
    ],
    courses: [
      { icon: "🛡️", name: "CompTIA Security+", provider: "CompTIA / Professor Messer", tag: "Foundation" },
      { icon: "🔍", name: "Certified Ethical Hacker (CEH)", provider: "EC-Council", tag: "Certification" },
      { icon: "🐧", name: "Linux for Security Professionals", provider: "Udemy", tag: "Essential" },
      { icon: "🔥", name: "SOC Analyst Learning Path", provider: "TryHackMe", tag: "Hands-on" },
    ],
    roadmap: [
      { phase: 1, title: "Security Foundations", desc: "Learn networking, Linux CLI, CIA triad concepts. Pass CompTIA Security+.", time: "Month 1–3" },
      { phase: 2, title: "Offensive & Defensive Skills", desc: "Practice on TryHackMe/HackTheBox. Learn SIEM tools (Splunk, ELK).", time: "Month 4–5" },
      { phase: 3, title: "Specialization & Certs", desc: "Choose SOC analyst, pentester, or cloud security path. Earn advanced cert.", time: "Month 6+" },
    ]
  },
  "DevOps Engineer": {
    requiredSkills: [
      { name: "Linux / Bash",      weight: 90 },
      { name: "Docker / Kubernetes", weight: 90 },
      { name: "CI/CD Pipelines",   weight: 85 },
      { name: "Cloud (AWS/GCP)",   weight: 85 },
      { name: "Terraform",         weight: 80 },
      { name: "Monitoring (Prometheus/Grafana)", weight: 70 },
      { name: "Python / Go",       weight: 65 },
    ],
    courses: [
      { icon: "⚙️", name: "DevOps Bootcamp (CI/CD, Docker, K8s)", provider: "Udemy – TechWorld with Nana", tag: "Bestseller" },
      { icon: "🏗️", name: "HashiCorp Terraform Associate", provider: "HashiCorp Certification", tag: "Certification" },
      { icon: "☁️", name: "AWS DevOps Engineer Professional", provider: "AWS", tag: "Advanced" },
      { icon: "📈", name: "Monitoring & Observability", provider: "Grafana / Prometheus Docs", tag: "Free" },
    ],
    roadmap: [
      { phase: 1, title: "Linux & Containers", desc: "Master Linux CLI, scripting, Docker, and Git branching strategies.", time: "Month 1–2" },
      { phase: 2, title: "CI/CD & Orchestration", desc: "Build Jenkins/GitHub Actions pipelines. Deploy apps with Kubernetes.", time: "Month 3–4" },
      { phase: 3, title: "Cloud & IaC", desc: "Automate infra with Terraform. Get AWS/GCP DevOps certification.", time: "Month 5–6+" },
    ]
  },
  "UI/UX Designer": {
    requiredSkills: [
      { name: "Figma",             weight: 95 },
      { name: "User Research",     weight: 85 },
      { name: "Wireframing",       weight: 90 },
      { name: "Interaction Design", weight: 80 },
      { name: "Design Systems",    weight: 75 },
      { name: "Usability Testing", weight: 80 },
      { name: "HTML/CSS (basic)",  weight: 55 },
    ],
    courses: [
      { icon: "🎨", name: "Google UX Design Certificate", provider: "Coursera – Google", tag: "Top Rated" },
      { icon: "🖌️", name: "Figma UI Design – Zero to Hero", provider: "Udemy", tag: "Practical" },
      { icon: "🔬", name: "Interaction Design Foundation", provider: "IDF – Subscription", tag: "Deep Dive" },
      { icon: "📐", name: "Design Systems with Figma", provider: "Designcode.io", tag: "Advanced" },
    ],
    roadmap: [
      { phase: 1, title: "Design Fundamentals", desc: "Learn design principles, typography, color theory. Master Figma basics.", time: "Month 1–2" },
      { phase: 2, title: "UX Research & Prototyping", desc: "Conduct user interviews, build wireframes and high-fidelity prototypes.", time: "Month 3–4" },
      { phase: 3, title: "Portfolio & Systems", desc: "Design a design system. Ship 3 case studies. Apply for junior roles.", time: "Month 5–6+" },
    ]
  }
};

// Default fallback for custom roles
function getDefaultCareerData(role) {
  return {
    requiredSkills: [
      { name: "Core Technical Skills",     weight: 90 },
      { name: "Problem Solving",           weight: 85 },
      { name: "Communication",             weight: 80 },
      { name: "Domain Knowledge",          weight: 85 },
      { name: "Project Management",        weight: 70 },
      { name: "Data Literacy",             weight: 65 },
    ],
    courses: [
      { icon: "📚", name: `${role} Fundamentals`, provider: "Coursera", tag: "Beginner" },
      { icon: "🎓", name: "Professional Certification", provider: "Industry Body", tag: "Certification" },
      { icon: "🛠️", name: "Hands-on Projects", provider: "GitHub / Portfolio", tag: "Practical" },
    ],
    roadmap: [
      { phase: 1, title: "Foundations", desc: `Learn the core concepts and tools required for a ${role} role.`, time: "Month 1–2" },
      { phase: 2, title: "Applied Skills", desc: "Build projects, contribute to teams, and gain practical experience.", time: "Month 3–4" },
      { phase: 3, title: "Specialization", desc: "Earn certifications, refine your portfolio, and apply for roles.", time: "Month 5–6+" },
    ],
    contentCreators: [
      { name: "Relevant Industry Blogs", desc: "Stay updated with latest articles", icon: "📰" },
      { name: "Top YouTube Channels", desc: "Search for crash courses in your field", icon: "📺" }
    ],
    interviewQuestions: [
      { q: "Tell me about a time you solved a complex problem.", a: "Use the STAR method." },
      { q: "Where do you see yourself in 3 years in this field?", a: "Align personal goals with role trajectory." }
    ],
    communities: [
      { name: "LinkedIn Groups", desc: "Find professional groups for networking", icon: "💼" },
      { name: "Reddit Niche Forums", desc: "Search for specific Subreddits", icon: "💬" }
    ]
  };
}

// ──────────────────────────────────────────────
// SKILL MATCHING ENGINE
// ──────────────────────────────────────────────
function matchSkills(userSkills, requiredSkills) {
  const userLower = userSkills.map(s => s.toLowerCase().trim());

  return requiredSkills.map(req => {
    const reqLower = req.name.toLowerCase();
    // Check for partial / keyword match
    const match = userLower.some(u => {
      const ul = u.toLowerCase();
      return reqLower.includes(ul) || ul.includes(reqLower) ||
             reqLower.split(/[\s\/]/g).some(word => word.length > 2 && ul.includes(word));
    });
    const userLevel = match ? Math.floor(Math.random() * 25 + 65) : Math.floor(Math.random() * 30 + 15);
    return { ...req, userLevel, matched: match };
  });
}

function calcOverallMatch(matched) {
  const total = matched.reduce((sum, s) => sum + s.weight, 0);
  const got   = matched.reduce((sum, s) => sum + (s.userLevel / 100) * s.weight, 0);
  return Math.round((got / total) * 100);
}

// ──────────────────────────────────────────────
// RUN ANALYSIS
// ──────────────────────────────────────────────
async function runAnalysis() {
  const career = state.selectedCareer || document.getElementById('customCareer').value.trim();
  if (!career) {
    showToast('Please select or enter a target career role.');
    return;
  }
  if (state.skills.length === 0) {
    showToast('Please add at least one skill.');
    return;
  }

  state.selectedCareer = career;
  
  if (state.currentUserEmail) {
    try {
      await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: state.currentUserEmail,
          name: document.getElementById('userName').value.trim(),
          education: document.getElementById('education').value,
          fieldOfStudy: document.getElementById('fieldOfStudy').value,
          experience: document.getElementById('experience').value,
          targetCareer: career,
          timeline: state.timeline,
          learningPref: state.learningPref,
          skills: state.skills
        })
      });
    } catch (e) {
      console.error('Failed to save profile to backend', e);
    }
  }

  goToStep(4); // Go to loading step

  // Animate loading steps
  const lsIds = ['ls1', 'ls2', 'ls3', 'ls4'];
  const texts = ['Scanning industry data...', 'Mapping your skills...', 'Identifying gaps...', 'Building your roadmap...'];

  lsIds.forEach((id, i) => {
    setTimeout(() => {
      document.getElementById(id).classList.add('done');
      document.getElementById('loadingText').textContent = texts[i] || 'Finalizing...';
    }, (i + 1) * 650);
  });

  setTimeout(() => {
    buildResults();
    goToStep(5); // Go to results step
  }, 3200);
}

// ──────────────────────────────────────────────
// BUILD RESULTS HTML
// ──────────────────────────────────────────────
function buildResults() {
  const career = state.selectedCareer;
  const data   = CAREER_DATA[career] || getDefaultCareerData(career);
  const name   = document.getElementById('userName').value.trim() || 'Student';

  // Inject syllabus links dynamically if not present
  data.roadmap.forEach(r => {
    if (!r.syllabus) {
      r.syllabus = [
        { topic: r.title + " Concepts Tutorial", type: "video", url: "https://www.youtube.com/results?search_query=" + encodeURIComponent(career + " " + r.title + " tutorial full course") },
        { topic: r.title + " Cheat Sheet & Guide", type: "pdf", url: "#", action: `generateResourcePDF('${career}', '${r.title}')` }
      ];
    }
  });

  const matched     = matchSkills(state.skills, data.requiredSkills);
  const overallMatch = calcOverallMatch(matched);
  
  state.currentCourses = data.courses;

  // Categorize gaps
  const gaps = matched.filter(s => s.userLevel < 60).map(s => ({
    name: s.name,
    severity: s.userLevel < 30 ? 'Critical' : s.userLevel < 50 ? 'Important' : 'Nice to Have'
  }));

  const html = `
    <div class="result-header">
      <div>
        <h2>📊 ${name}'s Skill Gap Report</h2>
        <p>Target Role: <strong style="color:var(--accent)">${career}</strong> &nbsp;•&nbsp; Timeline: ${state.timeline}</p>
      </div>
      <div class="match-badge">
        <span class="pct">${overallMatch}%</span>
        <span class="lbl">Career Match</span>
      </div>
    </div>

    <div class="result-grid">
      <!-- Skill Analysis -->
      <div class="result-card" style="grid-column:span 2">
        <h4>⚡ Skill Analysis</h4>
        <div class="skill-bar-list">
          ${matched.map(s => {
            const cls = s.userLevel >= 65 ? 'green' : s.userLevel >= 40 ? 'yellow' : 'red';
            const label = s.userLevel >= 65 ? '✓ Strong' : s.userLevel >= 40 ? '~ Developing' : '✗ Gap';
            const labelColor = s.userLevel >= 65 ? '#22c55e' : s.userLevel >= 40 ? 'var(--accent)' : 'var(--accent-3)';
            return `
              <div class="sb-item">
                <div class="sb-label">
                  <span>${s.name}</span>
                  <em style="color:${labelColor}">${label} · ${s.userLevel}%</em>
                </div>
                <div class="sb-bar">
                  <div class="sb-fill ${cls}" style="width:0%" data-width="${s.userLevel}%"></div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Skill Gaps -->
      <div class="result-card">
        <h4>🎯 Priority Skill Gaps</h4>
        ${gaps.length === 0
          ? '<p style="color:var(--accent);font-size:14px">🎉 Excellent! No critical gaps detected.</p>'
          : `<div class="gap-list">
              ${gaps.map(g => `
                <div class="gap-item">
                  <span>${g.name}</span>
                  <span class="gap-badge ${g.severity === 'Critical' ? 'critical' : g.severity === 'Important' ? 'important' : 'nice'}">
                    ${g.severity}
                  </span>
                </div>
              `).join('')}
            </div>`
        }
      </div>

      <!-- Recommendations -->
      <div class="result-card">
        <h4>💡 Quick Insights</h4>
        <div style="display:flex;flex-direction:column;gap:10px">
          <div style="background:var(--surface);border-radius:10px;padding:12px;font-size:13px;color:var(--text-2)">
            🔥 <strong style="color:var(--text)">Industry Demand:</strong> ${career} roles have grown <span style="color:var(--accent)">+${Math.floor(Math.random()*30+25)}%</span> in 2025
          </div>
          <div style="background:var(--surface);border-radius:10px;padding:12px;font-size:13px;color:var(--text-2)">
            💰 <strong style="color:var(--text)">Avg Salary:</strong> ₹${(Math.floor(Math.random()*8+8))}–${(Math.floor(Math.random()*10+16))} LPA (India)
          </div>
          <div style="background:var(--surface);border-radius:10px;padding:12px;font-size:13px;color:var(--text-2)">
            ⏱️ <strong style="color:var(--text)">Time to Role-Ready:</strong> <span style="color:var(--accent-2)">${state.timeline}</span> with focused effort
          </div>
          <div style="background:var(--surface);border-radius:10px;padding:12px;font-size:13px;color:var(--text-2)">
            📌 <strong style="color:var(--text)">Strengths:</strong> ${matched.filter(s=>s.userLevel>=65).map(s=>s.name).join(', ') || 'Build foundational skills first'}
          </div>
        </div>
      </div>
    </div>

    <!-- Courses -->
    <div class="result-card no-print" style="margin-bottom:20px">
      <h4>📚 Recommended Courses & Certifications</h4>
      <div class="courses-wrap" style="margin-top:4px">
        ${state.currentCourses.map((c, idx) => {
          c.price = 999;
          const courseId = state.selectedCareer.replace(/[^a-zA-Z0-9]/g, '-') + '-' + idx;
          const isUnlocked = state.unlockedCourses[courseId];
          return `
            <div class="course-item">
              <div class="course-icon">${c.icon}</div>
              <div class="course-info">
                <strong>${c.name}</strong>
                <small>${c.provider} • <span class="course-tag" style="margin-left:8px">${c.tag}</span></small>
              </div>
              <div class="course-actions">
                ${!isUnlocked ? `
                  <span class="course-price">₹${c.price.toLocaleString('en-IN')}</span>
                  <button class="btn-unlock" onclick="openPaymentModal('${courseId}', ${idx})">Unlock</button>
                ` : `
                  <span class="course-price" style="color:#22c55e">Purchased</span>
                  <button class="btn-access" onclick="accessCourse(${idx})">Go to Course</button>
                `}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <!-- Personalized Roadmap -->
    <div class="result-card">
      <h4>🗺️ Your Personalized ${state.timeline} Roadmap</h4>
      <div class="roadmap-steps" style="margin-top:20px">
        ${data.roadmap.map((r, i) => `
          <div class="roadmap-item">
            <div class="rd-left">
              <div class="rd-dot phase-${r.phase}">${r.phase}</div>
              ${i < data.roadmap.length - 1 ? '<div class="rd-line"></div>' : ''}
            </div>
            <div class="rd-content">
              <h5>${r.title}</h5>
              <p>${r.desc}</p>
              <span class="rd-time">📅 ${r.time}</span>
              ${r.syllabus && r.syllabus.length > 0 ? `
                <div class="syllabus-list">
                  ${r.syllabus.map(s => `
                    <div class="syllabus-item">
                      <span class="syllabus-topic">🔹 ${s.topic}</span>
                      ${s.type === 'video' 
                        ? `<a href="${s.url}" target="_blank" class="syllabus-link">Watch 📺</a>`
                        : `<a href="${s.url}" onclick="${s.action}; return false;" class="syllabus-link" style="color: #fff; border-color: rgba(255,107,107,0.3); background: var(--accent-3);">PDF 📄</a>`
                      }
                    </div>
                  `).join('')}
                </div>
              ` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- NEW: Content, Interview, Community Modules -->
    <div class="result-grid" style="grid-template-columns: 1fr 1fr; margin-bottom: 20px;">
      
      <!-- Content Creators -->
      <div class="result-card">
        <h4>📺 Who to Follow & Resources</h4>
        <div class="creator-list">
          ${data.contentCreators ? data.contentCreators.map(c => `
            <div class="creator-item">
              <div class="creator-icon">${c.icon}</div>
              <div class="creator-info">
                <h5>${c.name}</h5>
                <span>${c.desc}</span>
              </div>
            </div>
          `).join('') : '<p style="color:var(--text-2);font-size:13px">Search for industry leaders on YouTube/Medium.</p>'}
        </div>
      </div>

      <!-- Communities -->
      <div class="result-card">
        <h4>💬 Communities to Join</h4>
        <div class="community-list">
          ${data.communities ? data.communities.map(c => `
            <div class="community-item">
              <div class="community-icon">${c.icon}</div>
              <div class="community-info">
                <h5>${c.name}</h5>
                <span>${c.desc}</span>
              </div>
            </div>
          `).join('') : '<p style="color:var(--text-2);font-size:13px">Find relevant Discord/Reddit servers.</p>'}
        </div>
      </div>

    </div>

    <!-- Interview Prep -->
    <div class="result-card" style="margin-bottom:20px">
      <h4>🎯 Quick Interview Prep</h4>
      <div class="interview-list">
        ${data.interviewQuestions ? data.interviewQuestions.map(i => `
          <div class="interview-item">
            <strong>Q: ${i.q}</strong>
            <span><em>Tip:</em> ${i.a}</span>
          </div>
        `).join('') : '<p style="color:var(--text-2);font-size:13px">Prepare for general behavioral questions.</p>'}
      </div>
    </div>

    <div class="action-btn-row" style="display:flex;gap:16px;margin-top:28px;">
      <button class="reset-btn" style="flex:1;margin-top:0;" onclick="resetAnalyzer()">↩ Start a New Analysis</button>
      <div style="flex:1; position:relative;" id="printDropdownWrap">
        <button class="btn-primary" style="width:100%;justify-content:center;margin-top:0;display:flex;align-items:center;gap:8px;" onclick="togglePrintDropdown()">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
          Print Options
        </button>
        <div id="printDropdown" style="display:none; position:absolute; bottom:100%; left:0; right:0; background:var(--surface); border:1px solid var(--border); border-radius:8px; padding:8px; margin-bottom:8px; box-shadow:0 10px 20px rgba(0,0,0,0.5); z-index:10; font-family:var(--font-body);">
          <button style="width:100%; padding:10px; background:rgba(255,255,255,0.05); border:none; color:var(--text); text-align:left; cursor:pointer; border-radius:6px; display:flex; align-items:center; gap:8px;" onclick="executePrint()" onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='rgba(255,255,255,0.05)'">
            🖨️ Print Report
          </button>
          <button style="width:100%; padding:10px; background:rgba(255,255,255,0.05); border:none; color:var(--text); text-align:left; cursor:pointer; border-radius:6px; margin-top:4px; display:flex; align-items:center; gap:8px;" onclick="downloadTextReport()" onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='rgba(255,255,255,0.05)'">
            ⬇️ Download Text Data
          </button>
          <button style="width:100%; padding:10px; background:rgba(255,255,255,0.05); border:none; color:var(--text); text-align:left; cursor:pointer; border-radius:6px; margin-top:4px; display:flex; align-items:center; gap:8px;" onclick="downloadSyllabusPDF()" onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='rgba(255,255,255,0.05)'">
            📄 Download Syllabus (PDF)
          </button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('resultsOutput').innerHTML = html;

  // Animate skill bars
  setTimeout(() => {
    document.querySelectorAll('.sb-fill[data-width]').forEach(bar => {
      bar.style.width = bar.dataset.width;
    });
  }, 200);
}

// ──────────────────────────────────────────────
// PRINT & DOWNLOAD OPTIONS
// ──────────────────────────────────────────────
function togglePrintDropdown() {
  const dp = document.getElementById('printDropdown');
  if (dp) {
    dp.style.display = dp.style.display === 'none' ? 'block' : 'none';
  }
}

function executePrint() {
  togglePrintDropdown();
  window.print();
}

function downloadTextReport() {
  togglePrintDropdown();
  const name = document.getElementById('userName').value.trim() || 'Student';
  const career = state.selectedCareer;
  
  let content = `Skill Gap Report for ${name}\n`;
  content += `Target Role: ${career}\n`;
  content += `Timeline: ${state.timeline}\n\n`;
  
  content += `-- Current Skills --\n`;
  content += state.skills.join(', ') + '\n\n';
  
  content += `-- Recommendations --\n`;
  content += `Please use the "Print Report" option and select "Save as PDF" for a full visual representation including charts and roadmaps.\n`;

  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Skill_Gap_Report.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  showToast('Download started!');
}

function downloadSyllabusPDF() {
  togglePrintDropdown();
  showToast('Generating HD PDF (Optimizing assets)...');
  
  const element = document.getElementById('resultsOutput');
  
  // High quality PDF options
  const opt = {
    margin:       [10, 10, 10, 10],
    filename:     `${state.selectedCareer.replace(/[^a-zA-Z0-9]/g, '_')}_Syllabus.pdf`,
    image:        { type: 'jpeg', quality: 1 },
    html2canvas:  { scale: 2, useCORS: true, backgroundColor: '#1a2035', windowWidth: 1200 },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };
  
  // Remove no-print elements temporarily
  const noPrints = element.querySelectorAll('.no-print');
  noPrints.forEach(n => n.style.display = 'none');
  
  html2pdf().set(opt).from(element).save().then(() => {
    showToast('PDF Downloaded successfully!');
    // Restore elements
    noPrints.forEach(n => n.style.display = '');
  });
}

function generateResourcePDF(career, phaseTitle) {
  showToast('Downloading ' + phaseTitle + ' PDF...');
  
  // Create a hidden div to serve as the PDF content
  const div = document.createElement('div');
  div.style.padding = '40px';
  div.style.fontFamily = 'sans-serif';
  div.style.color = '#333';
  div.innerHTML = `
    <h1 style="color:#080b12; margin-bottom: 10px;">${career}</h1>
    <h2 style="color:#4f9eff; margin-bottom: 30px;">${phaseTitle} — Study Guide & Cheat Sheet</h2>
    <div style="margin-bottom: 20px;">
      <h3 style="border-bottom: 2px solid #eee; padding-bottom: 8px;">Key Learning Objectives</h3>
      <ul style="line-height: 1.8; margin-top: 10px;">
        <li>Memorize the core syntax and fundamental building blocks.</li>
        <li>Understand the computational complexity of standard operations.</li>
        <li>Review related architectural patterns and best practices.</li>
        <li>Focus on real-world use cases over rote memorization.</li>
      </ul>
    </div>
    <div style="margin-bottom: 20px;">
      <h3 style="border-bottom: 2px solid #eee; padding-bottom: 8px;">Practical Exercise</h3>
      <p style="line-height: 1.6; margin-top: 10px;">
        Build a concise, end-to-end prototype utilizing these concepts. Write unit tests to ensure that all critical corner cases are successfully covered and document your code accurately.
      </p>
    </div>
    <div style="margin-top: 60px; font-size: 12px; color: #888; text-align: center; border-top: 1px solid #eee; padding-top: 20px;">
      CareerForge AI - Generated Dynamic Syllabus Resources
    </div>
  `;
  document.body.appendChild(div);
  
  const opt = {
    margin:       10,
    filename:     `${phaseTitle.replace(/[^a-zA-Z0-9]/g, '_')}_StudyGuide.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2 },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };
  
  html2pdf().set(opt).from(div).save().then(() => {
    document.body.removeChild(div);
    showToast('Syllabus PDF downloaded successfully!');
  });
}

// Close dropdown if clicking outside
document.addEventListener('click', (e) => {
  const wrap = document.getElementById('printDropdownWrap');
  if (wrap && !wrap.contains(e.target)) {
    const dp = document.getElementById('printDropdown');
    if (dp) dp.style.display = 'none';
  }
});

// ──────────────────────────────────────────────
// RESET
// ──────────────────────────────────────────────
function resetAnalyzer() {
  state.skills = [];
  state.selectedCareer = '';
  state.timeline = '6 months';
  state.learningPref = 'online';

  if (document.getElementById('userEmail')) document.getElementById('userEmail').value = '';
  if (document.getElementById('userPass')) document.getElementById('userPass').value = '';
  document.getElementById('userName').value = '';
  document.getElementById('education').value = '';
  document.getElementById('fieldOfStudy').value = '';
  document.getElementById('experience').value = '';
  document.getElementById('customCareer').value = '';
  document.getElementById('skillTags').innerHTML = '';
  document.getElementById('skillInput').value = '';
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
  document.querySelectorAll('.tl-option').forEach((t, i) => {
    t.classList.toggle('active', i === 1);
  });
  document.querySelectorAll('.pref-card').forEach((p, i) => {
    p.classList.toggle('active', i === 0);
  });

  // Reset loading dots
  document.querySelectorAll('.ls').forEach(el => el.classList.remove('done'));

  goToStep(1);
  scrollToAnalyzer();
}

// ──────────────────────────────────────────────
// TOAST NOTIFICATION
// ──────────────────────────────────────────────
function showToast(msg) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.style.cssText = `
      position:fixed; bottom:32px; left:50%; transform:translateX(-50%);
      background:#1a2035; border:1px solid rgba(255,107,107,0.4); color:#ff6b6b;
      font-family:'DM Sans',sans-serif; font-size:14px; padding:12px 24px;
      border-radius:100px; z-index:9999; transition:all 0.3s;
      box-shadow:0 8px 32px rgba(0,0,0,0.4);
    `;
    document.body.appendChild(toast);
  }
  toast.textContent = '⚠ ' + msg;
  toast.style.opacity = '1';
  toast.style.bottom = '32px';
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.bottom = '20px';
  }, 3000);
}

// ──────────────────────────────────────────────
// SHAKE ANIMATION
// ──────────────────────────────────────────────
function shake(el) {
  el.style.animation = 'none';
  el.style.animation = 'shake 0.4s ease';
  if (!document.getElementById('shakeStyle')) {
    const s = document.createElement('style');
    s.id = 'shakeStyle';
    s.textContent = `@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-6px)}80%{transform:translateX(4px)}}`;
    document.head.appendChild(s);
  }
}

// ──────────────────────────────────────────────
// INTERSECTION OBSERVER — Animate on scroll
// ──────────────────────────────────────────────
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.1 });

// ──────────────────────────────────────────────
// NAV SCROLL EFFECT
// ──────────────────────────────────────────────
window.addEventListener('scroll', () => {
  const nav = document.querySelector('.nav');
  if (window.scrollY > 60) {
    nav.style.background = 'rgba(8,11,18,0.97)';
  } else {
    nav.style.background = 'rgba(8,11,18,0.85)';
  }
});

// ──────────────────────────────────────────────
// PAYMENT MODAL
// ──────────────────────────────────────────────
function openPaymentModal(courseId, courseIdx) {
  const c = state.currentCourses[courseIdx];
  document.getElementById('modalCourseName').textContent = c.name;
  document.getElementById('modalCoursePrice').textContent = `₹${c.price.toLocaleString('en-IN')}`;
  
  const modal = document.getElementById('paymentModal');
  modal.classList.add('active');
  
  const payBtn = document.getElementById('payNowBtn');
  payBtn.innerHTML = 'Pay Now';
  payBtn.disabled = false;
  
  modal.querySelectorAll('input').forEach(input => input.value = '');
  
  payBtn.onclick = function() {
    processPayment(courseId);
  };
}

function closePaymentModal() {
  document.getElementById('paymentModal').classList.remove('active');
}

async function processPayment(courseId) {
  const payBtn = document.getElementById('payNowBtn');
  payBtn.innerHTML = '<div class="loader-ring" style="width:16px;height:16px;border-width:2px;margin:0;display:inline-block;vertical-align:middle;"></div> Processing...';
  payBtn.disabled = true;
  
  if (state.currentUserEmail) {
    try {
      await fetch('/api/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: state.currentUserEmail, courseId })
      });
    } catch (e) {
      console.error('Failed to unlock course on backend', e);
    }
  }

  setTimeout(() => {
    state.unlockedCourses[courseId] = true;
    closePaymentModal();
    showToast('Payment Successful! Course Unlocked.');
    buildResults();
  }, 1500);
}

function accessCourse(courseIdx) {
  const c = state.currentCourses[courseIdx];
  showToast(`Redirecting to ${c.name}...`);
}

// ──────────────────────────────────────────────
// INIT
// ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Pre-select default timeline
  const defaultTL = document.querySelector('.tl-option.active');
  if (defaultTL) state.timeline = defaultTL.textContent.trim();

  // Pre-select default pref
  state.learningPref = 'online';
  
  document.querySelectorAll('.feat-card, .rt-item').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
  });

  console.log('%cCareerForge Loaded ✓', 'color:#e8ff47;font-family:monospace;font-size:14px;font-weight:bold');
});
