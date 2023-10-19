import { DataTypes } from "sequelize";
import AzureMySqlSequelize from "../Utils/AzureMySqlSequelize.js";
const Admin = AzureMySqlSequelize.define('Admin',
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
export default Admin