using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace GFCM.Models
{
    public class BodyMetric
    {
        [Key]
        [JsonIgnore]
        public int bodyMetricId { get; set; }

        [ForeignKey("user")]
        public int userId { get; set; }

        [JsonIgnore]
        public User user { get; set; }

        public DateTime metricDate { get; set; }
        public double weightKg { get; set; }
        public double heightCm { get; set; }
        public double? bodyFatPercentage { get; set; }
        public double? muscleMassKg { get; set; }
    }
}



