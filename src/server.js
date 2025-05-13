const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/authRoutes");
const bookRoutes = require("./routes/bookRoutes");
const pool = require("./db");

const jwtSecretAccess = "un secret très très secret";

const app = express();
const port = 3000;

const main = async () => {

  app.use(cors({ credentials: true, origin: true }));
  app.use(cookieParser());
  app.use(express.json());

// Middleware de vérification de JWT
  function checkBearerToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: "Missing Authorization header" });
    }

    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return res.status(401).json({ error: "Invalid Authorization format" });
    }

    jwt.verify(parts[1], jwtSecretAccess, (err, decoded) => {
      if (err) {
        return res.status(401).json({ error: "Invalid or expired token" });
      }

      req.user = decoded; // Ajoute l'utilisateur dans req
      next();
    });
  }

  app.use("/api/auth", authRoutes);
  app.use("/api/books", checkBearerToken, bookRoutes);

  app.use("/api/users", userRoutes);


  await pool.connect();
  console.log('✅ Connected to the database');

  await app.listen(port);
  console.log(`Serveur démarré sur le port ${port}`)

}

main();
