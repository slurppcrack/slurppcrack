using System.Collections.ObjectModel;
using System.Windows.Input;
using SlurpPcBoost.Models;
using SlurpPcBoost.Mvvm;
using SlurpPcBoost.Services;

namespace SlurpPcBoost.ViewModels;

/// <summary>Страница «Оптимизация» — список твиков по категориям.</summary>
public sealed class OptimizeViewModel : ViewModelBase
{
    private string _selectedCategory = "Все";
    private List<TweakGroup> _visibleGroups;

    public OptimizeViewModel(AppState state) : base(state)
    {
        Categories = new ObservableCollection<string>(
            new[] { "Все" }.Concat(TweakCatalog.Categories.Select(c => c.Name)));

        _visibleGroups = State.Groups.ToList();

        ApplyAllCommand = new AsyncRelayCommand(State.ApplyAllAsync, () => !State.IsBusy);
        RevertAllCommand = new AsyncRelayCommand(State.RevertAllAsync, () => !State.IsBusy);
        ApplyRecommendedCommand = new AsyncRelayCommand(State.ApplyRecommendedAsync, () => !State.IsBusy);
        ToggleGameModeCommand = new AsyncRelayCommand(State.ToggleGameModeAsync, () => !State.IsBusy);
        BackToDashboardCommand = new RelayCommand(() => State.ActivePage = "dashboard");
        SelectCategoryCommand = new RelayCommand(parameter =>
        {
            if (parameter is string category)
            {
                SelectedCategory = category;
            }
        });
    }

    public ObservableCollection<string> Categories { get; }

    public string SelectedCategory
    {
        get => _selectedCategory;
        set
        {
            if (SetProperty(ref _selectedCategory, value))
            {
                ApplyFilter();
            }
        }
    }

    public IReadOnlyList<TweakGroup> VisibleGroups => _visibleGroups;

    public ICommand ApplyAllCommand { get; }

    public ICommand RevertAllCommand { get; }

    public ICommand ApplyRecommendedCommand { get; }

    public ICommand ToggleGameModeCommand { get; }

    public ICommand BackToDashboardCommand { get; }

    public ICommand SelectCategoryCommand { get; }

    private void ApplyFilter()
    {
        _visibleGroups = SelectedCategory == "Все"
            ? State.Groups.ToList()
            : State.Groups.Where(g => g.Name == SelectedCategory).ToList();

        OnPropertyChanged(nameof(VisibleGroups));
    }
}
