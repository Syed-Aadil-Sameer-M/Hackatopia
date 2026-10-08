import json
from pathlib import Path

from .chroma_client import guidelines_store


# ---------------------------------------------------------
# Paths
# ---------------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent.parent
GUIDELINES_FILE = BASE_DIR / "data" / "guidelines.json"


# ---------------------------------------------------------
# Load guidelines
# ---------------------------------------------------------

with open(GUIDELINES_FILE, "r", encoding="utf-8") as f:
    guidelines = json.load(f)


documents = []
metadatas = []
ids = []


# ---------------------------------------------------------
# Create guideline documents
# ---------------------------------------------------------

for index, guideline in enumerate(guidelines):

    guideline_id = guideline.get(
        "guideline_id",
        f"G{index + 1:03d}"
    )

    title = guideline.get("title", "Untitled Guideline")
    category = guideline.get("category", "General")
    content = guideline.get("content", "")

    document = (
        f"Guideline ID: {guideline_id}\n"
        f"Title: {title}\n"
        f"Category: {category}\n\n"
        f"Guideline:\n{content}"
    )

    documents.append(document)

    metadatas.append({
        "guideline_id": guideline_id,
        "title": title,
        "category": category
    })

    ids.append(guideline_id)


# ---------------------------------------------------------
# Store in Chroma
# ---------------------------------------------------------

if documents:

    guidelines_store.add_texts(
        texts=documents,
        metadatas=metadatas,
        ids=ids
    )

print(f"Guidelines loaded: {len(guidelines)}")
print(f"Documents created: {len(documents)}")
print("✅ Medical guidelines successfully ingested.")