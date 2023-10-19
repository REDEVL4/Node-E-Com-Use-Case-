import Cart from "../Models/Cart.js";
import User from "../Models/User.js";
import Product from "../Models/Product.js";
import { Op } from "sequelize";
import Seller from "../Models/Seller.js";
export const GetCart = async(req,res,next)=>
{
    try
    {
        const user = await User.findByPk(req.session.userId)
        if(!user) throw new Error(`User must be authenticated to continue`)
        let userCart = await user.getCart({include:'Products'})
        if(userCart)
            userCart = {
            Id:userCart.Id,
            UserId:userCart.UserId,
            TotalCost:userCart.TotalCost,
            CreatedAt:userCart.CreatedAt,
            UpdatedAt:userCart.UpdatedAt,
            Products:userCart.Products.map(product=>({
                WarehouseId: product.CartProducts.WarehouseId,
                Id: product.Id,
                Name: product.Name,
                Description: product.Description,
                Cost: product.Cost,
                ImageUrl: product.ImageUrl,
                Category: product.Category,
                SubCategory: product.SubCategory,
                ManufacturedOn: product.ManufacturedOn,
                ManufacturedBy: product.ManufacturedBy,
                Quantity: product.CartProducts.Quantity,
            }))
        }
        return res.status(200).json({statusCode:'200',message:`User:${user.Id} cart is fetched successfully`,records:userCart??{}})
    }
    catch(err)
    {
        return res.status(400).json({statusCode:'400',operation:'GetCart',message:err.message,capturedDateTime:Date.now()})
    }
}
export const ClearCart = async(req,res,next)=>
{
    try
    {
        const user = await User.findByPk(req.session.userId)
        if(!user) throw new Error(`User must be authenticated to continue`)
        const userCart = await user.getCart()
        if(userCart)
            await userCart.destroy()
        res.locals.message=`User:${user.Id} cart has been cleared successfully`
        res.locals.isSuccess=false            
        return res.status(200).json({statusCode:'200',message:`User:${user.Id} cart has been cleared successfully`})
    }
    catch(err)
    {
        res.locals.message=err.message
        res.locals.isSuccess=false        
        return res.status(400).json({statusCode:'400',operation:'GetCart',message:err.message,capturedDateTime:Date.now()})
    }
}
export const AddProductToCart = async(req,res,next)=>
{
    try
    {
        const {productId, warehouseId} = req.params
        const quantity = req.query.quantity?+req.query.quantity:1
        const user = await User.findByPk(req.session.userId)
        if(!user) throw new Error(`User must be authenticated to continue!`)
        if(!warehouseId) throw new Error('Invalid request, Warehouse Id is missing!')
        let userCart = await user.getCart()
        if(!userCart)
            userCart = await user.createCart()
        const hasProduct = await userCart.hasProduct(productId)
        if(hasProduct)
        {
            const existingProduct = await userCart.getProducts({where:{Id:productId}})
            console.log(existingProduct)
            const SellerProduct = await Product.findOne({where:{Id: productId},include:[{model:Seller, through:{attributes:["Quantity"]}}]})
            if(!(SellerProduct.Sellers[0].SellerProducts.Quantity >= +existingProduct[0].CartProducts.Quantity+quantity))
                throw new Error(`requested Quantity is unavailable at the moment!`)
            await userCart.addProduct(existingProduct[0],{through:{Quantity:+existingProduct[0].CartProducts.Quantity+quantity}})
            userCart.TotalCost = (parseFloat(userCart.TotalCost) + quantity * existingProduct[0].Cost).toFixed(4)
            await userCart.save()
        }
        else
        {
            const productToAdd = await Product.findByPk(productId)
            const SellerProduct = (await productToAdd.getSellers())[0]
            if(!(SellerProduct.SellerProducts.Quantity >= +quantity))
                throw new Error(`requested Quantity is unavailable at the moment!`)
            const cartProduct = await userCart.addProduct(productToAdd,{through:{Quantity:quantity,WarehouseId:warehouseId}})
            userCart.TotalCost = (parseFloat(userCart.TotalCost) + quantity * productToAdd.Cost).toFixed(4)
            await userCart.save()
        }
        res.locals.message=`${quantity} products are added to User:${user.Id} cart `
        res.locals.isSuccess=true        
        return res.status(200).json({statusCode:'200',message:`${quantity} products are added to User:${user.Id} cart `})
    }
    catch(err)
    {
        res.locals.message=err.message
        res.locals.isSuccess=false        
        return res.status(400).json({statusCode:'400',operation:'GetCart',message:err.message,capturedDateTime:Date.now()})
    }
}
export const RemoveProductFromCart = async(req,res,next)=>
{
    try
    {
        const {productId,warehouseId} = req.params 
        const quantity = req.query.quantity?+req.query.quantity:1
        const user = await User.findByPk(req.session.userId)
        if(!user) throw new Error(`User must be authenticated to continue`)
        if(!warehouseId) throw new Error('Invalid request, Warehouse Id is missing!')
        let userCart = await user.getCart()
        if(userCart)
        {
            const foundProduct = (await userCart.getProducts({where:{Id:productId}}))[0]
            if(!foundProduct) throw new Error(`Product: ${productId} does not exists`)
            if(foundProduct.CartProducts.Quantity>=quantity)
            {
                if(foundProduct.CartProducts.Quantity>quantity)
                    await userCart.addProduct(foundProduct,{through:{Quantity:foundProduct.CartProducts.Quantity-quantity}})
                else
                    await userCart.removeProduct(productId)
                userCart.TotalCost = (parseFloat(userCart.TotalCost)-foundProduct.Cost*quantity).toFixed(4)  
                await userCart.save()
            }
            else throw new Error(`Product: ${productId}  requested removal Quantity:${quantity} is greater than available quantity:${foundProduct.CartProducts.Quantity}`)
        }
        res.locals.message=`Product:${productId} is removed from User:${user.Id} cart `
        res.locals.isSuccess=true        
        return res.status(200).json({statusCode:'200',message:`Products:${productId} is removed from User:${user.Id} cart `,records:[productId]})
    }
    catch(err)
    {
        res.locals.message=err.message
        res.locals.isSuccess=false        
        return res.status(400).json({statusCode:'400',operation:'RemoveProductFromCart',message:err.message,capturedDateTime:Date.now()})
    }
}

