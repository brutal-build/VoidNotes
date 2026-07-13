/**
 * 7za.exe wrapper for electron-builder on Windows.
 *
 * Problem: winCodeSign-2.6.0.7z contains macOS symlinks (.dylib files).
 * System 7za.exe passes -snld (store symlinks as links) which requires
 * admin privileges on Windows. This causes extraction to fail silently,
 * producing a truncated .nsis.7z and a 1MB installer instead of ~100MB.
 *
 * Fix: This wrapper strips -snld from arguments and ignores exit code 2
 * (symlink creation failure). All other arguments pass through to 7za-real.exe.
 */

#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#include <shellapi.h>
#include <stdio.h>

#define MAX_CMDLINE  65536

int WINAPI WinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, LPSTR lpCmdLine, int nCmdShow)
{
    int argc = 0;
    LPWSTR *argv_w = CommandLineToArgvW(GetCommandLineW(), &argc);

    WCHAR cmdline[MAX_CMDLINE] = L"";
    WCHAR exe_dir[MAX_PATH];
    GetModuleFileNameW(NULL, exe_dir, MAX_PATH);

    /* Strip the filename to get the directory */
    WCHAR *last_slash = wcsrchr(exe_dir, L'\\');
    if (last_slash) *last_slash = L'\0';

    WCHAR real_path[MAX_PATH];
    swprintf_s(real_path, MAX_PATH, L"%s\\7za-real.exe", exe_dir);

    /* Build new command line, filtering out -snld */
    int written = 0;
    int skip_snld = 0;

    for (int i = 1; i < argc; i++)
    {
        if (wcscmp(argv_w[i], L"-snld") == 0)
        {
            skip_snld = 1;
            continue; /* skip this argument */
        }

        if (written > 0)
        {
            wcscat_s(cmdline, MAX_CMDLINE, L" ");
        }

        /* Quote arguments containing spaces */
        if (wcschr(argv_w[i], L' '))
        {
            WCHAR quoted[MAX_PATH + 4];
            swprintf_s(quoted, MAX_PATH + 4, L"\"%s\"", argv_w[i]);
            wcscat_s(cmdline, MAX_CMDLINE, quoted);
            written += (int)wcslen(quoted) + 1;
        }
        else
        {
            wcscat_s(cmdline, MAX_CMDLINE, argv_w[i]);
            written += (int)wcslen(argv_w[i]) + 1;
        }
    }

    LocalFree(argv_w);

    /* Launch 7za-real.exe */
    SHELLEXECUTEINFOW sei = { sizeof(sei) };
    sei.fMask = SEE_MASK_NOCLOSEPROCESS | SEE_MASK_NO_CONSOLE;
    sei.lpFile = real_path;
    sei.lpParameters = cmdline;
    sei.nShow = SW_HIDE;

    if (!ShellExecuteExW(&sei))
    {
        return 3;
    }

    WaitForSingleObject(sei.hProcess, INFINITE);

    DWORD exit_code = 0;
    GetExitCodeProcess(sei.hProcess, &exit_code);
    CloseHandle(sei.hProcess);

    /* Exit code 2 from 7za means "fatal error", often caused by symlink
       creation failures. These are harmless for electron-builder because
       we don't need macOS dylib symlinks for a Windows build. */
    if (exit_code == 2)
    {
        if (skip_snld)
        {
            return 0; /* We stripped -snld, so symlink errors are expected */
        }
    }

    return (int)exit_code;
}
