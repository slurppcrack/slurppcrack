using SlurpPcBoost.Models;

namespace SlurpPcBoost.Services;

/// <summary>Источник данных приложения (твики, игровые профили).</summary>
public sealed class CatalogService
{
    public IReadOnlyList<CategoryInfo> Categories => TweakCatalog.Categories;

    public IReadOnlyList<Tweak> Tweaks { get; private set; } = Array.Empty<Tweak>();

    public IReadOnlyList<GameProfile> Games { get; private set; } = Array.Empty<GameProfile>();

    public void Load()
    {
        Tweaks = TweakCatalog.CreateDefaultTweaks();
        Games = CreateGames();
    }

    private static List<GameProfile> CreateGames() => new()
    {
        new GameProfile("Counter-Strike 2", "Шутер • Valve", "CS", "#F5A623", "#C2410C"),
        new GameProfile("GTA V", "Экшен • Rockstar", "GTA", "#4ADE80", "#166534"),
        new GameProfile("Valorant", "Шутер • Riot Games", "VL", "#FB7185", "#9F1239"),
        new GameProfile("Fortnite", "Battle Royale • Epic", "FN", "#818CF8", "#3730A3"),
        new GameProfile("Dota 2", "MOBA • Valve", "D2", "#F87171", "#7F1D1D"),
        new GameProfile("PUBG: Battlegrounds", "Battle Royale • Krafton", "PU", "#FACC15", "#B45309"),
        new GameProfile("Apex Legends", "Шутер • Respawn", "AP", "#F472B6", "#9D174D"),
        new GameProfile("Minecraft", "Песочница • Mojang", "MC", "#34D399", "#065F46"),
        new GameProfile("War Thunder", "MMO • Gaijin", "WT", "#60A5FA", "#1E40AF"),
        new GameProfile("Escape from Tarkov", "Шутер • Battlestate", "TKF", "#A78BFA", "#4C1D95"),
        new GameProfile("Rust", "Выживание • Facepunch", "RU", "#FB923C", "#7C2D12"),
        new GameProfile("Genshin Impact", "RPG • HoYoverse", "GI", "#38BDF8", "#0E7490"),
    };
}
