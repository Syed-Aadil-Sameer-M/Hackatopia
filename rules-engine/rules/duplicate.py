def check_duplicate_drugs(medications):
    """
    Detect duplicate medicines in a prescription.
    """

    warnings = []
    drug_counts = {}

    for medication in medications:
        drug = medication.get("drug", "").lower().strip()

        if not drug:
            continue

        drug_counts[drug] = drug_counts.get(drug, 0) + 1

    for drug, count in drug_counts.items():

        if count > 1:
            warnings.append({
                "level": "advisory",
                "code": "DUPLICATE_DRUG",
                "drug": drug,
                "message": (
                    f"{drug} appears {count} times in the prescription. "
                    "Verify whether the duplicate entries are intentional."
                ),
                "requires_acknowledgement": False
            })

    return warnings