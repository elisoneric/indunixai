from typing import List, Optional, Union, Any, Dict
from pydantic import BaseModel, ConfigDict

class ChatMessage(BaseModel):
    role: str
    content: Optional[Union[str, List[Dict[str, Any]]]] = ""
    name: Optional[str] = None
    tool_calls: Optional[List[Dict[str, Any]]] = None

class ChatCompletionRequest(BaseModel):
    model_config = ConfigDict(extra="allow")

    model: str
    messages: List[ChatMessage]
    temperature: Optional[float] = 0.7
    top_p: Optional[float] = 1.0
    n: Optional[int] = 1
    stream: Optional[bool] = False
    stop: Optional[Union[str, List[str]]] = None
    max_tokens: Optional[int] = None
    presence_penalty: Optional[float] = 0.0
    frequency_penalty: Optional[float] = 0.0
    response_format: Optional[Dict[str, Any]] = None
    tools: Optional[List[Dict[str, Any]]] = None
    tool_choice: Optional[Union[str, Dict[str, Any]]] = None
    user: Optional[str] = None

class UsageInfo(BaseModel):
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0

class ChatChoiceMessage(BaseModel):
    role: str = "assistant"
    content: Optional[str] = None
    reasoning_content: Optional[str] = None
    tool_calls: Optional[List[Dict[str, Any]]] = None

class ChatChoice(BaseModel):
    index: int = 0
    message: ChatChoiceMessage
    finish_reason: Optional[str] = "stop"

class ChatCompletionResponse(BaseModel):
    id: str
    object: str = "chat.completion"
    created: int
    model: str
    choices: List[ChatChoice]
    usage: UsageInfo
    system_fingerprint: Optional[str] = "fp_indunix_sovereign_1"

class ModelDescriptor(BaseModel):
    id: str
    object: str = "model"
    created: int = 1710000000
    owned_by: str = "indunix"
    permission: List[Dict[str, Any]] = []
    root: str
    parent: Optional[str] = None
    description: Optional[str] = None
    pricing_ngn_per_m: Optional[float] = None
    context_window: Optional[int] = None

class ModelListResponse(BaseModel):
    object: str = "list"
    data: List[ModelDescriptor]

# Anthropic Claude Messages API Schemas (for Claude Desktop & Claude Code)
class AnthropicContentBlock(BaseModel):
    model_config = ConfigDict(extra="allow")
    type: str = "text"
    text: Optional[str] = ""
    id: Optional[str] = None
    name: Optional[str] = None
    input: Optional[Dict[str, Any]] = None
    content: Optional[Union[str, List[Any]]] = None

class AnthropicMessage(BaseModel):
    model_config = ConfigDict(extra="allow")
    role: str
    content: Union[str, List[Union[AnthropicContentBlock, Dict[str, Any], str]]]

class AnthropicMessagesRequest(BaseModel):
    model_config = ConfigDict(extra="allow")
    model: str
    messages: List[AnthropicMessage]
    system: Optional[Union[str, List[Union[AnthropicContentBlock, Dict[str, Any], str]]]] = None
    max_tokens: Optional[int] = 4096
    temperature: Optional[float] = 1.0
    top_p: Optional[float] = None
    top_k: Optional[int] = None
    stream: Optional[bool] = False
    metadata: Optional[Dict[str, Any]] = None
    stop_sequences: Optional[List[str]] = None
    tools: Optional[List[Dict[str, Any]]] = None
    tool_choice: Optional[Union[str, Dict[str, Any]]] = None

class AnthropicResponseContentBlock(BaseModel):
    type: str = "text"
    text: str

class AnthropicUsage(BaseModel):
    input_tokens: int = 0
    output_tokens: int = 0

class AnthropicMessagesResponse(BaseModel):
    id: str
    type: str = "message"
    role: str = "assistant"
    model: str
    content: List[AnthropicResponseContentBlock]
    stop_reason: Optional[str] = "end_turn"
    stop_sequence: Optional[str] = None
    usage: AnthropicUsage
