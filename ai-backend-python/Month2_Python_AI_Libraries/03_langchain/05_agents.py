# ============================================================
# LangChain Agents — Tool-Using AI
# Run: python 03_langchain/05_agents.py
# ============================================================

print("=" * 60)
print("LANGCHAIN AGENTS — TOOL-USING AI")
print("=" * 60)

print("""
AGENT KYA HAI?
═══════════════════════════════════════════════════════════

Chain = Fixed steps (deterministic)
  Input → Step1 → Step2 → Step3 → Output
  Hamesha same path follow karta hai

Agent = LLM decides what to do (dynamic)
  Input → LLM thinks → "I need to search" → Search Tool
       → LLM thinks → "I need to calculate" → Calculator
       → LLM thinks → "I have enough info" → Final Answer

AGENT LOOP (ReAct Pattern):
  Thought: "I need to find current weather"
  Action: search_tool("weather in Mumbai")
  Observation: "Mumbai: 32°C, Humid"
  Thought: "Now I can answer"
  Final Answer: "Mumbai ka weather 32°C hai"

═══════════════════════════════════════════════════════════

TOOLS KYA HOTE HAIN?
─────────────────────────────────────────────────────────
Tools = Functions jo agent call kar sakta hai

Built-in Tools:
  - DuckDuckGoSearchRun  → Web search
  - WikipediaQueryRun    → Wikipedia
  - PythonREPLTool       → Python code run karna
  - Calculator           → Math
  - SQLDatabaseTool      → Database queries

Custom Tools:
  @tool
  def get_weather(city: str) -> str:
      "Get current weather for a city"
      # API call karo
      return f"{city}: 32°C"

═══════════════════════════════════════════════════════════
""")

# ============================================================
# CUSTOM TOOL BANANA
# ============================================================
print("--- Custom Tool Example ---")
print("""
from langchain_core.tools import tool

# @tool decorator se function ko tool banao
@tool
def calculate_salary_tax(salary: float) -> str:
    \"\"\"
    Calculate income tax for a given annual salary.
    Use this when asked about tax calculations.
    
    Args:
        salary: Annual salary in rupees
    \"\"\"
    if salary <= 300000:
        tax = 0
    elif salary <= 600000:
        tax = (salary - 300000) * 0.05
    elif salary <= 900000:
        tax = 15000 + (salary - 600000) * 0.10
    else:
        tax = 45000 + (salary - 900000) * 0.15
    
    return f"Salary: ₹{salary:,.0f} | Tax: ₹{tax:,.0f} | Rate: {(tax/salary)*100:.1f}%"

@tool
def search_employee(name: str) -> str:
    \"\"\"
    Search for employee information by name.
    
    Args:
        name: Employee's full name
    \"\"\"
    # Real mein database query hogi
    employees = {
        "Alice": {"dept": "Engineering", "salary": 95000},
        "Bob": {"dept": "Marketing", "salary": 72000},
    }
    emp = employees.get(name, None)
    if emp:
        return f"{name}: {emp['dept']}, ₹{emp['salary']:,}"
    return f"Employee '{name}' not found"

# Tools list
tools = [calculate_salary_tax, search_employee]
""")

# ============================================================
# AGENT SETUP
# ============================================================
print("--- Agent Setup ---")
print("""
from langchain_openai import ChatOpenAI
from langchain.agents import create_react_agent, AgentExecutor
from langchain import hub

llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

# ReAct prompt (Reasoning + Acting)
# hub se standard prompt lo
prompt = hub.pull("hwchase17/react")

# Agent create karo
agent = create_react_agent(llm, tools, prompt)

# AgentExecutor — agent ko run karta hai
agent_executor = AgentExecutor(
    agent=agent,
    tools=tools,
    verbose=True,      # Thought/Action/Observation print karo
    max_iterations=5,  # Infinite loop prevent karo
    handle_parsing_errors=True  # Parse errors gracefully handle karo
)

# Use karo
result = agent_executor.invoke({
    "input": "Alice ki salary pe kitna tax lagega?"
})
print(result["output"])

# Agent ka thought process (verbose=True ke saath):
# Thought: I need to find Alice's salary first
# Action: search_employee
# Action Input: Alice
# Observation: Alice: Engineering, ₹95,000
# Thought: Now I can calculate tax
# Action: calculate_salary_tax
# Action Input: 95000
# Observation: Salary: ₹95,000 | Tax: ₹9,500 | Rate: 10.0%
# Final Answer: Alice ki salary ₹95,000 hai aur unhe ₹9,500 tax dena hoga
""")

# ============================================================
# TOOL CALLING (Modern Approach)
# ============================================================
print("--- Modern Tool Calling (Recommended) ---")
print("""
# Modern LangChain mein bind_tools use karo
# Ye OpenAI function calling use karta hai (more reliable)

from langchain_openai import ChatOpenAI
from langchain_core.tools import tool

llm = ChatOpenAI(model="gpt-4o-mini")

# Tools bind karo LLM ke saath
llm_with_tools = llm.bind_tools([calculate_salary_tax, search_employee])

# LLM automatically decide karta hai kab tool call karna hai
response = llm_with_tools.invoke("Alice ki salary pe tax calculate karo")

# Tool calls check karo
if response.tool_calls:
    for tool_call in response.tool_calls:
        print(f"Tool: {tool_call['name']}")
        print(f"Args: {tool_call['args']}")
""")

print("✅ LangChain Agents Complete!")
