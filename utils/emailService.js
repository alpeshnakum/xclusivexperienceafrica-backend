const nodemailer = require('nodemailer');
const { generateOTP } = require('./validation');
require("dotenv").config();

const contactUsEmail = 'info@xclusivexperienceafrica.com';

const transporter = nodemailer.createTransport({
    host: "smtp.office365.com",
    port: 587,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});


const sendCredentialsEmail = (email, firstName, generatedPassword) => {
    const mailOptions = {
        from: `Xclusive Xperience Africa <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Your XclusiveXperienceAfrica Account Credentials',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; background: #f9f9f9;">
                
                <div style="text-align: center; padding-bottom: 20px;">
                    <img src="https://xclusivexperienceafrica.com/logo.png" alt="XclusiveXperienceAfrica Logo" style="width: 150px;">
                </div>

                <div style="background: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);">
                    <h2 style="color: #4CAF50; text-align: center;">Welcome to XclusiveXperienceAfrica!</h2>
                    <p>Dear <strong>${firstName}</strong>,</p>
                    <p>Your account has been successfully created. Below are your login credentials:</p>

                    <h3 style="color: #4CAF50;">Account Details:</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Email:</strong></td>
                            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${email}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Password:</strong></td>
                            <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>${generatedPassword}</strong></td>
                        </tr>
                    </table>

                    <p style="margin-top: 20px;">For security reasons, we recommend changing your password after your first login.</p>

                    <div style="text-align: center; margin: 20px 0;">
                        <a href="${process.env.FRONTEND_URL}/auth/login" 
                            style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-size: 16px; display: inline-block;">
                            Log In Now
                        </a>
                    </div>

                    <hr style="margin: 20px 0; border: 0; border-top: 1px solid #ddd;">

                    <p style="font-size: 12px; color: #757575;">
                        If you did not request this account, please contact us immediately at <a href="mailto:${contactUsEmail}" style="color: #4CAF50;">${contactUsEmail}</a>.
                    </p>

                    <p style="font-size: 12px; color: #757575;">Best regards,<br><strong>XclusiveXperienceAfrica Team</strong></p>
                </div>

                <footer style="margin-top: 20px; text-align: center; font-size: 12px; color: #9e9e9e;">
                    <p>Contact us: <a href="mailto:${contactUsEmail}" style="color: #4CAF50;">${contactUsEmail}</a></p>
                    <p>© ${new Date().getFullYear()} XclusiveXperienceAfrica. All rights reserved.</p>
                </footer>
            </div>
        `,
    };

    transporter.sendMail(mailOptions, (err, info) => {
        if (err) console.error('Error sending credentials email:', err);
        else console.log('Credentials email sent:', info.response);
    });
};

const sendVerificationEmail = (email, token, firstName, returnUrl) => {
    const verificationLink = `${process.env.API_URL}/api/auth/verify-email?token=${token}&returnUrl=${encodeURIComponent(returnUrl)}`;
    const mailOptions = {
        from: `Xclusive Xperience Africa <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Email Verification',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; background: #f9f9f9;">
                
                <div style="text-align: center; padding-bottom: 20px;">
                    <img src="https://xclusivexperienceafrica.com/logo.png" alt="XclusiveXperienceAfrica Logo" style="width: 150px;">
                </div>

                <div style="background: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);">
                    <h2 style="color: #4CAF50; text-align: center;">Welcome to XclusiveXperienceAfrica!</h2>
                    <p>Dear <strong>${firstName}</strong>,</p>
                    <p>Thank you for signing up! Please verify your email address to complete your registration.</p>

                    <div style="text-align: center; margin: 20px 0;">
                        <a href="${verificationLink}" 
                            style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-size: 16px; display: inline-block;">
                            Verify Email
                        </a>
                    </div>

                    <p>If the button above doesn't work, please copy and paste the following link into your browser:</p>
                    <p style="word-wrap: break-word; overflow-wrap: break-word;">
                        <a href="${verificationLink}" style="color: #4CAF50; text-decoration: none;">${verificationLink}</a>
                    </p>

                    <hr style="margin: 20px 0; border: 0; border-top: 1px solid #ddd;">

                    <p style="font-size: 12px; color: #757575;">
                        If you did not sign up for this account, you can safely ignore this email.
                    </p>

                    <p style="font-size: 12px; color: #757575;">Best regards,<br><strong>XclusiveXperienceAfrica Team</strong></p>
                </div>

                <footer style="margin-top: 20px; text-align: center; font-size: 12px; color: #9e9e9e;">
                    <p>Contact us: <a href="mailto:${contactUsEmail}" style="color: #4CAF50;">${contactUsEmail}</a></p>
                    <p>&copy; ${new Date().getFullYear()} XclusiveXperienceAfrica. All rights reserved.</p>
                </footer>
            </div>
        `
    };

    transporter.sendMail(mailOptions, (err, info) => {
        if (err) console.error('Error sending email:', err);
        else console.log('Email sent:', info.response);
    });
};

