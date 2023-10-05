import { Router } from "express";
import Auth from "../Utils/Auth.js";
import { GetAllSellerProducts,GetAllProducts,GetProductById,UpdateProduct,DeleteProductById,CreateBulkProducts } from "../Controllers/ProductController.js";
const ProductRoutes = Router()
ProductRoutes.get('/seller',Auth,GetAllSellerProducts)
ProductRoutes.get('/:id',GetProductById)
ProductRoutes.get('/',GetAllProducts)
// ProductRoutes.post('/',CreateProduct)
ProductRoutes.post('/bulk',Auth,CreateBulkProducts)
ProductRoutes.put('/:id',Auth,UpdateProduct)
ProductRoutes.delete('/:id',Auth,DeleteProductById)
export default ProductRoutes