using Microsoft.AspNetCore.Mvc;
using System.Net.Http.Headers;
using ScoutBase.Server.Models;

namespace ScoutBase.Server.Controllers
{
	[ApiController]
	[Route("api/terrain")]
	public class TerrainController : ControllerBase
	{
		private readonly IHttpClientFactory _httpClientFactory;

		public TerrainController(IHttpClientFactory httpClientFactory)
		{
			_httpClientFactory = httpClientFactory;
		}

		public class TokenOnlyRequest
		{
			public string Token { get; set; } = string.Empty;
		}

		public class MemberRequest : TokenOnlyRequest
		{
			public string UnitId { get; set; } = string.Empty;
		}

		[HttpPost("profiles")]
		public async Task<IActionResult> GetProfiles([FromBody] TokenOnlyRequest request)
		{
			if (string.IsNullOrEmpty(request.Token))
			{
				Console.WriteLine("❌ Missing token in profiles request.");
				return BadRequest(new { error = "Missing token" });
			}

			Console.WriteLine("✅ Token received for profiles: " + request.Token.Substring(0, 10) + "...");

			var client = _httpClientFactory.CreateClient();
			var req = new HttpRequestMessage(HttpMethod.Get, "https://members.terrain.scouts.com.au/profiles");
			req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", request.Token);

			var res = await client.SendAsync(req);
			if (!res.IsSuccessStatusCode)
				return StatusCode((int)res.StatusCode, await res.Content.ReadAsStringAsync());

			var body = await res.Content.ReadAsStringAsync();
			return Content(body, "application/json");
		}

		[HttpPost("members")]
		public async Task<IActionResult> GetUnitMembers([FromBody] TerrainRequestModel request)
		{
			if (string.IsNullOrWhiteSpace(request.UnitId) || string.IsNullOrWhiteSpace(request.Token))
				return BadRequest("unitId and token are required");

			var client = _httpClientFactory.CreateClient();

			var req = new HttpRequestMessage(HttpMethod.Get,
				$"https://members.terrain.scouts.com.au/units/{request.UnitId}/members");

			req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", request.Token);

			var response = await client.SendAsync(req);
			var content = await response.Content.ReadAsStringAsync();

			if (!response.IsSuccessStatusCode)
				return StatusCode((int)response.StatusCode, content);

			return Content(content, "application/json");
		}

		[HttpGet("ping")]
		public IActionResult Ping()
		{
			return Ok("Terrain proxy is alive!");
		}
	}
}
