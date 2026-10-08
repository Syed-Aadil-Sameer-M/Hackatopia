from datetime import date, datetime, timezone
from typing import Any, Literal, Optional
from uuid import uuid4
import json

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, field_validator

from rag.retriever import (
    retrieve_patient_history,
    retrieve_history_for_careloop,
)
from rag.guideline_retriever import retrieve_guidelines
from rag.chroma_client import patient_store
from abha.intake import create_patient_intake


app = FastAPI(
    title="CARELOOP Patient History RAG API",
    version="1.0.0"
)


# =========================================================
# Supported CARELOOP Types
# =========================================================

HistoryType = Literal[
    "consultation_note",
    "allergy_record",
    "lab_result",
    "prescription"
]

HistorySource = Literal[
    "session",
    "manual",
    "import"
]


# =========================================================
# Request Models
# =========================================================

class HistoryEmbedRequest(BaseModel):
    type: HistoryType
    date: date
    source: HistorySource
    source_id: str = Field(min_length=1)
    content: Any

    @field_validator("source_id")
    @classmethod
    def validate_source_id(cls, value):
        value = value.strip()

        if not value:
            raise ValueError("source_id cannot be empty")

        return value


class HistoryFilters(BaseModel):
    types: Optional[list[HistoryType]] = None
    date_from: Optional[date] = None
    date_to: Optional[date] = None

    @field_validator("date_to")
    @classmethod
    def validate_date_range(cls, value, info):
        date_from = info.data.get("date_from")

        if value and date_from and value < date_from:
            raise ValueError(
                "date_to cannot be earlier than date_from"
            )

        return value


class HistoryQuery(BaseModel):
    query: str = Field(min_length=1)

    top_k: int = Field(
        default=5,
        ge=1,
        le=20
    )

    filters: Optional[HistoryFilters] = None

    @field_validator("query")
    @classmethod
    def validate_query(cls, value):
        value = value.strip()

        if not value:
            raise ValueError("query cannot be empty")

        return value


class GuidelineQuery(BaseModel):
    query: str
    top_k: int = Field(
        default=3,
        ge=1,
        le=20
    )


class IntakeRequest(BaseModel):
    abha_id: str


# =========================================================
# Helper Functions
# =========================================================

def generate_record_id() -> str:
    """
    Generate a unique patient-history record ID.
    """
    return f"rec_{uuid4().hex[:12]}"


def generate_vector_id(record_id: str) -> str:
    """
    Generate the Chroma vector ID associated
    with the history record.
    """
    return f"vec_{record_id}"


def build_summary(
    history_type: str,
    content: Any
) -> str:
    """
    Create a deterministic summary from the stored record.

    This function does NOT generate or invent medical history.
    It only summarizes fields already supplied by the caller.
    """

    if isinstance(content, dict):

        # ---------------------------------------------
        # Allergy
        # ---------------------------------------------

        if history_type == "allergy_record":

            drug = content.get(
                "drug",
                "Unknown drug"
            )

            reaction = content.get(
                "reaction",
                "Unknown reaction"
            )

            return (
                f"{str(reaction).capitalize()} after {drug} "
                f"— suspected allergy"
            )

        # ---------------------------------------------
        # Prescription
        # ---------------------------------------------

        if history_type == "prescription":

            medication = (
                content.get("medication")
                or content.get("drug")
                or "Medication"
            )

            return f"Prescription: {medication}"

        # ---------------------------------------------
        # Lab Result
        # ---------------------------------------------

        if history_type == "lab_result":

            test = (
                content.get("test")
                or content.get("test_name")
                or "Laboratory result"
            )

            result = content.get("result")

            if result is not None:
                return f"{test}: {result}"

            return str(test)

        # ---------------------------------------------
        # Consultation
        # ---------------------------------------------

        if history_type == "consultation_note":

            return (
                content.get("summary")
                or content.get("assessment")
                or content.get("notes")
                or "Consultation note"
            )

        return "Patient history record"

    # ---------------------------------------------
    # Plain text content
    # ---------------------------------------------

    if isinstance(content, str):

        text = content.strip()

        if not text:
            return "Patient history record"

        if len(text) <= 200:
            return text

        return text[:197] + "..."

    return "Patient history record"


def serialize_content(content: Any) -> Any:
    """
    Restore JSON content to a Python object when possible.

    Structured content remains structured in the API response.
    Plain text remains plain text.
    """

    if not isinstance(content, str):
        return content

    try:

        parsed = json.loads(content)

        if isinstance(parsed, (dict, list)):
            return parsed

    except (json.JSONDecodeError, TypeError):
        pass

    return content


# =========================================================
# Health Check
# =========================================================

@app.get("/")
def health_check():

    return {
        "status": "running",
        "service": "CARELOOP Patient History RAG API"
    }


# =========================================================
# CARELOOP - HISTORY EMBED
# =========================================================

