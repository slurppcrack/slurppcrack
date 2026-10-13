namespace SlurpPcBoost.Services;

public interface IDialogService
{
    bool Confirm(string title, string message);

    void Info(string title, string message);
}
