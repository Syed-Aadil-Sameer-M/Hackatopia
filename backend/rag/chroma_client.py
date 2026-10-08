from pathlib import Path
from langchain_chroma import Chroma

from .embeddings import embeddings


BASE_DIR = Path(__file__).resolve().parent.parent

CHROMA_PATH = BASE_DIR / "data" / "chroma"


patient_store = Chroma(
    collection_name="patient_history",
    embedding_function=embeddings,
    persist_directory=str(CHROMA_PATH)
)


guidelines_store = Chroma(
    collection_name="medical_guidelines",
    embedding_function=embeddings,
    persist_directory=str(CHROMA_PATH)
)