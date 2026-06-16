const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'app', 'admin', 'pos', 'pos-client.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// The file is currently broken right after:
//             mobileProvider: mixedBreakdown.mobileProvider,
//   }, [cart, subtotal, discountAmount, taxAmount, grandTotal, change, clearCart, router, selectedDate]);

const searchStr = `            mobileProvider: mixedBreakdown.mobileProvider,
  }, [cart, subtotal, discountAmount, taxAmount, grandTotal, change, clearCart, router, selectedDate]);`;

const replacementStr = `            mobileProvider: mixedBreakdown.mobileProvider,
            mobileCashOutCharge: mixedBreakdown.mobileCashOutCharge,
            cardTrxId: mixedBreakdown.cardTrxId,
            cardLast4: mixedBreakdown.cardLast4,
          }),
        });

        setShowReceipt(true);
        clearCart();
        setIsProcessing(false);
        toast.success(\`Sale completed: \${result.orderNumber}\`);

        // Fetch stats in background so UI doesn't block for 2-3 seconds
        Promise.all([
          getDailySalesSummary(selectedDate),
          getPOSSalesDates(),
        ]).then(([summary, dates]) => {
          setDailySummary(summary);
          setSalesDates(dates);
          // Refresh server data to get updated stock
          router.refresh();
        }).catch(console.error);

      } else {
        toast.error(result.error || 'Failed to complete sale');
        setIsProcessing(false);
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred');
      setIsProcessing(false);
    }
  }, [cart, subtotal, discountAmount, taxAmount, grandTotal, change, clearCart, router, selectedDate]);`;

if (content.includes(searchStr)) {
    content = content.replace(searchStr, replacementStr);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed pos-client.tsx');
} else {
    console.log('Search string not found!');
}
