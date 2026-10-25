using System.IO;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace Slurp;

public sealed record ToolSpec(string Name, string Description, string ParametersJson);

public sealed class ToolCall
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string Arguments { get; set; } = "{}";
}

public sealed class LlmMessage
{
    public string Role { get; set; } = "user"; // system | user | assistant | tool
    public string Text { get; set; } = "";
    public List<ToolCall> Calls { get; set; } = new();
    public string? ToolCallId { get; set; }
    public string? ToolName { get; set; }
}

public sealed class LlmReply
{
    public string Text { get; set; } = "";
    public List<ToolCall> Calls { get; set; } = new();
    public int InTokens { get; set; }
    public int OutTokens { get; set; }
}

/// <summary>
/// Talks to a provider. Supports streaming text plus tool calls for
/// OpenAI-compatible endpoints and for the Anthropic Messages API.
/// </summary>
public sealed class LlmClient : IDisposable
{
    private readonly HttpClient _http = new() { Timeout = Timeout.InfiniteTimeSpan };
    private readonly AppSettings _settings;

    public LlmClient(AppSettings settings) => _settings = settings;

    public async Task<LlmReply> CompleteAsync(
        List<LlmMessage> history,
        List<ToolSpec> tools,
        Action<string> onDelta,
        CancellationToken ct)
    {
        var model = Catalog.ModelOf(_settings.ModelId);
        var provider = Catalog.ProviderOf(model);
        var baseUrl = _settings.BaseUrlFor(provider).TrimEnd('/');
        var key = _settings.KeyFor(provider.Id);

        if (provider.NeedsKey && string.IsNullOrWhiteSpace(key))
            throw new InvalidOperationException(
                $"Не задан ключ для {provider.Name}. Открой Настройки → Провайдеры и вставь ключ.");

        return provider.Protocol == ProviderProtocol.Anthropic
            ? await StreamAnthropicAsync(provider, model, baseUrl, key, history, tools, onDelta, ct)
            : await StreamOpenAiAsync(provider, model, baseUrl, key, history, tools, onDelta, ct);
    }

    // ---------------------------------------------------------------- OpenAI compatible