@app.post("/v1/patients/{patient_id}/history/embed")
def embed_patient_history(
    patient_id: str,
    request: HistoryEmbedRequest
):
    """
    Store and embed a patient-history record
    using the existing ChromaDB patient_history collection.
    """

    patient_id = patient_id.strip()

    # ---------------------------------------------
    # Validate patient ID
    # ---------------------------------------------

    if not patient_id:

        raise HTTPException(
            status_code=400,
            detail="Invalid patient_id"
        )

    # ---------------------------------------------
    # Validate content
    # ---------------------------------------------

    if request.content is None:

        raise HTTPException(
            status_code=400,
            detail="Missing content"
        )

    # ---------------------------------------------
    # Generate IDs
    # ---------------------------------------------

    record_id = generate_record_id()

    vector_id = generate_vector_id(
        record_id
    )

    created_at = datetime.now(
        timezone.utc
    ).isoformat()

    # ---------------------------------------------
    # Prepare content
    # ---------------------------------------------

    if isinstance(
        request.content,
        (dict, list)
    ):

        content = json.dumps(
            request.content,
            ensure_ascii=False
        )

    else:

        content = str(
            request.content
        ).strip()

    if not content:

        raise HTTPException(
            status_code=400,
            detail="Missing content"
        )

    # ---------------------------------------------
    # Build deterministic summary
    # ---------------------------------------------

    summary = build_summary(
        request.type,
        request.content
    )

    # ---------------------------------------------
    # Create document for Chroma
    # ---------------------------------------------

    document = (
        f"Record ID: {record_id}\n"
        f"Patient ID: {patient_id}\n"
        f"Type: {request.type}\n"
        f"Date: {request.date.isoformat()}\n"
        f"Source: {request.source}\n"
        f"Source ID: {request.source_id}\n"
        f"Summary: {summary}\n\n"
        f"Content:\n{content}"
    )

    # ---------------------------------------------
    # Chroma metadata
    # ---------------------------------------------

    metadata = {
        "patient_id": patient_id,
        "record_id": record_id,
        "type": request.type,
        "date": request.date.isoformat(),
        "source": request.source,
        "source_id": request.source_id,
        "summary": summary
    }

    # ---------------------------------------------
    # Persist + embed
    # ---------------------------------------------

    try:

        patient_store.add_texts(
            texts=[document],
            metadatas=[metadata],
            ids=[vector_id]
        )

    except Exception as exc:

        raise HTTPException(
            status_code=503,
            detail=(
                "Embedding/vector storage failed: "
                f"{str(exc)}"
            )
        )

    # ---------------------------------------------
    # Contract response
    # ---------------------------------------------

    return {
        "record_id": record_id,
        "patient_id": patient_id,
        "type": request.type,
        "date": request.date.isoformat(),
        "embedded": True,
        "vector_id": vector_id,
        "created_at": created_at
    }


# =========================================================
# CARELOOP - HISTORY QUERY
# =========================================================

@app.post("/v1/patients/{patient_id}/history/query")
def query_patient_history_careloop(
    patient_id: str,
    request: HistoryQuery
):
    """
    Query patient-specific history using
    the existing ChromaDB/RAG implementation.
    """

    patient_id = patient_id.strip()

    # ---------------------------------------------
    # Validate patient ID
    # ---------------------------------------------

    if not patient_id:

        raise HTTPException(
            status_code=400,
            detail="Invalid patient_id"
        )

    # ---------------------------------------------
    # Validate query
    # ---------------------------------------------

    if not request.query.strip():

        raise HTTPException(
            status_code=400,
            detail="Query cannot be empty"
        )

    # ---------------------------------------------
    # Extract filters
    # ---------------------------------------------

    types = None
    date_from = None
    date_to = None

    if request.filters:

        types = request.filters.types

        date_from = request.filters.date_from

        date_to = request.filters.date_to

    # ---------------------------------------------
    # Retrieve
    # ---------------------------------------------

    try:

        results = retrieve_history_for_careloop(
            patient_id=patient_id,
            query=request.query,
            k=request.top_k,
            types=types,
            date_from=date_from,
            date_to=date_to
        )

    except ValueError as exc:

        raise HTTPException(
            status_code=400,
            detail=str(exc)
        )

    except Exception as exc:

        raise HTTPException(
            status_code=503,
            detail=(
                "History retrieval failed: "
                f"{str(exc)}"
            )
        )

    # ---------------------------------------------
    # Format results according to CARELOOP contract
    # ---------------------------------------------

    formatted_results = []

    for document, relevance_score in results:

        metadata = document.metadata

        page_content = document.page_content

        # Extract the original content section.
        if "Content:\n" in page_content:

            content = page_content.split(
                "Content:\n",
                1
            )[1]

        else:

            content = page_content

        # Restore structured JSON content.
        content = serialize_content(
            content
        )

        formatted_results.append({
            "record_id": metadata.get(
                "record_id"
            ),

            "type": metadata.get(
                "type"
            ),

            "date": metadata.get(
                "date"
            ),

            "relevance_score": float(
                relevance_score
            ),

            "summary": metadata.get(
                "summary"
            ),

            "content": content
        })

    # ---------------------------------------------
    # Contract response
    # ---------------------------------------------

    return {
        "patient_id": patient_id,
        "query": request.query,
        "results": formatted_results,
        "total_results": len(
            formatted_results
        )
    }


# =========================================================
# Medical Guidelines RAG
# =========================================================

@app.post("/guidelines/query")
def query_guidelines(
    request: GuidelineQuery
):

    results = retrieve_guidelines(
        query=request.query,
        k=request.top_k
    )

    return {
        "query": request.query,
        "results": [
            {
                "guideline_id": result.metadata.get(
                    "guideline_id"
                ),
                "title": result.metadata.get(
                    "title"
                ),
                "category": result.metadata.get(
                    "category"
                ),
                "content": result.page_content
            }
            for result in results
        ],
        "total_results": len(results)
    }


# =========================================================
# Mock ABHA Patient Intake
# =========================================================

@app.post("/patients/intake")
def patient_intake(
    request: IntakeRequest
):

    patient = create_patient_intake(
        request.abha_id
    )

    if patient is None:

        raise HTTPException(
            status_code=404,
            detail=(
                "Patient not found in "
                "mock ABHA system"
            )
        )

    return {
        "status": "success",
        "patient": patient
    }