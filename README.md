# PregnaCare Backend Documentation 🚀

## Setup & Installation

```bash
# Clone repository
git clone https://github.com/dikaproject/dinacom-backend.git
cd dinacom-backend

# Install dependencies
npm install
npx prisma generate
npx prisma db push
```

## Environment Variables

Create a `.env` file in the project root with the following configurations:

### Server Configuration
```
DATABASE_URL="mysql://user:password@localhost:3306/lomba_dinacom"
JWT_SECRET="your sceret key"
MIDTRANS_SERVER_KEY=your_server_key
MIDTRANS_CLIENT_KEY=your_client_key
OPENAI_API_KEY=your_openai_key
FONNTE_TOKEN=your_fonnte_token
```

## Tech Stack

- **Runtime**: Node.js
- **Database Management**: Prisma
- **Web Framework**: Express.js
- **Database**: MySQL
- **Authentication**: JSON Web Token (JWT)
- **File Upload**: Multer
- **Payment Gateway**: Midtrans
- **Ai**: OpenAI & GroqAI
- **Message Service**: Fonnte

  
## Account

Link Demo Website : https://dinacom.intechofficial.com

---
- email : admin@gmail.com
- passsword : password123
---
- email : dika@gmail.com  
- password : password
---
- email : dikagilang2007@gmail.com
- password : Dika#3321

## Features

### 1. File Upload Management
- Product image uploads
- Doctor Documentation verification
- Business photo submissions
- Secure file handling and validation

### 2. Whatssapp Notifications
- Automated registration confirmation
- Real-time order status updates

### 3. Security Implementations
- JWT-based authentication
- Role-based access control
- Secure password hashing
- Comprehensive file validation
- Protection against common web vulnerabilities

### 4. Transaction Management
- Robust MySQL transaction support
- Advanced error handling
- Transaction rollback mechanisms
- Ensure data integrity and consistency

## Project Setup Checklist

### Prerequisites
- Node.js (v14+ recommended)
- MySQL database
- Midtrans account (for payment gateway)
- SMTP email service

### Recommended Development Tools
- Postman (API testing)
- MySQL Workbench
- Visual Studio Code
- Git for version control

## Running the Application

```bash

npm start
```

## Contributors
- [Arya Fathdhillah Adi Saputra](https://github.com/afasarya)
- [Rasya Dika Pratama](https://github.com/dikaproject)
- [Sofwan Nuha Al Faruq](https://github.com/theonlyshannon)

