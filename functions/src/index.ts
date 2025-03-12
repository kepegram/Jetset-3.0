/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { initializeApp } from "firebase-admin/app";
import { FieldValue } from "firebase-admin/firestore";
import * as functions from "firebase-functions/v1";
import * as nodemailer from "nodemailer";

initializeApp();

// Create a nodemailer transporter using Zoho
const transporter = nodemailer.createTransport({
  host: "smtp.zoho.com",
  port: 465,
  secure: true, // use SSL
  auth: {
    user: functions.config().mail.user,
    pass: functions.config().mail.password,
  },
});

interface VerificationData {
  code: string;
  email: string;
}

/**
 * Sends a verification email to the user with their verification code.
 * @param {string} email - The recipient's email address
 * @param {string} code - The verification code to send
 * @return {Promise<void>} A promise that resolves when the email is sent
 */
async function sendVerificationEmail(
  email: string,
  code: string
): Promise<void> {
  const styles = {
    container:
      "font-family: Arial, sans-serif; max-width: 600px; " +
      "margin: 0 auto; padding: 20px;",
    header: "text-align: center; margin-bottom: 30px;",
    title: "color: #3BACE3; margin-bottom: 10px;",
    subtitle: "color: #666; font-size: 16px;",
    codeBox:
      "background-color: #f8f9fa; border-radius: 10px; " +
      "padding: 30px; text-align: center; margin-bottom: 30px;",
    codeTitle: "color: #333; margin-bottom: 20px;",
    code:
      "font-size: 32px; font-weight: bold; letter-spacing: 8px; " +
      "color: #3BACE3; margin-bottom: 20px;",
    footer: "text-align: center; color: #666; font-size: 14px;",
    hr: "border: none; border-top: 1px solid #eee; margin: 20px 0;",
  };

  const htmlContent = `
<div style="${styles.container}">
  <div style="${styles.header}">
    <h1 style="${styles.title}">Two-Factor Authentication Required</h1>
    <p style="${styles.subtitle}">Please enter this code to complete your sign in</p>
  </div>
  
  <div style="${styles.codeBox}">
    <h2 style="${styles.codeTitle}">Your Authentication Code</h2>
    <div style="${styles.code}">${code}</div>
    <p style="${styles.subtitle}">This code will expire in 5 minutes</p>
  </div>
  
  <div style="${styles.footer}">
    <p>If you didn't attempt to sign in, please secure your account immediately.</p>
    <hr style="${styles.hr}">
    <p>© ${new Date().getFullYear()} Jetset. All rights reserved.</p>
  </div>
</div>`;

  await transporter.sendMail({
    from: `"Jetset Security" <${functions.config().mail.user}>`,
    to: email,
    subject: "Jetset - Two-Factor Authentication Code",
    text: `Your authentication code is: ${code}`,
    html: htmlContent,
  });
}

// Cloud Function triggered when a new verification code is created
export const sendVerificationCode = functions.firestore
  .document("verificationCodes/{userId}")
  .onCreate(async (snap, context) => {
    const data = snap.data() as VerificationData;
    const userId = context.params.userId;
    const verificationCode = data.code;
    const userEmail = data.email;

    try {
      await sendVerificationEmail(userEmail, verificationCode);
      await snap.ref.update({
        emailSent: true,
        emailSentTimestamp: FieldValue.serverTimestamp(),
        userId: userId,
      });
      return { success: true };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("Error sending verification email:", errorMessage);
      await snap.ref.update({
        emailSent: false,
        error: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  });

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
