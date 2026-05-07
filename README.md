# WireFlow

A modern web application for creating and managing electrical wire diagrams using React and React Flow.

## Overview

WireFlow is an interactive tool designed for electrical engineers and technicians to create, edit, and visualize electrical wire diagrams. Built with React and Vite, it provides a smooth and responsive user experience for designing complex electrical systems.

## Features

- **Interactive Diagram Editor**: Drag-and-drop interface for creating wire diagrams
- **Component Library**: Pre-built electrical components and symbols
- **Responsive Design**: Works on desktop and tablet devices

## Tech Stack

- **Frontend Framework**: React 18
- **Build Tool**: Vite
- **Flow Library**: React Flow
- **Styling**: CSS Modules / Tailwind CSS
- **State Management**: React Context API
- **Development**: ESLint for code quality

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v16.0.0 or higher)
- npm (v7.0.0 or higher) or yarn (v1.22.0 or higher)

## Installation

1. Clone the repository:
    ```bash
    git clone https://github.com/yourusername/wiredoc-react-flow.git
    cd wiredoc-react-flow
    ```

2. Install dependencies:
    ```bash
    npm install
    # or
    yarn install
    ```

3. Start the development server:
    ```bash
    npm run dev
    # or
    yarn dev
    ```

4. Open your browser and navigate to `http://localhost:5173`

## Project Structure

    ```
    wire-flow/
    ├── public/              # Static assets
    ├── src/                 # Source code
    │   ├── assets/         # Images, icons, and other assets
    │   ├── components/     # React components
    │   ├── hooks/          # Custom React hooks
    │   ├── pages/          # Page components
    │   ├── services/       # API services
    │   ├── styles/         # Global styles
    │   ├── utils/          # Utility functions
    │   ├── App.jsx         # Main App component
    │   └── main.jsx        # Application entry point
    ├── .eslintrc.cjs       # ESLint configuration
    ├── .gitignore          # Git ignore file
    ├── index.html          # HTML template
    ├── package.json        # Project dependencies
    ├── README.md           # Project documentation
    └── vite.config.js      # Vite configuration
    ```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run test` - Run tests (if configured)


### Environment Variables

Create a `.env` file in the root directory:

    ```env
    VITE_API_URL=http://localhost:3000
    VITE_APP_TITLE=WireDoc React Flow
    ```

### ESLint Configuration

The project uses ESLint for code quality. To extend the configuration for production use with TypeScript:

1. Install TypeScript dependencies:
    ```bash
    npm install -D typescript @typescript-eslint/parser @typescript-eslint/eslint-plugin
    ```

2. Update `.eslintrc.cjs` with TypeScript rules


## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with [React](https://reactjs.org/)
- Powered by [Vite](https://vitejs.dev/)
- Flow diagrams by [React Flow](https://reactflow.dev/)