    private async Task<LlmReply> StreamOpenAiAsync(
        Provider provider, ModelInfo model, string baseUrl, string key,
        List<LlmMessage> history, List<ToolSpec> tools,
        Action<string> onDelta, CancellationToken ct)
    {
        var messages = new JsonArray();
        foreach (var m in history)
        {
            switch (m.Role)
            {
                case "system":
                    messages.Add(new JsonObject { ["role"] = "system", ["content"] = m.Text });
                    break;
                case "tool":
                    messages.Add(new JsonObject
                    {
                        ["role"] = "tool",
                        ["tool_call_id"] = m.ToolCallId ?? "",
                        ["content"] = m.Text
                    });
                    break;
                case "assistant" when m.Calls.Count > 0:
                {
                    var calls = new JsonArray();
                    foreach (var c in m.Calls)
                    {
                        calls.Add(new JsonObject
                        {
                            ["id"] = c.Id,
                            ["type"] = "function",
                            ["function"] = new JsonObject { ["name"] = c.Name, ["arguments"] = c.Arguments }
                        });
                    }
                    messages.Add(new JsonObject
                    {
                        ["role"] = "assistant",
                        ["content"] = m.Text,
                        ["tool_calls"] = calls
                    });
                    break;
                }
                default:
                    messages.Add(new JsonObject { ["role"] = m.Role, ["content"] = m.Text });
                    break;
            }
        }

        var body = new JsonObject
        {
            ["model"] = model.ApiId,
            ["stream"] = true,
            ["temperature"] = _settings.Temperature,
            ["messages"] = messages
        };

        if (tools.Count > 0)
        {
            var arr = new JsonArray();
            foreach (var t in tools)
            {
                arr.Add(new JsonObject
                {
                    ["type"] = "function",
                    ["function"] = new JsonObject
                    {
                        ["name"] = t.Name,
                        ["description"] = t.Description,
                        ["parameters"] = JsonNode.Parse(t.ParametersJson)
                    }
                });
            }
            body["tools"] = arr;
        }

        using var req = new HttpRequestMessage(HttpMethod.Post, baseUrl + "/chat/completions");
        if (!string.IsNullOrWhiteSpace(key)) req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", key);
        req.Content = new StringContent(body.ToJsonString(), Encoding.UTF8, "application/json");

        var reply = new LlmReply();
        var calls = new Dictionary<int, ToolCall>();
        var text = new StringBuilder();

        using var res = await _http.SendAsync(req, HttpCompletionOption.ResponseHeadersRead, ct);
        if (!res.IsSuccessStatusCode)
        {
            var err = await res.Content.ReadAsStringAsync(ct);
            throw new InvalidOperationException($"{provider.Name}: {(int)res.StatusCode} {Truncate(err, 400)}");
        }

        await using var stream = await res.Content.ReadAsStreamAsync(ct);
        using var reader = new StreamReader(stream, Encoding.UTF8);

        while (!reader.EndOfStream)
        {
            ct.ThrowIfCancellationRequested();
            var line = await reader.ReadLineAsync();
            if (line is null) break;
            if (!line.StartsWith("data:", StringComparison.Ordinal)) continue;
            var payload = line[5..].Trim();
            if (payload.Length == 0 || payload == "[DONE]") continue;

            JsonDocument doc;
            try { doc = JsonDocument.Parse(payload); }
            catch { continue; }

            using (doc)
            {
                if (!doc.RootElement.TryGetProperty("choices", out var choices) || choices.GetArrayLength() == 0) continue;
                var choice = choices[0];
                if (!choice.TryGetProperty("delta", out var delta)) continue;

                if (delta.TryGetProperty("content", out var content) && content.ValueKind == JsonValueKind.String)
                {
                    var piece = content.GetString() ?? "";
                    if (piece.Length > 0)
                    {
                        text.Append(piece);
                        onDelta(piece);
                    }
                }

                if (delta.TryGetProperty("tool_calls", out var tc) && tc.ValueKind == JsonValueKind.Array)
                {
                    foreach (var item in tc.EnumerateArray())
                    {
                        var index = item.TryGetProperty("index", out var idx) ? idx.GetInt32() : 0;
                        if (!calls.TryGetValue(index, out var call))
                        {
                            call = new ToolCall();
                            calls[index] = call;
                        }
                        if (item.TryGetProperty("id", out var id) && id.ValueKind == JsonValueKind.String)
                            call.Id = id.GetString() ?? call.Id;
                        if (item.TryGetProperty("function", out var fn))
                        {
                            if (fn.TryGetProperty("name", out var name) && name.ValueKind == JsonValueKind.String)
                                call.Name = name.GetString() ?? call.Name;
                            if (fn.TryGetProperty("arguments", out var args) && args.ValueKind == JsonValueKind.String)
                                call.Arguments += args.GetString();
                        }
                    }
                }
            }
        }

        reply.Text = text.ToString();
        reply.Calls = calls.OrderBy(k => k.Key).Select(k => k.Value).Where(c => c.Name.Length > 0).ToList();
        foreach (var c in reply.Calls) if (string.IsNullOrWhiteSpace(c.Arguments)) c.Arguments = "{}";
        reply.OutTokens = Math.Max(1, reply.Text.Length / 4);
        reply.InTokens = Math.Max(1, history.Sum(m => m.Text.Length) / 4);
        return reply;
    }

    // ---------------------------------------------------------------- Anthropic

