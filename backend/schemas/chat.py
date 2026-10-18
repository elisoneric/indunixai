from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict, Field

class GuestSessionResponse(BaseModel):
    guest_token: str
    session_id: str
    messages_sent: int
    max_messages: int
    remaining_messages: int
    eligible_models: List[str]
    expires_at: str

class ChatLimitsResponse(BaseModel):
    tier: str  # "guest" | "free" | "pro"
    messages_used: int
    messages_limit: int
    remaining_messages: int
    credits_balance_ngn: float
    bonus_credits_ngn: float
    total_available_ngn: float
    allowed_models: List[str]
    can_use_reasoning: bool
    reset_interval: str

class ChatMessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    conversation_id: str
    role: str
    content: str
    reasoning_content: Optional[str] = None
    model: Optional[str] = None
    prompt_tokens: int = 0
    completion_tokens: int = 0
    created_at: str

class ConversationCreate(BaseModel):
    title: Optional[str] = "New Chat"
    model: Optional[str] = "indunix-1-core"

class ConversationUpdate(BaseModel):
    title: Optional[str] = None
    is_pinned: Optional[bool] = None
    is_archived: Optional[bool] = None
    model: Optional[str] = None

class ConversationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    model: str
    is_pinned: bool
    is_archived: bool
    created_at: str
    updated_at: str
    message_count: int = 0
    messages: Optional[List[ChatMessageOut]] = None

class ChatStreamMessage(BaseModel):
    role: str
    content: str

class ChatStreamRequest(BaseModel):
    conversation_id: Optional[str] = None
    model: str = "indunix-1-core"
    messages: List[ChatStreamMessage]
    temperature: Optional[float] = 0.7
    stream: bool = True

class MigrateGuestRequest(BaseModel):
    guest_token: str
