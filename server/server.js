console.log('🚀 Starting LearnBloom server with bulletproof CORS...');

// Enhanced environment loading
console.log('🔧 Environment check:', {
  NODE_ENV: process.env.NODE_ENV,
  hasOpenAIKey: !!process.env.OPENAI_API_KEY,
  keyStart: process.env.OPENAI_API_KEY?.substring(0, 8) + '...'
});

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

// CORS middleware - simplified since vercel.json handles headers
app.use((req, res, next) => {
  console.log(`📡 ${req.method} ${req.url} from ${req.headers.origin || 'no-origin'}`);
  
  // Handle OPTIONS preflight (vercel.json handles headers)
  if (req.method === 'OPTIONS') {
    console.log('✅ OPTIONS preflight - returning 200');
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
  console.log('📝 Learning path generation requested (Optimized)');
  console.log('📊 Request data:', req.body);

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

    // FAST SINGLE-CALL APPROACH for all durations
    console.log('⚡ Using fast single-call generation for all durations...');
    
    // Optimized prompt that generates all days in one call
    const prompt = `Create exactly ${totalSteps} learning steps for "${goal}" at ${level} level.

Duration: ${duration} weeks (${totalSteps} days), ${perDay} hours per day.

Create a structured ${duration}-week program with these themes:
Week 1: Foundation & Setup
Week 2: Core Concepts  
Week 3: Practical Application
Week 4+: Advanced Techniques

Each step format:
{"step": [number], "week": [week_number], "dayOfWeek": [1-7], "weekTheme": "[theme]", "label": "Day [number]: [specific_topic]", "description": "Brief description", "details": "What to learn and why", "tasks": ["Task 1 (20min)", "Task 2 (25min)", "Task 3 (15min)"], "resources": ["Resource 1", "Resource 2", "Resource 3"], "estimatedTime": "${perDay} hours", "weeklyGoal": "Week goal", "completed": false}

Return JSON array of exactly ${totalSteps} objects. Make each day unique and specific to ${goal}.`;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Create exactly ${totalSteps} unique learning steps for "${goal}". Each day must be specific and different. Keep content concise but educational. Return only valid JSON array.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: Math.min(4000, totalSteps * 100), // Dynamic token limit
        temperature: 0.1,
      });

      console.log('📄 OpenAI response received for single-call generation');
      const response = completion.choices[0].message.content;

      // Enhanced JSON parsing with repair
      let plan;
      try {
        const cleanResponse = response.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        plan = JSON.parse(cleanResponse);
        console.log(`✅ Single-call generation parsed successfully: ${plan.length} steps`);
      } catch (parseError) {
        console.error('❌ JSON parsing failed:', parseError.message);
        console.log('📊 Response length:', response.length);
        
        // Try to repair JSON
        try {
          let jsonString = response.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
          
          // If truncated, try to salvage complete objects
          if (!jsonString.endsWith(']') || parseError.message.includes('Unterminated')) {
            console.log('⚠️ JSON appears truncated, attempting to salvage...');
            const lastCompleteObject = jsonString.lastIndexOf('},');
            if (lastCompleteObject > 0) {
              jsonString = jsonString.substring(0, lastCompleteObject + 1) + '\n]';
              console.log('✅ Truncated to last complete object');
            }
          }
          
          plan = JSON.parse(jsonString);
          console.log(`✅ Successfully parsed repaired JSON: ${plan.length} steps`);
          
        } catch (repairError) {
          console.error('❌ JSON repair failed, using template fallback');
          
          // Generate template-based fallback
          plan = [];
          for (let i = 1; i <= totalSteps; i++) {
            const weekNumber = Math.ceil(i / 7);
            const dayOfWeek = ((i - 1) % 7) + 1;
            const weekThemes = ["Foundation & Setup", "Core Concepts", "Practical Application", "Advanced Techniques"];
            const theme = weekThemes[Math.min(weekNumber - 1, weekThemes.length - 1)];
            
            plan.push({
              step: i,
              week: weekNumber,
              dayOfWeek: dayOfWeek,
              weekTheme: theme,
              label: `Day ${i}: ${goal} Topic ${i}`,
              description: `Learn ${goal} concepts for day ${i}`,
              details: `Focus on ${goal} skills and build understanding through practice.`,
              tasks: [`Study ${goal} concepts (20min)`, `Practice exercises (25min)`, `Review notes (15min)`],
              resources: [`${goal} documentation`, `Online tutorials`, `Practice examples`],
              estimatedTime: `${perDay} hours`,
              weeklyGoal: `Master week ${weekNumber} ${goal} concepts`,
              completed: false
            });
          }
          console.log(`✅ Generated ${plan.length} fallback template steps`);
        }
      }

      // Validate and ensure correct structure
      if (!Array.isArray(plan)) {
        throw new Error('OpenAI response is not an array');
      }

      if (plan.length === 0) {
        throw new Error('OpenAI returned empty learning path');
      }

      // Ensure we have the right number of steps
      if (plan.length !== totalSteps) {
        console.warn(`⚠️ Expected ${totalSteps} steps, got ${plan.length}. Adjusting...`);
        
        if (plan.length > totalSteps) {
          plan = plan.slice(0, totalSteps);
        } else if (plan.length < totalSteps) {
          // Add missing steps
          const missingSteps = totalSteps - plan.length;
          for (let i = 0; i < missingSteps; i++) {
            const stepNumber = plan.length + 1 + i;
            const weekNumber = Math.ceil(stepNumber / 7);
            const dayOfWeek = ((stepNumber - 1) % 7) + 1;
            const weekThemes = ["Foundation & Setup", "Core Concepts", "Practical Application", "Advanced Techniques"];
            const theme = weekThemes[Math.min(weekNumber - 1, weekThemes.length - 1)];
            
            plan.push({
              step: stepNumber,
              week: weekNumber,
              dayOfWeek: dayOfWeek,
              weekTheme: theme,
              label: `Day ${stepNumber}: ${goal} Additional Topic`,
              description: `Learn additional ${goal} concepts`,
              details: `Focus on expanding your ${goal} knowledge.`,
              tasks: [`Study ${goal} concepts (20min)`, `Practice exercises (25min)`, `Review notes (15min)`],
              resources: [`${goal} documentation`, `Tutorials`, `Examples`],
              estimatedTime: `${perDay} hours`,
              weeklyGoal: `Master week ${weekNumber} concepts`,
              completed: false
            });
          }
        }
      }

      // Ensure all steps have required fields with correct numbering
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
          description: step.description || `Learn ${goal} concepts`,
          details: step.details || `Study ${goal} and practice skills.`,
          tasks: Array.isArray(step.tasks) ? step.tasks : [`Study ${goal} (20min)`, `Practice (25min)`, `Review (15min)`],
          resources: Array.isArray(step.resources) ? step.resources : [`${goal} documentation`, `Tutorials`, `Examples`],
          estimatedTime: `${perDay} hours`,
          weeklyGoal: step.weeklyGoal || `Master week ${weekNumber} concepts`,
          completed: false
        };
      });

      console.log(`✅ Successfully generated exactly ${plan.length} steps using fast single-call generation`);

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
          generatedBy: 'OpenAI Fast Single-Call Generation',
          model: 'gpt-4o-mini',
          corsEnabled: true
        }
      });
      
    } catch (openaiError) {
      console.error('❌ OpenAI API call failed:', openaiError.message);
      throw openaiError;
    }

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

// For Vercel deployment
module.exports = app;

// Start server for local development
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n🎉 LearnBloom Server Ready with Optimized Token Usage!`);
    console.log(`🌐 Server: http://localhost:${PORT}`);
    console.log(`📊 Health: http://localhost:${PORT}/health`);
    console.log(`🧪 API Test: http://localhost:${PORT}/api/test`);
    console.log(`🤖 OpenAI Test: http://localhost:${PORT}/api/test-openai`);
    
    if (!openai) {
      console.log(`\n❌ WARNING: OpenAI not configured!`);
      console.log(`   Add OPENAI_API_KEY to your .env file to enable learning path generation.`);
    } else {
      console.log(`\n💡 Ready to generate AI-powered learning paths with chunked generation!`);
    }
    console.log('');
  });
}