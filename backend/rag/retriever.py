from .chroma_client import patient_store
from datetime import date
from typing import Optional

def retrieve_patient_history(
    patient_id: str,
    query: str,
    k: int = 3
):
    """
    Retrieve patient-specific medical history
    from the patient_history Chroma collection.
    """

    results = patient_store.similarity_search(
        query=query,
        k=k,
        filter={
            "patient_id": patient_id
        }
    )

    return results

SUPPORTED_HISTORY_TYPES = {
    "consultation_note",
    "allergy_record",
    "lab_result",
    "prescription",
}


def retrieve_patient_history(
    patient_id: str,
    query: str,
    k: int = 3
):
    results = patient_store.similarity_search(
        query=query,
        k=k,
        filter={"patient_id": patient_id}
    )
    return results


def retrieve_history_for_careloop(
    patient_id: str,
    query: str,
    k: int = 5,
    types: Optional[list[str]] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
):
    """
    Contract-specific patient history retrieval.

    Patient isolation and type filtering are handled by Chroma.
    Date filtering is performed in Python because Chroma does not
    support range comparisons on string metadata such as YYYY-MM-DD.
    """

    # -----------------------------
    # Validate history types
    # -----------------------------
    if types:
        invalid_types = set(types) - SUPPORTED_HISTORY_TYPES

        if invalid_types:
            raise ValueError(
                f"Unsupported history type(s): {sorted(invalid_types)}"
            )

    # -----------------------------
    # Chroma metadata filter
    # -----------------------------
    metadata_filter = {
        "patient_id": patient_id
    }

    if types:
        if len(types) == 1:
            metadata_filter["type"] = types[0]
        else:
            metadata_filter = {
                "$and": [
                    {"patient_id": patient_id},
                    {"type": {"$in": types}},
                ]
            }

    # -----------------------------
    # Retrieve more candidates than
    # requested because date filtering
    # happens after retrieval.
    # -----------------------------
    retrieval_k = max(k * 5, 20)

    results = patient_store.similarity_search_with_relevance_scores(
        query=query,
        k=retrieval_k,
        filter=metadata_filter
    )

    # -----------------------------
    # Date filtering in Python
    # -----------------------------
    filtered_results = []

    for document, score in results:

        record_date = document.metadata.get("date")

        # If date filtering was requested but
        # this record has no date, skip it.
        if (date_from or date_to) and not record_date:
            continue

        if record_date:
            try:
                record_date_obj = date.fromisoformat(str(record_date))
            except ValueError:
                # Ignore malformed dates rather than
                # crashing the entire query.
                continue

            if date_from and record_date_obj < date_from:
                continue

            if date_to and record_date_obj > date_to:
                continue

        filtered_results.append((document, score))

        # We only need top_k results.
        if len(filtered_results) >= k:
            break

    return filtered_results