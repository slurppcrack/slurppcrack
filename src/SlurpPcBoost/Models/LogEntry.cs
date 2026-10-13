namespace SlurpPcBoost.Models;

/// <summary>Уровень записи в журнале приложения.</summary>
public enum LogLevel
{
    Info,
    Success,
    Warning,
    Error,
    Detail,
}

/// <summary>Строка журнала.</summary>
public sealed class LogEntry
{
    public DateTime Time { get; init; } = DateTime.Now;

    public LogLevel Level { get; init; } = LogLevel.Info;

    public string Message { get; init; } = string.Empty;

    public string TimeText => Time.ToString("HH:mm:ss");

    public string LevelText => Level switch
    {
        LogLevel.Success => "OK",
        LogLevel.Warning => "WARN",
        LogLevel.Error => "ERR",
        LogLevel.Detail => "DBG",
        _ => "INFO",
    };

    public string LevelName => Level switch
    {
        LogLevel.Success => "Успех",
        LogLevel.Warning => "Предупреждение",
        LogLevel.Error => "Ошибка",
        LogLevel.Detail => "Детали",
        _ => "Информация",
    };
}