const sendContactUsEmail = (name, email, countryCode, phone, message) => {
    const mailOptions = {
        from: `Xclusive Xperience Africa <${process.env.EMAIL_USER}>`,
        to: email,
        // cc: contactUsEmail,
        subject: 'Contact Us - Your Inquiry Received',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; background: #f9f9f9;">
                
                <div style="text-align: center; padding-bottom: 20px;">
                    <img src="https://xclusivexperienceafrica.com/logo.png" alt="XclusiveXperienceAfrica Logo" style="width: 150px;">
                </div>

                <div style="background: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);">
                    <h2 style="color: #4CAF50; text-align: center;">Thank You for Contacting Us!</h2>
                    <p>Dear <strong>${name}</strong>,</p>
                    <p>We have received your inquiry and our team will get back to you as soon as possible.</p>

                    <h3 style="color: #4CAF50;">Your Inquiry Details:</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Name:</strong></td>
                            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${name}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Email:</strong></td>
                            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${email}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Mobile:</strong></td>
                            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${countryCode} ${phone}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Message:</strong></td>
                            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${message}</td>
                        </tr>
                    </table>

                    <p>We appreciate your interest in <strong>XclusiveXperienceAfrica</strong>. If you have any urgent concerns, feel free to contact us directly.</p>

                    <div style="text-align: center; margin-top: 20px;">
                        <a href="mailto:${contactUsEmail}" 
                            style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-size: 16px; display: inline-block;">
                            Contact Us
                        </a>
                    </div>

                    <hr style="margin: 20px 0; border: 0; border-top: 1px solid #ddd;">

                    <p style="font-size: 12px; color: #757575;">
                        If you did not submit this request, please ignore this email.
                    </p>

                    <p style="font-size: 12px; color: #757575;">Best regards,<br><strong>XclusiveXperienceAfrica Team</strong></p>
                </div>

                <footer style="margin-top: 20px; text-align: center; font-size: 12px; color: #9e9e9e;">
                    <p>Contact us: <a href="mailto:${contactUsEmail}" style="color: #4CAF50;">${contactUsEmail}</a></p>
                    <p>&copy; ${new Date().getFullYear()} XclusiveXperienceAfrica. All rights reserved.</p>
                </footer>
            </div>
        `
    };

    transporter.sendMail(mailOptions, (err, info) => {
        if (err) console.error('Error sending email:', err);
        else console.log('Email sent:', info.response);
    });
}

const sendOTPEmail = (email, otp) => {
    const mailOptions = {
        from: `Xclusive Xperience Africa <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Your OTP for Login Verification',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; background: #f9f9f9;">
                <div style="text-align: center; padding-bottom: 20px;">
                    <img src="https://xclusivexperienceafrica.com/logo.png" alt="XclusiveXperienceAfrica Logo" style="width: 150px;">
                </div>
                <div style="background: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);">
                    <h2 style="color: #4CAF50; text-align: center;">Login Verification</h2>
                    <p>Your OTP for login verification is:</p>
                    <div style="text-align: center; margin: 20px 0;">
                        <span style="background-color: #4CAF50; color: white; padding: 12px 20px; border-radius: 5px; font-size: 24px; display: inline-block;">
                            ${otp}
                        </span>
                    </div>
                    <p>This OTP is valid for 10 minutes. Do not share it with anyone.</p>
                    <hr style="margin: 20px 0; border: 0; border-top: 1px solid #ddd;">
                    <p style="font-size: 12px; color: #757575;">If you did not request this OTP, please ignore this email.</p>
                </div>
                <footer style="margin-top: 20px; text-align: center; font-size: 12px; color: #9e9e9e;">
                    <p>Contact us: <a href="mailto:info@xclusivexperienceafrica.com" style="color: #4CAF50;">info@xclusivexperienceafrica.com</a></p>
                    <p>&copy; ${new Date().getFullYear()} XclusiveXperienceAfrica. All rights reserved.</p>
                </footer>
            </div>
        `,
    };

    transporter.sendMail(mailOptions, (err, info) => {
        if (err) console.error('Error sending OTP email:', err);
        else console.log('OTP email sent:', info.response);
    });
};

const sendChatNotificationEmail = (recipientEmail, senderName, senderEmail, message) => {
    const mailOptions = {
        from: `Xclusive Xperience Africa <${process.env.EMAIL_USER}>`,
        to: recipientEmail,
        cc: senderEmail,
        subject: `New Message from ${senderName || 'XclusiveXperienceAfrica'} Booking`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; background: #f9f9f9;">
                
                <div style="text-align: center; padding-bottom: 20px;">
                    <img src="https://xclusivexperienceafrica.com/logo.png" alt="XclusiveXperienceAfrica Logo" style="width: 150px;">
                </div>

                <div style="background: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);">
                    <h2 style="color: #4CAF50; text-align: center;">You Have a New Message</h2>
                    <p>Hello,</p>
                    <p><strong>${senderName || 'XclusiveXperienceAfrica'}</strong> has sent you a new message:</p>

                    <blockquote style="background: #f1f1f1; padding: 15px; border-left: 4px solid #4CAF50; font-style: italic;">
                        "${message}"
                    </blockquote>

                    <hr style="margin: 20px 0; border: 0; border-top: 1px solid #ddd;">

                    <p style="font-size: 12px; color: #757575;">
                        If you did not expect this message, you can safely ignore this email.
                    </p>

                    <p style="font-size: 12px; color: #757575;">Best regards,<br><strong>XclusiveXperienceAfrica Team</strong></p>
                </div>

                <footer style="margin-top: 20px; text-align: center; font-size: 12px; color: #9e9e9e;">
                    <p>Contact us: <a href="mailto:info@xclusivexperienceafrica.com" style="color: #4CAF50;">info@xclusivexperienceafrica.com</a></p>
                    <p>&copy; ${new Date().getFullYear()} XclusiveXperienceAfrica. All rights reserved.</p>
                </footer>
            </div>
        `,
    };

    transporter.sendMail(mailOptions, (err, info) => {
        if (err) console.error('Error sending chat notification email:', err);
        else console.log('Chat notification email sent:', info.response);
    });
};

