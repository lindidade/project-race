using Microsoft.AspNetCore.Mvc;
using System.Text;
using System.Text.Json;

namespace project_race_backend_csharp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CoachController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly HttpClient _httpClient;

        public CoachController(IConfiguration configuration, IHttpClientFactory httpClientFactory)
        {
            _configuration = configuration;
            _httpClient = httpClientFactory.CreateClient();
        }

        [HttpPost("analyse")]
        public async Task<IActionResult> Analyse([FromBody] CoachRequest request)
        {
            var apiKey = _configuration["Anthropic:ApiKey"];
            Console.WriteLine($"API Key loaded: {apiKey?.Substring(0, 10)}...");
            Console.WriteLine($"Request received: {request.ActivityCount} activities");

            var payload = new
            {
                model = "claude-sonnet-4-6",
                max_tokens = 1000,
                system = "You are an enthusiastic and encouraging fitness coach. Based on the user stats provided, give a short (2-4 sentences) personalized motivational message. Be warm, specific to their numbers, and end with an actionable encouragement.",
                messages = new[]
                {
                    new {
                        role = "user",
                        content = $"My fitness stats: {request.ActivityCount} activities logged, {request.TotalDistance:F1} km total, average {request.AvgDistance:F2} km per activity. Give me some motivation!"
                    }
                }
            };

            var json = JsonSerializer.Serialize(payload);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            _httpClient.DefaultRequestHeaders.Clear();
            _httpClient.DefaultRequestHeaders.Add("x-api-key", apiKey);
            _httpClient.DefaultRequestHeaders.Add("anthropic-version", "2023-06-01");

            var response = await _httpClient.PostAsync("https://api.anthropic.com/v1/messages", content);
            var responseBody = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
                return StatusCode((int)response.StatusCode, responseBody);

            using var doc = JsonDocument.Parse(responseBody);
            var message = doc.RootElement
                .GetProperty("content")[0]
                .GetProperty("text")
                .GetString();

            return Ok(new { message });
        }
    }

    public class CoachRequest
    {
        public int ActivityCount { get; set; }
        public double TotalDistance { get; set; }
        public double AvgDistance { get; set; }
    }
}