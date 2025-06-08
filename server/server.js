console.log('🚀 Starting LearnBloom server...');

require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');

console.log('📦 Modules loaded successfully');

const app = express();
const PORT = process.env.PORT || 5000;

// Replace your middleware section with this working version:

console.log('⚙️ Setting up middleware...');

// CORS middleware - this MUST come first
app.use((req, res, next) => {
  console.log(`🌐 CORS: ${req.method} ${req.url} from ${req.headers.origin || 'no-origin'}`);
  
  // Set CORS headers on every response
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    console.log('✅ Handling OPTIONS preflight request');
    res.status(200).end();
    return;
  }
  
  next();
});

// JSON parsing middleware
app.use(express.json());

console.log('⚙️ Middleware configured');

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

console.log('🛣️ Setting up routes...');

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'LearnBloom AI Learning Path Builder',
    status: 'Server running',
    hasOpenAI: !!openai,
    apiKeyConfigured: !!process.env.OPENAI_API_KEY,
    timestamp: new Date().toISOString()
  });
});

// Health check with CORS
app.get('/health', (req, res) => {
  // Add CORS headers directly
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization, X-Requested-With');
  
  res.json({ 
    status: 'healthy',
    uptime: process.uptime(),
    hasOpenAI: !!openai,
    apiKeyConfigured: !!process.env.OPENAI_API_KEY,
    timestamp: new Date().toISOString()
  });
});

// API test with CORS
app.get('/api/test', (req, res) => {
  // Add CORS headers directly
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization, X-Requested-With');
  
  res.json({ 
    message: 'API working perfectly!',
    hasApiKey: !!process.env.OPENAI_API_KEY,
    keyValid: process.env.OPENAI_API_KEY?.startsWith('sk-'),
    openaiInitialized: !!openai,
    timestamp: new Date().toISOString()
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
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: "Say hello in one word" }],
      max_tokens: 5,
    });
    
    console.log('✅ OpenAI test successful');
    res.json({ 
      status: 'OpenAI working perfectly!',
      response: completion.choices[0].message.content,
      timestamp: new Date().toISOString()
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

// Generate path with CORS
app.post('/api/generate-path', async (req, res) => {
  // Add CORS headers directly
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization, X-Requested-With');
  
  console.log('📝 Learning path generation requested (OpenAI only)');
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
    console.log(`🎯 Generating ${totalSteps} detailed steps for "${goal}" (${level} level) - ${duration} weeks × 7 days = ${totalSteps} days using OpenAI`);

    // Create enhanced prompt for OpenAI with week-by-week structure
const prompt = `Create a comprehensive ${duration}-week learning path for: "${goal}" at ${level} level.

CRITICAL REQUIREMENTS:
- Experience level: ${level}
- Duration: ${duration} weeks (${totalSteps} total days)
- Daily study time: ${perDay} hours per day
- MUST generate exactly ${totalSteps} unique learning steps
- Each day must have SPECIFIC, ACTIONABLE content related to ${goal}
- NO generic "Advanced Practice" or "Review" days
- Every step must build toward mastering ${goal}

Week-by-week progression themes:
Week 1: Foundation & Setup - Environment, tools, basic concepts
Week 2: Core Concepts - Fundamental principles and theory
Week 3: Practical Application - Hands-on projects and exercises
Week 4: Advanced Techniques - Complex skills and optimization
Week 5: Specialization - Focused areas and advanced topics
Week 6: Mastery & Projects - Real-world applications
Week 7: Professional Skills - Industry practices and standards
Week 8: Expert Applications - Advanced use cases and innovation

For ${goal} specifically, create unique daily content that covers:
- Specific skills, techniques, or concepts related to ${goal}
- Practical exercises and projects
- Tools and technologies used in ${goal}
- Real-world applications and use cases
- Progressive difficulty appropriate for ${level} level

STRUCTURE: Return exactly ${totalSteps} steps as a JSON array. Each step must include:
{
  "step": [1-${totalSteps}],
  "week": [1-${duration}],
  "dayOfWeek": [1-7],
  "weekTheme": "Specific theme for this week",
  "label": "Day X: Specific ${goal} topic or skill",
  "description": "Brief overview of this specific day's learning focus",
  "details": "Detailed explanation of what to learn, why it's important, and how it relates to ${goal}. Must be specific to ${goal} and this learning stage.",
  "tasks": [
    "Specific task 1 with time estimate (XX min)",
    "Specific task 2 with time estimate (XX min)",
    "Specific task 3 with time estimate (XX min)",
    "Specific task 4 with time estimate (XX min)"
  ],
  "resources": [
    "Specific resource 1 for ${goal}",
    "Specific resource 2 for ${goal}",
    "Specific resource 3 for ${goal}",
    "Specific resource 4 for ${goal}"
  ],
  "estimatedTime": "${perDay} hours",
  "weeklyGoal": "Specific goal for this week related to ${goal}",
  "completed": false
}

EXAMPLES of good day topics for learning ${goal}:
- Specific techniques, methods, or skills
- Practical projects or exercises
- Tools and software usage
- Theory and concepts with application
- Problem-solving and troubleshooting
- Best practices and standards
- Integration with other systems/skills

AVOID generic content like:
- "Advanced Practice"
- "Review and Practice"
- "General Exercises"
- Repetitive content

Make each day unique and specifically valuable for learning ${goal} at the ${level} level.

Return ONLY the JSON array with exactly ${totalSteps} detailed, unique steps.`;

console.log('🤖 Calling OpenAI API with enhanced prompt...');

const completion = await openai.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [
    {
      role: "system",
      content: `You are an expert curriculum designer specializing in ${goal}. Create comprehensive, detailed learning paths with unique daily content. Every day must have specific, actionable content related to ${goal}. Never use generic placeholder content like "Advanced Practice" or "Review." Each step should teach something specific and valuable about ${goal}. Respond with valid JSON only.`
    },
    {
      role: "user",
      content: prompt
    }
  ],
  max_tokens: 4000,
  temperature: 0.2, // Lower temperature for more consistent, focused content
});

console.log('📄 OpenAI response received');
const response = completion.choices[0].message.content;

// Enhanced JSON parsing with better error handling
let plan;
try {
  const cleanedResponse = response.trim();
  plan = JSON.parse(cleanedResponse);
  console.log('✅ JSON parsed successfully');
} catch (parseError) {
  console.warn('⚠️ Direct JSON parse failed, trying to extract and fix...');
  
  try {
    // Extract JSON array from response
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      let jsonString = jsonMatch[0];
      
      // Fix common JSON issues
      jsonString = jsonString.replace(/,\s*([}\]])/g, '$1');
      jsonString = jsonString.replace(/"/g, '"').replace(/"/g, '"');
      
      plan = JSON.parse(jsonString);
      console.log('✅ JSON extracted and fixed successfully');
    } else {
      throw new Error('No JSON array found in response');
    }
  } catch (extractError) {
    console.error('❌ Could not extract or fix JSON from response');
    throw new Error(`Invalid JSON response from OpenAI: ${parseError.message}`);
  }
}

