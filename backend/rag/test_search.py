from .chroma_client import vector_store

results = vector_store.similarity_search(
    "previous allergic reactions and medications",
    k=3,
    filter={"patient_id": "P001"}
)

for result in results:
    print(result.page_content)
    print("-" * 50)