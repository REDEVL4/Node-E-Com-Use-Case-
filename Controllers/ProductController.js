import Product from "../Models/Product.js";
import Seller from "../Models/Seller.js";
import User from "../Models/User.js";
import UserAddress from "../Models/UserAddress.js";
import Warehouse from "../Models/Warehouse.js";
import { Op } from "sequelize";
export const GetAllProducts = async(req,res,next)=>
{
    try
    {
        const {Zipcode,City,State,Country,sellerName,SellerId,ProductName,Category,SubCategory,MinCost,MaxCost} = req.query
        let addressfilter = {}
        let sellerfilter = {}
        let sellerIdfilter={}
        let productFilters = {}
        if(Zipcode) addressfilter = {...addressfilter,Zipcode:Zipcode} 
        if(City) addressfilter = {...addressfilter,City:City} 
        if(State) addressfilter = {...addressfilter,State:State} 
        if(Country) addressfilter = {...addressfilter,Country:Country} 
        if(sellerName) sellerfilter = {...sellerfilter,FirstName:sellerName}
        if(SellerId) sellerIdfilter = {...sellerIdfilter,Id:SellerId}
        if(ProductName) productFilters = {...productFilters,Name:{[Op.regexp]:`.*${ProductName}.*`}}
        if(Category) productFilters = {...productFilters,Category:Category}
        if(SubCategory) productFilters = {...productFilters,SubCategory:SubCategory}
        if(MinCost && MaxCost) productFilters = {...productFilters,Cost:{[Op.between]:[MinCost,MaxCost]}}
        else if (MinCost) productFilters = {...productFilters,Cost:{[Op.gt]:MinCost}}
        else if (MaxCost) productFilters = {...productFilters,Cost:{[Op.lt]:MaxCost}}
        //change
        let productsResult = await Product.findAll({
            where:productFilters,
            include:[
            {
                model:Seller,
                where:sellerIdfilter,
                through:{attributes:["Quantity"]},
                include:
                [
                    {
                        model:User,
                        where:{IsSeller:true, ...sellerfilter},
                        include:[
                            {
                                model:UserAddress,
                                attributes:["AddressType","AddressLine1","AddressLine2","ZipCode","City","State","Country"],
                                where:{...addressfilter}
                            }
                        ]
                    }
                ],
            },
        ]})
        const productsdataWithSellerInfo = productsResult.map(product=>(            {
            Id: product.Id,
            Name: product.Name,
            Description: product.Description,
            Cost: product.Cost,
            ImageUrl: product.ImageUrl,
            Category: product.Category,
            SubCategory: product.SubCategory,
            ManufacturedOn: product.ManufacturedOn,
            ManufacturedBy: product.ManufacturedBy,
            AvailabileQuantity: product.Sellers[0].SellerProducts.Quantity,
            SellerInfo:{
                SellerId: product.Sellers[0].Id,
                UserId: product.Sellers[0].User.Id,
                SellerName: product.Sellers[0].User.PreferredName,
                SellerEmail: product.Sellers[0].User.Email,
                SellerAddress:
                {
                    AddressLine1: product.Sellers[0].User.UserAddresses[0].AddressLine1,
                    AddressLine2: product.Sellers[0].User.UserAddresses[0].AddressLine2,
                    ZipCode: product.Sellers[0].User.UserAddresses[0].ZipCode,
                    City: product.Sellers[0].User.UserAddresses[0].City,
                    State: product.Sellers[0].User.UserAddresses[0].State,
                    Country: product.Sellers[0].User.UserAddresses[0].Country
                }
            }
            })) 
        let message
        let plength = productsdataWithSellerInfo.length
        if(plength >1) message = `Only ${plength} products exists with the defined search creteria`
        if(plength ===1) message = `Only 1 product exists with the defined search creteria`
        else if(plength===0) message = `No products exists with the defined search creteria`
        //for apis
        return res.json({statusCode:200, message:message,result:productsdataWithSellerInfo})

        //for website
        // return res.render('shop/index.ejs',{products:productsdataWithSellerInfo, activePage:'home'})        
    }
    catch(err)
    {
        //for apis
        // return res.status(400).json({statusCode:'400',operation:'GetAllProducts',message:err.message,capturedDateTime:Date.now()})

        //for website
        return res.render('shop/index.ejs',{products:[], activePage:'home'})        
    }
}
export const GetAllSellerProducts = async(req,res,next)=>
{
    try
    {
        const user = await User.findByPk(req.session.userId)
        if(!user) throw new Error(`User must be authenticated to continue`)
        const seller = await user.getSeller()
        if(!seller) throw new Error(`Please login as a seller to continue`)
        if(!user.IsSeller || !seller) throw new Error(`Only sellers are allowed to view their products, please considering registering as a seller to add your products to shop`)
        const products = await seller.getProducts({});
        const outputProducts = (products.length==0)?[]:products.map((c)=>({
            Id: c.Id,
            Name: c.Name,
            Description: c.Description,
            Cost: c.Cost,
            ImageUrl: c.ImageUrl,
            Category: c.Category,
            SubCategory: c.SubCategory,
            ManufacturedOn: c.ManufacturedOn,
            ManufacturedBy: c.ManufacturedBy,
            AvailabileQuantity: c.SellerProducts.Quantity,
        }))
        return res.status(200).json({statusCode:'200',message:`${outputProducts.length} products fetched successfully`,records:outputProducts})
    }
    catch(err)
    {
        return res.status(400).json({statusCode:'400',operation:'GetAllProducts',message:err.message,capturedDateTime:Date.now()})
    }
}
export const GetProductById = async(req,res,next)=>
{
    try
    {
        const {id:productId} = req.params
        if(!productId) throw {statusCode:400,message:'Invalid Request, productId is missing'}
        
        let productsResult = await Product.findAll({
            where:{Id:productId},
            include:[
            {
                model:Seller,
                through:{attributes:["Quantity"]},
                include:
                [
                    {
                        model:User,
                        include:[
                            {
                                model:UserAddress,
                                attributes:["AddressType","AddressLine1","AddressLine2","ZipCode","City","State","Country"],
                                where:{AddressType:'seller'}
                            }
                        ]
                    }
                ],
            },
        ]})
        // return res.json(productsResult)
        const productsdataWithSellerInfo = productsResult.map(product=>(            {
            Id: product.Id,
            Name: product.Name,
            Description: product.Description,
            Cost: product.Cost,
            ImageUrl: product.ImageUrl,
            Category: product.Category,
            SubCategory: product.SubCategory,
            ManufacturedOn: product.ManufacturedOn,
            ManufacturedBy: product.ManufacturedBy,
            AvailabileQuantity: product.Sellers[0].SellerProducts.Quantity,
            SellerInfo:{
                SellerId: product.Sellers[0].Id,
                UserId: product.Sellers[0].User.Id,
                SellerName: product.Sellers[0].User.PreferredName,
                SellerEmail: product.Sellers[0].User.Email,
                SellerAddress:
                {
                    AddressLine1: product.Sellers[0].User.UserAddresses[0].AddressLine1,
                    AddressLine2: product.Sellers[0].User.UserAddresses[0].AddressLine2,
                    ZipCode: product.Sellers[0].User.UserAddresses[0].ZipCode,
                    City: product.Sellers[0].User.UserAddresses[0].City,
                    State: product.Sellers[0].User.UserAddresses[0].State,
                    Country: product.Sellers[0].User.UserAddresses[0].Country
                }
            }
            })) 
        return res.json({statusCode:200, message:`Product:${productId} fetched successfully`,result:productsdataWithSellerInfo})
    }
    catch(err)
    {
        return res.status(err.statusCode??'400').json({statusCode:err.statusCode??'400',operation:'GetProductById',message:err.message,capturedDateTime:new Date(Date.now())})        
    }
}
// export const CreateProduct = async(req,res,next)=>
// {
//     try
//     {
//         let product = null;
//         const productDetails = {...req.body}
//         if(!productDetails.Quantity) productDetails.Quantity = 1
//         if(!productDetails) throw new Error('Invalid request, request body missing')
//         const warehouse = await Warehouse.findOne({where:{City:productDetails.City,State:productDetails.State,Location:productDetails.Location,City:productDetails.City,Country:productDetails.Country}})
//         console.log(warehouse)
//         product = (await warehouse.getProducts({where:{Name:productDetails.Name,Seller:productDetails.Seller}}))[0]
//         if(product)
//         {
//             product.WarehouseProducts.Quantity += +productDetails.Quantity
//             await product.WarehouseProducts.save()
//         } 
//         else
//             product = await warehouse.createProduct(productDetails,{through:{Quantity:productDetails.Quantity}})
//         return res.status(200).json({statusCode:'204',message:`Product: ${product.Id} created/Added successfully`,result:product})       
//     }
//     catch(err)
//     {
//         return res.status(400).json({statusCode:'400',operation:'CreateProduct',message:err.message,capturedDateTime:Date.now()})                
//     }
// }
// export const CreateBulkProducts = async(req,res,next)=>
// {
//     try
//     {
//         const seller = await req.session.user.getSeller()
//         if(!req.session.user.IsSeller || !seller) throw new Error(`Only sellers are allowed to create products, please considering as a seller`)
//         const productsToCreate = [...req.body]
//         if(productsToCreate.length>0)
//         {
//             const uniqueSet = new Set()
//             productsToCreate.forEach(product=>
//                 {
//                     const {City, Location ,State, Country, Zipcode} = product
//                     const combination = {City, Location, State, Country, Zipcode}//`${City}!${Location}!${State}!${Country}!${Zipcode}`
//                     if(!uniqueSet.has(combination)) uniqueSet.add(JSON.stringify(combination))     
//                 })
//             uniqueSet
//             .forEach(async(productDetails)=>
//                 {
//                     productDetails = JSON.parse(productDetails)
//                     const warehouse = await Warehouse.findOne({where:{State:productDetails.State, Country: productDetails.Country, Zipcode: productDetails.Zipcode}})
//                     const products = productsToCreate.filter(c=> c.Location==productDetails.Location && c.City==productDetails.City && c.State==productDetails.State && c.Zipcode==productDetails.Zipcode && c.Country==productDetails.Country)
//                     products.forEach(async(product)=>
//                     {
//                         try
//                         {
//                             const Quantity = (product.Quantity)?product.Quantity:1
//                             const fetchedProduct = (await warehouse.getProducts({where:{Name:product.Name}}))[0]
//                             console.log('fetched product',fetchedProduct?'yes':'no')
//                             if(fetchedProduct)
//                             {
//                                 fetchedProduct.WarehouseProducts.Quantity += +Quantity
//                                 await fetchedProduct.WarehouseProducts.save()
//                             }
//                             else
//                             {
//                                 await warehouse.createProduct(product,{through:{Quantity:+Quantity}})
//                             }    
//                         }
//                         catch(err)
//                         {
//                             console.log('Error',err.message)
//                         }
//                     })
//                 })
//             const uniqueProductDetails = productsToCreate.map(c=>c.Zipcode)
//             // const createdProducts = await Product.bulkCreate(productsToCreate) 
//             return res.status(200).json({statusCode:200,message:`${productsToCreate.length} products created/Added successfully`})                
//         }
//     }
//     catch(err)
//     {
//         return res.status(err.statusCode?err.statusCode:400).json({statusCode:err.statusCode,message:err.message})
//     }
// }
export const CreateBulkProducts =async(req,res,next)=>
{
    try
    {
        const userId = req.session.userId
        const user = await User.findByPk(userId)
        if(!user) throw new Error(`User must be authenticated to continue`)
        const seller = await user.getSeller()
        if(!seller) throw new Error(`Please login as a seller to continue`)
        if(!user.IsSeller || !seller) throw new Error(`Only sellers are allowed to create products, please considering as a seller`)
        const productsToCreate = [...req.body]
        if(productsToCreate.length>0)
        {
            productsToCreate.forEach(async (product)=>
            {
                try
                {
                    let Quantity = (product.Quantity)?product.Quantity:1
                    const existingProduct = (await seller.getProducts({where:{Name:product.Name}}))[0]
                    if(existingProduct)
                    {
                        Quantity += existingProduct.SellerProducts.Quantity
                        existingProduct.SellerProducts.Quantity = Quantity
                        await existingProduct.SellerProducts.save()
                    }
                    else
                    {
                        console.log(product)
                        await seller.createProduct({...product},{through:{Quantity:Quantity}})
                    }
                }
                catch(err)
                {
                    console.log(`Unable to add the product:${product.Id}, Error:${err.message}`)
                }
            })
            return res.status(200).json({statusCode:200,message:`${productsToCreate.length} products created/Added successfully`})                
        }
    }
    catch(err)
    {
        console.log(err.message)
        return res.status(err.statusCode?err.statusCode:400).json({statusCode:err.statusCode,message:err.message})
    }
}

