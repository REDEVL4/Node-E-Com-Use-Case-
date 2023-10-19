import { Router } from "express";
import { GetCart,ClearCart,AddProductToCart,RemoveProductFromCart } from "../Controllers/CartController.js";
const CartRoutes = Router()
CartRoutes.get('/',GetCart)
CartRoutes.delete('/',ClearCart)
CartRoutes.post('/:warehouseId/:productId',AddProductToCart)
CartRoutes.delete('/:warehouseId/:productId',RemoveProductFromCart)
export default CartRoutes