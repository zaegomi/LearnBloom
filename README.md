# 🌱 LearnBloom AI Learning Path Builder

An AI-powered learning path builder that creates personalized study plans using OpenAI's GPT technology. Built with React and Node.js.

## 🚀 Features

- **AI-Generated Learning Paths**: Creates structured, progressive learning plans
- **Progress Tracking**: Visual progress tracking with plant growth metaphor
- **Multiple Skill Levels**: Supports Beginner, Intermediate, and Advanced levels
- **Flexible Duration**: Customizable learning duration and daily commitment
- **Path Management**: Save, continue, and manage multiple learning paths
- **Responsive Design**: Beautiful, mobile-friendly interface

## 🛠️ Tech Stack

**Frontend:**
- React 18
- Tailwind CSS
- JavaScript ES6+

**Backend:**
- Node.js
- Express.js
- OpenAI API
- CORS middleware

## 📁 Project Structure

```
learnbloom-ai/
├── client/                 # React frontend
│   ├── src/
│   │   ├── App.js         # Main React component
│   │   ├── index.js       # React entry point
│   │   └── index.css      # Tailwind CSS imports
│   ├── public/            # Static assets
│   └── package.json       # Frontend dependencies
├── server/                # Node.js backend
│   ├── server.js          # Express server
│   └── package.json       # Backend dependencies
├── .env                   # Environment variables (not in git)
├── .gitignore            # Git ignore rules
└── README.md             # Project documentation
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- OpenAI API key

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/learnbloom-ai.git
   cd learnbloom-ai
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env and add your OpenAI API key
   ```

3. **Install backend dependencies:**
   ```bash
   cd server
   npm install
   ```

4. **Install frontend dependencies:**
   ```bash
   cd ../client
   npm install
   ```

### Running the Application

1. **Start the backend server:**
   ```bash
   cd server
   npm run dev
   ```
   Server will run on http://localhost:5000

2. **Start the frontend (in a new terminal):**
   ```bash
   cd client
   npm start
   ```
   Frontend will run on http://localhost:3000

### Environment Variables

Create a `.env` file in the project root:

```env
OPENAI_API_KEY=your_openai_api_key_here
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

## 📖 Usage

1. **Create a Learning Path:**
   - Click "Start A New Learning Path"
   - Enter your learning goal (e.g., "Python Programming")
   - Select your skill level
   - Choose duration and daily commitment
   - Click "Generate My Learning Path"

2. **Follow Your Path:**
   - View your AI-generated learning steps
   - Click each step to mark as complete
   - Watch your progress plant grow!

3. **Manage Paths:**
   - Save multiple learning paths
   - Continue existing paths
   - View completed achievements

## 🔧 API Endpoints

- `GET /health` - Server health check
- `GET /api/test` - API connectivity test
- `GET /api/test-openai` - OpenAI connection test
- `POST /api/generate-path` - Generate new learning path

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenAI for providing the GPT API
- React team for the amazing framework
- Tailwind CSS for the utility-first CSS framework

## 📞 Support

If you have any questions or run into issues, please open an issue on GitHub.

---

Made with ❤️ and AI