# ============================================================
# LangGraph Conditional Flow — Branching Logic
# Run: python 04_langgraph/02_conditional_flow.py
# ============================================================

print("=" * 60)
print("LANGGRAPH CONDITIONAL FLOW — BRANCHING")
print("=" * 60)

print("""
CONDITIONAL EDGES KYA HAIN?
═══════════════════════════════════════════════════════════

Simple edge: A → B (hamesha B)
Conditional edge: A → ? (depends on state)

Example: Customer Support Bot

  User Message
       ↓
  [Classify]
       ↓
  ┌────┴────────┐
  │             │
  ↓             ↓
[FAQ Answer] [Escalate to Human]

Code:
  def route_message(state) -> str:
      if state["intent"] == "simple_faq":
          return "faq_node"
      else:
          return "escalate_node"
  
  graph.add_conditional_edges(
      "classify",          # source node
      route_message,       # function jo decide kare
      {
          "faq_node": "faq_node",          # return value → node name
          "escalate_node": "escalate_node"
      }
  )

═══════════════════════════════════════════════════════════
""")

# ============================================================
# COMPLETE CONDITIONAL FLOW EXAMPLE
# ============================================================
print("--- Customer Support Bot Example ---")
print("""
from typing import TypedDict, Annotated, List
import operator
from langchain_core.messages import HumanMessage, AIMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, END

class SupportState(TypedDict):
    messages: Annotated[List, operator.add]
    intent: str          # "faq" ya "complaint" ya "technical"
    resolved: bool
    escalated: bool

llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

# ─── NODES ───────────────────────────────────────────────

def classify_intent(state: SupportState) -> dict:
    \"\"\"User ka intent classify karo.\"\"\"
    user_message = state["messages"][-1].content
    
    # LLM se classify karwao
    response = llm.invoke([
        HumanMessage(content=f\"\"\"
        Classify this customer message into one of: faq, complaint, technical
        Message: {user_message}
        Return only the category word.
        \"\"\")
    ])
    
    intent = response.content.strip().lower()
    return {"intent": intent}

def handle_faq(state: SupportState) -> dict:
    \"\"\"Simple FAQ questions handle karo.\"\"\"
    user_message = state["messages"][-1].content
    response = llm.invoke([
        HumanMessage(content=f"Answer this FAQ briefly: {user_message}")
    ])
    return {
        "messages": [AIMessage(content=response.content)],
        "resolved": True
    }

def handle_complaint(state: SupportState) -> dict:
    \"\"\"Complaints handle karo — empathetically.\"\"\"
    response = llm.invoke([
        HumanMessage(content="Respond empathetically to this complaint and offer solution")
    ])
    return {
        "messages": [AIMessage(content=response.content)],
        "resolved": True
    }

def escalate_to_human(state: SupportState) -> dict:
    \"\"\"Complex issues human agent ko bhejo.\"\"\"
    return {
        "messages": [AIMessage(content="Connecting you to a human agent...")],
        "escalated": True,
        "resolved": True
    }

# ─── ROUTING FUNCTION ────────────────────────────────────

def route_by_intent(state: SupportState) -> str:
    \"\"\"
    Intent ke hisaab se next node decide karo.
    Return value = node name (graph mein defined)
    \"\"\"
    intent = state.get("intent", "")
    
    if intent == "faq":
        return "handle_faq"
    elif intent == "complaint":
        return "handle_complaint"
    else:
        return "escalate"  # technical ya unknown

# ─── GRAPH BUILD ─────────────────────────────────────────

graph = StateGraph(SupportState)

# Nodes add karo
graph.add_node("classify", classify_intent)
graph.add_node("handle_faq", handle_faq)
graph.add_node("handle_complaint", handle_complaint)
graph.add_node("escalate", escalate_to_human)

# Entry point
graph.set_entry_point("classify")

# Conditional edge — classify ke baad route karo
graph.add_conditional_edges(
    "classify",          # source
    route_by_intent,     # routing function
    {
        "handle_faq": "handle_faq",
        "handle_complaint": "handle_complaint",
        "escalate": "escalate"
    }
)

# All paths END pe jaate hain
graph.add_edge("handle_faq", END)
graph.add_edge("handle_complaint", END)
graph.add_edge("escalate", END)

app = graph.compile()

# Test karo
test_messages = [
    "What are your business hours?",      # → FAQ
    "Your product broke after 2 days!",   # → Complaint
    "API returning 500 error on line 42", # → Technical → Escalate
]

for msg in test_messages:
    result = app.invoke({
        "messages": [HumanMessage(content=msg)],
        "intent": "",
        "resolved": False,
        "escalated": False
    })
    print(f"Message: {msg[:40]}...")
    print(f"Intent: {result['intent']}")
    print(f"Response: {result['messages'][-1].content[:60]}...")
    print()
""")

# ============================================================
# LOOP EXAMPLE — RETRY LOGIC
# ============================================================
print("--- Loop Example — Retry Logic ---")
print("""
# LangGraph mein loops possible hain!
# Example: Jab tak answer satisfactory na ho, retry karo

def check_quality(state) -> str:
    \"\"\"Answer ki quality check karo.\"\"\"
    answer = state["messages"][-1].content
    attempts = state.get("attempts", 0)
    
    # Quality check (simplified)
    if len(answer) > 100 and attempts < 3:
        return "good"
    elif attempts >= 3:
        return "give_up"  # Max retries reached
    else:
        return "retry"

graph.add_conditional_edges(
    "generate_answer",
    check_quality,
    {
        "good": END,           # Quality achhi hai → end
        "retry": "generate_answer",  # ← LOOP! Wapas generate karo
        "give_up": END
    }
)

# Flow:
# generate_answer → check_quality → retry → generate_answer
#                                 → good → END
""")

print("✅ LangGraph Conditional Flow Complete!")
