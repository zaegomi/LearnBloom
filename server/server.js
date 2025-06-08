console.log('🚀 Starting LearnBloom server with guaranteed CORS...');

require('dotenv').config({ path: '../.env' });
const express = require('express');
const OpenAI = require('openai');

console.log('📦 Modules loaded successfully');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize OpenAI - REQUIRED
let openai = null;
if (process.env.OPENAI_API_KEY) {
  try {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    console.log('✅ OpenAI initialized successfully');
  } catch (error) {
    console.error('❌ OpenAI initialization failed:', error.message);
    console.error('❌ Server will not be able to generate learning paths');
  }
} else {
  console.error('❌ OPENAI_API_KEY not found - Server requires OpenAI to function');
  console.error('❌ Please add your OpenAI API key to the .env file');
}

// CORS function to add to every response
const addCorsHeaders = (res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
};

// Middleware that adds CORS to every response
app.use((req, res, next) => {
  console.log(`📡 ${req.method} ${req.url} from ${req.headers.origin || 'no-origin'}`);
  
  // Add CORS headers to every response
  addCorsHeaders(res);
  
  // Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    console.log('✅ Handling OPTIONS preflight request');
    return res.sendStatus(200);
  }
  
  next();
});

// JSON parsing middleware
app.use(express.json());

console.log('⚙️ Middleware configured');

console.log('🛣️ Setting up routes...');

// Root route
app.get('/', (req, res) => {
  addCorsHeaders(res);
  res.json({ 
    message: 'LearnBloom AI Learning Path Builder',
    status: 'Server running',
    hasOpenAI: !!openai,
    apiKeyConfigured: !!process.env.OPENAI_API_KEY,
    timestamp: new Date().toISOString(),
    corsEnabled: true
  });
});

// Health check
app.get('/health', (req, res) => {
  addCorsHeaders(res);
  res.json({ 
    status: 'healthy',
    uptime: process.uptime(),
    hasOpenAI: !!openai,
    apiKeyConfigured: !!process.env.OPENAI_API_KEY,
    timestamp: new Date().toISOString(),
    corsEnabled: true
  });
});

// API test
app.get('/api/test', (req, res) => {
  addCorsHeaders(res);
  res.json({ 
    message: 'API working perfectly!',
    hasApiKey: !!process.env.OPENAI_API_KEY,
    keyValid: process.env.OPENAI_API_KEY?.startsWith('sk-'),
    openaiInitialized: !!openai,
    timestamp: new Date().toISOString(),
    corsEnabled: true
  });
});

// OpenAI connection test
app.get('/api/test-openai', async (req, res) => {
  console.log('🤖 Testing OpenAI connection...');
  addCorsHeaders(res);
  
  if (!openai) {
    return res.status(500).json({ 
      error: 'OpenAI not initialized',
      hasApiKey: !!process.env.OPENAI_API_KEY,
      message: 'Please check your OPENAI_API_KEY configuration'
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
      status: 'OpenAI working perfectly!',
      response: completion.choices[0].message.content,
      timestamp: new Date().toISOString(),
      corsEnabled: true
    });
  } catch (error) {
    console.error('❌ OpenAI test failed:', error.message);
    res.status(500).json({ 
      error: 'OpenAI connection failed',
      message: error.message,
      code: error.code,
      details: 'Check your API key and billing status at platform.openai.com'
    });
  }
});

