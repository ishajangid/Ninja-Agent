from faster_whisper import WhisperModel
import time
import os

def transcribe_audio(audio_path: str, output_file: str = "transcript.txt", model_size: str = "small.en") -> str:
    """
    Transcribe audio file to text
    
    Args:
        audio_path: Path to the audio file
        output_file: Path to save the transcript
        model_size: Whisper model size to use
    
    Returns:
        Path to the transcript file
    """
    try:
        # Check if audio file exists
        if not os.path.exists(audio_path):
            raise FileNotFoundError(f"Audio file not found: {audio_path}")
        
        print(f"Loading Whisper model: {model_size}")
        model = WhisperModel(model_size, device="cpu", compute_type="int8")
        
        print(f"Transcribing audio file: {audio_path}")
        start = time.time()
        
        # Transcribe the audio
        segments, info = model.transcribe(
            audio_path, 
            language="en", 
            beam_size=5,
            temperature=0.0,  # Use deterministic decoding
            condition_on_previous_text=False  # Better for short audio clips
        )

        # Collect all segments
        transcript = ""
        for segment in segments:
            print(f"[{segment.start:.2f}s -> {segment.end:.2f}s] {segment.text}")
            transcript += segment.text.strip() + " "

        # Clean up the transcript
        transcript = transcript.strip()
        
        if not transcript:
            transcript = "[No speech detected]"
        
        # Write to file
        with open(output_file, "w", encoding="utf-8") as f:
            f.write(transcript)

        end = time.time()
        print(f'Transcription completed in {end - start:.2f} seconds')
        print(f'Transcript saved to: {output_file}')
        print(f'Detected language: {info.language} (probability: {info.language_probability:.2f})')
        
        return output_file

    except Exception as e:
        error_msg = f"Error during transcription: {str(e)}"
        print(error_msg)
        
        # Write error to output file
        with open(output_file, "w", encoding="utf-8") as f:
            f.write(f"[Transcription Error: {str(e)}]")
        
        raise Exception(error_msg)