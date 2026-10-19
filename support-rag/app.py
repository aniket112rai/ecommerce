import os
import logging
import hashlib
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

load_dotenv()
logger = logging.getLogger("chorbazar-support")

app = FastAPI(title="ChorBazar Payment and Order Support API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)


@app.get("/health")
def health():
    return {"status": "ok", "service": "chorbazar-support-rag"}


@app.post("/api/chat")
def chat(request: ChatRequest):
    if not os.getenv("OPENAI_API_KEY"):
        raise HTTPException(status_code=503, detail="Support assistant is not configured yet. Please contact store support.")

    try:
        from langchain.chains import create_retrieval_chain
        from langchain.chains.combine_documents import create_stuff_documents_chain
        from langchain_core.prompts import ChatPromptTemplate
        from langchain_openai import ChatOpenAI, OpenAIEmbeddings
        from langchain_chroma import Chroma

        base_url = os.getenv("OPENAI_BASE_URL") or None
        embeddings = OpenAIEmbeddings(
            model=os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small"),
            base_url=base_url,
        )
        store = Chroma(
            collection_name=os.getenv("CHROMA_COLLECTION", "payment-order-support"),
            embedding_function=embeddings,
            persist_directory=os.getenv("CHROMA_PERSIST_DIRECTORY", "./chroma_db"),
        )
        prompt = ChatPromptTemplate.from_messages([
            ("system", "You are ChorBazar's payment and order support assistant. Answer in the user's language (English, Hindi, or Hinglish). Use only the retrieved support guide. Never claim to look up a personal order or payment. Never request or accept OTP, CVV, UPI PIN, passwords, or full card details. Do not invent refund timelines: explain the guide says no guaranteed deadline and recommend checking My Orders/original payment source and contacting support with order/payment/refund IDs. If the guide lacks the answer, say so and direct the user to My Orders and store support. Keep answers concise.\n\nGuide context:\n{context}"),
            ("human", "{input}"),
        ])
        llm = ChatOpenAI(
            model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
            base_url=base_url,
            temperature=0.2,
        )
        qa = create_retrieval_chain(
            store.as_retriever(search_kwargs={"k": 4}),
            create_stuff_documents_chain(llm, prompt),
        )
        result = qa.invoke({"input": request.message})
        return {"answer": result["answer"]}
    except Exception as exc:
        raise HTTPException(status_code=503, detail="The support assistant is temporarily unavailable. Please check My Orders or contact store support.") from exc


@app.post("/api/admin/ingest")
def ingest():
    """Upsert the checked-in support guide into the local persistent Chroma store."""
    if not os.getenv("OPENAI_API_KEY"):
        raise HTTPException(status_code=503, detail="Set OPENAI_API_KEY in support-rag/.env before ingestion.")
    try:
        from langchain_community.document_loaders import TextLoader
        from langchain_text_splitters import RecursiveCharacterTextSplitter
        from langchain_openai import OpenAIEmbeddings
        from langchain_chroma import Chroma

        guide = Path(__file__).parent / "knowledge" / "payment-orders.md"
        docs = TextLoader(str(guide), encoding="utf-8").load()
        chunks = RecursiveCharacterTextSplitter(chunk_size=900, chunk_overlap=150).split_documents(docs)
        store = Chroma(
            collection_name=os.getenv("CHROMA_COLLECTION", "payment-order-support"),
            embedding_function=OpenAIEmbeddings(
                model=os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small"),
                base_url=os.getenv("OPENAI_BASE_URL") or None,
            ),
            persist_directory=os.getenv("CHROMA_PERSIST_DIRECTORY", "./chroma_db"),
        )
        ids = [
            hashlib.sha256(f"{index}:{chunk.page_content}".encode("utf-8")).hexdigest()
            for index, chunk in enumerate(chunks)
        ]
        store.add_documents(chunks, ids=ids)
        return {"status": "ingested", "chunks": len(chunks), "store": "local Chroma"}
    except Exception as exc:
        logger.exception("Knowledge guide ingestion failed (%s)", type(exc).__name__)
        raise HTTPException(
            status_code=503,
            detail=f"Local Chroma ingestion failed ({type(exc).__name__}). Check the Python server terminal for details.",
        ) from exc
