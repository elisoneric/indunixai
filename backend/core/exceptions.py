from fastapi import HTTPException, status

class IndunixGatewayException(HTTPException):
    def __init__(self, message: str, status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR, error_type: str = "api_error", code: str = "server_error"):
        detail = {
            "error": {
                "message": message,
                "type": error_type,
                "param": None,
                "code": code
            }
        }
        super().__init__(status_code=status_code, detail=detail)

# Backward-compatible alias
AxionGatewayException = IndunixGatewayException

class InsufficientBalanceException(IndunixGatewayException):
    def __init__(self, message: str = "Insufficient Indunix AI wallet balance. Please top up your Naira balance at console.indunixai.com"):
        super().__init__(
            message=message,
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            error_type="insufficient_balance",
            code="402"
        )

class InvalidApiKeyException(IndunixGatewayException):
    def __init__(self, message: str = "Invalid or inactive Indunix API key provided."):
        super().__init__(
            message=message,
            status_code=status.HTTP_401_UNAUTHORIZED,
            error_type="invalid_request_error",
            code="invalid_api_key"
        )

class RateLimitExceededException(IndunixGatewayException):
    def __init__(self, message: str = "Rate limit exceeded. Please back off and retry."):
        super().__init__(
            message=message,
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            error_type="requests",
            code="rate_limit_exceeded"
        )

class SpendLimitExceededException(IndunixGatewayException):
    def __init__(self, message: str = "Monthly spend ceiling reached for this API key."):
        super().__init__(
            message=message,
            status_code=status.HTTP_403_FORBIDDEN,
            error_type="spend_limit_exceeded",
            code="spend_limit_exceeded"
        )
