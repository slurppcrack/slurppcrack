using System.IO;
using System.Text;

namespace Slurp;

/// <summary>
/// The agent loop: plan → call tools → read results → repeat, until the model stops
/// asking for tools. Everything happens inside one workspace folder.
/// </summary>
public sealed class Agent
{
    private readonly AppSettings _settings;
    private readonly ToolRunner _tools;
    private readonly string _workspace;

    public Agent(AppSettings settings, string workspace)
    {
        _settings = settings;
        _workspace = workspace;
        _tools = new ToolRunner(workspace);
    }

    /// <summary>Streamed assistant text.</summary>
    public event Action<string>? Delta;

    /// <summary>A tool is about to run: (tool, detail).</summary>
    public event Action<string, string>? ToolStarted;

    /// <summary>A tool finished.</summary>
    public event Action<ToolLogEntry>? ToolFinished;

    /// <summary>Token usage of the last model call: (input, output).</summary>
    public event Action<int, int>? Usage;

    /// <summary>Non-fatal notice for the UI.</summary>
    public event Action<string>? Notice;

    /// <summary>Asks the user to approve a risky tool call. Return false to deny.</summary>
    public Func<string, string, Task<bool>>? ApprovalRequired;

    public bool IsRunning { get; private set; }

    public async Task RunAsync(string userText, List<LlmMessage> conversation, CancellationToken ct)
    {
        if (IsRunning) return;
        IsRunning = true;
        try
        {
            conversation.Add(new LlmMessage { Role = "user", Text = userText });

            using var llm = new LlmClient(_settings);
            var steps = 0;

            while (steps < Math.Max(1, _settings.MaxSteps))
            {
                ct.ThrowIfCancellationRequested();
                steps++;

                var reply = await llm.CompleteAsync(
                    WithSystemPrompt(conversation),
                    ToolRunner.Specs,
                    piece => Delta?.Invoke(piece),
                    ct);

                conversation.Add(new LlmMessage
                {
                    Role = "assistant",
                    Text = reply.Text,
                    Calls = reply.Calls
                });

                Usage?.Invoke(reply.InTokens, reply.OutTokens);

                if (reply.Calls.Count == 0) break;

                foreach (var call in reply.Calls)
                {
                    var detail = ShortDetail(call);
                    ToolStarted?.Invoke(call.Name, detail);

                    if (ToolRunner.IsRisky(call.Name) && NeedsApproval(call.Name))
                    {
                        var allowed = ApprovalRequired is null || await ApprovalRequired(call.Name, detail);
                        if (!allowed)
                        {
                            var denied = new ToolLogEntry
                            {
                                Tool = call.Name,
                                Detail = detail,
                                Result = "Отклонено пользователем",
                                Ok = false
                            };
                            ToolFinished?.Invoke(denied);
                            conversation.Add(new LlmMessage
                            {
                                Role = "tool",
                                ToolCallId = call.Id,
                                ToolName = call.Name,
                                Text = "Пользователь отклонил этот вызов. Не повторяй его, предложи другой путь или спроси, что делать."
                            });
                            continue;
                        }
                    }

                    var (ok, output, toolDetail) = await _tools.ExecuteAsync(call.Name, call.Arguments, ct);

                    var entry = new ToolLogEntry
                    {
                        Tool = call.Name,
                        Detail = string.IsNullOrWhiteSpace(toolDetail) ? detail : toolDetail,
                        Result = Truncate(output, 4000),
                        Ok = ok
                    };
                    ToolFinished?.Invoke(entry);

                    conversation.Add(new LlmMessage
                    {
                        Role = "tool",
                        ToolCallId = call.Id,
                        ToolName = call.Name,
                        Text = Truncate(output, 12_000)
                    });
                }
            }

            if (steps >= _settings.MaxSteps)
                Notice?.Invoke($"Достигнут лимит шагов ({_settings.MaxSteps}). Задача остановлена — увеличь лимит в настройках или уточни запрос.");
        }
        finally
        {
            IsRunning = false;
        }
    }

    private bool NeedsApproval(string tool) => _settings.Autonomy switch
    {
        Autonomy.Yolo => false,
        Autonomy.Auto => tool == "run_command",   // Auto applies file edits, but asks before shell
        _ => true                                  // Ask: every write / command needs a click
    };

    private List<LlmMessage> WithSystemPrompt(List<LlmMessage> conversation)
    {
        var sb = new StringBuilder();
        sb.AppendLine("Ты SLURP — агент для вайбкодинга внутри нативного десктоп-приложения на Windows.");
        sb.AppendLine($"Рабочая папка проекта: {_workspace}");
        sb.AppendLine("Ты меняешь реальные файлы на диске через инструменты. Никогда не выдумывай содержимое файлов: сначала прочитай.");
        sb.AppendLine("Работай короткими шагами: прочитай → измени минимальным патчем → проверь (сборка/тесты) → отчитайся.");
        sb.AppendLine("Отвечай по-русски, кратко и по делу. Не вставляй длинные листинги кода в чат — правь файлы инструментами.");
        sb.AppendLine();
        sb.AppendLine("Стиль работы:");
        sb.AppendLine(_settings.PersonaPrompt);
        if (!string.IsNullOrWhiteSpace(_settings.CustomRules) && _settings.Persona != "custom")
        {
            sb.AppendLine();
            sb.AppendLine("Дополнительные правила проекта:");
            sb.AppendLine(_settings.CustomRules);
        }
        sb.AppendLine();
        sb.AppendLine("Инструменты: list_files, read_file, grep, write_file, apply_patch, run_command.");
        sb.AppendLine("Перед правкой всегда читай файл. Для точечных изменений используй apply_patch (old должен точно совпадать).");

        var messages = new List<LlmMessage> { new() { Role = "system", Text = sb.ToString() } };

        // keep the tail of a long conversation so we do not blow the context window
        var tail = conversation.Count > 40 ? conversation.GetRange(conversation.Count - 40, 40) : conversation;

        // never start the tail with a tool result whose call was trimmed away
        var start = 0;
        while (start < tail.Count && tail[start].Role == "tool") start++;
        messages.AddRange(tail.Skip(start));
        return messages;
    }

    private static string ShortDetail(ToolCall call)
    {
        try
        {
            using var doc = System.Text.Json.JsonDocument.Parse(string.IsNullOrWhiteSpace(call.Arguments) ? "{}" : call.Arguments);
            var a = doc.RootElement;
            foreach (var key in new[] { "path", "pattern", "command" })
            {
                if (a.TryGetProperty(key, out var v) && v.ValueKind == System.Text.Json.JsonValueKind.String)
                {
                    var s = v.GetString() ?? "";
                    if (key == "command") return s.Length > 80 ? s[..80] + "…" : s;
                    return s;
                }
            }
        }
        catch { }
        return "";
    }

    private static string Truncate(string s, int max) =>
        string.IsNullOrEmpty(s) ? "" : s.Length <= max ? s : s[..max] + "\n… обрезано";
}
