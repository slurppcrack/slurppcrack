using System.ComponentModel;
using System.Runtime.CompilerServices;

namespace SlurpPcBoost.Mvvm;

/// <summary>
/// Минимальная реализация INotifyPropertyChanged — база для всех моделей и вью-моделей.
/// </summary>
public abstract class ObservableObject : INotifyPropertyChanged
{
    public event PropertyChangedEventHandler? PropertyChanged;

    protected void OnPropertyChanged([CallerMemberName] string? propertyName = null)
        => PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));

    /// <summary>Присваивает значение и уведомляет об изменении, если оно реально изменилось.</summary>
    protected bool SetProperty<T>(ref T field, T value, [CallerMemberName] string? propertyName = null)
    {
        if (EqualityComparer<T>.Default.Equals(field, value))
        {
            return false;
        }

        field = value;
        OnPropertyChanged(propertyName);
        return true;
    }
}
