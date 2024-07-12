function verifyPermissions(require) {
  return verifyPermissions[require] || (verifyPermissions[require]=(req, res, next) => {
    try {
      let userPerms = req.user.permissions.split(",");
      console.log(userPerms);
      console.log(require);
      for (let index = 0; index < require.length; index++) {
      const element = require[index];
      if ((userPerms.indexOf(element)!=-1)||(userPerms.indexOf("admin")!=-1)) {
        return next();
      }
    }
    return res.status(403).send(`Forbidden. Require ${require}`);
    } catch (error) {
      return res.status(403).send(`Frobidden: no Permissions`);
    }
    
  });
}


module.exports = verifyPermissions;