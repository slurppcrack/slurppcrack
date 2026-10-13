using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Windows;
using System.Windows.Media.Imaging;

using Path = System.IO.Path;

namespace SlurpPcBoost.Services;

/// <summary>Сведения о железе, ОС и состоянии системы, отображаемые в приложении.</summary>
public sealed class SystemInfo
{
    public string CpuName { get; init; } = "Неизвестный процессор";

    public int Threads { get; init; }

    public string GpuName { get; init; } = "Неизвестная видеокарта";

    public string RamText { get; init; } = "—";

    public string OsName { get; init; } = "Windows";

    public string OsArch { get; init; } = "";

    public string MachineName { get; init; } = "PC";

    public string UserName { get; init; } = "user";

    public string UptimeText { get; init; } = "—";

    public string SystemDrive { get; init; } = "C:\\";

    public string DriveFreeText { get; init; } = "—";

    public bool IsElevated { get; init; }

    public string DeviceSummary { get; init; } = "Windows PC";

    public string AppVersionText { get; init; } = "v1.0.0";
}

public static class SystemInfoService
{
    private const string GpuClassGuid = "{4d36e968-e325-11ce-bfc1-08002be10318}";

    public static SystemInfo Load()
    {
        var version = typeof(SystemInfoService).Assembly.GetName().Version ?? new Version(1, 0, 0);
        var cpu = ReadCpuName();
        var ramGb = GetTotalRamGb();

        return new SystemInfo
        {
            CpuName = cpu,
            Threads = Environment.ProcessorCount,
            GpuName = ReadGpuName(),
            RamText = ramGb > 0 ? $"{ramGb:0.#} ГБ" : "—",
            OsName = ReadOsName(),
            OsArch = RuntimeInformation.OSArchitecture.ToString().Replace("X64", "x64").Replace("Arm64", "ARM64"),
            MachineName = Environment.MachineName,
            UserName = Environment.UserName,
            UptimeText = ReadUptime(),
            SystemDrive = Path.GetPathRoot(Environment.SystemDirectory) ?? "C:\\",
            DriveFreeText = ReadDriveFree(),
            IsElevated = IsElevated(),
            DeviceSummary = ramGb > 0 ? $"{cpu} • {ramGb:0.#} ГБ ОЗУ" : cpu,
            AppVersionText = $"v{version.Major}.{version.Minor}.{version.Build}",
        };
    }

    private static string ReadCpuName()
    {
        try
        {
            if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
            {
                using var key = Microsoft.Win32.Registry.LocalMachine.OpenSubKey(
                    @"HARDWARE\DESCRIPTION\System\CentralProcessor\0");
                if (key?.GetValue("ProcessorNameString") is string friendly && !string.IsNullOrWhiteSpace(friendly))
                {
                    return friendly.Trim();
                }
            }
        }
        catch (Exception ex)
        {
            Debug.WriteLine(ex);
        }

        var identifier = Environment.GetEnvironmentVariable("PROCESSOR_IDENTIFIER");
        return string.IsNullOrWhiteSpace(identifier) ? "Неизвестный процессор" : identifier!;
    }

