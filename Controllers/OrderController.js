import {Op} from 'sequelize'
import Product from "../Models/Product.js"
import User from "../Models/User.js"
import Seller from '../Models/Seller.js'
import UserAddress from '../Models/UserAddress.js'
import OrderAddress from '../Models/OrderAddress.js'
import Warehouse from '../Models/Warehouse.js'

export const GetOrdersById = async(req,res,next)=>
{
    try
    {
        const {id:orderId} = req.params
        const user = await User.findByPk(req.session.userId)
        if(!user) throw new Error(`User must be authenticated to continue`)
        if(!orderId) throw new Error(`invalid request, orderId is missing`)
        if(!user.hasOrder(orderId)) throw new Error(`${orderId} doesn't exists`)
        let orders = await user.getOrders({where:{Id:orderId},include:[{
            model:Product
        }]})
        if(orders.length>0)    
            orders = orders.map(order=>
            ({
                OrderId:order.Id,
                UserId:order.UserId,
                OrderStatus:order.Status,
                TotalCost:order.TotalCost,
                createdAt:order.createdAt,
                updatedAt:order.updatedAt,
                Products:order.Products.map(product=>({
                    WarehouseId: product.OrderProducts.WarehouseId,
                    Id: product.Id,
                    Name: product.Name,
                    Description: product.Description,
                    Cost: product.Cost,
                    ImageUrl: product.ImageUrl,
                    Category: product.Category,
                    SubCategory: product.SubCategory,
                    ManufacturedOn: product.ManufacturedOn,
                    ManufacturedBy: product.ManufacturedBy,
                    OrderedQuantity: product.OrderProducts.Quantity,
                }))
            }))
        return res.status(200).json({statusCode:'200',message:`Order: ${orderId} fetched successfully`,records:orders}) 
    }
    catch(err)
    {
        return res.status(400).json({statusCode:'400',operation:'GetOrders',message:err.message,capturedDateTime:Date.now()})
    }
}
export const GetOrdersByStatus = async(req,res,next)=>
{
    try
    {
        const {status:orderStatus} = req.query
        const user = await User.findByPk(req.session.userId)
        if(!user) throw new Error(`User must be authenticated to continue`)
        let orders
        if(orderStatus==='pending')
            orders = await user.getOrders({where:{status:orderStatus},include:'Products'})
        else if(orderStatus==='placed')
            orders = await user.getOrders({where:{status:orderStatus},include:'Products'})
        else if(orderStatus==='cancelled')
            orders = await user.getOrders({where:{status:orderStatus},include:'Products'})
        else 
            orders = await user.getOrders({include:'Products'})
        if(orders.length>0)
            orders = orders.map(order=>
            ({
                OrderId:order.Id,
                UserId:order.UserId,
                OrderStatus:order.Status,
                TotalCost:order.TotalCost,
                createdAt:order.createdAt,
                updatedAt:order.updatedAt,
                Products:order.Products.map(product=>({
                    WarehouseId: product.OrderProducts.WarehouseId,
                    Id: product.Id,
                    Name: product.Name,
                    Description: product.Description,
                    Cost: product.Cost,
                    ImageUrl: product.ImageUrl,
                    Category: product.Category,
                    SubCategory: product.SubCategory,
                    ManufacturedOn: product.ManufacturedOn,
                    ManufacturedBy: product.ManufacturedBy,
                    OrderedQuantity: product.OrderProducts.Quantity,
                }))
            }))
        return res.status(200).json({statusCode:'200',message:`${orders.length} ${(orderStatus==='pending'||orderStatus==='placed'||orderStatus==='cancelled')?orderStatus+' ':''}orders found`,records:orders}) 
    }
    catch(err)
    {
        return res.status(400).json({statusCode:'400',operation:'GetOrders',message:err.message,capturedDateTime:Date.now()})
    }
}
export const CreateOrder = async(req,res,next)=>
{
    try
    {
        const user = await User.findByPk(req.session.userId)
        if(!user) throw new Error(`User must be authenticated to continue`)
        // const pendingOrders = await user.getOrders({where:{Status:'pending'}})
        // if(pendingOrders.length>0) throw {statusCode:422, message:`Cannot place order with pending orders in queue`}
        let userCart = await user.getCart({
          include: [
            {
              model: Product,
              attributes: [
                "Id",
                // "Name",
                "Cost",
                // "Category",
                // "SubCategory",
                // "ManufacturedBy",
              ],
              through: { attributes: ["CartId", "Quantity", "WarehouseId"] },
              include: [
                {
                  model: Warehouse,
                  attributes: ["Id"],
                  through: { attributes: ["Quantity"] },
                },
              ],
            },
          ],
        });

        if(userCart)
        {
            // let userBasketProducts = await userCart.getProducts({
            //     attributes:["Id","Name","Cost","Category","SubCategory","ManufacturedBy"],
            //     include:
            //     [
            //         {
            //             model:Seller,
            //             attributes:["Id","Name"],
            //             through:{attributes:["Quantity"]}
            //         }
            //     ]
            // })
            const userBasketProducts = userCart.Products.map(product=>(
                {
                    ProductId:product.Id,
                    ProductName:product.Name,
                    ProductCost:product.Cost,
                    Category:product.Category,
                    SubCategory:product.SubCategory,
                    ManufacturedBy:product.ManufacturedBy,
                    Cart:
                    {
                        CartId:product.CartProducts.CartId,
                        PlacedQuantity:product.CartProducts.Quantity
                    },
                    Warehouse:
                    {
                        WarehouseId: product.Warehouses[0].Id,
                        AvailableQuantity: product.Warehouses[0].WarehouseProducts.Quantity
                    }
                    }))
            //check availability
            let productsAvailable = true
            userBasketProducts.forEach(async(product)=>
            {
                 if(+product.Warehouse.AvailableQuantity<+product.Cart.PlacedQuantity) productsAvailable = false
            })
            if(!productsAvailable)
                return res.status(200).json({statusCode:'400',message:`Order creation failed due to products unavailability`})
        
                //discount
                //
            const userOrder = await user.createOrder({TotalCost:userCart.TotalCost})
            // userOrder.addOrderAddresses()
            userBasketProducts.forEach(async(product)=>
                {
                    // const seller = await Seller.findByPk(product.Seller.SellerId)
                    // const productToUpdate = (await seller.getProducts({where:{Id:product.ProductId}}))[0]
                    // console.log(productToUpdate.SellerProducts.Quantity,product.Cart.PlacedQuantity)
                    // productToUpdate.SellerProducts.Quantity -= product.Cart.PlacedQuantity 
                    // console.log(productToUpdate.SellerProducts.Quantity)
                    // await productToUpdate.SellerProducts.save()
                    await userOrder.addProducts(product.ProductId,{through:{Quantity:+product.Cart.PlacedQuantity, WarehouseId: product.Warehouse.WarehouseId}})
                })
            return res.status(200).json({statusCode:'200',message:`Order: ${userOrder.Id} placed with ${userBasketProducts.length} Basket Products`,result:{orderId:userOrder.Id}})     
        }
        else
        {
            return res.status(200).json({statusCode:err.statusCode??400,message:`Order Creation Failed`})     
        }
    }
    catch(err)
    {
        res.locals.message=err.message
        res.locals.isSuccess=false        
        return res.status(400).json({statusCode:'400',operation:'CreateOrder',message:err.message,capturedDateTime:Date.now()})
    }
}
export const PlaceOrder = async(req,res,next)=>
{
    try
    {
        const {id:orderId} = req.params
        const user = await User.findByPk(req.session.userId)
        if(!user) throw new Error(`User must be authenticated to continue`)
        if(!orderId) new Error('Invalid request, OrderId is missing')
        let fetchedOrder = (await user.getOrders({where:{Id:orderId}}))[0]
        if(!fetchedOrder) throw new Error(`Order:${orderId} is invalid or does not exists`)
        fetchedOrder.Status = 'placed'
        
        //send an event to hub stating order placed with orderId
        
        await fetchedOrder.save()
        const cart = user.getCart()
        await cart.destroy()
        return res.status(200).json({statusCode:'200',message:`Order:${orderId} Placed successfully`})
    }
    catch(err)
    {
        res.locals.message=err.message
        res.locals.isSuccess=false        
        return res.status(400).json({statusCode:'400',operation:'CreateOrder',message:err.message,capturedDateTime:Date.now()})
    }
}
export const SetOrderAddress = async (req, res, next)=>
{
    try
    {
        const {orderId, addressId} = req.params
        const user = await User.findByPk(req.session.userId)
        if(!user) throw new Error(`User must be authenticated to continue`)
        if(!orderId) new Error('Invalid request, OrderId is missing')
        if(!addressId) new Error('Invalid request, AddressId is missing')
        let fetchedOrder = (await user.getOrders({where:{Id:orderId}}))[0]
        if(!fetchedOrder) throw new Error(`Invalid request, Order does not exists.`)
        if(fetchedOrder.Status === 'pending')
        {
            const address = (await user.getUserAddresses({where:{Id: addressId}}))[0]
            if(!address) throw new Error(`Invalid request, Invalid Address details.`)
            const {AddressLine1, AddressLine2, ZipCode, City, State, Country} = address
            await fetchedOrder.createOrderAddress({AddressLine1, AddressLine2, ZipCode, City, State, Country})
        }
        return res.status(200).json({statusCode:'200',message:`Order:${orderId} address set successfully`})
    }
    catch(err)
    {
        res.locals.message=err.message
        res.locals.isSuccess=false        
        return res.status(400).json({statusCode:'400',operation:'CreateOrder',message:err.message,capturedDateTime:Date.now()})
    }
}
export const DeleteOrder = async(req,res,next)=>
{
    try
    {
        const {id:orderId} = req.params
        const user = await User.findByPk(req.session.userId)
        if(!user) throw new Error(`User must be authenticated to continue`)
        if(!orderId) throw new Error(`Invalid request, orderId is missing`)
        const userOrder = (await user.getOrders({where:{Id:orderId}}))[0]
        if(userOrder)
        {
            await userOrder.destroy()
            return res.status(200).json({statusCode:'200',message:`Order: ${orderId} deletion successful`})         
        }
        else 
            return res.status(400).json({statusCode:'400',message:`Order: ${orderId} does not exists`})     
    }   
    catch(err)
    {
        res.locals.message=err.message
        res.locals.isSuccess=false        
        return res.status(400).json({statusCode:'400',operation:'CancelOrder',message:err.message,capturedDateTime:Date.now()})
    }
}
export const CancelOrder = async(req,res,next)=>
{
    try
    {
        const {id:orderId} = req.params
        const user = await User.findByPk(req.session.userId)
        if(!user) throw new Error(`User must be authenticated to continue`)
        if(!orderId) throw new Error(`Invalid request, orderId is missing`)
        const userOrder = await user.getOrders({where:{Id:orderId}})
        if(userOrder)
        {
            userOrder[0].Status = 'cancelled'
            await userOrder[0].save()
            return res.status(200).json({statusCode:'200',message:`Order: ${orderId} cancel successful`,result:{orderId:userOrder[0].Id}})         
        }
        else 
            return res.status(400).json({statusCode:'200',message:`Order: ${orderId} does not exists`})     
    }   
    catch(err)
    {
        res.locals.message=err.message
        res.locals.isSuccess=false        
        return res.status(400).json({statusCode:'400',operation:'CancelOrder',message:err.message,capturedDateTime:Date.now()})
    }
}

