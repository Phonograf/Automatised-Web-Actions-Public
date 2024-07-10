require("dotenv").config({ path: `../Configs/.env.key` });

const verifyToken = (req, res, next) => {
  console.log(req.headers);
  console.log(process.env.TOKEN_KEY);
  const token =  req.headers["db-access-token"];
    //req.cookies['db-access-token'] || req.query.token || req.headers["db-access-token"] || req.body.token ;

  if (!token) {
    return res.status(403).send("A token is required for authentication");
  }
  try {
    if (token == process.env.TOKEN_KEY) {
        req.user = req.get('Origin');
        req.body = req.body;
    }else{
        throw new Error ("No");
    }
    
  } catch (err) {
    return res.status(401).send("Invalid Token");
  }
  return next();
};

module.exports = verifyToken;