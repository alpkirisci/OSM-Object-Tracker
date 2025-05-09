import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import logging

from config import settings

# Import routers
from routers import objects, data_sources, websockets, sensors, logs, object_types

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    filename="backend.log"
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    description=settings.APP_DESCRIPTION,
    version=settings.APP_VERSION,
    docs_url="/api/docs" if settings.DEBUG else None,
    redoc_url="/api/redoc" if settings.DEBUG else None,
)

# Configure CORS - more restrictive in production
origins = ["*"] if settings.DEBUG else [f"https://{host.strip()}" for host in settings.ALLOWED_HOSTS]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"] if not settings.DEBUG else ["*"],
    allow_headers=["Authorization", "Content-Type"] if not settings.DEBUG else ["*"],
)

# Ensure directories exist
os.makedirs(settings.MEDIA_DIR, exist_ok=True)

# Mount static file directories
try:
    app.mount("/media", StaticFiles(directory=settings.MEDIA_DIR), name="media")
except Exception as e:
    logger.error(f"Error mounting static directories: {e}")

# Basic root endpoint
@app.get("/")
async def root():
    return {"message": "Welcome to the Military Object Tracking API", "status": "operational"}

# Health check endpoint
@app.get("/health")
async def health():
    return {"status": "healthy"}

# Include routers
app.include_router(objects.router)
app.include_router(data_sources.router)
app.include_router(websockets.router)
app.include_router(sensors.router)
app.include_router(logs.router)
app.include_router(object_types.router)

@app.on_event("startup")
async def startup_event():
    logger.info("Application startup")
    # You could add database connection validation here

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Application shutdown")
    # You could close connections here

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app", 
        host="0.0.0.0", 
        port=8000, 
        reload=settings.DEBUG,
        workers=1 if settings.DEBUG else 4  # Use multiple workers in production
    )