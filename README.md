# Identity Reconciliation Service

Backend service for Bitespeed's identity reconciliation system. Tracks customer identity across multiple purchases by linking contact information.

## Hosted Endpoint

🚀 **Live API**: `https://identity-reconciliation-fbrr.onrender.com/identify` 

## Features

- Identifies and links customer contacts across multiple purchases
- Consolidates contacts with common email or phone numbers
- Automatically converts primary contacts to secondary when linking
- Returns consolidated contact information with all associated emails and phone numbers

## Tech Stack

- Node.js + TypeScript
- Express.js
- SQLite (easily swappable for PostgreSQL/MySQL)
- JSON request/response format

## Setup

```bash
npm install
npm run build
npm start
```

## Development

```bash
npm install
npm run dev
```

## API Documentation

### POST /identify

Identifies and consolidates customer contact information.

**Request Body:**
```json
{
  "email": "lorraine@hillvalley.edu",
  "phoneNumber": "123456"
}
```

**Response:**
```json
{
  "contact": {
    "primaryContactId": 1,
    "emails": ["lorraine@hillvalley.edu", "mcfly@hillvalley.edu"],
    "phoneNumbers": ["123456"],
    "secondaryContactIds": [23]
  }
}
```

## How It Works

### Contact Linking Rules

1. **New Contact**: If no matching email or phone exists, creates a new primary contact
2. **Existing Contact**: If email or phone matches, links to existing contact chain
3. **New Information**: If new email/phone is provided with existing contact, creates secondary contact
4. **Primary Merging**: When two primary contacts are linked, the older one remains primary

### Example Scenarios

**Scenario 1: First Purchase**
```bash
POST /identify
{"email": "lorraine@hillvalley.edu", "phoneNumber": "123456"}
# Creates primary contact (id: 1)
```

**Scenario 2: Same Customer, New Email**
```bash
POST /identify
{"email": "mcfly@hillvalley.edu", "phoneNumber": "123456"}
# Creates secondary contact (id: 23) linked to primary (id: 1)
```

**Scenario 3: Linking Two Primary Contacts**
```bash
# First customer
POST /identify
{"email": "george@hillvalley.edu", "phoneNumber": "919191"}
# Creates primary contact (id: 11)

# Second customer
POST /identify
{"email": "biffsucks@hillvalley.edu", "phoneNumber": "717171"}
# Creates primary contact (id: 27)

# Linking request
POST /identify
{"email": "george@hillvalley.edu", "phoneNumber": "717171"}
# Converts id: 27 to secondary, links to id: 11 (older primary)
```

## Testing

```bash
# Test 1: Create new contact
curl -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","phoneNumber":"123456"}'

# Test 2: Link with new email
curl -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{"email":"test2@example.com","phoneNumber":"123456"}'

# Test 3: Query existing contact
curl -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```



## Environment Variables

- `PORT`: Server port (default: 3000)

## Project Structure

```
├── src/
│   ├── index.ts       # Express server and routes
│   ├── service.ts     # Identity reconciliation logic
│   └── database.ts    # Database operations and Contact model
├── package.json
├── tsconfig.json
└── README.md
```

## License

MIT
