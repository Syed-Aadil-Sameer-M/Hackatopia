import os
import uuid
from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware  # ✅ Capitalized 'M'
from services.ai_pipeline import (
    extract_clinical_entities,
    generate_clinical_note,
    transcribe_audio_file,
)

app = FastAPI(title="Ambient Clinical Scribe API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory store for session transcripts
sessions_db = {}


@app.post("/v1/sessions", status_code=201)
async def create_session(data: dict):
    session_id = f"sess_{uuid.uuid4().hex[:6]}"
    session_data = {
        "session_id": session_id,
        "status": "ready",
        "doctor_id": data.get("doctor_id", "d_001"),
        "patient_id": data.get("patient_id", "p_092"),
        "transcript": [],
        "patient_snapshot": {
            "name": "Ravi Kumar",
            "age": 52,
            "chronic_conditions": ["hypertension", "type2_diabetes"],
            "known_allergies": ["penicillin"],
        },
    }
    sessions_db[session_id] = session_data
    return session_data


@app.post("/v1/sessions/{session_id}/audio")
async def ingest_audio(
    session_id: str,
    chunk_index: int = Form(...),
    is_final: bool = Form(...),
    audio: UploadFile = File(...),
):
    temp_filename = f"temp_{session_id}_{chunk_index}.wav"
    try:
        with open(temp_filename, "wb") as f:
            f.write(await audio.read())

        text = transcribe_audio_file(temp_filename)
    finally:
        if os.path.exists(temp_filename):
            os.remove(temp_filename)

    speaker = "DOCTOR" if chunk_index % 2 == 0 else "PATIENT"
    line_item = {
        "speaker": speaker,
        "text": text,
        "start_ms": chunk_index * 5000,
        "end_ms": (chunk_index + 1) * 5000,
        "confidence": 0.94,
    }

    if session_id in sessions_db:
        sessions_db[session_id]["transcript"].append(line_item)

    return {
        "chunk_index": chunk_index,
        "language_detected": "kn-en",
        "transcript": [line_item],
        "extraction_triggered": True,
    }


@app.get("/v1/sessions/{session_id}/transcript")
async def get_transcript(session_id: str):
    transcript_lines = sessions_db.get(session_id, {}).get("transcript", [])
    return {
        "session_id": session_id,
        "total_duration_ms": len(transcript_lines) * 5000,
        "lines": transcript_lines,
    }


@app.post("/v1/sessions/{session_id}/extract")
async def extract_info(session_id: str, body: dict):
    transcript_lines = sessions_db.get(session_id, {}).get("transcript", [])
    full_text = " ".join([t["text"] for t in transcript_lines])

    extracted_data = extract_clinical_entities(
        full_text or "Doctor prescribed Amoxicillin 500mg"
    )

    return {
        "extraction_id": f"ext_{uuid.uuid4().hex[:4]}",
        "session_id": session_id,
        "extracted": extracted_data,
        "rag_triggered": True,
        "warnings": [],
    }


@app.post("/v1/notes/generate")
async def generate_note(body: dict):
    session_id = body.get("session_id")
    transcript_lines = sessions_db.get(session_id, {}).get("transcript", [])
    full_text = " ".join([t["text"] for t in transcript_lines])

    note_data = generate_clinical_note(
        full_text or "Patient has hypertension and sore throat."
    )

    return {
        "note_id": f"note_{uuid.uuid4().hex[:6]}",
        "session_id": session_id,
        "status": "draft",
        "content": note_data,
        "warnings_unresolved": 0,
    }