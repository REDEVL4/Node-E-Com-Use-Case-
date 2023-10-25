const PORT = 8003;
import Express from "express";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import UserRoutes from "./Routes/UserRoutes.js";
import ProductRoutes from "./Routes/ProductRoutes.js";
import CartRoutes from "./Routes/CartRoutes.js";
import OrderRoutes from "./Routes/OrderRoutes.js";
import UserAddressRoutes from "./Routes/UserAddressRoutes.js";
import WarehouseRoutes from "./Routes/WarehouseRoutes.js";
import ShipmentRoutes from "./Routes/ShipmentRoutes.js";
import AuthRoutes from "./Routes/AuthRoutes.js";
import ViewRoutes from "./Routes/viewRoutes.js";
import UsersList from "./TestFiles/UsersList.js";
import AzureMySqlSequelize from "./Utils/AzureMySqlSequelize.js";
import User from "./Models/User.js";
import Cart from "./Models/Cart.js";
import Order from "./Models/Order.js";
import Product from "./Models/Product.js";
import Warehouse from "./Models/Warehouse.js";
import CartProducts from "./Models/CartProducts.js";
import OrderProducts from "./Models/OrderProducts.js";
import swaggerUi from "swagger-ui-express";
import UserAddress from "./Models/UserAddress.js";
import WarehouseProducts from "./Models/WarehouseProducts.js";
import Shipment from "./Models/Shipment.js";
import Seller from "./Models/Seller.js";
import SellerProducts from "./Models/SellerProducts.js";
import WarehouseSellers from "./Models/WarehouseSellers.js";
import UserVerification from "./Models/UserVerification.js";
import Auth from "./Utils/Auth.js";
import { publishEventtoServiceBus } from "./Utils/publishEventtoServiceBus.js";
import expressSession from "express-session";
import createSequelizeStore from "connect-session-sequelize";
import path from "path";
import {Stripe} from "stripe";
import PDFDocument from 'pdfkit'
import fs from 'fs'
import axios from "axios";
import flash from 'connect-flash'
import CheckSignIn from "./Utils/CheckSignIn.js";
import Membership from "./Models/Membership.js";
import OrderAddress from "./Models/OrderAddress.js";
import geoip from 'geoip-lite'
import WarehouseOrder from "./Models/WarehouseOrder.js";
import WarehouseOrderSellers from "./Models/WarehouseOrderSellers.js";
import gateway from 'express-gateway'
import Admin from "./Models/Admin.js";
import OrdersWarehouses from "./Models/OrdersWarehouses.js";
const PdfDoc = new PDFDocument()
const stripe = new Stripe('sk_test_51NnFMxSAkBcHrwSFZ1gf73vq5ysppj4fr8Q65NYY9spraIEuHCN8ZyuYvUDA6WQjfKrxuwcoVMzHvUIjQZEayQPg00DzjWL1Kq');
const expressStore = createSequelizeStore(expressSession.Store);
const app = Express();
const store = new expressStore({
  db: AzureMySqlSequelize,
  tableName: "Sessions",
});
const appRoot = path.dirname(new URL(import.meta.url).pathname);
dotenv.config("./env");
app.set("view engine", "ejs");
app.set("views", "views");
app.use(Express.static("D:\\MyData\\WFiles\\E-Com UseCase\\public"));
app.use(
  expressSession({
    secret: process.env.SecurityKey,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 3600000 },
    store: store,
  })
);
app.use(Express.urlencoded({ extended: true }));
app.use(Express.json({ extended: true }));
app.use(flash())
// app.get('/location',async(req,res,next)=>
// {
//     const ipAddress = '182.76.158.166';//req.ip;
//     const geo = geoip.lookup(ipAddress);
//     if (!geo) {
//       return res.status(400).json({ error: 'Invalid IP address' });
//     }

//   // Coordinates (latitude and longitude)
//   const latitude = geo.ll[0];
//   const longitude = geo.ll[1];

//   // Construct the OpenCage API URL
//   const apiUrl = `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${process.env.GeoLocationAPiKey}&pretty=1`;

