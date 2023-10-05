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
    fetchedOrder.Status = 'placed'
    //send an event to hub stating order placed with orderId
    
    await fetchedOrder.save()
    const cart = await user.getCart()
    await cart.destroy()
    return res.redirect('/')
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
  const user = await User.findOne({where:{Id: req.session.userId},include:[{model:UserAddress, where:{AddressType:'shipping'}}]})
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
    const logallcust = await stripe.customers.list() 
    console.log(logallcust)
    //create a customer
    try
    {
    const customer = await stripe.customers.create({email:user.Email,name: user.PreferredName, phone: user.MobileNumber, address: 
      {
        city:user.UserAddresses.City,
        country: user.UserAddresses.Country,
        state: user.UserAddresses.State,
        postal_code: user.UserAddresses.ZipCode,
        line1: user.UserAddresses.AddressLine1,
        line2: user.UserAddresses.AddressLine2
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
app.use(ViewRoutes)
app.use('/test',Auth,async(req,res,next)=>
{
  try
  {
    const user = await User.findOne({where:{Id: req.session.userId},include:[{model:UserAddress, where:{AddressType:'shipping'}}]})
    await stripe.customers.del('cus_OdrT8UCUzA0oof')
    // const customer = await stripe.customers.create({email:user.Email,name: user.PreferredName, phone: user.MobileNumber, address: 
    //   {
    //     city:user.UserAddresses.City,
    //     country: user.UserAddresses.Country,
    //     state: user.UserAddresses.State,
    //     postal_code: user.UserAddresses.ZipCode,
    //     line1: user.UserAddresses.AddressLine1,
    //     line2: user.UserAddresses.AddressLine2
    //   }})
    const customers = await stripe.customers.list()
      console.log(customers)
      return req.status(200).json(customers)
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

app.listen(process.env.PORT || PORT, () => console.log("running!!!"));
// AzureMySqlSequelize
//   .sync({force:true})
//   .then((_) => app.listen(PORT, () => console.log("running!!!")))
//   .catch((err) => console.log(err));
