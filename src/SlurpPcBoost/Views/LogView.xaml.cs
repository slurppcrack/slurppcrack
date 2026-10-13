using System.Collections.Specialized;
using System.Windows.Controls;

namespace SlurpPcBoost.Views;

public partial class LogView : UserControl
{
    public LogView()
    {
        InitializeComponent();

        // Автопрокрутка журнала к последней записи.
        DataContextChanged += (_, _) =>
        {
            if (DataContext is ViewModels.LogViewModel vm)
            {
                ((INotifyCollectionChanged)vm.Entries).CollectionChanged += (_, _) => LogScroll.ScrollToEnd();
            }
        };
    }
}
