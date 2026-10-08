from fastapi import FastAPI
from datetime import datetime
import json
import uuid

from rules.allergy import check_allergy
from rules.interaction import check_interactions
from rules.dosage import check_dosage
from rules.duplicate import check_duplicate_drugs

app = FastAPI(title="HC-02 Rules Engine")


# Load drug database
with open("data/drug_database.json", "r", encoding="utf-8") as file:
    database = json.load(file)


@app.get("/")
def home():
    return {
        "service": "HC-02 Rules Engine",
        "status": "running"
    }


# LAB / VITAL VALUE CHECK
def check_lab_values(vitals):

    warnings = []

    bp_systolic = vitals.get("bp_systolic")
    bp_diastolic = vitals.get("bp_diastolic")
    temp_c = vitals.get("temp_c")
    pulse = vitals.get("pulse")
    spo2 = vitals.get("spo2")

    if bp_systolic is not None and bp_systolic >= 140:
        warnings.append({
            "level": "advisory",
            "code": "LAB_VALUE_FLAG",
            "drug": None,
            "message": f"Elevated systolic blood pressure detected: {bp_systolic} mmHg.",
            "requires_acknowledgement": False
        })

    if bp_diastolic is not None and bp_diastolic >= 90:
        warnings.append({
            "level": "advisory",
            "code": "LAB_VALUE_FLAG",
            "drug": None,
            "message": f"Elevated diastolic blood pressure detected: {bp_diastolic} mmHg.",
            "requires_acknowledgement": False
        })

    if temp_c is not None and temp_c >= 38:
        warnings.append({
            "level": "advisory",
            "code": "LAB_VALUE_FLAG",
            "drug": None,
            "message": f"Elevated temperature detected: {temp_c} °C.",
            "requires_acknowledgement": False
        })

    if pulse is not None and (pulse < 60 or pulse > 100):
        warnings.append({
            "level": "advisory",
            "code": "LAB_VALUE_FLAG",
            "drug": None,
            "message": f"Abnormal pulse detected: {pulse} bpm.",
            "requires_acknowledgement": False
        })

    if spo2 is not None and spo2 < 95:
        warnings.append({
            "level": "advisory",
            "code": "LAB_VALUE_FLAG",
            "drug": None,
            "message": f"Low oxygen saturation detected: {spo2}%.",
            "requires_acknowledgement": False
        })

    return warnings


# DOSAGE WATCH
def check_dosage_watch(medications, database):

    warnings = []

    for medication in medications:

        drug = medication.get("drug", "").lower().strip()
        dose = medication.get("dose", "").lower().strip()

        if drug not in database:
            continue

        max_dose = database[drug].get("demo_max_dose_mg")

        if max_dose is None:
            continue

        try:
            dose_number = float(
                dose.replace("mg", "").strip()
            )
        except ValueError:
            continue

        if (
            dose_number > float(max_dose) * 0.8
            and dose_number <= float(max_dose)
        ):
            warnings.append({
                "level": "advisory",
                "code": "DOSAGE_WATCH",
                "drug": drug,
                "message": (
                    f"Dosage for {drug} is approaching "
                    f"the configured maximum. Verify before approval."
                ),
                "requires_acknowledgement": False
            })

    return warnings


# FOLLOW-UP OVERDUE
def check_follow_up_overdue(data):

    warnings = []

    follow_up = data.get("follow_up")

    if not follow_up:
        return warnings

    due_date = follow_up.get("due_date")
    completed = follow_up.get("completed", False)

    if not due_date or completed:
        return warnings

    try:
        due = datetime.fromisoformat(
            due_date.replace("Z", "+00:00")
        )

        now = datetime.now(due.tzinfo)

        if due < now:
            warnings.append({
                "level": "info",
                "code": "FOLLOW_UP_OVERDUE",
                "drug": None,
                "message": (
                    f"Patient follow-up was due on {due_date} "
                    "and has not been completed."
                ),
                "requires_acknowledgement": False
            })

    except ValueError:
        pass

    return warnings


@app.post("/rules/check")
def check_rules(data: dict):

    warnings = []

    medications = data.get("medications", [])

    patient_history = data.get(
        "patient_history",
        {}
    )

    allergies = patient_history.get(
        "allergies",
        []
    )

    # 1. DRUG INTERACTION
    interaction_warnings = check_interactions(
        medications,
        database
    )

    warnings.extend(interaction_warnings)

    # 2. DOSAGE EXCEEDS MAXIMUM
    dosage_warnings = check_dosage(
        medications,
        database
    )

    warnings.extend(dosage_warnings)

    # 3. DOSAGE WATCH
    dosage_watch_warnings = check_dosage_watch(
        medications,
        database
    )

    warnings.extend(dosage_watch_warnings)

    # 4. DUPLICATE DRUG
    duplicate_warnings = check_duplicate_drugs(
        medications
    )

    warnings.extend(duplicate_warnings)

    # 5. ALLERGY CHECK
    for medication in medications:

        drug = medication.get(
            "drug",
            ""
        )

        warning = check_allergy(
            drug,
            allergies,
            database
        )

        if warning:
            warning["warning_id"] = (
                f"warn_{uuid.uuid4().hex[:6]}"
            )

            warnings.append(warning)

    # 6. LAB / VITAL VALUE CHECK
    vitals = data.get(
        "vitals",
        {}
    )

    lab_warnings = check_lab_values(
        vitals
    )

    warnings.extend(lab_warnings)

    # 7. FOLLOW-UP OVERDUE
    follow_up_warnings = check_follow_up_overdue(
        data
    )

    warnings.extend(follow_up_warnings)

    # ADD WARNING IDs
    for warning in warnings:

        if "warning_id" not in warning:
            warning["warning_id"] = (
                f"warn_{uuid.uuid4().hex[:6]}"
            )

    # CHECK CRITICAL WARNINGS
    critical_warning = any(
        warning["level"] == "critical"
        for warning in warnings
    )

    return {
        "patient_id": data.get(
            "patient_id"
        ),
        "passed": not critical_warning,
        "checked_at": (
            datetime.utcnow().isoformat()
            + "Z"
        ),
        "warning_count": len(
            warnings
        ),
        "warnings": warnings
    }