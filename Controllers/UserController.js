import User from "../Models/User.js";
import { Op } from "sequelize";
import generateVerificationCode from "../Utils/generateVerificationCode.js";
import UserVerification from "../Models/UserVerification.js";
import bcrypt from 'bcrypt'
import UserAddress from "../Models/UserAddress.js";


export const GetAllUsers = async (req,res,next)=>
{
    try
    {
        const users = await User.findAll();
        return res.status(200).json({statusCode:200,message:users});
    }
    catch(err)
    {
        return res.status(400).json({statusCode:'400',operation:'GetAllUsers',message:err.message,capturedDateTime:Date.now()})
    }
}
export const GetUserById = async(req,res,next)=>
{
    try
    {
        const {id:userId} = req.params
        if(!userId) throw {statusCode:400,message:'Invalid Request, UserId is missing'}
        const user = await User.findOne({where:{Id:userId}, include:[{
            model:UserAddress
        }]})
        if(!user) throw {statusCode:404,message:`User with ${userId} not found`}
        return res.status(200).json({statusCode:200,message:user})
    }
    catch(err)
    {
        return res.status(err.statusCode?err.statusCode:400).json({statusCode:err.statusCode,message:err.message})
    }
}
export const CreateUser = async(req,res,next)=>
{
    try
    {
        const userDetails = {...req.body}
        if(userDetails.IsSeller && !userDetails.SellerName) throw {statusCode:400, message:`Seller Name is required for enrolling as a seller`}
        if(userDetails.IsAdmin && !userDetails.AdminName) throw {statusCode:400, message:`Admin Name is required for enrolling as a Admin`}
        
        //checking for existsnce
        const foundUser = await User.findOne({where:{UserName:userDetails.Email}})
        if(foundUser) throw new {statusCode:400, message:`User with Email:${userDetails.Email} already existing`}
        const passwordHashGenerated = await bcrypt.hash(userDetails.Password,10)
        userDetails.PasswordHash = passwordHashGenerated
        const newUser = await User.create(userDetails) 
        if(newUser.IsSeller)
        {
            const seller = await newUser.createSeller({Name:userDetails.SellerName})
            console.log(`User:${newUser.Id} is registered as Seller:${seller.Id}`)

            //    await publishEventtoServiceBus("userqueue","user_created",{message:'User is created'})

            return res.status(200).json({statusCode:200,message:`user:${newUser.Id} is created as seller successfully`,result:{
                User:newUser
            }})
            
        }
        if(newUser.IsAdmin)
        {
            const admin = await newUser.createAdmin({Name:userDetails.AdminName})
            console.log(`User:${newUser.Id} is registered as Admin:${admin.Id}`)

            //    await publishEventtoServiceBus("userqueue","user_created",{message:'User is created'})

            return res.status(200).json({statusCode:200,message:`user:${newUser.Id} is created as Admin successfully`,result:{
                User:newUser
            }})

        }
        return res.status(200).json({statusCode:200,message:`user:${newUser.Id} creation successful`,result:{
            User:newUser
        }})
    }
    catch(err)
    {
        console.log(err)
        return res.status(err.statusCode?err.statusCode:400).json({statusCode:err.statusCode,message:err.message})
    }
}

export const CreateBulkUsers = async(req,res,next)=>
{
    try
    {
        const userDetails = [...req.body]
        const newUser = await User.bulkCreate(userDetails) 
        return res.status(200).json({statusCode:200,message:`${userDetails.length} Users created successfully`,records:newUser})
    }
    catch(err)
    {
        console.log(err)
        return res.status(err.statusCode?err.statusCode:400).json({statusCode:err.statusCode,message:err.message})
    }
}

