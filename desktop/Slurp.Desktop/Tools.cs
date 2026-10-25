using System.Diagnostics;
using System.IO;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace Slurp;

/// <summary>
/// The agent's hands: real filesystem and shell access, scoped to one workspace folder.
/// Every path is resolved inside the workspace; anything that escapes it is refused.
/// </summary>
public sealed class ToolRunner
{
    private readonly string _root;

    private static readonly string[] SkipDirs = { ".git", "node_modules", "bin", "obj", ".vs", "dist", ".next", "packages", "__pycache__" };

    public ToolRunner(string workspace) => _root = Path.GetFullPath(workspace);

    public static readonly List<ToolSpec> Specs = new()
    {
        new ToolSpec("list_files",
            "Список файлов в рабочей папке по glob-маске (например **/*.cs или src/**/*).",
            """{"type":"object","properties":{"pattern":{"type":"string","description":"glob, default **/*"},"limit":{"type":"integer","default":200}},"required":[]}"""),

        new ToolSpec("read_file",
            "Прочитать файл. Можно указать диапазон строк. Возвращает содержимое с номерами строк.",
            """{"type":"object","properties":{"path":{"type":"string"},"from":{"type":"integer"},"to":{"type":"integer"}},"required":["path"]}"""),

        new ToolSpec("grep",
            "Поиск регулярного выражения по файлам рабочей папки. Возвращает путь:строка:текст.",
            """{"type":"object","properties":{"pattern":{"type":"string"},"glob":{"type":"string","default":"**/*"},"limit":{"type":"integer","default":60}},"required":["pattern"]}"""),

        new ToolSpec("write_file",
            "Создать или полностью перезаписать файл.",
            """{"type":"object","properties":{"path":{"type":"string"},"content":{"type":"string"}},"required":["path","content"]}"""),

        new ToolSpec("apply_patch",
            "Заменить точный фрагмент old на new в файле. Предпочтительнее write_file: диф минимальный.",
            """{"type":"object","properties":{"path":{"type":"string"},"old":{"type":"string"},"new":{"type":"string"}},"required":["path","old","new"]}"""),

        new ToolSpec("run_command",
            "Выполнить команду cmd.exe в рабочей папке (сборка, тесты, git). Возвращает stdout+stderr.",
            """{"type":"object","properties":{"command":{"type":"string"},"timeout_seconds":{"type":"integer","default":120}},"required":["command"]}""")
    };

    /// <summary>Tools that change something need approval unless autonomy allows it.</summary>
    public static bool IsRisky(string name) => name is "write_file" or "apply_patch" or "run_command";

    public async Task<(bool ok, string output, string detail)> ExecuteAsync(string name, string argsJson, CancellationToken ct)
    {
        JsonDocument doc;
        try { doc = JsonDocument.Parse(string.IsNullOrWhiteSpace(argsJson) ? "{}" : argsJson); }
        catch (Exception ex) { return (false, "Некорректный JSON аргументов: " + ex.Message, name); }

        using (doc)
        {
            var a = doc.RootElement;
            string Str(string key, string fallback = "") =>
                a.TryGetProperty(key, out var v) && v.ValueKind == JsonValueKind.String ? v.GetString() ?? fallback : fallback;
            int Int(string key, int fallback) =>
                a.TryGetProperty(key, out var v) && v.ValueKind == JsonValueKind.Number ? v.GetInt32() : fallback;

            try
            {
                switch (name)
                {
                    case "list_files":
                        return ListFiles(Str("pattern", "**/*"), Int("limit", 200));
                    case "read_file":
                        return ReadFile(Str("path"), Int("from", 1), Int("to", 0));
                    case "grep":
                        return Grep(Str("pattern"), Str("glob", "**/*"), Int("limit", 60));
                    case "write_file":
                        return WriteFile(Str("path"), Str("content"));
                    case "apply_patch":
                        return ApplyPatch(Str("path"), Str("old"), Str("new"));
                    case "run_command":
                        return await RunCommand(Str("command"), Int("timeout_seconds", 120), ct);
                    default:
                        return (false, $"Неизвестный инструмент: {name}", name);
                }
            }
            catch (Exception ex)
            {
                return (false, ex.Message, name);
            }
        }
    }

