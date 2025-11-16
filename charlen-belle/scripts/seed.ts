// app/seed/seed.ts
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

// Import all models
import User from "../app/models/User";
import TreatmentCategory from "../app/models/TreatmentCategory";
import Treatment from "../app/models/Treatment";
import PackageModel from "../app/models/Package";
import PackageItem from "../app/models/PackageItem";
import Promo from "../app/models/Promo";

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/yourdb";

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log("🌱 Connected to MongoDB");

  // Helper to skip if exists
  async function seedIfEmpty(model: any, name: string, data: any[]) {
    const count = await model.countDocuments();
    if (count > 0) {
      console.log(`✔ Skipped ${name} (already has ${count} documents)`);
      return;
    }
    await model.insertMany(data);
    console.log(`✔ Seeded ${name}`);
  }

  // --- USERS (doctor, kasir, admin, customer) ---
  const users = [
    {
      name: "Admin",
      email: "admin@example.com",
      role: "admin",
      password: "hashedpassword123"
    },
    {
      name: "Dr. John",
      email: "doctor@example.com",
      role: "doctor"
    },
    {
      name: "Kasir Sarah",
      email: "kasir@example.com",
      role: "kasir"
    },
    {
      name: "Customer Test",
      email: "customer@example.com",
      role: "customer"
    }
  ];

  await seedIfEmpty(User, "Users", users);

  // Get inserted IDs for relationships
  const doctor = await User.findOne({ role: "doctor" });
  const admin = await User.findOne({ role: "admin" });

  // --- TREATMENT CATEGORIES ---
  const treatmentCategories = [
    { name: "Facial", description: "Face treatments" },
    { name: "Body", description: "Body treatments" }
  ];

  await seedIfEmpty(
    TreatmentCategory,
    "Treatment Categories",
    treatmentCategories
  );

  const facialCategory = await TreatmentCategory.findOne({ name: "Facial" });

  // --- TREATMENTS ---
  const treatments = [
    {
      name: "Basic Facial",
      description: "Cleansing + exfoliation",
      duration_minutes: 45,
      base_price: 150000,
      category_id: facialCategory?._id
    },
    {
      name: "Deep Cleansing Facial",
      description: "Deep cleaning treatment",
      duration_minutes: 60,
      base_price: 250000,
      category_id: facialCategory?._id
    }
  ];

  await seedIfEmpty(Treatment, "Treatments", treatments);

  const allTreatments = await Treatment.find();

  // --- PACKAGES ---
  const packages = [
    {
      name: "Glow Package",
      description: "2x facial treatment bundle",
      base_price: 350000
    }
  ];

  await seedIfEmpty(PackageModel, "Packages", packages);

  const glowPackage = await PackageModel.findOne({ name: "Glow Package" });

  // --- PACKAGE ITEMS ---
  const packageItems = allTreatments.map((t) => ({
    package_id: glowPackage?._id,
    treatment_id: t._id,
    quantity: 1
  }));

  await seedIfEmpty(PackageItem, "Package Items", packageItems);

  // --- PROMOS ---
  const promos = [
    {
      name: "New Year Promo",
      description: "20% off",
      discount_type: "percentage",
      discount_value: 20,
      is_active: true
    }
  ];

  await seedIfEmpty(Promo, "Promos", promos);

  console.log("\n🎉 Seeding complete!");
  mongoose.connection.close();
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
