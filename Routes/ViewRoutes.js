import { Router } from "express";
const ViewRoutes = Router()
import {SignUpGet, SignInGet, SignOutPost, SignInPost, SignUpPost} from '../Controllers/UserController.js'
import { RenderAllShopProducts, RenderAllSellerProducts, RenderSellerProductsEditPage, RenderSellerProductsUpdate } from "../Controllers/ProductController.js";
import {RenderCart} from '../Controllers/CartController.js'
import { RenderOrders,RenderCreateOrder } from "../Controllers/OrderController.js";
import CheckSignIn from "../Utils/CheckSignIn.js";
import CheckAdmin from "../Utils/CheckAdmin.js";
//user
ViewRoutes.get('/shop/users/signUp',SignUpGet)
ViewRoutes.post('/shop/users/signUp',SignUpPost)
ViewRoutes.get('/shop/users/signIn',SignInGet)
ViewRoutes.post('/shop/users/signIn',SignInPost)
ViewRoutes.post('/shop/users/signOut',SignOutPost)

//cart
ViewRoutes.get('/shop/cart',CheckSignIn,RenderCart)
ViewRoutes.post('/shop/cart/placeOrder',CheckSignIn,RenderCreateOrder)

//orders
ViewRoutes.get('/shop/orders',CheckSignIn,RenderOrders)

//products
ViewRoutes.get('/',RenderAllShopProducts)

//admin
ViewRoutes.get('/admin',CheckSignIn,CheckAdmin,RenderAllSellerProducts)
ViewRoutes.get('/admin/edit/:id',CheckSignIn,CheckAdmin,RenderSellerProductsEditPage)
ViewRoutes.post('/admin/edit/:id',CheckSignIn,CheckAdmin,RenderSellerProductsUpdate)

export default ViewRoutes