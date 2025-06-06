# 🌱 LearnBloom AI Learning Path Builder

An intelligent, AI-powered learning path generator that creates personalized, week-by-week study plans using OpenAI's GPT technology. Built with React and Node.js for a seamless learning experience.

![LearnBloom Banner](https://img.shields.io/badge/LearnBloom-AI%20Learning%20Path%20Builder-green?style=for-the-badge&logo=react)

## 🚀 Features

### 🧠 **AI-Powered Learning Paths**
- **Personalized Content**: Custom learning plans generated by OpenAI GPT-3.5-turbo
- **Week-by-Week Structure**: Organized 7-day weekly learning cycles
- **Adaptive Difficulty**: Tailored for Beginner, Intermediate, and Advanced levels
- **Time-Based Planning**: Customizable daily hour commitments (1-10 hours/day)

### 📅 **Structured Learning Experience**
- **7 Days Per Week**: Complete daily learning schedules with weekend activities
- **Progressive Themes**: Foundation → Core Concepts → Application → Advanced Techniques
- **Detailed Daily Tasks**: 3-5 specific, actionable tasks per day
- **Resource Recommendations**: Curated learning materials for each step
- **Time Estimates**: Realistic completion times based on your availability

### 📊 **Progress Tracking & Persistence**
- **Visual Progress**: Plant growth metaphor (🌱→🌿→🌳→🌸)
- **Week-by-Week Tracking**: Individual progress bars for each week
- **Data Persistence**: All progress saved locally (survives page refreshes)
- **Review Capability**: Access completed steps anytime for reference
- **Multiple Paths**: Manage several learning journeys simultaneously

### 🎯 **User Experience**
- **Mobile-Responsive**: Beautiful design that works on all devices
- **Intuitive Navigation**: Easy-to-use interface with clear visual indicators
- **Weekend Differentiation**: Lighter content for Saturday/Sunday
- **Achievement System**: Celebrate completed learning paths
- **No Account Required**: Start learning immediately

## 🛠️ Tech Stack

### **Frontend**
- **React 18** - Modern UI framework
- **Custom CSS** - Tailored styling with utility classes
- **LocalStorage API** - Client-side data persistence
- **Responsive Design** - Mobile-first approach

### **Backend**
- **Node.js** - Runtime environment
- **Express.js** - Web application framework
- **OpenAI API** - AI-powered content generation
- **CORS** - Cross-origin resource sharing
- **Environment Variables** - Secure configuration

### **Deployment Ready**
- **Vercel Compatible** - Easy cloud deployment
- **Environment Configuration** - Production/development modes
- **Error Handling** - Comprehensive error management

## 📁 Project Structure

```
learnbloom-ai/
├── client/                 # React frontend application
│   ├── src/
│   │   ├── App.js         # Main React component with all features
│   │   ├── App.css        # Custom styling with utility classes
│   │   ├── index.js       # React entry point
│   │   └── index.css      # Global styles
│   ├── public/            # Static assets and HTML template
│   └── package.json       # Frontend dependencies
├── server/                # Node.js backend application
│   ├── server.js          # Express server with OpenAI integration
│   └── package.json       # Backend dependencies
├── .env                   # Environment variables (not in git)
├── .env.example          # Environment template
├── .gitignore            # Git ignore rules
├── vercel.json           # Vercel deployment configuration (optional)
└── README.md             # Project documentation
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v14 or higher) - [Download here](https://nodejs.org/)
- **npm** or **yarn** - Package manager (comes with Node.js)
- **OpenAI API Key** - [Get one here](https://platform.openai.com/account/api-keys)
- **Modern web browser** - Chrome, Firefox, Safari, or Edge

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/learnbloom-ai.git
   cd learnbloom-ai
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your OpenAI API key:
   ```env
   OPENAI_API_KEY=sk-your-actual-openai-api-key-here
   PORT=5000
   NODE_ENV=development
   CLIENT_URL=http://localhost:3000
   ```

3. **Install backend dependencies:**
   ```bash
   cd server
   npm install
   ```

3. **Install frontend dependencies:**
   ```bash
   cd ../client
   npm install
   ```

   **Note**: The project uses custom CSS for styling, so no additional CSS framework installation is required.

### Running Locally

1. **Start the backend server:**
   ```bash
   cd server
   npm run dev
   ```
   Server will run on `http://localhost:5000`

2. **Start the frontend (in a new terminal):**
   ```bash
   cd client
   npm start
   ```
   Frontend will run on `http://localhost:3000`

3. **Verify everything works:**
   - Visit `http://localhost:3000` for the main app
   - Visit `http://localhost:5000/health` for server health check
   - Visit `http://localhost:5000/api/test-openai` to test OpenAI connection

## 🌐 Deployment

### Deploy to Vercel (Recommended)

1. **Push your code to GitHub**

2. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Set framework preset to "Create React App"
   - Set root directory to `client` for frontend deployment

3. **Configure environment variables in Vercel:**
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `NODE_ENV`: `production`

4. **Deploy:**
   - Vercel will automatically build and deploy
   - Your app will be available at `https://your-app-name.vercel.app`

### Alternative Deployment Options

- **Netlify**: Frontend only (requires separate backend deployment)
- **Railway**: Full-stack deployment
- **Heroku**: Traditional platform-as-a-service
- **DigitalOcean**: VPS deployment

## 📖 Usage Guide

### Creating a Learning Path

1. **Click "Start A New Learning Path"**
2. **Fill out the form:**
   - **Learning Goal**: e.g., "Python Programming", "Data Science", "React Development"
   - **Experience Level**: Beginner, Intermediate, or Advanced
   - **Duration**: Number of weeks (1-52)
   - **Hours Per Day**: Daily study commitment (1-10 hours)

3. **Generate Path**: AI creates a structured learning plan
4. **Follow Daily Steps**: Complete tasks day by day
5. **Track Progress**: Watch your plant grow as you learn!

### Managing Learning Paths

- **Continue Existing Paths**: Resume any saved learning journey
- **Review Completed Steps**: Access past content anytime
- **Multiple Paths**: Work on several topics simultaneously
- **Delete Paths**: Remove unwanted learning plans
- **Progress Tracking**: Visual indicators for week and overall progress

### Week Structure Example

**Week 1: Foundation & Setup**
- **Monday**: Environment setup and introduction
- **Tuesday**: Basic concepts and terminology
- **Wednesday**: First hands-on exercises
- **Thursday**: Core principles deep dive
- **Friday**: Practice and reinforcement
- **Saturday**: Review and light practice
- **Sunday**: Planning for Week 2

## 🔧 API Endpoints

### Backend Routes

- `GET /` - Server information
- `GET /health` - Health check
- `GET /api/test` - API connectivity test
- `GET /api/test-openai` - OpenAI connection test
- `POST /api/generate-path` - Generate new learning path

### Request/Response Examples

**Generate Learning Path:**
```javascript
// Request
POST /api/generate-path
{
  "goal": "JavaScript Programming",
  "level": "Beginner",
  "duration": 2,
  "perDay": 2
}

// Response
{
  "plan": [
    {
      "step": 1,
      "week": 1,
      "dayOfWeek": 1,
      "weekTheme": "Foundation & Setup",
      "label": "Day 1: JavaScript Introduction",
      "description": "Learn what JavaScript is and set up your development environment",
      "details": "...",
      "tasks": ["Install Node.js", "Set up VS Code", "Write first script"],
      "resources": ["MDN JavaScript Guide", "VS Code Setup Tutorial"],
      "estimatedTime": "2 hours",
      "weeklyGoal": "Complete environment setup and understand basics",
      "completed": false
    }
    // ... 13 more days (2 weeks × 7 days)
  ],
  "metadata": {
    "goal": "JavaScript Programming",
    "level": "Beginner",
    "duration": 2,
    "perDay": 2,
    "totalSteps": 14,
    "generatedAt": "2025-06-07T...",
    "generatedBy": "OpenAI"
  }
}
```

## 🛡️ Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `OPENAI_API_KEY` | Your OpenAI API key (required) | `sk-proj-...` |
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment mode | `development` |
| `CLIENT_URL` | Frontend URL for CORS | `http://localhost:3000` |

## 🚨 Troubleshooting

### Common Issues

**1. "Failed to generate plan" Error**
- Check server console for detailed error messages
- Verify OpenAI API key is valid: `http://localhost:5000/api/test-openai`
- Ensure you have OpenAI credits/billing set up

**2. CORS Errors**
- Make sure backend is running on port 5000
- Check `CLIENT_URL` environment variable
- Verify both servers are running

**3. Page Refresh Loses Data**
- Data should persist automatically via localStorage
- Check browser console for localStorage errors
- Use "Clear all data" button to reset if needed

**4. OpenAI API Errors**
- **Quota Exceeded**: Add billing to your OpenAI account
- **Invalid Key**: Generate new API key at platform.openai.com
- **Rate Limited**: Wait a few moments and try again

### Debug Commands

```bash
# Check if backend is responding
curl http://localhost:5000/health

# Test OpenAI connection
curl http://localhost:5000/api/test-openai

# View detailed server logs
npm run dev  # in server directory

# Clear browser data
# Open browser dev tools → Application → Local Storage → Delete learnbloom-* items
```

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** and test thoroughly
4. **Commit changes**: `git commit -m 'Add amazing feature'`
5. **Push to branch**: `git push origin feature/amazing-feature`
6. **Open a Pull Request**

### Development Guidelines

- **Code Style**: Use consistent formatting
- **Testing**: Test both frontend and backend changes
- **Documentation**: Update README for new features
- **Environment**: Test in both development and production modes

## 📊 Features Roadmap

### Current Version (v1.0)
- ✅ AI-powered learning path generation
- ✅ Week-by-week structure with 7 days per week
- ✅ Progress tracking and data persistence
- ✅ Multiple learning paths support
- ✅ Mobile-responsive design

### Planned Features (v2.0)
- 🔄 User accounts and cloud sync
- 🔄 Learning analytics and insights
- 🔄 Community features and path sharing
- 🔄 Integration with external learning platforms
- 🔄 Offline mode support
- 🔄 Push notifications for study reminders

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenAI** for providing the GPT API that powers our learning path generation
- **React Team** for the incredible frontend framework
- **CSS Community** for styling best practices and inspiration
- **Vercel** for simple and powerful deployment platform
- **Open Source Community** for inspiration and best practices

## 📞 Support

If you encounter any issues or have questions:

1. **Check the troubleshooting section** above
2. **Search existing issues** on GitHub
3. **Create a new issue** with detailed information:
   - Steps to reproduce the problem
   - Error messages (frontend and backend)
   - Your environment (OS, Node version, browser)
   - Expected vs actual behavior

## 🎯 About LearnBloom

LearnBloom was created to democratize personalized education by combining the power of AI with structured learning principles. Our goal is to help anyone learn anything effectively, regardless of their background or experience level.

**Learn. Grow. Bloom.** 🌱

---

**Made with ❤️ and AI**

*Last updated: June 2025*