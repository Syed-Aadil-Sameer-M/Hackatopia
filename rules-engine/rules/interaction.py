def check_interactions(medications, database):
    """
    Check prescribed medicines for known drug-drug interactions.
    Demo/reference rules only.
    """

    warnings = []

    for i in range(len(medications)):
        drug1 = medications[i].get("drug", "").lower().strip()

        if drug1 not in database:
            continue

        interactions = database[drug1].get("interactions", [])

        for j in range(i + 1, len(medications)):
            drug2 = medications[j].get("drug", "").lower().strip()

            if drug2 in interactions:
                warnings.append({
                    "level": "critical",
                    "code": "DRUG_INTERACTION",
                    "drug": f"{drug1} + {drug2}",
                    "message": (
                        f"Potential interaction detected between "
                        f"{drug1} and {drug2}."
                    ),
                    "requires_acknowledgement": True
                })

    return warnings