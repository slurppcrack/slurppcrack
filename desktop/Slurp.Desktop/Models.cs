using System.Collections.ObjectModel;
using System.Text.Json.Serialization;

namespace Slurp;

public enum ProviderProtocol { OpenAi, Anthropic }

public sealed class Provider
{
    public string Id { get; init; } = "";
    public string Name { get; init; } = "";
    public string BaseUrl { get; init; } = "";
    public ProviderProtocol Protocol { get; init; }
    public string KeyHint { get; init; } = "";
    public bool NeedsKey { get; init; } = true;
}

public sealed class ModelInfo
{
    public string Id { get; init; } = "";
    public string Name { get; init; } = "";
    public string ProviderId { get; init; } = "";
    /// <summary>model string sent to the API</summary>
    public string ApiId { get; init; } = "";
    public int Context { get; init; }
    public double PriceIn { get; init; }
    public double PriceOut { get; init; }
    public bool Local { get; init; }

    [JsonIgnore]
    public string Label => $"{Name}  ·  {Context / 1000}K  ·  {(Local ? "free" : $"${PriceIn}/${PriceOut}")}";
}

public static class Catalog
{
    public static readonly List<Provider> Providers = new()
    {
        new Provider { Id = "anthropic", Name = "Anthropic", BaseUrl = "https://api.anthropic.com/v1", Protocol = ProviderProtocol.Anthropic, KeyHint = "console.anthropic.com" },
        new Provider { Id = "openai", Name = "OpenAI", BaseUrl = "https://api.openai.com/v1", Protocol = ProviderProtocol.OpenAi, KeyHint = "platform.openai.com" },
        new Provider { Id = "deepseek", Name = "DeepSeek", BaseUrl = "https://api.deepseek.com/v1", Protocol = ProviderProtocol.OpenAi, KeyHint = "platform.deepseek.com" },
        new Provider { Id = "google", Name = "Google", BaseUrl = "https://generativelanguage.googleapis.com/v1beta/openai", Protocol = ProviderProtocol.OpenAi, KeyHint = "aistudio.google.com" },
        new Provider { Id = "moonshot", Name = "Moonshot", BaseUrl = "https://api.moonshot.ai/v1", Protocol = ProviderProtocol.OpenAi, KeyHint = "platform.moonshot.ai" },
        new Provider { Id = "qwen", Name = "Alibaba Qwen", BaseUrl = "https://dashscope-intl.aliyuncs.com/compatible-mode/v1", Protocol = ProviderProtocol.OpenAi, KeyHint = "bailian.console.alibabacloud.com" },
        new Provider { Id = "mistral", Name = "Mistral", BaseUrl = "https://api.mistral.ai/v1", Protocol = ProviderProtocol.OpenAi, KeyHint = "console.mistral.ai" },
        new Provider { Id = "openrouter", Name = "OpenRouter", BaseUrl = "https://openrouter.ai/api/v1", Protocol = ProviderProtocol.OpenAi, KeyHint = "openrouter.ai/keys" },
        new Provider { Id = "ollama", Name = "Ollama (local)", BaseUrl = "http://localhost:11434/v1", Protocol = ProviderProtocol.OpenAi, NeedsKey = false },
        new Provider { Id = "lmstudio", Name = "LM Studio (local)", BaseUrl = "http://localhost:1234/v1", Protocol = ProviderProtocol.OpenAi, NeedsKey = false }
    };

