import { DataTypes } from "sequelize"
import AzureMySqlSequelize from "../Utils/AzureMySqlSequelize.js"
const OrdersWarehouses = AzureMySqlSequelize.define('OrdersWarehouses',
{
    Id:
    {
        type:DataTypes.UUID,
        primaryKey:true,
        allowNull:false,
        defaultValue:DataTypes.UUIDV4
    },
    OrderId:
    {
        type:DataTypes.UUID,
        references:
        {
            model:"Orders",
            key:"Id"
        }
    },
    WarehouseId:
    {
        type:DataTypes.UUID,
        references:
        {
            model:"Warehouses",
            key:"Id"
        }
    }
})
export default OrdersWarehouses