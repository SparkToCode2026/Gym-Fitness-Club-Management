using GFCM.Models;
using Microsoft.EntityFrameworkCore;

namespace GFCM
{
    public class ProjectContext : DbContext
    {
        // Dev1:
        public DbSet<User> users {  get; set; }
        public DbSet<TrainerProfile> trainerProfiles { get; set; }

        // Dev2:


        // Dev3:


        // Dev4


        // Dev5:


        // Dev6:


        public ProjectContext(DbContextOptions<ProjectContext> options) : base(options)
        {

        }
    }
}
