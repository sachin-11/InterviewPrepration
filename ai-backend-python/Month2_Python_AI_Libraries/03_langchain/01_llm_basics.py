# ============================================================
# LangChain Basics — LLM Calls aur Prompts
# Run: python 03_langchain/01_llm_basics.py
# ============================================================
# NOTE: Ye file run karne ke liye OPENAI_API_KEY chahiye
# .env file mein: OPENAI_API_KEY=your_key_here
# ============================================================

import os
from dotenv import load_dotenv

# .env file se API key load karo
# WHY: API keys code mein hardcode mat karo — security risk!
load_dotenv()

# ============================================================
# CONCEPT 1: BASIC LLM CALL
# ============================================================
print("=" * 60)
print("LANGCHAIN BASICS — LLM CALLS")
print("=" * 60)

# LangChain ke bina (raw OpenAI)
print("\n--- Without LangChain (Raw OpenAI) ---")
print("""
from openai import OpenAI
client = OpenAI()
response = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[{"role": "user", "content": "What is Python?"}]
)
text = response.choices[0].message.content  # manually extract
""")

# LangChain ke saath
print("--- With LangChain ---")
print("""
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage

llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
response = llm.invoke([HumanMessage(content="What is Python?")])
print(response.content)  # direct access
""")

# ============================================================
# CONCEPT 2: PROMPT TEMPLATES — REUSABLE PROMPTS
# ============================================================
print("\n--- CONCEPT 2: Prompt Templates ---")

# WHY PROMPT TEMPLATES?
# Agar har baar manually prompt likhoge:
#   f"Explain {topic} in simple terms for a {level} student"
# Template se:
#   prompt.format(topic="AI", level="beginner")
# Reusable, testable, maintainable

from langchain_core.prompts import ChatPromptTemplate, PromptTemplate

# Simple string template
simple_template = PromptTemplate.from_template(
    "Explain {topic} in simple terms. Keep it under 3 sentences."
)

# Format karo
formatted = simple_template.format(topic="machine learning")
print(f"Formatted prompt: {formatted}")

# Chat template (system + human messages)
chat_template = ChatPromptTemplate.from_messages([
    ("system", "You are an expert {domain} teacher. Explain concepts simply."),
    ("human", "Explain: {concept}"),
])

# Messages banana
messages = chat_template.format_messages(
    domain="Python",
    concept="decorators"
)
print(f"\nChat messages:")
for msg in messages:
    print(f"  [{msg.type}]: {msg.content}")

# ============================================================
# CONCEPT 3: LCEL — CHAIN BANANA (| operator)
# ============================================================
print("\n--- CONCEPT 3: LCEL Chains ---")

# LCEL = LangChain Expression Language
# | operator se components chain karo
# Input → Prompt → LLM → Parser → Output

print("""
LCEL Chain Example:
─────────────────────────────────────────────
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

# Components define karo
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
prompt = ChatPromptTemplate.from_template("Explain {topic} briefly.")
parser = StrOutputParser()  # AIMessage → plain string

# Chain banao with | operator
chain = prompt | llm | parser

# Run karo
result = chain.invoke({"topic": "neural networks"})
print(result)  # Plain text response
─────────────────────────────────────────────
""")

# ============================================================
# CONCEPT 4: OUTPUT PARSERS
# ============================================================
print("--- CONCEPT 4: Output Parsers ---")

print("""
WHY OUTPUT PARSERS?
LLM text return karta hai. Hume structured data chahiye.

# String parser — simple text
from langchain_core.output_parsers import StrOutputParser
parser = StrOutputParser()

# JSON parser — structured output
from langchain_core.output_parsers import JsonOutputParser
parser = JsonOutputParser()

# Pydantic parser — typed output
from langchain_core.output_parsers import PydanticOutputParser
from pydantic import BaseModel

class MovieReview(BaseModel):
    title: str
    rating: float
    summary: str

parser = PydanticOutputParser(pydantic_object=MovieReview)
# LLM ka output automatically MovieReview object mein convert hoga
""")

# ============================================================
# CONCEPT 5: RUNNABLE INTERFACE
# ============================================================
print("--- CONCEPT 5: Runnable Interface ---")

print("""
Har LangChain component Runnable hai — iska matlab:

1. .invoke()  → ek input, ek output (synchronous)
   result = chain.invoke({"topic": "AI"})

2. .stream()  → token by token output (streaming)
   for chunk in chain.stream({"topic": "AI"}):
       print(chunk, end="", flush=True)

3. .batch()   → multiple inputs ek saath (parallel)
   results = chain.batch([
       {"topic": "AI"},
       {"topic": "ML"},
       {"topic": "DL"}
   ])

4. .ainvoke() → async version
   result = await chain.ainvoke({"topic": "AI"})

WHY YE IMPORTANT HAI?
Production mein streaming chahiye (user ko wait nahi karna)
Batch processing chahiye (1000 documents ek saath)
Async chahiye (multiple users simultaneously)
""")

print("✅ LangChain Basics Notes Complete!")
print("\nAb 02_chains.py dekho actual code ke liye")
