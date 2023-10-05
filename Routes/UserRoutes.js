import { Router } from "express";
import {SignInGet,GetAllUsers,GetUserById,CreateUser,UpdateUser,DeleteUser,CreateBulkUsers, getVerificationCode, verifyUserEmailPost} from "../Controllers/UserController.js"
const UserRoutes = Router()
UserRoutes.get('/',GetAllUsers)
UserRoutes.get('/code/:id',getVerificationCode)
UserRoutes.get('/:id',GetUserById)
UserRoutes.post('/',CreateUser)
UserRoutes.post('/verifyCode/:code',verifyUserEmailPost)
UserRoutes.post('/bulk',CreateBulkUsers)
UserRoutes.put('/:id',UpdateUser)
UserRoutes.delete('/:id',DeleteUser)
export default UserRoutes