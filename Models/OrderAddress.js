import { DataTypes, Sequelize } from "sequelize";
import AzureMySqlSequelize from "../Utils/AzureMySqlSequelize.js";
const OrderAddress = AzureMySqlSequelize.define('OrderAddress',
{
     Id:
      {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull:false,
        defaultValue:DataTypes.UUIDV4  
      },
      AddressLine1: {
        type: DataTypes.STRING,
      },
      AddressLine2: {
        type: DataTypes.STRING,
      },
      ZipCode: {
        type: DataTypes.STRING,
      },
      City: {
        type: DataTypes.STRING,
      },
      State: {
        type: DataTypes.STRING,
      },
      Country: {
        type: DataTypes.STRING,
      },
      OrderId:
      {
        type:DataTypes.UUID,
        primaryKey:true,
        references:
        {
            model:'Orders',
            key:'Id'
        }
      }
})
export default OrderAddress