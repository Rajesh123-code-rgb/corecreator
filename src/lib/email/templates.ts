// Email template generators
// Replace these with actual branded designs as needed

export const getWelcomeEmailTemplate = (name: string) => `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .brand { color: #1D4ED8; font-size: 24px; font-weight: bold; }
        .content { background: #f8fafc; padding: 30px; border-radius: 8px; }
        .btn { display: inline-block; padding: 12px 24px; background: #1D4ED8; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #888; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <span class="brand">Core Creator</span>
        </div>
        <div class="content">
            <h2>Welcome to Core Creator, ${name}!</h2>
            <p>We're thrilled to have you join our global community of artists and learners.</p>
            <p>With your new account, you can start exploring world-class courses, discover unique artworks, or set up your own studio.</p>
            <center>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="btn">Explore Your Dashboard</a>
            </center>
        </div>
        <div class="footer">
            &copy; ${new Date().getFullYear()} Core Creator. All rights reserved.
        </div>
    </div>
</body>
</html>
`;

// Values may arrive already formatted - the admin template preview renders this
// with "{{total}}" in place of a number, and a string has no .toFixed(). Calling
// it unconditionally made the whole email-templates endpoint return 500.
export const getOrderConfirmationTemplate = (order: any, userName: string) => `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .brand { color: #1D4ED8; font-size: 24px; font-weight: bold; }
        .content { background: #f8fafc; padding: 30px; border-radius: 8px; }
        .order-details { margin: 20px 0; background: white; padding: 15px; border-radius: 6px; }
        .item { padding: 10px 0; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; }
        .item:last-child { border-bottom: none; }
        .total { font-weight: bold; font-size: 18px; margin-top: 15px; text-align: right; }
        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #888; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <span class="brand">Core Creator</span>
        </div>
        <div class="content">
            <h2>Order Confirmed!</h2>
            <p>Hi ${userName},</p>
            <p>Thank you for your purchase. We've received your order <strong>#${order.orderNumber}</strong> and it is now being processed.</p>
            
            <div class="order-details">
                <h3>Order Summary</h3>
                ${(order.items || []).map((item: any) => `
                <div class="item">
                    <span>${item.name} (x${item.quantity})</span>
                    <span>${order.currency || 'INR'} ${typeof item.price === 'number' ? item.price.toFixed(2) : item.price}</span>
                </div>
                `).join('')}
                <div class="total">
                    Total: ${order.currency || 'INR'} ${typeof order.total === 'number' ? order.total.toFixed(2) : order.total}
                </div>
            </div>
            
            <p>You can view your order status and details in your account dashboard at any time.</p>
        </div>
        <div class="footer">
            &copy; ${new Date().getFullYear()} Core Creator. All rights reserved.
        </div>
    </div>
</body>
</html>
`;

export const getPasswordResetTemplate = (name: string, resetUrl: string, isNewGuestAccount = false) => `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f6f6f8;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <div style="background:#ffffff;border-radius:12px;padding:32px;">
      <h1 style="margin:0 0 16px;font-size:22px;color:#111827;">
        ${isNewGuestAccount ? "Set a password for your account" : "Reset your password"}
      </h1>
      <p style="margin:0 0 16px;color:#4b5563;line-height:1.6;">Hi ${name},</p>
      <p style="margin:0 0 24px;color:#4b5563;line-height:1.6;">
        ${isNewGuestAccount
            ? "We created an account for you so you can track your order and access anything you purchased. Set a password below to sign in."
            : "We received a request to reset your password. Click the button below to choose a new one."}
      </p>
      <p style="margin:0 0 24px;">
        <a href="${resetUrl}" style="display:inline-block;background:#9333EA;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:bold;">
          ${isNewGuestAccount ? "Set my password" : "Reset my password"}
        </a>
      </p>
      <p style="margin:0 0 8px;color:#6b7280;font-size:13px;line-height:1.6;">
        This link expires in 1 hour. If the button doesn't work, paste this into your browser:
      </p>
      <p style="margin:0 0 24px;color:#6b7280;font-size:13px;word-break:break-all;">${resetUrl}</p>
      <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6;">
        ${isNewGuestAccount
            ? "If you didn't place an order with us, you can ignore this email."
            : "If you didn't request this, you can safely ignore this email - your password won't change."}
      </p>
    </div>
  </div>
</body>
</html>
`;
