def check_allergy(drug, patient_allergies, database):
    """
    Check whether the prescribed drug conflicts
    with a patient's recorded allergy.
    """

    drug = drug.lower().strip()

    # Find drug in our database
    drug_info = database.get(drug)

    # Unknown drug → no automatic decision
    if not drug_info:
        return None

    allergy_group = drug_info.get("allergy_group")

    # Drug has no allergy group
    if not allergy_group:
        return None

    # Normalize patient allergy names
    allergies = [
        allergy.lower().strip()
        for allergy in patient_allergies
    ]

    # Check for conflict
    if allergy_group.lower() in allergies:

        return {
            "warning_id": f"allergy_{drug}",
            "level": "critical",
            "code": "ALLERGY_CONFLICT",
            "drug": drug,
            "message": (
                f"Patient has a recorded {allergy_group} allergy. "
                f"Verify {drug} before approval."
            ),
            "requires_acknowledgement": True
        }

    return None