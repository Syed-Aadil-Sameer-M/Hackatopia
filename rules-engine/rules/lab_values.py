def check_lab_values(vitals):
    """
    Check patient vital values for demo/reference abnormal ranges.
    """

    warnings = []

    bp_systolic = vitals.get("bp_systolic")
    bp_diastolic = vitals.get("bp_diastolic")
    temp_c = vitals.get("temp_c")
    pulse = vitals.get("pulse")
    spo2 = vitals.get("spo2")

    # Blood pressure
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

    # Temperature
    if temp_c is not None and temp_c >= 38:
        warnings.append({
            "level": "advisory",
            "code": "LAB_VALUE_FLAG",
            "drug": None,
            "message": f"Elevated temperature detected: {temp_c} °C.",
            "requires_acknowledgement": False
        })

    # Pulse
    if pulse is not None and (pulse < 60 or pulse > 100):
        warnings.append({
            "level": "advisory",
            "code": "LAB_VALUE_FLAG",
            "drug": None,
            "message": f"Abnormal pulse detected: {pulse} bpm.",
            "requires_acknowledgement": False
        })

    # SpO2
    if spo2 is not None and spo2 < 95:
        warnings.append({
            "level": "advisory",
            "code": "LAB_VALUE_FLAG",
            "drug": None,
            "message": f"Low oxygen saturation detected: {spo2}%.",
            "requires_acknowledgement": False
        })

    return warnings