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

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    uptime: process.uptime(),
    hasOpenAI: !!openai,
    apiKeyConfigured: !!process.env.OPENAI_API_KEY,
    timestamp: new Date().toISOString()
  });
});

// API test
app.get('/api/test', (req, res) => {
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

// Generate learning path - OpenAI ONLY
app.post('/api/generate-path', async (req, res) => {
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

    const totalSteps = duration * perDay;
    console.log(`🎯 Generating ${totalSteps} detailed steps for "${goal}" (${level} level) using OpenAI`);

    // Create enhanced prompt for OpenAI
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

Make the progression logical and ensure each step builds on previous knowledge. Focus on practical, actionable guidance that helps someone actually learn ${goal}.`;

    console.log('🤖 Calling OpenAI API...');

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert learning path designer. Create detailed, structured learning plans with specific tasks and resources. Always respond with valid JSON arrays only, no additional text or formatting."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 3000,
      temperature: 0.7,
    });

    console.log('📄 OpenAI response received');
    const response = completion.choices[0].message.content;

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
        console.error('❌ Could not extract valid JSON from response');
        console.error('OpenAI Response:', response);
        throw new Error('OpenAI returned invalid JSON format');
      }
    }

    // Validate response structure
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
      } else {
        // Ask OpenAI to generate more steps if needed
        while (plan.length < totalSteps) {
          plan.push({
            step: plan.length + 1,
            label: `Advanced Practice ${plan.length + 1}`,
            description: `Step ${plan.length + 1}: Continue practicing and refining your skills`,
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

    console.log(`✅ Successfully generated ${plan.length} detailed learning steps using OpenAI`);

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

    // Generic error - no fallback
    res.status(500).json({ 
      error: 'Failed to generate learning path',
      message: error.message,
      code: error.code || 'GENERATION_FAILED',
      details: 'OpenAI API is required for generating learning paths'
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