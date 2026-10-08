from .chroma_client import guidelines_store


def retrieve_guidelines(
    query: str,
    k: int = 3
):
    """
    Retrieve relevant medical guidelines.
    """

    results = guidelines_store.similarity_search(
        query=query,
        k=k
    )

    return results