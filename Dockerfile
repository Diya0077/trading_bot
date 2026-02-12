# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Set the working directory in the container
WORKDIR /app

# Copy the dependencies file to the working directory
COPY requirements.txt .

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the current directory contents into the container at /app
COPY . .

# Install the package so 'tradebot' command is available
RUN pip install .

# Run the tradebot command
ENTRYPOINT ["tradebot"]
CMD ["--help"]
