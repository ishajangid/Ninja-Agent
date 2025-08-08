from flask import Flask, request, jsonify
from Interview_agent.agent import (
    agent as root_agent,
    get_question,
    evaluate_voice_response,
    save_candidate_response,
    evaluate_and_score_response
)
from config import DB_CONFIG
import psycopg2
import json # Import json to parse agent_response for printing
import os
from datetime import datetime
from werkzeug.utils import secure_filename
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'candidate_recordings'
ALLOWED_EXTENSIONS = {'webm', 'wav', 'mp3', 'ogg', 'm4a'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(os.path.join(UPLOAD_FOLDER, 'by_date'), exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def create_organized_filepath(original_filename):
    today = datetime.now().strftime('%Y-%m-%d')
    date_folder = os.path.join(UPLOAD_FOLDER, 'by_date', today)
    os.makedirs(date_folder, exist_ok=True)
    return os.path.join(date_folder, original_filename)

@app.route('/api/question/<int:qid>', methods=['GET'])
def fetch_question(qid):
    question = get_question(qid)
    return jsonify(question)

@app.route('/api/upload-audio', methods=['POST'])
def upload_audio():
    try:
        if 'audio' not in request.files:
            return jsonify({'error': 'No audio file provided'}), 400

        audio_file = request.files['audio']
        if audio_file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        user_email = request.form.get('user_email', 'anonymous')
        question_id = int(request.form.get('question_id', 0))

        if not question_id or user_email == 'anonymous':
            return jsonify({'error': 'Missing user_email or question_id'}), 400

        timestamp = datetime.now().strftime('%Y-%m-%dT%H-%M-%S')
        original_filename = f"interview_{user_email.split('@')[0]}_q{question_id}_{timestamp}.webm"
        safe_filename = secure_filename(original_filename)
        file_path = create_organized_filepath(safe_filename)
        audio_file.save(file_path)

        print(f"Audio uploaded: {file_path} ({os.path.getsize(file_path)} bytes)")

        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        cursor.execute("SELECT cid FROM Candidate WHERE email = %s AND qid = %s", (user_email, question_id))
        result = cursor.fetchone()
        cursor.close()
        conn.close()

        if not result:
            return jsonify({'error': f"No candidate entry found for {user_email} q{question_id}"}), 404

        candidate_id = result[0]
        candidate_answer = evaluate_voice_response(file_path)

        if candidate_answer.startswith("Error:"):
            return jsonify({'error': candidate_answer}), 500

        save_candidate_response(candidate_id, candidate_answer)

        question = get_question(question_id)

        try:
            score, agent_response = evaluate_and_score_response(question, candidate_answer)

            conn = psycopg2.connect(**DB_CONFIG)
            cursor = conn.cursor()
            cursor.execute("UPDATE Candidate SET score = %s WHERE cid = %s", (score, candidate_id))
            conn.commit()
            cursor.close()
            conn.close()

            # --- MODIFICATION STARTS HERE ---
            print(f"\n--- Evaluation Results for Candidate ID {candidate_id} ---")
            print(f"Score: {score}")
            try:
                # Parse the agent's raw JSON response for structured printing
                evaluation_data = json.loads(agent_response)
                if evaluation_data and "response" in evaluation_data and len(evaluation_data["response"]) > 0:
                    area_name = evaluation_data["response"][0].get("evaluationAreaName", "N/A")
                    rating = evaluation_data["response"][0].get("rating", "N/A")
                    print(f"Evaluation Area: {area_name}")
                    print(f"Rating: {rating}")
                else:
                    print(f"Agent's Raw Evaluation (structured data not found): {agent_response}")
            except json.JSONDecodeError:
                print(f"Agent's Raw Evaluation (could not parse as JSON): {agent_response}")
            print("---------------------------------------------------\n")
            # --- MODIFICATION ENDS HERE ---

            return jsonify({
                'message': 'Audio uploaded and evaluated successfully',
                'filepath': file_path,
                'candidate_answer': candidate_answer,
                'score': score,
                'evaluation': agent_response
            }), 200

        except Exception as e:
            print("❌ Agent evaluation failed:", e)
            print("Raw agent output:", agent_response)
            return jsonify({
                'error': f'Agent evaluation or score parsing failed: {str(e)}',
                'agent_output': agent_response
            }), 500

    except Exception as e:
        return jsonify({'error': f'Upload + evaluation failed: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)