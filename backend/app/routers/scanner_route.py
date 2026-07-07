import base64
import os
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from pydantic import BaseModel, Field
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.routers.user_routes import get_current_user
from app.models.entity import User
from app.core.config import Settings

router = APIRouter(prefix="/expenses", tags=["Scanner"])

# 1. Flexible Schema with a Validity Gatekeeper
class ReceiptExtraction(BaseModel):
    is_valid_receipt: bool = Field(
        description="Set to True if the image is a legible receipt, invoice, or bill. Set to False if the image is nonsense, a random photo, completely unreadable, or unrelated to financial transactions."
    )
    error_message: Optional[str] = Field(
        default=None, 
        description="If is_valid_receipt is False, provide a brief user-friendly reason (e.g., 'Image is too blurry' or 'This photo does not appear to be a receipt'). Otherwise, leave null."
    )
    title: Optional[str] = Field(
        default=None, 
        description="The vendor or merchant name. Leave completely blank (None) if it is unreadable or ambiguous."
    )
    amount: Optional[float] = Field(
        default=None, 
        description="The final grand total amount paid. Leave completely blank (None) if missing or unclear."
    )
    category_name: Optional[str] = Field(
        default=None, 
        description="Must be exactly one of: 'Food & Dining', 'Transportation', 'Utilities', 'Entertainment', 'Shopping'. Leave completely blank (None) if it doesn't fit any."
    )

@router.post("/scan", response_model=ReceiptExtraction)
async def scan_receipt_ai(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an image.")

    try:
        contents = await file.read()
        base64_image = base64.b64encode(contents).decode("utf-8")

        llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash", 
            api_key=Settings.GOOGLE_TOKEN,
            temperature=0.0
        )

        structured_llm = llm.with_structured_output(ReceiptExtraction)

        message = HumanMessage(
            content=[
                {
                    "type": "text", 
                    "text": "Analyze this image. First decide if it is a valid transaction record. If it is, extract the parameters. If fields are completely missing or unreadable, leave them as null."
                },
                {
                    "type": "image_url", 
                    "image_url": {"url": f"data:{file.content_type};base64,{base64_image}"}
                }
            ]
        )

        extracted_data = structured_llm.invoke([message])
        return extracted_data

    except Exception as e:
        print(f"Scanner Traceback Error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail="Failed to communicate with AI parsing pipeline."
        )