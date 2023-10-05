import { Router } from "express";
import {getUserAddressById, getUserAddress, addUserAddress, changeAddresstype} from "../Controllers/UserController.js"
const UserAddressRoutes = Router()
UserAddressRoutes.get('/',getUserAddress)
UserAddressRoutes.get('/:addressId',getUserAddressById)
UserAddressRoutes.post('/',addUserAddress)
UserAddressRoutes.patch('/:status/:userId/:addressId',changeAddresstype)
export default UserAddressRoutes