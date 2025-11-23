// Production Environment Validator
// Run this script to validate production configuration

import dotenv from 'dotenv';
dotenv.config();

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

const validate = (): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Critical validations
  if (!process.env.DATABASE_URL) {
    errors.push('DATABASE_URL is not set');
  } else if (process.env.DATABASE_URL.includes('localhost')) {
    warnings.push('DATABASE_URL contains localhost - ensure this is intentional for production');
  }

  if (!process.env.JWT_SECRET) {
    errors.push('JWT_SECRET is not set');
  } else if (process.env.JWT_SECRET.length < 64) {
    errors.push('JWT_SECRET is too short (minimum 64 characters)');
  } else if (process.env.JWT_SECRET.includes('GENERATE') || process.env.JWT_SECRET === 'your-secret-key-change-in-production-to-something-very-secure') {
    errors.push('JWT_SECRET contains default/placeholder value');
  }

  if (!process.env.POSTGRES_USER) {
    errors.push('POSTGRES_USER is not set');
  }

  if (!process.env.POSTGRES_PASSWORD) {
    errors.push('POSTGRES_PASSWORD is not set');
  } else if (process.env.POSTGRES_PASSWORD.length < 16) {
    warnings.push('POSTGRES_PASSWORD is shorter than recommended (minimum 16 characters)');
  }

  if (!process.env.POSTGRES_DB) {
    errors.push('POSTGRES_DB is not set');
  }

  // Important validations
  if (!process.env.FRONTEND_URL) {
    warnings.push('FRONTEND_URL is not set - CORS may not work correctly');
  } else if (process.env.FRONTEND_URL.includes('localhost')) {
    warnings.push('FRONTEND_URL contains localhost - ensure this is correct for production');
  } else if (!process.env.FRONTEND_URL.startsWith('https://')) {
    warnings.push('FRONTEND_URL should use HTTPS in production');
  }

  if (process.env.NODE_ENV !== 'production') {
    warnings.push(`NODE_ENV is '${process.env.NODE_ENV}' - should be 'production' for production deployment`);
  }

  // Email configuration
  if (!process.env.SMTP_HOST) {
    warnings.push('SMTP_HOST is not set - email functionality will not work');
  }

  if (!process.env.SMTP_USER) {
    warnings.push('SMTP_USER is not set - email functionality will not work');
  }

  if (!process.env.SMTP_PASS) {
    warnings.push('SMTP_PASS is not set - email functionality will not work');
  } else if (process.env.SMTP_PASS.includes('your-app-specific-password')) {
    errors.push('SMTP_PASS contains placeholder value');
  }

  if (!process.env.SMTP_FROM) {
    warnings.push('SMTP_FROM is not set - emails may be rejected');
  }

  // Port configuration
  const port = process.env.PORT ? parseInt(process.env.PORT) : 4001;
  if (isNaN(port) || port < 1 || port > 65535) {
    errors.push('PORT is invalid - must be between 1 and 65535');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
};

const printResults = (result: ValidationResult) => {
  console.log('\n🔍 Production Environment Validation\n');
  console.log('='.repeat(50));

  if (result.errors.length > 0) {
    console.log('\n❌ ERRORS (Must Fix):');
    result.errors.forEach((error, i) => {
      console.log(`  ${i + 1}. ${error}`);
    });
  }

  if (result.warnings.length > 0) {
    console.log('\n⚠️  WARNINGS (Should Review):');
    result.warnings.forEach((warning, i) => {
      console.log(`  ${i + 1}. ${warning}`);
    });
  }

  if (result.valid && result.warnings.length === 0) {
    console.log('\n✅ All checks passed! Environment is production-ready.');
  } else if (result.valid) {
    console.log('\n✅ Required configuration is valid, but review warnings above.');
  } else {
    console.log('\n❌ Environment validation failed! Fix errors above before deploying.');
  }

  console.log('\n' + '='.repeat(50));
  console.log();
};

// Run validation
const result = validate();
printResults(result);

// Exit with error code if validation failed
if (!result.valid) {
  process.exit(1);
}
