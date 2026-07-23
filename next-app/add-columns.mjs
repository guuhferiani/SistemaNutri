import { neon } from "@neondatabase/neon-js";

const sql = neon(process.env.NEXT_PUBLIC_NEON_DATABASE_URL || process.env.NEON_DATABASE_URL || "postgresql://neondb_owner:npg_gY5d6pWkFevj@ep-shiny-breeze-a87z69r9-pooler.eastus2.azure.neon.tech/neondb?sslmode=require");

async function run() {
  try {
    console.log("Adding new columns...");
    await sql`ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS rotina TEXT;`;
    await sql`ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS restricoes_alimentares TEXT;`;
    await sql`ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS agua_diaria TEXT;`;
    await sql`ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS sono TEXT;`;
    console.log("Successfully added new columns to pacientes table!");
  } catch (err) {
    console.error("Error adding columns:", err);
  }
}

run();
