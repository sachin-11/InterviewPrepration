# ============================================================
# LangChain Chains — LCEL Deep Dive
# Run: python 03_langchain/02_chains.py
# ============================================================
# Ye file RUNNABLE hai bina API key ke (mock LLM use karta hai)
# Real LLM ke liye: OPENAI_API_KEY set karo
# ============================================================

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough, RunnableLambda

print("=" * 60)
print("LANGCHAIN CHAINS — LCEL DEEP DIVE")
print("=" * 60)

# ============================================================
# CHAIN TYPES — VISUAL EXPLANATION
# ============================================================

print("""
CHAIN TYPES:
═══════════════════════════════════════════════════════════

1. SIMPLE CHAIN (Linear)
   Input → Prompt → LLM → Parser → Output
   
   chain = prompt | llm | parser
   result = chain.invoke({"topic": "AI"})

2. SEQUENTIAL CHAIN (Multi-step)
   Input → Chain1 → Chain2 → Chain3 → Output
   
   # Step 1: Topic se outline banana
   outline_chain = outline_prompt | llm | parser
   
   # Step 2: Outline se article banana
   article_chain = article_prompt | llm | parser
   
   # Combine: Step 1 ka output Step 2 ka input
   full_chain = outline_chain | article_chain

3. PARALLEL CHAIN (Multiple paths)
   Input ──→ Chain A ──→ Combine → Output
          └─→ Chain B ──┘
   
   from langchain_core.runnables import RunnableParallel
   parallel = RunnableParallel(
       pros=pros_chain,
       cons=cons_chain
   )

4. CONDITIONAL CHAIN (Branching)
   Input → Classifier → if "technical" → Tech Chain
                      → if "simple"    → Simple Chain

═══════════════════════════════════════════════════════════
""")

# ============================================================
# RUNNABLE PASSTHROUGH — DATA FORWARD KARNA
# ============================================================
print("--- RunnablePassthrough Demo ---")

# RunnablePassthrough — input ko as-is forward karta hai
# WHY: Jab chain mein original input bhi chahiye alongside processed data

passthrough_demo = RunnablePassthrough()
result = passthrough_demo.invoke({"name": "Alice", "age": 28})
print(f"RunnablePassthrough output: {result}")
# Output: {"name": "Alice", "age": 28} — unchanged

# ============================================================
# RUNNABLE LAMBDA — CUSTOM FUNCTION IN CHAIN
# ============================================================
print("\n--- RunnableLambda Demo ---")

# RunnableLambda — koi bhi Python function ko chain mein use karo
def add_context(input_dict: dict) -> dict:
    """Input mein extra context add karta hai."""
    input_dict["context"] = "You are helping a beginner Python developer."
    return input_dict

lambda_chain = RunnableLambda(add_context)
result = lambda_chain.invoke({"question": "What is a list?"})
print(f"After lambda: {result}")

# ============================================================
# COMPLETE CHAIN EXAMPLE (Mock LLM)
# ============================================================
print("\n--- Complete Chain Example ---")

# Mock LLM — API key ke bina test karne ke liye
class MockLLM:
    """
    Fake LLM for testing without API key.
    Real code mein: ChatOpenAI(model="gpt-4o-mini")
    """
    def invoke(self, messages) -> object:
        # Messages se last human message nikalo
        if hasattr(messages, 'messages'):
            last_msg = messages.messages[-1].content
        else:
            last_msg = str(messages)
        
        # Fake response
        class FakeResponse:
            content = f"[Mock Response] I received: '{last_msg[:50]}...'"
        return FakeResponse()
    
    def __or__(self, other):
        """| operator support karne ke liye."""
        from langchain_core.runnables import RunnableSequence
        return RunnableSequence(first=self, last=other)

# ============================================================
# CHAIN PATTERNS — CODE EXAMPLES
# ============================================================
print("""
PRODUCTION CHAIN PATTERNS:
═══════════════════════════════════════════════════════════

# Pattern 1: Simple Q&A Chain
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

qa_chain = (
    ChatPromptTemplate.from_template("Answer this question: {question}")
    | llm
    | StrOutputParser()
)

answer = qa_chain.invoke({"question": "What is LangChain?"})

─────────────────────────────────────────────────────────

# Pattern 2: Translation Chain
translate_chain = (
    ChatPromptTemplate.from_messages([
        ("system", "Translate to {language}. Only return translation."),
        ("human", "{text}")
    ])
    | llm
    | StrOutputParser()
)

result = translate_chain.invoke({
    "language": "Hindi",
    "text": "Hello, how are you?"
})

─────────────────────────────────────────────────────────

# Pattern 3: Parallel Chain (Multiple outputs)
from langchain_core.runnables import RunnableParallel

analysis_chain = RunnableParallel(
    sentiment=sentiment_chain,    # positive/negative
    summary=summary_chain,        # 1 line summary
    keywords=keywords_chain       # key topics
)

result = analysis_chain.invoke({"review": "Great product!"})
# result = {
#   "sentiment": "positive",
#   "summary": "Customer loved the product",
#   "keywords": ["great", "product"]
# }

─────────────────────────────────────────────────────────

# Pattern 4: Streaming (Real-time output)
for chunk in qa_chain.stream({"question": "Explain AI"}):
    print(chunk, end="", flush=True)
# Output appears word by word (like ChatGPT)

═══════════════════════════════════════════════════════════
""")

# ============================================================
# CHAIN DEBUGGING
# ============================================================
print("--- Chain Debugging Tips ---")
print("""
# 1. Intermediate steps dekhna
chain.invoke({"input": "..."}, config={"callbacks": [...]})

# 2. LangSmith — LangChain ka official debugging tool
import os
os.environ["LANGCHAIN_TRACING_V2"] = "true"
os.environ["LANGCHAIN_API_KEY"] = "your_key"
# Ab sab chains automatically trace honge

# 3. Verbose mode
llm = ChatOpenAI(verbose=True)  # har call log hoga

# 4. Step by step test karo
# Pehle prompt test karo:
messages = prompt.invoke({"topic": "AI"})
print(messages)

# Phir LLM test karo:
response = llm.invoke(messages)
print(response.content)

# Phir parser test karo:
output = parser.invoke(response)
print(output)
""")

print("✅ LangChain Chains Complete!")
