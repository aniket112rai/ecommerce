# ChorBazar frontend

React 19 and Vite storefront. The frontend expects the Express backend at `http://localhost:3000` and the payment/order support API at `http://localhost:8000`.

## Run locally

From this directory:

```bash
npm install
npm run dev
```

Open the Vite URL printed in the terminal (normally `http://localhost:5173`). Run the Node backend and Python support service in separate terminals; see the [project setup guide](../README.md).

The home page contains a **Chat with AI support** link to `/support`. The chat calls `POST http://localhost:8000/api/chat`. To use another support API address, set `VITE_SUPPORT_API_URL` in a frontend `.env` file. Never put OpenAI/AICredits secrets in frontend environment variables: Vite variables are shipped to the browser.

## Available scripts

- `npm run dev` — start Vite development server
- `npm run build` — create the production frontend build
- `npm run lint` — run ESLint
- `npm run preview` — preview a production build
