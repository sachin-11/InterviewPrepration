# AI Developer ML Learning Roadmap

Ye file un ML/AI cheezon ka practical roadmap hai jo ek strong AI developer ko pata honi chahiye. Goal sirf libraries yaad karna nahi hai, balki ye samajhna hai ki real AI apps me data, models, embeddings, LLMs, agents, deployment aur monitoring kaise connect hote hain.

## 1. Python Foundations For AI

### Kya aana chahiye

- Python basics: functions, classes, modules, virtual environments
- Type hints: `list[str]`, `dict[str, int]`, `Optional`, `TypedDict`
- File handling: `.txt`, `.csv`, `.json`, `.jsonl`, `.pdf`
- Async basics: `async`, `await`, API calls, background jobs
- Error handling: retries, timeouts, logging
- Package management: `pip`, `requirements.txt`, `.env`

### AI me use

- LLM APIs call karna
- Data load/clean/transform karna
- RAG pipelines build karna
- Model serving APIs banana
- Production bugs debug karna

### Practice

- Ek script banao jo JSON/CSV data load kare, clean kare, aur final `.jsonl` training-style format me save kare.

## 2. NumPy

### Kya aana chahiye

- Arrays, shapes, indexing, slicing
- Vector operations
- Matrix multiplication
- Broadcasting
- Norm, dot product, cosine similarity
- Random numbers and reproducibility

### AI me use

- Embeddings ko vectors ki tarah handle karna
- Similarity search samajhna
- Neural network math ka base
- Image/audio/text numerical representation samajhna

### Must know examples

```python
import numpy as np

a = np.array([1, 2, 3])
b = np.array([2, 4, 6])

cosine = np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))
print(cosine)
```

### Practice

- 5 text embeddings ka fake NumPy array banao aur query vector ke saath most similar item find karo.

## 3. Pandas

### Kya aana chahiye

- `DataFrame`, `Series`
- CSV/Excel/JSON load karna
- Missing values handle karna
- Filtering, sorting, grouping
- Feature engineering
- Train/test split ke liye data prepare karna
- Duplicate and dirty data clean karna

### AI me use

- Training data cleaning
- Evaluation reports analyze karna
- User logs se patterns nikalna
- Prompt datasets prepare karna
- RAG documents metadata manage karna

### Practice

- Ek support-ticket CSV lo aur columns banao: `question`, `category`, `priority`, `cleaned_text`.

## 4. Data Preprocessing

### Kya aana chahiye

- Text cleaning: lowercase, punctuation cleanup, whitespace normalization
- Tokenization ka concept
- Stopwords ka use kab karna hai aur kab avoid karna hai
- Label encoding and one-hot encoding
- Scaling: standardization, normalization
- Imbalanced data basics
- Data leakage kya hota hai

### AI me use

- Better model training
- Better retrieval results
- Cleaner evaluation
- Fewer production surprises

### Important point

LLM/RAG systems me aggressive text cleaning hamesha achchi nahi hoti. Legal, medical, code, invoice, resume jaise documents me punctuation, casing, symbols aur structure important ho sakte hain.

## 5. Machine Learning Basics

### Core concepts

- Supervised learning
- Unsupervised learning
- Classification
- Regression
- Clustering
- Overfitting and underfitting
- Bias-variance tradeoff
- Train/validation/test split
- Cross validation
- Metrics

### Algorithms jo samajhne chahiye

- Linear Regression
- Logistic Regression
- Decision Tree
- Random Forest
- Gradient Boosting
- K-Means
- Naive Bayes
- KNN
- SVM basics

### AI developer ke liye depth

Har algorithm ko scratch se implement karna zaroori nahi, lekin ye samajhna zaroori hai:

- Input kya hota hai
- Output kya hota hai
- Training ka goal kya hai
- Failure cases kya hain
- Kaunsi metric use hogi

## 6. Scikit-Learn

### Kya aana chahiye

- `fit`, `predict`, `transform`, `fit_transform`
- Pipelines
- Train/test split
- Metrics
- Model selection
- Hyperparameter tuning
- Preprocessing utilities

### AI me use

- Quick ML baselines
- Classification models
- Evaluation logic
- Feature preprocessing
- Traditional ML + LLM hybrid systems

### Practice

- Spam classifier banao:
  - Text input
  - TF-IDF vectorizer
  - Logistic Regression
  - Accuracy, precision, recall, F1 score

## 7. Deep Learning Basics

### Kya aana chahiye

- Tensor kya hota hai
- Neural network layers
- Activation functions
- Loss functions
- Optimizers
- Backpropagation intuition
- Epoch, batch size, learning rate
- GPU vs CPU basics

### AI me use

- Transformers samajhne ka base
- Fine-tuning concepts
- Embedding models
- Vision/audio/text models

### Important terms

