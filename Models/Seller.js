import { DataTypes } from "sequelize";
import AzureMySqlSequelize from "../Utils/AzureMySqlSequelize.js";
const Seller = AzureMySqlSequelize.define('Seller',
{
    Id:
    {
        type:DataTypes.UUID,
        primaryKey:true,
        allowNull:false,
        defaultValue:DataTypes.UUIDV4
    },
    Name:
    {
        type:DataTypes.STRING,
        allowNull:false
    }

})
export default Seller