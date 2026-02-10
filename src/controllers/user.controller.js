import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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

const registerUser = asyncHandler(async (req, res) => {
    // 1. Get data
    const { name, email, password, role, phone, address, website } = req.body;

    // 2. Validation
    if ([name, email, password, role].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "Name, Email, Password, and Role are required");
    }

    // 3. Check if user exists
    const existedUser = await User.findOne({ 
        $or: [{ email }, { name }] 
    });

    if (existedUser) {
        throw new ApiError(409, "User with email or name already exists");
    }

    // --- FIX: Prepare Data Object ---
    // We create a flexible object first
    const userData = {
        name,
        email,
        password,
        role,
        phone,
        address,
        website
    };

    // CRITICAL FIX: Map 'name' to 'hospitalName' if the role is hospital
    // This satisfies the Mongoose Validator requirement
    if (role === "hospital") {
        userData.hospitalName = name;
    }
    
    // If your schema has 'organizationName' for admins, you can add that too:
    if (role === "admin" || role === "organization") {
        userData.organizationName = name;
    }

    // 4. Create User using the prepared object
    const user = await User.create(userData);

    // 5. Remove sensitive info
    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user");
    }

    // 6. Send Response
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    );
});

// --- Existing Login Logic ---
const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new ApiError(400, "Email and password are required");
    }

    const user = await User.findOne({ email });
    if (!user) {
        throw new ApiError(404, "User does not exist");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: true
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200, 
                { user: loggedInUser, accessToken, refreshToken },
                "User logged In Successfully"
            )
        );
});

// --- Existing Logout Logic ---
const logoutUser = asyncHandler(async(req, res) => {
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

// --- NEW: Get Current User ---
const getCurrentUser = asyncHandler(async(req, res) => {
    return res
    .status(200)
    .json(new ApiResponse(
        200, 
        { user: req.user }, // Returns the user from the JWT token
        "User fetched successfully"
    ))
});

// --- NEW: Get All Hospitals (For Request Modal) ---
const getHospitals = asyncHandler(async (req, res) => {
    // Find all users who are marked as 'hospital'
    const hospitals = await User.find({ role: "hospital" })
        .select("name email phone address website"); 

    return res.status(200).json(new ApiResponse(200, hospitals, "Hospitals Fetched Successfully"));
});

export { loginUser, logoutUser, registerUser, getHospitals, getCurrentUser};