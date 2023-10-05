import { Router } from "express";
import { GetAllWarehouses,GetWarehousesById,CreateWarehouse,UpdateWarehouse,DeleteWarehouse,CreateWarehouseInbulk, GetAllWarehouseSellers, AssociateSellerWithWarehouse, GetMyAssociatedWarehouses} from "../Controllers/WarehouseController.js";
const WarehouseRoutes = Router()
WarehouseRoutes.get('/associate',GetMyAssociatedWarehouses)
WarehouseRoutes.get('/sellers/:id',GetAllWarehouseSellers)
WarehouseRoutes.get('/:id',GetWarehousesById)
WarehouseRoutes.get('/',GetAllWarehouses)
WarehouseRoutes.post('/bulk',CreateWarehouseInbulk)
WarehouseRoutes.post('/',CreateWarehouse)
WarehouseRoutes.post('/associate/:warehouseId',AssociateSellerWithWarehouse)
WarehouseRoutes.patch('/:id',UpdateWarehouse)
WarehouseRoutes.delete('/:id',DeleteWarehouse)
export default WarehouseRoutes