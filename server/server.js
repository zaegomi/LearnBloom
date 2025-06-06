require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');

const app = express();
const PORT = process.env.PORT || 5000;

console.log('🚀 Starting LearnBloom Server...');

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Initialize OpenAI
let openai;
try {
  if (!process.env.OPENAI_API_KEY) {
    console.warn('⚠️ OPENAI_API_KEY not found - API calls will fail');
  } else {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    console.log('✅ OpenAI initialized successfully');
  }
} catch (error) {
  console.error('❌ OpenAI initialization failed:', error.message);
}

// Basic Routes (no complex path patterns)

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'Server is running', 
    timestamp: new Date().toISOString(),
    hasOpenAI: !!openai
  });
});

// API test
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API is working!',
    hasApiKey: !!process.env.OPENAI_API_KEY,
    keyValid: process.env.OPENAI_API_KEY?.startsWith('sk-'),
    timestamp: new Date().toISOString()
  });
});

// Test OpenAI connection
app.get('/api/test-openai', async (req, res) => {
  try {
    if (!openai) {
      return res.status(500).json({ error: 'OpenAI not initialized' });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: "Say hello in one word" }],
      max_tokens: 5,
    });
    
    res.json({ 
      status: 'OpenAI connection successful',
      response: completion.choices[0].message.content
    });
  } catch (error) {
    console.error('OpenAI test failed:', error);
    res.status(500).json({ 
      error: 'OpenAI connection failed',
      message: error.message
    });
  }
});

// Generate learning path
app.post('/api/generate-path', async (req, res) => {
  console.log('📝 Received generate-path request');
  
  try {
    if (!openai) {
      console.error('❌ OpenAI not initialized');
      return res.status(500).json({ 
        error: 'OpenAI not initialized. Please check your API key.' 
      });
    }

    const { goal, level, duration, perDay } = req.body;
    console.log(`📊 Request data:`, { goal, level, duration, perDay });

    // Validate input
    if (!goal || !level || !duration || !perDay) {
      console.error('❌ Missing required fields');
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['goal', 'level', 'duration', 'perDay']
      });
    }

    if (duration < 1 || perDay < 1) {
      console.error('❌ Invalid duration or perDay values');
      return res.status(400).json({ 
        error: 'Duration and perDay must be positive numbers'
      });
    }

    const totalSteps = duration * perDay;
    console.log(`🎯 Generating ${totalSteps} steps for ${goal} (${level} level)`);

    const prompt = `Create a structured learning path for: "${goal}"

Requirements:
- Experience level: ${level}
- Duration: ${duration} weeks
- Study sessions per day: ${perDay}
- Total steps needed: ${totalSteps}

Please provide exactly ${totalSteps} learning steps as a JSON array with objects containing:
- step: number (1 to ${totalSteps})
- label: string (concise description of what to learn/do)
- description: string (brief explanation of the step)
- estimatedTime: string (estimated time to complete)

Example format:
[
  {
    "step": 1,
    "label": "Introduction to Basic Concepts",
    "description": "Learn fundamental terminology and core principles",
    "estimatedTime": "30-45 minutes"
  }
]

Make sure the progression is logical and builds upon previous steps. Each step should be actionable and specific to the goal of learning ${goal}.`;

    console.log('🤖 Calling OpenAI API...');

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert learning path designer. Create structured, progressive learning plans that help people master new skills effectively. Always respond with valid JSON arrays only."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.7,
    });

    console.log('✅ OpenAI API call successful');
    const response = completion.choices[0].message.content;
    
    let plan;
    try {
      plan = JSON.parse(response);
      console.log('✅ Successfully parsed JSON response');
    } catch (parseError) {
      console.warn('⚠️ Failed to parse JSON, trying to extract...');
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        plan = JSON.parse(jsonMatch[0]);
        console.log('✅ Successfully extracted and parsed JSON');
      } else {
        console.error('❌ Could not extract valid JSON from response');
        throw new Error('Invalid JSON response from OpenAI');
      }
    }

    if (!Array.isArray(plan)) {
      console.error('❌ Response is not an array');
      throw new Error('Response is not an array');
    }

    // Ensure correct number of steps
    if (plan.length !== totalSteps) {
      console.warn(`⚠️ Expected ${totalSteps} steps, got ${plan.length}. Adjusting...`);
      
      if (plan.length > totalSteps) {
        plan = plan.slice(0, totalSteps);
      } else {
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

    console.log(`✅ Generated ${plan.length} steps successfully`);

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
        error: 'OpenAI API quota exceeded. Please try again later.',
        code: 'QUOTA_EXCEEDED'
      });
    }
    
    if (error.code === 'invalid_api_key') {
      return res.status(401).json({ 
        error: 'Invalid OpenAI API key configuration.',
        code: 'INVALID_API_KEY'
      });
    }

    res.status(500).json({ 
      error: 'Failed to generate learning path',
      message: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler - SIMPLE PATTERN
app.use((req, res) => {
  console.log(`❌ 404 - Route not found: ${req.method} ${req.path}`);
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API test: http://localhost:${PORT}/api/test`);
  console.log(`🔗 OpenAI test: http://localhost:${PORT}/api/test-openai`);
  console.log('🎉 Server ready for requests!');
});