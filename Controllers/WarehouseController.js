import { Op } from "sequelize";
import Product from "../Models/Product.js";
import Seller from "../Models/Seller.js";
import Warehouse from "../Models/Warehouse.js";
import User from "../Models/User.js";
import WarehouseOrders from "../Models/WarehouseOrder.js";
import Order from "../Models/Order.js";
import OrderAddress from "../Models/OrderAddress.js";
import WarehouseOrder from "../Models/WarehouseOrder.js";

export const GetAllWarehouses = async (req, res, next) => {
  try {
    //seller check and session data access
    const userId = req.session.userId;
    const user = await User.findByPk(userId);
    if (!user) throw new Error(`User must be authenticated to continue`);
    const seller = await user.getSeller();
    if (!seller) throw new Error(`Please login as a seller to continue`);
    if (!user.IsSeller || !seller)
      throw new Error(
        `Sorry, only sellers are allowed to access this functionality.`
      );

    const {
      Zipcode,
      City,
      State,
      Country,
      SellerName,
      SellerId,
      WarehouseName,
      ProductId,
      ProductName,
    } = req.query;
    let {IslistView} = req.query
    let warehousefilters = {};
    let sellerFilters = {};
    let productFilters = {};

    //warehouse filter
    if (WarehouseName)
      warehousefilters = { ...warehousefilters, Name: WarehouseName };

    //location filter
    if (Zipcode) warehousefilters = { ...warehousefilters, Zipcode };
    if (City) warehousefilters = { ...warehousefilters, City };
    if (State) warehousefilters = { ...warehousefilters, State };
    if (Country) warehousefilters = { ...warehousefilters, Country };

    //seller filter
    if (SellerName) sellerFilters = { ...sellerFilters, Name: SellerName };
    if (SellerId) sellerFilters = { ...sellerFilters, Id: SellerId };

    //product filters
    if (ProductId) productFilters = { ...productFilters, Id: ProductId };
    if (ProductName) productFilters = { ...productFilters, Name: ProductName };
    
    let warehousesList
    const filters = [
      {
        model: Seller,
        where: { ...sellerFilters },
        include: [
          {
            model: Product,
            // where: { ...productFilters },
          },
        ],
      },
    ] 

    if(IslistView)
    {
      warehousesList = await Warehouse.findAll({
        where: { ...warehousefilters }
      });        
    } 
    else
    {
      warehousesList = await Warehouse.findAll({
        where: { ...warehousefilters },
        include: filters 
      });        
    }
    return res
      .status(200)
      .json({
        statusCode: 200,
        message: `${warehousesList.length} warehouses fetched`,
        result: warehousesList,
      });
  } catch (err) {
    return res
      .status(400)
      .json({
        statusCode: "400",
        operation: "GetAllWarehouses",
        message: err.message,
        capturedDateTime: Date.now(),
      });
  }
};
export const GetMyAssociatedWarehouses = async (req, res, next) => {
  try {
    //seller check and session data access
    const userId = req.session.userId;
    const user = await User.findByPk(userId);
    if (!user) throw new Error(`User must be authenticated to continue`);
    const seller = await user.getSeller();
    if (!seller) throw new Error(`Please login as a seller to continue`);
    if (!user.IsSeller || !seller)
      throw new Error(
        `Sorry, only sellers are allowed to access this functionality.`
      );

    const myAssociatedWarehouses = await seller.getWarehouses({
      attributes: [
        "Id",
        "Name",
        "Description",
        "Location",
        "Zipcode",
        "City",
        "State",
        "Country",
      ],
    });
    return res
      .status(200)
      .json({
        statusCode: 200,
        message: `request successful`,
        result: { AssociatedWarehouses: myAssociatedWarehouses },
      });
  } catch (err) {
    return res
      .status(err.statusCode ?? 400)
      .json({ statusCode: err.statusCode ?? 400, message: err.message });
  }
};
export const GetWarehousesById = async (req, res, next) => {
  try {
    //seller check and session data access
    const userId = req.session.userId;
    const user = await User.findByPk(userId);
    if (!user) throw new Error(`User must be authenticated to continue`);
    const seller = await user.getSeller();
    if (!seller) throw new Error(`Please login as a seller to continue`);
    if (!user.IsSeller || !seller)
      throw new Error(
        `Sorry, only sellers are allowed to access this functionality.`
      );

    const { id: warehouseId } = req.params;
    if (!warehouseId)
      throw new Error("Invalid request, WarehouseId is missing");
    const warehouseFetched = await Warehouse.findOne({
      where: { Id: warehouseId },
      include: [
        {
          model: Seller,
          include: [
            {
              model: Product,
            },
          ],
        },
      ],
    });
    if (warehouseFetched === null || warehouseFetched === undefined)
      throw new Error(`warehouse: ${warehouseId} does not exists`);
    return res
      .status(200)
      .json({
        statusCode: 200,
        message: `warehouse: ${warehouseId} fetched successfully`,
        result: warehouseFetched,
      });
  } catch (err) {
    return res
      .status(400)
      .json({
        statusCode: "400",
        operation: "GetWarehousesById",
        message: err.message,
        capturedDateTime: Date.now(),
      });
  }
};
export const GetAllWarehouseSellers = async (req, res, next) => {
  try {
    //seller check and session data access
    const userId = req.session.userId;
    const user = await User.findByPk(userId);
    if (!user) throw new Error(`User must be authenticated to continue`);
    const seller = await user.getSeller();
    if (!seller) throw new Error(`Please login as a seller to continue`);
    if (!user.IsSeller || !seller)
      throw new Error(
        `Sorry, only sellers are allowed to access this functionality.`
      );

    const { id: warehouseId } = req.params;
    if (!warehouseId)
      throw new Error("Invalid request, WarehouseId is missing");
    const warehousesSeller = await Warehouse.findOne({
      where: { Id: warehouseId },
      include: [
        {
          model: Seller,
          // include:[{
          //     model:Product
          // }]
        },
      ],
    });
    return res
      .status(200)
      .json({
        statusCode: 200,
        message: !warehousesSeller
          ? "No warehouse found!"
          : `Warehouse:${warehouseId} sellers fetched successfully`,
        result: warehousesSeller ?? {},
      });
  } catch (err) {
    return res
      .status(400)
      .json({
        statusCode: "400",
        operation: "GetAllWarehouses",
        message: err.message,
        error: err,
        capturedDateTime: Date.now(),
      });
  }
};
export const AssociateSellerWithWarehouse = async (req, res, next) => {
  try {
    //seller check and session data access
    const userId = req.session.userId;
    const user = await User.findByPk(userId);
    if (!user) throw new Error(`User must be authenticated to continue`);
    const seller = await user.getSeller();
    if (!seller) throw new Error(`Please login as a seller to continue`);
    if (!user.IsSeller || !seller)
      throw new Error(
        `Sorry, only sellers are allowed to access this functionality.`
      );

    //get the warehouse ids from the request
    const warehouseId = req.params.warehouseId;
    if (!warehouseId)
      throw { statusCode: 422, message: "Warehouse Id is required" };

    //associate the seller with the warehouse (can include a check for not allowing the sellers if the business criteria does not match)
    const wareHouseToAssociate = await Warehouse.findByPk(warehouseId);
    await wareHouseToAssociate.addSeller(seller.Id);
    console.log(`Seller is associated with the warehouse:${warehouseId}`);
    return res
      .status(200)
      .json({
        statusCode: 200,
        message: `Seller is associated with the warehouse:${warehouseId}`,
      });
  } catch (err) {
    return res
      .status(err.statusCode ?? 400)
      .json({
        statusCode: err.statusCode ?? 400,
        message: err.message,
        capturedDateTime: new Date(Date.now()),
      });
  }
};
export const CreateWarehouse = async (req, res, next) => {
  try {
    //seller check and session data access
    const userId = req.session.userId;
    const user = await User.findByPk(userId);
    if (!user) throw new Error(`User must be authenticated to continue`);
    const seller = await user.getSeller();
    if (!seller) throw new Error(`Please login as a seller to continue`);
    if (!user.IsSeller || !seller)
      throw new Error(
        `Sorry, only sellers are allowed to access this functionality.`
      );

    const { Name, Description, Location, Zipcode, City, State, Country } =
      req.body;
    const isWarehouseExisting = await Warehouse.findOne({
      Name,
      Description,
      Location,
      Zipcode,
      City,
      State,
      Country,
    });
    if (!isWarehouseExisting)
      throw {
        statusCode: 400,
        message: `Warehouse creation failed, warehouse exists`,
      };
    const newWarehouse = await Warehouse.create({
      Name,
      Description,
      Location,
      Zipcode,
      City,
      State,
      Country,
    });
    return res
      .status(200)
      .json({
        statusCode: 200,
        message: `new warehouse:${newWarehouse.Id} created`,
        result: newWarehouse,
      });
  } catch (err) {
    return res
      .status(400)
      .json({
        statusCode: "400",
        operation: "CreateWarehouse",
        message: err.message,
        capturedDateTime: Date.now(),
      });
  }
};
export const CreateWarehouseInbulk = async (req, res, next) => {
  try {
    //seller check and session data access
    const userId = req.session.userId;
    const user = await User.findByPk(userId);
    if (!user) throw new Error(`User must be authenticated to continue`);
    const seller = await user.getSeller();
    if (!seller) throw new Error(`Please login as a seller to continue`);
    if (!user.IsSeller || !seller)
      throw new Error(
        `Sorry, only sellers are allowed to access this functionality.`
      );

    const warehouseDetails = [...req.body];
    const creationDetails = await Warehouse.bulkCreate(warehouseDetails);
    return res
      .status(200)
      .json({
        statusCode: 200,
        message: `${warehouseDetails.length} warehouses created successfully`,
        result: creationDetails,
      });
  } catch (err) {
    return res
      .status(400)
      .json({
        statusCode: "400",
        operation: "CreateWarehouseInbulk",
        message: err.message,
        capturedDateTime: Date.now(),
      });
  }
};
export const UpdateWarehouse = async (req, res, next) => {
  try {
    //seller check and session data access
    const userId = req.session.userId;
    const user = await User.findByPk(userId);
    if (!user) throw new Error(`User must be authenticated to continue`);
    const seller = await user.getSeller();
    if (!seller) throw new Error(`Please login as a seller to continue`);
    if (!user.IsSeller || !seller)
      throw new Error(
        `Sorry, only sellers are allowed to access this functionality.`
      );

    const { id: warehouseId } = req.params;
    if (!warehouseId)
      throw new Error("Invalid request, WarehouseId is missing");
    const warehouseUpdationDetails = req.body;
    if (!warehouseUpdationDetails)
      new Error(`Invalid request, request body is missing for ${warehouseId}`);
    const warehouseFetched = await Warehouse.findByPk(warehouseId);
    if (!warehouseFetched)
      new Error(`Warehouse: ${warehouseId} does not exists`);
    const response = await warehouseFetched.update(warehouseUpdationDetails);
    await response.save();
    return res
      .status(200)
      .json({
        statusCode: 200,
        message: `warehouse: ${warehouseId} updated successfully`,
      });
  } catch (err) {
    return res
      .status(400)
      .json({
        statusCode: "400",
        operation: "UpdateWarehouse",
        message: err.message,
        capturedDateTime: Date.now(),
      });
  }
};
export const DeleteWarehouse = async (req, res, next) => {
  try {
    //seller check and session data access
    const userId = req.session.userId;
    const user = await User.findByPk(userId);
    if (!user) throw new Error(`User must be authenticated to continue`);
    const seller = await user.getSeller();
    if (!seller) throw new Error(`Please login as a seller to continue`);
    if (!user.IsSeller || !seller)
      throw new Error(
        `Sorry, only sellers are allowed to access this functionality.`
      );

    const { id: warehouseId } = req.params;
    if (!warehouseId)
      throw new Error("Invalid request, WarehouseId is missing");
    const warehouseFetched = await Warehouse.findByPk(warehouseId);
    if (warehouseFetched) await warehouseFetched.destroy();
    return res
      .status(200)
      .json({
        statusCode: 200,
        message: `warehouse: ${warehouseId} deleted successfully`,
      });
  } catch (err) {
    return res
      .status(400)
      .json({
        statusCode: "400",
        operation: "DeleteWarehouse",
        message: err.message,
        capturedDateTime: Date.now(),
      });
  }
};
export const GetProductsAvailability = async (req,res,next)=>
{
  try
  {
    //product Id, Warehouse Id {Id, WId}
    const {productsDetails} = req.body
    
    return res
    .status(200)
    .json({
      statusCode: 200,
      message: `Products availability confirmed`,
    });
  }
  catch(err)
  {
    return res
    .status(err.statusCode??400)
    .json({
      statusCode: err.statusCode?err.statusCode:"400",
      operation: "GetProductsAvailability",
      message: err.message,
      capturedDateTime: Date.now(),
    });
  }
}
export const GetWarehouseOrders = async (req,res,next)=>
{
  try
  {
    const allowedStatus = ["initiated","to be checked for availability","availability confirmed","package request sent to seller","waiting to to be picked up from seller","shipping initiated","shipping in progress","shipped successfully","successful","cancelled"]
    let {includeWarehouseStatus, excludeWarehouseStatus} = req.query;
    let filters = {}
    //check for status existnace 
    if(includeWarehouseStatus && !(allowedStatus.filter(status=>status===includeWarehouseStatus).length>0))
        throw new Error(`Invalid status:${includeWarehouseStatus}`)
    if(excludeWarehouseStatus && !(allowedStatus.filter(status=>status===excludeWarehouseStatus).length>0))
        throw new Error(`Invalid status:${excludeWarehouseStatus}`)

    if(includeWarehouseStatus) filters = {Status: includeWarehouseStatus}
    if(excludeWarehouseStatus) filters = {...filters, Status: {[Op.not]:excludeWarehouseStatus}}
    
    //connect with warehouse orders
    const warehouseOrderDetails = await WarehouseOrder.findAll({
      where: {Status:{[Op.and]:[{[Op.ne]:"successful"},{[Op.ne]:"cancelled"}]}},
      attributes:["Id","OrderId","Status"],
      include:[
        {
          model: Order,
          where: { status: "placed", WarehouseStatus: "to be exported" },
          attributes:["Id","UserId","Status","TotalCost","WarehouseStatus"],
          include:[
            {
              model: Product,
              attributes:["Id","Name","Cost","Category","SubCategory"],
              through:{attributes:["WarehouseId","Quantity"],as:'WarehouseInfo'}
            },
            {
              model: OrderAddress,
            }
          ]
        }
      ]
    })
    return res
    .status(200)
    .json({
      statusCode: 200,
      message: `${warehouseOrderDetails.length} warehouseOrders fetched successfully`,
      result:warehouseOrderDetails
    });
  }
  catch(err)
 {
  return res
      .status(err.statusCode??400)
      .json({
        statusCode: err.statusCode?err.statusCode:"400",
        operation: "GetWarehouseOrders",
        message: err.message,
        capturedDateTime: Date.now(),
      });
 }
}