export const UpdateProduct = async(req,res,next)=>
{
    try
    {
        const user = await User.findByPk(req.session.userId)
        if(!user) throw new Error(`User must be authenticated to continue`)
        const {id:productId} = req.params
        const productDetails = {...req.body}
        const seller = await user.getSeller()
        if(!seller) throw new Error(`Please login as a seller to continue`)
        if(!productId || !productDetails) throw {statusCode:400,message:'Invalid Request, productId or Request Body is missing '}
        let product = (await seller.getProducts({where:{Id:productId}}))[0]
        if(!product) throw {statusCode:404,message:`product with ${productId} does not exists`}
        product = await product.update(productDetails)
        res.locals.message=`Product: ${product.Id} updated successfully`
        res.locals.isSuccess=true        
        return res.status(200).json({statusCode:'200',message:`Product: ${product.Id} updated successfully`})              
    }
    catch(err)
    {
        res.locals.message=err.message
        res.locals.isSuccess=false        
        return res.status(400).json({statusCode:'400',operation:'UpdateProduct',message:err.message,capturedDateTime:Date.now()})                   
    }
}
export const DeleteProductById = async(req,res,next)=>
{
    try
    {
        const user = await User.findByPk(req.session.userId)
        if(!user) throw new Error(`User must be authenticated to continue`)
        const {id:productId} = req.params
        const seller = await user.getSeller()
        if(!seller) throw new Error(`Please login as a seller to continue`)
        if(!productId) throw {statusCode:400,message:'Invalid Request, productId or Request Body is missing '}
        await seller.removeProduct(productId)
        res.locals.message=`Product: ${productId} deleted successfully`
        res.locals.isSuccess=true        
        return res.status(200).json({statusCode:'200',message:`Product: ${productId} deleted successfully`})              
    }
    catch(err)
    {
        res.locals.message=err.message
        res.locals.isSuccess=false        
        return res.status(400).json({statusCode:'400',operation:'DeleteProductById',message:err.message,capturedDateTime:Date.now()})                           
    }
}
//functions
function formatDateToYYYYMMDD(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is zero-based
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }
//view
export const RenderAllShopProducts = async(req,res,next)=>
{
    try
    {
        const {Zipcode,City,State,Country,sellerName,SellerId,ProductName,Category,SubCategory,MinCost,MaxCost} = req.query
        let addressfilter = {}
        let sellerfilter = {}
        let sellerIdfilter={}
        let productFilters = {}
        if(Zipcode) addressfilter = {...addressfilter,Zipcode:Zipcode} 
        if(City) addressfilter = {...addressfilter,City:City} 
        if(State) addressfilter = {...addressfilter,State:State} 
        if(Country) addressfilter = {...addressfilter,Country:Country} 
        if(sellerName) sellerfilter = {...sellerfilter,FirstName:sellerName}
        if(SellerId) sellerIdfilter = {...sellerIdfilter,Id:SellerId}
        if(ProductName) productFilters = {...productFilters,Name:{[Op.regexp]:`.*${ProductName}.*`}}
        if(Category) productFilters = {...productFilters,Category:Category}
        if(SubCategory) productFilters = {...productFilters,SubCategory:SubCategory}
        if(MinCost && MaxCost) productFilters = {...productFilters,Cost:{[Op.between]:[MinCost,MaxCost]}}
        else if (MinCost) productFilters = {...productFilters,Cost:{[Op.gt]:MinCost}}
        else if (MaxCost) productFilters = {...productFilters,Cost:{[Op.lt]:MaxCost}}
        //change
        let productsResult = await Product.findAll({
            where:productFilters,
            include:[
            {
                model:Seller,
                where:sellerIdfilter,
                // through:{attributes:["Quantity"], where:{Quantity:{[Op.gt]:0}}},
                include:
                [
                    {
                        model:User,
                        where:{IsSeller:true, ...sellerfilter},
                        include:[
                            {
                                model:UserAddress,
                                attributes:["AddressType","AddressLine1","AddressLine2","ZipCode","City","State","Country"],
                                where:{...addressfilter}
                            }
                        ]
                    }
                ],
            },
        ]})
        const productsdataWithSellerInfo = productsResult.map(product=>(            {
            Id: product.Id,
            Name: product.Name,
            Description: product.Description,
            Cost: product.Cost,
            ImageUrl: product.ImageUrl,
            Category: product.Category,
            SubCategory: product.SubCategory,
            ManufacturedOn: product.ManufacturedOn,
            ManufacturedBy: product.ManufacturedBy,
            AvailabileQuantity: product.Sellers[0].SellerProducts.Quantity,
            SellerInfo:{
                SellerId: product.Sellers[0].Id,
                UserId: product.Sellers[0].User.Id,
                SellerName: product.Sellers[0].User.PreferredName,
                SellerEmail: product.Sellers[0].User.Email,
                SellerAddress:
                {
                    AddressLine1: product.Sellers[0].User.UserAddresses[0].AddressLine1,
                    AddressLine2: product.Sellers[0].User.UserAddresses[0].AddressLine2,
                    ZipCode: product.Sellers[0].User.UserAddresses[0].ZipCode,
                    City: product.Sellers[0].User.UserAddresses[0].City,
                    State: product.Sellers[0].User.UserAddresses[0].State,
                    Country: product.Sellers[0].User.UserAddresses[0].Country
                }
            }
            })) 
        let message
        let plength = productsdataWithSellerInfo.length
        if(plength >1) message = `Only ${plength} products exists with the defined search creteria`
        if(plength ===1) message = `Only 1 product exists with the defined search creteria`
        else if(plength===0) message = `No products exists with the defined search creteria`
        return res.render('shop/index.ejs',{products:productsdataWithSellerInfo, activePage:'home',UserName:req.session.UserName,Password:req.session.Password,isLoggedIn:req.session?req.session.isLoggedIn:false,IsSeller:req.session.IsSeller??false,message:undefined,isSuccess:false})        
    }
    catch(err)
    {
        //for apis
        // return res.status(400).json({statusCode:'400',operation:'GetAllProducts',message:err.message,capturedDateTime:Date.now()})

        //for website
        res.locals.message=err.message
        res.locals.isSuccess=false        
        return res.render('shop/index.ejs',{products:[], activePage:'home',isLoggedIn:req.session?req.session.isLoggedIn:false,UserName:req.session.UserName,Password:req.session.Password,IsSeller:req.session.IsSeller??false,message:err.message,isSuccess:false})        
    }
}

