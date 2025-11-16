import nodemailer from 'nodemailer';

// Create reusable transporter object using the default SMTP transport
const createTransporter = () => {
  // For development, you can use a test account from ethereal.email
  // In production, configure with real SMTP credentials
  
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // For development without SMTP config, log to console
  return nodemailer.createTransport({
    streamTransport: true,
    newline: 'unix',
    buffer: true
  });
};

export const sendPasswordResetEmail = async (
  email: string,
  resetToken: string,
  name: string
): Promise<void> => {
  const transporter = createTransporter();
  
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: process.env.SMTP_FROM || '"JCB Parts Shop" <noreply@jcbparts.com>',
    to: email,
    subject: 'Password Reset Request',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background-color: #2563eb;
              color: #ffffff;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Password Reset Request</h2>
            <p>Hi ${name},</p>
            <p>We received a request to reset your password for your JCB Parts Shop account.</p>
            <p>Click the button below to reset your password:</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all;">${resetUrl}</p>
            <p><strong>This link will expire in 1 hour.</strong></p>
            <p>If you didn't request this password reset, please ignore this email or contact support if you have concerns.</p>
            <div class="footer">
              <p>This is an automated email from JCB Parts Shop. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Hi ${name},

We received a request to reset your password for your JCB Parts Shop account.

Click the link below to reset your password:
${resetUrl}

This link will expire in 1 hour.

If you didn't request this password reset, please ignore this email or contact support if you have concerns.

---
This is an automated email from JCB Parts Shop. Please do not reply to this email.
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    
    // Always log in development mode for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 Password reset email sent:');
      console.log('To:', email);
      console.log('Reset URL:', resetUrl);
      console.log('Message ID:', info.messageId);
      console.log('---');
    } else {
      console.log('Password reset email sent:', info.messageId);
    }
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    console.error('SMTP Config:', {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      user: process.env.SMTP_USER,
      hasPassword: !!process.env.SMTP_PASS,
    });
    throw new Error('Failed to send password reset email');
  }
};

