MOCK_ABHA_PATIENTS = {
    "ABHA-1001": {
        "abha_id": "ABHA-1001",
        "name": "Ravi Kumar",
        "age": 68,
        "gender": "Male"
    },
    "ABHA-1002": {
        "abha_id": "ABHA-1002",
        "name": "Neha Kapoor",
        "age": 29,
        "gender": "Female"
    }
}


def get_patient_from_abha(abha_id: str):
    return MOCK_ABHA_PATIENTS.get(abha_id)