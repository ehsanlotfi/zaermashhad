using Microsoft.AspNetCore.Mvc;
using Repository;
using SixLabors.ImageSharp.Formats.Jpeg;
using SixLabors.ImageSharp;

namespace zaerine_piyade.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    //[IsLogin]
    public class ZaerController : ControllerBase
    {

        private readonly ILogger<ZaerController> _logger;
        private readonly IZaerRepository _zaer;
        private readonly IWebHostEnvironment _env;
        public ZaerController(ILogger<ZaerController> logger, IZaerRepository zaer, IWebHostEnvironment env)
        {
            _logger = logger;
            _zaer = zaer;
            _env = env;
        }

        [HttpGet("registr/{ZaerId}")]
        public ActionResult<List<TrafficOutputDto>> Registr(
            string ZaerId,
            bool registerTraffic = true)
        {
            return _zaer.TrafficRegistration(ZaerId, registerTraffic);
        }

        [HttpGet("delete/{ZaerId}")]
        public ActionResult<int> Delete(string ZaerId)
        {
            return _zaer.deleteZaer(ZaerId);
        }

        [HttpGet("team-report")]
        public ActionResult<List<TeamReportDto>> TeamReport()
        {
            return _zaer.TeamReport();
        }

        [HttpPost("save-zaer")]
        public ActionResult<int> SaveZaer(ZaerModel model)
        {
            return _zaer.SaveZaer(model);
        }

        [HttpPost("upload/{zaerId}")]
        public async Task<IActionResult> UploadZaerImage(int zaerId, IFormFile file)
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
                $"{zaerId}.png");


            using var stream = new FileStream(
                filePath,
                FileMode.Create);


            await file.CopyToAsync(stream);


            return Ok(new
            {
                message = "فایل ذخیره شد",
                image = $"/uploads/{zaerId}.png"
            });
        }

        [HttpDelete("delete-image/{zaerId}")]
        public IActionResult DeleteZaerImage(int zaerId)
        {
            var filePath = Path.Combine(
                _env.WebRootPath,
                "uploads",
                $"{zaerId}.png");


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

        [HttpGet("zaer-list/{CaravanId}")]
        public IActionResult ZaerList(int CaravanId, bool excel = false)
        {
            var result = _zaer.ZaerList(CaravanId, excel);

            if (excel)
            {
                return File(
                    (byte[])result,
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    "zaer-list.xlsx");
            }

            return Ok(result);
        }

        [HttpGet("caravan-list")]
        public ActionResult<List<CaravanModel>> List()
        {
            return _zaer.CaravanList();
        }




        [HttpPost("caravan-save")]
        public ActionResult<int> Save(
            CaravanModel model)
        {
            return _zaer.SaveCaravan(model);
        }




        [HttpDelete("caravan-delete/{id}")]
        public ActionResult<int> Delete(
            int id)
        {
            return _zaer.DeleteCaravan(id);
        }

        [HttpPost("compress")]
        public async Task<IActionResult> CompressImage(IFormFile imageFile)
        {
            if (imageFile == null || imageFile.Length == 0)
                return BadRequest("Please upload a valid image file.");

            using var image = await Image.LoadAsync(imageFile.OpenReadStream());
            int Quality = 75;
            // فشرده‌سازی تصویر با کیفیت مورد نظر
            var encoder = new JpegEncoder { Quality = Quality };
            using var ms = new MemoryStream();
            await image.SaveAsync(ms, encoder);

            // اگر حجم بیشتر از 100 کیلوبایت بود، کیفیت را کم‌تر کنید
            while (ms.Length > 100 * 1024)
            {
                ms.SetLength(0);
                Quality -= 5;
                encoder = new JpegEncoder { Quality = Quality };
                await image.SaveAsync(ms, encoder);

                if (encoder.Quality <= 5)
                    break; // جلوگیری از کیفیت بیش از حد پایین
            }

            // تبدیل تصویر به Base64
            string base64Image = Convert.ToBase64String(ms.ToArray());

            return Ok("data:image/jpeg;base64," + base64Image);
        }

    }
}