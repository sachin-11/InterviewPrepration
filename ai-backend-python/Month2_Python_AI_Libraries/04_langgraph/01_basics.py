# ============================================================
# LangGraph Basics — Nodes, Edges, State
# Run: python 04_langgraph/01_basics.py
# ============================================================

print("=" * 60)
print("LANGGRAPH BASICS — STATEFUL AI WORKFLOWS")
print("=" * 60)

# ============================================================
# CONCEPT 1: WHY LANGGRAPH?
# ============================================================
print("""
WHY LANGGRAPH?
═══════════════════════════════════════════════════════════

LangChain Chain:
  Input → A → B → C → Output
  Problem: Agar C fail ho toh? Loop nahi kar sakte.

LangGraph:
  Input → A → B → C → Output
               ↑       |
               └───────┘  (loop possible!)
  
  Ya:
  Input → A → [condition] → B (if yes)
                          → C (if no)

REAL EXAMPLE — Customer Support Agent:
  
  User Message
       ↓
  [Classify Intent]
       ↓
  ┌────┴────┐
  │         │
  ↓         ↓
[FAQ Bot] [Human Agent]
  │         │
  └────┬────┘
       ↓
  [Send Response]
       ↓
  [Satisfied?] → No → [Escalate]
       ↓ Yes
     [END]

═══════════════════════════════════════════════════════════
""")

# ============================================================
# CONCEPT 2: STATE — GRAPH KA MEMORY
# ============================================================
print("--- CONCEPT 2: State ---")
print("""
from typing import TypedDict, Annotated, List
import operator
from langchain_core.messages import BaseMessage

# State = TypedDict (type-safe dictionary)
# Sab nodes is state ko read/write karte hain

class SimpleState(TypedDict):
    # Annotated[list, operator.add] matlab:
    # Jab node messages return kare, wo existing list mein ADD ho
    # (replace nahi, ADD karo)
    messages: Annotated[List[BaseMessage], operator.add]
    
    # Simple fields — last value wins (replace hota hai)
    current_step: str
    is_complete: bool
    error: str

# State ka flow:
# Initial: {"messages": [], "current_step": "start", "is_complete": False}
# After Node A: {"messages": [msg1], "current_step": "research", ...}
# After Node B: {"messages": [msg1, msg2], "current_step": "write", ...}
# Final: {"messages": [msg1, msg2, msg3], "is_complete": True, ...}
""")

# ============================================================
# CONCEPT 3: NODES — PROCESSING FUNCTIONS
# ============================================================
print("--- CONCEPT 3: Nodes ---")
print("""
# Node = Python function jo state leti hai aur updated state return karti hai

from langchain_core.messages import HumanMessage, AIMessage

def research_node(state: SimpleState) -> dict:
    \"\"\"
    Research step — information gather karo.
    State se messages read karo, process karo, new state return karo.
    \"\"\"
    print("  [Research Node] Gathering information...")
    
    # State se last message nikalo
    last_message = state["messages"][-1].content
    
    # Process karo (real mein: LLM call, web search, etc.)
    research_result = f"Research done for: {last_message}"
    
    # Return karo — sirf jo change hua wo return karo
    return {
        "messages": [AIMessage(content=research_result)],
        "current_step": "research_done"
    }

def write_node(state: SimpleState) -> dict:
    \"\"\"Write step — research se content banana.\"\"\"
    print("  [Write Node] Writing content...")
    
    # Previous research result nikalo
    research = state["messages"][-1].content
    
    written_content = f"Article based on: {research}"
    
    return {
        "messages": [AIMessage(content=written_content)],
        "current_step": "writing_done",
        "is_complete": True
    }

def review_node(state: SimpleState) -> dict:
    \"\"\"Review step — content check karo.\"\"\"
    print("  [Review Node] Reviewing content...")
    return {
        "messages": [AIMessage(content="Content reviewed and approved")],
        "current_step": "reviewed"
    }
""")

# ============================================================
# CONCEPT 4: GRAPH BANANA
# ============================================================
print("--- CONCEPT 4: Building the Graph ---")
print("""
from langgraph.graph import StateGraph, END

# 1. Graph create karo with State type
graph = StateGraph(SimpleState)

# 2. Nodes add karo
graph.add_node("research", research_node)
graph.add_node("write", write_node)
graph.add_node("review", review_node)

# 3. Entry point set karo
graph.set_entry_point("research")

# 4. Edges add karo (flow define karo)
graph.add_edge("research", "write")   # research ke baad write
graph.add_edge("write", "review")     # write ke baad review
graph.add_edge("review", END)         # review ke baad end

# 5. Compile karo
app = graph.compile()

# 6. Run karo
initial_state = {
    "messages": [HumanMessage(content="Write about LangGraph")],
    "current_step": "start",
    "is_complete": False,
    "error": ""
}

result = app.invoke(initial_state)

print("Final messages:")
for msg in result["messages"]:
    print(f"  {msg.content}")
print(f"Final step: {result['current_step']}")
""")

# ============================================================
# RUNNABLE DEMO (No API key needed)
# ============================================================
print("--- Live Demo (No API Key) ---")

from typing import TypedDict, Annotated, List
import operator

class DemoState(TypedDict):
    steps_completed: Annotated[List[str], operator.add]
    current_data: str
    is_done: bool

def step_one(state: DemoState) -> dict:
    print("  → Step 1: Data collection")
    return {
        "steps_completed": ["data_collection"],
        "current_data": "Raw data collected"
    }

def step_two(state: DemoState) -> dict:
    print("  → Step 2: Data processing")
    processed = state["current_data"] + " → Processed"
    return {
        "steps_completed": ["data_processing"],
        "current_data": processed
    }

def step_three(state: DemoState) -> dict:
    print("  → Step 3: Output generation")
    final = state["current_data"] + " → Final Output"
    return {
        "steps_completed": ["output_generation"],
        "current_data": final,
        "is_done": True
    }

try:
    from langgraph.graph import StateGraph, END

    # Graph banana
    workflow = StateGraph(DemoState)
    workflow.add_node("collect", step_one)
    workflow.add_node("process", step_two)
    workflow.add_node("output", step_three)

    workflow.set_entry_point("collect")
    workflow.add_edge("collect", "process")
    workflow.add_edge("process", "output")
    workflow.add_edge("output", END)

    app = workflow.compile()

    # Run karo
    print("\nRunning LangGraph workflow:")
    result = app.invoke({
        "steps_completed": [],
        "current_data": "",
        "is_done": False
    })

    print(f"\nCompleted steps: {result['steps_completed']}")
    print(f"Final data: {result['current_data']}")
    print(f"Is done: {result['is_done']}")

except ImportError:
    print("  langgraph not installed. Run: pip install langgraph")
    print("  (Demo code is correct — just needs the package)")

print("\n✅ LangGraph Basics Complete!")
