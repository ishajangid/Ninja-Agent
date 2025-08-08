import sys
import os
import psycopg2
from typing import Dict, Any, Optional

# Add the parent directory of Interview_agent to the Python path
# This allows importing modules like Interview_agent.agent
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '.')))

# Import functions from your agent.py
try:
    from Interview_agent.agent import (
        get_question,
        evaluate_and_score_response,
        save_candidate_score, # Import the new function
        DB_CONFIG # Import DB_CONFIG as well
    )
except ImportError as e:
    print(f"Error importing from Interview_agent.agent: {e}")
    print("Please ensure Interview_agent/agent.py is correctly structured and on PYTHONPATH.")
    sys.exit(1)


def get_candidate_details(candidate_id: int) -> Optional[Dict[str, Any]]:
    """Fetches question ID and candidate's transcribed response for a given candidate ID."""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        # Fetch question_id and the stored 'response' (transcript)
        query = "SELECT qid, response FROM Candidate WHERE cid = %s"
        cursor.execute(query, (candidate_id,))
        result = cursor.fetchone()
        
        if result:
            return {
                'qid': result[0],
                'candidate_response': result[1]
            }
        return None
    except psycopg2.Error as e:
        print(f"Error fetching candidate details: {e}")
        return None
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'conn' in locals(): conn.close()


def main(candidate_id: int):
    print(f"\n--- Running evaluation for Candidate ID: {candidate_id} ---")

    # 1. Get candidate details (question_id and transcribed answer)
    candidate_details = get_candidate_details(candidate_id)
    if not candidate_details:
        print(f"Error: Candidate with ID {candidate_id} not found or no response recorded.")
        return

    question_id = candidate_details['qid']
    candidate_answer = candidate_details['candidate_response']

    if not candidate_answer:
        print(f"Warning: No transcribed response found for Candidate ID {candidate_id}. Skipping evaluation.")
        return

    print(f"Fetched Candidate Answer: '{candidate_answer[:50]}...'") # Print first 50 chars

    # 2. Get question data
    question_data = get_question(question_id)
    if not question_data:
        print(f"Error: Question with ID {question_id} not found.")
        return
    
    print(f"Fetched Question Problem: '{question_data.get('problem', 'N/A')}'")

    # 3. Evaluate candidate response using the agent
    try:
        score, agent_raw_response = evaluate_and_score_response(question_data, candidate_answer)
        print(f"\n--- Evaluation Results for Candidate ID {candidate_id} ---")
        print(f"Score: {score}")
        print(f"Agent's Raw Evaluation: {agent_raw_response}")

        # 4. Save the score back to the database
        save_candidate_score(candidate_id, score)
        print(f"Successfully saved score {score} for Candidate ID {candidate_id} to database.")

    except ValueError as e:
        print(f"Evaluation Failed for Candidate ID {candidate_id}: {e}")
    except Exception as e:
        print(f"An unexpected error occurred during evaluation for Candidate ID {candidate_id}: {e}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python run_evaluation_script.py <candidate_id>")
        sys.exit(1)

    try:
        cid = int(sys.argv[1])
        main(cid)
    except ValueError:
        print("Error: Candidate ID must be an integer.")
        sys.exit(1)