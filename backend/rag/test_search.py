from .retriever import retrieve_patient_history


print("\n==============================")
print("PATIENT RAG TEST")
print("==============================")


results = retrieve_patient_history(
    patient_id="P001",
    query="Does this patient have any known antibiotic allergies?",
    k=3
)


print(f"\nResults found: {len(results)}")


for i, result in enumerate(results, start=1):

    print(f"\n--- RESULT {i} ---")

    print("Patient ID:",
          result.metadata.get("patient_id"))

    print("Patient Name:",
          result.metadata.get("patient_name"))

    print("Type:",
          result.metadata.get("event_type"))

    print("Criticality:",
          result.metadata.get("criticality"))

    print("\nContent:")
    print(result.page_content)