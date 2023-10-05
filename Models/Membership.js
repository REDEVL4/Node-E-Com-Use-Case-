import { DataTypes } from "sequelize";
import sequelize from "../Utils/sequelize.js";
// import MsSqlSequelize from "../Utils/MsSqlSequelize.js";
// import MySqlSequelize from "../Utils/MySqlSequelize.js";
import AzureMySqlSequelize from "../Utils/AzureMySqlSequelize.js";
import User from "./User.js";

const Membership = AzureMySqlSequelize.define('Membership',
{
    Id:
    {
        type:DataTypes.UUID,
        primaryKey:true,
        allowNull:false,
        defaultValue:DataTypes.UUIDV4
    }, 
    StartDate:
    {
        type:DataTypes.DATE,
        allowNull:false,
    },
    EndDate:
    {
        type:DataTypes.DATE,
        allowNull:false,
    },
    Status:
    {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    UserId:
    {
        type:DataTypes.UUID,
        allowNull:false,
        references:
        {
            model:'Users',
            key:'Id'
        }
    },
},{})
export default Membership