- Tensor
- Gradient
- Parameters
- Weights
- Loss
- Optimizer
- Checkpoint
- Inference

## 8. PyTorch

### Kya aana chahiye

- Tensors
- Autograd
- `nn.Module`
- Dataset and DataLoader
- Training loop
- Evaluation loop
- Saving/loading model
- GPU usage with `cuda`

### AI me use

- Custom ML/deep learning models
- Fine-tuning open-source models
- Research-style experiments
- Production model inference

### Practice

- MNIST ya simple tabular classification model train karo.
- Ek training loop manually likho: forward, loss, backward, optimizer step.

## 9. TensorFlow / Keras

### Kya aana chahiye

- Sequential API
- Functional API basics
- Model compile/train/evaluate
- Callbacks
- Saving model
- TensorBoard basics

### AI me use

- Fast prototyping
- Production ML pipelines
- Mobile/browser ML ecosystem

### PyTorch vs TensorFlow

- PyTorch research, custom training, open-source LLM ecosystem me very common hai.
- TensorFlow/Keras structured production workflows aur some enterprise/mobile cases me useful hai.
- AI developer ke liye PyTorch priority rakho, TensorFlow basics bhi samjho.

## 10. NLP Basics

### Kya aana chahiye

- Tokenization
- Stemming vs lemmatization
- Bag of Words
- TF-IDF
- Word embeddings
- Sentence embeddings
- Named Entity Recognition
- Text classification
- Semantic similarity

### AI me use

- Chatbots
- Search
- RAG
- Document understanding
- Classification and tagging

### Practice

- User query aur documents ke beech TF-IDF similarity search banao.
- Phir same use case embeddings se solve karo aur compare karo.

## 11. Embeddings And Vector Search

### Kya aana chahiye

- Embedding kya hoti hai
- Dense vector vs sparse vector
- Cosine similarity
- Dot product
- Euclidean distance
- Chunking
- Metadata filtering
- Top-k retrieval
- Vector database basics

### Tools

- FAISS
- Chroma
- Pinecone
- Weaviate
- Qdrant
- pgvector

### AI me use

- RAG
- Semantic search
- Recommendation
- Duplicate detection
- Clustering
- Long-term memory

### Practice

- 20 documents ka local vector search banao.
- Query input lo aur top 3 relevant chunks return karo.

## 12. Transformers

### Kya aana chahiye

- Transformer architecture ka high-level idea
- Attention mechanism intuition
- Encoder vs decoder
- Tokens and context window
- Positional encoding concept
- Pretraining vs fine-tuning
- Inference parameters: temperature, top-p, max tokens

### AI me use

- LLMs
- Embedding models
- Summarization
- Translation
- Classification
- Multimodal AI

### Important point

Transformer ka pura math deep level pe immediately zaroori nahi, lekin attention, tokens, context window aur inference behavior clearly samajhna must hai.

## 13. Hugging Face

### Kya aana chahiye

- `transformers`
- `datasets`
- `tokenizers`
- `pipeline`
- Loading pretrained models
- Fine-tuning basics
- Model Hub usage

### AI me use

- Open-source models use karna
- Local inference
- Fine-tuning experiments
- Dataset loading and evaluation

### Practice

- Sentiment analysis pipeline run karo.
- Ek small dataset par text classifier fine-tune karo.

## 14. LLM Application Development

### Kya aana chahiye

- Prompt engineering
- System/user/developer message roles
- Structured outputs
- Function calling / tool calling
- Streaming responses
- Conversation memory
- Guardrails
- Evaluation
- Cost and latency optimization

### AI me use

- Chatbots
- AI assistants
- Code agents
- Data extraction
- Workflow automation

### Practice

- Ek AI assistant banao jo:
  - User question accept kare
  - Tool call decide kare
  - Structured JSON output de
  - Errors gracefully handle kare

## 15. LangChain

### Kya aana chahiye

- Prompt templates
- LLM wrappers
- Chains
- Retrievers
- Document loaders
- Text splitters
- Output parsers
- Tool calling
- RAG chain

### AI me use

- Fast LLM app prototyping
- RAG systems
- Tool-using assistants
- Multi-step workflows

### Practice

- PDF/document Q&A app banao using:
  - Loader
  - Splitter
  - Embeddings
  - Vector store
  - Retriever
  - LLM response

## 16. LangGraph

### Kya aana chahiye

- State
- Nodes
- Edges
- Conditional routing
- Agent loop
- Human-in-the-loop
- Checkpointing
- Multi-agent workflows

### AI me use

- Reliable agents
- Long-running workflows
- Multi-step decisions
- Branching and retry logic
- Production-grade AI flows

### Practice

- Ek agent graph banao:
  - User query classify kare
  - Agar coding query hai to code helper node
  - Agar document query hai to RAG node
  - Agar uncertain hai to clarification node