//views
export const RenderOrders = async(req,res,next)=>
{
    try
    {
        const {status:orderStatus} = req.query
        const user = await User.findOne({where:{Id: req.session.userId}, include:[{model:UserAddress}]})
        if(!user) throw new Error(`User must be authenticated to continue`)
        let orders
        if(orderStatus==='pending')
            orders = await user.getOrders({where:{status:orderStatus},include:[{model: Product},{model: OrderAddress}]})
        else if(orderStatus==='placed')
            orders = await user.getOrders({where:{status:orderStatus},include:[{model: Product},{model: OrderAddress}]})
        else if(orderStatus==='cancelled')
            orders = await user.getOrders({where:{status:orderStatus},include:[{model: Product},{model: OrderAddress}]})
        else 
            orders = await user.getOrders({include:[{model: Product},{model: OrderAddress}]})
        // return res.json(orderss)
        if(orders.length>0)
            orders = orders.map(order=>
            ({
                OrderId:order.Id,
                UserId:order.UserId,
                OrderStatus:order.Status,
                TotalCost:order.TotalCost,
                createdAt:order.createdAt,
                updatedAt:order.updatedAt,
                Products:order.Products.map(product=>({
                    WarehouseId: product.OrderProducts.WarehouseId,
                    Id: product.Id,
                    Name: product.Name,
                    Description: product.Description,
                    Cost: product.Cost,
                    ImageUrl: product.ImageUrl,
                    Category: product.Category,
                    SubCategory: product.SubCategory,
                    ManufacturedOn: product.ManufacturedOn,
                    ManufacturedBy: product.ManufacturedBy,
                    OrderedQuantity: product.OrderProducts.Quantity,
                })),
                OrderAddress: order.OrderAddress
            }))
            res.locals.message=undefined
            res.locals.isSuccess=undefined        
            res.locals.user = user
        return res.render('orders/index.ejs',{Orders:orders, activePage:'orders',isLoggedIn:req.session?req.session.isLoggedIn:false,IsSeller:req.session.IsSeller??false,UserName:req.session.UserName,Password:req.session.Password})        
    }
    catch(err)
    {
        res.locals.message=err.message
        res.locals.isSuccess=false        
        return res.render('orders/index.ejs',{Orders:[], activePage:'orders',isLoggedIn:req.session?req.session.isLoggedIn:false,IsSeller:req.session.IsSeller??false,UserName:req.session.UserName,Password:req.session.Password})        
    }
}
export const RenderCreateOrder = async(req,res,next)=>
{
    try
    {
        const user = await User.findByPk(req.session.userId)
        if(!user) throw new Error(`User must be authenticated to continue`)
        // const pendingOrders = await user.getOrders({where:{Status:'pending'}})
        // if(pendingOrders.length>0) throw {statusCode:422, message:`Cannot place order with pending orders in queue`}
        let userCart = await user.getCart({
            include: [
              {
                model: Product,
                attributes: [
                  "Id",
                  "Cost",
                ],
                through: { attributes: ["CartId", "Quantity", "WarehouseId"] },
                include: [
                  {
                    model: Warehouse,
                    attributes: ["Id"],
                    through: { attributes: ["Quantity"] },
                  },
                ],
              },
            ],
          });
  
  
        if(userCart)
        {
            const userBasketProducts = userCart.Products.map(product=>(
                {
                    ProductId:product.Id,
                    ProductName:product.Name,
                    ProductCost:product.Cost,
                    Category:product.Category,
                    SubCategory:product.SubCategory,
                    ManufacturedBy:product.ManufacturedBy,
                    Cart:
                    {
                        CartId:product.CartProducts.CartId,
                        PlacedQuantity:product.CartProducts.Quantity
                    },
                    Warehouse:
                    {
                        WarehouseId: product.Warehouses[0].Id,
                        AvailableQuantity: product.Warehouses[0].WarehouseProducts.Quantity
                    }
                    }))
            //check availability
            let productsAvailable = true
            userBasketProducts.forEach(async(product)=>
            {
                 if(+product.Warehouse.AvailableQuantity<+product.Cart.PlacedQuantity) productsAvailable = false
            })
            if(!productsAvailable)
                return res.status(200).json({statusCode:'400',message:`Order creation failed due to products unavailability`})
        
                //discount
                //
            const userOrder = await user.createOrder({TotalCost:userCart.TotalCost})

            const finsihPromise = userBasketProducts.map(async(product)=>
                {
                    // const seller = await Seller.findByPk(product.Seller.SellerId)
                    // const productToUpdate = (await seller.getProducts({where:{Id:product.ProductId}}))[0]
                    // console.log(productToUpdate.SellerProducts.Quantity,product.Cart.PlacedQuantity)
                    // productToUpdate.SellerProducts.Quantity -= product.Cart.PlacedQuantity 
                    // console.log(productToUpdate.SellerProducts.Quantity)
                    // await productToUpdate.SellerProducts.save()
                    await userOrder.addProduct(product.ProductId,{through:{Quantity:+product.Cart.PlacedQuantity, WarehouseId: product.Warehouse.WarehouseId}})
                })
            await Promise.all(finsihPromise)
            await userCart.destroy()
            res.locals.message='Order created successfully'
            res.locals.isSuccess=true        
            return res.redirect('/shop/orders')
            // return res.status(200).json({statusCode:'200',message:`Order: ${userOrder.Id} placed with ${userBasketProducts.length} Basket Products`,result:{orderId:userOrder.Id}})     
        }
        else
        {
            throw {statusCode:'400',message:`Order Creation Failed`}
        }
    }
    catch(err)
    {
        res.locals.message=err.message
        res.locals.isSuccess=false        
        return res.redirect('/shop/cart')
    }
}