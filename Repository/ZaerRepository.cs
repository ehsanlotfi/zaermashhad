using Dapper;
using Microsoft.Extensions.Configuration;
using System.Data.SqlClient;
using OfficeOpenXml;

namespace Repository
{
    public interface IZaerRepository
    {
        List<TrafficOutputDto> TrafficRegistration(string Barcode, bool registerTraffic);
        List<TeamReportDto> TeamReport();
        object ZaerList(int id, bool excel = false);
        int SaveZaer(ZaerModel model);
        int deleteZaer(string Id);

        List<CaravanModel> CaravanList();
        int SaveCaravan(CaravanModel model);
        int DeleteCaravan(int id);
    }

    public class ZaerRepository : IZaerRepository
    {
        private readonly IConfiguration _configuration;
        private readonly UploadOptions _options;
        public ZaerRepository(IConfiguration configuration, UploadOptions options)
        {
            _configuration = configuration;
            _options = options;
        }

        public List<TrafficOutputDto> TrafficRegistration(string Barcode, bool registerTraffic = true)
        {
            using var connection = new SqlConnection(
                _configuration.GetConnectionString("DefaultConnection"));

            connection.Open();


            // بررسی وجود زائر
            var zaerExists = connection.ExecuteScalar<int>(
                "SELECT COUNT(1) FROM Zaer WHERE Id = @Barcode",
                new { Barcode });


            if (zaerExists == 0)
            {
                return new List<TrafficOutputDto>();
            }


            // ثبت تردد فقط در صورت فعال بودن
            if (registerTraffic)
            {
                connection.Execute(
                    @"INSERT INTO Traffic (Barcode, Date)
              VALUES (@Barcode, @Date)",
                    new
                    {
                        Barcode,
                        Date = DateTime.Now
                    });
            }


            var trafficInfo = connection.Query<TrafficOutputDto>(
                @"SELECT
                Z.Id,
                Z.Fullname,
                Z.NationalCode,
                Z.Sex,
                Z.CaravanId,
                COUNT(T.Id) AS Total
            FROM Zaer Z
            LEFT JOIN Traffic T
                ON T.Barcode = Z.Id
            WHERE Z.Id = @Barcode
            GROUP BY
                Z.Id,
                Z.Fullname,
                Z.NationalCode,
                Z.Sex,
                Z.CaravanId",
                new { Barcode })
                .ToList();


            if (trafficInfo.Count > 0)
            {
                string imagePath = Path.Combine(
                    _options.UploadPath,
                    $"{Barcode}.png");


                if (File.Exists(imagePath))
                {
                    trafficInfo[0].Image = $"/uploads/{Barcode}.png";
                }


                trafficInfo[0].Traffic = connection.Query<DateList>(
                    @"SELECT Date
              FROM Traffic
              WHERE Barcode = @Barcode
              ORDER BY Date DESC",
                    new { Barcode })
                    .ToList();
            }


            return trafficInfo;
        }

        public object ZaerList(int id, bool excel = false)
        {
            using var connection = new SqlConnection(
                _configuration.GetConnectionString("DefaultConnection"));


            var result = connection.Query<ZaerModel>(
                @"SELECT 
                        Id,
                        Fullname,
                        NationalCode,
                        Sex,
                        CaravanId
                    FROM Zaer
                    WHERE CaravanId = @Id
                    ORDER BY Id DESC",
                new { Id = id })
                .ToList();


            foreach (var item in result)
            {
                string imagePath = Path.Combine(
                    _options.UploadPath,
                    $"{item.Id}.png");


                if (File.Exists(imagePath))
                {
                    item.Image = $"/uploads/{item.Id}.png";
                }
            }


            if (!excel)
                return result;


            using var package = new OfficeOpenXml.ExcelPackage();

            var sheet = package.Workbook.Worksheets.Add("Zaer");


            sheet.Cells[1, 1].Value = "کد";
            sheet.Cells[1, 2].Value = "نام";
            sheet.Cells[1, 3].Value = "کد ملی";
            sheet.Cells[1, 4].Value = "جنسیت";
            sheet.Cells[1, 5].Value = "تصویر";


            int row = 2;


            foreach (var item in result)
            {
                sheet.Cells[row, 1].Value = item.Id;
                sheet.Cells[row, 2].Value = item.Fullname;
                sheet.Cells[row, 3].Value = item.NationalCode;
                sheet.Cells[row, 4].Value = item.Sex == 1 ? "مرد" : "زن";


                string file = Path.Combine(
                    _options.UploadPath,
                    $"{item.Id}.png");


                if (File.Exists(file))
                {
                    var picture = sheet.Drawings.AddPicture(
                        $"image_{item.Id}",
                        new FileInfo(file));

                    picture.SetPosition(row - 1, 5, 0, 0);
                    picture.SetSize(80, 80);

                    sheet.Row(row).Height = 65;
                }


                row++;
            }


            sheet.Cells.AutoFitColumns();


            return package.GetAsByteArray();
        }

        public List<TeamReportDto> TeamReport()
        {
            using var connection = new SqlConnection(
                _configuration.GetConnectionString("DefaultConnection"));


            string query = @"WITH TrafficSummary AS
                            (
                                SELECT
                                    Barcode,
                                    COUNT(*) AS TrafficCount,
                                    CASE 
                                        WHEN COUNT(*) % 2 = 1 THEN 1
                                        ELSE 0
                                    END AS IsInside
                                FROM Traffic
                                GROUP BY Barcode
                            )

                            SELECT
                                Z.CaravanId,
                                Z.Sex,

                                COUNT(T.Barcode) AS TotalTraffic,

                                COUNT(DISTINCT T.Barcode) AS TotalRegister,

                                COUNT(
                                    CASE 
                                        WHEN TS.IsInside = 1 THEN 1
                                    END
                                ) AS TotalInside,

                                COUNT(DISTINCT Z.Id) AS TotalZaer

                            FROM Zaer Z

                            LEFT JOIN Traffic T
                                ON T.Barcode = Z.Id

                            LEFT JOIN TrafficSummary TS
                                ON TS.Barcode = Z.Id

                            GROUP BY
                                Z.CaravanId,
                                Z.Sex
                            ";


            return connection.Query<TeamReportDto>(query).ToList();
        }

