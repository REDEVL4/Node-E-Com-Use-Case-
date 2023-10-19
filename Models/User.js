import { DataTypes } from "sequelize";
import AzureMySqlSequelize from "../Utils/AzureMySqlSequelize.js";
const User = AzureMySqlSequelize.define(
  "User",
  {
    Id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull:false,
      defaultValue:DataTypes.UUIDV4
    },
    FirstName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    LastName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    PreferredName:
    {
        type: DataTypes.STRING
    },
    Age: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    UserName:
    {
        type:DataTypes.STRING,
        allowNull:false,
        primaryKey:true
    },
    Email:
    {
        type:DataTypes.STRING,
        allowNull:false,
        unique:true
    },
    MobileNumber:
    {
        type:DataTypes.STRING,
        allowNull:false,
        // unique:true
    },
    isActive:
    {
        type:DataTypes.BOOLEAN,
        defaultValue:false
    },
    kycVerified:
    {
        type:DataTypes.BOOLEAN,
        defaultValue:false
    },
    PasswordHash:
    {
        type:DataTypes.STRING,
        allowNull:false,
    },
    IsSeller:
    {
      type:DataTypes.BOOLEAN,
      defaultValue:false      
    },
    IsAdmin:
    {
      type:DataTypes.BOOLEAN,
      defaultValue:false      
    }
  },
  { timestamps: true }
);

export default User;
