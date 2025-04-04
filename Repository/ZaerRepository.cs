﻿

using Dapper;
using Microsoft.Extensions.Configuration;
using System.Data.SqlClient;

namespace Repository
{
    public interface IZaerRepository
    {
        List<TrafficOutputDto> TrafficRegistration(string NationalCode);
        List<TeamReportDto> TeamReport();
        List<ZaerModel> ZaerList(int id);
        int SaveZaer(ZaerModel model);
        int deleteZaer(string Id);
    }

    public class ZaerRepository : IZaerRepository
    {
        private readonly IConfiguration _configuration;

        public ZaerRepository(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public List<TrafficOutputDto> TrafficRegistration(string Barcode)
        {
            var connection = new SqlConnection(_configuration.GetConnectionString("DefaultConnection"));
            string insertQuery = "INSERT INTO Traffic (Barcode, Date) Values(@Barcode, @Date)";
            int id = connection.Execute(insertQuery, new { Barcode = Barcode, Date = DateTime.Now });

            string selectQuery = @"SELECT 
                                        Z.Id, 
                                        Z.Fullname, 
                                        Z.NationalCode, 
                                        Z.Sex, 
                                        Z.Image, 
                                        Z.CaravanId, 
                                        COUNT(Traffic.Barcode) as Total 
                                        FROM Zaer as Z LEFT JOIN Traffic ON Traffic.Barcode = Z.Id 
                                        WHERE Z.Id = @Barcode GROUP BY Z.Id, Z.Fullname, Z.NationalCode, Z.Sex, Z.Image, Z.CaravanId";


            List<TrafficOutputDto> trafficInfo = connection.Query<TrafficOutputDto>(selectQuery, new { Barcode = Barcode }).ToList();

            if (trafficInfo.Count() != 0)
            {
                string selectTrafficQuery = "SELECT Date FROM Traffic WHERE Barcode = @Barcode  ORDER BY Date DESC";
                List<DateList> trafficList = connection.Query<DateList>(selectTrafficQuery, new { Barcode = Barcode }).ToList();
                trafficInfo[0].Traffic = trafficList;
            }


            return trafficInfo;
        }

        public List<ZaerModel> ZaerList(int id)
        {
            var connection = new SqlConnection(_configuration.GetConnectionString("DefaultConnection"));
            string selectQuery = $@"SELECT  Id, Fullname, NationalCode, Sex, CaravanId, Image  FROM Zaer WHERE CaravanId = {id} ORDER BY Id DESC";
            List<ZaerModel> result = connection.Query<ZaerModel>(selectQuery).ToList();
            return result;
        }
        
        public List<TeamReportDto> TeamReport()
        {
            var connection = new SqlConnection(_configuration.GetConnectionString("DefaultConnection"));
            string selectQuery = @"select Z.CaravanId,Z.Sex, COUNT(T.Barcode) as TotalTraffic,
                                    COUNT(distinct(T.Barcode)) as TotalRegister,

                                    (select COUNT(cnt) as cnt from (select 1 as cnt from Traffic
                                     where Barcode in (select Id from Zaer where CaravanId = Z.CaravanId and sex = Z.Sex)
                                     group by Barcode
                                     HAVING  COUNT(Traffic.Id) % 2 = 1) as tb1) as TotalInside,


                                    COUNT(DISTINCT Z.Id) TotalZaer FROM Zaer as Z
                                    LEFT JOIN Traffic as T on T.Barcode=Z.Id
                                    GROUP BY Z.CaravanId,Z.Sex";


            List<TeamReportDto> result = connection.Query<TeamReportDto>(selectQuery).ToList();

            return result;
        }

        public int deleteZaer(string Id)
        {
            var connection = new SqlConnection(_configuration.GetConnectionString("DefaultConnection"));

            string deleteZaer = "DELETE Zaer WHERE Id = @Id";
            string deleteTraffic = "DELETE Traffic WHERE Barcode = @Id";

            try
            {
                connection.Execute(deleteTraffic, new { Id = Id });
                connection.Execute(deleteZaer, new { Id = Id });
                return 1;
            }
            catch (Exception)
            {
                return 0;
                throw;
            }
        }

        public int SaveZaer(ZaerModel model)
        {
            var connection = new SqlConnection(_configuration.GetConnectionString("DefaultConnection"));


            model.Fullname = model.Fullname == null ? "NULL" : $"N'{model.Fullname}'";
            model.NationalCode = model.NationalCode == null ? "NULL" : $"N'{model.NationalCode}'";
            model.Sex = model.Sex == null ? 1 : model.Sex;
            model.CaravanId = model.CaravanId == null ? 1 : model.CaravanId;

            string query = 
                $@"IF EXISTS (SELECT 1 FROM Zaer WHERE Id = {model.Id})
                BEGIN    
                        UPDATE Zaer
                        SET Fullname = {model.Fullname}, Sex = {model.Sex}, CaravanId = {model.CaravanId}, [Image] = N'{model.Image}', [NationalCode] ={model.NationalCode}      
                        WHERE Id = {model.Id}
                END
                  ELSE
                BEGIN
                    INSERT INTO Zaer (Fullname, NationalCode, Sex, CaravanId, [Image])
                    VALUES ({model.Fullname}, {model.NationalCode}, {model.Sex}, {model.CaravanId}, N'{model.Image}')
                END";

            try
            {
                connection.Execute(query);
                return 1;
            }
            catch (Exception)
            {
                return 0;
                throw;
            }

            
        }

    }

    public class ZaerModel
    {
        public int? Id { get; set; }
        public string? Fullname { get; set; }
        public string? NationalCode { get; set; }
        public int? Sex { get; set; }
        public int? CaravanId { get; set; }
        public string? Image { get; set; }
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
        public string? Image { get; set; }
        public int? CaravanId { get; set; }
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
        public int CaravanId { get; set; }
        public int Sex { get; set; }
        public int TotalTraffic { get; set; }
        public int TotalRegister { get; set; }
        public int TotalInside { get; set; }
        public int TotalZaer { get; set; }
    }
}