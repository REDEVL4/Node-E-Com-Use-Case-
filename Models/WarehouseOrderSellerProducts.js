import { DataTypes } from "sequelize"
import AzureMySqlSequelize from "../Utils/AzureMySqlSequelize.js"
const WarehouseOrderSellerProducts = AzureMySqlSequelize.define('WarehouseOrderSellerProducts',
{
    Id:
    {
        type:DataTypes.UUID,
        primaryKey:true,
        allowNull:false,
        defaultValue:DataTypes.UUIDV4
    },
    ProductId:
    {
        type:DataTypes.UUID,
        references:
        {
            model:"Sellers",
            key:"Id"
        }
    },
    ProductQuantity:
    {
        type:DataTypes.INTEGER
    },
    ProductTotalCost:
    {
        type:DataTypes.DOUBLE
    },
    WarehouseOrderSellersTableId:
    {
        type:DataTypes.UUID,
        references:
        {
            model:"WarehouseOrderSellers",
            key:"Id"
        }
    }
})
export default WarehouseOrderSellerProducts