//   // // Perform the reverse geocoding using fetch
//   const geoCodingReverseGeoLocation = await fetch(apiUrl)
//   const geoCodingResponse = await geoCodingReverseGeoLocation.json()
//   const locationDetails = (geoCodingResponse.results && geoCodingResponse.results.length > 0)? geoCodingResponse.results[0] : null
//   const location = {
//       ip: ipAddress,
//       city: geo.city,
//       region: geo.region,
//       country: geo.country,
//       // zipCode: locationDetails.components.postcode,
//       ll: geo.ll,
//       // formatedAddress: locationDetails.formatted,
//   }
//   return res.json({location:location})
// })
app.use(async (req,res,next)=>
{
  try
  {
      const ipAddress = '182.76.158.166';//req.ip;
      const geo = geoip.lookup(ipAddress);
      if (!geo) {
        throw new Error({ error: 'Invalid IP address' });
      }
      // // Coordinates (latitude and longitude)
      // const latitude = geo.ll[0];
      // const longitude = geo.ll[1];

      // // Construct the OpenCage API URL
      // const apiUrl = `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${process.env.GeoLocationAPiKey}&pretty=1`;
  
      // // Perform the reverse geocoding using fetch
      // const geoCodingReverseGeoLocation = await fetch(apiUrl)
      // const geoCodingResponse = await geoCodingReverseGeoLocation.json()
      // return res.json({message:geoCodingResponse})
      // const locationDetails = (geoCodingResponse.results && geoCodingResponse.results.length > 0)? geoCodingResponse.results[0] : null
      const location = {
        ip: ipAddress,
        city: geo.city,
        region: geo.region,
        country: geo.country,
        zipCode: '500039',//locationDetails.components.postcode,
        ll: geo.ll,
        formatedAddress: 'Janapriya aparts, church colony, ramanthapur, uppal, hyderabad'//locationDetails.formatted,
      }
      req.session.location = location
  }
  catch(err)
  {
    console.log('Error occured when fetching location due to:',err.message)
  }
  next()
})
app.use("/auth", AuthRoutes);
app.get('/download/invoice/:id',CheckSignIn,async(req,res,next)=>
{
  const {id:orderId} = req.params
  try
  {
    console.log(orderId)
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
      const downloadAndIncludeImage = async (imageUrl) => {
        try {
            const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
            const imageData = Buffer.from(response.data, 'binary');
            return imageData;
        } catch (error) {
            console.error('Error downloading or including image:', error);
            return null;
        }
    };
// Define colorful text colors
const titleColor = '#2ecc71'; // Green
const detailColor = '#3498db'; // Blue
const backgroundColor = '#ecf0f1'; // Light Gray
res.setHeader('Content-Type','application/pdf')
res.setHeader('Content-Disposition',`inline; filename="Invoice_${orderId}"`)
PdfDoc.pipe(res)

// Title
PdfDoc.fillColor(titleColor).font('Helvetica').fontSize(20)
    .text(`Order Invoice`, { align: 'left' })
    .fillColor('grey')
    .text(`${orders[0].OrderId}`, { align: 'left', fontSize: 2 });

// Separator Line
PdfDoc.moveDown().lineWidth(2).strokeColor(detailColor).lineCap('butt')
    .moveTo(50, PdfDoc.y)
    .lineTo(550, PdfDoc.y)
    .stroke();

// Product Details
for (const product of orders[0].Products) {
    PdfDoc.rect(50, PdfDoc.y, 500, 150).fill(backgroundColor); // Background for product

    // Download and include the image
    const imageData = await downloadAndIncludeImage(product.ImageUrl);

    PdfDoc.image(imageData, 60, PdfDoc.y + 10, { width: 100, height: 100 });

    PdfDoc.fillColor(detailColor).fontSize(12)
        // .font('Helvetica')
        .text(`Product: ${product.Name}`, 180, PdfDoc.y+2, { align: 'left' })
        .text(`Description: ${product.Description}`, 180, PdfDoc.y + 2)
        .text(`Price: $${product.Cost.toFixed(2)}`, 180, PdfDoc.y + 2)
        .text(`Category: ${product.Category}`, 180, PdfDoc.y + 2)
        .text(`Manufactured On: ${new Date(product.ManufacturedOn).toDateString()}`, 180, PdfDoc.y + 2)
        .text(`Manufactured By: ${product.ManufacturedBy}`, 180, PdfDoc.y + 2)
        .text(`Quantity: ${product.OrderedQuantity}`, 180, PdfDoc.y + 2);

    // Separator Line
    PdfDoc.moveDown().lineWidth(1).strokeColor(detailColor).lineCap('butt')
        .moveTo(50, PdfDoc.y + 28)
        .lineTo(550, PdfDoc.y + 28)
        .stroke();

    // Move to the next product
    PdfDoc.moveDown(3);
}

// Total Cost
PdfDoc.fillColor('salmon').fontSize(16).font('Helvetica-Bold')
    .text(`Total Cost: $${orders[0].TotalCost.toFixed(2)}`, { align: 'right' });

    PdfDoc.end()
    return res.end()
  }
  catch(err)
  {
    return res.status(400).json({error:err.message});
  }
})
app.get('/order/success/:id',CheckSignIn, async (req, res) => {
  // const session = await stripe.checkout.sessions.retrieve(req.query.session_id);
  // const customer = await stripe.customers.retrieve(session.customer);
  // res.send(`<html><body><h1>Thanks for your order, ${customer.name}!</h1></body></html>`);
  try
  {
    const {id:orderId} = req.params
    const user = await User.findByPk(req.session.userId)
    if(!user) throw new Error(`User must be authenticated to continue`)
    if(!orderId) new Error('Invalid request, OrderId is missing')
    let fetchedOrder = (await user.getOrders({where:{Id:orderId}}))[0]
    if(!fetchedOrder) throw new Error(`Order:${orderId} is invalid or does not exists`)
    //send an event to hub stating order placed with orderId
    // const tobeFulfilled = fetchedOrder.Products.map(async (product)=>
    //   {
    //     await WarehouseOrders.create({OrderId: fetchedOrder.Id,WarehouseId: product.WarehouseId})
    //   })
    // await Promise.all(tobeFulfilled)
    // const cart = await user.getCart()
    
    // await cart.destroy()
    
    fetchedOrder.Status = 'placed'
    await fetchedOrder.save()
    await fetchedOrder.createWarehouseOrder({});
    return res.redirect('/shop/orders')
  }
  catch(err)
  {
    console.log(err.message)
    return res.redirect('/shop/orders')
  }
});
app.get('/order/cancel',CheckSignIn, async (req, res) => {
  return res.send(`<html><body><h1>You have cancelled the payment for your order ${req.session.UserName}!</h1><a class="btn btn-outline-info" href="/shop/orders">Go Back</a></body></html>`);
});
app.post('/create-checkout-session/:id',CheckSignIn, async (req, res) => {
  const {id:orderId} = req.params
  const user = await User.findOne({where:{Id: req.session.userId}})
  if(!user) throw new Error(`User must be authenticated to continue`)
  if(!orderId) throw new Error(`invalid request, orderId is missing`)
  if(!user.hasOrder(orderId)) throw new Error(`${orderId} doesn't exists`)
  let orders = await user.getOrders({where:{Id:orderId},include:[{
    model:Product
},{model:OrderAddress}]})
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
    const logallcust = await stripe.customers.list() 
    console.log(logallcust)
    //create a customer
    try
    {
    const customer = await stripe.customers.create({email:user.Email,name: user.PreferredName, phone: user.MobileNumber, address: 
      {
        city:orders.OrderAddress.City,
        country: orders.OrderAddress.Country,
        state: orders.OrderAddress.State,
        postal_code: orders.OrderAddress.ZipCode,
        line1: orders.OrderAddress.AddressLine1,
        line2: orders.OrderAddress.AddressLine2
      }})
    }
    catch(err)
    {
      console.log(`Error:${err.message} while attempting customer creation`)
    }
    const productPromises = orders[0].Products.map(async (product) => {
      try
      {
        const sproduct = await stripe.products.create({
          name: product.Name,
          id: product.Id,
          description: product.Description,
          images: [product.ImageUrl], // Wrap image URL in an array
          type: "good",
          metadata:{...product}
      });
        console.log('sproduct', sproduct);
      }
      catch(err)
      {
        console.log(err.message)
      }
      
      const price = await stripe.prices.create({
          product: product.Id,
          unit_amount: product.Cost*100,
          currency: 'inr'
      });
      
      return {
          price: price.id, // Use price.id
          quantity: product.OrderedQuantity,
      };
  });

  const line_items = await Promise.all(productPromises);
  console.log('items', line_items);
    
  const session = await stripe.checkout.sessions.create({
    line_items,
    mode: 'payment',
    success_url: `http://localhost:8003/order/success/${orderId}`,
    cancel_url: `http://localhost:8003/order/cancel`,
});
console.log(session)
res.redirect(303, session.url);
});
app.use("/users", UserRoutes);
app.use("/products", ProductRoutes);
app.use("/cart", Auth, CartRoutes);
app.use("/orders", Auth, OrderRoutes);
app.use("/userAddress", Auth,UserAddressRoutes);
app.use("/warehouse", Auth, WarehouseRoutes);
app.use("/shipment", Auth,ShipmentRoutes);
app.use('/shop',ViewRoutes)
app.use('/test',Auth,async(req,res,next)=>
{
  try
  {
    const wo = await WarehouseOrder.findByPk('f5ea4da4-8926-4735-a0f0-28eb4d2a53c7')
    const result = await wo.getOrder({include:[{model: Product}]})
    // const user = await User.findOne({where:{Id: req.session.userId},include:[{model:UserAddress, where:{AddressType:'shipping'}}]})
    // const order = (await user.getOrders({where: {Id:'0da82f59-88bc-4596-9d93-d7d5f6ff3a74'}}))[0]
    // const products = await order.getProducts()
    // const toBeResolved = products.map(async (product)=>
    // {
    //   const warehouseDetails = await product.getWarehouses()
    //   // await order.addWarehouses({})
    //   // return res.json({warehouseDetails})
    // })
    // await Promise.all(toBeResolved)
    // const order = await Order.findByPk('4f0d4ccb-bbd3-4bc5-bfb1-3a751697175a')
    // await order.createWarehouseOrder()
    // const worder = await WarehouseOrder.findOne({where:{OrderId: 'e53a2595-da9d-4545-a587-459b39d323b8'}, include:[]})
    // await order.createWarehouseOrder({});
    // const w = await order.getProducts({nested:false, saperate: true,attributes:[], include:[
    //   {
    //     model: Warehouse,
    //     attributes:["Id"],
    //     through:{attributes:[]}
    //   }
    // ], through:{attributes:null},})
    return res.json({result:result})
    //await stripe.customers.del('cus_OdrT8UCUzA0oof')
    // const customer = await stripe.customers.create({email:user.Email,name: user.PreferredName, phone: user.MobileNumber, address: 
    //   {
    //     city:user.UserAddresses.City,
    //     country: user.UserAddresses.Country,
    //     state: user.UserAddresses.State,
    //     postal_code: user.UserAddresses.ZipCode,
    //     line1: user.UserAddresses.AddressLine1,
    //     line2: user.UserAddresses.AddressLine2
    //   }})
    // const customers = await stripe.customers.list()
    // customers.data.forEach(async(cust)=>await stripe.customers.del(cust.id))      
    // return res.status(200).json(customers)
      // await publishEventtoServiceBus("userqueue","test",{message:'this is atleast message'})
  }
  catch(err)
  {
    console.log(err.message)
    return res.status(400).json({error:err.message})
  }
})
//user cart (one to one)
User.hasOne(Cart);
Cart.belongsTo(User);

