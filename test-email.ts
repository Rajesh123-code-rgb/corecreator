// test-email.ts
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// We have to mock Next.js imports if we test via pure node,
// so let's import the actual email service and pass the env directly.
// Alternatively we can use ts-node to run this script.
import { sendWelcomeEmail } from './src/lib/email/brevo';

async function runTest() {
    console.log('Starting Email Test...');
    const result = await sendWelcomeEmail('Rajesh', 'raj070878@gmail.com');
    if (result) {
        console.log('✅ Test email sent to raj070878@gmail.com!');
    } else {
        console.log('❌ Failed to send email (Check BREVO_API_KEY in .env.local).');
    }
}

runTest();
