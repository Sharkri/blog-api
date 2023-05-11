import jwt from "jsonwebtoken";

function verifyToken(req, res, next) {
  const bearerHeader = req.headers.authorization;

  if (bearerHeader == null) {
    res.status(403).send("No authorization header provided");
    return;
  }

  // Get the second value from the split string "Bearer <access_token>"
  const [, bearerToken] = bearerHeader.split(" ");

  // Set the token
  req.token = bearerToken;

  // Verify token
  jwt.verify(req.token, process.env.JWT_SECRET, (err, data) => {
    if (err) {
      res.status(403).json(err);
      return;
    }
    // Set the data
    req.data = data;
    next();
  });
}

export { verifyToken };
