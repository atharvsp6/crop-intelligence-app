"""
HTTP client for AI services
Async HTTP calls with retry logic and circuit breaker
"""
import httpx
from typing import Optional, Dict, Any
from tenacity import retry, stop_after_attempt, wait_exponential
import asyncio

from app.core.config import get_settings
from app.core.logging import get_logger

settings = get_settings()
logger = get_logger(__name__)


class AIServiceClient:
    """
    Async HTTP client for AI microservices.
    Includes retry logic and health checks.
    """
    
    def __init__(self):
        self.timeout = httpx.Timeout(
            timeout=settings.AI_SERVICE_TIMEOUT,
            connect=5.0
        )
        self._client: Optional[httpx.AsyncClient] = None
    
    async def get_client(self) -> httpx.AsyncClient:
        """Get or create HTTP client."""
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(timeout=self.timeout)
        return self._client
    
    async def close(self):
        """Close the HTTP client."""
        if self._client and not self._client.is_closed:
            await self._client.aclose()
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=10)
    )
    async def _request(
        self,
        method: str,
        url: str,
        **kwargs
    ) -> httpx.Response:
        """Make HTTP request with retry."""
        client = await self.get_client()
        response = await client.request(method, url, **kwargs)
        response.raise_for_status()
        return response
    
    async def health_check(self, service_url: str) -> bool:
        """Check if a service is healthy."""
        try:
            client = await self.get_client()
            response = await client.get(f"{service_url}/health", timeout=5.0)
            return response.status_code == 200
        except Exception as e:
            logger.warning(f"Health check failed for {service_url}: {e}")
            return False


class DiseaseDetectionClient(AIServiceClient):
    """Client for Disease Detection Service."""
    
    def __init__(self):
        super().__init__()
        self.base_url = settings.DISEASE_SERVICE_URL
    
    async def is_healthy(self) -> bool:
        """Check service health."""
        return await self.health_check(self.base_url)
    
    async def predict(self, image_bytes: bytes, filename: str = "image.jpg") -> Dict[str, Any]:
        """
        Send image for disease detection.
        
        Args:
            image_bytes: Raw image bytes
            filename: Image filename
            
        Returns:
            Prediction result dictionary
        """
        try:
            client = await self.get_client()
            
            files = {"file": (filename, image_bytes, "image/jpeg")}
            response = await client.post(
                f"{self.base_url}/predict",
                files=files
            )
            response.raise_for_status()
            
            return response.json()
            
        except httpx.TimeoutException:
            logger.error("Disease detection service timeout")
            return {"success": False, "error": "Service timeout"}
        except httpx.HTTPStatusError as e:
            logger.error(f"Disease detection HTTP error: {e}")
            return {"success": False, "error": f"HTTP error: {e.response.status_code}"}
        except Exception as e:
            logger.error(f"Disease detection error: {e}")
            return {"success": False, "error": str(e)}
    
    async def get_model_info(self) -> Dict[str, Any]:
        """Get model information."""
        try:
            response = await self._request("GET", f"{self.base_url}/model/info")
            return response.json()
        except Exception as e:
            logger.error(f"Get model info error: {e}")
            return {"error": str(e)}
    
    async def get_classes(self) -> Dict[str, Any]:
        """Get disease classes."""
        try:
            response = await self._request("GET", f"{self.base_url}/model/classes")
            return response.json()
        except Exception as e:
            logger.error(f"Get classes error: {e}")
            return {"error": str(e)}


class YieldPredictionClient(AIServiceClient):
    """Client for Crop Yield Prediction Service."""
    
    def __init__(self):
        super().__init__()
        self.base_url = settings.YIELD_SERVICE_URL
    
    async def is_healthy(self) -> bool:
        """Check service health."""
        return await self.health_check(self.base_url)
    
    async def predict(self, prediction_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Get yield prediction.
        
        Args:
            prediction_data: Dictionary with weather, soil, crop, location data
            
        Returns:
            Prediction result dictionary
        """
        try:
            client = await self.get_client()
            
            response = await client.post(
                f"{self.base_url}/predict",
                json=prediction_data
            )
            response.raise_for_status()
            
            return response.json()
            
        except httpx.TimeoutException:
            logger.error("Yield prediction service timeout")
            return {"success": False, "error": "Service timeout"}
        except httpx.HTTPStatusError as e:
            error_detail = e.response.text if e.response else str(e)
            logger.error(f"Yield prediction HTTP error: {e.response.status_code} - {error_detail}")
            return {"success": False, "error": f"HTTP error: {e.response.status_code}", "detail": error_detail}
        except Exception as e:
            logger.error(f"Yield prediction error: {e}")
            return {"success": False, "error": str(e)}
    
    async def compare_crops(
        self,
        crops: list,
        weather: dict,
        soil: dict,
        location: dict,
        area: float = 1.0
    ) -> Dict[str, Any]:
        """Compare yields across crops."""
        try:
            client = await self.get_client()
            
            response = await client.post(
                f"{self.base_url}/compare-crops",
                params={"area": area},
                json={
                    "crops": crops,
                    "weather": weather,
                    "soil": soil,
                    "location": location
                }
            )
            response.raise_for_status()
            
            return response.json()
            
        except Exception as e:
            logger.error(f"Compare crops error: {e}")
            return {"error": str(e)}
    
    async def get_supported_crops(self) -> Dict[str, Any]:
        """Get supported crops."""
        try:
            response = await self._request("GET", f"{self.base_url}/crops")
            return response.json()
        except Exception as e:
            logger.error(f"Get crops error: {e}")
            return {"error": str(e)}
    
    async def get_model_info(self) -> Dict[str, Any]:
        """Get model information."""
        try:
            response = await self._request("GET", f"{self.base_url}/model/info")
            return response.json()
        except Exception as e:
            logger.error(f"Get model info error: {e}")
            return {"error": str(e)}


# Service instances
disease_client = DiseaseDetectionClient()
yield_client = YieldPredictionClient()


async def check_all_services() -> Dict[str, bool]:
    """Check health of all AI services."""
    disease_healthy = await disease_client.is_healthy()
    yield_healthy = await yield_client.is_healthy()
    
    return {
        "disease_detection": disease_healthy,
        "yield_prediction": yield_healthy
    }