const sendPurchaseConfirmationEmail = (userEmail, fullName, packageName, purchaseId, checkInDate, checkOutDate, guestDetails, amount, addOns) => {
    let parsedAddOns = [];

    try {
        parsedAddOns = typeof addOns === "string" ? JSON.parse(addOns) : addOns;
    } catch (error) {
        console.error("Error parsing addOns JSON:", error);
        parsedAddOns = [];
    }

    const formattedAddOns = parsedAddOns?.length > 0
        ? parsedAddOns.map(addOn => `<li>${addOn.name} - $${addOn.price}</li>`).join("")
        : "<li>No Add-ons Selected</li>";

    const mailOptions = {
        from: `Xclusive Xperience Africa <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject: "Booking Confirmation - XclusiveXperienceAfrica",
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; background: #f9f9f9;">
                
                <div style="text-align: center; padding-bottom: 20px;">
                    <img src="https://xclusivexperienceafrica.com/logo.png" alt="XclusiveXperienceAfrica Logo" style="width: 150px;">
                </div>

                <div style="background: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);">
                    <h2 style="color: #4CAF50; text-align: center;">Booking Confirmed!</h2>
                    <p>Dear <strong>${fullName}</strong>,</p>
                    <p>Thank you for booking with <strong>XclusiveXperienceAfrica</strong>. Your package details are as follows:</p>

                    <h3 style="color: #4CAF50;">Booking Details:</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Booking ID:</strong></td>
                            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${purchaseId}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Package Name:</strong></td>
                            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${packageName}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Check-in Date:</strong></td>
                            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${checkInDate}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Check-out Date:</strong></td>
                            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${checkOutDate}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Guest Details:</strong></td>
                            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${guestDetails}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Add-ons Details:</strong></td>
                            <td style="padding: 10px; border-bottom: 1px solid #ddd;">
                                <ul style="padding-left: 20px; margin: 0;">
                                    ${formattedAddOns}
                                </ul>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Total Amount:</strong></td>
                            <td style="padding: 10px; border-bottom: 1px solid #ddd;">$${amount || 0}</td>
                        </tr>
                    </table>

                    <p>If you have any questions, feel free to reach out to us.</p>

                    <div style="text-align: center; margin-top: 20px;">
                        <a href="mailto:info@xclusivexperienceafrica.com" 
                            style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-size: 16px; display: inline-block;">
                            Contact Support
                        </a>
                    </div>

                    <hr style="margin: 20px 0; border: 0; border-top: 1px solid #ddd;">

                    <p style="font-size: 12px; color: #757575;">
                        Thank you for choosing XclusiveXperienceAfrica. We look forward to making your trip amazing!
                    </p>

                    <p style="font-size: 12px; color: #757575;">Best regards,<br><strong>XclusiveXperienceAfrica Team</strong></p>
                </div>

                <footer style="margin-top: 20px; text-align: center; font-size: 12px; color: #9e9e9e;">
                    <p>Contact us: <a href="mailto:info@xclusivexperienceafrica.com" style="color: #4CAF50;">info@xclusivexperienceafrica.com</a></p>
                    <p>&copy; ${new Date().getFullYear()} XclusiveXperienceAfrica. All rights reserved.</p>
                </footer>
            </div>
        `,
    };

    transporter.sendMail(mailOptions, (err, info) => {
        if (err) console.error("Error sending purchase confirmation email:", err);
        else console.log("Purchase confirmation email sent:", info.response);
    });
};