export const sendInvitationEmail = async (
  email: string,
  password: string,
  name: string,
  inviterName: string
): Promise<void> => {
  const transporter = createTransporter();
  
  const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`;

  const mailOptions = {
    from: process.env.SMTP_FROM || '"JCB Parts Shop" <noreply@jcbparts.com>',
    to: email,
    subject: 'Welcome to JCB Parts Shop - Account Created',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .credentials-box {
              background-color: #f5f5f5;
              border: 1px solid #ddd;
              border-radius: 5px;
              padding: 15px;
              margin: 20px 0;
            }
            .credential-item {
              margin: 10px 0;
            }
            .credential-label {
              font-weight: bold;
              color: #555;
            }
            .credential-value {
              font-family: 'Courier New', monospace;
              background-color: #fff;
              padding: 5px 10px;
              border-radius: 3px;
              display: inline-block;
              margin-top: 5px;
            }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background-color: #2563eb;
              color: #ffffff;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
            .warning-box {
              background-color: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 15px;
              margin: 20px 0;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Welcome to JCB Parts Shop!</h2>
            <p>Hi ${name},</p>
            <p>${inviterName} has created an account for you in the JCB Parts Shop Management System.</p>
            
            <div class="credentials-box">
              <h3 style="margin-top: 0;">Your Login Credentials</h3>
              <div class="credential-item">
                <div class="credential-label">Email / Login ID:</div>
                <div class="credential-value">${email}</div>
              </div>
              <div class="credential-item">
                <div class="credential-label">Temporary Password:</div>
                <div class="credential-value">${password}</div>
              </div>
            </div>

            <div class="warning-box">
              <strong>⚠️ Important:</strong> You will be required to change your password after your first login for security purposes.
            </div>

            <p>Click the button below to login:</p>
            <a href="${loginUrl}" class="button">Login to JCB Parts Shop</a>
            
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all;">${loginUrl}</p>

            <h3>Next Steps:</h3>
            <ol>
              <li>Click the login link above</li>
              <li>Enter your email and temporary password</li>
              <li>You'll be prompted to create a new password</li>
              <li>Set a strong password that you can remember</li>
              <li>Start using the system</li>
            </ol>

            <p>If you have any questions or need assistance, please contact your administrator.</p>

            <div class="footer">
              <p>This is an automated email from JCB Parts Shop. Please do not reply to this email.</p>
              <p>If you believe you received this email in error, please contact support.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Welcome to JCB Parts Shop!

Hi ${name},

${inviterName} has created an account for you in the JCB Parts Shop Management System.

Your Login Credentials:
-----------------------
Email / Login ID: ${email}
Temporary Password: ${password}

IMPORTANT: You will be required to change your password after your first login for security purposes.

Login URL: ${loginUrl}

Next Steps:
1. Click the login link above
2. Enter your email and temporary password
3. You'll be prompted to create a new password
4. Set a strong password that you can remember
5. Start using the system

If you have any questions or need assistance, please contact your administrator.

---
This is an automated email from JCB Parts Shop. Please do not reply to this email.
If you believe you received this email in error, please contact support.
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    
    // Always log in development mode for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 User invitation email sent:');
      console.log('To:', email);
      console.log('Email:', email);
      console.log('Password:', password);
      console.log('Login URL:', loginUrl);
      console.log('Message ID:', info.messageId);
      console.log('---');
    } else {
      console.log('Invitation email sent:', info.messageId);
    }
  } catch (error) {
    console.error('❌ Error sending invitation email:', error);
    console.error('SMTP Config:', {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      user: process.env.SMTP_USER,
      hasPassword: !!process.env.SMTP_PASS,
    });
    throw new Error('Failed to send invitation email');
  }
};

export const sendPasswordChangeOTP = async (
  email: string,
  otp: string,
  name: string
): Promise<void> => {
  const transporter = createTransporter();

  const mailOptions = {
    from: process.env.SMTP_FROM || '"JCB Parts Shop" <noreply@jcbparts.com>',
    to: email,
    subject: 'Password Change Verification Code',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .otp-box {
              background-color: #f0f9ff;
              border: 2px solid #2563eb;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
              text-align: center;
            }
            .otp-code {
              font-size: 32px;
              font-weight: bold;
              color: #2563eb;
              letter-spacing: 8px;
              font-family: 'Courier New', monospace;
              margin: 15px 0;
            }
            .warning-box {
              background-color: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 15px;
              margin: 20px 0;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Password Change Verification</h2>
            <p>Hi ${name},</p>
            <p>We received a request to change your password for your JCB Parts Shop account.</p>
            
            <div class="otp-box">
              <p style="margin: 0; color: #666; font-size: 14px;">Your verification code is:</p>
              <div class="otp-code">${otp}</div>
              <p style="margin: 0; color: #666; font-size: 12px;">This code will expire in 10 minutes</p>
            </div>

            <p><strong>Enter this code on the password change page to continue.</strong></p>

            <div class="warning-box">
              <strong>⚠️ Security Notice:</strong>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Never share this code with anyone</li>
                <li>JCB Parts Shop will never ask you for this code via phone or email</li>
                <li>If you didn't request this code, please ignore this email and contact support immediately</li>
              </ul>
            </div>

            <p>If you didn't request a password change, please ignore this email or contact your administrator if you have concerns about your account security.</p>

            <div class="footer">
              <p>This is an automated email from JCB Parts Shop. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Password Change Verification

Hi ${name},

We received a request to change your password for your JCB Parts Shop account.

Your verification code is: ${otp}

This code will expire in 10 minutes.

Enter this code on the password change page to continue.

SECURITY NOTICE:
- Never share this code with anyone
- JCB Parts Shop will never ask you for this code via phone or email
- If you didn't request this code, please ignore this email and contact support immediately

If you didn't request a password change, please ignore this email or contact your administrator if you have concerns about your account security.

---
This is an automated email from JCB Parts Shop. Please do not reply to this email.
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    
    // Always log in development mode for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 Password change OTP sent:');
      console.log('To:', email);
      console.log('OTP:', otp);
      console.log('Message ID:', info.messageId);
      console.log('---');
    } else {
      console.log('Password change OTP sent:', info.messageId);
    }
  } catch (error) {
    console.error('❌ Error sending password change OTP:', error);
    console.error('SMTP Config:', {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      user: process.env.SMTP_USER,
      hasPassword: !!process.env.SMTP_PASS,
    });
    throw new Error('Failed to send password change OTP');
  }
};
