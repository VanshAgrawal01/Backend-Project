require('dotenv').config();
const nodemailer = require('nodemailer');

//ye mail send karne ke liye transporter create karna padega jisme email service aur authentication details deni hoti hai
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',//Simple password login nahi. Google OAuth2 secure login use kar raha hai.
    user: process.env.EMAIL_USER,//Ye sender email address hai.
    clientId: process.env.CLIENT_ID,//Google Cloud OAuth app ki identity.
    clientSecret: process.env.CLIENT_SECRET,//Google Cloud OAuth app ka secret key.
    refreshToken: process.env.REFRESH_TOKEN,//Isse Gmail new access token generate karta hai automatically
  },
});

// Verify the connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('Error connecting to email server:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});

// Function to send email
const sendEmail = async (to, subject, text, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"Backend-ledger" <${process.env.EMAIL_USER}>`, // sender address
      to, // list of receivers
      subject, // Subject line
      text, // plain text body
      html, // html body
    });

    console.log('Message sent: %s', info.messageId); //Ye message ID hai jo email successfully send hone par milta hai.
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));//Ye URL hai jisse aap email ka preview dekh sakte ho. Ye sirf development ke liye useful hai.
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

// Function to send registration email
async function sendRegistrationEmail(to, subject, text, html) {
   subject = 'Welcome to Backend-ledger!';
   text = 'Thank you for registering with Backend-ledger. We are excited to have you on board!';
   html = `<p>Thank you for registering with <strong>Backend-ledger</strong>. We are excited to have you on board!</p>`;

  await sendEmail(to, subject, text, html);//run after registration successful and send email to user and send email to user with subject and text and html content and it use function sendEmail to send email to user and it use transporter to send email to user and it use nodemailer to send email to user and it use environment variables to get email credentials and it use OAuth2 for secure login and it verify connection configuration before sending email and it log message ID and preview URL after sending email successfully and it catch error if there is any error while sending email and it log error if there is any error while sending email.
}

// Function to send transaction email
async function sendTransactionEmail(userEmail, userName, amount, toAccount) {
  subject = 'Transaction Successful!';
  text = `Dear ${userName}, your transaction of $${amount} to account ${toAccount} was successful.`;
  html = `<p>Dear <strong>${userName}</strong>, your transaction of <strong>$${amount}</strong> to account <strong>${toAccount}</strong> was successful.</p>`;

  await sendEmail(userEmail, subject, text, html);
}

// Function to send transaction failure email
async function sendTransactionFailureEmail(userEmail, userName, amount, toAccount) {
  subject = 'Transaction Failed!';
  text = `Dear ${userName}, your transaction of $${amount} to account ${toAccount} failed.`;
  html = `<p>Dear <strong>${userName}</strong>, your transaction of <strong>$${amount}</strong> to account <strong>${toAccount}</strong> failed.</p>`;

  await sendEmail(userEmail, subject, text, html);
}

module.exports = { // Exporting the sendRegistrationEmail function so that it can be used in other parts of the application, such as after a user successfully registers. Also exporting sendTransactionEmail function to send transaction notification email to user after transaction is completed.
  sendRegistrationEmail,
  sendTransactionEmail,
  sendTransactionFailureEmail
};

//When the file is imported, transporter and verify run immediately. When registration succeeds, sendRegistrationEmail() runs, which calls sendEmail(), and finally transporter.sendMail() sends the email.
//In the transaction controller, after the transaction is completed and the response is sent to the client, sendTransactionEmail() is called to send a transaction notification email to the user in the background.