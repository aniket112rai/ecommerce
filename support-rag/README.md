# Payment and order support API

FastAPI + LangChain retrieval API. The support guide is embedded through AICredits/OpenAI and persisted in a local Chroma database. Pinecone is not used.

## Setup

Use Python 3.13. From this directory, create/activate the virtual environment and install dependencies:

```bash
python3.13 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
```

Create `.env` only if it does not exist by copying `.env.example`; otherwise edit the existing file and preserve your secret key. For an AICredits key, configure:

```dotenv
OPENAI_API_KEY=your_aicredits_api_key
OPENAI_BASE_URL=https://api.aicredits.in/v1
OPENAI_MODEL=openai/gpt-4o-mini
OPENAI_EMBEDDING_MODEL=openai/text-embedding-3-small
CHROMA_PERSIST_DIRECTORY=./chroma_db
CHROMA_COLLECTION=payment-order-support
FRONTEND_ORIGIN=http://localhost:5173
```

AICredits keys must be sent to the AICredits base URL, with the provider-qualified model IDs shown above. Refer to the [AICredits Quickstart](https://aicredits.in/docs/quickstart) and [API reference](https://aicredits.in/docs/api-reference). For a direct OpenAI API key, omit `OPENAI_BASE_URL` and use regular OpenAI model names. Keep `.env` private and never put the key in the browser/frontend.

## Run

From this directory, with `.venv` active:

```bash
python -m uvicorn app:app --reload --port 8000
```

The API is available at `http://localhost:8000`. Check it with:

```bash
curl http://localhost:8000/health
```

In another terminal, ingest or refresh the checked-in payment/order guide:

```bash
cd support-rag
source .venv/bin/activate
curl -X POST http://localhost:8000/api/admin/ingest
```

The first ingestion creates the local `chroma_db` directory and stores vectors in the `payment-order-support` collection. Reingest after changing the source guide. Embedding requests use the configured provider and may consume account credits.

## Endpoints

- `GET /health` — service health
- `POST /api/chat` — accepts `{ "message": "Payment debited but order is pending" }`
- `POST /api/admin/ingest` — embeds the guide and writes it to local Chroma

The assistant answers general support questions from the checked-in guide. It does not access customer orders or payments. Ingestion is currently a local development endpoint; protect it with admin authentication before exposing the service beyond localhost.

## Troubleshooting

- `AuthenticationError`: verify the key and that the configured base URL matches its provider. AICredits keys need `https://api.aicredits.in/v1`.
- `NotFoundError` for a model: verify the model ID and provider prefix; AICredits uses IDs such as `openai/gpt-4o-mini` and `openai/text-embedding-3-small`.
- Address already in use: stop the existing Uvicorn process with `Ctrl+C`, then start one server on port 8000.
- Ingestion errors: read the Uvicorn terminal traceback. Do not share `.env` or API keys when asking for help.