export const UpdateUser = async(req,res,next)=>
{
    try
    {
        const {id:userId} = req.params
        if(!userId) throw {statusCode:400,message:'Invalid Request, UserId is missing'}
        const user = await User.findOne({where:{Id:userId}})
        if(!user) throw {statusCode:404,message:`User with ${userId} not found`}
        const updatedUser = await user.update({...req.body})
        return res.status(200).json({statusCode:200,message:updatedUser})
    }
    catch(err)
    {
        return res.status(err.statusCode?err.statusCode:400).json({statusCode:err.statusCode,message:err.message})
    }
}
export const DeleteUser = async(req,res,next)=>
{
    try
    {
        const {id:userId} = req.params
        if(!userId) throw {statusCode:400,message:'Invalid Request, UserId is missing'}
        const user = await User.findOne({where:{Id:userId}})
        if(!user) throw {statusCode:404,message:`User with ${userId} not found`}
        const userAddressList = await user.getUserAddresses()
        userAddressList.forEach( async (address)=>
        {
            await address.destroy()
        })
        await user.destroy();
        return res.status(200).json({statusCode:200,message:`User with ${userId} deleted successfully`})
    }
    catch(err)
    {
        return res.status(err.statusCode?err.statusCode:400).json({statusCode:err.statusCode,message:err.message})
    }
}
export const getUserAddress = async(req,res,next)=>
{
    try
    {
        const {addressType, excludeAddressType} = req.query
        let addressFilters = {}
        let excludeFilters = {}
        if(addressType) addressFilters = {AddressType: addressType}
        if(excludeAddressType) excludeFilters = {AddressType: {[Op.not]:[excludeAddressType]} }
        if(!req.session.userId) throw new Error(`User must be authenticated to continue`)
        const user = await User.findByPk(req.session.userId)
        if(!user) throw {statusCode:422,message:`User: ${req.session.userId} does not exists.`}
        const userAddressList = await user.getUserAddresses({where:{...addressFilters,...excludeFilters}})
        return res.status(200).json({statusCode:200, message:`User:${req.session.userId} addresses fetched `,result:userAddressList})
    }
    catch(err)
    {
        return res.status(400).json({statusCode:400,message:err.message})       
    }
}
export const getUserAddressById = async(req,res,next)=>
{
    try
    {
        const addressId = req.params.addressId
        if(!req.session.userId) throw new Error(`User must be authenticated to continue`)
        const user = await User.findByPk(req.session.userId)
        if(!user) throw {statusCode:422,message:`User: ${req.session.userId} does not exists.`}
        if(!addressId) throw new Error(`Invalid request, missing Address Id`)
        const userAddressList = await user.getUserAddresses({where:{Id: addressId}})
        return res.status(200).json({statusCode:200, message:`User:${req.session.userId} addresses fetched `,result:userAddressList})
    }
    catch(err)
    {
        return res.status(400).json({statusCode:400,message:err.message})       
    }
}
export const addUserAddress = async(req,res,next)=>
{
    try
    {
        if(!req.session.userId) throw new Error(`User must be authenticated to continue`)
        let {AddressType, AddressLine1, AddressLine2, ZipCode, City, State, Country} = req.body
        if(!((["permanent","default","delivery","shipping","seller","others"].filter(c=>c.toLowerCase()===AddressType.toLowerCase())).length>0)) throw {statusCode:422,message:`AddressType must be limited to ${["permanent","default","shipping","seller","others"]}`}
        const user = await User.findByPk(req.session.userId)
        if(!user) throw {statusCode:422,message:`User: ${req.session.userId} does not exists.`}
        if(!AddressType) AddressType = 'other'
        if(AddressType==='seller' && ((await user.getUserAddresses({where:{AddressType:AddressType}})).length>0)) throw {statusCode:422, message:`Address type:${AddressType} already existing`}
        if(!AddressLine1 || !AddressLine2 || !ZipCode || !City || !State || !Country) return res.status(422).json({statusCode:422, message:'Invalid request, field\'s missing'})
        if((await user.getUserAddresses({where:{AddressType, AddressLine1, AddressLine2, ZipCode, City, State, Country}})).length>0) throw {statusCode:422,message:`Address already existing`}    
        await user.createUserAddress({AddressType, AddressLine1, AddressLine2, ZipCode, City, State, Country})
        return res.status(200).json({statusCode:200, message:`User:${user.Id} address added successfully`})
    }
    catch(err)
    {
        console.log(err)
        return res.status(400).json({statusCode:400,message:err.message})       
    }
}
export const changeAddresstype = async(req,res,next)=>
{
    try
    {
        const {addressId,userId,status} = req.params
        if(!addressId || !userId || !status) new Error(`Invalid request, Address/User/Status is missing`)
        if(!((["permanent","default","delivery","shipping","seller","others"].filter(c=>c.toLowerCase()===status.toLowerCase())).length>0)) throw {statusCode:422,message:`AddressType must be limited to ${["permanent","default","shipping","seller","others"]}`}
        const user = await User.findOne({where:{Id:userId}})
        if(!user) throw {statusCode:422,message:`User: ${userId} does not exists.`}
        const userAddress = (await user.getUserAddresses({where:{Id:addressId}}))[0]
        if(!userAddress) return res.status(400).json({statusCode:400, message:`User Addresses are empty, Please add to continue`})
        userAddress.AddressType = status
        await userAddress.save()
        return res.status(200).json({statusCode:200, message:`User:${req.session.user.Id} Default address setted successfully`})
    }
    catch(err)
    {
        return res.status(400).json({statusCode:400,message:err.message})       
    }
}
export const getVerificationCode = async(req,res,next)=>
{
    try
    {
        let {length} = req.query
        const {id:userId} = req.params
        if(!userId) throw {statusCode:400,message:'Invalid request, userId is missing'}
        length = (length && length>12)?length:22
        if(!length) length=22
        const code = generateVerificationCode(length)
        const user = await User.findOne({where:{Id:userId}})
        if(!user) throw {statusCode:400,message:'Invalid request, user does not exists'}
        await UserVerification.destroy({where:{UserId:userId}})
        const details = {VerificationCode:code,ExpiresOn:new Date(Date.now()+3600 * 1000)}
        await user.createUserVerification(details)
        return res.status(200).json({statusCode:200,message:`verification code generated successfully for user:${userId}`,result:details})
    }
    catch(err)
    {
        return res.status(err.statusCode??400).json({statusCode:err.statusCode??'400',operation:'getVerificationCode',message:err.message,capturedDateTime:new Date(Date.now())})        
    }
}
export const verifyUserEmailPost = async(req,res,next)=>
{
    try
    {
        const {code:verificationCode} = req.params
        const {Email, Password} = req.body
        if(!verificationCode || !Email || !Password) throw {statusCode:422,message:`Invalid request, details are missing`}
        const foundUser = await User.findOne({where:{Email:Email}})
        if(!foundUser) throw {statusCode:404,message:`User:${Email} does not exists`}
        //password verification
        const UserVerificationCode = await foundUser.getUserVerification({where:{VerificationCode:verificationCode,ExpiresOn:{[Op.gte]:new Date(Date.now())}}})
        if(!UserVerificationCode) 
        {
            await UserVerification.destroy({where:{UserId:foundUser.Id}})
            throw {statusCode:422,message:`Verification code got expired`}
        }
        foundUser.IsActive = true
        await foundUser.save()
        await UserVerification.destroy({where:{UserId:foundUser.Id}})
        return res.status(200).json({statusCode:200,message:`User:${Email} verification successful`})
    }
    catch(err)
    {
        return res.status(err.statusCode??'400').json({statusCode:err.statusCode??'400',operation:'verifyUserEmail',message:err.message,capturedDateTime:new Date(Date.now())})        
    }
}

