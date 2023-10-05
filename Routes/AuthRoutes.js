import { Router } from "express";
import {Login,LogOut,generateToken} from '../Controllers/AuthController.js'
const AuthRoutes = Router()
AuthRoutes.post('/generateToken',generateToken)
AuthRoutes.post('/login',Login)
AuthRoutes.post('/logout',LogOut)
export default AuthRoutes