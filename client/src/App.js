import React, { useState } from 'react';
import './App.css';

function App() {
  const [view, setView] = useState('home');
  const [goal, setGoal] = useState('');
  const [level, setLevel] = useState('Beginner');
  const [duration, setDuration] = useState(4);
  const [perDay, setPerDay] = useState(1);
  const [planSteps, setPlanSteps] = useState([]);
  const [progress, setProgress] = useState(0);
  const [savedPaths, setSavedPaths] = useState([]);
  const [loading, setLoading] = useState(false);

  // Generate learning path by calling backend
  const generatePlan = async () => {
    if (!goal.trim()) {
      alert('Please enter a learning goal');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/generate-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal, level, duration, perDay })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! Status: ${response.status}`);
      }
      
      if (!data.plan || !Array.isArray(data.plan)) {
        throw new Error('Invalid response format');
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
      setView('path');
    } catch (err) {
      console.error('Error generating plan:', err);
      alert(`Failed to generate plan: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const completeStep = (step) => {
    const newProgress = Math.round((step / planSteps.length) * 100);
    setProgress(newProgress);
    
    // Update saved paths
    const updated = savedPaths.map(path =>
      path.goal === goal && path.level === level && path.duration === duration && path.perDay === perDay
      ? { ...path, progress: newProgress }
      : path
    );
    setSavedPaths(updated);
    
    if (newProgress >= 100) {
      setView('finished');
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
    setView('progress');
  };

  const BackButton = () => (
    <button
      onClick={() => setView('home')}
      className="fixed top-4 left-4 bg-green-500 text-white px-3 py-2 text-sm rounded-full shadow-lg z-50 hover:bg-green-600 transition-colors"
    >
      ← Back to Home
    </button>
  );

  const renderPlant = () => {
    // Simple plant representation based on progress
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
                <label className="block text-gray-700 mb-2 font-semibold text-sm">Per Day</label>
                <input 
                  type="number" 
                  value={perDay} 
                  min={1} 
                  max={10}
                  onChange={e => setPerDay(+e.target.value)} 
                  className="w-full border-2 border-gray-300 rounded-lg px-3 py-3 focus:border-green-500 focus:outline-none"
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

      {view === 'path' && (
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative">
          <BackButton />
          <h2 className="text-2xl font-bold text-green-700 mb-6 text-center mt-8">Path to {goal}</h2>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {planSteps.map(step => (
              <div key={step.step} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <button 
                  onClick={() => completeStep(step.step)} 
                  className="w-full text-left"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-green-700">Step {step.step}: {step.label}</h3>
                      <p className="text-gray-600 text-sm mt-1">{step.description}</p>
                      <p className="text-blue-600 text-xs mt-2">⏱️ {step.estimatedTime}</p>
                    </div>
                    <div className="ml-4 text-green-600">✓</div>
                  </div>
                </button>
              </div>
            ))}
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