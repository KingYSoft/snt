# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Soybean Admin is a modern admin template built with Vue 3, Vite 7, TypeScript, NaiveUI, and UnoCSS. It uses a pnpm monorepo architecture with shared packages for common functionality.

## Development Commands

### Core Development

- `pnpm dev` - Start development server in test mode (port 9527)
- `pnpm dev:prod` - Start development server in production mode (port 9527)
- `pnpm build` - Build for production
- `pnpm build:test` - Build for testing
- `pnpm preview` - Preview production build (port 9725)

### Code Quality

- `pnpm lint` - Run Oxlint and ESLint with auto-fix
- `pnpm fmt` - Format code with OXfmt
- `pnpm typecheck` - Run TypeScript type checking

### Development Tools

- `pnpm commit` - Generate conventional commits (in Chinese by default, use `pnpm commit:zh` for Chinese)
- `pnpm gen-route` - Auto-generate routes from file structure using Elegant Router
- `pnpm cleanup` - Clean up project files
- `pnpm release` - Release new version

## Architecture

### Monorepo Structure

The project uses pnpm workspace with shared packages:

- `packages/alo/` - Request library (Alova)
- `packages/axios/` - HTTP client wrapper
- `packages/color/` - Color utilities
- `packages/hooks/` - Custom Vue hooks
- `packages/materials/` - Reusable components
- `packages/scripts/` - Build and development scripts
- `packages/uno-preset/` - UnoCSS custom preset
- `packages/utils/` - Utility functions

### Key Directories

- `src/` - Main application source
  - `components/` - Global components
  - `layouts/` - Layout components
  - `views/` - Page components
  - `router/` - Route configuration with auto-generation
  - `store/` - Pinia stores
  - `service/` - API service layer
  - `styles/` - Global styles
  - `locales/` - Internationalization files
- `build/` - Build configuration and plugins
- `public/` - Static assets

## Technical Details

### Build Configuration

- Vite 8 with modern ES modules
- Path aliases: `@` for `src`, `~` for root
- Development proxy configured for API requests
- Auto-generates routes using `@elegant-router/vue`
- Supports both test and production build modes

### Code Quality Tools

- **Oxlint**: Primary linter with auto-fix
- **ESLint**: Vue-specific rules
- **OXfmt**: Code formatter
- **Simple Git Hooks**: Pre-commit hooks for type checking, linting, and formatting

### TypeScript

- Strict mode enabled
- Vue 3.5 with Composition API support
- Custom type definitions for Vite, Node, Unplugin-icons, and NaiveUI

### Styling

- UnoCSS with custom wind preset
- Global SCSS variables in `src/styles/scss/global.scss`
- Dark mode support built-in
- Custom icon size definitions

## Development Notes

1. **Use pnpm only** - This project uses pnpm workspace, never use npm or yarn
2. **Environment requirements** - Node.js >= 20.19.0, pnpm >= 10.5.0
3. **Route generation** - Routes are auto-generated from file structure in `src/views/`
4. **Commit messages** - Always use `pnpm commit` for conventional commits
5. **Pre-commit hooks** - Run type checking, linting, and formatting automatically
6. **Build modes** - Test mode for development, production mode for production builds

## Important Patterns

### API Service Layer

- Custom axios wrapper in `packages/axios/`
- API services organized by feature in `src/service/`
- Request/response interceptors for common functionality

### State Management

- Pinia stores in `src/store/`
- Modular store structure with feature-specific modules

### Component Structure

- Layout components in `src/layouts/`
- Reusable components in `packages/materials/`
- Page-specific components in `src/views/`

### Internationalization

- Vue I18n setup in `src/locales/`
- Support for multiple languages with i18n files
