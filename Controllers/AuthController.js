import bcrypt from 'bcrypt'
import User from '../Models/User.js'
import jwt from 'jsonwebtoken'

export const Login = async(req,res,next)=>
{
    try
    {
        const loginDetails = req.body;
        if(!loginDetails) throw {statusCode:400, message:'Invalid request, request body is missing'}
        const foundUser = await User.findOne({UserName:loginDetails.UserName})
        if(!foundUser) throw {statusCode:400, message:'Invalid User'}
        const isPasswordMatch = await bcrypt.compare(loginDetails.PasswordHash,foundUser.PasswordHash)
        if(!isPasswordMatch) throw  {statusCode:400, message:'Incorrect password'}
        req.session.isLoggedIn = true
        console.log('Login successful')
        return res.status(200).json({statusCode:200, message:'Login successful'})
    }
    catch(err)
    {
        return res.status(err.statusCode??400).json({statusCode:err.statusCode??'400',operation:'Login',message:err.message,capturedDateTime:new Date(Date.now())})   
    }
}
export const LogOut = async(req,res,next)=>
{
    try
    {
        req.session.destroy()
        console.log('LogOut successful')
        return res.status(200).json({statusCode:200, message:'LogOut successful'})
    }
    catch(err)
    {
        return res.status(err.statusCode??400).json({statusCode:err.statusCode??'400',operation:'LogOut',message:err.message,capturedDateTime:new Date(Date.now())})   
    }
}
export const generateToken = async(req,res,next)=>
{
    try
    {
        const loginDetails = req.body;
        if(!loginDetails) throw {statusCode:400, message:'Invalid request, request body is missing'}
        const foundUser = await User.findOne({where:{UserName:loginDetails.UserName}})
        if(!foundUser) throw {statusCode:400, message:'Invalid User'}
        const isPasswordMatch = await bcrypt.compare(loginDetails.Password,foundUser.PasswordHash)
        if(!isPasswordMatch) throw {statusCode:400, message:'Incorrect password'}
        let expiresIn = 600000
        if(foundUser.isAdmin)  expiresIn = expiresIn * 10
        const token = jwt.sign({...foundUser},process.env.SecurityKey,{expiresIn:`${(expiresIn/1000*60)}h`}) 
        return res.status(200).json({statusCode:200, message:'Token generated successfully',result:{Token:token,ExpiresIn:expiresIn,GeneratedOn:new Date(Date.now)}})  
    }
    catch(err)
    {
        return res.status(err.statusCode??400).json({statusCode:err.statusCode??'400',operation:'generateToken',message:err.message,capturedDateTime:new Date(Date.now())})   
    }
}