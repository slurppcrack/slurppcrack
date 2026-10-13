using System.Collections.ObjectModel;
using System.IO;
using System.Windows;
using SlurpPcBoost.Models;
using SlurpPcBoost.Mvvm;

using Path = System.IO.Path;

namespace SlurpPcBoost.Services;

/// <summary>Журнал приложения: события в UI + дублирование в файл (только при запущенном приложении).</summary>
public sealed class AppLogService : ObservableObject
{
    private const int MaxEntries = 500;
    private readonly object _sync = new();
    private readonly List<LogEntry> _all = new();
    private int _errors;

    public ObservableCollection<LogEntry> Entries { get; } = new();

    public int ErrorCount => Volatile.Read(ref _errors);

    private void RaiseErrorCount() => OnPropertyChanged(nameof(ErrorCount));

    public void Info(string message) => Add(LogLevel.Info, message);

    public void Success(string message) => Add(LogLevel.Success, message);

    public void Warning(string message) => Add(LogLevel.Warning, message);

    public void Detail(string message) => Add(LogLevel.Detail, message);

    public void Error(string message)
    {
        Interlocked.Increment(ref _errors);
        RaiseErrorCount();
        Add(LogLevel.Error, message);
    }

    /// <summary>Записать исключение и его вложенные ошибки.</summary>
    public void Error(string message, Exception ex)
    {
        Interlocked.Increment(ref _errors);
        RaiseErrorCount();
        Add(LogLevel.Error, $"{message}: {ex.Message}");
        if (ex.InnerException is { } inner)
        {
            Add(LogLevel.Detail, $"Причина: {inner.Message}");
        }
    }

    public void Add(LogLevel level, string message)
    {
        var entry = new LogEntry { Level = level, Message = message };

        lock (_sync)
        {
            _all.Add(entry);
            if (_all.Count > MaxEntries)
            {
                _all.RemoveAt(0);
            }
        }

        var dispatcher = Application.Current?.Dispatcher;
        if (dispatcher is null || dispatcher.CheckAccess())
        {
            AppendToView(entry);
        }
        else
        {
            dispatcher.BeginInvoke(new Action(() => AppendToView(entry)));
        }
    }

    public IReadOnlyList<LogEntry> Snapshot()
    {
        lock (_sync)
        {
            return _all.ToArray();
        }
    }

    private void AppendToView(LogEntry entry)
    {
        Entries.Add(entry);
        while (Entries.Count > MaxEntries)
        {
            Entries.RemoveAt(0);
        }
    }

    /// <summary>Сохранить журнал в C:\Users\%USER%\AppData\Roaming\SlurpPCBoost\logs.</summary>
    public string SaveToFile()
    {
        var dir = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
            "SlurpPCBoost",
            "logs");
        Directory.CreateDirectory(dir);

        var path = Path.Combine(dir, $"slurppcboost-{DateTime.Now:yyyyMMdd-HHmmss}.log");
        var lines = Snapshot().Select(e => $"{e.Time:yyyy-MM-dd HH:mm:ss} [{e.LevelText}] {e.Message}");
        File.WriteAllLines(path, lines);
        return path;
    }
}
