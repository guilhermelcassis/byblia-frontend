# Byblia Frontend - Development Guidelines

## Project Overview
Byblia Frontend is a Next.js application built with TypeScript and styled with Tailwind CSS. This document outlines the coding standards, project structure, and development practices to ensure consistency and maintainability.

## Project Structure
```
byblia-frontend/
├── .next/              # Next.js build output
├── public/             # Static assets
├── src/                # Source code
│   ├── app/            # Next.js App Router
│   ├── components/     # Reusable UI components
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Project utilities and configurations
│   ├── services/       # API services
│   ├── types/          # TypeScript type definitions
│   ├── utils/          # Utility functions
│   └── middleware.ts   # Next.js middleware
├── .gitignore          # Git ignore file
├── eslint.config.mjs   # ESLint configuration
├── next.config.js      # Next.js configuration
├── package.json        # Node dependencies
├── postcss.config.js   # PostCSS configuration
├── tailwind.config.js  # Tailwind CSS configuration
└── tsconfig.json       # TypeScript configuration
```

## Coding Standards

### TypeScript
- **NEVER use `any` type**. Always define proper interfaces and types.
- Use TypeScript's type system to its full extent for better code quality and developer experience.
- Define reusable types in the `src/types` directory.
- Use type inference where appropriate to reduce redundancy.

### React & Next.js
- Utilize the App Router for routing and page structure.
- Prefer functional components and hooks over class components.
- Use server components where appropriate for better performance.
- Follow the React pattern of "lifting state up" when sharing state between components.

### Component Structure
- Implement separation of concerns in all components.
- Each component should have a single responsibility.
- Structure complex components using the atomic design pattern (atoms, molecules, organisms).
- Keep components small and focused, delegating complex logic to custom hooks.

### Styling
- Use Tailwind CSS for styling components.
- Utilize the `class-variance-authority` and `tailwind-merge` for component variants.
- Follow the shadcn-ui component pattern when creating new reusable components.

### State Management
- Use React's built-in state management (useState, useContext) for simple state.
- For complex states, consider using a more robust solution that fits the project's needs.
- Keep state as close as possible to where it's used.

### API Integration
- Define API services in the `src/services` directory.
- Use Axios for API requests.
- Implement proper error handling and loading states.

### Error Handling
- Implement proper error boundaries.
- Log errors in development and provide user-friendly error messages in production.
- Handle API errors gracefully with appropriate UI feedback.

### Accessibility
- Ensure all components are accessible (A11Y).
- Use proper ARIA attributes when necessary.
- Ensure keyboard navigation works throughout the application.

### Performance
- Optimize component rendering using React.memo, useMemo, and useCallback where appropriate.
- Implement lazy loading for routes and large components.
- Use Next.js Image component for optimized image loading.

### Security
- Implement proper sanitization for user-generated content using sanitize-html.
- Follow OWASP security practices.
- Never store sensitive information in client-side storage.

## Development Workflow

### Git Workflow
- Follow the GitHub flow (feature branches, pull requests, code reviews).
- Write meaningful commit messages following conventional commits pattern.
- Keep pull requests focused and concise.

### Code Review Process
- All code changes must be reviewed by at least one other developer.
- Address all review comments before merging.
- Ensure all automated checks pass before requesting review.

### Testing
- Write tests for critical functionality.
- Aim for good test coverage for utilities and services.
- Test components for correct rendering and behavior.

### Documentation
- Document complex logic and business rules.
- Keep this document updated as the project evolves.
- Document APIs and component props.

## Maintainer
- Github: [https://github.com/guilhermelcassis/](https://github.com/guilhermelcassis/)
- Contact: contato@guilhermelcassis.com 