const sendAdminBookingNotification = (adminEmail, userFullName, userEmail, packageName, purchaseId, checkInDate, checkOutDate, guestDetails, amount, addOns) => {

    let parsedAddOns = [];

    try {
        parsedAddOns = typeof addOns === "string" ? JSON.parse(addOns) : addOns;
    } catch (error) {
        console.error("Error parsing addOns JSON:", error);
        parsedAddOns = [];
    }

    const formattedAddOns = parsedAddOns?.length > 0
        ? parsedAddOns.map(addOn => `<li>${addOn.name} - $${addOn.price}</li>`).join("")
        : "<li>No Add-ons Selected</li>";

    const mailOptions = {
        from: `Xclusive Xperience Africa <${process.env.EMAIL_USER}>`,
        to: adminEmail,
        subject: "New Package Booking Notification",
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; background: #f9f9f9;">
                
                <div style="text-align: center; padding-bottom: 20px;">
                    <img src="https://xclusivexperienceafrica.com/logo.png" alt="XclusiveXperienceAfrica Logo" style="width: 150px;">
                </div>

                <div style="background: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);">
                    <h2 style="color: #4CAF50; text-align: center;">You Have a New Booking Request</h2>
                    <p>Dear Admin,</p>
                    <p>A new package has been booked by <strong>${userFullName}</strong> (${userEmail}).</p>

                    <h3 style="color: #4CAF50;">Booking Details:</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Booking ID:</strong></td>
                            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${purchaseId}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Package Name:</strong></td>
                            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${packageName}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Check-in Date:</strong></td>
                            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${checkInDate}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Check-out Date:</strong></td>
                            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${checkOutDate}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Guest Details:</strong></td>
                            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${guestDetails}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Add-ons Details:</strong></td>
                            <td style="padding: 10px; border-bottom: 1px solid #ddd;">
                                <ul style="padding-left: 20px; margin: 0;">
                                    ${formattedAddOns}
                                </ul>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Total Amount:</strong></td>
                            <td style="padding: 10px; border-bottom: 1px solid #ddd;">$${amount || 0}</td>
                        </tr>
                    </table>

                    <p>Please review the booking details in the admin dashboard.</p>

                    <div style="text-align: center; margin-top: 20px;">
                        <a href="${process.env.FRONTEND_URL}/auth/login" 
                            style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-size: 16px; display: inline-block;">
                            Review Booking Details
                        </a>
                    </div>

                    <hr style="margin: 20px 0; border: 0; border-top: 1px solid #ddd;">

                    <p style="font-size: 12px; color: #757575;">
                        This is an automated notification. Please do not reply.
                    </p>

                    <p style="font-size: 12px; color: #757575;">Best regards,<br><strong>XclusiveXperienceAfrica Team</strong></p>
                </div>

                <footer style="margin-top: 20px; text-align: center; font-size: 12px; color: #9e9e9e;">
                    <p>Contact us: <a href="mailto:info@xclusivexperienceafrica.com" style="color: #4CAF50;">info@xclusivexperienceafrica.com</a></p>
                    <p>&copy; ${new Date().getFullYear()} XclusiveXperienceAfrica. All rights reserved.</p>
                </footer>
            </div>
        `,
    };

    transporter.sendMail(mailOptions, (err, info) => {
        if (err) console.error("Error sending admin booking notification email:", err);
        else console.log("Admin booking notification email sent:", info.response);
    });
};

const sendRefundConfirmationEmail = (userEmail, fullName, packageName, bookingId, refundAmount, refundId, checkInDate, checkOutDate, guestDetails) => {
    const mailOptions = {
        from: `Xclusive Xperience Africa <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject: "Refund Confirmation - XclusiveXperienceAfrica",
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; background: #f9f9f9;">
                
                <div style="text-align: center; padding-bottom: 20px;">
                    <img src="https://xclusivexperienceafrica.com/logo.png" alt="XclusiveXperienceAfrica Logo" style="width: 150px;">
                </div>

                <div style="background: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);">
                    <h2 style="color: #4CAF50; text-align: center;">Refund Processed Successfully!</h2>
                    <p>Dear <strong>${fullName}</strong>,</p>
                    <p>We have processed a refund for your booking with <strong>XclusiveXperienceAfrica</strong>. Below are the details of your refund:</p>

                    <h3 style="color: #4CAF50;">Refund Details:</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Booking ID:</strong></td>
                            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${bookingId}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Refund ID:</strong></td>
                            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${refundId}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Package Name:</strong></td>
                            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${packageName}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Check-in Date:</strong></td>
                            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${checkInDate}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Check-out Date:</strong></td>
                            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${checkOutDate}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Guest Details:</strong></td>
                            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${guestDetails}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Refund Amount:</strong></td>
                            <td style="padding: 10px; border-bottom: 1px solid #ddd;">$${refundAmount.toFixed(2)} USD</td>
                        </tr>
                    </table>

                    <p>The refund should be reflected in your account within 5-10 business days, depending on your bank or payment provider.</p>

                    <p>If you have any questions or need further assistance, please don't hesitate to reach out to our support team.</p>

                    <div style="text-align: center; margin-top: 20px;">
                        <a href="mailto:${contactUsEmail}" 
                            style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-size: 16px; display: inline-block;">
                            Contact Support
                        </a>
                    </div>

                    <hr style="margin: 20px 0; border: 0; border-top: 1px solid #ddd;">

                    <p style="font-size: 12px; color: #757575;">
                        If you did not request this refund, please contact us immediately at <a href="mailto:${contactUsEmail}" style="color: #4CAF50;">${contactUsEmail}</a>.
                    </p>

                    <p style="font-size: 12px; color: #757575;">Best regards,<br><strong>XclusiveXperienceAfrica Team</strong></p>
                </div>

                <footer style="margin-top: 20px; text-align: center; font-size: 12px; color: #9e9e9e;">
                    <p>Contact us: <a href="mailto:${contactUsEmail}" style="color: #4CAF50;">${contactUsEmail}</a></p>
                    <p>© ${new Date().getFullYear()} XclusiveXperienceAfrica. All rights reserved.</p>
                </footer>
            </div>
        `,
    };

    transporter.sendMail(mailOptions, (err, info) => {
        if (err) console.error("Error sending refund confirmation email:", err);
        else console.log("Refund confirmation email sent:", info.response);
    });
};


module.exports = {
    sendVerificationEmail,
    sendContactUsEmail,
    sendOTPEmail,
    sendChatNotificationEmail,
    sendPurchaseConfirmationEmail,
    sendAdminBookingNotification,
    sendCredentialsEmail,
    sendRefundConfirmationEmail,
};