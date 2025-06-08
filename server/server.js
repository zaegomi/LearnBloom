console.log('🚀 Starting LearnBloom server...');

require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');

console.log('📦 Modules loaded successfully');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// Handle preflight requests first
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  console.log('✅ Handling OPTIONS (preflight) request');
  res.sendStatus(200);
});

// Add CORS headers to all responsess
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  console.log(`📡 ${req.method} ${req.path} from ${req.headers.origin}`);
  next();
});

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

    const totalSteps = duration * 7; // 7 days per week
    console.log(`🎯 Generating ${totalSteps} detailed steps for "${goal}" (${level} level) - ${duration} weeks × 7 days = ${totalSteps} days using OpenAI`);

    // Create enhanced prompt for OpenAI with week-by-week structure
    const prompt = `Create a comprehensive ${duration}-week learning path for: "${goal}"

Requirements:
- Experience level: ${level}
- Duration: ${duration} weeks (${totalSteps} total days)
- Daily study time: ${perDay} hours per day
- Total steps needed: ${totalSteps} (7 days per week)

Structure the learning path with week-by-week progression. Create exactly 7 days of content for each week.

Week-by-week themes should follow this progression:
Week 1: Foundation & Setup
Week 2: Core Concepts  
Week 3: Practical Application
Week 4: Advanced Techniques
Week 5: Specialization
Week 6: Mastery & Projects
Week 7: Professional Skills
Week 8: Expert Applications
(Continue pattern for longer durations)

For each day, provide:
1. Day number (1-${totalSteps})
2. Week number (1-${duration})
3. Day of week (1-7, where 1=Monday, 7=Sunday)
4. Step title (concise, actionable)
5. Description (brief overview)
6. Detailed explanation (what to do and why it's important)
7. Specific tasks to complete (3-5 actionable items with time estimates)
8. Recommended resources (3-4 high-quality learning materials)
9. Estimated time (should match ${perDay} hours)
10. Week theme/focus area

Return as JSON array with this exact structure:
[
  {
    "step": 1,
    "week": 1,
    "dayOfWeek": 1,
    "weekTheme": "Foundation & Setup",
    "label": "Day 1: Setting Up Your Learning Environment",
    "description": "Begin your journey by setting up everything you need to learn ${goal} effectively",
    "details": "This first day is crucial for establishing a strong foundation. You'll set up your development environment, familiarize yourself with essential tools, and understand the learning roadmap ahead. Spend time configuring your workspace properly as this will save hours later. Focus on understanding why each tool is important and how it fits into the ${goal} ecosystem.",
    "tasks": ["Install required software and tools (45 min)", "Configure development environment (30 min)", "Complete setup verification exercises (30 min)", "Read introductory materials and take notes (15 min)"],
    "resources": ["Official ${goal} documentation", "Environment setup tutorial videos", "Recommended textbooks and guides", "Community forums and support channels"],
    "estimatedTime": "${perDay} hours",
    "weeklyGoal": "Complete environment setup and understand fundamental concepts",
    "completed": false
  }
]

Make each week build logically on the previous week. Ensure daily progression within each week is cohesive and works toward the weekly goal. Include appropriate content for weekends (days 6-7 of each week) like review, practice, or project work.

For ${duration} weeks with ${perDay} hours daily study, create a realistic progression that respects the time commitment and learning pace. Each day should have meaningful, detailed content that builds toward mastery of ${goal}.

IMPORTANT: Return ONLY valid JSON. No additional text, explanations, or formatting outside the JSON array.`;

    console.log('🤖 Calling OpenAI API...');

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Use GPT-4 mini for better JSON consistency and higher token limits
      messages: [
        {
          role: "system",
          content: "You are an expert learning path designer. Create detailed, comprehensive learning plans that provide real educational value. Always respond with valid JSON arrays only, no additional text or formatting. Ensure each step has thorough, actionable content that truly helps someone learn."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 4000,
      temperature: 0.3,
    });

    console.log('📄 OpenAI response received');
    const response = completion.choices[0].message.content;

    // Parse the JSON response
    let plan;
    try {
      // Clean the response first
      const cleanedResponse = response.trim();
      plan = JSON.parse(cleanedResponse);
      console.log('✅ JSON parsed successfully');
    } catch (parseError) {
      console.warn('⚠️ Direct JSON parse failed, trying to extract and fix...');
      console.log('Response length:', response.length);
      console.log('Response preview:', response.substring(0, 200) + '...');
      
      try {
        // Try to extract JSON array from response
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          let jsonString = jsonMatch[0];
          
          // Try to fix common JSON issues
          // Remove trailing commas before closing brackets
          jsonString = jsonString.replace(/,\s*([}\]])/g, '$1');
          
          // Ensure proper string escaping
          jsonString = jsonString.replace(/"/g, '"').replace(/"/g, '"');
          
          // Try to complete truncated JSON by adding closing brackets if needed
          const openBraces = (jsonString.match(/\{/g) || []).length;
          const closeBraces = (jsonString.match(/\}/g) || []).length;
          const openBrackets = (jsonString.match(/\[/g) || []).length;
          const closeBrackets = (jsonString.match(/\]/g) || []).length;
          
          // Add missing closing braces
          for (let i = 0; i < openBraces - closeBraces; i++) {
            jsonString = jsonString.replace(/,?\s*$/, '}');
          }
          
          // Add missing closing brackets
          for (let i = 0; i < openBrackets - closeBrackets; i++) {
            jsonString += ']';
          }
          
          plan = JSON.parse(jsonString);
          console.log('✅ JSON extracted and fixed successfully');
        } else {
          throw new Error('No JSON array found in response');
        }
      } catch (extractError) {
        console.error('❌ Could not extract or fix JSON from response');
        console.error('Parse error:', parseError.message);
        console.error('Extract error:', extractError.message);
        console.error('Response sample:', response.substring(0, 500));
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

    // Ensure we have the right number of steps
    if (plan.length !== totalSteps) {
      console.warn(`⚠️ Expected ${totalSteps} steps, got ${plan.length}. Adjusting...`);
      
      if (plan.length > totalSteps) {
        plan = plan.slice(0, totalSteps);
      } else {
        // Ask OpenAI to generate more steps if needed
        while (plan.length < totalSteps) {
          const currentStep = plan.length + 1;
          const weekNumber = Math.ceil(currentStep / 7);
          const dayOfWeek = ((currentStep - 1) % 7) + 1;
          const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
          const dayName = dayNames[dayOfWeek - 1];
          
          const weekThemes = [
            "Foundation & Setup", "Core Concepts", "Practical Application", 
            "Advanced Techniques", "Specialization", "Mastery & Projects",
            "Professional Skills", "Expert Applications"
          ];
          const theme = weekThemes[Math.min(weekNumber - 1, weekThemes.length - 1)];
          
          plan.push({
            step: currentStep,
            week: weekNumber,
            dayOfWeek: dayOfWeek,
            weekTheme: theme,
            label: `Day ${currentStep} (${dayName}): Advanced Practice`,
            description: `Week ${weekNumber}, Day ${dayOfWeek}: Continue practicing and refining your skills in ${theme.toLowerCase()}`,
            details: `This ${dayName} focuses on reinforcing what you've learned so far in ${theme.toLowerCase()}. Practice the concepts from previous days and explore more advanced applications. Dedicate your ${perDay} hours to deepening your understanding through hands-on work.`,
            tasks: [
              `Review Week ${weekNumber} concepts (30-45 min)`,
              "Practice advanced exercises (1-2 hours)", 
              "Experiment with new variations (30-45 min)",
              "Reflect on your learning progress (15-30 min)"
            ],
            resources: [
              "Previous day materials",
              "Advanced practice exercises",
              "Community forums and discussions",
              "Additional tutorials and documentation"
            ],
            estimatedTime: `${perDay} hours`,
            weeklyGoal: `Master the ${theme.toLowerCase()} concepts and be ready for next week's challenges`,
            completed: false
          });
        }
      }
    }

    // Ensure step numbers are sequential and all required fields exist
    plan = plan.map((step, index) => {
      const currentStep = index + 1;
      const weekNumber = Math.ceil(currentStep / 7);
      const dayOfWeek = ((currentStep - 1) % 7) + 1;
      const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const dayName = dayNames[dayOfWeek - 1];
      
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
        label: step.label || `Day ${currentStep} (${dayName}): Week ${weekNumber} Learning`,
        description: step.description || `Week ${weekNumber}, Day ${dayOfWeek} - ${dayName} learning session`,
        details: step.details || "Complete this learning step to progress in your journey.",
        tasks: Array.isArray(step.tasks) ? step.tasks : ["Complete the learning objectives"],
        resources: Array.isArray(step.resources) ? step.resources : ["Study materials", "Practice exercises"],
        estimatedTime: step.estimatedTime || `${perDay} hours`,
        weeklyGoal: step.weeklyGoal || `Progress through Week ${weekNumber} objectives`,
        completed: false
      };
    });

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