const asyncHandler = (requestHandler) =>{
    return (req,res,next) =>{
        Promise.resolve(requestHandler(req,res,next)).
        catch((err) => next(err))
    }
}

export {asyncHandler}

/*
Basic Async handler Looks like this :
const asyncHandler = () =>{}

Async Handler with funtion looks like this :
const asyncHandler = (fn) => (//Yaha Execution hoga function ka )=> {}

--> Ye try catch wala method h 
const asyncHandler = (fn) => async (req, res, next)=> {  //Interesting Higher Order Function ye kisi function ko Variable ki tarah acccept kr skte h 
    try{
        await fn(req, res, next)
    }
    catch (error) {
        res.status(error.code || 500).json({
            sucess:false,
            message:error.message
        })

    }
} 
*/

