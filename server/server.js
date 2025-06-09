console.log('🚀 Starting LearnBloom server with enhanced CORS...');

// Enhanced environment loading
console.log('🔧 Environment check:', {
  NODE_ENV: process.env.NODE_ENV,
  hasOpenAIKey: !!process.env.OPENAI_API_KEY,
  keyStart: process.env.OPENAI_API_KEY?.substring(0, 8) + '...'
});

require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
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

// ENHANCED CORS configuration for local development
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // List of allowed origins for local development
    const allowedOrigins = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3001',
      'https://learn-bloom-client.vercel.app'  // Your production frontend
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log(`✅ CORS allowed for origin: ${origin}`);
      callback(null, true);
    } else {
      console.log(`❌ CORS blocked for origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Additional CORS middleware for extra safety
app.use((req, res, next) => {
  console.log(`📡 ${req.method} ${req.url} from ${req.headers.origin || 'no-origin'}`);
  
  // Set CORS headers manually as backup
  const origin = req.headers.origin;
  const allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001', 
    'http://127.0.0.1:3001',
    'https://learn-bloom-client.vercel.app'
  ];
  
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    console.log('✅ OPTIONS preflight handled');
    return res.status(200).end();
  }
  
  next();
});

// JSON parsing middleware
app.use(express.json({ limit: '10mb' }));

console.log('⚙️ Middleware configured');
console.log('🛣️ Setting up routes...');

// Root route with enhanced debugging
app.get('/', (req, res) => {
  console.log('🏠 Root route hit');
  res.json({ 
    message: 'LearnBloom AI Learning Path Builder',
    status: 'Server running',
    hasOpenAI: !!openai,
    apiKeyConfigured: !!process.env.OPENAI_API_KEY,
    timestamp: new Date().toISOString(),
    corsEnabled: true,
    debug: {
      nodeEnv: process.env.NODE_ENV,
      headers: req.headers.origin
    }
  });
});

// Health check with enhanced debugging
app.get('/health', (req, res) => {
  console.log('🏥 Health check hit');
  res.json({ 
    status: 'healthy',
    uptime: process.uptime(),
    hasOpenAI: !!openai,
    apiKeyConfigured: !!process.env.OPENAI_API_KEY,
    timestamp: new Date().toISOString(),
    corsEnabled: true,
    debug: {
      nodeEnv: process.env.NODE_ENV,
      origin: req.headers.origin
    }
  });
});

// API test
app.get('/api/test', (req, res) => {
  console.log('🧪 API test hit');
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
  
  if (!openai) {
    return res.status(500).json({ 
      error: 'OpenAI not initialized',
      hasApiKey: !!process.env.OPENAI_API_KEY,
      message: 'Please check your OPENAI_API_KEY configuration'
    });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
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

// Generate learning path with optimized token usage
app.post('/api/generate-path', async (req, res) => {
  console.log('📝 Learning path generation requested (OpenAI required)');
  console.log('📊 Request data:', req.body);
  console.log('🌐 Request origin:', req.headers.origin);

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
    console.log(`🎯 Generating ${totalSteps} detailed steps for "${goal}" (${level} level) - ${duration} weeks × 7 days = ${totalSteps} days using OpenAI`);

    // OpenAI API call
    console.log('🤖 Calling OpenAI API...');
    
    const prompt = `Create exactly ${totalSteps} learning steps for "${goal}" at ${level} level.

Duration: ${duration} weeks (${totalSteps} days total), ${perDay} hours per day.

Structure this as a ${duration}-week program with progressive themes:
- Week 1: Foundation & Setup  
- Week 2: Core Concepts
- Week 3: Practical Application
- Week 4+: Advanced Techniques & Mastery

For each step, include:
- Detailed explanation of what to learn and why it's important
- 3-5 specific tasks with time estimates (matching ${perDay} hours total)
- 3-4 helpful resources (documentation, tutorials, tools)
- Weekend differentiation (lighter review content for Saturday/Sunday)

Return as JSON array with exactly ${totalSteps} objects in this format:
{"step": 1, "week": 1, "dayOfWeek": 1, "weekTheme": "Foundation & Setup", "label": "Day 1: Introduction to ${goal}", "description": "Brief description", "details": "Comprehensive explanation of what to do and why", "tasks": ["Task 1 (45 min)", "Task 2 (30 min)", "Task 3 (45 min)"], "resources": ["Resource 1", "Resource 2", "Resource 3"], "estimatedTime": "${perDay} hours", "weeklyGoal": "Week-specific learning objective", "completed": false}

Make each day unique and progressively build knowledge. Include real, actionable content.`;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are an expert curriculum designer. Create exactly ${totalSteps} detailed, educational learning steps for "${goal}" at ${level} level. Each step must be substantial and unique. Return ONLY a valid JSON array with no markdown formatting.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: Math.min(4000, totalSteps * 120),
        temperature: 0.3,
      });

      console.log('📄 OpenAI response received');
      const response = completion.choices[0].message.content;

      // Clean and parse JSON response
      let plan;
      try {
        // Remove any markdown formatting
        const cleanResponse = response.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        plan = JSON.parse(cleanResponse);
        console.log(`✅ JSON parsed successfully: ${plan.length} steps`);
      } catch (parseError) {
        console.warn('⚠️ Direct JSON parse failed, trying to extract...');
        
        // Try to extract JSON from response
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          try {
            plan = JSON.parse(jsonMatch[0]);
            console.log(`✅ JSON extracted and parsed: ${plan.length} steps`);
          } catch (extractError) {
            throw new Error(`JSON extraction failed: ${extractError.message}`);
          }
        } else {
          throw new Error('No valid JSON array found in response');
        }
      }

      // Validate response
      if (!Array.isArray(plan)) {
        throw new Error('Response is not an array');
      }

      if (plan.length === 0) {
        throw new Error('OpenAI returned empty learning path');
      }

      // Ensure correct structure and numbering
      plan = plan.map((step, index) => {
        const correctStepNumber = index + 1;
        const weekNumber = Math.ceil(correctStepNumber / 7);
        const dayOfWeek = ((correctStepNumber - 1) % 7) + 1;
        
        const weekThemes = ["Foundation & Setup", "Core Concepts", "Practical Application", "Advanced Techniques"];
        const theme = weekThemes[Math.min(weekNumber - 1, weekThemes.length - 1)];
        
        return {
          step: correctStepNumber,
          week: weekNumber,
          dayOfWeek: dayOfWeek,
          weekTheme: theme,
          label: step.label || `Day ${correctStepNumber}: ${goal} Learning`,
          description: step.description || `Learn ${goal} concepts for day ${correctStepNumber}`,
          details: step.details || `Focus on ${goal} skills and build understanding through practice and application.`,
          tasks: Array.isArray(step.tasks) ? step.tasks : [`Study ${goal} concepts (45min)`, `Practice exercises (45min)`, `Review and notes (30min)`],
          resources: Array.isArray(step.resources) ? step.resources : [`${goal} documentation`, `Online tutorials`, `Practice examples`],
          estimatedTime: `${perDay} hours`,
          weeklyGoal: step.weeklyGoal || `Master week ${weekNumber} ${goal} fundamentals`,
          completed: false
        };
      });

      console.log(`✅ Successfully generated ${plan.length} learning steps`);

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
          generatedBy: 'OpenAI GPT-4o-mini',
          corsEnabled: true
        }
      });

    } catch (openaiError) {
      console.error('❌ OpenAI API call failed:', openaiError.message);
      
      if (openaiError.code === 'insufficient_quota') {
        return res.status(429).json({ 
          error: 'OpenAI API quota exceeded. Please check your billing.',
          code: 'QUOTA_EXCEEDED'
        });
      }
      
      if (openaiError.code === 'invalid_api_key') {
        return res.status(401).json({ 
          error: 'Invalid OpenAI API key',
          code: 'INVALID_API_KEY'
        });
      }

      throw openaiError;
    }

  } catch (error) {
    console.error('❌ Error generating learning path:', error);
    console.error('❌ Error details:', {
      message: error.message,
      code: error.code,
      type: error.type,
      stack: error.stack
    });

    res.status(500).json({ 
      error: 'Failed to generate learning path',
      message: error.message || 'Unknown error occurred',
      code: error.code || 'GENERATION_FAILED'
    });
  }
});

console.log('✅ Routes configured successfully');

// Start server for local development
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n🎉 LearnBloom Server Ready!`);
    console.log(`🌐 Server: http://localhost:${PORT}`);
    console.log(`📊 Health: http://localhost:${PORT}/health`);
    console.log(`🧪 API Test: http://localhost:${PORT}/api/test`);
    console.log(`🤖 OpenAI Test: http://localhost:${PORT}/api/test-openai`);
    console.log(`📡 CORS enabled for: localhost:3000, 127.0.0.1:3000`);
    
    if (!openai) {
      console.log(`\n❌ WARNING: OpenAI not configured!`);
      console.log(`   Add OPENAI_API_KEY to your .env file to enable learning path generation.`);
    } else {
      console.log(`\n💡 Ready to generate AI-powered learning paths!`);
    }
    console.log('');
  });
}

// For Vercel deployment
module.exports = app;