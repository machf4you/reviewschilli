# Chili Media Review Booster - MongoDB Database Setup

## Database Structure

### Database Name
```
chili_review_booster
```
(You can change this in your `.env` file with `DB_NAME`)

### Collections

#### 1. `clients` Collection
Stores client/business configurations for the review booster tool.

**Schema:**
```javascript
{
  _id: ObjectId,           // MongoDB auto-generated ID (not used in app)
  id: String,              // UUID - Primary identifier used in the app
  slug: String,            // URL-friendly unique identifier (lowercase)
  businessName: String,    // Display name of the business
  reviewLink: String,      // Google Review URL
  defaultTone: String,     // "friendly" or "professional"
  createdAt: String        // ISO 8601 datetime string
}
```

**Indexes:**
```javascript
// Unique index on slug for fast lookups
db.clients.createIndex({ "slug": 1 }, { unique: true })

// Index on id for CRUD operations
db.clients.createIndex({ "id": 1 }, { unique: true })
```

---

## Initialization Script

Run this script in `mongosh` to initialize your database:

```javascript
// Connect to your database
use chili_review_booster

// Create the clients collection with validation
db.createCollection("clients", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["id", "slug", "businessName", "reviewLink", "defaultTone", "createdAt"],
      properties: {
        id: {
          bsonType: "string",
          description: "UUID identifier - required"
        },
        slug: {
          bsonType: "string",
          description: "URL-friendly slug - required and unique"
        },
        businessName: {
          bsonType: "string",
          description: "Business display name - required"
        },
        reviewLink: {
          bsonType: "string",
          description: "Google Review URL - required"
        },
        defaultTone: {
          bsonType: "string",
          enum: ["friendly", "professional"],
          description: "Message tone - required"
        },
        createdAt: {
          bsonType: "string",
          description: "ISO datetime string - required"
        }
      }
    }
  }
})

// Create indexes
db.clients.createIndex({ "slug": 1 }, { unique: true })
db.clients.createIndex({ "id": 1 }, { unique: true })

print("Database initialized successfully!")
```

---

## Sample Data (Optional)

Insert sample clients for testing:

```javascript
db.clients.insertMany([
  {
    id: "550e8400-e29b-41d4-a716-446655440001",
    slug: "joes-coffee-shop",
    businessName: "Joe's Coffee Shop",
    reviewLink: "https://g.page/r/joes-coffee-review",
    defaultTone: "friendly",
    createdAt: new Date().toISOString()
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440002", 
    slug: "smith-dental-clinic",
    businessName: "Smith Dental Clinic",
    reviewLink: "https://g.page/r/smith-dental-review",
    defaultTone: "professional",
    createdAt: new Date().toISOString()
  }
])
```

---

## Environment Variables

Set these in your backend `.env` file:

```env
MONGO_URL="mongodb://localhost:27017"
DB_NAME="chili_review_booster"
ADMIN_PASSWORD="your_secure_password_here"
CORS_ORIGINS="https://yourdomain.com"
```

---

## Quick Setup Commands

```bash
# 1. Start MongoDB
sudo systemctl start mongod

# 2. Connect to MongoDB
mongosh

# 3. Run initialization script
use chili_review_booster
# ... paste the initialization script above ...

# 4. Verify setup
db.clients.getIndexes()
```

---

## Backup & Restore

**Backup:**
```bash
mongodump --db=chili_review_booster --out=/backup/location
```

**Restore:**
```bash
mongorestore --db=chili_review_booster /backup/location/chili_review_booster
```
