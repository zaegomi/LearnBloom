console.log('🚀 Starting LearnBloom server...');

require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');

console.log('📦 Modules loaded successfully');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

console.log('⚙️ Middleware configured');

// Initialize OpenAI
let openai = null;
if (process.env.OPENAI_API_KEY) {
  try {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    console.log('✅ OpenAI initialized successfully');
  } catch (error) {
    console.error('❌ OpenAI initialization failed:', error.message);
  }
} else {
  console.warn('⚠️ OPENAI_API_KEY not found - AI features will be disabled');
}

console.log('🛣️ Setting up routes...');

// Mock detailed step generator for testing
function generateDetailedMockPath(goal, level, totalSteps) {
  const steps = [];
  
  const stepTemplates = {
    'Beginner': [
      {
        title: 'Introduction to {goal}',
        details: 'Start your journey by understanding what {goal} is and why it\'s important. Read introductory materials and watch overview videos to get familiar with basic concepts and terminology.',
        tasks: ['Read introduction materials', 'Watch overview video', 'Take notes on key concepts', 'Complete basic terminology quiz'],
        resources: ['Official documentation', 'Beginner tutorial videos', 'Online glossary'],
        estimatedTime: '45-60 minutes'
      },
      {
        title: 'Setting up your environment',
        details: 'Install necessary tools and software for {goal}. Configure your development environment and ensure everything is working properly.',
        tasks: ['Download and install required software', 'Configure settings', 'Test installation', 'Create first project'],
        resources: ['Installation guides', 'Setup tutorials', 'Configuration documentation'],
        estimatedTime: '30-45 minutes'
      },
      {
        title: 'Basic concepts and fundamentals',
        details: 'Learn the core principles and fundamental concepts of {goal}. Practice with simple examples and exercises.',
        tasks: ['Study fundamental concepts', 'Complete practice exercises', 'Build simple examples', 'Review and take notes'],
        resources: ['Textbook chapters', 'Practice problems', 'Code examples'],
        estimatedTime: '60-90 minutes'
      },
      {
        title: 'Hands-on practice',
        details: 'Apply what you\'ve learned through practical exercises. Work on guided projects to reinforce your understanding.',
        tasks: ['Complete guided exercises', 'Build practice projects', 'Experiment with variations', 'Debug and fix issues'],
        resources: ['Practice exercises', 'Project templates', 'Debugging guides'],
        estimatedTime: '90-120 minutes'
      }
    ],
    'Intermediate': [
      {
        title: 'Advanced {goal} concepts',
        details: 'Dive deeper into more complex aspects of {goal}. Learn advanced techniques and best practices used by professionals.',
        tasks: ['Study advanced concepts', 'Analyze complex examples', 'Practice advanced techniques', 'Research best practices'],
        resources: ['Advanced tutorials', 'Professional documentation', 'Case studies'],
        estimatedTime: '90-120 minutes'
      },
      {
        title: 'Real-world applications',
        details: 'Explore how {goal} is used in real-world scenarios. Study case studies and work on practical projects.',
        tasks: ['Analyze real-world examples', 'Work on practical projects', 'Apply industry standards', 'Document your work'],
        resources: ['Industry case studies', 'Professional examples', 'Project templates'],
        estimatedTime: '120-150 minutes'
      },
      {
        title: 'Performance and optimization',
        details: 'Learn how to optimize and improve your {goal} skills. Focus on efficiency, best practices, and professional standards.',
        tasks: ['Learn optimization techniques', 'Analyze performance', 'Implement improvements', 'Test and validate results'],
        resources: ['Optimization guides', 'Performance tools', 'Benchmarking resources'],
        estimatedTime: '90-120 minutes'
      },
      {
        title: 'Integration and collaboration',
        details: 'Learn how to integrate your {goal} knowledge with other tools and work effectively in team environments.',
        tasks: ['Study integration patterns', 'Practice collaboration tools', 'Work on team projects', 'Share and review work'],
        resources: ['Integration guides', 'Collaboration tools', 'Team project examples'],
        estimatedTime: '120-180 minutes'
      }
    ],
    'Advanced': [
      {
        title: 'Expert-level {goal} mastery',
        details: 'Master the most complex aspects of {goal}. Learn cutting-edge techniques and contribute to the field.',
        tasks: ['Research latest developments', 'Master expert techniques', 'Contribute to projects', 'Mentor others'],
        resources: ['Research papers', 'Expert forums', 'Open source projects'],
        estimatedTime: '180-240 minutes'
      },
      {
        title: 'Innovation and research',
        details: 'Explore the frontiers of {goal}. Conduct research, experiment with new approaches, and develop innovative solutions.',
        tasks: ['Conduct original research', 'Experiment with new methods', 'Develop prototypes', 'Document findings'],
        resources: ['Research databases', 'Experimental tools', 'Innovation frameworks'],
        estimatedTime: '240-300 minutes'
      },
      {
        title: 'Leadership and teaching',
        details: 'Develop leadership skills in {goal}. Learn to teach others, lead projects, and contribute to the community.',
        tasks: ['Develop teaching materials', 'Lead team projects', 'Mentor beginners', 'Contribute to community'],
        resources: ['Teaching guides', 'Leadership resources', 'Community platforms'],
        estimatedTime: '180-240 minutes'
      },
      {
        title: 'Professional contribution',
        details: 'Make significant contributions to the {goal} field. Publish work, speak at conferences, and advance the discipline.',
        tasks: ['Publish research/articles', 'Present at conferences', 'Contribute to standards', 'Build professional network'],
        resources: ['Publication platforms', 'Conference opportunities', 'Professional networks'],
        estimatedTime: '300+ minutes'
      }
    ]
  };

  const levelTemplates = stepTemplates[level] || stepTemplates['Beginner'];
  
  for (let i = 0; i < totalSteps; i++) {
    const template = levelTemplates[i % levelTemplates.length];
    steps.push({
      step: i + 1,
      label: template.title.replace(/{goal}/g, goal),
      description: `Step ${i + 1}: ${template.title.replace(/{goal}/g, goal)}`,
      details: template.details.replace(/{goal}/g, goal),
      tasks: template.tasks,
      resources: template.resources,
      estimatedTime: template.estimatedTime,
      completed: false
    });
  }
  
  return steps;
}

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'LearnBloom AI Learning Path Builder',
    status: 'Server running',
    hasOpenAI: !!openai,
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    uptime: process.uptime(),
    hasOpenAI: !!openai,
    timestamp: new Date().toISOString()
  });
});

