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

    // For longer paths (3+ weeks), generate in chunks to avoid token limits
    if (totalSteps > 14) {
      console.log('📦 Using chunked generation for large learning path...');
      
      const chunksNeeded = Math.ceil(totalSteps / 14); // Generate max 14 days per chunk
      let allSteps = [];
      
      for (let chunkIndex = 0; chunkIndex < chunksNeeded; chunkIndex++) {
        const startDay = (chunkIndex * 14) + 1;
        const endDay = Math.min(startDay + 13, totalSteps);
        const daysInChunk = endDay - startDay + 1;
        const startWeek = Math.ceil(startDay / 7);
        const endWeek = Math.ceil(endDay / 7);
        
        console.log(`📚 Generating chunk ${chunkIndex + 1}/${chunksNeeded}: Days ${startDay}-${endDay} (${daysInChunk} days)`);
        
        // Create focused prompt for this chunk
        const chunkPrompt = `Create ${daysInChunk} learning steps for "${goal}" at ${level} level.

Days ${startDay}-${endDay} of a ${totalSteps}-day program (${duration} weeks total, ${perDay}h/day).

Week progression:
${startWeek === endWeek ? 
  `Week ${startWeek}` : 
  `Weeks ${startWeek}-${endWeek} (transitioning from week ${startWeek} concepts to week ${endWeek} concepts)`
}

Each step needs:
- Unique specific topic (no generic "practice" or "review")
- Concise but educational details (2-3 sentences max)
- 3 specific tasks with time estimates
- 3 relevant resources

Return JSON array of ${daysInChunk} objects:
[{"step":${startDay},"week":${startWeek},"dayOfWeek":${((startDay-1)%7)+1},"weekTheme":"Foundation","label":"Day ${startDay}: [Specific Topic]","description":"Brief desc","details":"What to learn and why (concise)","tasks":["Task 1 (20min)","Task 2 (25min)","Task 3 (15min)"],"resources":["Resource 1","Resource 2","Resource 3"],"estimatedTime":"${perDay} hours","weeklyGoal":"Week goal","completed":false}]

Make each day cover a completely different aspect of ${goal}. Be specific and educational.`;

        try {
          const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: `Create exactly ${daysInChunk} unique learning steps for "${goal}". Each day must be specific and different. Keep content concise to avoid truncation. Return only valid JSON array.`
              },
              {
                role: "user",
                content: chunkPrompt
              }
            ],
            max_tokens: 2500, // Reduced for safety
            temperature: 0.1,
          });

          console.log('📄 OpenAI response received for chunk');
          const response = completion.choices[0].message.content;

          // Parse chunk response
          let chunkSteps;
          try {
            const cleanResponse = response.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
            chunkSteps = JSON.parse(cleanResponse);
            console.log(`✅ Chunk ${chunkIndex + 1} parsed successfully: ${chunkSteps.length} steps`);
          } catch (parseError) {
            console.error(`❌ Chunk ${chunkIndex + 1} JSON parsing failed:`, parseError.message);
            
            // Try to salvage what we can
            try {
              const jsonString = response.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
              const lastCompleteObject = jsonString.lastIndexOf('},');
              if (lastCompleteObject > 0) {
                const repairedJson = jsonString.substring(0, lastCompleteObject + 1) + '\n]';
                chunkSteps = JSON.parse(repairedJson);
                console.log(`✅ Chunk ${chunkIndex + 1} repaired: ${chunkSteps.length} steps salvaged`);
              } else {
                throw new Error('Could not repair chunk JSON');
              }
            } catch (repairError) {
              console.error(`❌ Chunk ${chunkIndex + 1} repair failed, using fallback`);
              
              // Generate fallback steps for this chunk
              chunkSteps = [];
              for (let i = 0; i < daysInChunk; i++) {
                const stepNumber = startDay + i;
                const weekNumber = Math.ceil(stepNumber / 7);
                const dayOfWeek = ((stepNumber - 1) % 7) + 1;
                
                chunkSteps.push({
                  step: stepNumber,
                  week: weekNumber,
                  dayOfWeek: dayOfWeek,
                  weekTheme: weekNumber === 1 ? "Foundation" : weekNumber === 2 ? "Core Concepts" : weekNumber === 3 ? "Practical Application" : "Advanced Techniques",
                  label: `Day ${stepNumber}: ${goal} Topic ${stepNumber}`,
                  description: `Learn specific ${goal} concepts for day ${stepNumber}`,
                  details: `Focus on practical ${goal} skills and build your understanding through hands-on practice.`,
                  tasks: [`Study ${goal} concept (20min)`, `Practice exercises (25min)`, `Review and notes (15min)`],
                  resources: [`${goal} documentation`, `Online tutorials`, `Practice examples`],
                  estimatedTime: `${perDay} hours`,
                  weeklyGoal: `Master week ${weekNumber} ${goal} concepts`,
                  completed: false
                });
              }
            }
          }

          // Validate and fix chunk steps
          if (!Array.isArray(chunkSteps)) {
            throw new Error(`Chunk ${chunkIndex + 1} is not an array`);
          }

          // Ensure correct step numbering and structure
          chunkSteps = chunkSteps.map((step, index) => {
            const correctStepNumber = startDay + index;
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
              details: step.details || `Study ${goal} and practice the skills.`,
              tasks: Array.isArray(step.tasks) ? step.tasks : [`Study ${goal} (${perDay} hours)`],
              resources: Array.isArray(step.resources) ? step.resources : [`${goal} resources`],
              estimatedTime: `${perDay} hours`,
              weeklyGoal: step.weeklyGoal || `Master week ${weekNumber} ${goal} concepts`,
              completed: false
            };
          });

          allSteps = allSteps.concat(chunkSteps);
          console.log(`✅ Chunk ${chunkIndex + 1} completed. Total steps so far: ${allSteps.length}`);
          
        } catch (chunkError) {
          console.error(`❌ Chunk ${chunkIndex + 1} failed:`, chunkError.message);
          throw new Error(`Failed to generate learning path chunk ${chunkIndex + 1}: ${chunkError.message}`);
        }
      }
      
      console.log(`✅ Successfully generated ${allSteps.length} steps using chunked generation`);
      
      // Send final response
      res.json({ 
        plan: allSteps,
        metadata: {
          goal,
          level,
          duration,
          perDay,
          totalSteps: allSteps.length,
          generatedAt: new Date().toISOString(),
          generatedBy: 'OpenAI Chunked Generation',
          model: 'gpt-4o-mini',
          chunksUsed: chunksNeeded,
          corsEnabled: true
        }
      });
      
    } else {
      // For shorter paths (≤ 2 weeks), use single generation
      console.log('📚 Using single generation for short learning path...');
      
      const prompt = `Create ${totalSteps} learning steps for "${goal}" at ${level} level.

Duration: ${duration} weeks, ${perDay} hours per day.

Each step needs:
- Unique specific topic
- Brief educational details (2-3 sentences)
- 3 tasks with time estimates
- 3 resources

Return JSON array of ${totalSteps} objects:
[{"step":1,"week":1,"dayOfWeek":1,"weekTheme":"Foundation","label":"Day 1: [Topic]","description":"Brief","details":"What and why (concise)","tasks":["Task (20min)","Task (25min)","Task (15min)"],"resources":["Resource 1","Resource 2","Resource 3"],"estimatedTime":"${perDay} hours","weeklyGoal":"Week goal","completed":false}]

Make each day unique and educational.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Create ${totalSteps} unique learning steps. Keep content concise. Return only valid JSON array.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 3000,
        temperature: 0.1,
      });

      console.log('📄 OpenAI response received');
      const response = completion.choices[0].message.content;

      // Parse response with enhanced error handling
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
        
        // Try to repair JSON
        try {
          let jsonString = response.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
          
          if (!jsonString.endsWith(']') || parseError.message.includes('Unterminated')) {
            console.log('⚠️ JSON appears truncated, attempting to salvage...');
            const lastCompleteObject = jsonString.lastIndexOf('},');
            if (lastCompleteObject > 0) {
              jsonString = jsonString.substring(0, lastCompleteObject + 1) + '\n]';
              console.log('✅ Truncated to last complete object');
            }
          }
          
          plan = JSON.parse(jsonString);
          console.log('✅ Successfully parsed repaired JSON');
          
        } catch (repairError) {
          throw new Error(`Could not parse OpenAI response: ${parseError.message}`);
        }
      }

      // Validate and ensure correct structure
      if (!Array.isArray(plan)) {
        throw new Error('OpenAI response is not an array');
      }

      if (plan.length === 0) {
        throw new Error('OpenAI returned empty learning path');
      }

      // Ensure correct number of steps and structure
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
        
        const weekThemes = ["Foundation & Setup", "Core Concepts", "Practical Application", "Advanced Techniques"];
        const theme = weekThemes[Math.min(weekNumber - 1, weekThemes.length - 1)];
        
        return {
          step: currentStep,
          week: weekNumber,
          dayOfWeek: dayOfWeek,
          weekTheme: theme,
          label: step.label || `Day ${currentStep}: ${goal} Learning`,
          description: step.description || `Learn ${goal} concepts`,
          details: step.details || `Study ${goal} and practice the skills.`,
          tasks: Array.isArray(step.tasks) ? step.tasks : [`Study ${goal} (${perDay} hours)`],
          resources: Array.isArray(step.resources) ? step.resources : [`${goal} resources`],
          estimatedTime: `${perDay} hours`,
          weeklyGoal: step.weeklyGoal || `Master week ${weekNumber} ${goal} concepts`,
          completed: false
        };
      });

      console.log(`✅ Successfully generated ${plan.length} learning steps using single generation`);

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
          generatedBy: 'OpenAI Single Generation',
          model: 'gpt-4o-mini',
          corsEnabled: true
        }
      });
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

// Start server
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