using Microsoft.AspNetCore.Mvc;
using Repository;
using zaerine_piyade.Filters;

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
        public ActionResult<List<TrafficOutputDto>> Registr(int ZaerId)
        {
            return _zaer.TrafficRegistration(ZaerId);
        }

        [HttpGet("delete/{ZaerId}")]
        public ActionResult<int> Delete(int ZaerId)
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
    }
}