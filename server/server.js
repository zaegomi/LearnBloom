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

    // Optimized generation strategy based on duration
    if (totalSteps <= 7) {
      // Single week - generate all at once
      console.log('📚 Using single generation for 1 week...');
      
      const prompt = `Create exactly ${totalSteps} learning steps for "${goal}" at ${level} level.
Duration: ${duration} week, ${perDay} hours per day.

Return JSON array of ${totalSteps} objects:
[{"step":1,"week":1,"dayOfWeek":1,"weekTheme":"Foundation","label":"Day 1: [Topic]","description":"Brief","details":"What to learn","tasks":["Task 1 (20min)","Task 2 (25min)","Task 3 (15min)"],"resources":["Resource 1","Resource 2","Resource 3"],"estimatedTime":"${perDay} hours","weeklyGoal":"Week goal","completed":false}]

Make each day unique and educational.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 2000,
        temperature: 0.1,
      });

      const response = completion.choices[0].message.content;
      let plan;
      
      try {
        const cleanResponse = response.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        plan = JSON.parse(cleanResponse);
      } catch (parseError) {
        throw new Error(`JSON parsing failed: ${parseError.message}`);
      }

      if (!Array.isArray(plan) || plan.length === 0) {
        throw new Error('Invalid learning path generated');
      }

      console.log(`✅ Generated ${plan.length} steps using single generation`);

      return res.json({ 
        plan,
        metadata: {
          goal, level, duration, perDay,
          totalSteps: plan.length,
          generatedAt: new Date().toISOString(),
          generatedBy: 'OpenAI Single Generation',
          model: 'gpt-4o-mini'
        }
      });

    } else {
      // Multiple weeks - optimized batch generation
      console.log('📦 Using optimized batch generation for multiple weeks...');
      
      let allSteps = [];
      const weeksToGenerate = duration;
      
      // Generate 2 weeks at a time for better efficiency
      const batchSize = 2;
      const batches = Math.ceil(weeksToGenerate / batchSize);
      
      for (let batchIndex = 0; batchIndex < batches; batchIndex++) {
        const startWeek = (batchIndex * batchSize) + 1;
        const endWeek = Math.min(startWeek + batchSize - 1, weeksToGenerate);
        const weeksInBatch = endWeek - startWeek + 1;
        const daysInBatch = weeksInBatch * 7;
        const startDay = (batchIndex * batchSize * 7) + 1;
        
        console.log(`📚 Generating batch ${batchIndex + 1}/${batches}: Weeks ${startWeek}-${endWeek} (${daysInBatch} days)`);
        
        // Optimized prompt for batch generation
        const batchPrompt = `Create exactly ${daysInBatch} learning steps for "${goal}" at ${level} level.

This covers weeks ${startWeek}-${endWeek} of a ${duration}-week program.
${perDay} hours per day study time.

Week themes:
${startWeek === 1 ? "Week 1: Foundation & Setup" : startWeek === 2 ? "Week 2: Core Concepts" : startWeek === 3 ? "Week 3: Practical Application" : `Week ${startWeek}: Advanced Techniques`}
${endWeek > startWeek ? (endWeek === 2 ? "Week 2: Core Concepts" : endWeek === 3 ? "Week 3: Practical Application" : `Week ${endWeek}: Advanced Techniques`) : ""}

Return JSON array of exactly ${daysInBatch} objects (7 days per week):
[{"step":${startDay},"week":${startWeek},"dayOfWeek":1,"weekTheme":"Foundation","label":"Day ${startDay}: [Specific Topic]","description":"Brief description","details":"What to learn and why","tasks":["Task 1 (20min)","Task 2 (25min)","Task 3 (15min)"],"resources":["Resource 1","Resource 2","Resource 3"],"estimatedTime":"${perDay} hours","weeklyGoal":"Week goal","completed":false}]

Make each day cover a unique ${goal} topic. Be specific and educational.`;

        try {
          const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: `Create exactly ${daysInBatch} unique learning steps for "${goal}". Each day must be specific and different. Keep content concise but educational. Return only valid JSON array.`
              },
              {
                role: "user",
                content: batchPrompt
              }
            ],
            max_tokens: Math.min(4000, daysInBatch * 200), // Dynamic token allocation
            temperature: 0.1,
          });

          console.log(`📄 OpenAI response received for batch ${batchIndex + 1}`);
          const response = completion.choices[0].message.content;

          // Parse batch response
          let batchSteps;
          try {
            const cleanResponse = response.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
            batchSteps = JSON.parse(cleanResponse);
            console.log(`✅ Batch ${batchIndex + 1} parsed successfully: ${batchSteps.length} steps`);
          } catch (parseError) {
            console.error(`❌ Batch ${batchIndex + 1} JSON parsing failed:`, parseError.message);
            
            // Try to salvage what we can
            try {
              const jsonString = response.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
              const lastCompleteObject = jsonString.lastIndexOf('},');
              if (lastCompleteObject > 0) {
                const repairedJson = jsonString.substring(0, lastCompleteObject + 1) + '\n]';
                batchSteps = JSON.parse(repairedJson);
                console.log(`✅ Batch ${batchIndex + 1} repaired: ${batchSteps.length} steps salvaged`);
              } else {
                throw new Error('Could not repair batch JSON');
              }
            } catch (repairError) {
              console.error(`❌ Batch ${batchIndex + 1} repair failed, generating fallback steps`);
              batchSteps = [];
            }
          }

          // Ensure we have the right number of steps for this batch
          if (!Array.isArray(batchSteps) || batchSteps.length !== daysInBatch) {
            console.warn(`⚠️ Batch ${batchIndex + 1} returned ${batchSteps?.length || 0} steps, expected ${daysInBatch}. Generating fallback.`);
            
            batchSteps = [];
            for (let dayIndex = 0; dayIndex < daysInBatch; dayIndex++) {
              const stepNumber = startDay + dayIndex;
              const weekNumber = Math.ceil(stepNumber / 7);
              const dayOfWeek = ((stepNumber - 1) % 7) + 1;
              
              const weekThemes = ["Foundation & Setup", "Core Concepts", "Practical Application", "Advanced Techniques"];
              const theme = weekThemes[Math.min(weekNumber - 1, weekThemes.length - 1)];
              
              batchSteps.push({
                step: stepNumber,
                week: weekNumber,
                dayOfWeek: dayOfWeek,
                weekTheme: theme,
                label: `Day ${stepNumber}: ${goal} Topic ${stepNumber}`,
                description: `Learn ${goal} concepts for day ${stepNumber}`,
                details: `Focus on ${goal} skills and build understanding through practice.`,
                tasks: [`Study ${goal} concepts (20min)`, `Practice exercises (25min)`, `Review notes (15min)`],
                resources: [`${goal} documentation`, `Online tutorials`, `Practice examples`],
                estimatedTime: `${perDay} hours`,
                weeklyGoal: `Master week ${weekNumber} ${goal} concepts`,
                completed: false
              });
            }
          }

          // Validate and fix step numbering
          batchSteps = batchSteps.map((step, index) => {
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
              tasks: Array.isArray(step.tasks) ? step.tasks : [`Study ${goal} (20min)`, `Practice exercises (25min)`, `Review notes (15min)`],
              resources: Array.isArray(step.resources) ? step.resources : [`${goal} documentation`, `Online tutorials`, `Practice examples`],
              estimatedTime: `${perDay} hours`,
              weeklyGoal: step.weeklyGoal || `Master week ${weekNumber} ${goal} concepts`,
              completed: false
            };
          });

          allSteps = allSteps.concat(batchSteps);
          console.log(`✅ Batch ${batchIndex + 1} completed. Total steps so far: ${allSteps.length}`);
          
        } catch (batchError) {
          console.error(`❌ Batch ${batchIndex + 1} failed:`, batchError.message);
          throw new Error(`Failed to generate learning path batch ${batchIndex + 1}: ${batchError.message}`);
        }
      }
      
      // Final validation - ensure we have exactly the right number of steps
      if (allSteps.length !== totalSteps) {
        console.warn(`⚠️ Generated ${allSteps.length} steps but expected ${totalSteps}. Adjusting...`);
        
        if (allSteps.length < totalSteps) {
          // Add missing steps
          const missingSteps = totalSteps - allSteps.length;
          console.log(`➕ Adding ${missingSteps} missing steps...`);
          
          for (let i = 0; i < missingSteps; i++) {
            const stepNumber = allSteps.length + 1 + i;
            const weekNumber = Math.ceil(stepNumber / 7);
            const dayOfWeek = ((stepNumber - 1) % 7) + 1;
            
            const weekThemes = ["Foundation & Setup", "Core Concepts", "Practical Application", "Advanced Techniques"];
            const theme = weekThemes[Math.min(weekNumber - 1, weekThemes.length - 1)];
            
            allSteps.push({
              step: stepNumber,
              week: weekNumber,
              dayOfWeek: dayOfWeek,
              weekTheme: theme,
              label: `Day ${stepNumber}: ${goal} Additional Topic`,
              description: `Learn additional ${goal} concepts`,
              details: `Focus on expanding your ${goal} knowledge with practical exercises.`,
              tasks: [`Study ${goal} concepts (20min)`, `Practice exercises (25min)`, `Review notes (15min)`],
              resources: [`${goal} documentation`, `Tutorials`, `Practice projects`],
              estimatedTime: `${perDay} hours`,
              weeklyGoal: `Master week ${weekNumber} ${goal} concepts`,
              completed: false
            });
          }
        } else if (allSteps.length > totalSteps) {
          // Remove extra steps
          allSteps = allSteps.slice(0, totalSteps);
        }
      }
      
      console.log(`✅ Successfully generated exactly ${allSteps.length} steps using optimized batch generation`);
      
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
          generatedBy: 'OpenAI Optimized Batch Generation',
          model: 'gpt-4o-mini',
          batchesUsed: batches,
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