    public static readonly List<ModelInfo> Models = new()
    {
        new ModelInfo { Id = "claude-sonnet-4-5", Name = "Claude Sonnet 4.5", ProviderId = "anthropic", ApiId = "claude-sonnet-4-5-20250929", Context = 200_000, PriceIn = 3, PriceOut = 15 },
        new ModelInfo { Id = "claude-opus-4-1", Name = "Claude Opus 4.1", ProviderId = "anthropic", ApiId = "claude-opus-4-1-20250805", Context = 200_000, PriceIn = 15, PriceOut = 75 },
        new ModelInfo { Id = "gpt-5", Name = "GPT-5", ProviderId = "openai", ApiId = "gpt-5", Context = 400_000, PriceIn = 1.25, PriceOut = 10 },
        new ModelInfo { Id = "gpt-5-mini", Name = "GPT-5 mini", ProviderId = "openai", ApiId = "gpt-5-mini", Context = 272_000, PriceIn = 0.25, PriceOut = 2 },
        new ModelInfo { Id = "deepseek-v3", Name = "DeepSeek V3.2", ProviderId = "deepseek", ApiId = "deepseek-chat", Context = 128_000, PriceIn = 0.28, PriceOut = 0.42 },
        new ModelInfo { Id = "deepseek-r1", Name = "DeepSeek R1", ProviderId = "deepseek", ApiId = "deepseek-reasoner", Context = 128_000, PriceIn = 0.55, PriceOut = 2.19 },
        new ModelInfo { Id = "gemini-2-5-pro", Name = "Gemini 2.5 Pro", ProviderId = "google", ApiId = "gemini-2.5-pro", Context = 1_000_000, PriceIn = 1.25, PriceOut = 10 },
        new ModelInfo { Id = "kimi-k2", Name = "Kimi K2", ProviderId = "moonshot", ApiId = "kimi-k2-thinking", Context = 256_000, PriceIn = 0.6, PriceOut = 2.5 },
        new ModelInfo { Id = "qwen3-coder", Name = "Qwen3 Coder", ProviderId = "qwen", ApiId = "qwen3-coder-plus", Context = 256_000, PriceIn = 0.3, PriceOut = 1.2 },
        new ModelInfo { Id = "mistral-medium", Name = "Mistral Medium 3", ProviderId = "mistral", ApiId = "mistral-medium-latest", Context = 128_000, PriceIn = 0.4, PriceOut = 2 },
        new ModelInfo { Id = "qwen-local", Name = "Qwen2.5 Coder 32B", ProviderId = "ollama", ApiId = "qwen2.5-coder:32b", Context = 32_768, Local = true },
        new ModelInfo { Id = "devstral-local", Name = "Devstral 24B", ProviderId = "lmstudio", ApiId = "devstral-small", Context = 128_000, Local = true }
    };

    public static Provider ProviderOf(ModelInfo m) =>
        Providers.FirstOrDefault(p => p.Id == m.ProviderId) ?? Providers[0];

    public static ModelInfo ModelOf(string id) =>
        Models.FirstOrDefault(m => m.Id == id) ?? Models[0];
}

public enum Autonomy { Ask, Auto, Yolo }

public sealed class AppSettings
{
    public string ModelId { get; set; } = "claude-sonnet-4-5";
    public string Persona { get; set; } = "surgeon";
    public Autonomy Autonomy { get; set; } = Autonomy.Ask;
    public double Temperature { get; set; } = 0.3;
    public int MaxSteps { get; set; } = 40;

    /// <summary>providerId -> api key (stored per user, never sent anywhere but the provider)</summary>
    public Dictionary<string, string> Keys { get; set; } = new();

    /// <summary>providerId -> base url override</summary>
    public Dictionary<string, string> BaseUrls { get; set; } = new();

    public string CustomRules { get; set; } = "";
    public bool SaveKeys { get; set; } = true;
    public string LastWorkspace { get; set; } = "";
    public bool Onboarded { get; set; }

    public string PersonaPrompt => Persona switch
    {
        "architect" => "Before writing code, produce a short plan of module boundaries and data flow. Prefer small composable files over god-files. Add a one-line doc comment to every exported symbol.",
        "racer" => "Bias hard toward a working vertical slice. Do not gold-plate. Ship the shortest path to something that runs, then iterate.",
        "mentor" => "Teach as you build: one sentence of rationale before each significant edit, a short summary after.",
        "custom" => CustomRules,
        _ => "Make the smallest possible change that solves the problem. Never reformat untouched code, never rename unrelated symbols. Prefer surgical diffs over rewrites."
    };

    public string KeyFor(string providerId) =>
        Keys.TryGetValue(providerId, out var k) ? k : "";

    public string BaseUrlFor(Provider p) =>
        BaseUrls.TryGetValue(p.Id, out var u) && !string.IsNullOrWhiteSpace(u) ? u : p.BaseUrl;
}

public sealed class ChatTurn
{
    public string Role { get; init; } = "user";   // user | assistant
    public string Text { get; set; } = "";
    public DateTime At { get; init; } = DateTime.Now;

    [JsonIgnore] public bool IsUser => Role == "user";
}

public sealed class ToolLogEntry
{
    public string Tool { get; init; } = "";
    public string Detail { get; init; } = "";
    public string Result { get; set; } = "";
    public bool Ok { get; set; }
    public DateTime At { get; init; } = DateTime.Now;

    [JsonIgnore] public string Title => $"{Tool}  {Detail}";
}

/// <summary>One chat session: its own transcript, tool log and agent conversation.</summary>
public sealed class Session
{
    public string Id { get; init; } = Guid.NewGuid().ToString("n");
    public string Title { get; set; } = "Новая сессия";
    public string Subtitle { get; set; } = "";
    public DateTime CreatedAt { get; init; } = DateTime.Now;

    public ObservableCollection<ChatTurn> Turns { get; } = new();
    public ObservableCollection<ToolLogEntry> Log { get; } = new();
    public List<LlmMessage> Conversation { get; } = new();

    public int Steps { get; set; }
    public int InTokens { get; set; }
    public int OutTokens { get; set; }
}
