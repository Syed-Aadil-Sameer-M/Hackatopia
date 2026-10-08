import json
from pathlib import Path

from .chroma_client import vector_store


BASE_DIR = Path(__file__).resolve().parent.parent
PATIENT_FILE = BASE_DIR / "data" / "patients.json"


def patient_to_document(patient):
    prescriptions = "\n".join(
        f"- {p['drug']} ({p['date']}): {p['outcome']}"
        for p in patient["past_prescriptions"]
    )

    allergies = ", ".join(patient["allergies"])
    conditions = ", ".join(patient["conditions"])

    history = "\n".join(
        f"- {item}"
        for item in patient["medical_history"]
    )

    return f"""
Patient ID: {patient['patient_id']}
Name: {patient['name']}
Age: {patient['age']}
Gender: {patient['gender']}

Allergies:
{allergies}

Medical Conditions:
{conditions}

Past Prescriptions:
{prescriptions}

Medical History:
{history}
""".strip()


def main():
    with open(PATIENT_FILE, "r", encoding="utf-8") as file:
        patients = json.load(file)

    documents = []
    ids = []
    metadatas = []

    for patient in patients:
        documents.append(patient_to_document(patient))

        ids.append(patient["patient_id"])

        metadatas.append({
            "patient_id": patient["patient_id"],
            "name": patient["name"],
            "age": patient["age"]
        })

    vector_store.add_texts(
        texts=documents,
        metadatas=metadatas,
        ids=ids
    )

    print(
        f"Successfully embedded {len(documents)} patients into ChromaDB."
    )


if __name__ == "__main__":
    main()