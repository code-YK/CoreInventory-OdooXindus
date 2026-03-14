# Setup Guide

Step-by-step instructions for setting up and running Warehouse Flow locally.

## Prerequisites

| Requirement | Version |
|-------------|---------|
| [Node.js](https://nodejs.org/) | v18.0.0 or higher |
| npm | v9.0.0 or higher (ships with Node.js) |

> **Tip:** Use [nvm](https://github.com/nvm-sh/nvm) (macOS/Linux) or [nvm-windows](https://github.com/coreybutler/nvm-windows) to manage Node.js versions.

## Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/warehouse-flow.git
   cd warehouse-flow
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

## Environment Variables

Create a `.env` file in the project root if your deployment requires environment-specific configuration:

```env
# Example (none required for local development)
VITE_API_URL=http://localhost:3000/api
```

> Variables prefixed with `VITE_` are exposed to client-side code. See the [Vite documentation](https://vitejs.dev/guide/env-and-mode.html) for details.

## Running the Development Server

```bash
npm run dev
```

The app launches at **http://localhost:8080** with hot module replacement (HMR) enabled.

## Build Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with HMR |
| `npm run build` | Production build → `dist/` |
| `npm run build:dev` | Development build (unminified) |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint checks |
| `npm run test` | Run unit tests |
| `npm run test:watch` | Run tests in watch mode |

## Troubleshooting

### `npm install` fails

- Ensure you're running Node.js v18+: `node --version`
- Delete `node_modules/` and `package-lock.json`, then retry:
  ```bash
  rm -rf node_modules package-lock.json
  npm install
  ```

### Port 8080 already in use

The dev server defaults to port 8080. If it's occupied, Vite will auto-assign the next available port. You can also change it in `vite.config.ts`:

```ts
server: {
  port: 3000, // or any free port
}
```

### TypeScript errors in IDE

If your IDE shows module resolution errors after cloning, run `npm install` first — the TypeScript language server needs `node_modules` to resolve types.

### Build errors

Clear the Vite cache and rebuild:

```bash
rm -rf node_modules/.vite
npm run build
```
