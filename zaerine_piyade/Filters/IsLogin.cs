using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace zaerine_piyade.Filters
{
    public class IsLogin : Attribute, IAuthorizationFilter
    {

        public void OnAuthorization(AuthorizationFilterContext context)
        {
            var isAuthorized = CheckUserPermission(context.HttpContext.User);
            if (!isAuthorized)
            {
                context.Result = new UnauthorizedResult();
            }
        }

        private bool CheckUserPermission(ClaimsPrincipal user)
        {
            string name = user.FindFirstValue(ClaimTypes.Name);
            return name == null ? false : true;
        }

    }
}
