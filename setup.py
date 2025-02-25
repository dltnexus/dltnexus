from setuptools import setup, find_packages

setup(
    name="dltnexus",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        "fastapi",
        "uvicorn[standard]",
        "sqlalchemy",
        "alembic",
        "psycopg2-binary",
        "pydantic",
        "pydantic-settings",
        "python-dotenv",
        "pandas",
        "langfuse",
        "jinja2",
        "celery",
    ],
    python_requires=">=3.8",
) 