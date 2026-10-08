import json
from pathlib import Path

from .mock_abha import get_patient_from_abha


BASE_DIR = Path(__file__).resolve().parent.parent
INTAKE_FILE = BASE_DIR / "data" / "intake_records.json"


def create_patient_intake(abha_id: str):

    patient = get_patient_from_abha(abha_id)

    if patient is None:
        return None

    patient_record = {
        "abha_id": patient["abha_id"],
        "patient_id": patient["abha_id"],
        "name": patient["name"],
        "age": patient["age"],
        "gender": patient["gender"],
        "criticality": "Normal",
        "allergies": [],
        "conditions": [],
        "past_prescriptions": [],
        "medical_history": []
    }

    if INTAKE_FILE.exists():

        with open(INTAKE_FILE, "r", encoding="utf-8") as f:
            records = json.load(f)

    else:
        records = []

    existing = next(
        (
            record
            for record in records
            if record["abha_id"] == abha_id
        ),
        None
    )

    if existing is None:
        records.append(patient_record)

        with open(INTAKE_FILE, "w", encoding="utf-8") as f:
            json.dump(records, f, indent=2)

    return patient_record