## 17. RAG Systems

### Kya aana chahiye

- Document ingestion
- Chunking strategies
- Embedding generation
- Vector storage
- Retrieval
- Reranking
- Context building
- Answer generation
- Citation/source tracking
- Evaluation

### Common problems

- Wrong chunks retrieve hona
- Context me noise
- Hallucination
- Outdated data
- Duplicate documents
- Bad chunk size
- Missing metadata

### Production checklist

- Source citations
- Access control
- Refresh/reindex flow
- Retrieval metrics
- Answer quality evaluation
- Fallback behavior
- Logging and tracing

## 18. Fine-Tuning Basics

### Fine-tuning kya hota hai?

Fine-tuning ka matlab hai already trained model ko apne specific task, style, format, domain ya behavior ke liye further train karna.

Simple example:

- Base model ko general language aati hai.
- Fine-tuning ke baad model tumhare specific pattern me answer dena seekhta hai.
- Jaise customer support tone, legal document extraction format, medical classification labels, company-specific response style, ya strict JSON output.

Important point: Fine-tuning ka goal model me sirf naye facts bharna nahi hota. Fine-tuning ka best use model ka behavior, format, style, reasoning pattern, classification pattern ya extraction pattern improve karna hota hai.

### Simple analogy

Base model ek smart student jaisa hai jise bahut general knowledge hai.

Fine-tuning us student ko tumhari company ke examples dikha-dikha kar train karna hai:

- Is type ka question aaye to aise answer do
- Output hamesha JSON me do
- Customer se polite tone me baat karo
- Resume se name, skills, experience extract karo
- Ticket ko `billing`, `technical`, `account`, `refund` category me classify karo

### Fine-tuning ka input/output kya hota hai?

Fine-tuning me model ko examples diye jaate hain.

Example:

```json
{
  "messages": [
    {
      "role": "system",
      "content": "You are a support ticket classifier."
    },
    {
      "role": "user",
      "content": "My payment was deducted but order is not showing."
    },
    {
      "role": "assistant",
      "content": "{\"category\":\"billing\",\"priority\":\"high\"}"
    }
  ]
}
```

Model aise bahut saare examples dekh kar pattern learn karta hai.

### Fine-tuning model ko kya sikhata hai?

Fine-tuning useful hai jab tum model ko ye sikhana chahte ho:

- Response ka fixed format
- Specific writing style
- Classification labels
- Data extraction pattern
- Domain-specific terminology ka usage
- Tool calling pattern
- Short/long answer preference
- Compliance style
- Company support tone

### Fine-tuning model ko kya nahi sikhana chahiye?

Fine-tuning ko facts database ki tarah use nahi karna chahiye.

Avoid fine-tuning for:

- Frequently changing company policies
- Product prices
- Latest documentation
- User-specific private data
- Large knowledge base
- Legal clauses jo regularly update hote hain

In cases me RAG better hota hai, kyunki RAG latest documents se answer generate karta hai.

### Fine-tuning vs RAG

| Question | Fine-tuning | RAG |
|----------|-------------|-----|
| Main goal | Behavior/pattern/style improve karna | Latest/external knowledge provide karna |
| Data type | Training examples | Documents, PDFs, database, web pages |
| Good for | Format, classification, extraction, tone | Q&A over knowledge base |
| Update process | Model retrain/fine-tune karna padta hai | Documents reindex/update kar sakte ho |
| Cost | Training cost + inference cost | Embedding/vector DB + inference cost |
| Risk | Overfitting, stale learned behavior | Bad retrieval, wrong context |
| Example | Always output strict JSON | Company policy se answer do |

### Easy decision rule

- Agar model ko "kaise jawab dena hai" sikhana hai, fine-tuning use karo.
- Agar model ko "kis information ke basis par jawab dena hai" batana hai, RAG use karo.
- Agar dono chahiye, RAG + fine-tuned model combine kar sakte ho.

### Common fine-tuning use cases

#### 1. Text classification

User message ko category me classify karna:

```json
{
  "input": "I cannot login to my account.",
  "output": "account_access"
}
```

Use cases:

- Support ticket classification
- Sentiment classification
- Spam detection
- Intent detection
- Risk scoring

#### 2. Structured data extraction

Unstructured text se structured JSON nikalna:

```json
{
  "name": "Rahul Sharma",
  "skills": ["Python", "FastAPI", "AWS"],
  "experience_years": 3
}
```

Use cases:

- Resume parser
- Invoice parser
- Contract clause extraction
- Medical note extraction
- KYC document extraction

#### 3. Response style tuning

Model ko specific tone me answer dena:

- Professional
- Friendly
- Short and direct
- Customer support style
- Legal-style cautious language
- Teacher-style explanation

#### 4. Tool calling behavior

Model ko sikhana ki kis situation me kaunsa tool call karna hai.

