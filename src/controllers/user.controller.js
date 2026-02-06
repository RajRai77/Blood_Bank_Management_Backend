import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async(userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}
    } catch (error) {
        console.log("❌ JWT ERROR:", error);
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}

const loginUser = asyncHandler(async (req, res) => {
    // 1. Get data from body
    const { email, password } = req.body;

    // 2. Validation
    if (!email || !password) {
        throw new ApiError(400, "Email and password are required");
    }

    // 3. Find User
    const user = await User.findOne({ email });
    if (!user) {
        throw new ApiError(404, "User does not exist");
    }

    // 4. Check Password
    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials");
    }

    // 5. Generate Tokens
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    // 6. Security: Remove sensitive info before sending response
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    // 7. Set Cookies options
    const options = {
        httpOnly: true,
        secure: true
    };

    // 8. Send Response
    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200, 
                {
                    user: loggedInUser, 
                    accessToken, 
                    refreshToken
                },
                "User logged In Successfully"
            )
        );
});

const logoutUser = asyncHandler(async(req, res) => {
    // We will need a middleware to get req.user, but for now let's just clear cookies
    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out"))
});

// We can add registerUser later if needed for admin panel
export { loginUser, logoutUser };