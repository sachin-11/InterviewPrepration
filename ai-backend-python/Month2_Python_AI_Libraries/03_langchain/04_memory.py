# ============================================================
# LangChain Memory — Conversation History
# Run: python 03_langchain/04_memory.py
# ============================================================

print("=" * 60)
print("LANGCHAIN MEMORY — CONVERSATION HISTORY")
print("=" * 60)

print("""
MEMORY KYA HAI?
═══════════════════════════════════════════════════════════

LLM stateless hota hai — har call independent hai.
Memory se hum conversation history track karte hain.

WITHOUT MEMORY:
  User: "My name is Alice"
  Bot:  "Nice to meet you, Alice!"
  User: "What's my name?"
  Bot:  "I don't know your name."  ← Problem!

WITH MEMORY:
  User: "My name is Alice"
  Bot:  "Nice to meet you, Alice!"
  User: "What's my name?"
  Bot:  "Your name is Alice."  ← Correct!

═══════════════════════════════════════════════════════════

MEMORY TYPES:
─────────────────────────────────────────────────────────

1. ConversationBufferMemory — Puri history store karo
   Pros: Complete context
   Cons: Token limit exceed ho sakta hai long conversations mein
   Use: Short conversations, demos

2. ConversationBufferWindowMemory — Last N messages
   Pros: Token limit control
   Cons: Purani info lost ho jaati hai
   Use: Customer support bots

3. ConversationSummaryMemory — History ko summarize karo
   Pros: Long conversations handle kar sakta hai
   Cons: LLM call lagta hai summarize karne ke liye
   Use: Long-running assistants

4. ConversationTokenBufferMemory — Token count ke hisaab se
   Pros: Exact token control
   Cons: Complex setup
   Use: Production apps with cost control

═══════════════════════════════════════════════════════════
""")

# ============================================================
# MEMORY IMPLEMENTATION
# ============================================================
print("--- Memory Implementation ---")
print("""
# Modern LangChain mein memory (v0.2+)
# RunnableWithMessageHistory use karo

from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.chat_history import BaseChatMessageHistory
from langchain_community.chat_message_histories import ChatMessageHistory
from langchain_core.runnables.history import RunnableWithMessageHistory

llm = ChatOpenAI(model="gpt-4o-mini")

# Prompt mein {history} placeholder
prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a helpful assistant."),
    MessagesPlaceholder(variable_name="history"),  # ← History yahan inject hogi
    ("human", "{input}"),
])

chain = prompt | llm

# Session-wise history store karo
# Production mein: Redis, PostgreSQL use karo
session_store = {}

def get_session_history(session_id: str) -> BaseChatMessageHistory:
    if session_id not in session_store:
        session_store[session_id] = ChatMessageHistory()
    return session_store[session_id]

# Chain ko memory ke saath wrap karo
chain_with_memory = RunnableWithMessageHistory(
    chain,
    get_session_history,
    input_messages_key="input",
    history_messages_key="history",
)

# Use karo
config = {"configurable": {"session_id": "user_123"}}

response1 = chain_with_memory.invoke(
    {"input": "My name is Alice"},
    config=config
)
print(response1.content)

response2 = chain_with_memory.invoke(
    {"input": "What's my name?"},
    config=config
)
print(response2.content)  # "Your name is Alice"
""")

# ============================================================
# MEMORY IN PRODUCTION
# ============================================================
print("--- Memory in Production ---")
print("""
PRODUCTION MEMORY STORAGE:

1. Redis (Fast, in-memory)
   from langchain_community.chat_message_histories import RedisChatMessageHistory
   
   history = RedisChatMessageHistory(
       session_id="user_123",
       url="redis://localhost:6379"
   )

2. PostgreSQL (Persistent)
   from langchain_community.chat_message_histories import PostgresChatMessageHistory
   
   history = PostgresChatMessageHistory(
       connection_string="postgresql://user:pass@localhost/db",
       session_id="user_123"
   )

3. MongoDB
   from langchain_mongodb.chat_message_histories import MongoDBChatMessageHistory
   
   history = MongoDBChatMessageHistory(
       connection_string="mongodb://localhost:27017",
       session_id="user_123",
       database_name="chat_db",
       collection_name="messages"
   )

WHY EXTERNAL STORAGE?
- Server restart pe memory lost nahi hogi
- Multiple server instances share kar sakti hain memory
- User ka history persist hoga across sessions
""")

print("✅ LangChain Memory Complete!")