Example:

- Weather question aaye to `get_weather`
- Order status aaye to `get_order_status`
- Refund request aaye to `create_refund_ticket`

#### 5. Domain-specific assistant behavior

Model ko domain ke examples dikhana:

- Healthcare triage
- Finance document analysis
- HR policy assistant
- Developer support assistant
- E-commerce customer support

### Fine-tuning lifecycle

#### Step 1: Problem define karo

Clear karo ki tum kya improve karna chahte ho:

- Accuracy?
- Format consistency?
- Tone?
- Classification?
- Extraction?
- Tool selection?
- Latency/cost?

Bad goal:

- "Mujhe model smart banana hai."

Good goal:

- "Support tickets ko 8 fixed categories me 95% accuracy ke saath classify karna hai."

#### Step 2: Dataset collect karo

Fine-tuning ke liye high-quality examples chahiye.

Sources:

- Existing support tickets
- Human-written ideal responses
- Labeled CSV data
- Expert-verified JSON outputs
- Past chat logs
- Synthetic examples reviewed by human

Quality quantity se zyada important hai. 200 high-quality examples kabhi-kabhi 5000 noisy examples se better hote hain.

#### Step 3: Dataset clean karo

Check karo:

- Wrong labels remove karo
- Duplicate examples remove karo
- Sensitive data mask karo
- Inconsistent output format fix karo
- Invalid JSON fix karo
- Edge cases include karo

#### Step 4: Train/validation split

Dataset split karo:

- Training set: model learn karega
- Validation set: model ko evaluate karoge
- Test set: final unseen examples

Common split:

- 80% train
- 10% validation
- 10% test

#### Step 5: Fine-tuning run karo

Model provider/tool ke through fine-tuning job run hoti hai.

Common tools:

- OpenAI fine-tuning
- Hugging Face Transformers
- TRL
- PEFT
- Axolotl
- Unsloth
- MLflow for tracking

#### Step 6: Evaluate karo

Fine-tuned model ko base model se compare karo.

Check:

- Accuracy improve hui?
- JSON valid aa raha hai?
- Hallucination kam hui?
- Wrong category cases kam hue?
- Edge cases handle ho rahe hain?
- Cost/latency acceptable hai?

#### Step 7: Deploy karo

Fine-tuned model ko API me use karo.

Track:

- Model version
- Prompt version
- Dataset version
- Evaluation result
- Deployment date

#### Step 8: Monitor and improve

Production me logs dekho:

- Wrong predictions
- User complaints
- Invalid output
- Low confidence cases
- New categories
- Data drift

Phir new examples add karke next version train karo.

### Kya aana chahiye

- Fine-tuning vs RAG
- Instruction tuning
- Dataset format
- Train/validation split
- Evaluation
- Overfitting
- LoRA / QLoRA concept
- Model checkpointing
- Evaluation dataset
- Dataset cleaning
- Prompt vs fine-tuning decision
- Model versioning
- Deployment and monitoring

### Kab use kare

- Specific style/format chahiye
- Repeated domain-specific behavior chahiye
- Classification/extraction pattern stable hai
- Prompting se reliable output nahi aa raha
- Tool calling behavior improve karna hai
- Output JSON/schema consistently follow nahi ho raha
- Same type ke examples baar-baar aate hain
- Base model ka answer correct hai but style/format wrong hai

### Kab avoid kare

- Knowledge frequently update hoti hai
- Source-grounded answers chahiye
- Data kam ya low quality hai
- Sirf facts inject karne hain
- Problem prompt engineering se solve ho sakta hai
- Requirements abhi stable nahi hain
- Data sensitive hai aur safe training setup nahi hai
- Evaluation dataset available nahi hai

### Instruction tuning kya hota hai?

Instruction tuning fine-tuning ka ek type hai jisme model ko instructions follow karna sikhaya jaata hai.

Example:

```text
Instruction: Extract name and email from this text.
Input: Hi, I am Sachin. My email is sachin@example.com
Output: {"name":"Sachin","email":"sachin@example.com"}
```

Ye model ko sikhata hai ki user instruction ko samjho aur expected format me answer do.

### LoRA kya hota hai?

LoRA ka full form hai Low-Rank Adaptation.

Normal fine-tuning me model ke bahut saare parameters update hote hain. Ye expensive ho sakta hai. LoRA me full model ko update nahi karte. Instead, model ke kuch small adapter weights train karte hain.

LoRA ke benefits:

- Training cheaper hoti hai
- GPU memory kam lagti hai
- Base model unchanged rehta hai
- Multiple adapters maintain kar sakte ho
- Open-source LLM fine-tuning me common hai

### QLoRA kya hota hai?

QLoRA LoRA ka more memory-efficient version hai. Isme model ko quantized form me load karte hain, usually 4-bit, aur adapter train karte hain.

