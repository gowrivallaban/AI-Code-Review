# GitHub PR Review UI

A modern web application for automated GitHub pull request code reviews using AI/LLM analysis with customizable templates and intelligent comment management.

## ✨ Features

- 🔐 **Secure GitHub Integration** - Personal Access Token authentication with proper scope management
- 📋 **Repository & PR Management** - Browse repositories and pull requests with intuitive filtering
- 🤖 **AI-Powered Code Reviews** - Configurable LLM analysis using customizable review templates
- ✏️ **Smart Comment Curation** - Edit, accept, or reject individual review comments with inline editing
- 📤 **Flexible Export Options** - Export reviews as markdown or submit directly to GitHub
- 🎨 **Responsive Design** - Works seamlessly on desktop, tablet, and mobile devices
- ⚡ **High Performance** - Code splitting, lazy loading, and virtual scrolling for optimal speed
- 🛠️ **Extensible Architecture** - Well-documented codebase designed for easy customization

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** and npm
- **GitHub Account** with repository access
- **GitHub Personal Access Token** with `repo` scope ([Setup Guide](docs/github-setup.md))
- **(Optional)** OpenAI API key for LLM-powered reviews

### Installation

1. **Clone the repository:**
```bash
git clone <repository-url>
cd github-pr-review-ui
```

2. **Install dependencies:**
```bash
npm install
```

3. **Start the development server:**
```bash
npm run dev
```

4. **Open your browser** to `http://localhost:5173`

### First-Time Setup

