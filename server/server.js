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

    // Step 3: Create simplified prompt to avoid truncation
    const prompt = `Create ${totalSteps} learning steps for "${goal}" (${level} level, ${perDay}h/day).

Topics to cover in order:
${curriculumTopics.map((topic, index) => `${index + 1}. ${topic}`).join('\n')}

Return JSON array with exactly ${totalSteps} objects:
[
  {
    "step": 1,
    "week": 1,
    "dayOfWeek": 1,
    "weekTheme": "Foundation",
    "label": "Day 1: [topic 1]",
    "description": "Brief description",
    "details": "What to learn and why",
    "tasks": ["Task 1 (20min)", "Task 2 (30min)", "Task 3 (25min)"],
    "resources": ["Resource 1", "Resource 2", "Resource 3"],
    "estimatedTime": "${perDay} hours",
    "weeklyGoal": "Week 1 goal",
    "completed": false
  }
]

Each step must cover its assigned topic. Keep content concise but specific.`;

    console.log('🤖 Calling OpenAI API to create detailed curriculum...');

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert curriculum designer. Create exactly ${totalSteps} concise learning steps for "${goal}". Each day must cover its assigned topic from the curriculum. Keep all content brief but specific to avoid response truncation. Return only a valid JSON array.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: Math.min(4000, Math.max(1500, totalSteps * 100)), // Dynamic token limit based on steps
      temperature: 0.1,
    });

    console.log('📄 OpenAI response received');
    const response = completion.choices[0].message.content;

    // Enhanced JSON parsing with truncation handling
    let plan;
    try {
      const cleanResponse = response.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      plan = JSON.parse(cleanResponse);
      console.log('✅ JSON parsed successfully');
    } catch (parseError) {
      console.error('❌ JSON parsing failed:', parseError.message);
      console.log('📊 Response length:', response.length);
      console.log('📄 Response preview:', response.substring(0, 300));
      console.log('📄 Response ending:', response.substring(Math.max(0, response.length - 300)));
      
      try {
        // Strategy 1: Try to extract and fix truncated JSON
        let jsonString = response.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        
        // If JSON is truncated, find the last complete object
        if (!jsonString.endsWith(']') || parseError.message.includes('Unterminated')) {
          console.log('⚠️ JSON appears truncated, attempting to salvage...');
          
          // Find the last complete object
          const lastCompleteObject = jsonString.lastIndexOf('},');
          if (lastCompleteObject > 0) {
            // Cut off at last complete object and close the array
            jsonString = jsonString.substring(0, lastCompleteObject + 1) + '\n]';
            console.log('✅ Truncated to last complete object');
          } else {
            // Try to find any complete objects
            const objects = [];
            const objectPattern = /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g;
            let match;
            while ((match = objectPattern.exec(response)) !== null) {
              try {
                const obj = JSON.parse(match[0]);
                objects.push(obj);
              } catch (objError) {
                // Skip invalid objects
              }
            }
            
            if (objects.length > 0) {
              plan = objects;
              console.log(`✅ Extracted ${objects.length} valid objects from truncated response`);
            } else {
              throw new Error('No valid objects found in truncated response');
            }
          }
        }
        
        // If we modified jsonString, try parsing it
        if (!plan) {
          plan = JSON.parse(jsonString);
          console.log('✅ Successfully parsed repaired JSON');
        }
        
      } catch (repairError) {
        console.error('❌ JSON repair failed:', repairError.message);
        
        // Strategy 2: Request a shorter response with fewer days
        console.log('🔄 Requesting shorter response due to truncation...');
        
        const shorterSteps = Math.min(14, totalSteps); // Limit to 2 weeks max for retry
        const shorterPrompt = `Create exactly ${shorterSteps} learning steps for "${goal}" at ${level} level.

Use these topics (first ${shorterSteps} only):
${curriculumTopics.slice(0, shorterSteps).map((topic, index) => `Day ${index + 1}: ${topic}`).join('\n')}

Return exactly ${shorterSteps} steps as a valid JSON array. Keep responses concise to avoid truncation.`;

        try {
          const shorterCompletion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: `Create exactly ${shorterSteps} concise learning steps. Keep all content brief to avoid response truncation. Return only valid JSON array.`
              },
              {
                role: "user",
                content: shorterPrompt
              }
            ],
            max_tokens: 2000, // Reduced token limit
            temperature: 0.1,
          });

          const shorterResponse = shorterCompletion.choices[0].message.content.trim();
          plan = JSON.parse(shorterResponse.replace(/```json\s*/g, '').replace(/```\s*/g, ''));
          console.log(`✅ Successfully generated ${plan.length} steps with shorter response`);
          
        } catch (shorterError) {
          throw new Error(`Could not parse OpenAI response after multiple attempts: ${parseError.message}`);
        }
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