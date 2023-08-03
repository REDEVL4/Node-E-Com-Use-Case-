import { DataTypes } from "sequelize"
import AzureMySqlSequelize from "../Utils/AzureMySqlSequelize.js"
const WarehouseSellers = AzureMySqlSequelize.define('WarehouseSellers',
{
    Id:
    {
        type:DataTypes.UUID,
        primaryKey:true,
        allowNull:false,
        defaultValue:DataTypes.UUIDV4
    },
    SellerId:
    {
        type:DataTypes.UUID,
        references:
        {
            model:"Sellers",
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
export default WarehouseSellers