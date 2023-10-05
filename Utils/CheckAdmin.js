const CheckAdmin = (req,res,next)=>
{
    try
    {
        if(req.session.isLoggedIn==true && req.session.IsSeller)
        {
            return next()
        }
        else
        {
            return res.redirect('/')
        }
    }
    catch(err)
    {
        console.log(err.message)
        return res.redirect('/')
    }
}
export default CheckAdmin