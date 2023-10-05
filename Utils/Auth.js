import User from "../Models/User.js";
import jwt from "jsonwebtoken";
const Auth = (req, res, next) => {
  try
  {
    let token = req.headers[process.env.AuthHeader];
    if (!token)
      throw {
        statusCode: 400,
        message: `Invalid request, Token is missing from headers`,
      };
    token = token.split("Bearer")[1].trim();
    const payload = jwt.verify(token, process.env.SecurityKey);
    req.session.userId = payload.dataValues.Id;
    next();
  }
  catch(err)
  {
    return res.status(err.statusCode??400).json({statusCode:'400',operation:'Auth',message:err.message,capturedDateTime:Date.now()})
  }
};
export default Auth;
