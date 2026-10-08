from .chroma_client import vector_store


def retrieve_patient_history(
    patient_id: str,
    query: str,
    k: int = 3
):
    results = vector_store.similarity_search(
        query=query,
        k=k,
        filter={"patient_id": patient_id}
    )

    return results