// Generate learning path with dynamic curriculum
app.post('/api/generate-path', async (req, res) => {
  console.log('📝 Learning path generation requested (Dynamic Curriculum)');
  console.log('📊 Request data:', req.body);
  
  addCorsHeaders(res);

  // Check if OpenAI is available - REQUIRED
  if (!openai) {
    console.error('❌ OpenAI not initialized - cannot generate learning path');
    return res.status(500).json({ 
      error: 'OpenAI service not available',
      message: 'OpenAI API key is required to generate learning paths',
      hasApiKey: !!process.env.OPENAI_API_KEY,
      solution: 'Please configure your OPENAI_API_KEY in environment variables'
    });
  }

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

    const totalSteps = duration * 7; // 7 days per week
    console.log(`🎯 Generating ${totalSteps} detailed steps for "${goal}" (${level} level) - ${duration} weeks × 7 days = ${totalSteps} days`);

    // Step 1: Generate curriculum outline for ANY subject
    const generateCurriculumOutline = async (goal, level, totalSteps) => {
      console.log(`📚 Generating curriculum outline for ${goal}...`);
      
      const outlinePrompt = `Create a detailed curriculum outline for learning "${goal}" at ${level} level.

Generate exactly ${totalSteps} unique daily topics that cover all aspects of ${goal}. Each topic must be:
- Completely different from all other topics
- Specific and actionable (not generic)
- Progressive in difficulty
- Focused on one particular skill/concept/tool

Structure the topics in logical progression:
- Days 1-7: Foundation and basics
- Days 8-14: Core concepts and skills
- Days 15-21: Practical application and projects
- Days 22-28: Advanced techniques and mastery

For ${goal} specifically, think about:
- What tools/software are used?
- What are the fundamental concepts?
- What skills need to be developed?
- What are the advanced techniques?
- What are real-world applications?

Return exactly ${totalSteps} specific topics as a JSON array of strings:
[
  "Specific topic 1 for ${goal}",
  "Specific topic 2 for ${goal}",
  "Specific topic 3 for ${goal}"
]

Each topic should be detailed enough to fill ${perDay} hours of focused learning. Make every topic unique and valuable for mastering ${goal}.`;

      try {
        const outlineCompletion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `You are a curriculum planning expert. Generate ${totalSteps} completely unique learning topics for ${goal}. Each topic must be specific and different. Think about all the different aspects, tools, techniques, and skills involved in ${goal}. Return only JSON array of topic strings.`
            },
            {
              role: "user",
              content: outlinePrompt
            }
          ],
          max_tokens: 2000,
          temperature: 0.3,
        });

        const outlineResponse = outlineCompletion.choices[0].message.content.trim();
        
        // Parse the curriculum outline
        let topics;
        try {
          const cleanResponse = outlineResponse.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
          topics = JSON.parse(cleanResponse);
          
          if (!Array.isArray(topics) || topics.length === 0) {
            throw new Error('Invalid topics format');
          }
          
          console.log(`✅ Generated ${topics.length} unique curriculum topics`);
          console.log('📋 Sample topics:', topics.slice(0, 3).join(', '), '...');
          
          return topics.slice(0, totalSteps);
          
        } catch (parseError) {
          console.warn('⚠️ Could not parse curriculum outline, using fallback');
          
          // Fallback: Generate structured topics for any subject
          const fallbackTopics = [];
          const patterns = [
            'introduction and setup', 'basic concepts', 'fundamental principles', 'core techniques',
            'practical exercises', 'hands-on projects', 'problem solving', 'best practices',
            'advanced concepts', 'specialized tools', 'optimization', 'integration',
            'real-world applications', 'case studies', 'troubleshooting', 'performance',
            'professional skills', 'industry standards', 'collaboration', 'deployment',
            'monitoring', 'maintenance', 'scaling', 'security', 'testing', 'documentation',
            'advanced projects', 'mastery techniques'
          ];
          
          for (let i = 0; i < totalSteps; i++) {
            const pattern = patterns[i % patterns.length];
            const variation = Math.floor(i / patterns.length) + 1;
            fallbackTopics.push(`${goal} ${pattern}${variation > 1 ? ` ${variation}` : ''}`);
          }
          
          return fallbackTopics;
        }
        
      } catch (error) {
        console.warn('⚠️ Curriculum generation failed, using structured fallback');
        
        // Emergency fallback
        const emergencyTopics = [];
        for (let i = 1; i <= totalSteps; i++) {
          const weekNum = Math.ceil(i / 7);
          if (weekNum === 1) {
            emergencyTopics.push(`${goal} fundamentals - Day ${i}`);
          } else if (weekNum === 2) {
            emergencyTopics.push(`${goal} core concepts - Day ${i}`);
          } else if (weekNum === 3) {
            emergencyTopics.push(`${goal} practical application - Day ${i}`);
          } else {
            emergencyTopics.push(`${goal} advanced techniques - Day ${i}`);
          }
        }
        
        return emergencyTopics;
      }
    };

    // Step 2: Generate the curriculum outline
    const curriculumTopics = await generateCurriculumOutline(goal, level, totalSteps);

    // Step 3: Create detailed learning path using the curriculum
    const prompt = `Create a comprehensive ${duration}-week learning curriculum for "${goal}" at ${level} level.

MANDATORY CURRICULUM STRUCTURE:
You must create exactly ${totalSteps} days covering these specific topics in order:

${curriculumTopics.map((topic, index) => `Day ${index + 1}: ${topic}`).join('\n')}

ABSOLUTE REQUIREMENTS:
- Each day must cover ONLY the specific topic assigned to that day
- Every day must have completely unique content focused on that topic
- NO overlap between days - each teaches something completely different
- Each day should thoroughly cover its assigned topic
- Daily study time: ${perDay} hours per day

For each day, create detailed content specifically for that day's topic:

RESPONSE FORMAT - Return exactly ${totalSteps} steps as JSON array:
[
  {
    "step": [1-${totalSteps}],
    "week": [1-${duration}],
    "dayOfWeek": [1-7],
    "weekTheme": "[Theme based on week progression]",
    "label": "Day X: [Use EXACT topic from curriculum list above]",
    "description": "Learn [today's specific topic] for ${goal}",
    "details": "Comprehensive explanation of [today's specific topic], why it's crucial for ${goal}, how to master it, and how it fits into your overall ${goal} journey. Focus entirely on today's assigned topic.",
    "tasks": [
      "Specific task 1 for [today's exact topic] (XX min)",
      "Specific task 2 for [today's exact topic] (XX min)",
      "Specific task 3 for [today's exact topic] (XX min)",
      "Specific task 4 for [today's exact topic] (XX min)"
    ],
    "resources": [
      "Resource 1 specifically for [today's topic]",
      "Resource 2 tailored to this concept",
      "Resource 3 focused on this skill",
      "Resource 4 for mastering this topic"
    ],
    "estimatedTime": "${perDay} hours",
    "weeklyGoal": "Master the topics covered this week",
    "completed": false
  }
]

CRITICAL INSTRUCTIONS:
- Day 1 must cover: "${curriculumTopics[0]}"
- Day 15 must cover: "${curriculumTopics[14] || 'Topic 15'}"
- Day ${totalSteps} must cover: "${curriculumTopics[totalSteps - 1] || `Topic ${totalSteps}`}"
- Each day focuses EXCLUSIVELY on its assigned curriculum topic
- Make every day's content completely different and valuable

Return ONLY the JSON array with ${totalSteps} unique learning experiences.`;

    console.log('🤖 Calling OpenAI API to create detailed curriculum...');

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert curriculum designer who creates learning paths for ANY subject. You have been given a specific curriculum outline with ${totalSteps} unique topics for "${goal}".

