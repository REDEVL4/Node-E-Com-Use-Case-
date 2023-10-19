import { DataTypes } from "sequelize";
import AzureMySqlSequelize from "../Utils/AzureMySqlSequelize.js";
const SellerProducts = AzureMySqlSequelize.define('SellerProducts',
{
    Id:
    {
        type:DataTypes.UUID,
        primaryKey:true,
        allowNull:false,
        defaultValue:DataTypes.UUIDV4
    },
    Quantity:
    {
        type:DataTypes.INTEGER,
        defaultValue:0
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
    ProductId:
    {
        type:DataTypes.UUID,
        references:
        {
            model:"Products",
            key:"Id"
        }
    },
    IsWithSeller:
    {
        type:DataTypes.BOOLEAN,
        defaultValue: false
    }
})
export default SellerProducts