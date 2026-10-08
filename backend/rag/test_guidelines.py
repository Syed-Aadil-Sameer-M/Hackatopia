from .guideline_retriever import retrieve_guidelines


print("\n==============================")
print("GUIDELINE RAG TEST")
print("==============================")


results = retrieve_guidelines(
    query="What should be considered for a patient with severe penicillin allergy?",
    k=3
)


print(f"\nResults found: {len(results)}")


for i, result in enumerate(results, start=1):

    print(f"\n--- GUIDELINE {i} ---")

    print(
        "Guideline ID:",
        result.metadata.get("guideline_id")
    )

    print(
        "Title:",
        result.metadata.get("title")
    )

    print(
        "Category:",
        result.metadata.get("category")
    )

    print("\nContent:")
    print(result.page_content)