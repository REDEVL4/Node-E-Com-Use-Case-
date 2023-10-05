import { DataTypes } from "sequelize"
import AzureMySqlSequelize from "../Utils/AzureMySqlSequelize.js";

const CartProducts = AzureMySqlSequelize.define('CartProducts',
{
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
    CartId:
    {
        type:DataTypes.UUID,
        allowNull:false,
        references:
        {
            model:'Carts',
            key:'Id'
        }
    },
    IsAvailableInStock:
    {
        type:DataTypes.BOOLEAN,
        defaultValue:1
    },
    Quantity:
    {
        type:DataTypes.INTEGER,
        defaultValue:0
    }
})
export default CartProducts