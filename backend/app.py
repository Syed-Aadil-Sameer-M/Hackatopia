from fastapi import FastAPI
from pydantic import BaseModel, Field

from rag.retriever import retrieve_patient_history


app = FastAPI(
    title="Medical AI Assistant - Patient History RAG"
)


class HistoryQuery(BaseModel):
    query: str
    top_k: int = Field(default=3, ge=1, le=20)


@app.post("/patients/{patient_id}/history/query")
def query_patient_history(
    patient_id: str,
    request: HistoryQuery
):
    results = retrieve_patient_history(
        patient_id=patient_id,
        query=request.query,
        k=request.top_k
    )

    return {
        "patient_id": patient_id,
        "query": request.query,
        "results": [
            {
                "patient_id": result.metadata.get("patient_id"),
                "patient_name": result.metadata.get("patient_name"),
                "type": result.metadata.get("event_type"),
                "criticality": result.metadata.get("criticality"),
                "content": result.page_content
            }
            for result in results
        ],
        "total_results": len(results)
    }