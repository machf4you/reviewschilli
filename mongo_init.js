// Chili Media Review Booster - MongoDB Initialization Script
// Run with: mongosh < mongo_init.js

// Create/switch to database
use chili_review_booster

// Drop existing collection if reinitializing (comment out if you want to keep data)
// db.clients.drop()

// Create the clients collection with schema validation
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

// Create indexes for fast lookups
db.clients.createIndex({ "slug": 1 }, { unique: true })
db.clients.createIndex({ "id": 1 }, { unique: true })

// Verify indexes
print("\n=== Indexes Created ===")
printjson(db.clients.getIndexes())

print("\n✅ Database 'chili_review_booster' initialized successfully!")
print("📝 Collection 'clients' is ready to use.")
print("\nNext steps:")
print("1. Update your backend .env file with DB_NAME=chili_review_booster")
print("2. Start your FastAPI backend")
print("3. Access admin at /review/admin to add clients")
