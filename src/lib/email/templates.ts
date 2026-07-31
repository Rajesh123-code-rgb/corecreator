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
                    <span>${order.currency || 'USD'} ${item.price.toFixed(2)}</span>
                </div>
                `).join('')}
                <div class="total">
                    Total: ${order.currency || 'USD'} ${order.total.toFixed(2)}
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
