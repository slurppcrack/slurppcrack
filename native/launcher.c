// SLURP.exe — tiny portable launcher.
// Extracts the HTML app appended to this executable and opens it in the default browser.
// No installer, no admin rights, nothing written outside %TEMP%.
#include <windows.h>
#include <shlobj.h>

#define MAGIC "SLURPEXE"
#define FOOTER (8 + 8 + 8) /* magic + payload size + reserved */

static void fail(const wchar_t *msg) {
    MessageBoxW(NULL, msg, L"SLURP", MB_ICONERROR | MB_OK);
}

/* Fallback: run an HTML file that sits next to the executable. */
static int run_sibling(void) {
    wchar_t self[MAX_PATH];
    DWORD n = GetModuleFileNameW(NULL, self, MAX_PATH);
    if (n == 0 || n >= MAX_PATH) return 0;
    wchar_t *slash = wcsrchr(self, L'\\');
    if (!slash) return 0;
    wcscpy(slash + 1, L"SLURP.html");
    if (GetFileAttributesW(self) == INVALID_FILE_ATTRIBUTES) return 0;
    return (INT_PTR)ShellExecuteW(NULL, L"open", self, NULL, NULL, SW_SHOWNORMAL) > 32;
}

static int extract_and_run(void) {
    wchar_t self[MAX_PATH];
    DWORD n = GetModuleFileNameW(NULL, self, MAX_PATH);
    if (n == 0 || n >= MAX_PATH) return 0;

    HANDLE h = CreateFileW(self, GENERIC_READ, FILE_SHARE_READ, NULL, OPEN_EXISTING, 0, NULL);
    if (h == INVALID_HANDLE_VALUE) return 0;

    LARGE_INTEGER size;
    if (!GetFileSizeEx(h, &size) || size.QuadPart < FOOTER + 64) {
        CloseHandle(h);
        return 0;
    }

    BYTE footer[FOOTER];
    LARGE_INTEGER at;
    DWORD got = 0;
    at.QuadPart = size.QuadPart - FOOTER;
    if (!SetFilePointerEx(h, at, NULL, FILE_BEGIN) || !ReadFile(h, footer, FOOTER, &got, NULL) || got != FOOTER) {
        CloseHandle(h);
        return 0;
    }
    if (memcmp(footer, MAGIC, 8) != 0) {
        CloseHandle(h);
        return 0;
    }

    unsigned long long payload = 0;
    memcpy(&payload, footer + 8, 8);
    if (payload < 32 || payload > (unsigned long long)size.QuadPart - FOOTER) {
        CloseHandle(h);
        return 0;
    }

    BYTE *buf = (BYTE *)HeapAlloc(GetProcessHeap(), 0, (SIZE_T)payload);
    if (!buf) {
        CloseHandle(h);
        return 0;
    }
    DWORD read = 0;
    at.QuadPart = size.QuadPart - FOOTER - (LONGLONG)payload;
    BOOL ok = SetFilePointerEx(h, at, NULL, FILE_BEGIN) &&
              ReadFile(h, buf, (DWORD)payload, &read, NULL) &&
              read == (DWORD)payload;
    CloseHandle(h);
    if (!ok) {
        HeapFree(GetProcessHeap(), 0, buf);
        return 0;
    }

    wchar_t tmp[MAX_PATH];
    DWORD tn = GetTempPathW(MAX_PATH, tmp);
    if (tn == 0 || tn >= MAX_PATH) {
        HeapFree(GetProcessHeap(), 0, buf);
        return 0;
    }
    wchar_t path[MAX_PATH];
    wsprintfW(path, L"%sSLURP-%lu.html", tmp, (unsigned long)GetTickCount());

    HANDLE out = CreateFileW(path, GENERIC_WRITE, 0, NULL, CREATE_ALWAYS, FILE_ATTRIBUTE_NORMAL, NULL);
    if (out == INVALID_HANDLE_VALUE) {
        HeapFree(GetProcessHeap(), 0, buf);
        return 0;
    }
    DWORD written = 0;
    BOOL wok = WriteFile(out, buf, (DWORD)payload, &written, NULL) && written == (DWORD)payload;
    CloseHandle(out);
    HeapFree(GetProcessHeap(), 0, buf);
    if (!wok) return 0;

    return (INT_PTR)ShellExecuteW(NULL, L"open", path, NULL, NULL, SW_SHOWNORMAL) > 32;
}

int WINAPI WinMain(HINSTANCE inst, HINSTANCE prev, LPSTR cmd, int show) {
    (void)inst;
    (void)prev;
    (void)cmd;
    (void)show;
    if (extract_and_run()) return 0;
    if (run_sibling()) return 0;
    fail(L"Could not start SLURP.\n\n"
         L"Put SLURP.exe and SLURP.html in the same folder and run the .exe again,\n"
         L"or just double-click SLURP.html in any browser.");
    return 1;
}
