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

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: '🌱 LearnBloom AI Learning Path Builder',
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

// Generate learning path - Main AI feature
app.post('/api/generate-path', async (req, res) => {
  console.log('📝 Learning path generation requested');
  console.log('📊 Request data:', req.body);

  // Check if OpenAI is available
  if (!openai) {
    return res.status(500).json({ 
      error: 'AI service not available. Please check server configuration.',
      hasApiKey: !!process.env.OPENAI_API_KEY
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

    const totalSteps = duration * perDay;
    console.log(`🎯 Generating ${totalSteps} steps for "${goal}" (${level} level)`);

    // Create prompt for OpenAI
    const prompt = `Create a structured learning path for: "${goal}"

Requirements:
- Experience level: ${level}
- Duration: ${duration} weeks
- Study sessions per day: ${perDay}
- Total steps needed: ${totalSteps}

Please provide exactly ${totalSteps} learning steps as a JSON array. Each step should have:
- step: number (1 to ${totalSteps})
- label: string (concise title, max 50 characters)
- description: string (brief explanation, max 100 characters)
- estimatedTime: string (like "30-45 minutes")

Example format:
[
  {
    "step": 1,
    "label": "Introduction to Basics",
    "description": "Learn fundamental concepts and terminology",
    "estimatedTime": "30-45 minutes"
  },
  {
    "step": 2,
    "label": "Practice Exercises",
    "description": "Apply basic concepts through hands-on practice",
    "estimatedTime": "45-60 minutes"
  }
]

Make the progression logical and ensure each step builds on previous knowledge.`;

    console.log('🤖 Calling OpenAI API...');

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert learning path designer. Create structured, progressive learning plans. Always respond with valid JSON arrays only, no additional text."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.7,
    });

    const response = completion.choices[0].message.content;
    console.log('📄 OpenAI response received (length:', response.length, ')');

    // Parse the JSON response
    let plan;
    try {
      plan = JSON.parse(response);
      console.log('✅ JSON parsed successfully');
    } catch (parseError) {
      console.warn('⚠️ Direct JSON parse failed, trying to extract...');
      // Try to extract JSON from response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        plan = JSON.parse(jsonMatch[0]);
        console.log('✅ JSON extracted and parsed successfully');
      } else {
        console.error('❌ Could not find valid JSON in response');
        throw new Error('Could not extract valid JSON from AI response');
      }
    }

    // Validate response
    if (!Array.isArray(plan)) {
      throw new Error('AI response is not an array');
    }

    if (plan.length === 0) {
      throw new Error('AI returned empty learning path');
    }

    // Ensure we have the right number of steps
    if (plan.length !== totalSteps) {
      console.warn(`⚠️ Expected ${totalSteps} steps, got ${plan.length}. Adjusting...`);
      
      if (plan.length > totalSteps) {
        plan = plan.slice(0, totalSteps);
      } else {
        // Add generic steps if we don't have enough
        while (plan.length < totalSteps) {
          plan.push({
            step: plan.length + 1,
            label: `Advanced Practice ${plan.length + 1}`,
            description: "Continue practicing and refining your skills",
            estimatedTime: "45-60 minutes"
          });
        }
      }
    }

    // Ensure step numbers are sequential
    plan = plan.map((step, index) => ({
      ...step,
      step: index + 1
    }));

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
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error generating learning path:', error);
    
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

    if (error.code === 'model_not_found') {
      return res.status(400).json({
        error: 'AI model not available. Please try again later.',
        code: 'MODEL_NOT_FOUND'
      });
    }

    // Generic error
    res.status(500).json({ 
      error: 'Failed to generate learning path',
      message: error.message,
      code: error.code || 'GENERATION_FAILED'
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
  console.log(`\n💡 Ready to generate learning paths!\n`);
});