// Validate response structure
if (!Array.isArray(plan)) {
  throw new Error('OpenAI response is not an array');
}

if (plan.length === 0) {
  throw new Error('OpenAI returned empty learning path');
}

// If OpenAI didn't generate enough steps, request more specific content
if (plan.length < totalSteps) {
  console.warn(`⚠️ OpenAI generated ${plan.length} steps, need ${totalSteps}. Requesting additional specific content...`);
  
  // Calculate how many more steps we need
  const missingSteps = totalSteps - plan.length;
  const lastWeek = Math.ceil(plan.length / 7);
  const nextWeek = lastWeek + 1;
  
  // Create a follow-up prompt for missing content
  const followUpPrompt = `Continue the ${goal} learning path. Generate ${missingSteps} more specific learning steps for weeks ${nextWeek} onwards.

Previous content covered: ${plan.map(p => p.label).slice(-3).join(', ')}

Generate ${missingSteps} additional steps starting from step ${plan.length + 1}, continuing the ${goal} curriculum with specific, unique content. Each step must cover distinct aspects of ${goal} learning.

Return ONLY a JSON array with exactly ${missingSteps} steps, continuing the sequence and maintaining quality.`;

  try {
    const followUpCompletion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Continue creating specific learning content for ${goal}. Every step must be unique and valuable.`
        },
        {
          role: "user",
          content: followUpPrompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.2,
    });

    const followUpResponse = followUpCompletion.choices[0].message.content;
    let additionalSteps = JSON.parse(followUpResponse.trim());
    
    // Merge the additional steps
    plan = [...plan, ...additionalSteps];
    console.log(`✅ Added ${additionalSteps.length} additional specific steps`);
    
  } catch (followUpError) {
    console.warn('⚠️ Follow-up request failed, using original content only');
  }
}

// Ensure we have exactly the right number of steps (trim if too many)
if (plan.length > totalSteps) {
  plan = plan.slice(0, totalSteps);
  console.log(`✅ Trimmed to exactly ${totalSteps} steps`);
}

// Final validation and enhancement of each step
plan = plan.map((step, index) => {
  const currentStep = index + 1;
  const weekNumber = Math.ceil(currentStep / 7);
  const dayOfWeek = ((currentStep - 1) % 7) + 1;
  
  // Ensure all required fields exist and are meaningful
  return {
    step: currentStep,
    week: step.week || weekNumber,
    dayOfWeek: step.dayOfWeek || dayOfWeek,
    weekTheme: step.weekTheme || `Week ${weekNumber} Learning`,
    label: step.label || `Day ${currentStep}: ${goal} Learning`,
    description: step.description || `Focused learning session for ${goal}`,
    details: step.details || `Detailed learning content for ${goal} at ${level} level.`,
    tasks: Array.isArray(step.tasks) && step.tasks.length > 0 
      ? step.tasks 
      : [`Study ${goal} concepts (${Math.floor(perDay * 60 / 4)} min)`, `Practice exercises (${Math.floor(perDay * 60 / 2)} min)`, `Review and take notes (${Math.floor(perDay * 60 / 4)} min)`],
    resources: Array.isArray(step.resources) && step.resources.length > 0 
      ? step.resources 
      : [`${goal} documentation`, `Online tutorials`, `Practice exercises`, `Community forums`],
    estimatedTime: step.estimatedTime || `${perDay} hours`,
    weeklyGoal: step.weeklyGoal || `Progress in ${goal} learning`,
    completed: false
  };
});

console.log(`✅ Successfully generated ${plan.length} unique, detailed learning steps for ${goal}`);

// Log a summary of the generated content to verify uniqueness
console.log('📋 Generated steps summary:');
plan.forEach((step, index) => {
  if (index < 5 || index >= plan.length - 2) { // Log first 5 and last 2 steps
    console.log(`  Step ${step.step}: ${step.label}`);
  } else if (index === 5) {
    console.log(`  ... (${plan.length - 7} more unique steps) ...`);
  }
});

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
        generatedBy: 'OpenAI',
        model: 'gpt-3.5-turbo'
      }
    });

  } catch (error) {
    console.error('❌ Error generating learning path:', error);
    console.error('❌ Error details:', {
      message: error.message,
      code: error.code,
      type: error.type,
      stack: error.stack?.split('\n').slice(0, 3).join('\n')
    });
    
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

    if (error.code === 'model_not_found') {
      return res.status(400).json({
        error: 'OpenAI model not available',
        message: 'The requested AI model is not available.',
        code: 'MODEL_NOT_FOUND',
        solution: 'Check your OpenAI account access'
      });
    }

    // Rate limiting
    if (error.code === 'rate_limit_exceeded') {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'Too many requests to OpenAI. Please try again in a moment.',
        code: 'RATE_LIMITED',
        solution: 'Wait a few seconds and try again'
      });
    }

    // Context length error
    if (error.code === 'context_length_exceeded') {
      return res.status(400).json({
        error: 'Prompt too long',
        message: 'The learning path request is too complex for the AI model.',
        code: 'PROMPT_TOO_LONG',
        solution: 'Try a shorter duration or simpler goal'
      });
    }

    // Generic error - provide more details
    res.status(500).json({ 
      error: 'Failed to generate learning path',
      message: error.message || 'Unknown error occurred',
      code: error.code || 'GENERATION_FAILED',
      details: 'OpenAI API is required for generating learning paths. Check server logs for more details.',
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
  console.log(`\n🎉 LearnBloom Server Ready!`);
  console.log(`🌐 Server: http://localhost:${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/health`);
  console.log(`🧪 API Test: http://localhost:${PORT}/api/test`);
  console.log(`🤖 OpenAI Test: http://localhost:${PORT}/api/test-openai`);
  
  if (!openai) {
    console.log(`\n❌ WARNING: OpenAI not configured!`);
    console.log(`   Add OPENAI_API_KEY to your .env file to enable learning path generation.`);
  } else {
    console.log(`\n💡 Ready to generate AI-powered learning paths!`);
  }
  console.log('');
});