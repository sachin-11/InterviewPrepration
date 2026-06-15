# LangChain — Complete Notes for AI Engineers

## LangChain Kya Hai?

LangChain ek framework hai jo LLM applications banane ko easy karta hai.

**Bina LangChain ke:**
```python
# Har cheez manually karo
response = openai.chat.completions.create(...)
text = response.choices[0].message.content
# Memory manually manage karo
# Retrieval manually karo
# Tool calling manually karo
```

**LangChain ke saath:**
```python
chain = prompt | llm | output_parser
result = chain.invoke({"question": "..."})
# Memory, retrieval, tools — sab built-in
```

## Core Components

### 1. LLM / ChatModel
```python
from langchain_openai import ChatOpenAI
llm = ChatOpenAI(model="gpt-4o-mini")
```

### 2. Prompt Templates
```python
from langchain_core.prompts import ChatPromptTemplate
prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a helpful assistant"),
    ("human", "{question}")
])
```

### 3. Chains (LCEL — LangChain Expression Language)
```python
# | operator se chain banao
chain = prompt | llm | StrOutputParser()
result = chain.invoke({"question": "What is AI?"})
```

### 4. Memory
```python
from langchain.memory import ConversationBufferMemory
memory = ConversationBufferMemory()
# Conversation history automatically track hoti hai
```

### 5. Retrievers (RAG ke liye)
```python
retriever = vectorstore.as_retriever(search_kwargs={"k": 3})
# Query ke liye relevant documents dhundta hai
```

### 6. Agents
```python
# LLM khud decide karta hai kaunsa tool use karna hai
agent = create_react_agent(llm, tools, prompt)
```

## LCEL — LangChain Expression Language

```
Input → Prompt Template → LLM → Output Parser → Result
         ↑                ↑          ↑
    Variables fill    API call   Text extract
```

`|` operator = pipe (Unix pipe ki tarah)

## Interview Questions

**Q: LangChain kya hai aur kyun use karte hain?**
A: LangChain ek framework hai jo LLM applications banane ke liye abstractions provide karta hai — prompts, chains, memory, retrievers, agents. Isse boilerplate code kam hota hai aur complex workflows easily build hote hain.

**Q: LCEL kya hai?**
A: LangChain Expression Language — `|` operator se components ko chain karne ka modern tarika. Streaming, async, batching sab automatically support karta hai.

**Q: Chain aur Agent mein kya fark hai?**
A: Chain = fixed sequence of steps (deterministic). Agent = LLM khud decide karta hai kya karna hai (dynamic, tool-using).

**Q: RAG mein LangChain ka role kya hai?**
A: LangChain RAG pipeline ke sab components provide karta hai — document loaders, text splitters, embeddings, vector stores, retrievers, aur final QA chain.

**Q: Memory types kya hain LangChain mein?**
A: 
- `ConversationBufferMemory` — puri history store karta hai
- `ConversationBufferWindowMemory` — last N messages
- `ConversationSummaryMemory` — history ko summarize karta hai
- `ConversationTokenBufferMemory` — token limit ke hisaab se
