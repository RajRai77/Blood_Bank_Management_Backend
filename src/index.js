import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";
import { createServer } from "http";
import { Server } from "socket.io";
import { Request } from "./models/request.model.js"; // <--- IMPORT MODEL

dotenv.config({ path: './.env' });

const httpServer = createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: process.env.CORS_ORIGIN || "*",
        methods: ["GET", "POST"]
    }
});

io.on("connection", (socket) => {
    // console.log("🔌 New Client Connected:", socket.id);

    socket.on("join_tracking", (orderId) => {
        socket.join(orderId);
    });

    // --- CRITICAL UPDATE: Handle Location & DB Update ---
    socket.on("send_location", async (data) => {
        const { orderId, latitude, longitude } = data;
        
        // 1. Broadcast Location (for the Map)
        io.to(orderId).emit("update_location", { latitude, longitude });

        // 2. Update Database & Notify Dashboard (One-time trigger)
        try {
            // We verify if we need to update the DB status
            // This ensures the UI switches instantly
            const req = await Request.findById(orderId);
            if (req && !req.deliveryDetails.trackingStarted) {
                
                req.deliveryDetails.trackingStarted = true;
                req.deliveryDetails.startedAt = new Date();
                await req.save({ validateBeforeSave: false });

                // Tell the Dashboard: "Hey! This order just went live!"
                io.emit("tracking_started", { orderId });
                console.log(`✅ Tracking activated for: ${orderId}`);
            }
        } catch (error) {
            console.error("Socket DB Update Error:", error);
        }
    });

    socket.on("disconnect", () => {
        // console.log("Client Disconnected");
    });
});

connectDB()
    .then(() => {
       httpServer.listen(process.env.PORT || 8000, "0.0.0.0", () => {
        console.log(`⚙️ Server running at port: ${process.env.PORT}`);
        console.log(`📡 Accessible on Network at: http://${process.env.IP_ADDRESS || "YOUR_LAPTOP_IP"}:8000`);
    });
    })
    .catch((err) => {
        console.log("MONGO db connection failed !!! ", err);
    });

export { io };