// API test
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API working perfectly!',
    hasApiKey: !!process.env.OPENAI_API_KEY,
    keyValid: process.env.OPENAI_API_KEY?.startsWith('sk-'),
    timestamp: new Date().toISOString()
  });
});

// OpenAI connection test
app.get('/api/test-openai', async (req, res) => {
  console.log('🤖 Testing OpenAI connection...');
  
  if (!openai) {
    return res.status(500).json({ 
      error: 'OpenAI not initialized',
      hasApiKey: !!process.env.OPENAI_API_KEY
    });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: "Say hello in one word" }],
      max_tokens: 5,
    });
    
    console.log('✅ OpenAI test successful');
    res.json({ 
      status: 'OpenAI working!',
      response: completion.choices[0].message.content,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ OpenAI test failed:', error.message);
    res.status(500).json({ 
      error: 'OpenAI connection failed',
      message: error.message,
      code: error.code
    });
  }
});

// Generate learning path - Enhanced version
app.post('/api/generate-path', async (req, res) => {
  console.log('📝 Enhanced learning path generation requested');
  console.log('📊 Request data:', req.body);

  try {
    const { goal, level, duration, perDay } = req.body;

    // Validate input
    if (!goal || !level || !duration || !perDay) {
      console.log('❌ Missing required fields');
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['goal', 'level', 'duration', 'perDay'],
        received: req.body
      });
    }

    if (duration < 1 || perDay < 1) {
      return res.status(400).json({ 
        error: 'Duration and perDay must be positive numbers'
      });
    }

    const totalSteps = duration * perDay;
    console.log(`🎯 Generating ${totalSteps} detailed steps for "${goal}" (${level} level)`);

    let plan;

    if (openai) {
      // Use OpenAI for detailed step generation
      const prompt = `Create a detailed learning path for: "${goal}"

Requirements:
- Experience level: ${level}
- Duration: ${duration} weeks  
- Study sessions per day: ${perDay}
- Total steps needed: ${totalSteps}

For each step, provide detailed information including:
1. Step title (concise, actionable)
2. Description (brief overview)
3. Detailed explanation (what to do and why)
4. Specific tasks to complete (3-5 actionable items)
5. Recommended resources (3-4 items)
6. Estimated time to complete

Return as JSON array with this exact structure:
[
  {
    "step": 1,
    "label": "Step title here",
    "description": "Brief description",
    "details": "Detailed explanation of what to do, why it's important, and how to approach it effectively.",
    "tasks": ["Task 1", "Task 2", "Task 3", "Task 4"],
    "resources": ["Resource 1", "Resource 2", "Resource 3"],
    "estimatedTime": "45-60 minutes",
    "completed": false
  }
]

Make the progression logical and ensure each step builds on previous knowledge. Focus on practical, actionable guidance.`;

      console.log('🤖 Calling OpenAI API for detailed steps...');

      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "You are an expert learning path designer. Create detailed, structured learning plans with specific tasks and resources. Always respond with valid JSON arrays only."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          max_tokens: 3000,
          temperature: 0.7,
        });

        const response = completion.choices[0].message.content;
        console.log('📄 OpenAI response received');

        try {
          plan = JSON.parse(response);
          console.log('✅ JSON parsed successfully');
        } catch (parseError) {
          console.warn('⚠️ Direct JSON parse failed, trying to extract...');
          const jsonMatch = response.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            plan = JSON.parse(jsonMatch[0]);
            console.log('✅ JSON extracted and parsed successfully');
          } else {
            throw new Error('Could not extract valid JSON from AI response');
          }
        }
      } catch (aiError) {
        console.warn('⚠️ OpenAI call failed, using detailed mock data:', aiError.message);
        plan = generateDetailedMockPath(goal, level, totalSteps);
      }
    } else {
      // Use detailed mock data
      console.log('🎭 Using detailed mock data (OpenAI not available)');
      plan = generateDetailedMockPath(goal, level, totalSteps);
    }

    // Validate and ensure proper structure
    if (!Array.isArray(plan)) {
      throw new Error('Generated plan is not an array');
    }

    // Ensure we have the right number of steps
    if (plan.length !== totalSteps) {
      console.warn(`⚠️ Expected ${totalSteps} steps, got ${plan.length}. Adjusting...`);
      
      if (plan.length > totalSteps) {
        plan = plan.slice(0, totalSteps);
      } else {
        while (plan.length < totalSteps) {
          const stepNum = plan.length + 1;
          plan.push({
            step: stepNum,
            label: `Advanced Practice ${stepNum}`,
            description: `Step ${stepNum}: Continue practicing and refining your skills`,
            details: `This step focuses on reinforcing what you've learned so far. Practice the concepts from previous steps and explore more advanced applications. Take time to experiment and deepen your understanding.`,
            tasks: [
              "Review previous concepts",
              "Practice advanced exercises", 
              "Experiment with variations",
              "Reflect on your learning"
            ],
            resources: [
              "Previous step materials",
              "Advanced practice exercises",
              "Community forums",
              "Additional tutorials"
            ],
            estimatedTime: "60-90 minutes",
            completed: false
          });
        }
      }
    }

    // Ensure step numbers are sequential and all required fields exist
    plan = plan.map((step, index) => ({
      step: index + 1,
      label: step.label || `Step ${index + 1}`,
      description: step.description || `Step ${index + 1} description`,
      details: step.details || "Complete this learning step to progress in your journey.",
      tasks: Array.isArray(step.tasks) ? step.tasks : ["Complete the learning objectives"],
      resources: Array.isArray(step.resources) ? step.resources : ["Study materials", "Practice exercises"],
      estimatedTime: step.estimatedTime || "45-60 minutes",
      completed: false
    }));

    console.log(`✅ Successfully generated ${plan.length} detailed learning steps`);

    // Send response
    res.json({ 
      plan,
      metadata: {
        goal,
        level,
        duration,
        perDay,
        totalSteps: plan.length,
        generatedAt: new Date().toISOString(),
        enhanced: true
      }
    });

  } catch (error) {
    console.error('❌ Error generating detailed learning path:', error);
    
    // Handle specific OpenAI errors
    if (error.code === 'insufficient_quota') {
      return res.status(429).json({ 
        error: 'OpenAI API quota exceeded. Please check your billing.',
        code: 'QUOTA_EXCEEDED'
      });
    }
    
    if (error.code === 'invalid_api_key') {
      return res.status(401).json({ 
        error: 'Invalid OpenAI API key. Please check your configuration.',
        code: 'INVALID_API_KEY'
      });
    }

    // Generic error with fallback
    console.log('🎭 Falling back to mock detailed data due to error');
    try {
      const { goal, level, duration, perDay } = req.body;
      const totalSteps = duration * perDay;
      const mockPlan = generateDetailedMockPath(goal, level, totalSteps);
      
      res.json({
        plan: mockPlan,
        metadata: {
          goal,
          level,
          duration,
          perDay,
          totalSteps: mockPlan.length,
          generatedAt: new Date().toISOString(),
          enhanced: true,
          fallback: true,
          note: 'Generated using fallback mock data due to API error'
        }
      });
    } catch (fallbackError) {
      res.status(500).json({ 
        error: 'Failed to generate learning path',
        message: error.message
      });
    }
  }
});

console.log('✅ Routes configured successfully');

// Start server
app.listen(PORT, () => {
  console.log(`\n🎉 Enhanced LearnBloom Server Ready!`);
  console.log(`🌐 Server: http://localhost:${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/health`);
  console.log(`🧪 API Test: http://localhost:${PORT}/api/test`);
  console.log(`🤖 OpenAI Test: http://localhost:${PORT}/api/test-openai`);
  console.log(`\n💡 Ready to generate detailed learning paths!\n`);
});