using System.IO;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace Slurp;

/// <summary>
/// Stores settings in %APPDATA%\SLURP\settings.json.
/// API keys are encrypted with DPAPI (current Windows user) so they are not readable
/// by other accounts and never travel with the file.
/// </summary>
public static class SettingsStore
{
    private static readonly string Dir =
        Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "SLURP");

    private static readonly string FilePath = Path.Combine(Dir, "settings.json");

    public static AppSettings Load()
    {
        try
        {
            if (!File.Exists(FilePath)) return new AppSettings();
            var json = File.ReadAllText(FilePath, Encoding.UTF8);
            var s = JsonSerializer.Deserialize<AppSettings>(json) ?? new AppSettings();
            s.Keys = DecryptKeys(s.Keys);
            return s;
        }
        catch
        {
            return new AppSettings();
        }
    }

    public static void Save(AppSettings settings)
    {
        try
        {
            Directory.CreateDirectory(Dir);
            var clone = new AppSettings
            {
                ModelId = settings.ModelId,
                Persona = settings.Persona,
                Autonomy = settings.Autonomy,
                Temperature = settings.Temperature,
                MaxSteps = settings.MaxSteps,
                CustomRules = settings.CustomRules,
                SaveKeys = settings.SaveKeys,
                LastWorkspace = settings.LastWorkspace,
                Onboarded = settings.Onboarded,
                BaseUrls = new Dictionary<string, string>(settings.BaseUrls),
                Keys = settings.SaveKeys ? EncryptKeys(settings.Keys) : new Dictionary<string, string>()
            };
            var json = JsonSerializer.Serialize(clone, new JsonSerializerOptions { WriteIndented = true });
            File.WriteAllText(FilePath, json, Encoding.UTF8);
        }
        catch
        {
            // settings are a convenience; never crash the app over them
        }
    }

    private static Dictionary<string, string> EncryptKeys(Dictionary<string, string> keys)
    {
        var result = new Dictionary<string, string>();
        foreach (var (k, v) in keys)
        {
            if (string.IsNullOrEmpty(v)) continue;
            try
            {
                var bytes = ProtectedData.Protect(Encoding.UTF8.GetBytes(v), null, DataProtectionScope.CurrentUser);
                result[k] = "dpapi:" + Convert.ToBase64String(bytes);
            }
            catch
            {
                // DPAPI unavailable (e.g. weird profile) — skip rather than store plaintext
            }
        }
        return result;
    }

    private static Dictionary<string, string> DecryptKeys(Dictionary<string, string> keys)
    {
        var result = new Dictionary<string, string>();
        foreach (var (k, v) in keys)
        {
            if (string.IsNullOrEmpty(v)) continue;
            if (!v.StartsWith("dpapi:"))
            {
                result[k] = v; // legacy/plain (only if the user opted out of saving)
                continue;
            }
            try
            {
                var raw = Convert.FromBase64String(v.Substring(6));
                var plain = ProtectedData.Unprotect(raw, null, DataProtectionScope.CurrentUser);
                result[k] = Encoding.UTF8.GetString(plain);
            }
            catch
            {
                // cannot decrypt (different user / machine) — drop it, the user re-enters the key
            }
        }
        return result;
    }
}