QLoRA useful hai jab:

- GPU memory limited hai
- Large model fine-tune karna hai
- Cost kam rakhni hai

Simple view:

- Full fine-tuning: expensive but powerful
- LoRA: cheaper adapter-based fine-tuning
- QLoRA: even more memory-efficient LoRA

### Overfitting in fine-tuning

Overfitting ka matlab model training examples ko ratta maar leta hai, lekin new examples par poor perform karta hai.

Signs:

- Training examples par perfect output
- New examples par wrong output
- Same phrases repeat karna
- Too rigid behavior
- Unseen categories handle na kar pana

Avoid kaise kare:

- Clean and diverse dataset
- Validation set use karo
- Too many epochs avoid karo
- Duplicate examples remove karo
- Evaluation examples manually test karo
- Edge cases include karo

### Fine-tuning dataset quality rules

Good dataset:

- Clear input
- Correct output
- Consistent format
- Realistic examples
- Edge cases included
- No sensitive data
- No contradictory labels
- Balanced categories

Bad dataset:

- Mixed output formats
- Wrong labels
- Duplicate examples
- Too many easy examples
- Missing edge cases
- Outdated business rules
- Private user data without masking

### Example dataset formats

#### Chat format

```json
{
  "messages": [
    {"role": "system", "content": "You classify support tickets."},
    {"role": "user", "content": "I was charged twice for my subscription."},
    {"role": "assistant", "content": "{\"category\":\"billing\",\"priority\":\"high\"}"}
  ]
}
```

#### Prompt-completion style

```json
{
  "prompt": "Classify: I cannot reset my password",
  "completion": "account_access"
}
```

#### Extraction style

```json
{
  "input": "Invoice #A102 for $450 due on 2026-06-01",
  "output": {
    "invoice_id": "A102",
    "amount": 450,
    "due_date": "2026-06-01"
  }
}
```

### Fine-tuning evaluation checklist

- Base model vs fine-tuned model compare kiya?
- Same test set use hua?
- Output valid JSON hai?
- Required fields missing to nahi?
- Wrong categories kitni hain?
- Edge cases pass ho rahe hain?
- Model hallucinate to nahi kar raha?
- Prompt ke bina bhi expected behavior aa raha hai?
- Cost and latency acceptable hai?
- Human review kiya?

### Fine-tuning project idea

Build: Support Ticket Classifier

Goal:

- User message ko category, priority aur suggested action me classify karna.

Categories:

- `billing`
- `technical`
- `account_access`
- `refund`
- `shipping`
- `general`

Output format:

```json
{
  "category": "billing",
  "priority": "high",
  "suggested_action": "Check payment transaction and order status."
}
```

Steps:

1. 100-300 labeled examples create karo.
2. Dataset ko train/validation/test me split karo.
3. Base model prompt se baseline result lo.
4. Fine-tune karo.
5. Same test set par compare karo.
6. FastAPI endpoint banao: `/classify-ticket`.
7. Logs me input, prediction, model version aur confidence store karo.

### Beginner summary

Fine-tuning tab karo jab tumhare paas repeated examples hain aur tum model ka behavior consistent banana chahte ho. Agar tumhe latest documents se answer chahiye, RAG better hai. Agar model ko specific format, tone, classification, extraction ya tool usage sikhana hai, fine-tuning powerful option hai.

## 19. Model Evaluation

### Traditional ML metrics

- Accuracy
- Precision
- Recall
- F1 score
- ROC-AUC
- Confusion matrix
- MAE/MSE/RMSE

### LLM/RAG metrics

- Faithfulness
- Answer relevance
- Context relevance
- Retrieval precision
- Hallucination rate
- Citation accuracy
- Latency
- Cost per request

### AI developer mindset

Production AI me "output achcha lag raha hai" enough nahi hota. Evaluation dataset, test cases, logs aur failure analysis zaroori hain.

## 20. MLOps And Deployment

### MLOps kya hai?

MLOps ka full form hai Machine Learning Operations. Simple words me, MLOps ka matlab hai ML/AI models ko sirf notebook me train karna nahi, balki unhe reliable production system ki tarah build, deploy, monitor aur improve karna.

Normal software me code deploy hota hai. ML/AI systems me code ke saath data, model, prompts, embeddings, evaluation results aur monitoring bhi manage karni padti hai. Isi complete process ko MLOps bolte hain.

### Simple example

Maan lo tumne ek spam classifier banaya:

- Notebook me model train karna ML development hai.
- Model ko API bana ke users ke liye available karna deployment hai.
- Model ka version save karna model registry hai.
- Naye emails par model sahi kaam kar raha hai ya nahi check karna monitoring hai.
- Jab spam patterns change ho jayein, model ko dobara train karna retraining hai.
- Ye complete loop MLOps hai.

### MLOps kyun important hai?

