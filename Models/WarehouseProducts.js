import { DataTypes } from "sequelize";
import AzureMySqlSequelize from "../Utils/AzureMySqlSequelize.js";
const WarehouseProducts = AzureMySqlSequelize.define('WarehouseProducts',
{
    // Id:
    // {
    //     type:DataTypes.UUID,
    //     allowNull:false,
    //     primaryKey: true,
    //     defaultValue: DataTypes.UUID
    // }, 
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
    WarehouseId:
    {
        type:DataTypes.UUID,
        allowNull:false,
        references:
        {
            model:'Warehouse',
            key:'Id'
        }
    },
    Quantity:
    {
        type:DataTypes.INTEGER,
        defaultValue:0
    }   
})
export default WarehouseProducts