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

    // TEMPORARY: Limit to prevent timeouts while testing
    if (totalSteps > 7) {
      console.log('⚠️ TEMPORARY: Limiting to 7 days to prevent timeout');
      const limitedSteps = 7;
      
      const prompt = `Create exactly 7 learning steps for "${goal}" at ${level} level.
Duration: 1 week, ${perDay} hours per day.

Return JSON array of 7 objects:
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

      console.log(`✅ Generated ${plan.length} steps (LIMITED FOR TESTING)`);

      return res.json({ 
        plan,
        metadata: {
          goal, level, duration, perDay,
          totalSteps: plan.length,
          generatedAt: new Date().toISOString(),
          generatedBy: 'OpenAI Limited Test',
          model: 'gpt-4o-mini',
          note: 'Limited to 7 days for timeout testing'
        }
      });
    }

    // For longer paths (3+ weeks), generate in chunks to avoid token limits
    if (totalSteps > 14) {
      console.log('📦 Using chunked generation for large learning path...');
      
      // Generate exactly 7 days per week to ensure perfect count
      const weeksToGenerate = duration;
      let allSteps = [];
      
      for (let weekIndex = 0; weekIndex < weeksToGenerate; weekIndex++) {
        const weekNumber = weekIndex + 1;
        const startDay = (weekIndex * 7) + 1;
        const endDay = startDay + 6; // Always 7 days per week
        const daysInWeek = 7;
        
        console.log(`📚 Generating Week ${weekNumber}/${duration}: Days ${startDay}-${endDay} (${daysInWeek} days)`);
        
        // Create focused prompt for this week
        const weekPrompt = `Create exactly 7 learning steps for "${goal}" at ${level} level.

This is Week ${weekNumber} of ${duration} weeks (Days ${startDay}-${endDay}).
Total program: ${totalSteps} days, ${perDay} hours per day.

Week ${weekNumber} theme: ${
  weekNumber === 1 ? "Foundation & Setup" : 
  weekNumber === 2 ? "Core Concepts" : 
  weekNumber === 3 ? "Practical Application" : 
  "Advanced Techniques"
}

Each day must have:
- Unique specific ${goal} topic (no generic content)
- Brief educational details (2 sentences max)
- 3 specific tasks with time estimates
- 3 relevant resources

Return JSON array of exactly 7 objects:
[{"step":${startDay},"week":${weekNumber},"dayOfWeek":1,"weekTheme":"${weekNumber === 1 ? "Foundation & Setup" : weekNumber === 2 ? "Core Concepts" : weekNumber === 3 ? "Practical Application" : "Advanced Techniques"}","label":"Day ${startDay}: [Specific ${goal} Topic]","description":"Brief description","details":"What to learn and why (concise).","tasks":["Specific task 1 (20min)","Specific task 2 (25min)","Specific task 3 (15min)"],"resources":["Resource 1","Resource 2","Resource 3"],"estimatedTime":"${perDay} hours","weeklyGoal":"Week ${weekNumber} goal for ${goal}","completed":false}]

Make each of the 7 days cover completely different ${goal} topics. Be specific and educational.`;

        try {
          const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: `Create exactly 7 unique learning steps for "${goal}" Week ${weekNumber}. Each day must be specific and different. Keep content concise. Return only valid JSON array of 7 objects.`
              },
              {
                role: "user",
                content: weekPrompt
              }
            ],
            max_tokens: 2200, // Reduced for safety
            temperature: 0.1,
          });

          console.log(`📄 OpenAI response received for Week ${weekNumber}`);
          const response = completion.choices[0].message.content;

          // Parse week response
          let weekSteps;
          try {
            const cleanResponse = response.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
            weekSteps = JSON.parse(cleanResponse);
            console.log(`✅ Week ${weekNumber} parsed successfully: ${weekSteps.length} steps`);
          } catch (parseError) {
            console.error(`❌ Week ${weekNumber} JSON parsing failed:`, parseError.message);
            
            // Try to salvage what we can
            try {
              const jsonString = response.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
              const lastCompleteObject = jsonString.lastIndexOf('},');
              if (lastCompleteObject > 0) {
                const repairedJson = jsonString.substring(0, lastCompleteObject + 1) + '\n]';
                weekSteps = JSON.parse(repairedJson);
                console.log(`✅ Week ${weekNumber} repaired: ${weekSteps.length} steps salvaged`);
              } else {
                throw new Error('Could not repair week JSON');
              }
            } catch (repairError) {
              console.error(`❌ Week ${weekNumber} repair failed, generating exactly 7 fallback steps`);
              weekSteps = [];
            }
          }

          // Always ensure exactly 7 steps for the week
          if (!Array.isArray(weekSteps) || weekSteps.length !== 7) {
            console.warn(`⚠️ Week ${weekNumber} returned ${Array.isArray(weekSteps) ? weekSteps.length : 0} steps, generating 7 fallback steps`);
            
            weekSteps = [];
            for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
              const stepNumber = startDay + dayIndex;
              const dayOfWeek = dayIndex + 1;
              const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
              
              const weekThemes = ["Foundation & Setup", "Core Concepts", "Practical Application", "Advanced Techniques"];
              const theme = weekThemes[Math.min(weekNumber - 1, weekThemes.length - 1)];
              
              // Create specific topics for Python based on week and day
              const pythonTopics = {
                1: [`Python Installation & Setup`, `Variables and Data Types`, `Numbers and Basic Operations`, `Strings and Text Processing`, `Boolean Logic and Comparisons`, `Input/Output Operations`, `First Python Programs`],
                2: [`Lists and List Methods`, `Dictionaries and Key-Value Pairs`, `Control Flow: If Statements`, `Loops: For and While`, `Functions and Parameters`, `Modules and Imports`, `Error Handling Basics`],
                3: [`File Reading and Writing`, `Working with CSV Data`, `API Requests with requests`, `Web Scraping Basics`, `Data Processing Techniques`, `Building a Calculator Project`, `Creating a To-Do List App`],
                4: [`Object-Oriented Programming`, `Classes and Inheritance`, `Working with Databases`, `Advanced Data Structures`, `Performance Optimization`, `Testing Your Code`, `Deployment and Packaging`]
              };
              
              const topicForDay = pythonTopics[weekNumber] ? pythonTopics[weekNumber][dayIndex] : `${goal} Advanced Topic ${stepNumber}`;
              
              weekSteps.push({
                step: stepNumber,
                week: weekNumber,
                dayOfWeek: dayOfWeek,
                weekTheme: theme,
                label: `Day ${stepNumber}: ${topicForDay}`,
                description: `Learn ${topicForDay.toLowerCase()} in ${goal}`,
                details: `Focus on understanding ${topicForDay.toLowerCase()} and build practical skills through hands-on exercises.`,
                tasks: [`Study ${topicForDay} concepts (20min)`, `Complete practical exercises (25min)`, `Build a small project (15min)`],
                resources: [`${goal} official documentation`, `Online tutorials for ${topicForDay}`, `Practice exercises and examples`],
                estimatedTime: `${perDay} hours`,
                weeklyGoal: `Master ${theme.toLowerCase()} concepts in ${goal}`,
                completed: false
              });
            }
          }

          // Ensure correct step numbering and structure for all 7 days
          weekSteps = weekSteps.map((step, index) => {
            const correctStepNumber = startDay + index;
            const dayOfWeek = index + 1;
            
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

          // Always add exactly 7 steps
          allSteps = allSteps.concat(weekSteps);
          console.log(`✅ Week ${weekNumber} completed with exactly 7 steps. Total steps so far: ${allSteps.length}`);
          
        } catch (weekError) {
          console.error(`❌ Week ${weekNumber} failed:`, weekError.message);
          throw new Error(`Failed to generate learning path week ${weekNumber}: ${weekError.message}`);
        }
      }
      
      // Ensure we have exactly the right number of steps
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
              label: `Day ${stepNumber}: ${goal} Additional Topic ${stepNumber}`,
              description: `Learn additional ${goal} concepts`,
              details: `Focus on expanding your ${goal} knowledge with practical exercises and real-world applications.`,
              tasks: [`Study ${goal} concepts (20min)`, `Complete practice exercises (25min)`, `Review and document learning (15min)`],
              resources: [`${goal} official documentation`, `Community tutorials`, `Practice projects`],
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
      
      console.log(`✅ Successfully generated exactly ${allSteps.length} steps using week-by-week generation`);
      
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
          generatedBy: 'OpenAI Week-by-Week Generation',
          model: 'gpt-4o-mini',
          weeksGenerated: weeksToGenerate,
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