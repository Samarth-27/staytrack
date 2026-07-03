const mongoose = require("mongoose");

mongoose.connect(
  "mongodb+srv://samarthjaincse_db_user:vtFq1s0i06ok6PJQ@cluster0.jsehbxy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
)
.then(() => {
  console.log("✅ Atlas Connected");
  process.exit(0);
})
.catch(err => {
  console.error("❌ Error:", err);
  process.exit(1);
});