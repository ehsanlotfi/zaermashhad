using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using BCrypt.Net;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using Repository;
using static Repository.UserRepository;

namespace WebApiJSONWebToken.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IUserRepository _user;

        public AuthController(IUserRepository user)
        {
            _user = user;
        }

        [HttpPost]
        [ProducesResponseType(200, Type = typeof(JwtSecurityTokenHandler))]
        [ProducesResponseType(400)]
        public IActionResult Post([FromBody] User userParam)
        {
            var user = _user.Login(userParam.Username, userParam.Password);

            if (user == null)
                return BadRequest(new { message = "Username or password is incorrect" });


            var userRole = "Admin";

            var secretKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes("MySecretKey010203"));
            var signinCredentials = new SigningCredentials(secretKey, SecurityAlgorithms.HmacSha256);

            var tokenOptions = new JwtSecurityToken(
                claims: new List<Claim> {
                    new Claim(ClaimTypes.Name, user.Username),
                    new Claim(ClaimTypes.Role, userRole)
                },
                expires: DateTime.Now.AddDays(2),
                signingCredentials: signinCredentials
            );

            var tokenString = new JwtSecurityTokenHandler().WriteToken(tokenOptions);

            return Ok(new { Token = tokenString });

        }

        [HttpGet("gethash/{value}")]
        public ActionResult<string> GetHash(string value)
        {
            return BCrypt.Net.BCrypt.HashPassword(value);
        }
    }
}