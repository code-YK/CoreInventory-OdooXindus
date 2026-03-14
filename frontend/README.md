# Warehouse Flow

An industrial-grade inventory management system for warehouse operations. Track products, manage receipts, deliveries, transfers, and monitor stock movements across multiple warehouse locations.

## Features

- **Dashboard** — Real-time overview of inventory metrics and stock levels
- **Product Management** — Add, edit, and organize product catalogs
- **Receipts & Deliveries** — Track incoming and outgoing goods with detailed records
- **Transfers** — Manage stock transfers between warehouse locations
- **Move History** — Complete audit trail of all inventory movements
- **Inventory Adjustments** — Record and track stock corrections
- **Warehouse & Locations** — Multi-warehouse support with zone/bin management
- **User Profiles** — Authentication and user account management
- **Dark/Light Theme** — Built-in theme toggle for comfortable viewing

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [React 18](https://react.dev/) |
| Language | [TypeScript](https://www.typescriptlang.org/) |
| Build Tool | [Vite 5](https://vitejs.dev/) |
| Styling | [Tailwind CSS 3](https://tailwindcss.com/) |
| UI Components | [shadcn/ui](https://ui.shadcn.com/) + [Radix UI](https://www.radix-ui.com/) |
| Routing | [React Router 6](https://reactrouter.com/) |
| State/Data | [TanStack React Query](https://tanstack.com/query) |
| Charts | [Recharts](https://recharts.org/) |
| Forms | [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) |
| Notifications | [Sonner](https://sonner.emilkowal.dev/) |

## Installation

```bash
# Clone the repository
git clone https://github.com/your-username/warehouse-flow.git
cd warehouse-flow

# Install dependencies
npm install
```

## Running Locally

```bash
# Start the development server
npm run dev
```

The app will be available at [http://localhost:8080](http://localhost:8080).

## Project Structure

```
warehouse-flow/
├── public/                 # Static assets (favicon, robots.txt)
├── src/
│   ├── components/         # Reusable UI components
│   │   └── ui/             # shadcn/ui primitives
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility functions
│   ├── pages/              # Route-level page components
│   ├── test/               # Test setup and test files
│   ├── App.tsx             # Root component with routing
│   ├── main.tsx            # Application entry point
│   └── index.css           # Global styles & Tailwind config
├── index.html              # HTML entry point
├── tailwind.config.ts      # Tailwind CSS configuration
├── vite.config.ts          # Vite build configuration
├── tsconfig.json           # TypeScript configuration
├── components.json         # shadcn/ui configuration
└── package.json            # Dependencies and scripts
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with HMR |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |
| `npm run test` | Run tests with Vitest |
| `npm run test:watch` | Run tests in watch mode |

## Deployment

Build the production bundle:

```bash
npm run build
```

The output will be in the `dist/` directory — deploy it to any static hosting provider:

- [Vercel](https://vercel.com/)
- [Netlify](https://www.netlify.com/)
- [Cloudflare Pages](https://pages.cloudflare.com/)
- [GitHub Pages](https://pages.github.com/)

## License

This project is licensed under the [MIT License](LICENSE).
