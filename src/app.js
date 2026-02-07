import express from "express"
import cookieParser from "cookie-parser"
import cors from "cors"

const app = express()
app.use(cors({
    origin : process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended:true,limit:"16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

import userRouter from './routes/user.routes.js' // 
import inventoryRouter from './routes/inventory.routes.js'
import requestRouter from './routes/request.routes.js' 
import deliveryRouter from './routes/delivery.routes.js';
import labRouter from './routes/lab.routes.js';
import campRouter from './routes/camp.routes.js';

// ROUTES DECLARATION
app.use("/api/v1/users", userRouter) 
app.use("/api/v1/inventory", inventoryRouter) 
app.use("/api/v1/requests", requestRouter)
app.use("/api/v1/delivery", deliveryRouter);
app.use("/api/v1/lab", labRouter);   
app.use("/api/v1/camps", campRouter);

export {app}