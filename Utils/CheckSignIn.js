const CheckSignIn = (req,res,next)=>
{
    try
    {
        if(req.session.isLoggedIn==true && (req.session.userId && req.session.UserName && req.session.Password))
        {
            return next()
        }
        else
        {
            return res.redirect('/shop/users/signIn')
        }
    }
    catch(err)
    {
        return res.redirect('/shop/users/signIn')
    }
}
export default CheckSignIn