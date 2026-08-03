using Dapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using OfficeOpenXml;
using Repository;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Jpeg;
using System.Data.SqlClient;

namespace zaerine_piyade.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    //[IsLogin]
    public class ZaerController : ControllerBase
    {
        private readonly ILogger<ZaerController> _logger;
        private readonly IConfiguration _configuration;
        private readonly IWebHostEnvironment _env;
        private readonly UploadOptions _options;

        public ZaerController(
            ILogger<ZaerController> logger,
            IConfiguration configuration,
            IWebHostEnvironment env,
            IOptions<UploadOptions> options)
        {
            _logger = logger;
            _configuration = configuration;
            _env = env;
            _options = options.Value;
        }

        [HttpGet("registr/{ZaerId}")]
        public ActionResult<List<TrafficOutputDto>> Registr(
            string ZaerId,
            bool registerTraffic = true)
        {
            using var connection = new SqlConnection(
                _configuration.GetConnectionString("DefaultConnection"));

            connection.Open();

            var zaerExists = connection.ExecuteScalar<int>(
                "SELECT COUNT(1) FROM Zaer WHERE Id=@Barcode",
                new { Barcode = ZaerId });

            if (zaerExists == 0)
            {
                return new List<TrafficOutputDto>();
            }

            if (registerTraffic)
            {
                connection.Execute(
                    @"INSERT INTO Traffic
                    (
                        Barcode,
                        Date
                    )
                    VALUES
                    (
                        @Barcode,
                        @Date
                    )",
                    new
                    {
                        Barcode = ZaerId,
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
                    ON T.Barcode=Z.Id
                WHERE Z.Id=@Barcode
                GROUP BY
                    Z.Id,
                    Z.Fullname,
                    Z.NationalCode,
                    Z.Sex,
                    Z.CaravanId",
                new
                {
                    Barcode = ZaerId
                }).ToList();

            if (trafficInfo.Count > 0)
            {
                string imagePath = Path.Combine(
                    _options.UploadPath,
                    $"{ZaerId}.jpg");

                if (System.IO.File.Exists(imagePath))
                {
                    trafficInfo[0].Image = $"/uploads/{ZaerId}.jpg";
                }

                trafficInfo[0].Traffic = connection.Query<DateList>(
                    @"SELECT Date
                    FROM Traffic
                    WHERE Barcode=@Barcode
                    ORDER BY Date DESC",
                    new
                    {
                        Barcode = ZaerId
                    }).ToList();
            }

            return trafficInfo;
        }

        [HttpGet("delete/{ZaerId}")]
        public ActionResult<int> Delete(string ZaerId)
        {
            using var connection = new SqlConnection(
                _configuration.GetConnectionString("DefaultConnection"));

            connection.Open();

            using var transaction = connection.BeginTransaction();

            try
            {
                connection.Execute(
                    "DELETE FROM Traffic WHERE Barcode=@Id",
                    new { Id = ZaerId },
                    transaction);

                connection.Execute(
                    "DELETE FROM Zaer WHERE Id=@Id",
                    new { Id = ZaerId },
                    transaction);

                transaction.Commit();

                string imagePath = Path.Combine(
                    _options.UploadPath,
                    $"{ZaerId}.jpg");

                if (System.IO.File.Exists(imagePath))
                {
                    System.IO.File.Delete(imagePath);
                }

                return 1;
            }
            catch
            {
                transaction.Rollback();
                return 0;
            }
        }

        [HttpGet("team-report")]
        public ActionResult<List<TeamReportDto>> TeamReport()
        {
            using var connection = new SqlConnection(
                _configuration.GetConnectionString("DefaultConnection"));

            string query = @"WITH TrafficSummary AS
            (
                SELECT
                    Barcode,
                    COUNT(*) AS TrafficCount,
                    CASE
                        WHEN COUNT(*)%2=1 THEN 1
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
                COUNT(CASE WHEN TS.IsInside=1 THEN 1 END) AS TotalInside,
                COUNT(DISTINCT Z.Id) AS TotalZaer
            FROM Zaer Z
            LEFT JOIN Traffic T
                ON T.Barcode=Z.Id
            LEFT JOIN TrafficSummary TS
                ON TS.Barcode=Z.Id
            GROUP BY
                Z.CaravanId,
                Z.Sex";

            return connection.Query<TeamReportDto>(query).ToList();
        }


        [HttpPost("save-zaer")]
        public ActionResult<int> SaveZaer(ZaerModel model)
        {
            using var connection = new SqlConnection(_configuration.GetConnectionString("DefaultConnection"));

            connection.Open();

            using var transaction = connection.BeginTransaction();

            try
            {
                model.Sex ??= 1;
                model.CaravanId ??= 1;

                bool isInsert = model.Id <= 0;

                if (isInsert)
                {
                    model.Id = connection.ExecuteScalar<int>(
                        @"
                INSERT INTO Zaer
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
                );

                SELECT CAST(SCOPE_IDENTITY() AS INT);",
                        new
                        {
                            model.Fullname,
                            model.NationalCode,
                            model.Sex,
                            model.CaravanId
                        },
                        transaction);
                }
                else
                {
                    connection.Execute(
                        @"UPDATE Zaer
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

                    using var inputStream = new MemoryStream(imageBytes);
                    using var image = Image.Load(inputStream);

                    int quality = 75;

                    using var outputStream = new MemoryStream();

                    var encoder = new JpegEncoder
                    {
                        Quality = quality
                    };

                    image.Save(outputStream, encoder);

                    while (outputStream.Length > 50 * 1024 && quality > 5)
                    {
                        quality -= 5;

                        outputStream.SetLength(0);
                        outputStream.Position = 0;

                        encoder = new JpegEncoder
                        {
                            Quality = quality
                        };

                        image.Save(outputStream, encoder);
                    }

                    string imagePath = Path.Combine(
                        _options.UploadPath,
                        $"{model.Id}.jpg");

                    System.IO.File.WriteAllBytes(
                        imagePath,
                        outputStream.ToArray());
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

        [HttpGet("zaer-list/{CaravanId}")]
        public IActionResult ZaerList(
            int CaravanId,
            bool excel = false)
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
        WHERE CaravanId=@Id
        ORDER BY Id DESC",
                new
                {
                    Id = CaravanId
                }).ToList();

            foreach (var item in result)
            {
                string imagePath = Path.Combine(
                    _options.UploadPath,
                    $"{item.Id}.jpg");

                if (System.IO.File.Exists(imagePath))
                {
                    item.Image = $"/uploads/{item.Id}.jpg";
                }
            }

            if (!excel)
            {
                return Ok(result);
            }

            using var package = new ExcelPackage();

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
                    $"{item.Id}.jpg");

                if (System.IO.File.Exists(file))
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

            return File(
                package.GetAsByteArray(),
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "zaer-list.xlsx");
        }
        [HttpGet("caravan-list")]
        public ActionResult<List<CaravanModel>> List()
        {
            using var connection = new SqlConnection(
                _configuration.GetConnectionString("DefaultConnection"));

            return connection.Query<CaravanModel>(
                @"SELECT
            Id,
            Name,
            Admin,
            City
        FROM Caravan
        ORDER BY Id DESC").ToList();
        }

        [HttpPost("caravan-save")]
        public ActionResult<int> Save(CaravanModel model)
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
                    Admin,
                    City
                )
                VALUES
                (
                    @Name,
                    @Admin,
                    @City
                )",
                        model);
                }
                else
                {
                    connection.Execute(
                        @"UPDATE Caravan
                SET
                    Name=@Name,
                    Admin=@Admin,
                    City=@City
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

        [HttpDelete("caravan-delete/{id}")]
        public ActionResult<int> Delete(int id)
        {
            using var connection = new SqlConnection(
                _configuration.GetConnectionString("DefaultConnection"));

            connection.Open();

            using var transaction = connection.BeginTransaction();

            try
            {
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

        [HttpPost("upload/{zaerId}")]
        public async Task<IActionResult> UploadZaerImage(
            int zaerId,
            IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("فایلی ارسال نشده است");

            var uploadPath = Path.Combine(
                _env.WebRootPath,
                "uploads");

            if (!Directory.Exists(uploadPath))
                Directory.CreateDirectory(uploadPath);

            var filePath = Path.Combine(
                uploadPath,
                $"{zaerId}.jpg");

            using var image = await Image.LoadAsync(file.OpenReadStream());

            int quality = 75;

            var encoder = new JpegEncoder
            {
                Quality = quality
            };

            using var ms = new MemoryStream();

            await image.SaveAsync(ms, encoder);

            while (ms.Length > 50 * 1024 && quality > 5)
            {
                ms.SetLength(0);

                quality -= 5;

                encoder = new JpegEncoder
                {
                    Quality = quality
                };

                await image.SaveAsync(ms, encoder);
            }

            await System.IO.File.WriteAllBytesAsync(
                filePath,
                ms.ToArray());

            return Ok(new
            {
                message = "فایل ذخیره شد",
                image = $"/uploads/{zaerId}.jpg"
            });
        }

        [HttpDelete("delete-image/{zaerId}")]
        public IActionResult DeleteZaerImage(int zaerId)
        {
            var filePath = Path.Combine(
                _env.WebRootPath,
                "uploads",
                $"{zaerId}.jpg");

            if (System.IO.File.Exists(filePath))
            {
                System.IO.File.Delete(filePath);

                return Ok(new
                {
                    message = "فایل حذف شد"
                });
            }

            return NotFound(new
            {
                message = "فایلی وجود ندارد"
            });
        }
    }
}