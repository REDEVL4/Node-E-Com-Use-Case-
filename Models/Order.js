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
        values:["pending","placed","In shipment","shipped","successful","cancelled","return initiated","return successful"],
        defaultValue:"pending",
        allowNull:false
    },
    WarehouseStatus:
    {
        type:DataTypes.STRING,
        values:["to be exported","exported","fulfilled"],
        defaultValue:"to be exported",
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