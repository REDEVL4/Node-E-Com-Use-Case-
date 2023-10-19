import { DataTypes } from "sequelize"
import AzureMySqlSequelize from "../Utils/AzureMySqlSequelize.js";
const OrderProducts = AzureMySqlSequelize.define('OrderProducts',
{
    WarehouseId:
    {
        type:DataTypes.UUID,
        allowNull: false
    },
    ProductId:
    {
        type:DataTypes.UUID,
        allowNull:false,
        references:
        {
            model:'Products',
            key:'Id'
        }
    },
    OrderId:
    {
        type:DataTypes.UUID,
        allowNull:false,
        references:
        {
            model:'Orders',
            key:'Id'
        }
    },
    Quantity:
    {
        type:DataTypes.INTEGER,
        defaultValue:0
    }
})
export default OrderProducts