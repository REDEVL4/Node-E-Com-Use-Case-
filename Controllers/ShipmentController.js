import User from "../Models/User.js"
export const getAllShipmentsForUser = async(req,res,next)=>
{
    try
    {
        const user = await User.findByPk(req.session.userId)
        if(!user) throw new Error(`User must be authenticated to continue`)
        const shipmentDetails = await user.getShipments({})
        return res.status(200).json({statusCode:200, message:'shipment details fetched',result:shipmentDetails})
    }
    catch(err)
    {
        return res.status(400).json({statusCode:400,message:`Error:${err.message}`,Error:err})
    }
}
export const getShippingDetails = async(req,res,next)=>
{
    try
    {
        const {id:shipmentId} = req.params
        const user = req.user
        if(!shipmentId) throw new Error(`Invalid Request, shipmentId is required`) 
        const shipment = (await user.getShipments({where:{Id:shipmentId}}))[0]
        if(!shipment) throw new Error(`Shipment: ${shipmentId} does not exists`)
        const order = (await user.getOrders({where:{Id:shipment.OrderId},include:["Products"]}))[0]
        const result = 
        {
            Id:shipment.Id,
            Status:shipment.Status,
            CreatedAt:shipment.CreatedAt,
            UpdatedAt:shipment.UpdatedAt,
            Order:order,
            userDetails:await User.findOne({where:{Id:req.user.Id},include:["UserAddresses"]})
        }
        res.status(200).json({statusCode:200, message:`Shipment: ${shipmentId} fetched successfully`,result:result})
    }
    catch(err)
    {
        return res.status(400).json({statusCode:400,message:`Error: ${err.message}`,error:err})
    }
}
export const createShipmentOrder = async(req,res,next)=>
{
    try
    {
        const {id:orderId} = req.params
        const user = req.user
        const orderTobeShipped = (await user.getOrders({where:{Id:orderId}}))[0]
        if(!orderTobeShipped) throw new Error(`invalid order:${orderId}, does not exists`)
        const createdShipment = await orderTobeShipped.createShipment({Status:"initiated",UserId:user.Id})
        return res.status(200).json({statusCode:200,message:`Shipment:${createdShipment.Id} created successfully`,result:createdShipment})
    }
    catch(err)
    {
        return res.status(400).json({statusCode:400,message:`Error: ${err.message}`,error:err})
    }
}
export const updateShipmentStatus = async(req,res,next)=>
{
    try
    {
        const {status} = req.query
        const {id:shipmentId} = req.params
        if(!status || !shipmentId) throw new Error(`invalid request, missing status or shippingId`)
        const shipment = (await req.user.getShipments({where:{Id:shipmentId}}))[0]
        if(!shipment) throw new Error(`Shipment: ${shipmentId} does not exists`)
        shipment.Status = status
        await shipment.save()
        return res.status(200).json({statusCode:200,message:`Shipping: ${shipmentId} status changed to ${status} successfully`})
    }
    catch(err)
    {
        return res.status(400).json({statusCode:400,message:`Error: ${err.message}`,error:err})
    }
}
export const deleteShipmentDetails = async(req,res,next)=>
{
    try
    {
        const {id:shipmentId} = req.params
        if(!shipmentId) throw new Error(`invalid request, missing status or shippingId`)
        const shipment = (await req.user.getShipments({where:{Id:shipmentId}}))[0]
        if(shipment) await shipment.destroy()
        return res.status(200).json({statusCode:200,message:`Shipping: ${shipmentId} details deleted successfully`})
    }
    catch(err)
    {
        return res.status(400).json({statusCode:400,message:`Error: ${err.message}`,error:err})
    }
}