    private async Task<LlmReply> StreamAnthropicAsync(
        Provider provider, ModelInfo model, string baseUrl, string key,
        List<LlmMessage> history, List<ToolSpec> tools,
        Action<string> onDelta, CancellationToken ct)
    {
        var system = string.Join("\n\n", history.Where(m => m.Role == "system").Select(m => m.Text));
        var messages = new JsonArray();

        foreach (var m in history)
        {
            switch (m.Role)
            {
                case "system":
                    break;

                case "assistant" when m.Calls.Count > 0:
                {
                    var blocks = new JsonArray();
                    if (!string.IsNullOrWhiteSpace(m.Text))
                        blocks.Add(new JsonObject { ["type"] = "text", ["text"] = m.Text });
                    foreach (var c in m.Calls)
                    {
                        blocks.Add(new JsonObject
                        {
                            ["type"] = "tool_use",
                            ["id"] = c.Id,
                            ["name"] = c.Name,
                            ["input"] = SafeParse(c.Arguments)
                        });
                    }
                    messages.Add(new JsonObject { ["role"] = "assistant", ["content"] = blocks });
                    break;
                }

                case "tool":
                {
                    // tool results are sent as a user turn with tool_result blocks
                    var blocks = new JsonArray
                    {
                        new JsonObject
                        {
                            ["type"] = "tool_result",
                            ["tool_use_id"] = m.ToolCallId ?? "",
                            ["content"] = m.Text
                        }
                    };
                    var last = messages.LastOrDefault() as JsonObject;
                    if (last is not null && last["role"]?.GetValue<string>() == "user" && last["content"] is JsonArray existing)
                        existing.Add(blocks[0]!.DeepClone());
                    else
                        messages.Add(new JsonObject { ["role"] = "user", ["content"] = blocks });
                    break;
                }

                default:
                    messages.Add(new JsonObject
                    {
                        ["role"] = m.Role,
                        ["content"] = new JsonArray { new JsonObject { ["type"] = "text", ["text"] = m.Text } }
                    });
                    break;
            }
        }

        var body = new JsonObject
        {
            ["model"] = model.ApiId,
            ["max_tokens"] = 8192,
            ["stream"] = true,
            ["temperature"] = _settings.Temperature,
            ["messages"] = messages
        };
        if (!string.IsNullOrWhiteSpace(system)) body["system"] = system;

        if (tools.Count > 0)
        {
            var arr = new JsonArray();
            foreach (var t in tools)
            {
                arr.Add(new JsonObject
                {
                    ["name"] = t.Name,
                    ["description"] = t.Description,
                    ["input_schema"] = JsonNode.Parse(t.ParametersJson)
                });
            }
            body["tools"] = arr;
        }

        using var req = new HttpRequestMessage(HttpMethod.Post, baseUrl + "/messages");
        req.Headers.Add("x-api-key", key);
        req.Headers.Add("anthropic-version", "2023-06-01");
        req.Content = new StringContent(body.ToJsonString(), Encoding.UTF8, "application/json");

        var reply = new LlmReply();
        var text = new StringBuilder();
        var blocks = new Dictionary<int, ToolCall>();
        var partialJson = new Dictionary<int, StringBuilder>();

        using var res = await _http.SendAsync(req, HttpCompletionOption.ResponseHeadersRead, ct);
        if (!res.IsSuccessStatusCode)
        {
            var err = await res.Content.ReadAsStringAsync(ct);
            throw new InvalidOperationException($"Anthropic: {(int)res.StatusCode} {Truncate(err, 400)}");
        }

        await using var stream = await res.Content.ReadAsStreamAsync(ct);
        using var reader = new StreamReader(stream, Encoding.UTF8);

        while (!reader.EndOfStream)
        {
            ct.ThrowIfCancellationRequested();
            var line = await reader.ReadLineAsync();
            if (line is null) break;
            if (!line.StartsWith("data:", StringComparison.Ordinal)) continue;
            var payload = line[5..].Trim();
            if (payload.Length == 0) continue;

            JsonDocument doc;
            try { doc = JsonDocument.Parse(payload); }
            catch { continue; }

            using (doc)
            {
                var type = doc.RootElement.TryGetProperty("type", out var tEl) ? tEl.GetString() : null;
                var index = doc.RootElement.TryGetProperty("index", out var iEl) ? iEl.GetInt32() : 0;

                switch (type)
                {
                    case "content_block_start":
                        if (doc.RootElement.TryGetProperty("content_block", out var block) &&
                            block.TryGetProperty("type", out var bt) && bt.GetString() == "tool_use")
                        {
                            var call = new ToolCall
                            {
                                Id = block.TryGetProperty("id", out var idEl) ? idEl.GetString() ?? "" : "",
                                Name = block.TryGetProperty("name", out var nameEl) ? nameEl.GetString() ?? "" : ""
                            };
                            blocks[index] = call;
                            partialJson[index] = new StringBuilder();
                        }
                        break;

                    case "content_block_delta":
                        if (!doc.RootElement.TryGetProperty("delta", out var delta)) break;
                        var dtype = delta.TryGetProperty("type", out var dtEl) ? dtEl.GetString() : null;
                        if (dtype == "text_delta" && delta.TryGetProperty("text", out var textEl))
                        {
                            var piece = textEl.GetString() ?? "";
                            text.Append(piece);
                            onDelta(piece);
                        }
                        else if (dtype == "input_json_delta" && delta.TryGetProperty("partial_json", out var pj))
                        {
                            if (partialJson.TryGetValue(index, out var sb)) sb.Append(pj.GetString() ?? "");
                        }
                        break;
                }
            }
        }

        foreach (var (index, call) in blocks)
        {
            call.Arguments = partialJson.TryGetValue(index, out var sb) && sb.Length > 0 ? sb.ToString() : "{}";
        }

        reply.Text = text.ToString();
        reply.Calls = blocks.OrderBy(k => k.Key).Select(k => k.Value).Where(c => c.Name.Length > 0).ToList();
        reply.OutTokens = Math.Max(1, reply.Text.Length / 4);
        reply.InTokens = Math.Max(1, history.Sum(m => m.Text.Length) / 4);
        return reply;
    }

    // ---------------------------------------------------------------- helpers

    private static JsonNode SafeParse(string json)
    {
        try { return JsonNode.Parse(string.IsNullOrWhiteSpace(json) ? "{}" : json)!; }
        catch { return new JsonObject(); }
    }

    private static string Truncate(string s, int max) =>
        s.Length <= max ? s : s[..max] + "…";

    public void Dispose() => _http.Dispose();
}