//views
export const SignInGet = async(req,res,next)=>
{
    return res.render('users/singIn.ejs',{activePage:'signIn',isLoggedIn:req.session?req.session.isLoggedIn:false,message:undefined,isSuccess:undefined}) 
}
export const SignInPost = async(req,res,next)=>
{
    try
    {
        const {username, password} = req.body
        console.log('singInPost',username,password)
        const foundUser = await User.findOne({where:{UserName: username}})
        if(!foundUser) throw {statusCode:422, message:`user not found`}
        const isMatch = await bcrypt.compare(password,foundUser.PasswordHash)
        if(!isMatch) throw {statusCode:422, message:`Incorrect password, password does not match`}
        req.session.isLoggedIn = isMatch
        req.session.userId = foundUser.Id
        req.session.UserName = username
        req.session.Password =password
        req.session.IsSeller = foundUser.IsSeller
        res.locals.message= 'SignIn successful'
        res.locals.isSuccess=true    
        return res.redirect('/shop')
    }
    catch(err)
    {
        res.locals.message=err.message
        res.locals.isSuccess=false    
        return res.render('users/singIn.ejs',{activePage:'signIn',isLoggedIn:req.session?req.session.isLoggedIn:false,message:err.message,isSuccess:false})
    }
}
export const SignUpGet = async(req,res,next)=>
{
    res.locals.message=undefined
    res.locals.isSuccess=undefined
    return res.render('users/singUp.ejs',{activePage:'singUp',isLoggedIn:req.session?req.session.isLoggedIn:false}) 
}
export const SignUpPost = async(req,res,next)=>
{
    try
    {
        let {FirstName, LastName, PreferredName, Age, UserName, Email, MobileNumber, Password, IsSeller, SellerName, AddressType, AddressLine1, AddressLine2, ZipCode, City, State, Country} = req.body
        let UserDetails = {FirstName, LastName, PreferredName, Age, UserName, Email, MobileNumber, PasswordHash:Password, IsSeller}

        if(UserDetails.IsSeller)
        {
            UserDetails.IsSeller = true
            if(UserDetails.IsSeller && !SellerName) throw {statusCode:400, message:`Seller Name is required for enrolling as a seller`}
            UserDetails = {...UserDetails, SellerName: SellerName}
        }
        else
            UserDetails.IsSeller = false

        UserDetails.Age = +UserDetails.Age
        
        //checking for existsnce
        const foundUser = await User.findOne({where:{UserName:UserDetails.Email}})
        if(foundUser) throw new {statusCode:400, message:`User with Email:${UserDetails.Email} already existing`}
        UserDetails.PasswordHash = await bcrypt.hash(UserDetails.PasswordHash,10)
        const newUser = await User.create(UserDetails) 
        if(IsSeller)
        {
            const seller = await newUser.createSeller({Name:UserDetails.SellerName})
            console.log(`User:${newUser.Id} is registered as Seller:${seller.Id}`)
        }
        //user address
        if(AddressType && !((["permanent","default","shipping","seller","others"].filter(c=>c.toLowerCase()===AddressType.toLowerCase())).length>0)) throw {statusCode:422,message:`AddressType must be limited to ${["permanent","default","shipping","seller","others"]}`}
        if(!AddressType) AddressType = 'other'
        if(AddressType==='seller' && ((await newUser.getUserAddresses({where:{AddressType:AddressType}})).length>0)) throw {statusCode:422, message:`Address type:${AddressType} already existing`}
        if(!AddressLine1 || !AddressLine2 || !ZipCode || !City || !State || !Country) return res.status(422).json({statusCode:422, message:'Invalid request, field\'s missing'})
        if((await newUser.getUserAddresses({where:{AddressType, AddressLine1, AddressLine2, ZipCode, City, State, Country}})).length>0) throw {statusCode:422,message:`Address already existing`}    
        await newUser.createUserAddress({AddressType, AddressLine1, AddressLine2, ZipCode, City, State, Country})
        res.locals.message='SignUp successful'
        res.locals.isSuccess=true    
        // await publishEventtoServiceBus("userqueue","test",{message:'SignUp sucessful'})
        return res.redirect('/shop/users/signIn')
    }
    catch(err)
    {
        res.locals.message=err.message
        res.locals.isSuccess=false    
        return res.render('users/singUp.ejs',{activePage:'signUp',isLoggedIn:req.session?req.session.isLoggedIn:false,message:err.message,isSuccess:false})        
    }
}
export const SignOutPost = async(req,res,next)=>
{
    await req.session.destroy()
    res.locals.message='signOut successful'
    res.locals.isSuccess=true
    return res.redirect('/shop')
}