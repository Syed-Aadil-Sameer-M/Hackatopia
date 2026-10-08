import json
from pathlib import Path

from .chroma_client import vector_store


# ---------------------------------------------------------
# Paths
# ---------------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent.parent
PATIENTS_FILE = BASE_DIR / "data" / "patients.json"


# ---------------------------------------------------------
# Load patient data
# ---------------------------------------------------------

with open(PATIENTS_FILE, "r", encoding="utf-8") as f:
    patients = json.load(f)


# ---------------------------------------------------------
# Helper
# ---------------------------------------------------------

def format_item(item):
    """
    Converts either a string or dictionary into readable text.
    """

    if isinstance(item, str):
        return item

    if isinstance(item, dict):
        parts = []

        for key, value in item.items():
            if value is not None:
                parts.append(f"{key}: {value}")

        return ", ".join(parts)

    return str(item)


# ---------------------------------------------------------
# Create documents
# ---------------------------------------------------------

all_documents = []
all_metadatas = []
all_ids = []


for patient in patients:

    patient_id = patient["patient_id"]
    name = patient.get("name", "Unknown")
    age = patient.get("age", "Unknown")
    gender = patient.get("gender", "Unknown")
    criticality = patient.get("criticality", "Unknown")

    # -----------------------------------------------------
    # 1. ALLERGIES
    # -----------------------------------------------------

    allergies = patient.get("allergies", [])

    if not allergies:
        allergies = ["No known allergies"]

    allergy_text = (
        f"Patient ID: {patient_id}\n"
        f"Patient Name: {name}\n"
        f"Age: {age}\n"
        f"Gender: {gender}\n"
        f"Criticality: {criticality}\n\n"
        f"Allergies:\n"
        + "\n".join(f"- {format_item(a)}" for a in allergies)
    )

    all_documents.append(allergy_text)

    all_metadatas.append({
        "patient_id": patient_id,
        "patient_name": name,
        "event_type": "allergy",
        "criticality": criticality
    })

    all_ids.append(f"{patient_id}_allergies")


    # -----------------------------------------------------
    # 2. CONDITIONS
    # -----------------------------------------------------

    conditions = patient.get("conditions", [])

    if not conditions:
        conditions = ["No significant medical conditions"]

    condition_text = (
        f"Patient ID: {patient_id}\n"
        f"Patient Name: {name}\n"
        f"Age: {age}\n"
        f"Gender: {gender}\n"
        f"Criticality: {criticality}\n\n"
        f"Medical Conditions:\n"
        + "\n".join(f"- {format_item(c)}" for c in conditions)
    )

    all_documents.append(condition_text)

    all_metadatas.append({
        "patient_id": patient_id,
        "patient_name": name,
        "event_type": "condition",
        "criticality": criticality
    })

    all_ids.append(f"{patient_id}_conditions")


    # -----------------------------------------------------
    # 3. PRESCRIPTIONS / MEDICATIONS
    # -----------------------------------------------------

    prescriptions = patient.get("past_prescriptions", [])

    if not prescriptions:
        prescriptions = ["No current prescriptions"]

    prescription_text = (
        f"Patient ID: {patient_id}\n"
        f"Patient Name: {name}\n"
        f"Age: {age}\n"
        f"Gender: {gender}\n"
        f"Criticality: {criticality}\n\n"
        f"Medications and Prescription History:\n"
        + "\n".join(
            f"- {format_item(p)}"
            for p in prescriptions
        )
    )

    all_documents.append(prescription_text)

    all_metadatas.append({
        "patient_id": patient_id,
        "patient_name": name,
        "event_type": "medication",
        "criticality": criticality
    })

    all_ids.append(f"{patient_id}_medications")


    # -----------------------------------------------------
    # 4. MEDICAL HISTORY
    # -----------------------------------------------------

    history = patient.get("medical_history", [])

    if not history:
        history = ["No medical history available"]

    history_text = (
        f"Patient ID: {patient_id}\n"
        f"Patient Name: {name}\n"
        f"Age: {age}\n"
        f"Gender: {gender}\n"
        f"Criticality: {criticality}\n\n"
        f"Medical History:\n"
        + "\n".join(
            f"- {format_item(h)}"
            for h in history
        )
    )

    all_documents.append(history_text)

    all_metadatas.append({
        "patient_id": patient_id,
        "patient_name": name,
        "event_type": "medical_history",
        "criticality": criticality
    })

    all_ids.append(f"{patient_id}_medical_history")


# ---------------------------------------------------------
# Store documents in Chroma
# ---------------------------------------------------------

print(f"Patients loaded: {len(patients)}")
print(f"Documents created: {len(all_documents)}")

vector_store.add_texts(
    texts=all_documents,
    metadatas=all_metadatas,
    ids=all_ids
)

print("✅ Patient data successfully ingested into ChromaDB.")