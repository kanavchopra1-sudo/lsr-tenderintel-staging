FROM python:3.11-slim

WORKDIR /app

# Copy all application files
COPY . /app

# Expose dynamic port
ENV PORT=8550
EXPOSE 8550

CMD ["python", "server.py"]
