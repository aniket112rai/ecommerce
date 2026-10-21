CREATE TABLE "RazorpayWebhookEvent" (
    "eventId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RazorpayWebhookEvent_pkey" PRIMARY KEY ("eventId")
);
