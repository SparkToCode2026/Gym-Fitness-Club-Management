using GFCM.Models;
using Microsoft.EntityFrameworkCore;

namespace GFCM
{
    public class ProjectContext : DbContext
    {
        internal object Equipment;

        // Dev1:
        public DbSet<User> users {  get; set; }
        public DbSet<TrainerProfile> trainerProfiles { get; set; }

        // Dev2:
        public DbSet<MembershipPlan> membershipPlans { get; set; }
        public DbSet<Membership> memberships { get; set; }


        // Dev3:
        public DbSet<ClassSchedule> classSchedules { get; set; }
        public DbSet<ClassBooking> classBookings { get; set; }


        // Dev4
        public DbSet<Equipment> equipment { get; set; }
        public DbSet<Payment> payments { get; set; }


        // Dev5:
        public DbSet<Attendance> attendances { get; set; }
        public DbSet<WorkoutPlan> workoutPlans { get; set; }


        // Dev6:
        public DbSet<BodyMetric> bodyMetrics { get; set; }
        public DbSet<Branch> branches { get; set; }

        public ProjectContext(DbContextOptions<ProjectContext> options) : base(options)
        {

        }
    }
}
