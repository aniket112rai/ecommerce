import crypto from "crypto";
import Razorpay from "razorpay";

const getRazorpayConfig = () => {
  const keyId = process.env.RAZORPAY_API_KEY || process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_SECRET || process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("Razorpay credentials are not configured");
  }

  return { keyId, keySecret };
};

export const getRazorpayKeyId = () => getRazorpayConfig().keyId;

export const getRazorpayInstance = () => {
  const { keyId, keySecret } = getRazorpayConfig();

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
};

export const verifyRazorpaySignature = ({
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
}) => {
  const { keySecret } = getRazorpayConfig();
  const body = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expectedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(body)
    .digest("hex");

  const supplied = Buffer.from(String(razorpaySignature || ""), "hex");
  const expected = Buffer.from(expectedSignature, "hex");
  return supplied.length === expected.length && crypto.timingSafeEqual(supplied, expected);
};

export const verifyRazorpayWebhookSignature = (rawBody, signature) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !Buffer.isBuffer(rawBody) || !signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest();
  let supplied;
  try { supplied = Buffer.from(signature, "hex"); } catch { return false; }
  return supplied.length === expected.length && crypto.timingSafeEqual(supplied, expected);
};

export const refundRazorpayPayment = async ({ paymentId, amount }) => {
  const razorpay = getRazorpayInstance();

  return razorpay.payments.refund(paymentId, {
    amount: Math.round(Number(amount) * 100),
    speed: "normal",
  });
};