//view
export const CheckForCartProductsAvailability = async(req,res,next)=>
{
    try
    {
        const user = await User.findByPk(req.session.userId)
        if(!user) throw new Error(`User must be authenticated to continue`)
    }
    catch(err)
    {
        res.locals.message=err.message
        res.locals.isSuccess=false        
        return res.render('cart/index.ejs',{activePage:'cart',isLoggedIn:req.session?req.session.isLoggedIn:false,IsSeller:req.session.IsSeller??false,UserName:req.session.UserName,Password:req.session.Password,cart:{Products:[]}})
    }
}
export const RenderCart = async(req,res,next)=>
{
    try
    {
        const user = await User.findByPk(req.session.userId)
        if(!user) throw new Error(`User must be authenticated to continue`)
        let userCart = await user.getCart(
                           {
                            include:'Products',
                           })
        if(userCart)
            userCart = {
            Id:userCart.Id,
            UserId:userCart.UserId,
            TotalCost:userCart.TotalCost,
            CreatedAt:userCart.CreatedAt,
            UpdatedAt:userCart.UpdatedAt,
            Products:userCart.Products.map(product=>({
                Id: product.Id,
                Name: product.Name,
                Description: product.Description,
                Cost: product.Cost,
                ImageUrl: product.ImageUrl,
                Category: product.Category,
                SubCategory: product.SubCategory,
                ManufacturedOn: product.ManufacturedOn,
                ManufacturedBy: product.ManufacturedBy,
                Quantity: product.CartProducts.Quantity,
                WarehouseId: product.CartProducts.WarehouseId,
                IsAvailableInStock: product.CartProducts.IsAvailableInStock
            }))
        }
        const IsAvailableforCheckOut = userCart?(userCart.Products.filter(c=>c.IsAvailableInStock===false).length!==0):false
        if(userCart) userCart = {...userCart,IsAvailableforCheckOut:IsAvailableforCheckOut}
        res.locals.message=undefined
        res.locals.isSuccess=undefined        
        return res.render('cart/index.ejs',{activePage:'cart',isLoggedIn:req.session?req.session.isLoggedIn:false,IsSeller:req.session.IsSeller??false,UserName:req.session.UserName,Password:req.session.Password,cart:userCart??{Products:[]}})
    }
    catch(err)
    {
        res.locals.message=err.message
        res.locals.isSuccess=false        
        return res.render('cart/index.ejs',{activePage:'cart',isLoggedIn:req.session?req.session.isLoggedIn:false,IsSeller:req.session.IsSeller??false,UserName:req.session.UserName,Password:req.session.Password,cart:{Products:[]}})
        // return res.status(400).json({statusCode:'400',operation:'GetCart',message:err.message,capturedDateTime:Date.now()})
    }
}
