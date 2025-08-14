import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  connectionString: "postgresql://postgres:TamanTanahBaru@db.iwitjktcuetbizjgdwtb.supabase.co:5432/postgres?sslmode=require",
});

(async () => {
  try {
    await client.connect();
    console.log("✅ Connected to Supabase!");
    await client.end();
  } catch (err) {
    console.error("❌ Connection failed:", err);
  }
})();
