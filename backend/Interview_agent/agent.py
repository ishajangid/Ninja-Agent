from google.adk.agents import Agent
from google.adk.sessions import Session

import google.generativeai as genai
import psycopg2
from typing import Dict, Any, Optional, Tuple
import os
import json

# Database config
DB_CONFIG = {
    "host": "localhost",
    "database": "Interview",
    "user": "postgres",
    "password": "1718",
    "port": 5432
}

def get_question(qid: int) -> Optional[Dict[str, Any]]:
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        query = "SELECT QID, Problem, ModelAnswer, Field FROM Question WHERE QID = %s"
        cursor.execute(query, (qid,))
        result = cursor.fetchone()
        if result:
            return {
                'id': result[0],
                'problem': result[1],
                'model_answer': result[2],
                'field': result[3]
            }
        return None
    except psycopg2.Error as e:
        print(f"Error fetching question: {e}")
        return None
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'conn' in locals(): conn.close()

# voice-to-text import
try:
    from .tools.voice_to_text import transcribe_audio
except ImportError:
    try:
        from Interview_agent.tools.voice_to_text import transcribe_audio
    except ImportError:
        print("Warning: Could not import transcribe_audio function")
        transcribe_audio = None

def evaluate_voice_response(audio_path: str) -> str:
    if transcribe_audio is None:
        return "Error: transcribe_audio function not available"

    try:
        if not os.path.exists(audio_path):
            return f"Error: Audio file not found at {audio_path}"

        print(f"Transcribing audio from: {audio_path}")
        transcript_path = os.path.join(os.path.dirname(audio_path), f"transcript_{os.path.basename(audio_path)}.txt")
        transcribe_audio(audio_path, transcript_path)

        if os.path.exists(transcript_path):
            with open(transcript_path, "r", encoding="utf-8") as file:
                candidate_answer = file.read().strip()
            os.remove(transcript_path)
        else:
            return "Error: Transcript file not found after transcription"

        print("Candidate answer:", repr(candidate_answer))
        return candidate_answer

    except Exception as e:
        return f"Error processing audio: {str(e)}"

def save_candidate_response(candidate_id: int, response: str):
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        cursor.execute("UPDATE Candidate SET response = %s WHERE cid = %s", (response, candidate_id))
        conn.commit()
        print(f"Candidate response saved for cid={candidate_id}")
    except psycopg2.Error as e:
        print(f"Error saving response: {e}")
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'conn' in locals(): conn.close()

def save_candidate_score(candidate_id: int, score: float):
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        cursor.execute("UPDATE Candidate SET score = %s WHERE cid = %s", (score, candidate_id))
        conn.commit()
        print(f"Candidate score saved for cid={candidate_id}, score={score}")
    except psycopg2.Error as e:
        print(f"Error saving score for cid={candidate_id}: {e}")
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'conn' in locals(): conn.close()

def evaluate_and_score_response(question_data: Dict[str, Any], candidate_answer: str) -> Tuple[float, str]:
    prompt_text = f"""
Question: {question_data.get('problem', 'No question found')}
Model Answer: {question_data.get('model_answer', 'No model answer found')}
Field/Subject: {question_data.get('field', 'Unknown')}

Candidate's Answer (transcribed from audio): {candidate_answer}

Evaluate the candidate's understanding and return your evaluation in this JSON format:

{{
  "response": [
    {{
      "evaluationAreaName": "{question_data.get('field', 'Unknown')}",
      "rating": "X.X"
    }}
  ]
}}

Only return the JSON object as output.
"""

    response_text = ""

    try:
        session = Session(
            id="eval-session-01",
            app_name="interview-evaluator",
            user_id="admin@agent.local",
            agent=root_agent
        )

        result = session.run(prompt_text)
        response_text = result.text if hasattr(result, "text") else str(result)

        if response_text.startswith("```json"):
            response_text = response_text[len("```json"):].strip()
        if response_text.endswith("```"):
            response_text = response_text[:-len("```")].strip()

        score = float(json.loads(response_text)["response"][0]["rating"])
        return score, response_text

    except Exception as e:
        raise ValueError(f"Agent response could not be parsed as score: {e}\nRaw response: {response_text}")

# ADK Root Agent
root_agent = Agent(
    name="Interview_agent",
    model="gemini-2.0-flash",
    description="You are a voice response evaluation agent that evaluates candidate responses.",
    instruction="""
You are a Voice Response Evaluation Agent.

Your task is to evaluate the candidate's transcribed response against the given question and model answer.

Rating guidelines (scale 0.0 to 10.0):
- 0.0: Completely incorrect or irrelevant
- 5.0: Partially correct, some key info missing or errors
- 10.0: Fully correct, comprehensive, and relevant

Provide your evaluation in this exact JSON format:

{
  "response": [
    {
      "evaluationAreaName": "General",
      "rating": "X.X"
    }
  ]
}

Only return the JSON object as output.
"""
)

agent = root_agent
