# LangGraph — Complete Notes for AI Engineers

## LangGraph Kya Hai?

LangGraph = LangChain ka extension jo **stateful, multi-step AI workflows** banane deta hai.

**LangChain Chains ki limitation:**
- Linear flow — A → B → C
- Loops nahi kar sakta
- Conditional branching limited hai
- State manage karna mushkil hai

**LangGraph se:**
- Cycles/Loops possible hain (agent baar baar soch sakta hai)
- Complex branching (if/else based on LLM output)
- Persistent state across steps
- Human-in-the-loop (pause karke human approval lo)

## Core Concepts

### 1. State — Shared Data
```python
from typing import TypedDict, Annotated
import operator

class AgentState(TypedDict):
    messages: Annotated[list, operator.add]  # Messages accumulate hote hain
    current_step: str
    result: str
```

### 2. Nodes — Processing Steps
```python
def research_node(state: AgentState) -> AgentState:
    # State read karo, process karo, updated state return karo
    return {"messages": [AIMessage(content="Research done")]}
```

### 3. Edges — Flow Control
```python
# Simple edge
graph.add_edge("node_a", "node_b")  # A ke baad hamesha B

# Conditional edge
graph.add_conditional_edges(
    "node_a",
    decide_next_step,  # function jo decide karta hai
    {
        "continue": "node_b",
        "end": END
    }
)
```

### 4. Graph Compilation
```python
from langgraph.graph import StateGraph, END

graph = StateGraph(AgentState)
graph.add_node("research", research_node)
graph.add_node("write", write_node)
graph.set_entry_point("research")
graph.add_edge("research", "write")
graph.add_edge("write", END)

app = graph.compile()
result = app.invoke({"messages": [], "topic": "AI"})
```

## LangChain vs LangGraph

| Feature | LangChain | LangGraph |
|---------|-----------|-----------|
| Flow | Linear | Graph (any direction) |
| Loops | No | Yes |
| State | Limited | Full TypedDict state |
| Branching | Basic | Complex conditional |
| Human-in-loop | No | Yes (interrupt) |
| Use case | Simple chains | Complex agents |

## Real-World Use Cases

1. **Multi-step Research Agent** — Search → Analyze → Write → Review → Publish
2. **Customer Support Bot** — Classify → Route → Resolve → Escalate if needed
3. **Code Review Agent** — Read code → Identify issues → Suggest fixes → Verify
4. **Content Pipeline** — Draft → Review → Edit → Approve → Publish

## Interview Questions

**Q: LangGraph aur LangChain mein kya fark hai?**
A: LangChain linear chains ke liye hai. LangGraph complex stateful workflows ke liye — loops, conditional branching, aur persistent state support karta hai.

**Q: LangGraph mein State kya hota hai?**
A: TypedDict jo sab nodes ke beech share hota hai. Har node state read karta hai, process karta hai, aur updated state return karta hai.

**Q: Conditional edge kab use karte hain?**
A: Jab LLM ka output decide kare ki aage kaunsa node chalega. Example: "Is the answer complete?" → Yes → END, No → research_again

**Q: Human-in-the-loop kya hai?**
A: Graph ko pause karna aur human approval lena before continuing. Example: AI ne code generate kiya → human review kare → approve kare → deploy ho.

**Q: LangGraph production mein kaise use hota hai?**
A: LangGraph Cloud ya self-hosted deployment. State PostgreSQL mein persist hoti hai. Multiple users ke liye separate threads.
