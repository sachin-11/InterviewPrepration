# ============================================================
# LangChain RAG Chain — Retrieval Augmented Generation
# Run: python 03_langchain/03_rag_chain.py
# ============================================================
# RAG = LLM ko relevant documents ke saath answer karna
# Ye AI engineering ka CORE concept hai
# ============================================================

print("=" * 60)
print("LANGCHAIN RAG — RETRIEVAL AUGMENTED GENERATION")
print("=" * 60)

# ============================================================
# RAG KYA HAI? — VISUAL EXPLANATION
# ============================================================
print("""
RAG FLOW:
═══════════════════════════════════════════════════════════

User Question: "What is our refund policy?"

STEP 1 — RETRIEVAL:
  Question → Embedding Model → Query Vector [0.2, 0.8, ...]
  Query Vector → Vector DB → Top 3 Similar Documents
  
  Retrieved Docs:
  - "Refunds are processed within 7 days..."
  - "To request a refund, contact support..."
  - "Items must be returned within 30 days..."

STEP 2 — AUGMENTATION:
  Prompt = System + Retrieved Docs + User Question
  
  "You are a helpful assistant.
   
   Context:
   [Doc 1] Refunds are processed within 7 days...
   [Doc 2] To request a refund, contact support...
   [Doc 3] Items must be returned within 30 days...
   
   Question: What is our refund policy?"

STEP 3 — GENERATION:
  LLM → "Our refund policy allows returns within 30 days.
          Refunds are processed in 7 days. Contact support
          to initiate a refund request."

═══════════════════════════════════════════════════════════
WHY RAG?
- LLM ki training cutoff ke baad ki info nahi hoti
- Company-specific data LLM ko pata nahi
- RAG se LLM ko real-time, specific knowledge milti hai
═══════════════════════════════════════════════════════════
""")

# ============================================================
# RAG COMPONENTS
# ============================================================
print("--- RAG Components ---")
print("""
1. DOCUMENT LOADER — Documents padhna
─────────────────────────────────────
from langchain_community.document_loaders import (
    TextLoader,          # .txt files
    PyPDFLoader,         # PDF files
    CSVLoader,           # CSV files
    WebBaseLoader,       # Websites
    DirectoryLoader,     # Pura folder
)

loader = PyPDFLoader("company_docs.pdf")
documents = loader.load()
# documents = list of Document objects
# Document = {page_content: "...", metadata: {source: "...", page: 1}}

─────────────────────────────────────
2. TEXT SPLITTER — Documents ko chunks mein todna
─────────────────────────────────────
from langchain.text_splitter import RecursiveCharacterTextSplitter

splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,      # har chunk max 1000 characters
    chunk_overlap=200,    # chunks ke beech 200 char overlap
    # WHY OVERLAP? Context boundary pe information cut na ho
)

chunks = splitter.split_documents(documents)
# 1 document → many smaller chunks

─────────────────────────────────────
3. EMBEDDINGS — Text ko vectors mein convert karna
─────────────────────────────────────
from langchain_openai import OpenAIEmbeddings

embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
# "Hello world" → [0.23, -0.45, 0.87, ...] (1536 floats)

─────────────────────────────────────
4. VECTOR STORE — Embeddings store karna
─────────────────────────────────────
from langchain_community.vectorstores import Chroma, FAISS, Pinecone

# In-memory (development ke liye)
vectorstore = FAISS.from_documents(chunks, embeddings)

# Persistent (production ke liye)
vectorstore = Chroma.from_documents(
    chunks, 
    embeddings,
    persist_directory="./chroma_db"
)

─────────────────────────────────────
5. RETRIEVER — Relevant chunks dhundna
─────────────────────────────────────
retriever = vectorstore.as_retriever(
    search_type="similarity",  # ya "mmr" (diversity ke liye)
    search_kwargs={"k": 3}     # top 3 chunks return karo
)

relevant_docs = retriever.invoke("What is refund policy?")
""")

# ============================================================
# COMPLETE RAG CHAIN CODE
# ============================================================
print("--- Complete RAG Chain ---")
print("""
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough

# Setup
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
embeddings = OpenAIEmbeddings()

# Documents load aur index karo (ek baar)
from langchain_community.document_loaders import TextLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter

loader = TextLoader("company_docs.txt")
docs = loader.load()
splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
chunks = splitter.split_documents(docs)
vectorstore = FAISS.from_documents(chunks, embeddings)
retriever = vectorstore.as_retriever(search_kwargs={"k": 3})

# RAG Prompt
rag_prompt = ChatPromptTemplate.from_messages([
    ("system", \"\"\"You are a helpful assistant. Answer based ONLY on the context below.
If the answer is not in the context, say "I don't have that information."

Context:
{context}\"\"\"),
    ("human", "{question}")
])

# Context format karna
def format_docs(docs):
    return "\\n\\n".join(doc.page_content for doc in docs)

# RAG Chain
rag_chain = (
    {
        "context": retriever | format_docs,  # Question → retrieve → format
        "question": RunnablePassthrough()    # Question as-is pass karo
    }
    | rag_prompt
    | llm
    | StrOutputParser()
)

# Use karo
answer = rag_chain.invoke("What is the refund policy?")
print(answer)
""")

# ============================================================
# RAG EVALUATION
# ============================================================
print("--- RAG Evaluation Metrics ---")
print("""
RAG ko evaluate karne ke 3 main metrics:

1. FAITHFULNESS — Answer context se hai ya hallucinated?
   Score: 0-1 (1 = fully grounded in context)

2. ANSWER RELEVANCY — Answer question ka jawab deta hai?
   Score: 0-1 (1 = perfectly relevant)

3. CONTEXT RECALL — Sahi documents retrieve hue?
   Score: 0-1 (1 = all relevant docs retrieved)

Tool: RAGAS library
  from ragas import evaluate
  from ragas.metrics import faithfulness, answer_relevancy
  
  results = evaluate(
      dataset,
      metrics=[faithfulness, answer_relevancy]
  )
""")

print("✅ LangChain RAG Complete!")
