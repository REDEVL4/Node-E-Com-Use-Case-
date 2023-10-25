import { DataTypes } from "sequelize"
import AzureMySqlSequelize from "../Utils/AzureMySqlSequelize.js"
const WarehouseOrder = AzureMySqlSequelize.define('WarehouseOrder',
{
    Id:
    {
        type:DataTypes.UUID,
        primaryKey:true,
        allowNull:false,
        defaultValue:DataTypes.UUIDV4
    },
    Status:
    {
        type:DataTypes.STRING,
        values:["initiated","to be checked for availability","availability confirmed","package request sent to seller","waiting to to be picked up from seller","shipping initiated","shipping in progress","shipped successfully","successful","cancelled"],
        defaultValue:"initiated",
        allowNull:false
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
})
export default WarehouseOrder