    /// <summary>Читает название видеоадаптера из реестра (класс Display) — без WMI и лишних пакетов.</summary>
    private static string ReadGpuName()
    {
        if (!RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
        {
            return "Неизвестная видеокарта";
        }

        try
        {
            using var classKey = Microsoft.Win32.Registry.LocalMachine.OpenSubKey(
                $@"SYSTEM\CurrentControlSet\Control\Class\{GpuClassGuid}");

            if (classKey is not null)
            {
                foreach (var subName in classKey.GetSubKeyNames())
                {
                    using var adapter = classKey.OpenSubKey(subName);
                    if (adapter?.GetValue("DriverDesc") is string name && !string.IsNullOrWhiteSpace(name))
                    {
                        return name.Trim();
                    }
                }
            }
        }
        catch (Exception ex)
        {
            Debug.WriteLine(ex);
        }

        return "Видеокарта не определена";
    }

    private static double GetTotalRamGb()
    {
        try
        {
            var status = new MemoryStatusEx();
            if (GlobalMemoryStatusEx(status) && status.ullTotalPhys > 0)
            {
                return status.ullTotalPhys / 1024.0 / 1024 / 1024;
            }
        }
        catch (Exception ex)
        {
            Debug.WriteLine(ex);
        }

        return 0;
    }

    private static string ReadOsName()
    {
        if (!RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
        {
            return RuntimeInformation.OSDescription;
        }

        try
        {
            using var key = Microsoft.Win32.Registry.LocalMachine.OpenSubKey(
                @"SOFTWARE\Microsoft\Windows NT\CurrentVersion");

            var product = key?.GetValue("ProductName") as string ?? "Windows";
            var display = key?.GetValue("DisplayVersion") as string;
            var build = key?.GetValue("CurrentBuildNumber") as string;

            // Windows 11 до сих пор отдаёт ProductName = "Windows 10" — правим по номеру сборки.
            if (product.Contains("Windows 10", StringComparison.OrdinalIgnoreCase)
                && int.TryParse(build, out var buildNumber)
                && buildNumber >= 22000)
            {
                product = product.Replace("Windows 10", "Windows 11");
            }

            return string.IsNullOrEmpty(display) ? product : $"{product} {display}";
        }
        catch (Exception ex)
        {
            Debug.WriteLine(ex);
            return RuntimeInformation.OSDescription;
        }
    }

    private static string ReadUptime()
    {
        var uptime = TimeSpan.FromMilliseconds(Environment.TickCount64);
        return uptime.TotalDays >= 1
            ? $"{(int)uptime.TotalDays} д {uptime.Hours} ч"
            : $"{uptime.Hours} ч {uptime.Minutes} мин";
    }

    private static string ReadDriveFree()
    {
        try
        {
            var root = Path.GetPathRoot(Environment.SystemDirectory);
            if (string.IsNullOrEmpty(root))
            {
                return "—";
            }

            var drive = new DriveInfo(root);
            return $"{drive.AvailableFreeSpace / 1024.0 / 1024 / 1024:0.#} ГБ свободно";
        }
        catch (Exception ex)
        {
            Debug.WriteLine(ex);
            return "—";
        }
    }

    private static bool IsElevated()
    {
        try
        {
            using var identity = System.Security.Principal.WindowsIdentity.GetCurrent();
            var principal = new System.Security.Principal.WindowsPrincipal(identity);
            return principal.IsInRole(System.Security.Principal.WindowsBuiltInRole.Administrator);
        }
        catch (Exception ex)
        {
            Debug.WriteLine(ex);
            return false;
        }
    }

    /// <summary>Иконка окна, нарисованная кодом (не зависит от шрифтов и внешних файлов).</summary>
    public static BitmapSource? CreateAppIcon()
    {
        try
        {
            var visual = new System.Windows.Media.DrawingVisual();
            using (var dc = visual.RenderOpen())
            {
                var bg = new System.Windows.Media.LinearGradientBrush(
                    (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#FF7A18")!,
                    (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#FF3D6E")!,
                    new Point(0, 0),
                    new Point(1, 1));
                dc.DrawRoundedRectangle(bg, null, new Rect(0, 0, 64, 64), 16, 16);

                var bolt = System.Windows.Media.Geometry.Parse("M37,8 L20,36 L30,36 L26,56 L45,26 L34,26 Z");
                bolt.Freeze();
                dc.DrawGeometry(System.Windows.Media.Brushes.White, null, bolt);
            }

            var bitmap = new RenderTargetBitmap(64, 64, 96, 96, System.Windows.Media.PixelFormats.Pbgra32);
            bitmap.Render(visual);
            bitmap.Freeze();
            return bitmap;
        }
        catch (Exception ex)
        {
            Debug.WriteLine(ex);
            return null;
        }
    }

    [StructLayout(LayoutKind.Sequential)]
    private sealed class MemoryStatusEx
    {
        public uint dwLength = (uint)Marshal.SizeOf(typeof(MemoryStatusEx));

        public uint dwMemoryLoad;

        public ulong ullTotalPhys;

        public ulong ullAvailPhys;

        public ulong ullTotalPageFile;

        public ulong ullAvailPageFile;

        public ulong ullTotalVirtual;

        public ulong ullAvailVirtual;

        public ulong ullAvailExtendedVirtual;
    }

    [DllImport("kernel32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool GlobalMemoryStatusEx([In, Out] MemoryStatusEx lpBuffer);
}
