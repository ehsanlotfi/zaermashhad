using Microsoft.AspNetCore.Mvc;
using Repository;
using SixLabors.ImageSharp.Formats.Jpeg;
using Microsoft.AspNetCore.Mvc;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Jpeg;
using SixLabors.ImageSharp.Processing;
using System.IO;

namespace zaerine_piyade.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    //[IsLogin]
    public class ZaerController : ControllerBase
    {

        private readonly ILogger<ZaerController> _logger;
        private readonly IZaerRepository _zaer;

        public ZaerController(ILogger<ZaerController> logger, IZaerRepository zaer)
        {
            _logger = logger;
            _zaer = zaer;
        }

        [HttpGet("registr/{ZaerId}")]
        public ActionResult<List<TrafficOutputDto>> Registr(string ZaerId)
        {
            return _zaer.TrafficRegistration(ZaerId);
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

        [HttpGet("zaer-list/{CaravanId}")]
        public ActionResult<List<ZaerModel>> ZaerList(int CaravanId)
        {
            return _zaer.ZaerList(CaravanId);
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

            return Ok("data:image/jpeg;base64,"+base64Image);
        }

    }
}