ML model ek baar train karke hamesha perfect nahi chalta. Real world data change hota rehta hai. User behavior, language, products, fraud patterns, support questions, documents aur business rules sab time ke saath update hote hain.

MLOps help karta hai:

- Model ko safely production me deploy karne me
- Model versions track karne me
- Data aur model quality monitor karne me
- Failures detect karne me
- Retraining automate karne me
- Cost, latency aur accuracy balance karne me
- Team ke beech reproducible workflow banane me

### DevOps vs MLOps

| Area | DevOps | MLOps |
|------|--------|-------|
| Main focus | Code deployment | Code + data + model deployment |
| Output | Application | Model/API/prediction system |
| Versioning | Code version | Code, data, model, prompt, config |
| Testing | Unit/integration tests | Data tests, model tests, evaluation tests |
| Monitoring | Errors, CPU, memory, latency | Accuracy, drift, hallucination, latency, cost |
| Failure reason | Code bug mostly | Code bug, bad data, drift, weak model, bad prompt |
| Update cycle | Code change par deploy | Data/model/prompt change par deploy |

### MLOps lifecycle

#### 1. Data collection

Raw data collect hota hai:

- CSV files
- Database records
- User logs
- Documents
- Chat history
- Images/audio/video
- API events

AI developer ko samajhna chahiye:

- Data source kya hai?
- Data reliable hai ya noisy?
- PII/sensitive data hai kya?
- Labels available hain ya nahi?
- Data update kitni frequency se hota hai?

#### 2. Data validation

Data directly model me nahi daalte. Pehle validate karte hain:

- Required columns present hain?
- Missing values zyada to nahi?
- Data type correct hai?
- Duplicate records hain?
- Labels valid hain?
- Distribution suddenly change to nahi hui?

Example:

```python
assert "text" in df.columns
assert "label" in df.columns
assert df["text"].notna().mean() > 0.95
```

#### 3. Data preprocessing

Data ko model-ready format me convert karte hain:

- Text cleaning
- Tokenization
- Feature extraction
- Scaling
- Encoding
- Chunking for RAG
- Embedding generation

RAG system me preprocessing ka matlab hota hai:

- Documents load karna
- Text extract karna
- Chunks banana
- Metadata attach karna
- Embeddings create karna
- Vector DB me store karna

#### 4. Model training

Traditional ML/deep learning me model train hota hai:

- Training data
- Validation data
- Algorithm/model architecture
- Hyperparameters
- Loss function
- Metrics

LLM apps me hamesha training nahi hoti. Kabhi-kabhi ye cheezein hoti hain:

- Prompt improvement
- RAG retrieval improvement
- Fine-tuning
- Embedding model change
- Reranker add karna

#### 5. Experiment tracking

Har experiment ka record rakhna important hai:

- Kaunsa dataset use hua?
- Kaunsa model use hua?
- Hyperparameters kya the?
- Metrics kya aaye?
- Code version kya tha?
- Prompt version kya tha?

Tools:

- MLflow
- Weights & Biases
- Neptune
- TensorBoard
- LangSmith for LLM apps

#### 6. Model evaluation

Deploy karne se pehle model evaluate karte hain.

Traditional ML metrics:

- Accuracy
- Precision
- Recall
- F1 score
- ROC-AUC
- Confusion matrix

LLM/RAG metrics:

- Answer relevance
- Faithfulness
- Context relevance
- Retrieval accuracy
- Citation correctness
- Hallucination rate
- Latency
- Cost per request

Important: Agar model test data par achcha perform nahi kar raha, to production me deploy nahi karna chahiye.

#### 7. Model registry

Model registry ek place hota hai jahan trained model versions save hote hain.

Example:

- `spam-classifier:v1`
- `spam-classifier:v2`
- `embedding-model:2026-05-16`
- `rag-prompt:v3`

Registry me store hota hai:

- Model file
- Version
- Metrics
- Training data reference
- Owner
- Approval status
- Deployment status

#### 8. Deployment

Model ko production me serve karne ke common ways:

- REST API using FastAPI
- Batch job
- Stream processing
- Serverless function
- Docker container
- Kubernetes service

Example FastAPI endpoint:

```python
from fastapi import FastAPI

app = FastAPI()

@app.post("/predict")
def predict(input_text: str):
    prediction = model.predict([input_text])
    return {"prediction": prediction[0]}
```

#### 9. Monitoring

Deploy ke baad system ko monitor karna MLOps ka core part hai.

Monitor these:

- Request count
- Latency
- Error rate
- Model output quality
- Token usage
- Cost
- Input distribution
- Prediction distribution
- User feedback
- Hallucination cases
- Retrieval failures

ML-specific monitoring:

- Data drift: input data training data se different ho raha hai
- Concept drift: same input ka meaning/business rule change ho gaya
- Model decay: model ki performance time ke saath down ho rahi hai

