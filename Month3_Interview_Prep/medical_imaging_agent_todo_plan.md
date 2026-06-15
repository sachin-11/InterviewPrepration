# Step-by-Step Implementation Plan: Medical Imaging HITL Agent 🚀

This document provides a highly actionable, module-by-module development roadmap. You can open this file in VS Code and mark the checkbox `[ ]` as `[x]` as you complete each task.

---

## 📂 Project Directory Setup
Before beginning, create the following root folder structure in your workspace:
```text
medical-imaging-hitl/
├── backend/       # Python & FastAPI
└── frontend/      # Next.js (TypeScript & Tailwind)
```

---

## 🛠️ MODULE 1: Ingestion & Storage Service (Base Setup)
* **Goal**: Enable uploading high-resolution X-Ray files from the browser and saving them in an S3-compatible bucket.

- [ ] **Task 1.1: Backend Initialization**
  - Create `/backend` directory.
  - Set up a Python virtual environment (`python -m venv venv`) and activate it.
  - Install core packages: `fastapi uvicorn sqlalchemy psycopg2-binary boto3 python-multipart pydantic-settings python-dotenv`.
  - Create `app/main.py` with a simple health check `/` route.

- [ ] **Task 1.2: Object Storage Setup (Local MinIO or Mock)**
  - Spin up MinIO locally using Docker, or write a helper class using Python's `boto3` that simulates S3 uploads to a local `/storage` folder.
  - Implement `app/services/s3_service.py` to upload files and generate temporary pre-signed download URLs.

- [ ] **Task 1.3: FastAPI Scan Upload Endpoint**
  - Implement `POST /api/v1/scans/upload` endpoint accepting `UploadFile`.
  - Upload file to S3, generate image URL, and return JSON: `{"scan_id": "...", "image_url": "..."}`.

- [ ] **Task 1.4: Frontend Next.js Project Init**
  - In `/frontend`, run: `npx create-next-app@latest . --typescript --tailwind --app --src-dir`.
  - Create a page at `src/app/page.tsx` with a beautiful Tailwind file upload widget (e.g., drag and drop).

- [ ] **Task 1.5: Verify Upload Integration**
  - Connect Next.js uploader to backend `POST /api/v1/scans/upload`.
  - Ensure that uploading an image successfully sends the file, uploads it to S3, and renders it on screen.

---

## 🧠 MODULE 2: CNN Inference Engine (Mock Server)
* **Goal**: Run a classification model on the uploaded image and evaluate its prediction confidence.

- [ ] **Task 2.1: Model & Database Setup**
  - Install `sqlmodel` or `sqlalchemy` for PostgreSQL database integration.
  - Create the `scans` table (columns: `id`, `image_url`, `ai_prediction`, `ai_confidence`, `status`).

- [ ] **Task 2.2: Mock CNN Predictor**
  - Create `app/services/cnn_service.py`.
  - Write a mock predictor function that simulates tumor detection: returns prediction (`"Tumor"` or `"Normal"`) and a random confidence score between `0.50` and `0.99`.

- [ ] **Task 2.3: Confidence Classifier & Router Logic**
  - Create business logic:
    - If `confidence >= 0.90`: update scan status in DB to `AUTO_APPROVED` and return final analysis.
    - If `confidence < 0.90`: update scan status in DB to `PENDING_REVIEW`.

- [ ] **Task 2.4: Connect API & UI**
  - Update `POST /api/v1/scans/upload` to automatically invoke the CNN service and update the DB scan record.
  - If auto-approved, the Next.js frontend should immediately display the "Clean Scan Report" with high confidence.

---

## 🌿 MODULE 3: LangGraph Agent & State Persistence
* **Goal**: Orchestrate the flow using LangGraph, enabling the pipeline to pause when confidence is low.

- [ ] **Task 3.1: Install LangGraph**
  - Install `langgraph` in the python backend.

- [ ] **Task 3.2: Create State and Nodes**
  - Implement `app/agent/state.py` containing `AgentState` fields.
  - Implement `app/agent/graph.py` with nodes: `cnn_inference`, `ask_doctor`, and `save_data`.

- [ ] **Task 3.3: Implement Interrupt & Checkpointer**
  - Setup a SQL-based checkpointer to persist agent state.
  - Compile the graph with `interrupt_before=["ask_doctor"]`.
  - Test uploading a low-confidence scan: confirm the agent run automatically pauses at the `ask_doctor` node.

- [ ] **Task 3.4: Resume Callback Endpoint**
  - Create `POST /api/v1/doctor/verify/{scan_id}`.
  - This endpoint will update the paused LangGraph state with the doctor's labels and resume the workflow to complete it.

---

## 🩺 MODULE 4: Doctor Interface & Queue Dashboard
* **Goal**: Build an interface where doctors review low-confidence scans, inspect the AI's prediction, and annotate corrections.

- [ ] **Task 4.1: Doctor Queue API**
  - Create `GET /api/v1/doctor/queue` returning all scans where `status == "PENDING_REVIEW"`.

- [ ] **Task 4.2: Next.js Doctor Dashboard**
  - In frontend, create the path `/frontend/src/app/doctor/page.tsx` listing all queued scans in a sleek responsive layout.

- [ ] **Task 4.3: HTML5 Canvas Annotation Tool**
  - In `doctor/review/[id]/page.tsx`, show the selected X-Ray scan image.
  - Render an HTML5 canvas layer over the image.
  - Allow doctors to click and drag to draw a corrected bounding box around the detected tumor.

- [ ] **Task 4.4: Submit Verification**
  - Submit the doctor's inputs (label, notes, bounding box coordinates) to the `POST /api/v1/doctor/verify/{scan_id}` endpoint.
  - Refresh the queue, removing the processed item.

---

## 🗄️ MODULE 5: Active Learning Data Flywheel
* **Goal**: Automatically collect, store, and version all validated datasets to build the retraining pipeline.

- [ ] **Task 5.1: Post-Verification Node**
  - Add logic in the `save_data` LangGraph node to export verified scans.
  - Save the verified image and the doctor's ground truth labels in JSON/PascalVOC format into a dedicated `s3://retrain-dataset/` bucket.

- [ ] **Task 5.2: Audit Trail Logging**
  - Ensure all doctor approvals are recorded in PostgreSQL with exact timestamps, reviewer IDs, notes, and version information.

- [ ] **Task 5.3: Local Dataset Directory Assembly**
  - Implement a backend utility script to download the entire verified dataset from S3 into a local `/dataset` directory, ready to be read by training loaders.

---

## 🔄 MODULE 6: Retraining Scheduler & MLOps Pipeline
* **Goal**: Setup the automated system that periodically trains and deploys improved models.

- [ ] **Task 6.1: CNN Fine-Tuning Script**
  - Create `app/pipeline/retrain.py` using PyTorch to read images from `/dataset`, load the base model, and perform transfer learning with the new annotations.

- [ ] **Task 6.2: MLflow Integration**
  - Install `mlflow` and update the retraining script to log training parameters, evaluation loss, and accuracy metrics.
  - Register the newly trained model in the MLflow Model Registry if F1-score outperforms the production model.

- [ ] **Task 6.3: Automation Trigger**
  - Write a simple Prefect workflow, cron task, or a simple admin endpoint `/api/v1/admin/trigger-retrain` that launches the pipeline.
