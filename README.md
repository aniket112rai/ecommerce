# ChorBazar

An ecommerce app with a React/Vite frontend, Express/Prisma backend, Razorpay checkout, and an optional Python payment/order support assistant.

## Requirements

- Node.js and npm
- Python 3.13 for the support assistant
- PostgreSQL database
- Razorpay credentials for online checkout/refunds
- An AICredits API key (or an OpenAI API key) for AI support

## Configure the backend

Create `backend/.env` with your own values. Do not commit this file or paste its secrets into chat.

```dotenv
DATABASE_URL="your_postgresql_connection_url"
JWT_SECRET="your_secret_key"
GOOGLE_CLIENT_ID="optional_google_client_id"
RAZORPAY_API_KEY="your_razorpay_key_id"
RAZORPAY_SECRET="your_razorpay_key_secret"
```

Start the Express API in Terminal 1 from the project root:

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate deploy
node index.js
```

The API runs at `http://localhost:3000`.

## Configure the AI support service

The assistant uses FastAPI and LangChain with a local persistent Chroma vector database. It does not need a Pinecone account, key, or hosted index. Chroma data is stored in `support-rag/chroma_db`.

For AICredits, create or edit `support-rag/.env` with your own API key and these settings:

```dotenv
OPENAI_API_KEY=your_aicredits_api_key
OPENAI_BASE_URL=https://api.aicredits.in/v1
OPENAI_MODEL=openai/gpt-4o-mini
OPENAI_EMBEDDING_MODEL=openai/text-embedding-3-small
CHROMA_PERSIST_DIRECTORY=./chroma_db
CHROMA_COLLECTION=payment-order-support
FRONTEND_ORIGIN=http://localhost:5173
```

AICredits requires its OpenAI-compatible base URL and provider-qualified model names. See the [AICredits Quickstart](https://aicredits.in/docs/quickstart). If using an official OpenAI API key instead, omit `OPENAI_BASE_URL` and use the regular model IDs. Keep API keys on the Python server; never put them in frontend variables.

Start the service in Terminal 2 from the project root:

```bash
cd support-rag
python3.13 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
```

If `support-rag/.env` does not exist, copy `.env.example` to `.env` and fill it in. Do not overwrite an existing `.env`. Then start the API:

```bash
python -m uvicorn app:app --reload --port 8000
```

In Terminal 3, ingest the payment/order guide into local Chroma. Run this again after updating the guide:

```bash
cd support-rag
source .venv/bin/activate
curl -X POST http://localhost:8000/api/admin/ingest
```

Success returns a JSON response with `"status":"ingested"`. If ingestion fails, inspect the Uvicorn terminal for its traceback; the HTTP response includes the exception type. Ingestion calls the configured embeddings API, so the key must have access to the configured embedding model and available credits.

## Start the frontend

Start the Vite app in Terminal 4 from the project root:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` and use **Chat with AI support** on the home page. The Node backend, Python support API, and frontend must all be running for the full site and assistant to work.

## Payment and order support guide

The support knowledge source is [`support-rag/knowledge/payment-orders.md`](support-rag/knowledge/payment-orders.md). The customer-facing PDF is [`docs/payment-order-support-guide.pdf`](docs/payment-order-support-guide.pdf). The assistant answers general policy questions only; it does not access private order/payment records and must not promise a specific refund credit deadline.

## Current commerce features

- Stock reduction after order
- Cart clear after checkout
- User/admin separation
- Product search pagination and sorting
- User order cancellation
- Razorpay checkout for online payments
- Razorpay refund request when a paid order is cancelled from user/admin order screens
