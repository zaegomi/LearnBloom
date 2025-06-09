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

Requirements:
- Duration: ${duration} weeks (${totalSteps} days total)
- Daily time: ${perDay} hours per day
- Progressive difficulty across weeks

Week structure:
Week 1: Foundation & Setup
Week 2: Core Concepts  
Week 3: Practical Application
Week 4+: Advanced Techniques

IMPORTANT: Return ONLY a valid JSON array. No explanations, no markdown, no additional text.

Format each step exactly like this:
{"step": 1, "week": 1, "dayOfWeek": 1, "weekTheme": "Foundation & Setup", "label": "Day 1: Introduction to ${goal}", "description": "Brief overview", "details": "What to learn and why", "tasks": ["Task 1 (30min)", "Task 2 (45min)", "Task 3 (45min)"], "resources": ["Resource 1", "Resource 2", "Resource 3"], "estimatedTime": "${perDay} hours", "weeklyGoal": "Week objective", "completed": false}

Generate exactly ${totalSteps} unique steps covering ${goal} comprehensively.`;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a JSON generator. Create exactly ${totalSteps} learning steps for "${goal}" at ${level} level. Return ONLY valid JSON array with no markdown, no explanations, no extra text. Each object must have all required fields with proper JSON syntax.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: Math.min(4000, totalSteps * 100), // More conservative token limit
        temperature: 0.1, // Lower temperature for more consistent output
        top_p: 0.9,
        frequency_penalty: 0,
        presence_penalty: 0
      });

      console.log('📄 OpenAI response received');
      const response = completion.choices[0].message.content;

      // Enhanced JSON parsing with multiple repair strategies
      let plan;
      try {
        // First attempt: Clean and parse directly
        const cleanResponse = response.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        plan = JSON.parse(cleanResponse);
        console.log(`✅ JSON parsed successfully: ${plan.length} steps`);
      } catch (parseError) {
        console.warn('⚠️ Direct JSON parse failed, trying extraction and repair...');
        console.log('📊 Response length:', response.length);
        console.log('📊 Error position:', parseError.message);
        
        // Try to extract JSON array from response
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          let jsonString = jsonMatch[0];
          console.log('📦 Extracted JSON length:', jsonString.length);
          
          // Multiple repair attempts
          for (let attempt = 1; attempt <= 3; attempt++) {
            try {
              console.log(`🔧 Repair attempt ${attempt}...`);
              
              if (attempt === 1) {
                // Attempt 1: Fix common issues
                jsonString = jsonString
                  .replace(/,\s*}/g, '}')  // Remove trailing commas before }
                  .replace(/,\s*]/g, ']')  // Remove trailing commas before ]
                  .replace(/[\u201C\u201D]/g, '"')  // Fix smart quotes
                  .replace(/[\u2018\u2019]/g, "'")  // Fix smart apostrophes
                  .trim();
              } else if (attempt === 2) {
                // Attempt 2: Fix truncated JSON by finding last complete object
                const lastCompleteObject = jsonString.lastIndexOf('},');
                if (lastCompleteObject > 0) {
                  jsonString = jsonString.substring(0, lastCompleteObject + 1) + '\n]';
                  console.log('✂️ Truncated to last complete object');
                }
              } else if (attempt === 3) {
                // Attempt 3: More aggressive cleanup
                jsonString = jsonString
                  .replace(/([^"\\])\n/g, '$1')  // Remove unexpected newlines
                  .replace(/,(\s*[}\]])/g, '$1')  // Remove trailing commas
                  .replace(/([{,]\s*)"([^"]*)":\s*"([^"]*)"([^",}]*)/g, '$1"$2": "$3"')  // Fix quote issues
                  .trim();
                
                // Ensure it ends properly
                if (!jsonString.endsWith(']')) {
                  jsonString += ']';
                }
              }
              
              plan = JSON.parse(jsonString);
              console.log(`✅ JSON repaired and parsed on attempt ${attempt}: ${plan.length} steps`);
              break;
              
            } catch (repairError) {
              console.log(`❌ Repair attempt ${attempt} failed:`, repairError.message);
              
              if (attempt === 3) {
                // Final fallback: Generate template-based content
                console.log('🚨 All JSON repair attempts failed, generating fallback content...');
                plan = [];
                
                for (let i = 1; i <= totalSteps; i++) {
                  const weekNumber = Math.ceil(i / 7);
                  const dayOfWeek = ((i - 1) % 7) + 1;
                  const weekThemes = ["Foundation & Setup", "Core Concepts", "Practical Application", "Advanced Techniques"];
                  const theme = weekThemes[Math.min(weekNumber - 1, weekThemes.length - 1)];
                  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
                  const dayName = dayNames[dayOfWeek - 1];
                  
                  plan.push({
                    step: i,
                    week: weekNumber,
                    dayOfWeek: dayOfWeek,
                    weekTheme: theme,
                    label: `Day ${i}: ${goal} - ${dayName}`,
                    description: `Learn essential ${goal} concepts and skills for ${level} level`,
                    details: `Today you'll focus on ${goal} fundamentals. This ${dayName} session is designed to build your understanding systematically. Start with theory, then move to practical exercises, and finish with reflection and note-taking.`,
                    tasks: [
                      `Study ${goal} concepts and theory (${Math.floor(perDay * 0.4 * 60)} minutes)`,
                      `Complete hands-on exercises (${Math.floor(perDay * 0.4 * 60)} minutes)`,
                      `Review and take notes (${Math.floor(perDay * 0.2 * 60)} minutes)`
                    ],
                    resources: [
                      `${goal} official documentation`,
                      `${level} level tutorials and guides`,
                      `Practice exercises and examples`,
                      `Community forums and Q&A`
                    ],
                    estimatedTime: `${perDay} hours`,
                    weeklyGoal: `Master ${theme.toLowerCase()} for ${goal}`,
                    completed: false
                  });
                }
                
                console.log(`✅ Generated ${plan.length} fallback learning steps`);
                break;
              }
            }
          }
        } else {
          throw new Error('No JSON array found in OpenAI response');
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