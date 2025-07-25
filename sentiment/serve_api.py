from fastapi import FastAPI, Request, Form
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
from transformers import BertTokenizer, BertForSequenceClassification
import torch
import uvicorn
import os

# Define FastAPI app
app = FastAPI(title="FinBERT Sentiment API")

# Set up templates directory
templates = Jinja2Templates(directory="templates")

# Load model and tokenizer
model_path = "./finbert-sentiment"
#model_path = "./bert-sentiment"
tokenizer = BertTokenizer.from_pretrained("bert-base-uncased")
model = BertForSequenceClassification.from_pretrained(model_path)
model.eval()

# Use GPU if available
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model.to(device)

# Label mapping
label_map = {0: "neutral", 1: "negative", 2: "positive"}

# Inference from form
@app.post("/predict", response_class=HTMLResponse)
async def predict_sentiment(request: Request, text: str = Form(...)):
    tokens = tokenizer(text, return_tensors="pt", truncation=True, padding=True, max_length=128)
    tokens = {k: v.to(device) for k, v in tokens.items()}

    with torch.no_grad():
        outputs = model(**tokens)
        probs = torch.nn.functional.softmax(outputs.logits, dim=1)[0]

    # Extract individual probabilities
    neutral_conf = round(probs[0].item(), 4)
    negative_conf = round(probs[1].item(), 4)
    positive_conf = round(probs[2].item(), 4)

    # Argmax and threshold logic
    max_prob = probs.max().item()
    pred_idx = torch.argmax(probs).item()
    final_label = label_map[pred_idx]

    # Apply confidence threshold: if uncertain, default to neutral
    if max_prob < 0.5:
        final_label = "neutral"

    # Heuristic for negative terms
    negative_keywords = ["loss", "sell-off", "bankruptcy", "fraud", "lawsuit", "default", "scandal"]
    if any(word in text.lower() for word in negative_keywords) and negative_conf > 0.3:
        final_label = "negative"

    return JSONResponse(content={
        "text": text,
        "label": final_label,
        "confidence": round(max_prob, 4),
        "neutral_conf": neutral_conf,
        "negative_conf": negative_conf,
        "positive_conf": positive_conf
    })

# Run server
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)