Your job is to create detailed daily learning experiences that follow the curriculum EXACTLY:
- Each day covers only its assigned topic from the curriculum
- Every day is completely unique and different
- No generic "practice" or "review" content
- Each day provides specific, actionable learning for that topic

You understand ${goal} deeply and know how to break it down into ${totalSteps} distinct learning experiences. Follow the curriculum mapping precisely.

Respond with ONLY the JSON array - no markdown, no explanations.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 4000,
      temperature: 0.1,
    });

    console.log('📄 OpenAI response received');
    const response = completion.choices[0].message.content;

    // Parse JSON response
    let plan;
    try {
      const cleanResponse = response.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      plan = JSON.parse(cleanResponse);
      console.log('✅ JSON parsed successfully');
    } catch (parseError) {
      console.error('❌ JSON parsing failed:', parseError.message);
      console.log('Response preview:', response.substring(0, 500));
      
      // Try to extract JSON array
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          plan = JSON.parse(jsonMatch[0]);
          console.log('✅ JSON extracted successfully');
        } catch (extractError) {
          throw new Error(`Could not parse OpenAI response: ${parseError.message}`);
        }
      } else {
        throw new Error('No JSON array found in OpenAI response');
      }
    }

    // Validate response
    if (!Array.isArray(plan)) {
      throw new Error('OpenAI response is not an array');
    }

    if (plan.length === 0) {
      throw new Error('OpenAI returned empty learning path');
    }

    // Ensure correct number of steps
    if (plan.length !== totalSteps) {
      console.warn(`⚠️ Expected ${totalSteps} steps, got ${plan.length}`);
      if (plan.length > totalSteps) {
        plan = plan.slice(0, totalSteps);
      }
    }

    // Ensure all steps have required fields
    plan = plan.map((step, index) => {
      const currentStep = index + 1;
      const weekNumber = Math.ceil(currentStep / 7);
      const dayOfWeek = ((currentStep - 1) % 7) + 1;
      
      const weekThemes = [
        "Foundation & Setup", "Core Concepts", "Practical Application", 
        "Advanced Techniques", "Specialization", "Mastery & Projects",
        "Professional Skills", "Expert Applications"
      ];
      const theme = weekThemes[Math.min(weekNumber - 1, weekThemes.length - 1)];
      
      return {
        step: currentStep,
        week: step.week || weekNumber,
        dayOfWeek: step.dayOfWeek || dayOfWeek,
        weekTheme: step.weekTheme || theme,
        label: step.label || `Day ${currentStep}: ${curriculumTopics[index] || goal + ' learning'}`,
        description: step.description || `Learn ${curriculumTopics[index] || 'this topic'} for ${goal}`,
        details: step.details || `Study ${curriculumTopics[index] || 'this topic'} in depth and practice the skills.`,
        tasks: Array.isArray(step.tasks) ? step.tasks : [`Study ${curriculumTopics[index] || 'this topic'} (${perDay} hours)`],
        resources: Array.isArray(step.resources) ? step.resources : [`Resources for ${curriculumTopics[index] || 'this topic'}`],
        estimatedTime: step.estimatedTime || `${perDay} hours`,
        weeklyGoal: step.weeklyGoal || `Master this week's ${goal} concepts`,
        completed: false
      };
    });

    console.log(`✅ Successfully generated ${plan.length} unique learning steps using dynamic curriculum`);

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
        generatedBy: 'OpenAI Dynamic Curriculum',
        model: 'gpt-4o-mini',
        corsEnabled: true
      }
    });

  } catch (error) {
    console.error('❌ Error generating learning path:', error);
    
    // Handle specific OpenAI errors
    if (error.code === 'insufficient_quota') {
      return res.status(429).json({ 
        error: 'OpenAI API quota exceeded',
        message: 'You have exceeded your OpenAI usage quota. Please check your billing at platform.openai.com',
        code: 'QUOTA_EXCEEDED',
        solution: 'Add payment method or wait for quota reset'
      });
    }
    
    if (error.code === 'invalid_api_key') {
      return res.status(401).json({ 
        error: 'Invalid OpenAI API key',
        message: 'Your OpenAI API key is invalid or has expired.',
        code: 'INVALID_API_KEY',
        solution: 'Generate a new API key at platform.openai.com'
      });
    }

    // Generic error
    res.status(500).json({ 
      error: 'Failed to generate learning path',
      message: error.message || 'Unknown error occurred',
      code: error.code || 'GENERATION_FAILED',
      debugInfo: {
        hasOpenAI: !!openai,
        hasApiKey: !!process.env.OPENAI_API_KEY,
        errorType: error.constructor.name
      }
    });
  }
});

console.log('✅ Routes configured successfully');

// Start server
app.listen(PORT, () => {
  console.log(`\n🎉 LearnBloom Server Ready with Dynamic Curriculum Generation!`);
  console.log(`🌐 Server: http://localhost:${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/health`);
  console.log(`🧪 API Test: http://localhost:${PORT}/api/test`);
  console.log(`🤖 OpenAI Test: http://localhost:${PORT}/api/test-openai`);
  
  if (!openai) {
    console.log(`\n❌ WARNING: OpenAI not configured!`);
    console.log(`   Add OPENAI_API_KEY to your .env file to enable learning path generation.`);
  } else {
    console.log(`\n💡 Ready to generate AI-powered learning paths for ANY subject!`);
  }
  console.log('');
});