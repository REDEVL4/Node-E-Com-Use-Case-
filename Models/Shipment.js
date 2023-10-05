import { DataTypes } from "sequelize";
import AzureMySqlSequelize from "../Utils/AzureMySqlSequelize.js";
const Shipment = AzureMySqlSequelize.define('Shipment',
{
    Id:
    {
        type:DataTypes.UUID,
        primaryKey:true,
        defaultValue:DataTypes.UUIDV4
    },
    Status:
    {
        type:DataTypes.STRING,
        values:["initiated","to be shipped","shipped","to be delivered","delivered","cancelled"],
        allowNull:false
    },
    UserId:
    {
        type:DataTypes.UUID,
        references:
        {
            model:'Users',
            key:'Id'
        }
    },
    OrderId:
    {
        type:DataTypes.UUID,
        references:
        {
            model:'Orders',
            key:'Id'
        }
    },
    
})
export default Shipment