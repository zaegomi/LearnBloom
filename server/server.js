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
  addCorsHeaders(res); // Extra CORS headers for safety
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
  addCorsHeaders(res); // Extra CORS headers for safety
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
  addCorsHeaders(res); // Extra CORS headers for safety
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
  addCorsHeaders(res); // Extra CORS headers for safety
  
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

// Generate learning path - OpenAI ONLY
app.post('/api/generate-path', async (req, res) => {
  console.log('📝 Learning path generation requested (OpenAI only)');
  console.log('📊 Request data:', req.body);
  
  addCorsHeaders(res); // Extra CORS headers for safety

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
    // Replace the prompt creation section in your server.js with this enhanced version:

const prompt = `You are creating a ${duration}-week masterclass curriculum for "${goal}" at ${level} level.

ABSOLUTE REQUIREMENTS FOR UNIQUENESS:
- Generate exactly ${totalSteps} completely UNIQUE learning experiences
- Every day must cover a DIFFERENT specific aspect of ${goal}
- NO repetitive content, NO generic "practice" days
- Each day = ONE specific skill/concept/technique that's distinct from all others
- Daily study time: ${perDay} hours per day

CONTENT UNIQUENESS MANDATES:
1. UNIQUE DAILY TOPICS: Each day must focus on a completely different ${goal} skill/concept
2. UNIQUE LABELS: Every "Day X:" title must describe a specific, distinct topic
3. UNIQUE DETAILS: "What You'll Do" must be completely different each day
4. UNIQUE TASKS: Every task list must contain specific, non-repetitive actions
5. UNIQUE RESOURCES: Different learning materials for each day's specific topic

PROGRESSIVE CURRICULUM STRUCTURE:
Week 1 (Days 1-7): Foundation & Setup
- Day 1: Environment/tool setup specific to ${goal}
- Day 2: First core concept of ${goal}
- Day 3: Second fundamental principle
- Day 4: Basic hands-on skill #1
- Day 5: Basic hands-on skill #2
- Day 6: Integration of concepts learned
- Day 7: First practical application

Week 2 (Days 8-14): Core Concepts
- Day 8: Advanced concept #1
- Day 9: Advanced concept #2
- Day 10: Specialized technique #1
- Day 11: Specialized technique #2
- Day 12: Problem-solving methodology
- Day 13: Best practices and standards
- Day 14: Real-world application project

[Continue this pattern, ensuring every day covers a DIFFERENT aspect of ${goal}]

FOR ${goal} SPECIFICALLY, ensure each day covers unique topics like:
- Different tools/software used in ${goal}
- Specific techniques and methodologies
- Various problem-solving approaches
- Different project types and applications
- Distinct skill areas within ${goal}
- Separate theoretical concepts
- Individual practical exercises
- Unique troubleshooting scenarios
- Different industry applications
- Specific advanced features/capabilities

EXAMPLE of what GOOD unique daily progression looks like:
Day 1: "Setting up your ${goal} development environment"
Day 2: "Understanding ${goal} fundamental syntax and structure"
Day 3: "Working with variables and data types in ${goal}"
Day 4: "Control flow: loops and conditionals"
Day 5: "Functions and modular programming"
Day 6: "Error handling and debugging techniques"
Day 7: "Building your first complete ${goal} project"
Day 8: "Object-oriented programming concepts"
Day 9: "Working with external libraries and APIs"
Day 10: "Database integration and data management"
...and so on, each day being completely unique

WHAT TO AVOID (these indicate non-unique content):
❌ "Advanced Practice" (too generic)
❌ "Review and Practice" (not learning new content)
❌ "General Exercises" (not specific enough)
❌ "Continue practicing" (repetitive)
❌ "More of the same" (indicates duplication)
❌ Any day that sounds similar to a previous day

REQUIRED JSON STRUCTURE for exactly ${totalSteps} steps:
[
  {
    "step": 1,
    "week": 1,
    "dayOfWeek": 1,
    "weekTheme": "Foundation & Setup",
    "label": "Day 1: [SPECIFIC UNIQUE ${goal} TOPIC]",
    "description": "[Brief description of this day's unique learning focus]",
    "details": "[Detailed explanation of this specific aspect of ${goal}, what makes it important, and how it fits into the learning progression. Must be completely unique from all other days.]",
    "tasks": [
      "[Specific task 1 related to today's unique topic] (XX min)",
      "[Specific task 2 for this particular skill] (XX min)",
      "[Specific task 3 unique to this concept] (XX min)",
      "[Specific task 4 for this day's focus] (XX min)"
    ],
    "resources": [
      "[Specific resource 1 for today's unique topic]",
      "[Specific resource 2 for this particular skill]",
      "[Specific resource 3 for this concept]",
      "[Specific resource 4 for this day's focus]"
    ],
    "estimatedTime": "${perDay} hours",
    "weeklyGoal": "[Specific goal for this week]",
    "completed": false
  }
]

CRITICAL: Make sure days 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28 are just as unique and specific as days 1-14. Each should introduce a NEW aspect of ${goal} that hasn't been covered before.

Generate exactly ${totalSteps} completely unique learning experiences. Return ONLY the JSON array.`;

    console.log('🤖 Calling OpenAI API with enhanced prompt...');

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        // Replace the system message in your OpenAI call with this enhanced version:

{
  role: "system",
  content: `You are a master curriculum designer creating a comprehensive ${goal} course. Your specialty is designing learning paths where EVERY SINGLE DAY teaches something completely different and unique.

CORE PRINCIPLES:
- Every day must cover a distinct, specific aspect of ${goal}
- No day should repeat content from any other day
- Each day should introduce new concepts, tools, techniques, or applications
- Days 15-28 must be just as unique and valuable as days 1-14
- Avoid any generic "practice" or "review" content

For ${goal} at ${level} level, you have deep knowledge of:
- All the specific tools and technologies used
- Different methodologies and approaches
- Various application areas and use cases
- Progressive skill development pathways
- Real-world applications and projects

Create exactly ${totalSteps} unique learning experiences that build expertise in ${goal}. Each day should feel like learning something completely new and valuable.

Respond with ONLY the JSON array - no explanations, no markdown, just pure JSON.`
},
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 4000,
      temperature: 0.1, // Lower temperature for more consistent, focused content
    });

    console.log('📄 OpenAI response received');
    const response = completion.choices[0].message.content;
    console.log('📊 Response length:', response.length);
    console.log('📝 Response preview:', response.substring(0, 200) + '...');

    // Enhanced JSON parsing with multiple fallback strategies
    let plan;
    try {
      // Strategy 1: Direct JSON parse
      const cleanedResponse = response.trim();
      plan = JSON.parse(cleanedResponse);
      console.log('✅ JSON parsed successfully (direct)');
    } catch (parseError) {
      console.warn('⚠️ Direct JSON parse failed:', parseError.message);
      console.log('📄 Raw response length:', response.length);
      console.log('📄 First 500 chars:', response.substring(0, 500));
      console.log('📄 Last 500 chars:', response.substring(Math.max(0, response.length - 500)));
      
      try {
        // Strategy 2: Check if response is truncated and try to fix it
        let jsonString = response.trim();
        
        // Remove any markdown code blocks if present
        jsonString = jsonString.replace(/```json\s*/g, '');
        jsonString = jsonString.replace(/```\s*/g, '');
        jsonString = jsonString.trim();
        
        // Check if JSON is complete
        if (!jsonString.endsWith(']')) {
          console.log('⚠️ JSON appears truncated, attempting to complete it...');
          
          // Find the last complete object
          const lastCompleteObject = jsonString.lastIndexOf('},');
          if (lastCompleteObject > 0) {
            // Truncate to last complete object and close the array
            jsonString = jsonString.substring(0, lastCompleteObject + 1) + '\n]';
            console.log('✅ Truncated JSON to last complete object');
          } else {
            // If no complete objects found, try to complete the current one
            const openBraces = (jsonString.match(/\{/g) || []).length;
            const closeBraces = (jsonString.match(/\}/g) || []).length;
            
            // Add missing closing braces
            for (let i = 0; i < openBraces - closeBraces; i++) {
              jsonString += '}';
            }
            
            // Ensure array is closed
            if (!jsonString.includes(']')) {
              jsonString += ']';
            }
            
            console.log('✅ Added missing braces and brackets');
          }
        }
        
        // Clean up any formatting issues
        jsonString = jsonString.replace(/,\s*([}\]])/g, '$1'); // Remove trailing commas
        jsonString = jsonString.replace(/'/g, '"'); // Replace single quotes
        jsonString = jsonString.replace(/"/g, '"').replace(/"/g, '"'); // Fix smart quotes
        
        plan = JSON.parse(jsonString);
        console.log('✅ JSON parsed successfully after fixing truncation');
        
      } catch (fixError) {
        console.warn('⚠️ JSON fix failed:', fixError.message);
        
        try {
          // Strategy 3: Extract only complete objects
          const objectMatches = response.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g);
          if (objectMatches && objectMatches.length > 0) {
            console.log(`📊 Found ${objectMatches.length} complete objects, attempting to create array...`);
            
            // Try to parse each object and build array
            const validObjects = [];
            for (const objStr of objectMatches) {
              try {
                const obj = JSON.parse(objStr);
                validObjects.push(obj);
              } catch (objError) {
                console.warn('⚠️ Skipping invalid object:', objStr.substring(0, 100));
              }
            }
            
            if (validObjects.length > 0) {
              plan = validObjects;
              console.log(`✅ Successfully parsed ${validObjects.length} objects from response`);
            } else {
              throw new Error('No valid objects found in response');
            }
          } else {
            throw new Error('No parseable JSON objects found in response');
          }
        } catch (extractError) {
          console.error('❌ All JSON parsing strategies failed');
          console.error('Original parse error:', parseError.message);
          console.error('Fix error:', fixError.message);
          console.error('Extract error:', extractError.message);
          console.error('Response preview (first 1000 chars):', response.substring(0, 1000));
          
          throw new Error(`Could not parse OpenAI response as JSON. Response starts with: ${response.substring(0, 200)}`);
        }
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

Return ONLY a JSON array with exactly ${missingSteps} steps, continuing the sequence and maintaining quality. No markdown code blocks.`;

      try {
        const followUpCompletion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `Continue creating specific learning content for ${goal}. Every step must be unique and valuable. Return only JSON array.`
            },
            {
              role: "user",
              content: followUpPrompt
            }
          ],
          max_tokens: 2000,
          temperature: 0.2,
        });

        const followUpResponse = followUpCompletion.choices[0].message.content.trim();
        
        // Parse follow-up response with same strategies
        let additionalSteps;
        try {
          additionalSteps = JSON.parse(followUpResponse);
        } catch (followUpParseError) {
          // Try cleaning markdown from follow-up
          let cleanFollowUp = followUpResponse.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
          additionalSteps = JSON.parse(cleanFollowUp);
        }
        
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
      
      const weekThemes = [
        "Foundation & Setup", "Core Concepts", "Practical Application", 
        "Advanced Techniques", "Specialization", "Mastery & Projects",
        "Professional Skills", "Expert Applications"
      ];
      const theme = weekThemes[Math.min(weekNumber - 1, weekThemes.length - 1)];
      
      // Ensure all required fields exist and are meaningful
      return {
        step: currentStep,
        week: step.week || weekNumber,
        dayOfWeek: step.dayOfWeek || dayOfWeek,
        weekTheme: step.weekTheme || theme,
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

// Validate uniqueness of content
    console.log('🔍 Validating content uniqueness...');
    const uniquenessIssues = [];

    // Check for duplicate or similar labels
    const labels = plan.map(step => step.label?.toLowerCase() || '');
    const duplicateLabels = labels.filter((label, index) => labels.indexOf(label) !== index);
    if (duplicateLabels.length > 0) {
      uniquenessIssues.push(`Duplicate labels found: ${duplicateLabels.join(', ')}`);
    }

    // Check for generic content patterns
    const genericPatterns = [
      'advanced practice', 'review and practice', 'general exercises', 
      'continue practicing', 'more practice', 'additional practice',
      'practice session', 'review session', 'exercise day'
    ];

    plan.forEach((step, index) => {
      const content = `${step.label} ${step.description} ${step.details}`.toLowerCase();
      genericPatterns.forEach(pattern => {
        if (content.includes(pattern)) {
          uniquenessIssues.push(`Day ${step.step} contains generic content: "${pattern}"`);
        }
      });
      
      // Check if tasks are too similar across days
      if (step.tasks && Array.isArray(step.tasks)) {
        const hasGenericTasks = step.tasks.some(task => 
          task.toLowerCase().includes('practice') && 
          task.toLowerCase().includes('exercise') &&
          !task.toLowerCase().includes('specific')
        );
        if (hasGenericTasks) {
          uniquenessIssues.push(`Day ${step.step} has generic tasks`);
        }
      }
    });

    // If uniqueness issues found, request more specific content
    if (uniquenessIssues.length > 0) {
      console.warn('⚠️ Uniqueness issues detected:', uniquenessIssues);
      console.log('🔄 Requesting more specific content from OpenAI...');
      
      const refinementPrompt = `The previous ${goal} curriculum had some generic content. Please create a more specific version with these requirements:

ISSUES TO FIX:
${uniquenessIssues.map(issue => `- ${issue}`).join('\n')}

Create exactly ${totalSteps} steps for learning ${goal} where:
1. Every day has a completely unique, specific topic
2. No generic "practice" or "review" days
3. Each day teaches a distinct skill/concept/tool/technique
4. All tasks are specific to that day's learning objective
5. Resources are tailored to each day's specific topic

Focus especially on making days 15-28 unique and valuable, covering advanced aspects of ${goal} like:
- Specialized tools and techniques
- Advanced methodologies
- Complex problem-solving scenarios
- Real-world project applications
- Industry-specific use cases
- Integration with other systems
- Optimization and best practices

Return ONLY the JSON array with ${totalSteps} completely unique learning experiences.`;

      try {
        const refinementCompletion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `You are a specialist in creating unique, non-repetitive learning content for ${goal}. Every day must teach something completely different. Respond with only JSON.`
            },
            {
              role: "user",
              content: refinementPrompt
            }
          ],
          max_tokens: 4000,
          temperature: 0.1, // Lower temperature for more consistent, focused content
        });

        const refinedResponse = refinementCompletion.choices[0].message.content.trim();
        
        // Parse the refined response using same strategies
        let refinedPlan;
        try {
          refinedPlan = JSON.parse(refinedResponse.replace(/```json\s*/g, '').replace(/```\s*/g, ''));
          plan = refinedPlan;
          console.log('✅ Used refined, more unique content');
        } catch (refinedParseError) {
          console.warn('⚠️ Could not parse refined response, using original');
        }
      } catch (refinementError) {
        console.warn('⚠️ Refinement request failed, using original content');
      }
    }



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
        model: 'gpt-4o-mini',
        corsEnabled: true
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
  console.log(`\n🎉 LearnBloom Server Ready with Guaranteed CORS!`);
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