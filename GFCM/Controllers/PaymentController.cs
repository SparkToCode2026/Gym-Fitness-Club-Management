using Microsoft.AspNetCore.Mvc;

namespace GFCM.Controllers
{
    public class PaymentController : ControllerBase
    {
        private ProjectContext context;

        public PaymentController(ProjectContext _context)
        {
            context = _context;
        }

    }
}
