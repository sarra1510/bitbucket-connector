require("dotenv").config();
const axios = require("axios");

// --- Configuration ---
const { BB_USER, BB_TOKEN, BB_BASE_URL, BB_PROJECT, BB_REPO } = process.env;
const API = `${BB_BASE_URL}/rest/api/1.0`;

// Auth : Bearer Token (ou fallback user/password)
const authConfig = BB_TOKEN
  ? { headers: { Authorization: `Bearer ${BB_TOKEN}` } }
  : { auth: { username: BB_USER, password: process.env.BB_PASSWORD } };

// --- Vérifications ---
if (!BB_BASE_URL || !BB_PROJECT || !BB_REPO) {
  console.error("❌ Variables manquantes dans .env !");
  process.exit(1);
}

// --- Fonctions ---
async function testConnexion() {
  try {
    const res = await axios.get(`${API}/projects/${BB_PROJECT}/repos/${BB_REPO}`, authConfig);
    console.log("✅ Connexion réussie !\n");
    console.log(`📦 Repo        : ${res.data.name}`);
    console.log(`   Description : ${res.data.description || "N/A"}`);
    console.log(`   Projet      : ${res.data.project.name} (${res.data.project.key})`);
    console.log(`   État        : ${res.data.state}`);
    console.log(`   Clone SSH   : ${res.data.links.clone.find(l => l.name === "ssh")?.href}`);
    console.log(`   Clone HTTP  : ${res.data.links.clone.find(l => l.name === "http")?.href}`);
    return true;
  } catch (error) {
    console.error(`❌ Échec (HTTP ${error.response?.status})`);
    console.error(`   ${error.response?.data?.errors?.[0]?.message || error.message}`);
    return false;
  }
}

async function listerBranches() {
  try {
    const res = await axios.get(
      `${API}/projects/${BB_PROJECT}/repos/${BB_REPO}/branches?limit=25`,
      authConfig
    );
    console.log(`\n🌿 Branches (${res.data.size}) :`);
    console.log("─".repeat(50));
    res.data.values.forEach((b) => {
      const icon = b.isDefault ? "⭐" : "  ";
      console.log(`  ${icon} ${b.displayId}`);
    });
  } catch (error) {
    console.error("❌ Erreur branches :", error.response?.data?.errors?.[0]?.message || error.message);
  }
}

async function listerFichiers(path = "packages") {
  try {
    const res = await axios.get(
      `${API}/projects/${BB_PROJECT}/repos/${BB_REPO}/files/${path}?limit=50`,
      authConfig
    );
    const files = res.data.values;
    console.log(`\n📁 Fichiers dans /${path} (${files.length}) :`);
    console.log("─".repeat(50));
    files.forEach((file, i) => {
      console.log(`  ${i + 1}. 📄 ${file}`);
    });
  } catch (error) {
    console.error("❌ Erreur fichiers :", error.response?.data?.errors?.[0]?.message || error.message);
  }
}

async function listerDossiers(path = "packages") {
  try {
    const res = await axios.get(
      `${API}/projects/${BB_PROJECT}/repos/${BB_REPO}/browse/${path}?limit=50`,
      authConfig
    );
    const items = res.data.children?.values || [];
    console.log(`\n📂 Contenu de /${path} (${items.length}) :`);
    console.log("─".repeat(50));
    items.forEach((item, i) => {
      const icon = item.type === "DIRECTORY" ? "📁" : "📄";
      const size = item.size ? ` (${item.size} bytes)` : "";
      console.log(`  ${i + 1}. ${icon} ${item.path.name}${size}`);
    });
  } catch (error) {
    console.error("❌ Erreur browse :", error.response?.data?.errors?.[0]?.message || error.message);
  }
}

// --- Exécution ---
async function main() {
  console.log(`🔗 Bitbucket Server: ${BB_BASE_URL}`);
  console.log(`   Projet: ${BB_PROJECT} | Repo: ${BB_REPO}`);
  console.log("─".repeat(50));

  const connected = await testConnexion();
  if (connected) {
    await listerBranches();
    await listerDossiers("packages");
  }

  console.log("\n" + "─".repeat(50));
  console.log("✅ Terminé.");
}

main();
