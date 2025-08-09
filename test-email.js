const nodemailer = require('nodemailer');

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
});

// Test email function
async function testEmail() {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to: 'amirhost007@gmail.com',
      subject: 'Test Email - Quotation System',
      html: `
        <h2>Test Email from Quotation System</h2>
        <p>This is a test email to verify the email functionality is working.</p>
        <p><strong>Test Data:</strong></p>
        <ul>
          <li>Customer Name: Test Customer</li>
          <li>Email: test@example.com</li>
          <li>Phone: +1234567890</li>
          <li>Location: Test Location</li>
          <li>Service Level: Premium</li>
          <li>Material Type: Quartz</li>
          <li>Material Color: White</li>
          <li>Project Type: Kitchen</li>
          <li>Timeline: 2 weeks</li>
          <li>Total Amount: AED 5000</li>
        </ul>
        <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Test email sent successfully:', result.messageId);
  } catch (error) {
    console.error('Error sending test email:', error);
  }
}

// Run the test
testEmail();