#### 10. Retraining and improvement

Jab monitoring me issue mile, model/system improve hota hai:

- New data collect karo
- Bad predictions analyze karo
- Dataset update karo
- Model retrain karo
- Evaluation run karo
- New version deploy karo

LLM/RAG me improvement ho sakta hai:

- Better chunking
- Better metadata
- Better prompt
- Better embedding model
- Reranking
- More evaluation examples
- Guardrails

### MLOps in LLM and RAG apps

Modern AI developer ke liye MLOps sirf model training nahi hai. LLM apps me bhi MLOps thinking zaroori hai.

#### RAG system me MLOps

- Documents ka ingestion pipeline
- Chunking version
- Embedding model version
- Vector DB index version
- Retriever configuration
- Prompt version
- Evaluation dataset
- Source citation tracking
- Reindexing schedule
- Access control

Example problem:

Agar company policy document update ho gaya, lekin vector database reindex nahi hua, to AI assistant old answer dega. MLOps pipeline ensure karta hai ki updated document process ho, embeddings refresh hon, aur retrieval latest data se ho.

#### LLM app me MLOps

- Prompt versions track karna
- Model provider/model name track karna
- Token cost monitor karna
- Latency monitor karna
- Bad responses log karna
- Safety failures detect karna
- Regression tests run karna
- Structured output validation karna

Example:

Prompt v1 achcha answer deta tha, prompt v2 deploy karne ke baad JSON output break hone laga. Agar prompt versioning aur evaluation tests hain, to issue quickly catch ho jayega.

### Kya aana chahiye

- FastAPI
- Docker
- Environment variables
- Model serving
- Batch vs real-time inference
- Background queues
- Logging
- Monitoring
- CI/CD basics
- Cloud deployment basics
- Model versioning
- Data validation
- Experiment tracking
- Evaluation pipeline
- Model registry basics
- Drift detection basics
- Rollback strategy

### AI me use

- LLM API backend
- RAG service
- Embedding pipeline
- Model inference API
- Scheduled data processing
- Fine-tuning pipeline
- Embedding refresh pipeline
- AI monitoring dashboard
- Automated evaluation before deploy

### Common tools

#### API and serving

- FastAPI
- Flask
- BentoML
- TorchServe
- TensorFlow Serving

#### Packaging and deployment

- Docker
- Docker Compose
- Kubernetes
- AWS ECS/EKS/Lambda
- GCP Cloud Run
- Azure Container Apps

#### Pipelines and orchestration

- Airflow
- Prefect
- Dagster
- Kubeflow

#### Experiment tracking and registry

- MLflow
- Weights & Biases
- TensorBoard

#### Monitoring

- Prometheus
- Grafana
- OpenTelemetry
- CloudWatch
- LangSmith

### Production checklist

- API has `/health` endpoint
- Secrets `.env` or secret manager me hain
- Model/prompt version tracked hai
- Input validation hai
- Output validation hai
- Logs structured format me hain
- Latency and error monitoring hai
- Cost tracking hai
- Evaluation dataset available hai
- Rollback plan hai
- User feedback capture ho raha hai
- PII data safely handle ho raha hai

### Real-world AI backend architecture

Ek production AI backend roughly aisa dikhta hai:

```text
User/App
  -> FastAPI Backend
  -> Auth + Rate Limit
  -> Input Validation
  -> Retriever / Model / LLM Call
  -> Output Validation
  -> Response
  -> Logs + Metrics + Feedback Store
```

RAG pipeline:

```text
Documents
  -> Loader
  -> Parser
  -> Chunker
  -> Embedding Model
  -> Vector Database
  -> Retriever
  -> LLM
  -> Answer with Sources
```

### Practice

- FastAPI endpoint banao:
  - `/chat`
  - `/embed`
  - `/search`
  - `/health`
- Har request ka `request_id`, latency, model name, token usage aur error status log karo.
- Ek simple evaluation file banao jisme 20 test questions aur expected answers/sources hon.
- Prompt ka version maintain karo: `prompt_v1`, `prompt_v2`, `prompt_v3`.
- Dockerfile banao aur API ko container me run karo.
- Ek rollback plan likho: agar new prompt/model fail ho jaye to old version par kaise jaoge.

### Beginner ko MLOps kaise start karna chahiye?

Start simple:

1. FastAPI se model/LLM endpoint banao.
2. Docker se app run karo.
3. Logs add karo.
4. Basic evaluation test cases likho.
5. Prompt/model version manually track karo.
6. GitHub Actions se tests run karna seekho.
7. Cloud par deploy karo.
8. Latency, error aur cost monitor karo.

Pehle Kubernetes, Kubeflow, advanced drift detection me jump mat karo. Strong base banao: API, Docker, logs, evaluation, versioning, deployment.

