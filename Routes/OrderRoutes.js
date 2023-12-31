import { Router } from "express";
import { GetOrdersById,GetOrdersByStatus, CreateOrder,CancelOrder, DeleteOrder, PlaceOrder } from "../Controllers/OrderController.js";
const OrderRoutes = Router()
OrderRoutes.get('/',GetOrdersByStatus)
OrderRoutes.get('/:id',GetOrdersById)
OrderRoutes.post('/',CreateOrder)
OrderRoutes.patch('/:id',PlaceOrder)
OrderRoutes.patch('/cancel/:id',CancelOrder)
OrderRoutes.delete('/delete/:id',DeleteOrder)
export default OrderRoutes