//views
export const RenderWarehousesAssociationPage = async (req, res, next) => {
  //seller check and session data access
  const user = await User.findByPk(req.session.userId);
  if (!user) throw new Error(`User must be authenticated to continue`);
  const seller = await user.getSeller();
  if (!seller) throw new Error(`Please login as a seller to continue`);
  if (!user.IsSeller || !seller)
    throw new Error(
      `Only sellers are allowed to view their products, please considering registering as a seller to add your products to shop`
    );
 const sellerAddress = (await user.getUserAddresses({where:{AddressType:'seller'}}))[0]
 let warehouseFilters = {}
 if(sellerAddress) warehouseFilters = {City: sellerAddress.City}
  let warehousesList = await Warehouse.findAll({
    where:warehouseFilters,
    include: [
      {
        model: Seller,
      },
    ],
  });
  res.locals.message = null;
  res.locals.isSuccess = null;
  res.locals.SellerId = seller.Id
  warehousesList = warehousesList.map(({dataValues:warehouse})=>{
    return {...warehouse, AmIaPart: (warehouse.Sellers.findIndex(slr=>slr.Id===seller.Id)!==-1)?true:false}
  })
  return res.render("warehouse/index.ejs", {
    warehouses: warehousesList,
    activePage: "warehouse",
    isLoggedIn: req.session ? req.session.isLoggedIn : false,
    IsSeller: req.session.IsSeller ?? false,
    UserName: req.session.UserName,
    Password: req.session.Password,
  });
};
export const GetWarehousesProductDetails = async (req, res, next) => {
  try {
    //seller check and session data access
    const userId = req.session.userId;
    const user = await User.findByPk(userId);
    if (!user) throw new Error(`User must be authenticated to continue`);
    const seller = await user.getSeller();
    if (!seller) throw new Error(`Please login as a seller to continue`);
    if (!user.IsSeller || !seller)
      throw new Error(
        `Sorry, only sellers are allowed to access this functionality.`
      );

    const {
      Zipcode,
      City,
      State,
      Country,
      SellerName,
      SellerId,
      WarehouseName,
      ProductId,
      ProductName,
    } = req.query;
    let warehousefilters = {};
    let sellerFilters = {};
    let productFilters = {};

    //warehouse filter
    if (WarehouseName)
      warehousefilters = { ...warehousefilters, Name: WarehouseName };

    //location filter
    if (Zipcode) warehousefilters = { ...warehousefilters, Zipcode };
    if (City) warehousefilters = { ...warehousefilters, City };
    if (State) warehousefilters = { ...warehousefilters, State };
    if (Country) warehousefilters = { ...warehousefilters, Country };

    //seller filter
    if (SellerName) sellerFilters = { ...sellerFilters, Name: SellerName };
    if (SellerId) sellerFilters = { ...sellerFilters, Id: SellerName };

    //product filters
    // if (ProductId) productFilters = { ...productFilters, Id: ProductId };
    // if (ProductName) productFilters = { ...productFilters, Name: ProductName };

    const warehousesList = await Warehouse.findAll({
      where: { ...warehousefilters },
      include: [
        {
          model: Seller,
          where: { ...sellerFilters },
          include: [
            {
              model: Product,
              where: { ...productFilters },
            },
          ],
        },
      ],
    });
    return res
      .status(200)
      .json({
        statusCode: 200,
        message: `${warehousesList.length} warehouses fetched`,
        result: warehousesList,
      });
  } catch (err) {
    return res
      .status(400)
      .json({
        statusCode: "400",
        operation: "GetAllWarehouses",
        message: err.message,
        capturedDateTime: Date.now(),
      });
  }
};