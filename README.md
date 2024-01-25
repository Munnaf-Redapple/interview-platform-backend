# Interview Platform Node.js Backend

Welcome to the Interview Platform Node.js backend! Follow the instructions below to set up and run the application in different environments.

## Prerequisites
- Node.js (version >= 16.0.0)
- MongoDB (ensure it is running)
- Redis (ensure it is running)
- RabbitMQ (ensure it is running)

## Installation
1. Clone this repository to your local machine.
    ```bash
    git clone https://github.com/Munnaf-Redapple/interview-platform-backend.git
    cd interview-platform-backend
    ```

2. Install dependencies.
    ```bash
    npm install
    ```

## Configuration

Create a `dbConfig.json` file in the root/config folder of the project with the following structure:

```json
{
    "dev": {
        "username": "enter_db_username",
        "password": "enter_db_password",
        "database": "interview_platform_dev",
        "host": "localhost",
        "port": "8081",
        "dialect": "mongo",
        "dialectOptions": {
            "charset": "utf8mb4_unicode_ci"
        },
        "datetime": "yyyy-MM-dd HH:mm:ss",
        "redis_url": "redis://localhost:6379",
        "mq_url": "amqp://localhost:5672"
    },
    "stg": {
        "username": "enter_db_username",
        "password": "enter_db_password",
        "database": "interview_platform_stg",
        "host": "localhost",
        "port": "8081",
        "dialect": "mongo",
        "dialectOptions": {
            "charset": "utf8mb4_unicode_ci"
        },
        "datetime": "yyyy-MM-dd HH:mm:ss",
        "redis_url": "redis://localhost:6379",
        "mq_url": "amqp://localhost:5672"
    },
    "prd": {
        "username": "enter_db_username",
        "password": "enter_db_password",
        "database": "interview_platform_prd",
        "host": "localhost",
        "port": "8081",
        "dialect": "mongo",
        "dialectOptions": {
            "charset": "utf8mb4_unicode_ci"
        },
        "datetime": "yyyy-MM-dd HH:mm:ss",
        "redis_url": "redis://localhost:6379",
        "mq_url": "amqp://localhost:5672"
    }
}

```

## Running the Application

### Development Environment
```bash
npm start
