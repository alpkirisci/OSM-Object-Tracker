from database import engine
from models.all import Base, DataSource, OSMObject, ObjectLocation
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def init_db():
    logger.info("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created successfully.")

if __name__ == "__main__":
    init_db()