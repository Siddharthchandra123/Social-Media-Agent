from typing import TypeVar, Type

from google import genai
from google.genai import types
from pydantic import BaseModel

from app.config import settings
import asyncio



T = TypeVar("T", bound=BaseModel)


class GeminiClient:

    def __init__(self):
        self.client = genai.Client(
            api_key=settings.GEMINI_API_KEY
        )

        self.model = settings.GEMINI_MODEL

    async def generate_structured(
        self,
        prompt: str,
        system_instruction: str,
        response_schema: Type[T],
        temperature: float = 0.7,
    ) -> T:

        response = await self.client.aio.models.generate_content(
            model=self.model,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=temperature,
                response_mime_type="application/json",
                response_schema=response_schema,
            ),
        )

        if not response.text:
            raise RuntimeError(
                "Gemini returned an empty response."
            )

        return response_schema.model_validate_json(
            response.text
        )
    async def _with_retry(self, operation):
            max_attempts = 3
    
            for attempt in range(1, max_attempts + 1):
                try:
                    return await operation()
    
                except (
                    ConnectionError,
                    TimeoutError,
                ):
                    if attempt == max_attempts:
                        raise
    
                    await asyncio.sleep(2 ** (attempt - 1))
    async def close(self):
        await self.client.aio.aclose()
        
        
    