import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  // Storage helper functions
  const saveToStorage = (key, data) => {
    try {
      localStorage.setItem(`learnbloom-${key}`, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  };

  const loadFromStorage = (key, defaultValue) => {
    try {
      const item = localStorage.getItem(`learnbloom-${key}`);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      return defaultValue;
    }
  };

  // Initialize state with saved data
  const [view, setView] = useState(() => loadFromStorage('view', 'home'));
  const [goal, setGoal] = useState(() => loadFromStorage('goal', ''));
  const [level, setLevel] = useState(() => loadFromStorage('level', 'Beginner'));
  const [duration, setDuration] = useState(() => loadFromStorage('duration', 4));
  const [perDay, setPerDay] = useState(() => loadFromStorage('perDay', 1));
  const [planSteps, setPlanSteps] = useState(() => loadFromStorage('planSteps', []));
  const [progress, setProgress] = useState(() => loadFromStorage('progress', 0));
  const [savedPaths, setSavedPaths] = useState(() => loadFromStorage('savedPaths', []));
  const [loading, setLoading] = useState(false);
  const [selectedStep, setSelectedStep] = useState(null);

  // Auto-save when data changes
  useEffect(() => {
    saveToStorage('view', view);
  }, [view]);

  useEffect(() => {
    saveToStorage('goal', goal);
  }, [goal]);

  useEffect(() => {
    saveToStorage('level', level);
  }, [level]);

  useEffect(() => {
    saveToStorage('duration', duration);
  }, [duration]);

  useEffect(() => {
    saveToStorage('perDay', perDay);
  }, [perDay]);

  useEffect(() => {
    saveToStorage('planSteps', planSteps);
  }, [planSteps]);

  useEffect(() => {
    saveToStorage('progress', progress);
  }, [progress]);

  useEffect(() => {
    saveToStorage('savedPaths', savedPaths);
  }, [savedPaths]);

  // Clear all data function (for testing/reset)
  const clearAllData = () => {
    if (window.confirm('Are you sure you want to clear all saved data?')) {
      localStorage.removeItem('learnbloom-view');
      localStorage.removeItem('learnbloom-goal');
      localStorage.removeItem('learnbloom-level');
      localStorage.removeItem('learnbloom-duration');
      localStorage.removeItem('learnbloom-perDay');
      localStorage.removeItem('learnbloom-planSteps');
      localStorage.removeItem('learnbloom-progress');
      localStorage.removeItem('learnbloom-savedPaths');
      
      // Reset state
      setView('home');
      setGoal('');
      setLevel('Beginner');
      setDuration(4);
      setPerDay(1);
      setPlanSteps([]);
      setProgress(0);
      setSavedPaths([]);
      setSelectedStep(null);
      
      alert('All data cleared!');
    }
  };

  // Show data recovery notification
  useEffect(() => {
    const hasData = loadFromStorage('savedPaths', []).length > 0 || 
                   loadFromStorage('goal', '') !== '';
    
    if (hasData && view === 'home') {
      // Subtle notification that data was recovered
      setTimeout(() => {
        console.log('✅ Your previous session data has been restored');
      }, 1000);
    }
  }, []);

  // Generate learning path by calling backend
const generatePlan = async () => {
  if (!goal.trim()) {
    alert('Please enter a learning goal');
    return;
  }

  setLoading(true);
  try {
    console.log('🚀 Making API call to backend...');
    
    const API_BASE_URL = process.env.NODE_ENV === 'production' 
      ? 'https://learn-bloom.vercel.app'  // Your exact backend URL
      : 'http://localhost:5000';

    console.log('📡 API URL:', `${API_BASE_URL}/api/generate-path`);
    console.log('📊 Request data:', { goal, level, duration, perDay });

    const response = await fetch(`${API_BASE_URL}/api/generate-path`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ goal, level, duration, perDay })
    });
    
    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', response.headers);
    
    // Check if response is ok
    if (!response.ok) {
      const errorText = await response.text(); // Get raw text instead of JSON
      console.error('❌ Error response:', errorText);
      throw new Error(`HTTP error! Status: ${response.status} - ${errorText}`);
    }
    
    // Check if response has content
    const responseText = await response.text();
    console.log('📄 Raw response:', responseText);
    
    if (!responseText) {
      throw new Error('Empty response from server');
    }
    
    // Try to parse JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      console.error('❌ Response text:', responseText);
      throw new Error(`Invalid JSON response: ${parseError.message}`);
    }
    
    console.log('✅ Parsed data:', data);
    
    // Rest of your existing code...
    if (!data.plan || !Array.isArray(data.plan)) {
      throw new Error('Invalid response format - missing plan array');
    }
    
    const newPlan = data.plan;
    
    // Check for duplicates
    const isDuplicate = savedPaths.some(
      path => path.goal === goal && path.level === level && path.duration === duration && path.perDay === perDay
    );
    
    if (!isDuplicate) {
      setSavedPaths([...savedPaths, { goal, level, duration, perDay, plan: newPlan, progress: 0 }]);
    }
    
    setPlanSteps(newPlan);
    setProgress(0);
    setSelectedStep(null);
    setView('path');
    
  } catch (err) {
    console.error('❌ Full error details:', err);
    alert(`Failed to generate plan: ${err.message}`);
  } finally {
    setLoading(false);
  }
};

  const completeStep = (stepNumber) => {
    const updatedSteps = planSteps.map(step => 
      step.step === stepNumber ? { ...step, completed: true } : step
    );
    setPlanSteps(updatedSteps);
    
    const completedCount = updatedSteps.filter(step => step.completed).length;
    const newProgress = Math.round((completedCount / planSteps.length) * 100);
    setProgress(newProgress);
    
    // Update saved paths
    const updated = savedPaths.map(path =>
      path.goal === goal && path.level === level && path.duration === duration && path.perDay === perDay
      ? { ...path, plan: updatedSteps, progress: newProgress }
      : path
    );
    setSavedPaths(updated);
    
    // Close step detail view and show completion message
    setSelectedStep(null);
    
    if (newProgress >= 100) {
      setTimeout(() => {
        setView('finished');
      }, 1000);
    }
  };

  const deletePath = (index) => {
    if (window.confirm('Are you sure you want to delete this path?')) {
      setSavedPaths(savedPaths.filter((_, i) => i !== index));
    }
  };

  const loadPath = (path) => {
    setGoal(path.goal);
    setLevel(path.level);
    setDuration(path.duration);
    setPerDay(path.perDay);
    setPlanSteps(path.plan);
    setProgress(path.progress);
    setSelectedStep(null);
    setView('progress');
  };

  const BackButton = () => (
    <button
      onClick={() => {
        setSelectedStep(null);
        setView('home');
      }}
      className="fixed top-4 left-4 bg-green-500 text-white px-3 py-2 text-sm rounded-full shadow-lg z-50 hover:bg-green-600 transition-colors"
    >
      ← Back to Home
    </button>
  );

  const StepBackButton = () => (
    <button
      onClick={() => setSelectedStep(null)}
      className="mb-4 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
    >
      ← Back to Steps
    </button>
  );

  const renderPlant = () => {
    const stages = ['🌱', '🌿', '🌳', '🌸'];
    const stage = Math.min(Math.floor(progress / 25), 3);
    return (
      <div className="text-6xl">
        {stages[stage]}
      </div>
    );
  };

  const completedPaths = savedPaths.filter(p => p.progress >= 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-300 via-blue-400 to-purple-500 flex items-center justify-center p-4">
      {view === 'home' && (
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-green-700 mb-2">🌱 LearnBloom</h1>
            <p className="text-gray-600">AI-Powered Learning Path Builder</p>
            {(savedPaths.length > 0 || goal) && (
              <p className="text-xs text-green-600 mt-2">✅ Previous session restored</p>
            )}
          </div>
          
          <div className="space-y-4">
            <button 
              onClick={() => setView('input')} 
              className="w-full py-4 bg-green-600 text-white rounded-xl shadow-lg hover:bg-green-700 transition-colors font-semibold text-lg"
            >
              🌱 Start A New Learning Path
            </button>
            
            <button 
              onClick={() => setView('list')} 
              className="w-full py-4 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 transition-colors font-semibold text-lg"
            >
              🌿 Continue Existing Path
            </button>
            
            <button 
              onClick={() => setView('finished')} 
              className="w-full py-4 bg-purple-600 text-white rounded-xl shadow-lg hover:bg-purple-700 transition-colors font-semibold text-lg"
            >
              🌸 View Completed Paths
            </button>
          </div>
          
          <div className="mt-8 text-sm text-gray-500">
            <p>Create personalized learning journeys with AI</p>
            {(savedPaths.length > 0 || goal) && (
              <button 
                onClick={clearAllData}
                className="mt-2 text-xs text-red-500 hover:text-red-700 underline"
              >
                Clear all saved data
              </button>
            )}
          </div>
        </div>
      )}

      {view === 'input' && (
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative">
          <BackButton />
          <h2 className="text-2xl font-bold text-green-700 mb-6 text-center mt-8">Create Learning Path</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 mb-2 font-semibold">Learning Goal</label>
              <input 
                type="text" 
                value={goal} 
                onChange={e => setGoal(e.target.value)} 
                placeholder="e.g., Python Programming, Data Analysis, Web Development" 
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-green-500 focus:outline-none"
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-gray-700 mb-2 font-semibold text-sm">Level</label>
                <select 
                  value={level} 
                  onChange={e => setLevel(e.target.value)} 
                  className="w-full border-2 border-gray-300 rounded-lg px-3 py-3 focus:border-green-500 focus:outline-none"
                >
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
              </div>
              
              <div>
                <label className="block text-gray-700 mb-2 font-semibold text-sm">Weeks</label>
                <input 
                  type="number" 
                  value={duration} 
                  min={1} 
                  max={52}
                  onChange={e => setDuration(+e.target.value)} 
                  className="w-full border-2 border-gray-300 rounded-lg px-3 py-3 focus:border-green-500 focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-2 font-semibold text-sm">Hours Per Day</label>
                <input 
                  type="number" 
                  value={perDay} 
                  min={1} 
                  max={10}
                  onChange={e => setPerDay(+e.target.value)} 
                  className="w-full border-2 border-gray-300 rounded-lg px-3 py-3 focus:border-green-500 focus:outline-none"
                  placeholder="Hours"
                />
              </div>
            </div>
            
            <button 
              onClick={generatePlan} 
              disabled={loading || !goal.trim()} 
              className="w-full py-4 bg-green-600 text-white rounded-xl shadow-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold text-lg"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating Path...
                </span>
              ) : (
                '🚀 Generate My Learning Path'
              )}
            </button>
          </div>
        </div>
      )}

      {view === 'path' && !selectedStep && (
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl p-8 relative">
          <BackButton />
          <h2 className="text-2xl font-bold text-green-700 mb-6 text-center mt-8">
            {duration}-Week Path to {goal}
          </h2>
          
          <div className="max-h-96 overflow-y-auto">
            {/* Group steps by week */}
            {Array.from({ length: duration }, (_, weekIndex) => {
              const weekNumber = weekIndex + 1;
              const weekSteps = planSteps.filter(step => step.week === weekNumber);
              
              if (weekSteps.length === 0) return null;
              
              const weekTheme = weekSteps[0]?.weekTheme || `Week ${weekNumber}`;
              const completedInWeek = weekSteps.filter(step => step.completed).length;
              const weekProgress = Math.round((completedInWeek / weekSteps.length) * 100);
              const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
              
              return (
                <div key={weekNumber} className="mb-6">
                  {/* Week Header */}
                  <div className="bg-gradient-to-r from-green-100 to-blue-100 rounded-lg p-4 mb-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-bold text-green-800">
                          Week {weekNumber}: {weekTheme}
                        </h3>
                        <p className="text-sm text-gray-600">
                          7 days • {perDay} hours per day • {weekSteps.length} total sessions
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-700">{weekProgress}%</div>
                        <div className="text-xs text-gray-500">{completedInWeek}/{weekSteps.length} days</div>
                      </div>
                    </div>
                    
                    {/* Week Progress Bar */}
                    <div className="mt-3 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${weekProgress}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* Week Steps - 7 days */}
                  <div className="grid grid-cols-1 gap-2 ml-4">
                    {weekSteps.map(step => {
                      const dayName = dayNames[(step.dayOfWeek || ((step.step - 1) % 7)) - 1] || 'Day';
                      const isWeekend = step.dayOfWeek === 6 || step.dayOfWeek === 7;
                      
                      return (
                        <div key={step.step} className={`border rounded-lg p-3 transition-all cursor-pointer ${
                          step.completed 
                            ? 'bg-green-50 border-green-300' 
                            : isWeekend 
                              ? 'border-blue-200 bg-blue-50 hover:shadow-md hover:border-blue-300'
                              : 'border-gray-200 hover:shadow-md hover:border-green-300'
                        }`}>
                          <button 
                            onClick={() => setSelectedStep(step)} 
                            className="w-full text-left"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className={`font-semibold text-sm ${
                                  step.completed 
                                    ? 'text-green-600' 
                                    : isWeekend 
                                      ? 'text-blue-700' 
                                      : 'text-green-700'
                                }`}>
                                  {step.completed ? '✅ ' : isWeekend ? '📅 ' : '📚 '}
                                  {dayName}: {step.label}
                                </h4>
                                <p className="text-gray-600 text-xs mt-1">{step.description}</p>
                                <p className={`text-xs mt-1 ${isWeekend ? 'text-blue-600' : 'text-blue-600'}`}>
                                  ⏱️ {step.estimatedTime}
                                </p>
                              </div>
                              <div className="ml-3 text-gray-400 text-sm">
                                {step.completed ? '📖' : '👁️'}
                              </div>
                            </div>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {view === 'path' && selectedStep && (
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl p-8 relative max-h-screen overflow-y-auto">
          <BackButton />
          <div className="mt-8">
            <StepBackButton />
            
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-green-700 mb-2">
                {selectedStep.label}
              </h2>
              <div className="bg-green-100 rounded-lg p-3 mb-4">
                <p className="text-green-800 font-semibold text-sm">
                  📅 Week {selectedStep.week}: {selectedStep.weekTheme} • Day {((selectedStep.step - 1) % 7) + 1}
                </p>
                <p className="text-green-700 text-sm mt-1">
                  🎯 Weekly Goal: {selectedStep.weeklyGoal}
                </p>
              </div>
              <p className="text-lg text-gray-600">{selectedStep.description}</p>
              <p className="text-blue-600 font-semibold mt-2">⏱️ Time Commitment: {selectedStep.estimatedTime}</p>
            </div>

            <div className="space-y-6">
              {/* Detailed Instructions */}
              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-blue-800 mb-3">📋 What You'll Do</h3>
                <p className="text-gray-700 leading-relaxed">{selectedStep.details}</p>
              </div>

              {/* Tasks */}
              <div className="bg-green-50 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-green-800 mb-3">✅ Tasks to Complete</h3>
                <ul className="space-y-2">
                  {selectedStep.tasks?.map((task, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-green-600 mr-2">•</span>
                      <span className="text-gray-700">{task}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Resources */}
              <div className="bg-purple-50 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-purple-800 mb-3">📚 Recommended Resources</h3>
                <ul className="space-y-2">
                  {selectedStep.resources?.map((resource, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-purple-600 mr-2">•</span>
                      <span className="text-gray-700">{resource}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Completion Button */}
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                {selectedStep.completed ? (
                  <div>
                    <p className="text-green-600 mb-4 font-semibold">
                      ✅ This step has been completed! You can review the content anytime.
                    </p>
                    <button 
                      onClick={() => setSelectedStep(null)}
                      className="bg-blue-600 text-white px-8 py-4 rounded-xl shadow-lg hover:bg-blue-700 transition-colors font-semibold text-lg"
                    >
                      📖 Back to Learning Path
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-600 mb-4">
                      Once you've completed all the tasks above, mark this step as finished to continue your learning journey.
                    </p>
                    <button 
                      onClick={() => completeStep(selectedStep.step)}
                      className="bg-green-600 text-white px-8 py-4 rounded-xl shadow-lg hover:bg-green-700 transition-colors font-semibold text-lg"
                    >
                      🎉 Complete Day {((selectedStep.step - 1) % 7) + 1} ({selectedStep.estimatedTime})
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {view === 'list' && (
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative">
          <BackButton />
          <h2 className="text-2xl font-bold text-green-700 mb-6 text-center mt-8">Your Learning Paths</h2>
          
          {savedPaths.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p>No learning paths yet.</p>
              <button 
                onClick={() => setView('input')} 
                className="mt-4 text-green-600 hover:text-green-700 font-semibold"
              >
                Create your first path →
              </button>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {savedPaths.map((path, i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-green-700">{path.goal}</h3>
                      <p className="text-gray-600 text-sm">{path.level} • {path.duration} weeks • {path.perDay}/day</p>
                      <div className="mt-2 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${path.progress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{path.progress}% complete</p>
                    </div>
                    
                    <div className="flex space-x-2 ml-4">
                      <button 
                        onClick={() => loadPath(path)} 
                        className="text-blue-600 hover:text-blue-700 text-sm font-semibold"
                      >
                        Continue
                      </button>
                      <button 
                        onClick={() => deletePath(i)} 
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {view === 'progress' && (
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center relative">
          <BackButton />
          <h2 className="text-2xl font-bold text-green-700 mb-4 mt-8">Your Progress</h2>
          <p className="text-gray-600 mb-6">{goal}</p>
          
          <div className="mb-6">
            {renderPlant()}
          </div>
          
          <div className="mb-6">
            <div className="bg-gray-200 rounded-full h-4 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-green-400 to-green-600 h-4 rounded-full transition-all duration-500 flex items-center justify-center text-white text-xs font-bold" 
                style={{ width: `${progress}%` }}
              >
                {progress > 10 && `${progress}%`}
              </div>
            </div>
            {progress <= 10 && <p className="text-gray-600 mt-2">{progress}% Complete</p>}
          </div>
          
          <div className="space-y-2">
            <button 
              onClick={() => setView('path')} 
              className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
            >
              Continue Learning
            </button>
            <button 
              onClick={() => setView('list')} 
              className="w-full py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
            >
              View All Paths
            </button>
          </div>
        </div>
      )}

      {view === 'finished' && (
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center relative">
          <BackButton />
          <h2 className="text-2xl font-bold text-green-700 mb-6 mt-8">🎉 Completed Paths</h2>
          
          {completedPaths.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p>No completed paths yet.</p>
              <p className="text-sm mt-2">Keep learning to see your achievements here!</p>
              <button 
                onClick={() => setView('input')} 
                className="mt-4 text-green-600 hover:text-green-700 font-semibold"
              >
                Start a new path →
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {completedPaths.map((path, i) => (
                <div key={i} className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-green-700">🌸 {path.goal}</h3>
                      <p className="text-green-600 text-sm">{path.level} • Completed!</p>
                    </div>
                    <div className="text-2xl">🏆</div>
                  </div>
                </div>
              ))}
              
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-gray-600 text-sm">
                  Congratulations on completing {completedPaths.length} learning path{completedPaths.length !== 1 ? 's' : ''}!
                </p>
                <button 
                  onClick={() => setView('input')} 
                  className="mt-4 w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                >
                  Start Another Path
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;