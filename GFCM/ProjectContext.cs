using Microsoft.EntityFrameworkCore;

namespace GFCM
{
    public class ProjectContext : DbContext
    {


        public ProjectContext(DbContextOptions<ProjectContext> options) : base(options)
        {

        }
    }
}
