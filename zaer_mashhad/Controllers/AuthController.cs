using System.Data.SqlClient;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Dapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;

namespace WebApiJSONWebToken.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IConfiguration _configuration;

        public AuthController(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        [HttpPost]
        [ProducesResponseType(200, Type = typeof(JwtSecurityTokenHandler))]
        [ProducesResponseType(400)]
        public IActionResult Post([FromBody] User userParam)
        {
            var user = Login(userParam.Username, userParam.Password);

            if (user == null)
                return BadRequest(new { message = "Username or password is incorrect" });


            var userRole = "Admin";

            var secretKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes("MySecretKey010203")
            );

            var signinCredentials = new SigningCredentials(
                secretKey,
                SecurityAlgorithms.HmacSha256
            );

            var tokenOptions = new JwtSecurityToken(
                claims: new List<Claim>
                {
                    new Claim(ClaimTypes.Name, user.Username),
                    new Claim(ClaimTypes.Role, userRole)
                },
                expires: DateTime.Now.AddDays(2),
                signingCredentials: signinCredentials
            );

            var tokenString = new JwtSecurityTokenHandler()
                .WriteToken(tokenOptions);

            return Ok(new { Token = tokenString });
        }


        private User Login(string username, string password)
        {
            using var connection = new SqlConnection(
                _configuration.GetConnectionString("DefaultConnection")
            );

            var query = @"
                SELECT *
                FROM Users
                WHERE Username = @usr
                AND IsActive = 1";

            var user = connection.QueryFirstOrDefault<User>(
                query,
                new { usr = username }
            );

            if (user == null)
                return null;

            bool verified = BCrypt.Net.BCrypt.Verify(
                password,
                user.Password
            );

            return verified ? user : null;
        }


        [HttpGet("gethash/{value}")]
        public ActionResult<string> GetHash(string value)
        {
            return BCrypt.Net.BCrypt.HashPassword(value);
        }


        public class User
        {
            public int? Id { get; set; }

            public string Username { get; set; }

            public string Password { get; set; }

            public string? Fullname { get; set; }

            public bool? IsActive { get; set; }
        }
    }
}