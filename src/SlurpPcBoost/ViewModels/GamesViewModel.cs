using System.Collections.ObjectModel;
using System.Windows.Input;
using SlurpPcBoost.Models;
using SlurpPcBoost.Mvvm;
using SlurpPcBoost.Services;

namespace SlurpPcBoost.ViewModels;

/// <summary>Страница «Игры» — игровые профили и поиск.</summary>
public sealed class GamesViewModel : ViewModelBase
{
    private string _searchText = string.Empty;
    private string _selectedFilter = "Все";
    private List<GameProfile> _visibleGames;

    public GamesViewModel(AppState state) : base(state)
    {
        Filters = new ObservableCollection<string>
        {
            "Все", "Шутер", "Battle Royale", "MOBA", "RPG", "Выживание", "Песочница", "Экшен", "MMO",
        };

        _visibleGames = State.Games.ToList();

        OptimizeGameCommand = new AsyncRelayCommand(
            parameter =>
            {
                if (parameter is GameProfile game)
                {
                    return State.OptimizeGameAsync(game);
                }

                return Task.CompletedTask;
            },
            parameter => !State.IsBusy && parameter is GameProfile { IsBusy: false });

        ClearSearchCommand = new RelayCommand(() => SearchText = string.Empty);
        SelectFilterCommand = new RelayCommand(parameter =>
        {
            if (parameter is string filter)
            {
                SelectedFilter = filter;
            }
        });
    }

    public ObservableCollection<string> Filters { get; }

    public string SearchText
    {
        get => _searchText;
        set
        {
            if (SetProperty(ref _searchText, value))
            {
                ApplyFilter();
            }
        }
    }

    public string SelectedFilter
    {
        get => _selectedFilter;
        set
        {
            if (SetProperty(ref _selectedFilter, value))
            {
                ApplyFilter();
            }
        }
    }

    public IReadOnlyList<GameProfile> VisibleGames => _visibleGames;

    public string CountText => $"{_visibleGames.Count} игр в списке";

    public ICommand OptimizeGameCommand { get; }

    public ICommand ClearSearchCommand { get; }

    public ICommand SelectFilterCommand { get; }

    private void ApplyFilter()
    {
        _visibleGames = State.Games
            .Where(g => g.Matches(SearchText))
            .Where(g => SelectedFilter == "Все"
                        || g.Category.Contains(SelectedFilter, StringComparison.OrdinalIgnoreCase))
            .ToList();

        OnPropertyChanged(nameof(VisibleGames));
        OnPropertyChanged(nameof(CountText));
    }
}