## 21. Databases For AI Apps

### Relational databases

- PostgreSQL
- MySQL
- SQLite

### NoSQL / document stores

- MongoDB
- DynamoDB

### Vector stores

- FAISS
- Chroma
- Pinecone
- Weaviate
- Qdrant
- pgvector

### AI developer ko kya samajhna hai

- User data kahan store hoga
- Chat history ka schema
- Documents and chunks ka schema
- Embedding vectors kahan store honge
- Metadata filtering kaise hoga
- Access control kaise hoga

## 22. Observability For AI

### Kya track karna chahiye

- User input
- Retrieved chunks
- Final prompt
- Model output
- Token usage
- Cost
- Latency
- Errors
- User feedback
- Safety failures

### Tools

- LangSmith
- OpenTelemetry
- Prometheus/Grafana
- Cloud logs
- Custom database logs

### Production mindset

AI app deploy karne ke baad sabse important kaam hota hai: real user failures dekhna, categorize karna, aur system improve karna.

## 23. Security And Safety

### Kya aana chahiye

- Prompt injection
- Data leakage
- PII handling
- API key security
- Rate limiting
- Input validation
- Output validation
- Access control
- Audit logs

### AI me use

- Enterprise chatbots
- Internal knowledge assistants
- Customer support bots
- Document analysis systems

### Practice

- RAG app me rule add karo: model sirf retrieved context ke basis par answer kare; agar context missing hai to clearly bole ki answer available nahi hai.

## 24. AI Projects Jo Portfolio Me Hone Chahiye

### Beginner

- CSV data cleaner
- Spam classifier
- Sentiment analyzer
- Semantic search app

### Intermediate

- PDF Q&A RAG app
- AI customer support assistant
- Resume parser
- Product recommendation using embeddings
- SQL question-answering assistant

### Advanced

- Multi-agent research assistant
- Code review assistant
- Fine-tuned classifier
- RAG with reranking and citations
- AI workflow automation with LangGraph
- Production FastAPI AI backend with Docker

## 25. Learning Order

### Phase 1: Data and Math Base

1. Python
2. NumPy
3. Pandas
4. Basic statistics
5. ML basics
6. Scikit-Learn

### Phase 2: Deep Learning And NLP

1. Tensors
2. PyTorch basics
3. Neural networks
4. NLP basics
5. Transformers overview
6. Hugging Face basics

### Phase 3: LLM Apps

1. Prompting
2. Structured outputs
3. Embeddings
4. Vector search
5. RAG
6. LangChain
7. LangGraph

### Phase 4: Production AI

1. FastAPI
2. Docker
3. Database design
4. Logging and monitoring
5. Evaluation
6. Security
7. Deployment

## 26. Interview Questions To Prepare

- NumPy array and Python list me difference kya hai?
- Cosine similarity embeddings me kyun use hoti hai?
- Pandas me missing values kaise handle karoge?
- Overfitting kya hota hai?
- Precision aur recall me difference kya hai?
- Classification aur regression me difference kya hai?
- Embedding kya hoti hai?
- RAG kya hai aur fine-tuning se kaise different hai?
- Chunk size ka impact kya hota hai?
- Vector database kyun use karte hain?
- LangChain aur LangGraph me difference kya hai?
- Prompt injection kya hota hai?
- LLM hallucination reduce kaise karoge?
- Production AI app me logging kya karni chahiye?
- AI app ka cost optimize kaise karoge?

## 27. Minimum Skill Checklist

Ek achcha AI developer banne ke liye ye minimum confidently aana chahiye:

- Python backend APIs banana
- NumPy se vector similarity samajhna
- Pandas se data clean karna
- Scikit-Learn se baseline ML model banana
- PyTorch ka basic training loop samajhna
- Embeddings generate aur search karna
- RAG pipeline build karna
- LangChain se chains/retrievers banana
- LangGraph se stateful agent workflow banana
- FastAPI se AI endpoint expose karna
- Docker se app run karna
- Logs, errors, latency, cost track karna
- AI output evaluate karna
- Prompt injection aur data leakage se bachna

## 28. Best Daily Practice Routine

### Daily 60-90 minutes

- 20 min: theory notes
- 30 min: code practice
- 20 min: mini project improvement
- 10 min: interview Q&A revision

### Weekly target

- 1 working mini project
- 1 notes file
- 10 interview questions
- 1 GitHub commit

## 29. Final Direction

AI developer banne ke liye teen layers strong karo:

1. Data layer: NumPy, Pandas, SQL, preprocessing
2. Model layer: ML basics, PyTorch, embeddings, transformers
3. Product layer: RAG, agents, APIs, deployment, evaluation

Jab ye teen layers connect ho jaati hain, tab tum sirf model use karne wale developer nahi rehte. Tum complete AI systems build karne wale engineer ban jaate ho.