export const RenderAllSellerProducts = async(req,res,next)=>
{
    try
    {
        const user = await User.findByPk(req.session.userId)
        if(!user) throw new Error(`User must be authenticated to continue`)
        const seller = await user.getSeller()
        if(!seller) throw new Error(`Please login as a seller to continue`)
        if(!user.IsSeller || !seller) throw new Error(`Only sellers are allowed to view their products, please considering registering as a seller to add your products to shop`)
        const products = await seller.getProducts({});
        const outputProducts = (products.length==0)?[]:products.map((c)=>({
            Id: c.Id,
            Name: c.Name,
            Description: c.Description,
            Cost: c.Cost,
            ImageUrl: c.ImageUrl,
            Category: c.Category,
            SubCategory: c.SubCategory,
            ManufacturedOn: c.ManufacturedOn,
            ManufacturedBy: c.ManufacturedBy,
            AvailabileQuantity: c.SellerProducts.Quantity,
        }))
        res.locals.message=undefined
        res.locals.isSuccess=undefined
        return res.render('admin/index.ejs',{products:outputProducts, activePage:'admin',UserName:req.session.UserName,Password:req.session.Password,isLoggedIn:req.session?req.session.isLoggedIn:false,IsSeller:req.session.IsSeller??false})        
    }
    catch(err)
    {
        res.locals.message=err.message
        res.locals.isSuccess=false        
        return res.render('admin/index.ejs',{products:[], activePage:'admin',isLoggedIn:req.session?req.session.isLoggedIn:false,UserName:req.session.UserName,Password:req.session.Password,IsSeller:req.session.IsSeller??false,message:err.message,isSuccess:false})        
    }
}

