# ============================================================
# LangGraph Agent Loop — ReAct Agent from Scratch
# Run: python 04_langgraph/03_agent_loop.py
# ============================================================

print("=" * 60)
print("LANGGRAPH AGENT LOOP — REACT AGENT")
print("=" * 60)

print("""
REACT AGENT KYA HAI?
═══════════════════════════════════════════════════════════

ReAct = Reasoning + Acting

Loop:
  1. THINK  → "Mujhe kya karna chahiye?"
  2. ACT    → Tool call karo
  3. OBSERVE → Tool ka result dekho
  4. THINK  → "Kya aur karna hai?"
  5. Repeat until done

LangGraph mein ye ek CYCLE hai:
  
  [START]
     ↓
  [Agent Node] ← ─ ─ ─ ─ ─ ─ ─ ┐
     ↓                           │
  [Tool Call?] → Yes → [Tool Node]
     ↓ No
  [END]

═══════════════════════════════════════════════════════════
""")

# ============================================================
# COMPLETE REACT AGENT WITH LANGGRAPH
# ============================================================
print("--- Complete ReAct Agent ---")
print("""
from typing import TypedDict, Annotated, List
import operator
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, ToolMessage
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode

# ─── STATE ───────────────────────────────────────────────

class AgentState(TypedDict):
    messages: Annotated[List[BaseMessage], operator.add]

# ─── TOOLS ───────────────────────────────────────────────

@tool
def search_web(query: str) -> str:
    \"\"\"Search the web for information.\"\"\"
    # Real mein: DuckDuckGo ya Google API
    return f"Search results for '{query}': [Mock results about {query}]"

@tool
def calculate(expression: str) -> str:
    \"\"\"Calculate a mathematical expression.\"\"\"
    try:
        result = eval(expression)  # Production mein safer eval use karo
        return f"{expression} = {result}"
    except Exception as e:
        return f"Error: {e}"

@tool
def get_weather(city: str) -> str:
    \"\"\"Get current weather for a city.\"\"\"
    # Real mein: Weather API call
    weather_data = {
        "Mumbai": "32°C, Humid",
        "Delhi": "28°C, Sunny",
        "Bangalore": "24°C, Cloudy"
    }
    return weather_data.get(city, f"Weather data not available for {city}")

tools = [search_web, calculate, get_weather]

# ─── LLM WITH TOOLS ──────────────────────────────────────

llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
llm_with_tools = llm.bind_tools(tools)

# ─── NODES ───────────────────────────────────────────────

def agent_node(state: AgentState) -> dict:
    \"\"\"
    Main agent node — LLM decide karta hai kya karna hai.
    Tool call kare ya final answer de.
    \"\"\"
    response = llm_with_tools.invoke(state["messages"])
    return {"messages": [response]}

# ToolNode — automatically tool calls execute karta hai
tool_node = ToolNode(tools)

# ─── ROUTING ─────────────────────────────────────────────

def should_continue(state: AgentState) -> str:
    \"\"\"
    Decide karo: tool call karna hai ya end karna hai?
    
    LLM ka last message check karo:
    - Agar tool_calls hai → tools run karo
    - Agar nahi hai → end karo (final answer)
    \"\"\"
    last_message = state["messages"][-1]
    
    if hasattr(last_message, "tool_calls") and last_message.tool_calls:
        return "tools"  # Tool node pe jao
    else:
        return "end"    # End karo

# ─── GRAPH ───────────────────────────────────────────────

graph = StateGraph(AgentState)

# Nodes
graph.add_node("agent", agent_node)
graph.add_node("tools", tool_node)

# Entry
graph.set_entry_point("agent")

# Conditional edge — agent ke baad decide karo
graph.add_conditional_edges(
    "agent",
    should_continue,
    {
        "tools": "tools",  # Tool call karo
        "end": END         # Done
    }
)

# Tools ke baad wapas agent pe jao (LOOP!)
graph.add_edge("tools", "agent")

# Compile
app = graph.compile()

# ─── RUN ─────────────────────────────────────────────────

questions = [
    "Mumbai ka weather kya hai aur 25 * 4 kitna hota hai?",
    "Python ke baare mein search karo",
]

for question in questions:
    print(f"\\nQuestion: {question}")
    print("-" * 40)
    
    result = app.invoke({
        "messages": [HumanMessage(content=question)]
    })
    
    # Final answer (last message)
    final = result["messages"][-1].content
    print(f"Answer: {final}")
    
    # Steps trace karo
    print(f"Total messages: {len(result['messages'])}")
""")

# ============================================================
# HUMAN IN THE LOOP
# ============================================================
print("--- Human in the Loop ---")
print("""
# Production mein: Sensitive actions se pehle human approval lo

from langgraph.checkpoint.memory import MemorySaver

# Checkpointer — state save karta hai (pause/resume ke liye)
memory = MemorySaver()

app = graph.compile(
    checkpointer=memory,
    interrupt_before=["tools"]  # Tools run karne se PEHLE pause karo
)

config = {"configurable": {"thread_id": "user_123"}}

# Step 1: Agent sochta hai, tool call suggest karta hai
result = app.invoke(
    {"messages": [HumanMessage(content="Delete all old records")]},
    config=config
)

# Yahan pause ho gaya — human ko dikhao kya hone wala hai
pending_tool = result["messages"][-1].tool_calls[0]
print(f"Agent wants to call: {pending_tool['name']}")
print(f"With args: {pending_tool['args']}")

# Human approve kare
user_approval = input("Approve? (yes/no): ")

if user_approval == "yes":
    # None pass karo — wahi se continue karo jahan ruka tha
    final_result = app.invoke(None, config=config)
    print("Action completed!")
else:
    print("Action cancelled by human")
""")

# ============================================================
# LANGGRAPH PRODUCTION PATTERNS
# ============================================================
print("--- Production Patterns ---")
print("""
1. PERSISTENCE — State database mein save karo
   from langgraph.checkpoint.postgres import PostgresSaver
   
   checkpointer = PostgresSaver.from_conn_string(
       "postgresql://user:pass@localhost/db"
   )
   app = graph.compile(checkpointer=checkpointer)

2. STREAMING — Real-time updates
   for event in app.stream({"messages": [...]}, config):
       for node_name, node_output in event.items():
           print(f"Node '{node_name}' completed")
           print(node_output)

3. SUBGRAPHS — Complex workflows
   # Ek graph doosre graph ka node ban sakta hai
   sub_app = sub_graph.compile()
   main_graph.add_node("sub_workflow", sub_app)

4. PARALLEL NODES — Multiple nodes ek saath
   from langgraph.graph import Send
   
   def fan_out(state):
       # Multiple parallel tasks create karo
       return [Send("process", {"item": item}) for item in state["items"]]
   
   graph.add_conditional_edges("start", fan_out)
""")

print("✅ LangGraph Agent Loop Complete!")
print("\n" + "=" * 60)
print("COMPLETE MODULE SUMMARY")
print("=" * 60)
print("""
NumPy   → Embeddings, vectors, math operations
Pandas  → Data loading, cleaning, feature engineering
LangChain → LLM calls, chains, RAG, memory, agents
LangGraph → Complex stateful workflows, loops, branching

Learning Path:
  NumPy → Pandas → LangChain → LangGraph
  
  Har ek pehle wale pe build karta hai!
""")
