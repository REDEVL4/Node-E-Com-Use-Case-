import {Op} from 'sequelize'
import Product from "../Models/Product.js"
import Seller from "../Models/Seller.js"
import Warehouse from "../Models/Warehouse.js"
import User from "../Models/User.js"

export const GetAllWarehouses = async(req, res, next)=>
{
    try
    {
        //seller check and session data access
        const userId = req.session.userId
        const user = await User.findByPk(userId)
        if(!user) throw new Error(`User must be authenticated to continue`)
        const seller = await user.getSeller()
        if(!seller) throw new Error(`Please login as a seller to continue`)
        if(!user.IsSeller || !seller) throw new Error(`Sorry, only sellers are allowed to access this functionality.`)

        const {Zipcode,City,State,Country, SellerName, SellerId, WarehouseName, ProductId, ProductName} = req.query
        let warehousefilters = {}
        let sellerFilters = {}
        let productFilters = {}

        //warehouse filter
        if(WarehouseName) warehousefilters = {...warehousefilters,Name: WarehouseName}

        //location filter
        if(Zipcode) warehousefilters = {...warehousefilters,Zipcode}
        if(City) warehousefilters = {...warehousefilters,City}
        if(State) warehousefilters = {...warehousefilters,State}
        if(Country) warehousefilters = {...warehousefilters,Country}

        //seller filter
        if(SellerName) sellerFilters = {...sellerFilters, Name: SellerName}
        if(SellerId) sellerFilters = {...sellerFilters, Id: SellerName}
        
        //product filters
        if(ProductId) productFilters = {...productFilters,Id: ProductId}
        if(ProductName) productFilters = {...productFilters,Name: ProductName}

        const warehousesList = await Warehouse.findAll({
            where:{...warehousefilters},
            include:[{
            model:Seller,
            where:{...sellerFilters},
            include:
            [
                {
                    model:Product,
                    where:{...productFilters}
                }
            ]
        }]})
        return res.status(200).json({statusCode:200, message:`${warehousesList.length} warehouses fetched`,result:warehousesList})
    }
    catch(err)
    {
        return res.status(400).json({statusCode:'400',operation:'GetAllWarehouses',message:err.message,capturedDateTime:Date.now()})
    }
}
export const GetMyAssociatedWarehouses = async(req,res,next)=>
{
    try
    {
        //seller check and session data access
        const userId = req.session.userId
        const user = await User.findByPk(userId)
        if(!user) throw new Error(`User must be authenticated to continue`)
        const seller = await user.getSeller()
        if(!seller) throw new Error(`Please login as a seller to continue`)
        if(!user.IsSeller || !seller) throw new Error(`Sorry, only sellers are allowed to access this functionality.`)
        
        const myAssociatedWarehouses = await seller.getWarehouses({
            attributes:["Id","Name","Description","Location","Zipcode","City","State","Country"]
        })
        return res.status(200).json({statusCode:200, message:`request successful`,result:{AssociatedWarehouses:myAssociatedWarehouses}})
    }
    catch(err)
    {
        return res.status(err.statusCode??400).json({statusCode:err.statusCode??400, message:err.message})
    }
}
export const GetWarehousesById = async(req, res, next)=>
{
    try
    {
        //seller check and session data access
        const userId = req.session.userId
        const user = await User.findByPk(userId)
        if(!user) throw new Error(`User must be authenticated to continue`)
        const seller = await user.getSeller()
        if(!seller) throw new Error(`Please login as a seller to continue`)
        if(!user.IsSeller || !seller) throw new Error(`Sorry, only sellers are allowed to access this functionality.`)

        const {id:warehouseId} = req.params
        if(!warehouseId) throw new Error('Invalid request, WarehouseId is missing')
        const warehouseFetched = await Warehouse.findOne({where:{Id:warehouseId},include:[{
            model:Seller,
            include:[
                {
                    model:Product
                }
            ]
        }]})
        if( warehouseFetched ===null || warehouseFetched ===undefined) throw new Error(`warehouse: ${warehouseId} does not exists`)
        return res.status(200).json({statusCode:200, message:`warehouse: ${warehouseId} fetched successfully`,result:warehouseFetched})
    }
    catch(err)
    {
        return res.status(400).json({statusCode:'400',operation:'GetWarehousesById',message:err.message,capturedDateTime:Date.now()})
    }
}
export const GetAllWarehouseSellers = async(req, res, next)=>
{
    try
    {
        //seller check and session data access
        const userId = req.session.userId
        const user = await User.findByPk(userId)
        if(!user) throw new Error(`User must be authenticated to continue`)
        const seller = await user.getSeller()
        if(!seller) throw new Error(`Please login as a seller to continue`)
        if(!user.IsSeller || !seller) throw new Error(`Sorry, only sellers are allowed to access this functionality.`)

        const {id:warehouseId} = req.params
        if(!warehouseId) throw new Error('Invalid request, WarehouseId is missing')
        const warehousesSellerList = await Warehouse.findOne({where:{Id:warehouseId},include:[
            {
                model:Seller,
                include:[{
                    model:Product
                }]
            }
        ]})
        return res.status(200).json({statusCode:200, message:`${warehousesSellerList.length} Warehouses Sellers fetched`,result:warehousesSellerList})
    }
    catch(err)
    {
        return res.status(400).json({statusCode:'400',operation:'GetAllWarehouses',message:err.message,error:err,capturedDateTime:Date.now()})
    }
}
export const AssociateSellerWithWarehouse=async(req,res,next)=>
{
    try
    {
        //seller check and session data access
        const userId = req.session.userId
        const user = await User.findByPk(userId)
        if(!user) throw new Error(`User must be authenticated to continue`)
        const seller = await user.getSeller()
        if(!seller) throw new Error(`Please login as a seller to continue`)
        if(!user.IsSeller || !seller) throw new Error(`Sorry, only sellers are allowed to access this functionality.`)

        //get the warehouse ids from the request
        const warehouseId = req.params.warehouseId
        if(!warehouseId) throw {statusCode:422, message:'Warehouse Id is required'}

        //associate the seller with the warehouse (can include a check for not allowing the sellers if the business criteria does not match)
        const wareHouseToAssociate = await Warehouse.findByPk(warehouseId)
        await wareHouseToAssociate.addSeller(seller.Id)
        console.log(`Seller is associated with the warehouse:${warehouseId}`)
        return res.status(200).json({statusCode:200, message:`Seller is associated with the warehouse:${warehouseId}`})
    }
    catch(err)
    {
        return res.status(err.statusCode??400).json({statusCode:err.statusCode??400, message:err.message, capturedDateTime: new Date(Date.now())})
    }
}
export const CreateWarehouse = async(req, res, next)=>
{
    try
    {
        //seller check and session data access
        const userId = req.session.userId
        const user = await User.findByPk(userId)
        if(!user) throw new Error(`User must be authenticated to continue`)
        const seller = await user.getSeller()
        if(!seller) throw new Error(`Please login as a seller to continue`)
        if(!user.IsSeller || !seller) throw new Error(`Sorry, only sellers are allowed to access this functionality.`)

        const {Name, Description, Location, Zipcode, City, State, Country} = req.body
        const isWarehouseExisting = await Warehouse.findOne({Name, Description, Location, Zipcode, City, State, Country})
        if(!isWarehouseExisting) throw {statusCode:400, message:`Warehouse creation failed, warehouse exists`}
        const newWarehouse = await Warehouse.create({Name, Description, Location, Zipcode, City, State, Country})
        return res.status(200).json({statusCode:200, message:`new warehouse:${newWarehouse.Id} created`,result:newWarehouse})
    }
    catch(err)
    {
        return res.status(400).json({statusCode:'400',operation:'CreateWarehouse',message:err.message,capturedDateTime:Date.now()})
    }
}
export const CreateWarehouseInbulk = async(req, res, next)=>
{
    try
    {
        //seller check and session data access
        const userId = req.session.userId
        const user = await User.findByPk(userId)
        if(!user) throw new Error(`User must be authenticated to continue`)
        const seller = await user.getSeller()
        if(!seller) throw new Error(`Please login as a seller to continue`)
        if(!user.IsSeller || !seller) throw new Error(`Sorry, only sellers are allowed to access this functionality.`)

        const warehouseDetails = [...req.body]
        const creationDetails = await Warehouse.bulkCreate(warehouseDetails)
        return res.status(200).json({statusCode:200, message:`${warehouseDetails.length} warehouses created successfully`,result:creationDetails})
    }
    catch(err)
    {
        return res.status(400).json({statusCode:'400',operation:'CreateWarehouseInbulk',message:err.message,capturedDateTime:Date.now()})
    }
}
export const UpdateWarehouse = async(req, res, next)=>
{
    try
    {
        //seller check and session data access
        const userId = req.session.userId
        const user = await User.findByPk(userId)
        if(!user) throw new Error(`User must be authenticated to continue`)
        const seller = await user.getSeller()
        if(!seller) throw new Error(`Please login as a seller to continue`)
        if(!user.IsSeller || !seller) throw new Error(`Sorry, only sellers are allowed to access this functionality.`)

        const {id:warehouseId} = req.params
        if(!warehouseId) throw new Error('Invalid request, WarehouseId is missing')
        const warehouseUpdationDetails = req.body
        if(!warehouseUpdationDetails) new Error(`Invalid request, request body is missing for ${warehouseId}`)
        const warehouseFetched = await Warehouse.findByPk(warehouseId)
        if(!warehouseFetched) new Error(`Warehouse: ${warehouseId} does not exists`)
        const response = await warehouseFetched.update(warehouseUpdationDetails)
        await response.save()
        return res.status(200).json({statusCode:200, message:`warehouse: ${warehouseId} updated successfully`})
    }
    catch(err)
    {
        return res.status(400).json({statusCode:'400',operation:'UpdateWarehouse',message:err.message,capturedDateTime:Date.now()})
    }
}
export const DeleteWarehouse = async(req, res, next)=>
{
    try
    {
        //seller check and session data access
        const userId = req.session.userId
        const user = await User.findByPk(userId)
        if(!user) throw new Error(`User must be authenticated to continue`)
        const seller = await user.getSeller()
        if(!seller) throw new Error(`Please login as a seller to continue`)
        if(!user.IsSeller || !seller) throw new Error(`Sorry, only sellers are allowed to access this functionality.`)

        const {id:warehouseId} = req.params
        if(!warehouseId) throw new Error('Invalid request, WarehouseId is missing')
        const warehouseFetched = await Warehouse.findByPk(warehouseId)
        if(warehouseFetched) await warehouseFetched.destroy()
        return res.status(200).json({statusCode:200, message:`warehouse: ${warehouseId} deleted successfully`})
    }
    catch(err)
    {
        return res.status(400).json({statusCode:'400',operation:'DeleteWarehouse',message:err.message,capturedDateTime:Date.now()})
    }
}