export const RenderSellerProductsEditPage = async(req,res,next)=>
{
    try
    {
        const {id:productId} = req.params
        const user = await User.findByPk(req.session.userId)
        if(!user) throw new Error(`User must be authenticated to continue`)
        const seller = await user.getSeller()
        if(!seller) throw new Error(`Please login as a seller to continue`)
        if(!user.IsSeller || !seller) throw new Error(`Only sellers are allowed to view their products, please considering registering as a seller to add your products to shop`)
        const products = await seller.getProducts({where:{Id:productId}});
        if(products.length==0) throw {statusCode:422, message:`Product:${productId} not found!`}
        const outputProducts = (products.length==0)?[]:products.map((c)=>({
            Id: c.Id,
            Name: c.Name,
            Description: c.Description,
            Cost: c.Cost,
            ImageUrl: c.ImageUrl,
            Category: c.Category,
            SubCategory: c.SubCategory,
            ManufacturedOn: formatDateToYYYYMMDD(c.ManufacturedOn),
            ManufacturedBy: c.ManufacturedBy,
            AvailabileQuantity: c.SellerProducts.Quantity,
        }))
        res.locals.message=undefined
        res.locals.isSuccess=undefined        
        return res.render('admin/edit.ejs',{product:outputProducts[0], activePage:'sellerEdit',UserName:req.session.UserName,Password:req.session.Password,isLoggedIn:req.session?req.session.isLoggedIn:false,IsSeller:req.session.IsSeller??false})        
    }
    catch(err)
    {
        res.locals.message=err.message
        res.locals.isSuccess=false        
        return res.render('admin/index.ejs',{products:[], activePage:'sellerEdit',isLoggedIn:req.session?req.session.isLoggedIn:false,UserName:req.session.UserName,Password:req.session.Password,IsSeller:req.session.IsSeller??false})        
    }
}
export const RenderSellerProductsUpdate = async(req,res,next)=>
{
    try
    {
        const {id: productId} = req.params
        const {name:Name,description:Description,cost:Cost,imageUrl:ImageUrl,seller:Seller,category:Category,subCategory:SubCategory,manufacturedOn:ManufacturedOn,manufacturedBy:ManufacturedBy,availableQuantity:Quantity}=req.body
        const userId = req.session.userId
        const user = await User.findByPk(userId)
        if(!user) throw new Error(`User must be authenticated to continue`)
        const seller = await user.getSeller()
        if(!seller) throw new Error(`Please login as a seller to continue`)
        if(!user.IsSeller || !seller) throw new Error(`Only sellers are allowed to create products, please considering as a seller`)
        const existingProduct = (await seller.getProducts({where:{Id:productId}}))[0]
        if(!existingProduct) throw new Error(`Invalid Update Request, Product does not exists`)
        
        //product update
        existingProduct.Name = Name
        existingProduct.Description = Description
        existingProduct.Cost = Cost
        existingProduct.ImageUrl = ImageUrl
        existingProduct.Category = Category
        existingProduct.SubCategory = SubCategory
        existingProduct.SubCategory = SubCategory
        existingProduct.ManufacturedOn = ManufacturedOn
        existingProduct.ManufacturedBy = ManufacturedBy
        existingProduct.SellerProducts.Quantity = Quantity
        await existingProduct.SellerProducts.save()
        console.log(`product:${productId} updated successfully`)
        res.locals.message=undefined
        res.locals.isSuccess=undefined        
        return res.redirect('/admin')                

    }
    catch(err)
    {
        res.locals.message=err.message
        res.locals.isSuccess=false        
        return res.redirect('/admin')                
    }
}