//user address (one to many)
User.hasMany(UserAddress);
UserAddress.belongsTo(User);

//user shipping (one to many)
User.hasMany(Shipment);
Shipment.belongsTo(User);

//user seller (one to one)
User.hasOne(Seller);
Seller.belongsTo(User);

//user seller (one to one)
User.hasOne(Admin);
Admin.belongsTo(User);

//user email verification table
User.hasOne(UserVerification);
UserVerification.belongsTo(User);

//user and membership (one to one)
User.hasOne(Membership)
Membership.belongsTo(User)

//seller products
Seller.belongsToMany(Product, { through: SellerProducts });
Product.belongsToMany(Seller, { through: SellerProducts });

//seller warehouses
Seller.belongsToMany(Warehouse, { through: WarehouseSellers });
Warehouse.belongsToMany(Seller, { through: WarehouseSellers });

//Cart product
Cart.belongsToMany(Product, { through: CartProducts });
Product.belongsToMany(Cart, { through: CartProducts });

//order users
User.hasMany(Order);
Order.belongsTo(User);

//order products
Order.belongsToMany(Product, { through: OrderProducts });
Product.belongsToMany(Order, { through: OrderProducts });

//warehouse product
Warehouse.belongsToMany(Product, { through: WarehouseProducts });
Product.belongsToMany(Warehouse, { through: WarehouseProducts });

