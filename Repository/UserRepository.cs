using Dapper;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using static Repository.UserRepository;

namespace Repository
{
    public interface IUserRepository
    {
        User Login(string username, string password);
    }
    public class UserRepository : IUserRepository
    {
        private IConfiguration _configuration;
        public UserRepository(IConfiguration configuration) => _configuration = configuration;

        public User Login(string username, string password)
        {
            var connection = new SqlConnection(_configuration.GetConnectionString("DefaultConnection"));
            var aaa = BCrypt.Net.BCrypt.HashPassword(password);
            var query = "SELECT * FROM Users WHERE Username = @usr AND IsActive = 1";
            User user =  connection.QueryFirstOrDefault<User>(query, new { usr = username, pwd = password });
            if(user != null)
            {
                bool verified = BCrypt.Net.BCrypt.Verify(password, user.Password);
                return verified ? user : null;
            } 
            else
            {
                return null;
            }
        }

        public class User
        {
            public int? Id { get; set; }
            public string Username { get; set; }
            public string Password { get; set; }
            public string? Fullname { get; set; }
            public Boolean? IsActive { get; set; }
        }

    }
}
