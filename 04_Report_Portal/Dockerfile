# The report portal, with what it needs to rebuild the report from uploaded
# SiteIQ exports: the report kit's code and a browser for the PDF copies.
# Build from the repo root:  docker build -f 04_Report_Portal/Dockerfile .
FROM mcr.microsoft.com/playwright/python:v1.49.1-noble
WORKDIR /app
COPY 04_Report_Portal/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir --break-system-packages -r /app/requirements.txt
COPY 02_Onhire_Report_Kit /app/02_Onhire_Report_Kit
COPY 04_Report_Portal /app/04_Report_Portal
ENV PYTHONUNBUFFERED=1
CMD ["python3", "/app/04_Report_Portal/server.py"]
