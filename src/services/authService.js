const pool = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const jwtSecretAccess = "un secret très très secret";
const jwtSecretRefresh = "un secret encore plus secret";

async function login(req, res) {
  const { email, password } = req.body;

  const result = await pool.query(`SELECT * FROM "user" WHERE email = $1`, [email]);
  const user = result.rows[0];
  if (!user) {
    return res.status(401).json({ message: "Identifiants incorrects" });
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.status(401).json({ message: "Identifiants incorrects" });
  }

  sendTokens(res, user.email);
}

function refresh(req, res) {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({ message: "refreshToken manquant" });
  }

  jwt.verify(refreshToken, jwtSecretRefresh, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    sendTokens(res, decoded.email);
  });
}

function sendTokens(res, email) {
  const refreshToken = jwt.sign({ email }, jwtSecretRefresh, { expiresIn: "1d" });
  const accessToken = jwt.sign({ email }, jwtSecretAccess, { expiresIn: "2m" });

  return res
    .cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    })
    .json({ accessToken });
}

module.exports = { login, refresh };
