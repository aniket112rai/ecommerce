# ChorBazar Payment and Order Support Guide

Last reviewed: 19 October 2026. This guide describes the current repository implementation. It is general support information, not a live order lookup.

## Payment methods

The checkout UI offers Cash on Delivery (COD), UPI, and CARD choices. COD orders are placed directly by the backend. Online payments (including the UPI and CARD choices) are processed through Razorpay Checkout; the selected online instrument is handled within Razorpay.

## COD order flow

The signed-in user chooses a saved address and submits cart items. The server validates that the address belongs to that user, validates product IDs, positive quantities and available stock, and calculates the total from current database prices. It reduces stock in a database transaction, creates an order with status `Confirmed`, creates a payment with provider `COD` and status `COD Pending`, then clears the cart. COD means payment is due on delivery; it does not mean an online payment has been captured.

## Razorpay order flow

The signed-in user chooses an address and starts Razorpay checkout. The server validates the address, items, quantities, and stock, calculates the total from database prices, creates a Razorpay order in INR, and stores an app order with status `Payment Pending` and payment status `Created`. Stock is not reduced at this initial step.

After checkout, the browser submits the Razorpay order ID, payment ID, and signature to the server. The server verifies the HMAC signature with the Razorpay secret and checks that the app order belongs to the signed-in user and matches the Razorpay order. On success it reduces stock, marks payment `Paid`, changes order status to `Confirmed`, and clears the cart. A repeated verification for an already `Paid` payment returns the order.

## Payment succeeded but order still pending, or no confirmation appeared

The browser success callback and server verification are separate steps. If money appears debited but ChorBazar still shows `Payment Pending`, or the browser reported a verification error, first open **My Orders** and refresh the order details. Keep the order ID, payment ID, amount, and payment time. Contact store support with those references so the payment/order can be checked. Do not pay again until the first attempt has been checked. Never share an OTP, CVV, password, full card number, or UPI PIN in chat or support messages.

This application does not implement a Razorpay webhook or automated payment-status reconciliation in the current code, so the assistant must not claim it can confirm a specific transaction or repair an order.

## Cancellation eligibility

Users can cancel their own order while it is not already cancelled, shipped, or delivered. Admin cancellation uses the same refund logic. Shipped and delivered orders cannot be cancelled by this flow. A COD or unpaid order does not issue a payment refund. The application attempts to restock items for a cancelled order except when the original order status was `Payment Pending`.

## Razorpay refunds

For an order whose payment is recognized as paid, automatic cancellation is supported only when provider is Razorpay and a Razorpay payment ID exists. Before contacting Razorpay, the app claims the refund as `Processing` to prevent a concurrent duplicate attempt. It requests a full-amount refund with speed `normal`.

If Razorpay returns the refund as `processed`, payment status becomes `Refunded`. If the gateway returns a non-processed state, payment status becomes `Refund Pending`; the returned gateway state is saved in `refundStatus`. If Razorpay rejects the request, the order is not cancelled by that attempt and the payment refund status records `Failed: ...`. A repeated request while processing or after refund is rejected to avoid issuing another refund. If the gateway refund succeeds but the database update fails, the app attempts to save the gateway refund ID so a retry does not issue a duplicate.

## Refund timing

The code requests a Razorpay `normal` refund but does not define or guarantee a number of hours or days for funds to appear in the customer’s account. Timing depends on the payment instrument and payment provider/bank. Check the refund status in My Orders and the original payment source. If the refund is still pending or not visible, contact support with order ID, payment ID, and refund ID if shown. The AI must not promise a specific refund deadline.

## Status meanings

- Order `Payment Pending`: Razorpay checkout order exists, but successful verification has not been recorded by the app.
- Order `Confirmed`: order has been recorded successfully; for Razorpay the payment was signature-verified. For COD, payment remains due on delivery.
- Order `Cancelled`: cancellation completed in the app. Check the payment status separately to know whether a refund is processing or completed.
- Payment `Created`: Razorpay payment/order setup exists; it is not proof of successful payment.
- Payment `Paid`: payment verification succeeded in the app.
- Payment `COD Pending`: COD order exists and payment is due on delivery.
- Payment `Processing`: refund request is being claimed/processed.
- Payment `Refund Pending`: Razorpay accepted/returned a refund state that is not yet `processed`.
- Payment `Refunded`: Razorpay returned the `processed` state.
- Payment refundStatus beginning `Failed:`: the refund request failed; the cancellation flow reports the gateway error.

## Where to check

Sign in and open **My Orders** to view orders, order status, payment status, and order details. The payment detail page can show provider, payment status, amount, and associated order status when the payment ID is available. The app has no public tracking lookup in the current implementation.

## Configuration and support assistant limits

The support chat uses a Python FastAPI service with LangChain, OpenAI chat/embedding models, and Pinecone retrieval. It answers from this guide. It does not access the commerce database or fetch a customer’s transaction. If the guide does not answer a question, it should direct the customer to My Orders and store support rather than inventing policy or timing.

