# JCB Parts Shop

A modern, full-stack inventory and sales management system for JCB parts, built with Next.js, Express, and Prisma.

## 🚀 Features

### Core Functionality
- **Inventory Management**: Track parts, stock levels, and suppliers
- **Sales Management**: Create and manage customer invoices with detailed line items
- **Purchase Management**: Track supplier purchases and manage procurement
- **Customer Management**: Maintain customer database with contact information
- **Supplier Management**: Manage supplier relationships and contacts
- **User Management**: Role-based access control with secure authentication

### Advanced Features
- **Bulk Invoice Processing**: Upload and process multiple invoices efficiently
- **Barcode Scanning**: Quick product lookup using barcode scanner integration
- **Reports & Analytics**: Comprehensive business insights and reporting
- **Payment Tracking**: Monitor invoice payments and outstanding balances
- **Soft Delete**: Safe deletion with data recovery capabilities
- **PDF Generation**: Generate professional invoices and reports
- **Email Notifications**: Automated email system for order confirmations
- **Dark Mode**: Full theme support for comfortable viewing
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: Radix UI
- **Animations**: Framer Motion
- **State Management**: SWR for data fetching
- **Charts**: Recharts
- **Icons**: Lucide React

### Backend
- **Runtime**: Node.js with Express
- **Language**: TypeScript
- **Database ORM**: Prisma
- **Authentication**: JWT with bcrypt
- **Email**: Nodemailer
- **Validation**: express-validator
- **CORS**: Enabled for cross-origin requests

### Database
- PostgreSQL (via Prisma ORM)
- Full migration history
- Soft delete support

### DevOps
- Docker & Docker Compose
- TypeScript compilation
- Hot reload in development

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Docker (optional, for containerized deployment)

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/AnirbanMadhu/JCB-Parts-Shop.git
cd JCB-Parts-Shop/App
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Configure your .env file with:
# DATABASE_URL="postgresql://user:password@localhost:5432/jcb_parts"
# JWT_SECRET="your-secret-key"
# EMAIL_HOST="smtp.example.com"
# EMAIL_PORT=587
# EMAIL_USER="your-email@example.com"
# EMAIL_PASSWORD="your-email-password"

# Run database migrations
npx prisma migrate dev

# Seed the database (optional)
npm run seed

# Start development server
npm run dev
```

The backend will run on `http://localhost:5000`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env.local file
cp .env

# Configure your .env.local file with:
# NEXT_PUBLIC_API_URL="http://localhost:5000/api"

# Start development server
npm run dev
```

The frontend will run on `http://localhost:3000`

### 4. Docker Setup (Alternative)

```bash
# From the backend directory
docker-compose up -d

# Run migrations
docker-compose exec backend npx prisma migrate dev
```

## 📁 Project Structure

```
├── backend/
│   ├── prisma/              # Database schema and migrations
│   │   ├── schema.prisma    # Prisma schema definition
│   │   └── migrations/      # Migration history
│   ├── src/
│   │   ├── routes/          # API route handlers
│   │   ├── middleware/      # Express middleware (auth, etc.)
│   │   ├── utils/           # Utility functions
│   │   ├── app.ts          # Express app configuration
│   │   └── index.ts        # Server entry point
│   └── Dockerfile
│
└── frontend/
    ├── src/
    │   ├── app/            # Next.js app router pages
    │   │   ├── dashboard/  # Dashboard pages
    │   │   ├── sales/      # Sales management
    │   │   ├── purchases/  # Purchase management
    │   │   ├── reports/    # Reports and analytics
    │   │   └── setup/      # Initial setup
    │   ├── components/     # Reusable React components
    │   │   ├── ui/        # Base UI components
    │   │   └── features/  # Feature-specific components
    │   ├── contexts/      # React contexts
    │   ├── hooks/         # Custom React hooks
    │   ├── lib/           # Utilities and configurations
    │   └── types/         # TypeScript type definitions
    └── public/            # Static assets
```

## 🔑 Key Features Explained

### Authentication & Authorization
- JWT-based authentication
- Password hashing with bcrypt
- Password reset with OTP
- Protected routes and API endpoints

### Invoice Management
- Create detailed invoices with multiple line items
- Track payment status (Paid/Unpaid/Partially Paid)
- Generate PDF invoices
- Bulk invoice upload and processing

### Inventory Tracking
- Real-time stock level monitoring
- Automatic stock updates on sales/purchases
- Low stock alerts
- Part categorization

### Reporting
- Sales reports by date range
- Inventory value reports
- Customer purchase history
- Supplier purchase analysis

## 🔧 Available Scripts

### Backend
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run seed` - Seed database with sample data
- `npm run studio` - Open Prisma Studio

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## 🗄️ Database Schema

The application uses Prisma ORM with the following main models:

- **User**: System users with authentication
- **Customer**: Customer information
- **Supplier**: Supplier details
- **Part**: Product/parts inventory
- **Invoice**: Sales invoices
- **InvoiceItem**: Invoice line items
- **Purchase**: Supplier purchases
- **PurchaseItem**: Purchase line items
- **PasswordResetToken**: Password reset tokens
- **PasswordChangeOTP**: OTP for password changes

## 🔒 Security

- Password hashing with bcrypt
- JWT token authentication
- HTTP-only cookies for token storage
- Input validation on all endpoints
- CORS configuration
- SQL injection prevention via Prisma ORM
- XSS protection

## 🎨 UI/UX Features

- Modern, clean interface
- Dark/light theme toggle
- Responsive design for all screen sizes
- Loading states and error handling
- Toast notifications
- Smooth animations
- Accessibility considerations

## 📝 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `POST /api/auth/change-password` - Change password (authenticated)

### Resource Endpoints
- `/api/parts` - Parts management
- `/api/customers` - Customer management
- `/api/suppliers` - Supplier management
- `/api/invoices` - Invoice management
- `/api/invoices/bulk` - Bulk invoice operations
- `/api/stock` - Stock management
- `/api/reports` - Reports and analytics
- `/api/users` - User management

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👤 Author

**AnirbanMadhu**

- GitHub: [@AnirbanMadhu](https://github.com/AnirbanMadhu)
- Repository: [JCB-Parts-Shop](https://github.com/AnirbanMadhu/JCB-Parts-Shop)

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [Radix UI](https://www.radix-ui.com/)
- Database ORM by [Prisma](https://www.prisma.io/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)

## 📞 Support

For support, please open an issue in the GitHub repository or contact the maintainers.

---

**Note**: This is a production-ready application. Ensure all environment variables are properly configured before deploying to production.
