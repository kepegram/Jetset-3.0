/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {initializeApp} from "firebase-admin/app";
import {FieldValue} from "firebase-admin/firestore";
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
  await transporter.sendMail({
    from: functions.config().mail.user,
    to: email,
    subject: "Your Verification Code",
    text: `Your verification code is: ${code}`,
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
      return {success: true};
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("Error sending verification email:", errorMessage);
      await snap.ref.update({
        emailSent: false,
        error: errorMessage,
      });
      return {success: false, error: errorMessage};
    }
  });

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
