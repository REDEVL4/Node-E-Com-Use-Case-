import { DataTypes } from "sequelize";
import AzureMySqlSequelize from "../Utils/AzureMySqlSequelize.js";

const Order = AzureMySqlSequelize.define('Order',
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
        values:["pending","placed","fulfillmint","shipping","successful","cancelled"],
        defaultValue:"pending",
        allowNull:false
    },
    TotalCost:
    {
        type:DataTypes.DOUBLE,
        allowNull:false,
        defaultValue:0
    }
})
export default Order