        public int deleteZaer(string Id)
        {
            using var connection = new SqlConnection(
                _configuration.GetConnectionString("DefaultConnection"));

            connection.Open();

            using var transaction = connection.BeginTransaction();

            try
            {
                // حذف ترددها
                connection.Execute(
                    "DELETE FROM Traffic WHERE Barcode = @Id",
                    new { Id },
                    transaction);


                // حذف زائر
                connection.Execute(
                    "DELETE FROM Zaer WHERE Id = @Id",
                    new { Id },
                    transaction);


                transaction.Commit();


                // حذف تصویر از فایل سیستم
                string imagePath = Path.Combine(
                    _options.UploadPath,
                    $"{Id}.png");

                if (File.Exists(imagePath))
                {
                    File.Delete(imagePath);
                }


                return 1;
            }
            catch
            {
                transaction.Rollback();
                return 0;
            }
        }

        public int SaveZaer(ZaerModel model)
        {
            using var connection = new SqlConnection(_configuration.GetConnectionString("DefaultConnection"));

            connection.Open();

            using var transaction = connection.BeginTransaction();

            try
            {
                model.Sex ??= 1;
                model.CaravanId ??= 1;

                int count = connection.ExecuteScalar<int>(
                    "SELECT COUNT(*) FROM Zaer WHERE Id=@Id",
                    new { model.Id },
                    transaction);

                if (count == 0)
                {
                    connection.Execute(@"INSERT INTO Zaer
                                        (
                                            Fullname,
                                            NationalCode,
                                            Sex,
                                            CaravanId
                                        )
                                        VALUES
                                        (
                                            @Fullname,
                                            @NationalCode,
                                            @Sex,
                                            @CaravanId
                                        )",
                    new
                    {
                        model.Id,
                        model.Fullname,
                        model.NationalCode,
                        model.Sex,
                        model.CaravanId
                    },
                    transaction);
                }
                else
                {
                    connection.Execute(@"UPDATE Zaer
                                        SET
                                            Fullname=@Fullname,
                                            NationalCode=@NationalCode,
                                            Sex=@Sex,
                                            CaravanId=@CaravanId
                                        WHERE Id=@Id",
                    new
                    {
                        model.Id,
                        model.Fullname,
                        model.NationalCode,
                        model.Sex,
                        model.CaravanId
                    },
                    transaction);
                }

                if (!string.IsNullOrWhiteSpace(model.Image))
                {
                    Directory.CreateDirectory(_options.UploadPath);

                    string base64 = model.Image;

                    int comma = base64.IndexOf(',');
                    if (comma >= 0)
                        base64 = base64[(comma + 1)..];

                    byte[] imageBytes = Convert.FromBase64String(base64);

                    string imagePath = Path.Combine(
                        _options.UploadPath,
                        $"{model.Id}.png");

                    File.WriteAllBytes(imagePath, imageBytes);
                }

                transaction.Commit();

                return 1;
            }
            catch
            {
                transaction.Rollback();
                return 0;
            }
        }

        public List<CaravanModel> CaravanList()
        {
            using var connection = new SqlConnection(
                _configuration.GetConnectionString("DefaultConnection"));


            return connection.Query<CaravanModel>(
                @"SELECT 
                Id,
                Name,
                Admin
              FROM Caravan
              ORDER BY Id DESC")
                .ToList();
        }



        public int SaveCaravan(CaravanModel model)
        {
            using var connection = new SqlConnection(
                _configuration.GetConnectionString("DefaultConnection"));


            connection.Open();


            try
            {

                if (model.Id == null || model.Id == 0)
                {
                    connection.Execute(
                        @"INSERT INTO Caravan
                    (
                        Name,
                        Admin
                    )
                    VALUES
                    (
                        @Name,
                        @Admin
                    )",
                        model);
                }
                else
                {
                    connection.Execute(
                        @"UPDATE Caravan
                    SET
                        Name=@Name,
                        Admin=@Admin
                    WHERE Id=@Id",
                        model);
                }


                return 1;
            }
            catch
            {
                return 0;
            }
        }




        public int DeleteCaravan(int id)
        {
            using var connection = new SqlConnection(
                _configuration.GetConnectionString("DefaultConnection"));


            connection.Open();


            using var transaction = connection.BeginTransaction();


            try
            {
                // اگر زائر وابسته دارد حذف شود
                connection.Execute(
                    @"DELETE FROM Traffic
                  WHERE Barcode IN
                  (
                      SELECT Id 
                      FROM Zaer 
                      WHERE CaravanId=@Id
                  )",
                    new { Id = id },
                    transaction);



                connection.Execute(
                    @"DELETE FROM Zaer
                  WHERE CaravanId=@Id",
                    new { Id = id },
                    transaction);



                connection.Execute(
                    @"DELETE FROM Caravan
                  WHERE Id=@Id",
                    new { Id = id },
                    transaction);



                transaction.Commit();

                return 1;
            }
            catch
            {
                transaction.Rollback();
                return 0;
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

    public class CaravanModel
    {
        public int? Id { get; set; }
        public string? Name { get; set; }
        public string? Admin { get; set; }
    }

    public class UploadOptions
    {
        public string UploadPath { get; set; } = "";
    }
}
