

using Dapper;
using Microsoft.Extensions.Configuration;
using System.Data.SqlClient;

namespace Repository
{
    public interface IZaerRepository
    {
        List<TrafficOutputDto> TrafficRegistration(int ZaerId);
        List<TeamReportDto> TeamReport();
        int SaveZaer(ZaerModel model);
        int deleteZaer(int Id);
    }

    public class ZaerRepository : IZaerRepository
    {
        private readonly IConfiguration _configuration;

        public ZaerRepository(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public List<TrafficOutputDto> TrafficRegistration(int ZaerId)
        {
            var connection = new SqlConnection(_configuration.GetConnectionString("DefaultConnection"));

            string currentDate = DateTime.Now.ToString("yyyy/mm/ddTHH:mm:ss");
            string insertQuery = "INSERT INTO Traffic (ZaerId, Date) Values(@ZaerId, @Date)";
            int id = connection.Execute(insertQuery, new { ZaerId = ZaerId, Date = DateTime.Now });

            string selectQuery = @"SELECT 
                                        Z.Id, 
                                        Z.Fullname, 
                                        Z.NationalCode, 
                                        Z.Sex, 
                                        Z.Team, 
                                        Z.TeamAdmin, COUNT(Traffic.ZaerId) as Total 
                                        FROM Zaer as Z LEFT JOIN Traffic ON Traffic.ZaerId = Z.Id 
                                        WHERE Z.Id = @Id GROUP BY Z.Id, Z.Fullname, Z.NationalCode, Z.Sex, Z.Team, Z.TeamAdmin";


            List<TrafficOutputDto> trafficInfo = connection.Query<TrafficOutputDto>(selectQuery, new { Id = ZaerId }).ToList();

            if (trafficInfo.Count() != 0)
            {
                string selectTrafficQuery = "SELECT Date FROM Traffic WHERE ZaerId = @Id  ORDER BY Date DESC";
                List<DateList> trafficList = connection.Query<DateList>(selectTrafficQuery, new { Id = ZaerId }).ToList();
                trafficInfo[0].Traffic = trafficList;
            }


            return trafficInfo;
        }

        public List<TeamReportDto> TeamReport()
        {
            var connection = new SqlConnection(_configuration.GetConnectionString("DefaultConnection"));
            string selectQuery = @"select Z.Team,Z.Sex, COUNT(T.ZaerId) as TotalTraffic,
                                    COUNT(distinct(T.ZaerId)) as TotalRegister,

                                    (select COUNT(cnt) as cnt from (select 1 as cnt from Traffic
                                     where ZaerId in (select Id from Zaer where Team = Z.Team and sex = Z.Sex)
                                     group by ZaerId
                                     HAVING  COUNT(Traffic.Id) % 2 = 1) as tb1) as TotalInside,


                                    COUNT(DISTINCT Z.Id) TotalZaer FROM Zaer as Z
                                    LEFT JOIN Traffic as T on T.ZaerId=Z.Id
                                    GROUP BY Z.Team,Z.Sex";


            List<TeamReportDto> result = connection.Query<TeamReportDto>(selectQuery).ToList();

            return result;
        }

        public int deleteZaer(int Id)
        {
            var connection = new SqlConnection(_configuration.GetConnectionString("DefaultConnection"));

            string deleteZaer = "DELETE Zaer WHERE Id = @Id";
            string deleteTraffic = "DELETE Traffic WHERE ZaerId = @Id";

            connection.Execute(deleteTraffic, new { Id = Id });
            connection.Execute(deleteZaer, new { Id = Id });

            return Id;
        }

        public int SaveZaer(ZaerModel model)
        {
            var connection = new SqlConnection(_configuration.GetConnectionString("DefaultConnection"));


            model.Fullname = model.Fullname == null ? "NULL" : $"N'{model.Fullname}'";
            model.NationalCode = model.NationalCode == null ? "NULL" : $"N'{model.NationalCode}'";
            model.Sex = model.Sex == null ? 2 : model.Sex;
            model.Team = model.Team == null ? "NULL" : $"N'{model.Team}'";
            model.TeamAdmin = model.TeamAdmin == null ? "NULL" : $"N'{model.TeamAdmin}'";

            string query = "";
            int result = model.Id != null ? (model.Id ?? default(int)) : 0;

            if (model.Id == null)
            {
                query = $@"INSERT INTO Zaer (Fullname, NationalCode, Sex, Team, TeamAdmin)
                                OUTPUT INSERTED.Id
                                VALUES( {model.Fullname}, {model.NationalCode}, {model.Sex}, {model.Team}, {model.TeamAdmin})";
                var id = connection.QuerySingle<int>(query);
                result = id;
            }
            else
            {
                query = $@"UPDATE Zaer SET Fullname = {model.Fullname}, NationalCode = {model.NationalCode}, Sex = {model.Sex}, Team = {model.Team}, TeamAdmin = {model.TeamAdmin} WHERE id = {model.Id}";
                connection.Execute(query);

            }

            return result;
        }

    }

    public class ZaerModel
    {
        public int? Id { get; set; } = null;
        public string? Fullname { get; set; }
        public string? NationalCode { get; set; }
        public int? Sex { get; set; }
        public string? Team { get; set; }
        public string? TeamAdmin { get; set; }
    }


    public class DateList
    {
        public DateTime Date { get; set; }
    }

    public class TrafficOutputDto
    {
        public int? Id { get; set; }
        public string? Fullname { get; set; }
        public string? NationalCode { get; set; }
        public Int16 Sex { get; set; }
        public string? Team { get; set; }
        public string? TeamAdmin { get; set; }
        public int Total { get; set; }
        public List<DateList>? Traffic { get; set; }
    }

    public class TrafficWithSexDto
    {
        public Int16 Sex { get; set; }
        public int Total { get; set; }
    }

    public class TotalDto
    {
        public int Total { get; set; }
    }

    public class TeamReportDto
    {
        public string? Team { get; set; }
        public int Sex { get; set; }
        public int TotalTraffic { get; set; }
        public int TotalRegister { get; set; }
        public int TotalInside { get; set; }
        public int TotalZaer { get; set; }
    }

}