    // ---------------------------------------------------------------- path safety

    private string Resolve(string relative)
    {
        if (string.IsNullOrWhiteSpace(relative)) throw new InvalidOperationException("Путь не указан");
        var full = Path.GetFullPath(Path.Combine(_root, relative.Replace('/', Path.DirectorySeparatorChar)));
        if (!full.StartsWith(_root, StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("Путь вне рабочей папки — отказано");
        return full;
    }

    private string Rel(string full) => Path.GetRelativePath(_root, full).Replace('\\', '/');

    // ---------------------------------------------------------------- tools

    private (bool, string, string) ListFiles(string pattern, int limit)
    {
        var results = new List<string>();
        var regex = GlobToRegex(string.IsNullOrWhiteSpace(pattern) ? "**/*" : pattern);
        foreach (var file in EnumerateFiles(_root))
        {
            var rel = Rel(file);
            if (!regex.IsMatch(rel)) continue;
            results.Add(rel);
            if (results.Count >= limit) break;
        }
        results.Sort(StringComparer.OrdinalIgnoreCase);
        var text = results.Count == 0 ? "(ничего не найдено)" : string.Join("\n", results);
        return (true, text, $"{results.Count} файлов");
    }

    private (bool, string, string) ReadFile(string path, int from, int to)
    {
        var full = Resolve(path);
        if (!File.Exists(full)) return (false, $"Файл не найден: {path}", path);
        var lines = File.ReadAllLines(full);
        if (lines.Length == 0) return (true, "(пустой файл)", path);
        var start = Math.Max(1, from);
        if (start > lines.Length) start = lines.Length;
        var end = to > 0 ? Math.Min(to, lines.Length) : Math.Min(lines.Length, start + 600);
        if (end < start) end = start;
        var sb = new StringBuilder();
        for (var i = start; i <= end; i++)
            sb.Append(i.ToString().PadLeft(5)).Append("  ").AppendLine(lines[i - 1]);
        if (end < lines.Length) sb.AppendLine($"… всего строк: {lines.Length}");
        return (true, sb.ToString(), $"{lines.Length} строк");
    }

    private (bool, string, string) Grep(string pattern, string glob, int limit)
    {
        var regex = new Regex(pattern, RegexOptions.IgnoreCase | RegexOptions.Compiled);
        var globRegex = GlobToRegex(glob);
        var hits = new List<string>();
        foreach (var file in EnumerateFiles(_root))
        {
            var rel = Rel(file);
            if (!globRegex.IsMatch(rel)) continue;
            string[] lines;
            try { lines = File.ReadAllLines(file); }
            catch { continue; }
            for (var i = 0; i < lines.Length; i++)
            {
                if (!regex.IsMatch(lines[i])) continue;
                hits.Add($"{rel}:{i + 1}: {lines[i].Trim()}");
                if (hits.Count >= limit) goto done;
            }
        }
    done:
        var text = hits.Count == 0 ? "(совпадений нет)" : string.Join("\n", hits);
        return (true, text, $"{hits.Count} совпадений");
    }

    private (bool, string, string) WriteFile(string path, string content)
    {
        var full = Resolve(path);
        var dir = Path.GetDirectoryName(full);
        if (!string.IsNullOrEmpty(dir)) Directory.CreateDirectory(dir);
        var existed = File.Exists(full);
        File.WriteAllText(full, content, new UTF8Encoding(false));
        var lines = content.Count(c => c == '\n') + 1;
        return (true, $"{(existed ? "Перезаписан" : "Создан")} {path} ({lines} строк)", path);
    }

    private (bool, string, string) ApplyPatch(string path, string oldText, string newText)
    {
        var full = Resolve(path);
        if (!File.Exists(full)) return (false, $"Файл не найден: {path}", path);

        var content = File.ReadAllText(full);
        var normalized = content.Replace("\r\n", "\n");
        var needle = oldText.Replace("\r\n", "\n");

        var index = normalized.IndexOf(needle, StringComparison.Ordinal);
        if (index < 0)
        {
            // tolerant fallback: compare ignoring indentation
            var squash = (string s) => Regex.Replace(s, @"\s+", " ");
            var squashedContent = squash(normalized);
            var squashedNeedle = squash(needle);
            if (squashedContent.Contains(squashedNeedle, StringComparison.Ordinal))
                return (false, "Фрагмент найден только без учёта пробелов — уточни old или используй write_file.", path);
            return (false, "Фрагмент old не найден в файле. Прочитай файл заново и повтори.", path);
        }

        var patched = normalized[..index] + newText.Replace("\r\n", "\n") + normalized[(index + needle.Length)..];
        File.WriteAllText(full, patched, new UTF8Encoding(false));

        var added = newText.Count(c => c == '\n') + 1;
        var removed = oldText.Count(c => c == '\n') + 1;
        return (true, $"Патч применён: +{added} −{removed} строк", $"{path} +{added} −{removed}");
    }

    private async Task<(bool, string, string)> RunCommand(string command, int timeoutSeconds, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(command)) return (false, "Пустая команда", "run_command");

        var psi = new ProcessStartInfo("cmd.exe", "/c " + command)
        {
            WorkingDirectory = _root,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true,
            StandardOutputEncoding = Encoding.UTF8,
            StandardErrorEncoding = Encoding.UTF8
        };

        using var proc = new Process { StartInfo = psi };
        var output = new StringBuilder();
        var gate = new object();

        proc.OutputDataReceived += (_, e) => { if (e.Data != null) lock (gate) output.AppendLine(e.Data); };
        proc.ErrorDataReceived += (_, e) => { if (e.Data != null) lock (gate) output.AppendLine(e.Data); };

        proc.Start();
        proc.BeginOutputReadLine();
        proc.BeginErrorReadLine();

        using var timeout = CancellationTokenSource.CreateLinkedTokenSource(ct);
        timeout.CancelAfter(TimeSpan.FromSeconds(Math.Clamp(timeoutSeconds, 5, 900)));

        try
        {
            await proc.WaitForExitAsync(timeout.Token);
        }
        catch (OperationCanceledException)
        {
            try { proc.Kill(entireProcessTree: true); } catch { }
            lock (gate) output.AppendLine("[прервано: таймаут или отмена]");
        }

        string text;
        lock (gate) text = output.ToString();
        if (text.Length > 20_000) text = text[..20_000] + "\n… вывод обрезан";

        var code = proc.HasExited ? proc.ExitCode : -1;
        return (code == 0, text.Length == 0 ? "(нет вывода)" : text, $"exit {code}");
    }

    // ---------------------------------------------------------------- helpers

    private static IEnumerable<string> EnumerateFiles(string root)
    {
        var stack = new Stack<string>();
        stack.Push(root);
        while (stack.Count > 0)
        {
            var dir = stack.Pop();
            string[] files, dirs;
            try
            {
                files = Directory.GetFiles(dir);
                dirs = Directory.GetDirectories(dir);
            }
            catch { continue; }

            foreach (var f in files)
            {
                var ext = Path.GetExtension(f).ToLowerInvariant();
                if (ext is ".dll" or ".exe" or ".pdb" or ".png" or ".jpg" or ".jpeg" or ".zip" or ".woff2" or ".ico") continue;
                yield return f;
            }

            foreach (var d in dirs)
            {
                var name = Path.GetFileName(d);
                if (SkipDirs.Contains(name, StringComparer.OrdinalIgnoreCase)) continue;
                stack.Push(d);
            }
        }
    }

    private static Regex GlobToRegex(string glob)
    {
        var g = glob.Replace('\\', '/');
        var sb = new StringBuilder("^");
        for (var i = 0; i < g.Length; i++)
        {
            var c = g[i];
            if (c == '*')
            {
                if (i + 1 < g.Length && g[i + 1] == '*')
                {
                    sb.Append(".*");
                    i++;
                    if (i + 1 < g.Length && g[i + 1] == '/') i++;
                }
                else sb.Append("[^/]*");
            }
            else if (c == '?') sb.Append("[^/]");
            else if (".+()^$|{}[]".Contains(c)) sb.Append('\\').Append(c);
            else sb.Append(c);
        }
        sb.Append('$');
        return new Regex(sb.ToString(), RegexOptions.IgnoreCase | RegexOptions.Compiled);
    }
}
