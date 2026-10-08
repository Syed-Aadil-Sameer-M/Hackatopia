from .retriever import retrieve_patient_history


results = retrieve_patient_history(
    patient_id="P001",
    query="previous antibiotic allergy",
    k=3
)


for result in results:

    print("=" * 60)

    print(
        "CONTENT:"
    )

    print(
        result.page_content
    )

    print(
        "METADATA:"
    )

    print(
        result.metadata
    )