import { DataTypes } from "sequelize"
import AzureMySqlSequelize from "../Utils/AzureMySqlSequelize.js"
const WarehouseOrderSellers = AzureMySqlSequelize.define('WarehouseOrderSellers',
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
    WarehouseOrderStatus:
    {
        type:DataTypes.STRING,
        values:["package request recived from warehouse","waiting for the product to to be picked up","product picked up successfully"],
        allowNull:false
    },
    SellerShareInTotalCosting:
    {
        type:DataTypes.DOUBLE,
        allowNull: false,
        defaultValue: 0.0  
    },
    WarehouseOrderTableId:
    {
        type:DataTypes.UUID,
        references:
        {
            model:"WarehouseOrders",
            key:"Id"
        }
    }
})
export default WarehouseOrderSellers