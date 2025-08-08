# Ninja-Agent  
**Angular Flask FasterWhisper Google-ADK Google-SDK LLMs SQLite**  

An advanced AI-powered interview evaluation system that automates technical and behavioral interview assessments using **speech recognition** and **natural language understanding**, delivering real-time, unbiased scoring and feedback.  

---

## 🚀 Key Features  
- **Automated Interview Flow:** Presents predefined questions and records verbal responses.  
- **High-Performance Transcription:** Uses **FasterWhisper** for accurate, low-latency speech-to-text conversion.  
- **Semantic Evaluation:** Leverages **Google Gemini** and **OpenAI GPT-4** for intelligent scoring.  
- **Structured Feedback:** Generates scores (0–10), improvement suggestions, and personalized analysis.  
- **Modular Architecture:** Independent components for transcription, prompt generation, and scoring.  
- **Real-Time Results:** Stores results in SQLite and displays them instantly on the frontend.  

---

## 📋 Requirements  
- Python 3.8+  
- Flask  
- Angular  
- FasterWhisper  
- Sentence-BERT (SBERT)  
- SQLite  
- Google ADK & Google SDK  

---

## 🔧 Installation  

**Clone the repository:**  
```bash
git clone https://github.com/ishajangid/Ninja-Agent.git
Install backend dependencies:

bash
Copy
Edit
cd backend
pip install -r requirements.txt
Install frontend dependencies:

bash
Copy
Edit
cd frontend
npm install
💻 Usage
Run the backend:

bash
Copy
Edit
cd backend
python app.py
Run the frontend:

bash
Copy
Edit
cd frontend
ng serve
Interview Workflow:

Candidate receives a question on the web interface.

Responds verbally via microphone input.

FasterWhisper transcribes audio in real-time.

LLM evaluates semantic similarity with reference answer.

Score + feedback stored and displayed instantly.

📊 Sample Output
json
Copy
Edit
{
  "candidate_name": "Isha Jangir",
  "question_id": "Q102",
  "response": [
    {
      "evaluationAreaName": "General",
      "rating": "8.5"
    }
  ]
}
🏗 Project Structure
bash
Copy
Edit
Ninja-Agent/
├── backend/            # Flask backend + FasterWhisper integration
├── frontend/           # Angular UI for candidate interaction
├── database/           # SQLite DB schema and stored results
└── README.md
🔬 Technical Overview
Speech Recognition:

Model: FasterWhisper (quantized for faster inference)

Decoding: Beam search for higher accuracy

Deployment: ONNX Runtime for CPU/GPU compatibility

Agentic AI Architecture:

Session state tracking

Voice activity handling

Prompt engineering for LLM evaluation

Score parsing and feedback generation

Google ADK:

Multi-turn dialogue management

REST API communication between frontend & backend

Metadata routing and formatting

Google SDK:

Voice Activity Detection (VAD) for seamless interaction

Real-time audio recording and encoding

Event-driven triggers for automated scoring

📌 System Architecture Diagram

📈 Future Directions
Facial emotion recognition

Multilingual input support

Recruiter analytics dashboard

Integration with LinkedIn/Naukri APIs
