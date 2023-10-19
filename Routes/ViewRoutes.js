import { Router } from "express";
const ViewRoutes = Router()
import {SignUpGet, SignInGet, SignOutPost, SignInPost, SignUpPost} from '../Controllers/UserController.js'
import { RenderAllShopProducts, RenderAllSellerProducts, RenderSellerProductsEditPage, RenderSellerProductsUpdate } from "../Controllers/ProductController.js";
import { RenderWarehousesAssociationPage } from "../Controllers/WarehouseController.js";
import {RenderCart} from '../Controllers/CartController.js'
import { RenderOrders,RenderCreateOrder } from "../Controllers/OrderController.js";
import CheckSignIn from "../Utils/CheckSignIn.js";
import CheckAdmin from "../Utils/CheckAdmin.js";
//user
ViewRoutes.get('/users/signUp',SignUpGet)
ViewRoutes.post('/users/signUp',SignUpPost)
ViewRoutes.get('/users/signIn',SignInGet)
ViewRoutes.post('/users/signIn',SignInPost)
ViewRoutes.post('/users/signOut',SignOutPost)

//cart
ViewRoutes.get('/cart',CheckSignIn,RenderCart)
ViewRoutes.post('/cart/placeOrder',CheckSignIn,RenderCreateOrder)

//orders
ViewRoutes.get('/orders',CheckSignIn,RenderOrders)

//products
ViewRoutes.get('/',RenderAllShopProducts)

//admin
ViewRoutes.get('/admin',CheckSignIn,CheckAdmin,RenderAllSellerProducts)
ViewRoutes.get('/admin/edit/:id',CheckSignIn,CheckAdmin,RenderSellerProductsEditPage)
ViewRoutes.post('/admin/edit/:id',CheckSignIn,CheckAdmin,RenderSellerProductsUpdate)

//warehouse RenderWarehousesAssociationPage
ViewRoutes.get('/admin/warehouses',CheckSignIn,CheckAdmin,RenderWarehousesAssociationPage)


export default ViewRoutes