1. **GitHub Authentication** 
   - Create a Personal Access Token at [GitHub Settings](https://github.com/settings/tokens)
   - Ensure it has `repo` scope for full functionality
   - See our [detailed setup guide](docs/github-setup.md) for step-by-step instructions

2. **Connect to GitHub**
   - Paste your token in the authentication form
   - The app will verify your credentials and display your username

3. **Select Repository**
   - Choose from your accessible repositories
   - Both public and private repositories are supported

4. **Start Reviewing**
   - Select a pull request from the list
   - Click "Run Code Review" to begin AI analysis
   - Review, edit, and curate the generated comments

## 📚 Documentation

### User Guides
- **[GitHub Setup Guide](docs/github-setup.md)** - Complete token setup and troubleshooting
- **[Template Customization](docs/template-customization.md)** - Create and modify review templates

### Developer Resources
- **[Developer Guide](docs/developer-guide.md)** - Architecture, patterns, and extension guide

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev              # Start development server with hot reload
npm run build            # Build optimized production bundle
npm run preview          # Preview production build locally

# Testing
npm run test             # Run unit tests with Vitest
npm run test:watch       # Run tests in watch mode
npm run test:e2e         # Run end-to-end tests with Playwright
npm run test:coverage    # Generate test coverage report

# Code Quality
npm run lint             # Run ESLint for code quality
npm run lint:fix         # Auto-fix linting issues
npm run type-check       # Run TypeScript type checking
npm run format           # Format code with Prettier
```

### Project Architecture

```
src/
├── components/          # React components with tests
│   ├── __tests__/      # Component unit tests
│   ├── App.tsx         # Main application component
│   ├── GitHubAuth.tsx  # Authentication interface
│   ├── TemplateEditor.tsx # Template customization
│   └── ...             # Other UI components
├── context/            # Global state management
│   ├── AppContext.tsx  # React Context provider
│   ├── appReducer.ts   # State reducer logic
│   └── actions.ts      # Action creators
├── hooks/              # Custom React hooks
│   └── useAppState.ts  # State management hooks
├── services/           # Business logic and API integration
│   ├── github.ts       # GitHub API service
│   ├── llm.ts          # LLM integration service
│   ├── template.ts     # Template management
│   └── ...             # Other services
├── types/              # TypeScript type definitions
│   └── index.ts        # Centralized type exports
├── utils/              # Utility functions and helpers
└── main.tsx           # Application entry point
```

### Technology Stack

- **Frontend Framework**: React 18 with TypeScript for type safety
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: Tailwind CSS for utility-first responsive design
- **State Management**: React Context + useReducer for predictable state
- **HTTP Client**: Native Fetch API with custom service layer
- **Code Highlighting**: Prism.js for syntax highlighting in diffs
- **Testing**: Vitest + React Testing Library + Playwright E2E
- **Code Quality**: ESLint + Prettier + TypeScript strict mode

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# GitHub API Configuration
VITE_GITHUB_API_URL=https://api.github.com

# LLM Service Configuration (optional)
VITE_LLM_API_URL=your-llm-api-endpoint
VITE_LLM_MODEL=gpt-4
VITE_LLM_MAX_TOKENS=2000

# Application Configuration
VITE_APP_VERSION=1.0.0
VITE_APP_NAME="GitHub PR Review UI"
```

### Template Customization

The application includes a powerful template system for customizing code reviews:

- **Default Template**: Comprehensive template covering security, performance, and maintainability
- **Custom Templates**: Create templates tailored to your team's coding standards
- **Template Editor**: Visual editor with markdown support and live preview
- **Template Validation**: Automatic validation ensures templates are properly formatted

See the [Template Customization Guide](docs/template-customization.md) for detailed instructions.

## 🧪 Testing

### Running Tests

```bash
# Unit Tests
npm run test                    # Run all unit tests
npm run test:watch             # Watch mode for development
npm run test -- --coverage    # Generate coverage report

# End-to-End Tests
npm run test:e2e               # Run full E2E suite
npm run test:e2e:headed        # Run E2E tests with browser UI
npm run test:e2e:debug         # Debug E2E tests

# Specific Test Files
npm run test -- GitHubAuth     # Run specific component tests
npm run test -- services/      # Run all service tests
```

## 🚀 Deployment

### Production Build

```bash
# Create optimized production build
npm run build

# Preview production build locally
npm run preview

# Deploy to static hosting (Netlify, Vercel, etc.)
# Upload the `dist/` folder contents
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository** and create a feature branch
2. **Make your changes** following our coding standards
3. **Add tests** for new functionality
4. **Run the test suite** to ensure everything works
5. **Submit a pull request** with a clear description

### Development Workflow

```bash
# Setup development environment
git clone <your-fork>
cd github-pr-review-ui
npm install

# Create feature branch
git checkout -b feature/amazing-feature

# Make changes and test
npm run test
npm run lint
npm run type-check

# Commit and push
git commit -m "Add amazing feature"
git push origin feature/amazing-feature
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support & Community

### Getting Help

- **📖 Documentation**: Check the `docs/` folder for comprehensive guides
- **🐛 Issues**: Report bugs or request features on [GitHub Issues](../../issues)
- **💬 Discussions**: Join conversations on [GitHub Discussions](../../discussions)

### Troubleshooting

Common issues and solutions:

- **Authentication Problems**: See [GitHub Setup Guide](docs/github-setup.md)
- **Template Issues**: Check [Template Customization](docs/template-customization.md)
- **Performance**: Review [Developer Guide](docs/developer-guide.md) optimization section
- **Build Errors**: Ensure Node.js 18+ and clean `node_modules` installation

## 🗺️ Roadmap

### Current Version (v1.0)
- ✅ Core GitHub integration
- ✅ AI-powered code reviews
- ✅ Template customization
- ✅ Comment management
- ✅ Responsive design

### Upcoming Features (v1.1)
- [ ] **GitHub Apps Integration** - Enhanced security and permissions
- [ ] **Multiple LLM Providers** - Support for Anthropic, Cohere, and others
- [ ] **Team Collaboration** - Shared templates and review workflows
- [ ] **Advanced Analytics** - Review quality metrics and insights

### Future Enhancements (v2.0)
- [ ] **Real-time Collaboration** - Live review sessions with team members
- [ ] **CI/CD Integration** - Automated reviews in GitHub Actions
- [ ] **Custom Plugins** - Extensible architecture for custom analyzers
- [ ] **Enterprise Features** - SSO, audit logs, and compliance tools

## 🙏 Acknowledgments

- **React Team** for the excellent framework and developer experience
- **GitHub** for providing comprehensive APIs and developer tools
- **OpenAI** for advancing AI capabilities in code analysis
- **Tailwind CSS** for making responsive design enjoyable
- **Vite** for blazing-fast build tooling
- **Contributors** who help make this project better

---

**Ready to revolutionize your code review process?** [Get started now](docs/github-setup.md) and experience AI-powered code reviews with full customization control!