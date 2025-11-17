# S.P.TRADERS AND BUILDERS - Frontend

A Next.js-based management system for JCB parts shop operations.

## Project Structure

This project follows Next.js best practices with a well-organized structure.

```
src/
├── app/              # Next.js App Router (routes and pages)
├── components/       # Shared/reusable components
├── lib/             # Utilities, API clients, constants
├── hooks/           # Custom React hooks
└── types/           # TypeScript type definitions
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun
- Backend API running on http://localhost:4001

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Update .env with your API URL if different from default
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

### Build

```bash
# Create production build
npm run build

# Start production server
npm start
```

## Key Features

- **Dashboard**: Real-time business metrics and charts
- **Common**: Manage customers, suppliers, and inventory items
- **Sales**: Sales invoices and payment tracking
- **Purchases**: Purchase invoices and payment tracking
- **Reports**: Balance sheet and P&L reports

## Technology Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Icons**: Lucide React
- **Runtime**: React 19

## Project Organization

### Route-Specific Components
Components used by a single route are co-located in `_components` folders:
```
app/dashboard/_components/
  ├── DashboardCard.tsx
  └── SalesChart.tsx
```

### Shared Components
Reusable components are in `src/components/`:
```
components/ui/
  ├── CustomerForm.tsx
  └── Toast.tsx
```

### Import Aliases
Use TypeScript path aliases for clean imports:
```tsx
import { formatCurrency } from '@/lib/utils';
import { Customer } from '@/types';
import Button from '@/components/ui/Button';
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:4001` |

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Docs](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)

## Contributing

1. Follow the established project structure
2. Use TypeScript for type safety
3. Co-locate route-specific components
4. Use path aliases for imports
5. Write descriptive commit messages