//orders shipment
Order.hasOne(Shipment);
Shipment.belongsTo(Order);

Order.hasOne(OrderAddress)
OrderAddress.belongsTo(Order)

//warehouse <-> orders & Seller <-> WarehouseOrders 
// Warehouse.belongsToMany(Order, {through: WarehouseOrders})
// Order.belongsToMany(Warehouse, {through: WarehouseOrders})

// Seller.belongsToMany(WarehouseOrder, {through: WarehouseOrderSellers})
// WarehouseOrder.belongsToMany(Seller, {through: WarehouseOrderSellers})

Order.hasOne(WarehouseOrder)
WarehouseOrder.belongsTo(Order)

// WarehouseOrder.belongsToMany(Product, { through: OrderProducts });
// Product.belongsToMany(WarehouseOrder, { through: OrderProducts });


// WarehouseOrder.belongsToMany(Warehouse, {through: OrdersWarehouses})
// Warehouse.belongsToMany(WarehouseOrder, {through: OrdersWarehouses})

app.listen(process.env.PORT || PORT,async () => {
  console.log("running!!!")
  // const order = await Order.findByPk('ea6b1cd5-e317-41a3-bd60-a54ceb079525')
  // const w = await order.getProducts({attributes:[], include:[
  //   {
  //     model: Warehouse,
  //     attributes:["Id"]
  //   }
  // ]})
  // // await order.createWarehouseOrder()
  // // const wo = await order.getWarehouseOrder()
  // // const w = await wo.getWarehouses()
  // console.log(w)
  // WarehouseProducts.destroy({where:{}})
});
// AzureMySqlSequelize
//   .sync({force:true})
//   .then((_) => app.listen(PORT, () => console.log("running!!!")))
//   .catch((err) => console.log(err));
