def check_dosage(medications, database):

    warnings = []

    for medication in medications:

        drug = medication.get("drug", "").lower().strip()
        dose = medication.get("dose", "").lower().strip()

        if drug not in database:
            continue

        drug_info = database[drug]

        max_dose = drug_info.get("demo_max_dose_mg")

        if max_dose is None:
            continue

        try:
            dose_number = float(
                dose.replace("mg", "").strip()
            )
        except ValueError:
            continue

        if dose_number > float(max_dose):

            warnings.append({
                "level": "critical",
                "code": "DOSAGE_EXCEEDS_MAX",
                "drug": drug,
                "message": f"Demo dosage limit exceeded for {drug}.",
                "requires_acknowledgement": True
            })

    return warnings